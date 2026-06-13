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
  const [totalUploads, totalUsers, countryGroups, recentUploads] = await Promise.all([
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
  ]);
  const countryCount = countryGroups.length;
  return { totalUploads, totalUsers, countryCount, countryGroups, recentUploads };
}

export default async function HomePage() {
  const { totalUploads, totalUsers, countryCount, countryGroups, recentUploads } = await getStats();

  // Pick a random country for the hero button
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
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/60 px-8 py-12 mb-8">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/60 bg-indigo-950/40 px-3 py-1 text-xs text-indigo-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Community plate archive
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Spot. Tag. Archive.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400 leading-relaxed">
            A community gallery for license plate spotters. Upload your finds, browse by country, and explore plate formats from around the world.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/upload" className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white transition-colors">
              Upload a spot
            </a>
            <a href={`/c/${heroCountry}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
              <Flag iso={heroCmeta.iso} /> Browse {heroCmeta.name}
            </a>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-8">
        {[
          { label: "Spots archived", value: totalUploads.toLocaleString(), icon: "📷", href: null },
          { label: "Spotters",       value: totalUsers.toLocaleString(),   icon: "👤", href: null },
          { label: "Countries",      value: countryCount.toLocaleString(), icon: "🌍", href: "/countries" },
          { label: "Plate formats",  value: "7+",                          icon: "📋", href: null },
        ].map((s) => (
          s.href ? (
            <a key={s.label} href={s.href} className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 px-5 py-5 hover:border-indigo-700 hover:bg-indigo-950/20 transition-colors group">
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">{s.value}</div>
              <div className="mt-0.5 text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors">{s.label} →</div>
            </a>
          ) : (
            <div key={s.label} className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 px-5 py-5 hover:border-zinc-700 transition-colors">
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
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Browse by country</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pick a country to see all its spots</p>
            </div>
            <a href="/countries" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
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
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-5 text-center hover:border-zinc-600 hover:bg-zinc-900/70 transition-all"
                >
                  <span className="text-3xl"><Flag iso={m.iso} /></span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate w-full">{m.name}</span>
                  <span className="text-xs text-zinc-600">{_count.id} spot{_count.id === 1 ? "" : "s"}</span>
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
              <h2 className="text-xl font-semibold">Recent spots</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Latest from the community</p>
            </div>
            <a href="/c/albania" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              View all →
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentUploads.map((u) => {
              const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
              const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
              return (
                <div key={u.id} className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-black/20">
                  <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-0" aria-label={u.plateText} />

                  {/* Image */}
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img
                      src={u.imageUrl}
                      alt={`${u.plateText} plate`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Country badge overlaid */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-700/60 px-2 py-0.5 text-xs">
                      <Flag iso={meta.iso} />
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-mono text-base font-bold tracking-widest text-zinc-100 leading-tight">
                          {u.plateText}
                        </div>
                        {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                      </div>
                      <span className="shrink-0 text-xs text-zinc-500 mt-0.5">{relativeDays(u.createdAt)}</span>
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
                        <span className="text-xs text-zinc-500 group-hover/user:text-zinc-300 transition-colors">@{u.user.username}</span>
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
