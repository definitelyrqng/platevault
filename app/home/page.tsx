import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

async function getStats() {
  const [totalUploads, totalUsers, countryGroups, recentUploads, hotSpots, rareSpots] = await Promise.all([
    prisma.upload.count({ where: { deletedAt: null } }),
    prisma.user.count(),
    prisma.upload.groupBy({
      by: ["country"],
      where: { deletedAt: null, hidden: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.upload.findMany({
      where: { deletedAt: null, hidden: false },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: {
        id: true,
        numericId: true,
        plateText: true,
        country: true,
        imageUrl: true,
        createdAt: true,
        brand: true,
        model: true,
        user: { select: { username: true, numericId: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    // Hot spots: most likes in the last 7 days
    prisma.upload.findMany({
      where: {
        deletedAt: null,
        hidden: false,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 3,
      select: {
        id: true, numericId: true, plateText: true, country: true,
        imageUrl: true, brand: true, model: true,
        user: { select: { username: true, numericId: true } },
        _count: { select: { likes: true } },
      },
    }),
    // Rare spots: most ✨ votes
    (prisma as any).rareVote.groupBy({
      by: ["uploadId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }).then(async (groups: { uploadId: string; _count: { id: number } }[]) => {
      if (!groups.length) return [];
      const uploadIds = groups.map((g) => g.uploadId);
      const uploads = await prisma.upload.findMany({
        where: { id: { in: uploadIds }, deletedAt: null, hidden: false },
        select: {
          id: true, numericId: true, plateText: true, country: true,
          imageUrl: true, brand: true, model: true,
          user: { select: { username: true, numericId: true } },
          _count: { select: { likes: true } },
        },
      });
      // Attach vote count and sort
      const countMap = Object.fromEntries(groups.map((g) => [g.uploadId, g._count.id]));
      return uploads
        .map((u) => ({ ...u, rareVotes: countMap[u.id] ?? 0 }))
        .sort((a, b) => b.rareVotes - a.rareVotes);
    }),
  ]);
  const countryCount = countryGroups.length;
  return { totalUploads, totalUsers, countryCount, countryGroups, recentUploads, hotSpots, rareSpots };
}

export default async function HomePage() {
  const { totalUploads, totalUsers, countryCount, countryGroups, recentUploads, hotSpots, rareSpots } = await getStats();

  const randomCountry = countryGroups.length > 0
    ? countryGroups[Math.floor(Math.random() * countryGroups.length)]
    : null;
  const heroCmeta = randomCountry
    ? (COUNTRY_META[randomCountry.country] ?? { iso: null, name: randomCountry.country.charAt(0).toUpperCase() + randomCountry.country.slice(1) })
    : COUNTRY_META["albania"];
  const heroCountry = randomCountry?.country ?? "albania";

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-4">

      {/* ─── Hero ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-indigo-900/40 bg-gradient-to-br from-indigo-950/60 via-zinc-900/80 to-zinc-900/60 px-8 py-14 mb-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_10%_120%,rgba(99,102,241,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_90%_-20%,rgba(139,92,246,0.10),transparent)]" />
        {/* Decorative plate strip */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-48 opacity-5 flex flex-col justify-center gap-2 pr-4 overflow-hidden select-none text-right">
          {["AB-123-CD","XK 01 001","M-XB 001","TA-123456","Z-XC 001"].map((p, i) => (
            <div key={i} className="font-mono font-black text-white tracking-widest text-sm">{p}</div>
          ))}
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-700/40 bg-indigo-900/30 px-3 py-1 text-xs text-indigo-300 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Community plate archive
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl bg-gradient-to-br from-zinc-50 via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
            Spot. Tag. Archive.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400 leading-relaxed">
            A community gallery for license plate spotters. Upload your finds, browse by country, and explore plate formats from around the world.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/upload" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/60">
              + Upload a spot
            </a>
            <a href={`/c/${heroCountry}`} className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-indigo-800/60 hover:bg-indigo-950/30 hover:text-indigo-300 transition-colors">
              <Flag iso={heroCmeta.iso} /> Browse {heroCmeta.name}
            </a>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-8">
        {[
          { label: "Spots archived", value: totalUploads.toLocaleString(), icon: "📷", href: null, accent: null },
          { label: "Spotters",       value: totalUsers.toLocaleString(),   icon: "👤", href: "/leaderboard", accent: "amber" },
          { label: "Countries",      value: countryCount.toLocaleString(), icon: "🌍", href: "/countries",  accent: "indigo" },
          { label: "Quiz",           value: "Play →",                      icon: "🎮", href: "/quiz",       accent: "indigo" },
        ].map((s) => (
          s.href ? (
            <a key={s.label} href={s.href}
              className={`group rounded-2xl border bg-gradient-to-b px-5 py-5 transition-all hover:shadow-lg ${
                s.accent === "amber"
                  ? "border-zinc-800 from-zinc-900/80 to-zinc-900/30 hover:border-amber-700/40 hover:bg-amber-950/10 hover:shadow-amber-950/30"
                  : "border-zinc-800 from-zinc-900/80 to-zinc-900/30 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-indigo-950/40"
              }`}
            >
              <div className="text-lg mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold text-zinc-100 transition-colors ${s.accent === "amber" ? "group-hover:text-amber-300" : "group-hover:text-indigo-300"}`}>{s.value}</div>
              <div className={`mt-0.5 text-xs text-zinc-500 transition-colors ${s.accent === "amber" ? "group-hover:text-amber-500" : "group-hover:text-indigo-400"}`}>{s.label}</div>
            </a>
          ) : (
            <div key={s.label}
              className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 px-5 py-5"
            >
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{s.label}</div>
            </div>
          )
        ))}
      </div>

      {/* ─── Browse by country ─── */}
      {countryGroups.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-indigo-500" />
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Browse by country</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Pick a country to see all its spots</p>
              </div>
            </div>
            <a href="/countries" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              All countries →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {countryGroups.map(({ country, _count }) => {
              const m = COUNTRY_META[country] ?? { iso: null, name: country.charAt(0).toUpperCase() + country.slice(1) };
              return (
                <a
                  key={country}
                  href={`/c/${country}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-5 text-center hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-md hover:shadow-indigo-950/40 transition-all"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200"><Flag iso={m.iso} /></span>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-indigo-200 truncate w-full transition-colors">{m.name}</span>
                  <span className="text-xs text-zinc-600 group-hover:text-indigo-500 transition-colors">{_count.id} spot{_count.id === 1 ? "" : "s"}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Hot Spots (last 7 days) ─── */}
      {hotSpots.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="h-5 w-1 rounded-full bg-rose-500 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">🔥 Hot This Week</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Most liked spots in the last 7 days</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(hotSpots as any[]).map((u, i) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`} className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-rose-800/60 hover:shadow-md hover:shadow-rose-950/40 transition-all">
                  {i === 0 && (
                    <div className="absolute top-2 left-2 z-10 rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      🔥 #1
                    </div>
                  )}
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100 group-hover:text-rose-200 transition-colors">{u.plateText}</span>
                      <span className="rounded-md px-1.5 py-1 inline-flex items-center gap-1 bg-zinc-800/60 text-xs text-zinc-400">
                        <Flag iso={meta.iso} size="sm" />
                      </span>
                    </div>
                    {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>by @{u.user.username}</span>
                      <span className="text-rose-400 font-semibold">♥ {u._count.likes}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Rare spots ─── */}
      {rareSpots.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="h-5 w-1 rounded-full bg-amber-500 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">✨ Rare Plates</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Community-voted rare finds</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(rareSpots as any[]).map((u) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-amber-800/60 hover:shadow-md hover:shadow-amber-950/40 transition-all">
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100 group-hover:text-amber-200 transition-colors">{u.plateText}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md px-1.5 py-1 inline-flex items-center gap-1 bg-zinc-800/60 text-xs text-zinc-400">
                          <Flag iso={meta.iso} size="sm" />
                        </span>
                        <span className="rounded-md px-1.5 py-1 inline-flex items-center gap-1 bg-amber-950/40 border border-amber-800/40 text-xs text-amber-400">
                          ✨ {u.rareVotes}
                        </span>
                      </div>
                    </div>
                    {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                    <div className="mt-2 text-xs text-zinc-500">
                      <span>by @{u.user.username}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Recent spots ─── */}
      {recentUploads.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="h-5 w-1 rounded-full bg-violet-500 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Recent spots</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Latest from the community</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentUploads.map((u) => {
              const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <div key={u.id} className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-indigo-800/60 hover:shadow-lg hover:shadow-indigo-950/40 transition-all">
                  <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-0" aria-label={u.plateText} />

                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img
                      src={u.imageUrl}
                      alt={`${u.plateText} plate`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-700/60 px-1.5 py-1 inline-flex">
                      <Flag iso={meta.iso} size="sm" />
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-mono text-base font-bold tracking-widest text-zinc-100 leading-tight group-hover:text-indigo-200 transition-colors">
                          {u.plateText}
                        </div>
                        {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                      </div>
                      <span className="shrink-0 text-xs text-zinc-600 mt-0.5">{relativeDays(u.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <a href={`/u/${u.user.numericId}`} className="relative z-10 flex items-center gap-1.5 group/user">
                        {u.user.avatarUrl ? (
                          <img src={u.user.avatarUrl} alt={u.user.username} className="h-5 w-5 rounded-md object-cover" />
                        ) : (
                          <div className="h-5 w-5 rounded-md bg-zinc-800 grid place-items-center text-[8px] font-bold text-zinc-500">
                            {u.user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-zinc-500 group-hover/user:text-indigo-300 transition-colors">@{u.user.username}</span>
                      </a>
                      <span className="text-xs text-zinc-600 flex items-center gap-2">
                        <span>♡ {u._count.likes}</span>
                        <span>💬 {u._count.comments}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </main>
  );
}
