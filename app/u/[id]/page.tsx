import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import UserAdminPanel from "./UserAdminPanel";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import FollowButton from "@/app/components/FollowButton";


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

const PER_PAGE = 12;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return {};
  const user = await prisma.user.findUnique({
    where: { numericId },
    select: { username: true, bio: true, avatarUrl: true, _count: { select: { uploads: true } } },
  });
  if (!user) return {};
  const title = `@${user.username} on PlateVault`;
  const desc = user.bio ?? `${user.username} has spotted ${user._count.uploads} plate${user._count.uploads !== 1 ? "s" : ""} on PlateVault.`;
  return {
    title: `@${user.username}`,
    description: desc,
    openGraph: { title, description: desc, images: user.avatarUrl ? [{ url: user.avatarUrl }] : [] },
    twitter: { card: "summary", title, description: desc, images: user.avatarUrl ? [user.avatarUrl] : [] },
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
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
      currentStreak: true,
      longestStreak: true,
      pinnedSpotIds: true,
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
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      },
      _count: {
        select: {
          uploads: { where: { deletedAt: null, ...(viewerIsMod ? {} : { hidden: false }) } },
        },
      },
    },
  });

  if (!user) return notFound();

  const totalPages = Math.ceil(user._count.uploads / PER_PAGE);

  // Fetch pinned spots (ordered by pinnedSpotIds order)
  const pinnedSpots = user.pinnedSpotIds.length > 0
    ? await prisma.upload.findMany({
        where: { id: { in: user.pinnedSpotIds }, deletedAt: null, ...(viewerIsMod ? {} : { hidden: false }) },
        select: { id: true, numericId: true, plateText: true, imageUrl: true, country: true, brand: true, model: true, _count: { select: { likes: true } } },
      })
    : [];
  // Re-order to match pinnedSpotIds order
  const pinnedOrdered = user.pinnedSpotIds.map(id => pinnedSpots.find(s => s.id === id)).filter(Boolean) as typeof pinnedSpots;

  const [likesAgg, allUploadsForStats, pollVoteCount] = await Promise.all([
    prisma.like.aggregate({
      where: { upload: { user: { numericId }, deletedAt: null } },
      _count: { _all: true },
    }),
    // For achievements + country completion, fetch lightweight data for ALL uploads
    prisma.upload.findMany({
      where: { userId: user.id, deletedAt: null, hidden: false },
      select: { country: true, createdAt: true },
    }),
    prisma.pollVote.count({ where: { userId: user.id } }),
  ]);

  // ─── Achievements (computed, no extra tables) ──────────────────────────────
  const totalSpots = allUploadsForStats.length;
  const countriesSpotted = new Set(allUploadsForStats.map((u) => u.country)).size;

  type Achievement = { icon: string; label: string; desc: string; earned: boolean };
  const ACHIEVEMENTS: Achievement[] = [
    { icon: "📷", label: "First Spot",      desc: "Upload your first plate",        earned: totalSpots >= 1 },
    { icon: "🔟", label: "Ten Spots",        desc: "Upload 10 plates",               earned: totalSpots >= 10 },
    { icon: "💯", label: "Century",          desc: "Upload 100 plates",              earned: totalSpots >= 100 },
    { icon: "5️⃣0️⃣0️⃣", label: "Half Thousand", desc: "Upload 500 plates",           earned: totalSpots >= 500 },
    { icon: "🌍", label: "Globe Trotter",   desc: "Spot plates from 3 countries",   earned: countriesSpotted >= 3 },
    { icon: "🗺️", label: "World Explorer",  desc: "Spot plates from 10 countries",  earned: countriesSpotted >= 10 },
    { icon: "🗳️", label: "Voter",           desc: "Cast your first poll vote",      earned: pollVoteCount >= 1 },
    { icon: "❤️", label: "Crowd Pleaser",   desc: "Receive 50 likes",               earned: likesAgg._count._all >= 50 },
    { icon: "🏆", label: "Fan Favourite",   desc: "Receive 500 likes",              earned: likesAgg._count._all >= 500 },
  ];

  // ─── Country completion ────────────────────────────────────────────────────
  // Total countries that have at least one spot in the archive
  const archiveCountries = await prisma.upload.groupBy({
    by: ["country"],
    where: { deletedAt: null, hidden: false },
  });
  const totalArchiveCountries = archiveCountries.length;
  const completionPct = totalArchiveCountries > 0
    ? Math.round((countriesSpotted / totalArchiveCountries) * 100)
    : 0;

  const isOwnProfile = sessionUserId === user.id;
  const isAdmin = viewerRole === "SUPERADMIN" || viewerRole === "ADMIN";
  const canAdminTarget = isAdmin && !isOwnProfile && user.role !== "SUPERADMIN";

  // Ban is active if bannedAt is set AND (no expiry OR expiry is in the future)
  const isBanned = !!user.bannedAt && (!user.banExpiresAt || user.banExpiresAt > new Date());

  const initials = user.username.slice(0, 2).toUpperCase();
  const memberSince = fmtMonthYear(user.createdAt);
  const badge = roleBadge(user.role);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        {/* Banner */}
        {user.bannerUrl ? (
          <div className="h-44 sm:h-56 overflow-hidden">
            <img src={user.bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 top-0 h-44 sm:h-56 bg-gradient-to-b from-transparent to-zinc-900/40 pointer-events-none" />
          </div>
        ) : (
          <div className="h-40 sm:h-48" style={{ background: "linear-gradient(135deg, oklch(0.13 0.04 275) 0%, oklch(0.10 0.02 260) 50%, oklch(0.12 0.03 290) 100%)" }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_50%,rgba(99,102,241,0.15),transparent)]" />
          </div>
        )}

        <div className="px-6 pb-8 pt-0 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative shrink-0 -mt-14">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-28 w-28 rounded-3xl object-cover ring-4 ring-zinc-950 shadow-xl"
                  />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-indigo-800/60 to-zinc-900 ring-4 ring-zinc-950 shadow-xl">
                    <span className="text-3xl font-black text-zinc-100">{initials}</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 border border-zinc-700">
                  <span className="text-[10px] font-mono text-zinc-400">#{user.numericId}</span>
                </div>
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-3xl font-black text-zinc-50 sm:text-4xl tracking-tight">@{user.username}</div>
                  {badge.label && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-zinc-500">Spotting since {memberSince}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="shrink-0 self-end flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <a href="/settings/profile"
                    className="rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors">
                    Edit profile
                  </a>
                  <a href="/stats"
                    className="rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors">
                    My Stats
                  </a>
                </>
              ) : (
                <>
                  <FollowButton targetNumericId={user.numericId} />
                  {sessionUserId && (
                    <a href={`/messages?with=${user.numericId}`}
                      className="rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors">
                      💬 Message
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300">{user.bio}</p>
          ) : isOwnProfile ? (
            <a href="/settings/profile"
              className="mt-5 inline-block rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/20 px-4 py-3 text-sm text-zinc-500 hover:border-indigo-700/60 hover:text-zinc-400 transition-colors">
              + Add a bio to your profile
            </a>
          ) : (
            <p className="mt-5 text-sm text-zinc-600 italic">No bio yet. A mystery!</p>
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

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a href="#spots" className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-5 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-md hover:shadow-indigo-950/40 transition-all group">
          <div className="text-xs uppercase tracking-wider text-zinc-500 group-hover:text-indigo-500 transition-colors">Uploads</div>
          <div className="mt-1.5 text-3xl font-semibold text-zinc-50 group-hover:text-indigo-200 transition-colors">{user._count.uploads}</div>
          <div className="mt-1 text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors">View all spots ↓</div>
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
        {/* Streak card */}
        <div className={`rounded-2xl border p-5 transition-colors ${
          user.currentStreak > 0
            ? "border-amber-800/50 bg-gradient-to-b from-amber-950/30 to-zinc-900/20 hover:border-amber-700/60"
            : "border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 hover:border-zinc-700"
        }`}>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Upload Streak</div>
          <div className={`mt-1.5 text-3xl font-semibold flex items-center gap-2 ${user.currentStreak > 0 ? "text-amber-300" : "text-zinc-50"}`}>
            {user.currentStreak > 0 && <span>🔥</span>}
            {user.currentStreak}
            <span className="text-base font-normal text-zinc-500">days</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Best: {user.longestStreak} day{user.longestStreak !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {/* ─── Achievements ─────────────────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">Achievements</h2>
          <span className="ml-auto text-xs text-zinc-500">
            {ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length} earned
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.label}
              title={a.desc}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                a.earned
                  ? "border-indigo-800/50 bg-indigo-950/20 hover:border-indigo-700/60 hover:bg-indigo-950/30"
                  : "border-zinc-800/60 bg-zinc-900/20 opacity-40 grayscale"
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className={`text-[10px] font-semibold leading-tight ${a.earned ? "text-indigo-300" : "text-zinc-500"}`}>
                {a.label}
              </span>
              {a.earned && (
                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Country completion ───────────────────────────────────────────────── */}
      <section className="mt-4 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-100">Country Completion</h2>
          </div>
          <span className="text-xs text-zinc-400">
            <span className="font-semibold text-indigo-300">{countriesSpotted}</span>
            <span className="text-zinc-600"> / {totalArchiveCountries}</span>
            <span className="ml-1.5 text-zinc-500">countries</span>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-right text-xs text-zinc-500">{completionPct}%</div>
      </section>

      <section id="spots" className="mt-10">
        {/* ─── Pinned spots ─── */}
        {pinnedOrdered.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-5 w-1 rounded-full bg-amber-500" />
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Pinned
              </h2>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {pinnedOrdered.map((u) => {
                const meta = getCountryMeta(u.country);
                const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
                return (
                  <a key={u.id} href={`/spot/${u.numericId}`}
                    className="group rounded-2xl overflow-hidden border border-amber-900/40 hover:border-amber-600/60 hover:shadow-xl hover:shadow-amber-950/30 hover:-translate-y-0.5 transition-all block bg-zinc-900/50">
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-2 right-2"><Flag iso={meta.iso} /></div>
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/50 rounded-full px-2 py-0.5 backdrop-blur-sm">★ Pinned</span>
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-amber-200 transition-colors truncate">{u.plateText}</span>
                        {u._count.likes > 0 && <span className="text-xs text-rose-400 font-semibold shrink-0">♥ {u._count.likes}</span>}
                      </div>
                      {carLabel && <div className="text-xs text-zinc-500 mt-0.5 truncate">{carLabel}</div>}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-zinc-100">Spots</h2>
          <span className="text-xs text-zinc-500">{user._count.uploads} total</span>
        </div>
        {user.uploads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center">
            <div className="mt-4 text-sm font-medium text-zinc-200">No spots yet</div>
            <p className="mt-1 text-xs text-zinc-500">When @{user.username} uploads their first plate, it will appear here.</p>
          </div>
        ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {user.uploads.map((u) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`}
                  className="group rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all block bg-zinc-900/50">
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2"><Flag iso={meta.iso} /></div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                      {u._count.likes > 0 && <span className="text-xs text-rose-400 font-semibold shrink-0">♥ {u._count.likes}</span>}
                    </div>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5 truncate">{carLabel}</div>}
                    <div className="mt-2 text-xs text-zinc-600">{relativeDays(u.createdAt)}</div>
                  </div>
                </a>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <a href={`?page=${page - 1}#spots`} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:text-indigo-300 transition-colors">
                  ← Previous
                </a>
              ) : (
                <span className="rounded-xl border border-zinc-800/40 px-4 py-2 text-sm text-zinc-700 cursor-default">← Previous</span>
              )}

              <span className="text-xs text-zinc-500 tabular-nums">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <a href={`?page=${page + 1}#spots`} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:text-indigo-300 transition-colors">
                  Next →
                </a>
              ) : (
                <span className="rounded-xl border border-zinc-800/40 px-4 py-2 text-sm text-zinc-700 cursor-default">Next →</span>
              )}
            </div>
          )}
          </>
        )}
      </section>
    </main>
  );
}
