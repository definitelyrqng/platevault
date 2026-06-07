import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  albania: { flag: "🇦🇱", name: "Albania" },
  germany: { flag: "🇩🇪", name: "Germany" },
};

function countryMeta(country: string) {
  const key = country.toLowerCase();
  return COUNTRY_META[key] ?? { flag: "🏳️", name: country.charAt(0).toUpperCase() + country.slice(1) };
}

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

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user.id;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 0) return notFound();

  const [sessionUserId] = await Promise.all([getCurrentUserId()]);

  const user = await prisma.user.findUnique({
    where: { numericId },
    select: {
      id: true,
      numericId: true,
      username: true,
      role: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
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
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      _count: { select: { uploads: true } },
    },
  });

  if (!user) return notFound();

  // bannerUrl lives in a later migration — fetch it safely so old deploys don't 500
  let bannerUrl: string | null = null;
  try {
    const rows = await prisma.$queryRaw<{ bannerUrl: string | null }[]>`
      SELECT "bannerUrl" FROM "User" WHERE id = ${user.id} LIMIT 1
    `;
    bannerUrl = rows[0]?.bannerUrl ?? null;
  } catch { /* column not yet created */ }

  const likesAgg = await prisma.like.aggregate({
    where: { upload: { user: { numericId }, deletedAt: null } },
    _count: { _all: true },
  });

  const isOwnProfile = sessionUserId === user.id;
  const initials = user.username.slice(0, 2).toUpperCase();
  const memberSince = fmtMonthYear(user.createdAt);
  const badge = roleBadge(user.role);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        {/* Banner */}
        {bannerUrl ? (
          <div className="h-36 sm:h-44 overflow-hidden">
            <img src={bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-indigo-900/40 via-zinc-900 to-zinc-900" />
        )}

        <div className="px-6 pb-8 pt-0 sm:px-8">
          <div className="-mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
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
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Uploads", value: user._count.uploads, hint: "spots archived" },
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

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">Recent spots</h2>
          <span className="text-xs text-zinc-500">Latest {user.uploads.length}</span>
        </div>
        {user.uploads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <div className="mt-4 text-sm font-medium text-zinc-200">No spots yet</div>
            <p className="mt-1 text-xs text-zinc-500">When @{user.username} uploads their first plate, it will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.uploads.map((u) => {
              const meta = countryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100">{u.plateText}</span>
                      <span>{meta.flag}</span>
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
