import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import UserAdminPanel from "./UserAdminPanel";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";

function fmtMonthYear(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

function roleBadge(role: string) {
  const map: Record<string, { label: string; cls: string }> = {
    SUPERADMIN: { label: "Super Admin", cls: "badge-superadmin border" },
    ADMIN:      { label: "admin",       cls: "text-amber-400 border-amber-800 bg-amber-950/40" },
    MOD:        { label: "mod",         cls: "text-blue-400 border-blue-800 bg-blue-950/40" },
    USER:       { label: "",            cls: "" },
  };
  return map[role] ?? map.USER;
}

async function getCurrentUser(): Promise<{ id: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 0) return notFound();

  const sessionUser = await getCurrentUser();
  const sessionUserId = sessionUser?.id ?? null;
  const viewerRole = sessionUser?.role ?? "USER";
  const viewerIsMod = ["SUPERADMIN", "ADMIN", "MOD"].includes(viewerRole);

  const user = await prisma.user.findUnique({
    where: { numericId },
    select: {
      id: true,
      numericId: true,
      username: true,
      role: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      createdAt: true,
      bannedAt: true,
      banExpiresAt: true,
      banReason: true,
      uploads: {
        select: {
          id: true,
          numericId: true,
          country: true,
          plateText: true,
          imageUrl: true,
          brand: true,
          model: true,
          createdAt: true,
          _count: { select: { likes: true } },
        },
        where: { deletedAt: null, ...(viewerIsMod ? {} : { hidden: false }) },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      _count: {
        select: {
          uploads: { where: { deletedAt: null, ...(viewerIsMod ? {} : { hidden: false }) } },
        },
      },
    },
  });

  if (!user) return notFound();

  const likesAgg = await prisma.like.aggregate({
    where: { upload: { user: { numericId }, deletedAt: null } },
    _count: { _all: true },
  });

  const isOwnProfile = sessionUserId === user.id;
  const isAdmin = viewerRole === "SUPERADMIN" || viewerRole === "ADMIN";
  const canAdminTarget = isAdmin && !isOwnProfile && user.role !== "SUPERADMIN";

  // Ban is active if bannedAt is set AND (no expiry OR expiry is in the future)
  const isBanned = !!user.bannedAt && (!user.banExpiresAt || user.banExpiresAt > new Date());

  const initials = user.username.slice(0, 2).toUpperCase();
  const memberSince = fmtMonthYear(user.createdAt);
  const badge = roleBadge(user.role);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        {/* Banner */}
        {user.bannerUrl ? (
          <div className="h-36 sm:h-44 overflow-hidden">
            <img src={user.bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-indigo-900/40 via-zinc-900 to-zinc-900" />
        )}

        <div className="px-6 pb-8 pt-0 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar — only the avatar overlaps the banner */}
              <div className="relative shrink-0 -mt-12">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-24 w-24 rounded-3xl object-cover ring-4 ring-zinc-950"
                  />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900 ring-4 ring-zinc-950">
                    <span className="text-2xl font-bold text-zinc-100">{initials}</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-zinc-950 ring-2 ring-zinc-700">
                  <span className="text-xs font-mono text-zinc-400">#{user.numericId}</span>
                </div>
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-2xl font-semibold text-zinc-50 sm:text-3xl">@{user.username}</div>
                  {badge.label && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-zinc-400">#{user.numericId} · Spotting since {memberSince}</div>
              </div>
            </div>

            {/* Edit profile button — only shown to the profile owner */}
            {isOwnProfile && (
              <a
                href="/settings/profile"
                className="shrink-0 self-end rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Edit profile
              </a>
            )}
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300">{user.bio}</p>
          ) : isOwnProfile ? (
            <a
              href="/settings/profile"
              className="mt-5 block max-w-2xl rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/20 px-4 py-3 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
            >
              + Add a bio
            </a>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">No bio yet.</p>
          )}

          {/* Ban notice — shown to the banned user themselves */}
          {isOwnProfile && isBanned && (
            <div className="mt-5 rounded-2xl border border-red-800 bg-red-950/30 px-5 py-4 max-w-2xl">
              <p className="text-sm font-semibold text-red-300">
                🚫 Your account is {user.banExpiresAt ? `temporarily restricted until ${new Date(user.banExpiresAt).toLocaleDateString("en-GB")}` : "permanently restricted"}.
              </p>
              {user.banReason && <p className="mt-1 text-xs text-red-400">Reason: {user.banReason}</p>}
            </div>
          )}

          {/* Mod-visible ban notice on other users' profiles */}
          {!isOwnProfile && isAdmin && isBanned && (
            <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2 max-w-2xl">
              <p className="text-xs text-red-400">
                🚫 Banned{user.banExpiresAt ? ` until ${new Date(user.banExpiresAt).toLocaleDateString("en-GB")}` : " permanently"}
                {user.banReason ? ` — ${user.banReason}` : ""}
              </p>
            </div>
          )}

          {/* Admin panel for this user */}
          {canAdminTarget && (
            <UserAdminPanel
              targetId={user.id}
              targetUsername={user.username}
              targetRole={user.role}
              isBanned={isBanned}
              banExpiresAt={user.banExpiresAt?.toISOString() ?? null}
              actorRole={viewerRole}
            />
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <a href="#spots" className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-5 hover:border-zinc-600 transition-colors group">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Uploads</div>
          <div className="mt-1.5 text-3xl font-semibold text-zinc-50">{user._count.uploads}</div>
          <div className="mt-1 text-xs text-zinc-500 group-hover:text-zinc-400">View all spots ↓</div>
        </a>
        {[
          { label: "Likes received", value: likesAgg._count._all, hint: "from the community" },
          { label: "Member since", value: memberSince, hint: `Joined ${relativeDays(user.createdAt)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-5 hover:border-zinc-700 transition-colors">
            <div className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</div>
            <div className="mt-1.5 text-3xl font-semibold text-zinc-50">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.hint}</div>
          </div>
        ))}
      </section>

      <section id="spots" className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">Spots</h2>
          <span className="text-xs text-zinc-500">{user._count.uploads} total</span>
        </div>
        {user.uploads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <div className="mt-4 text-sm font-medium text-zinc-200">No spots yet</div>
            <p className="mt-1 text-xs text-zinc-500">When @{user.username} uploads their first plate, it will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.uploads.map((u) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100">{u.plateText}</span>
                      <span><Flag iso={meta.iso} /></span>
                    </div>
                    {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>{relativeDays(u.createdAt)}</span>
                      <span>♡ {u._count.likes}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
