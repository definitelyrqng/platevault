import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getCountryMeta } from "@/app/lib/countries";
import Flag from "@/app/components/Flag";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Stats",
  description: "Your personal PlateVault statistics — spots, countries, streaks, and achievements.",
  openGraph: { title: "My Stats · PlateVault", description: "See your spotting stats and achievements." },
};

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          numericId: true,
          username: true,
          currentStreak: true,
          longestStreak: true,
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function StatsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [uploads, likesAgg, archiveGroups] = await Promise.all([
    prisma.upload.findMany({
      where: { userId: user.id, deletedAt: null, hidden: false },
      select: { country: true, brand: true, createdAt: true },
    }),
    prisma.like.aggregate({
      where: { upload: { userId: user.id, deletedAt: null } },
      _count: { _all: true },
    }),
    prisma.upload.groupBy({
      by: ["country"],
      where: { deletedAt: null, hidden: false },
    }),
  ]);

  const totalSpots = uploads.length;
  const totalLikes = likesAgg._count._all;
  const totalArchiveCountries = archiveGroups.length;

  // Top countries
  const countryCounts = new Map<string, number>();
  for (const u of uploads) {
    countryCounts.set(u.country, (countryCounts.get(u.country) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const countriesSpotted = countryCounts.size;

  // Top brands
  const brandCounts = new Map<string, number>();
  for (const u of uploads) {
    if (u.brand) brandCounts.set(u.brand, (brandCounts.get(u.brand) ?? 0) + 1);
  }
  const topBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Monthly activity (last 12 months)
  const now = new Date();
  const months: { label: string; key: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleString("en", { month: "short" }), key, count: 0 });
  }
  for (const u of uploads) {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = months.find((x) => x.key === key);
    if (m) m.count++;
  }
  const maxMonthly = Math.max(...months.map((m) => m.count), 1);

  const completionPct =
    totalArchiveCountries > 0
      ? Math.round((countriesSpotted / totalArchiveCountries) * 100)
      : 0;

  const summary = [
    { label: "Total Spots", value: totalSpots },
    { label: "Countries",   value: countriesSpotted },
    { label: "Likes Received", value: totalLikes },
    { label: "Best Streak", value: `${user.longestStreak}d` },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-50">My Stats</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          @{user.username} · all-time spotting summary
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s, i) => {
          const accents = ["from-indigo-600 to-violet-600", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500", "from-emerald-500 to-teal-500"];
          return (
            <div key={s.label} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accents[i]}`} />
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">{s.label}</div>
              <div className="mt-2 text-3xl font-black text-zinc-50">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Country completion */}
      <div className="mt-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-100">Country Completion</h2>
          <span className="text-xs text-zinc-400">
            <span className="font-semibold text-indigo-300">
              {countriesSpotted}
            </span>
            <span className="text-zinc-600"> / {totalArchiveCountries}</span>
            <span className="ml-1 text-zinc-500"> countries</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-zinc-500">
          {completionPct}% of Platevault countries spotted
        </p>
      </div>

      {/* Top countries + top brands */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Top countries */}
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-bold text-zinc-100 mb-4">Top Countries</h2>
          {topCountries.length === 0 ? (
            <p className="text-xs text-zinc-500">No spots yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topCountries.map(([country, count]) => {
                const meta = getCountryMeta(country);
                const pct = Math.round((count / topCountries[0][1]) * 100);
                return (
                  <div key={country} className="flex items-center gap-3">
                    <Flag iso={meta.iso} />
                    <span className="w-24 truncate text-xs text-zinc-300">
                      {meta.name}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-zinc-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top brands */}
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-bold text-zinc-100 mb-4">Top Brands</h2>
          {topBrands.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No spots with brand info yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {topBrands.map(([brand, count]) => {
                const pct = Math.round((count / topBrands[0][1]) * 100);
                return (
                  <div key={brand} className="flex items-center gap-3">
                    <span className="w-28 truncate text-xs text-zinc-300">
                      {brand}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-zinc-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly activity bar chart */}
      <div className="mt-6 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-100">Monthly Activity</h2>
          <span className="text-xs text-zinc-500">last 12 months</span>
        </div>
        {/* Bar chart */}
        <div className="flex items-end gap-1" style={{ height: "80px" }}>
          {months.map((m) => {
            const barH =
              m.count > 0
                ? Math.max(Math.round((m.count / maxMonthly) * 76), 3)
                : 0;
            return (
              <div
                key={m.key}
                className="flex flex-1 flex-col items-center justify-end"
                style={{ height: "80px" }}
                title={`${m.label}: ${m.count} spot${m.count !== 1 ? "s" : ""}`}
              >
                {m.count > 0 && (
                  <span className="mb-1 text-[9px] tabular-nums text-zinc-600">
                    {m.count}
                  </span>
                )}
                <div
                  className="w-full rounded-t bg-indigo-600 transition-all"
                  style={{ height: `${barH}px` }}
                />
              </div>
            );
          })}
        </div>
        {/* Month labels */}
        <div className="mt-1 flex gap-1">
          {months.map((m) => (
            <div
              key={m.key}
              className="flex-1 text-center text-[9px] text-zinc-600"
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <a
          href={`/u/${user.numericId}`}
          className="text-sm text-zinc-400 hover:text-indigo-300 transition-colors"
        >
          ← Back to profile
        </a>
        <a
          href="/api/pdf-poster"
          download
          className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-indigo-700/60 hover:bg-indigo-950/20 hover:text-indigo-300 transition-colors"
        >
          ↓ Download PDF poster
        </a>
      </div>
    </main>
  );
}
