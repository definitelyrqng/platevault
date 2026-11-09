import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import PlateBadge, { formatPlateText } from "@/app/components/PlateBadge";
import SpotCard, { PhotoPill } from "@/app/components/SpotCard";
import CountryTile from "@/app/components/CountryTile";
import { getCountryMeta } from "@/app/lib/countries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home",
  description: "Discover freshly spotted license plates from across Europe. Browse by country, follow spotters, and build your archive.",
  openGraph: { title: "PlateVault — Home", description: "Fresh plates from across Europe. Browse, follow, collect." },
};

const spotSelect = {
  id: true,
  numericId: true,
  plateText: true,
  plateType: true,
  country: true,
  imageUrl: true,
  createdAt: true,
  brand: true,
  model: true,
  user: { select: { username: true, numericId: true, avatarUrl: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

async function getHomeData() {
  const visible = { deletedAt: null, hidden: false };
  const [totalUploads, totalUsers, countryGroups, covers, recent, hotSpots, rareSpots] = await Promise.all([
    prisma.upload.count({ where: visible }),
    prisma.user.count(),
    prisma.upload.groupBy({
      by: ["country"],
      where: visible,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // Latest photo per country — used as the country tile cover
    prisma.upload.findMany({
      where: visible,
      orderBy: { createdAt: "desc" },
      distinct: ["country"],
      select: { country: true, imageUrl: true },
    }),
    prisma.upload.findMany({
      where: visible,
      orderBy: { createdAt: "desc" },
      take: 24,
      select: spotSelect,
    }),
    // Hot: most liked in the last 7 days
    prisma.upload.findMany({
      where: { ...visible, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      orderBy: { likes: { _count: "desc" } },
      take: 4,
      select: spotSelect,
    }),
    // Rare: most rare-votes
    (prisma as any).rareVote.groupBy({
      by: ["uploadId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }).then(async (groups: { uploadId: string; _count: { id: number } }[]) => {
      if (!groups.length) return [];
      const uploads = await prisma.upload.findMany({
        where: { id: { in: groups.map((g) => g.uploadId) }, ...visible },
        select: spotSelect,
      });
      const votes = Object.fromEntries(groups.map((g) => [g.uploadId, g._count.id]));
      return uploads
        .map((u) => ({ ...u, rareVotes: (votes[u.id] as number) ?? 0 }))
        .sort((a, b) => b.rareVotes - a.rareVotes);
    }) as Promise<Array<{ id: string; rareVotes: number } & Parameters<typeof SpotCard>[0]["spot"]>>,
  ]);

  const coverMap = Object.fromEntries(covers.map((c) => [c.country, c.imageUrl]));
  return {
    totalUploads,
    totalUsers,
    countryGroups,
    coverMap,
    recent,
    hotSpots: hotSpots.filter((s) => s._count.likes > 0),
    rareSpots,
  };
}

function SectionHeader({ title, sub, href, linkLabel }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>}
      </div>
      {href && (
        <a href={href} className="shrink-0 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          {linkLabel ?? "View all"} →
        </a>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [data, cookieStore] = await Promise.all([getHomeData(), cookies()]);
  const { totalUploads, totalUsers, countryGroups, coverMap, recent, hotSpots, rareSpots } = data;
  const isGuest = !cookieStore.get("pv_session")?.value;
  const examplePlate = recent[0] ? formatPlateText(recent[0].country, recent[0].plateText) : null;

  const stats = [
    { value: totalUploads, label: "photos" },
    { value: countryGroups.length, label: "countries" },
    { value: totalUsers, label: "spotters" },
  ];

  return (
    <div className="pb-16">

      {/* ─── Hero ─── */}
      <section className="border-b border-zinc-800/60">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">The licence plate archive</div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Spot. Tag. Archive.</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
              Photos of vehicles and their plates from across Europe, shared by the community.
              Look up any plate, or add the one you just saw.
            </p>

            <form action="/search" method="GET" role="search" className="mt-6 flex max-w-xl overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 transition-colors focus-within:border-indigo-500">
              <input
                name="q"
                autoComplete="off"
                aria-label="Search a plate or user"
                placeholder={examplePlate ? `Search a plate, e.g. ${examplePlate}` : "Search a plate or user"}
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[15px] uppercase tracking-wider text-zinc-100 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500"
              />
              <button type="submit" className="m-1.5 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <a href="/upload" className="font-medium text-zinc-200 transition-colors hover:text-white">↑ Upload a spot</a>
              <a href="/countries" className="text-zinc-400 transition-colors hover:text-white">Browse countries</a>
              <a href="/leaderboard" className="text-zinc-400 transition-colors hover:text-white">Top spotters</a>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-6 sm:gap-10 lg:text-right">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">{s.value.toLocaleString()}</dd>
                <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{s.label}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── Latest photos strip (edge to edge) ─── */}
      {recent.length > 0 && (
        <section aria-label="Latest photos" className="border-b border-zinc-800/60 bg-black/20">
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {recent.map((s) => {
              const meta = getCountryMeta(s.country);
              return (
                <a key={s.id} href={`/spot/${s.numericId}`}
                  className="group relative aspect-[4/3] h-32 shrink-0 overflow-hidden bg-zinc-900 sm:h-40">
                  <img src={s.imageUrl} alt={`${s.plateText} — ${meta.name}`} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <span className="absolute left-1.5 top-1.5 leading-none shadow ring-1 ring-black/30"><Flag iso={meta.iso} size="sm" /></span>
                  <span className="absolute bottom-1.5 left-1.5">
                    <PlateBadge country={s.country} text={s.plateText} plateType={s.plateType} size="xs" />
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Latest plates ticker ─── */}
      {recent.length >= 4 && (
        <section aria-label="Latest plates" className="marquee border-b border-zinc-800/60">
          <div className="flex items-center">
            <div className="z-10 shrink-0 bg-zinc-950 py-2.5 pl-4 pr-3 sm:pl-6">
              <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Latest</span>
            </div>
            <div className="marquee-mask min-w-0 flex-1 overflow-hidden py-2.5">
              <div className="animate-marquee flex w-max items-center gap-3">
                {[...recent, ...recent].map((s, i) => (
                  <a key={`${s.id}-${i}`} href={`/spot/${s.numericId}`} aria-hidden={i >= recent.length}
                    tabIndex={i >= recent.length ? -1 : undefined}
                    className="shrink-0 opacity-85 transition hover:-translate-y-0.5 hover:opacity-100">
                    <PlateBadge country={s.country} text={s.plateText} plateType={s.plateType} size="xs" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl space-y-14 px-4 pt-10 sm:px-6">

        {/* ─── Countries ─── */}
        {countryGroups.length > 0 && (
          <section>
            <SectionHeader title="Browse by country" sub="Every country has its own gallery" href="/countries" linkLabel="All countries" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {countryGroups.map((g) => (
                <CountryTile key={g.country} country={g.country} spots={g._count.id} coverUrl={coverMap[g.country]} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Hot this week ─── */}
        {hotSpots.length > 0 && (
          <section>
            <SectionHeader title="Hot this week" sub="Most liked spots from the last 7 days" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
              {hotSpots.map((s, i) => (
                <SpotCard key={s.id} spot={s} badge={i === 0 ? <PhotoPill tone="hot">#1 this week</PhotoPill> : undefined} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Latest spots ─── */}
        {recent.length > 0 && (
          <section>
            <SectionHeader title="Latest spots" sub="Fresh from the community" href="/search" linkLabel="Search the archive" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {recent.slice(0, 12).map((s) => (
                <SpotCard key={s.id} spot={s} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Rare plates ─── */}
        {rareSpots.length > 0 && (
          <section>
            <SectionHeader title="Rare plates" sub="Voted rare by the community" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {rareSpots.map((s) => (
                <SpotCard key={s.id} spot={s} badge={<PhotoPill tone="rare">✦ {s.rareVotes} rare</PhotoPill>} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Join (guests only) ─── */}
        {isGuest && (
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Join the archive</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Browsing is free for everyone. Create an account to upload your own spots, like and comment, and climb the leaderboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="/signup" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">Create account</a>
                  <a href="/login" className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white">Log in</a>
                </div>
              </div>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  { n: "1", t: "Spot a plate", d: "See something interesting on the road? Take a photo." },
                  { n: "2", t: "Upload it", d: "Add the plate, country and car details in under a minute." },
                  { n: "3", t: "Build your archive", d: "Collect countries, keep streaks, earn your spot on the board." },
                ].map((s) => (
                  <li key={s.n} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600/15 text-xs font-bold text-indigo-300">{s.n}</div>
                    <div className="mt-3 text-sm font-semibold text-zinc-100">{s.t}</div>
                    <div className="mt-1 text-xs leading-relaxed text-zinc-500">{s.d}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
