import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";


function normalize(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

async function searchPlates(rawQuery: string) {
  const rawUpper = rawQuery.trim().toUpperCase();
  const normalized = normalize(rawQuery);
  if (!normalized || normalized.length < 1) return [];

  const matchRows = await prisma.$queryRaw<{ id: string; sort_order: number }[]>`
    SELECT u.id,
      CASE
        WHEN UPPER(u."plateText") = ${rawUpper}                                                          THEN 0
        WHEN REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') = ${normalized}                 THEN 1
        WHEN UPPER(u."plateText") LIKE ${rawUpper + "%"}                                                  THEN 2
        WHEN REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') LIKE ${normalized + "%"}         THEN 3
        ELSE 4
      END AS sort_order
    FROM "Upload" u
    WHERE u."deletedAt" IS NULL
      AND u.hidden = false
      AND (
        UPPER(u."plateText")                                                        LIKE ${"%" + rawUpper + "%"}
        OR REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g')              LIKE ${"%" + normalized + "%"}
      )
    ORDER BY sort_order, u."createdAt" DESC
    LIMIT 40
  `;

  if (matchRows.length === 0) return [];

  const ids = matchRows.map((r) => r.id);
  const sortMap = new Map(matchRows.map((r) => [r.id, r.sort_order]));

  const uploads = await prisma.upload.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      numericId: true,
      plateText: true,
      country: true,
      imageUrl: true,
      createdAt: true,
      brand: true,
      model: true,
      location: true,
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  uploads.sort((a, b) => (sortMap.get(a.id) ?? 99) - (sortMap.get(b.id) ?? 99));
  return uploads;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hasQuery = query.length > 0;

  const results = hasQuery ? await searchPlates(query) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">

      {/* ─── Search bar ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-1 rounded-full bg-indigo-500" />
          <h1 className="text-2xl font-bold text-zinc-50">Search plates</h1>
        </div>
        <form method="GET" action="/search" className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="e.g. AB-123-CD or AB123CD"
            autoFocus
            autoComplete="off"
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-sm font-mono tracking-wider text-zinc-100 placeholder:text-zinc-600 placeholder:font-sans placeholder:tracking-normal outline-none focus:border-indigo-700/60 focus:bg-zinc-900 transition-colors"
          />
          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Search
          </button>
        </form>
        {hasQuery && (
          <p className="mt-2 text-xs text-zinc-500">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}" across all countries`}
          </p>
        )}
      </div>

      {/* ─── Results ─── */}
      {!hasQuery ? (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-zinc-500">Type a plate number above to search the archive.</p>
          <p className="mt-1 text-xs text-zinc-600">Works with dashes, spaces, or none — e.g. AB-123-CD, AB 123 CD, or AB123CD all find the same plate.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🪪</div>
          <p className="text-sm text-zinc-400">No plates found matching <span className="font-mono text-zinc-200">"{query}"</span>.</p>
          <p className="mt-1 text-xs text-zinc-600">Try a shorter or different format.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((u) => {
            const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <div
                key={u.id}
                className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-indigo-800/60 hover:shadow-lg hover:shadow-indigo-950/40 transition-all"
              >
                <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-0" aria-label={u.plateText} />

                <div className="relative bg-zinc-950 aspect-video overflow-hidden">
                  <img
                    src={u.imageUrl}
                    alt={`${u.plateText} plate`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <a
                      href={`/c/${u.country}`}
                      className="relative z-10 rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-700/60 px-2 py-0.5 text-xs hover:bg-indigo-950/60 hover:border-indigo-700/60 transition-colors"
                    >
                      <Flag iso={meta.iso} /> {meta.name}
                    </a>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-lg font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors">{u.plateText}</div>
                      {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                      {u.location && <div className="text-xs text-zinc-500 mt-0.5">📍 {u.location}</div>}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500 mt-0.5">{relativeDays(u.createdAt)}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800">
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
      )}
    </main>
  );
}
