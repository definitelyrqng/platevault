import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home",
  description: "Discover freshly spotted license plates from across Europe. Browse by country, follow spotters, and build your archive.",
  openGraph: { title: "PlateVault — Home", description: "Fresh plates from across Europe. Browse, follow, collect." },
};

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
      take: 12,
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-4">

      {/* ─── Mobile search bar ─── */}
      <div className="md:hidden mb-4">
        <a href="/search"
          className="flex items-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-500 hover:border-indigo-700/50 hover:text-zinc-400 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search plates or users…
        </a>
      </div>

      {/* ─── Hero ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-indigo-800/30 mb-8" style={{ background: "linear-gradient(135deg, oklch(0.13 0.04 275) 0%, oklch(0.10 0.02 260) 40%, oklch(0.08 0.01 250) 100%)" }}>
        {/* Radial glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_100%,rgba(99,102,241,0.22),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_100%_0%,rgba(168,85,247,0.14),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />

        {/* Decorative plate grid — right side, subtle */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-64 overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-indigo-950/0" />
          {["AB-123-CD","XK 01 001","M-XB 001","TA-123456","Z-XC 001","W-AC 4321","BL-UV 99"].map((p, i) => (
            <div key={i} className="font-mono font-black tracking-widest text-indigo-300/[0.06] text-lg absolute"
              style={{ top: `${10 + i * 13}%`, right: "1rem" }}>{p}</div>
          ))}
        </div>

        <div className="relative px-8 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Community plate archive · {totalUploads.toLocaleString()} spots
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl leading-[1.05]">
            <span className="bg-gradient-to-br from-white via-zinc-100 to-indigo-200 bg-clip-text text-transparent">Spot.</span>{" "}
            <span className="bg-gradient-to-br from-indigo-200 via-violet-200 to-purple-300 bg-clip-text text-transparent">Tag.</span>{" "}
            <span className="bg-gradient-to-br from-zinc-100 via-indigo-100 to-indigo-300 bg-clip-text text-transparent">Archive.</span>
          </h1>
          <p className="mt-5 max-w-lg text-zinc-400 leading-relaxed text-base">
            A community gallery for license plate obsessives. Spot weird plates, flex on your friends, and pretend it&apos;s a serious hobby.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/upload"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/60 hover:shadow-indigo-500/25 hover:-translate-y-px active:translate-y-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Upload a spot
            </a>
            <a href={`/c/${heroCountry}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-zinc-200 transition-all hover:-translate-y-px active:translate-y-0">
              <Flag iso={heroCmeta.iso} /> Browse {heroCmeta.name}
            </a>
            <a href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-zinc-400 transition-all hover:text-zinc-200 hover:-translate-y-px active:translate-y-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </a>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-10">
        {[
          { label: "Spots archived", value: totalUploads.toLocaleString(), emoji: "📷", href: null,           dot: "bg-violet-500" },
          { label: "Spotters",       value: totalUsers.toLocaleString(),   emoji: "👤", href: "/leaderboard", dot: "bg-amber-500"  },
          { label: "Countries",      value: countryCount.toLocaleString(), emoji: "🌍", href: "/countries",   dot: "bg-emerald-500"},
          { label: "Play the quiz",  value: "Let's go →",                  emoji: "🎮", href: "/quiz",        dot: "bg-rose-500"   },
        ].map((s) => {
          const inner = (
            <div className="px-5 py-5">
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-black text-zinc-100 tabular-nums leading-none">{s.value}</div>
              <div className="mt-1.5 text-xs text-zinc-500">{s.label}</div>
            </div>
          );
          return s.href ? (
            <a key={s.label} href={s.href}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:bg-zinc-900 hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-950/50 hover:-translate-y-0.5 transition-all">
              <div className={`h-0.5 w-full ${s.dot} opacity-60 group-hover:opacity-100 transition-opacity`} />
              {inner}
            </a>
          ) : (
            <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className={`h-0.5 w-full ${s.dot} opacity-40`} />
              {inner}
            </div>
          );
        })}
      </div>

      {/* ─── Browse by country ─── */}
      {countryGroups.length > 0 && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black text-zinc-100">Browse by country</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pick a country to see all its spots</p>
            </div>
            <a href="/countries" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              All countries →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {countryGroups.map(({ country, _count }) => {
              const m = COUNTRY_META[country] ?? { iso: null, name: country.charAt(0).toUpperCase() + country.slice(1) };
              return (
                <a key={country} href={`/c/${country}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-5 text-center hover:border-indigo-700/60 hover:bg-indigo-950/30 hover:shadow-lg hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all">
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-110"><Flag iso={m.iso} /></span>
                  <span className="text-sm font-semibold text-zinc-300 group-hover:text-indigo-200 truncate w-full transition-colors">{m.name}</span>
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
            <div>
              <h2 className="text-2xl font-black text-zinc-100">🔥 Hot This Week</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Most liked spots in the last 7 days</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(hotSpots as any[]).map((u, i) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`}
                  className="group rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-rose-700/50 hover:shadow-lg hover:shadow-rose-950/30 transition-all block">
                  <div className="relative bg-zinc-950 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                    {i === 0 && (
                      <div className="absolute top-3 left-3 z-10 rounded-full bg-rose-600/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                        🔥 #1 this week
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-zinc-800/40 bg-zinc-900/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100 group-hover:text-rose-200 transition-colors truncate">{u.plateText}</span>
                      <Flag iso={meta.iso} />
                    </div>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">@{u.user.username}</span>
                      <span className="text-rose-400 font-bold">♥ {u._count.likes}</span>
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
            <div>
              <h2 className="text-2xl font-black text-zinc-100">✨ Rare Plates</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Community-voted rare finds</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(rareSpots as any[]).map((u) => {
              const meta = getCountryMeta(u.country);
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`}
                  className="group rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-amber-700/50 hover:shadow-lg hover:shadow-amber-950/30 transition-all block">
                  <div className="relative bg-zinc-950 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-3 left-3 z-10 rounded-full bg-amber-500/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-zinc-950 shadow">
                      ✨ {u.rareVotes} rare
                    </div>
                  </div>
                  <div className="p-3 border-t border-zinc-800/40 bg-zinc-900/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100 group-hover:text-amber-200 transition-colors truncate">{u.plateText}</span>
                      <Flag iso={meta.iso} />
                    </div>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                    <div className="mt-2 text-xs text-zinc-500">@{u.user.username}</div>
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
            <div>
              <h2 className="text-2xl font-black text-zinc-100">Recent spots</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Latest from the community</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentUploads.map((u) => {
              const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <a key={u.id} href={`/spot/${u.numericId}`}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all block bg-zinc-900/50">
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img src={u.imageUrl} alt={`${u.plateText} plate`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-mono text-xs font-bold text-white/90 tracking-widest">{u.plateText}</span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Flag iso={meta.iso} />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                      {u._count.likes > 0 && <span className="text-xs text-rose-400 font-semibold shrink-0">♥ {u._count.likes}</span>}
                    </div>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5 truncate">{carLabel}</div>}
                    <div className="mt-2 flex items-center gap-1.5">
                      {u.user.avatarUrl ? (
                        <img src={u.user.avatarUrl} alt={u.user.username} className="h-4 w-4 rounded-full object-cover" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-zinc-800 grid place-items-center text-[7px] font-bold text-zinc-500">
                          {u.user.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-zinc-600">@{u.user.username}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
