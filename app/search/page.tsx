import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";
import SearchFilters from "@/app/components/SearchFilters";
import SearchAutocomplete from "@/app/components/SearchAutocomplete";


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

async function searchPlates(rawQuery: string, filterCountry = "", sortBy: "newest" | "liked" = "newest") {
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

  const where: any = { id: { in: ids } };
  if (filterCountry) where.country = filterCountry;

  const uploads = await prisma.upload.findMany({
    where,
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

  if (sortBy === "liked") {
    uploads.sort((a, b) => b._count.likes - a._count.likes);
  } else {
    uploads.sort((a, b) => (sortMap.get(a.id) ?? 99) - (sortMap.get(b.id) ?? 99));
  }
  return uploads;
}


async function searchUsers(rawQuery: string) {
  const q = rawQuery.trim();
  if (!q || q.length < 1) return [];
  return prisma.user.findMany({
    where: { username: { contains: q, mode: "insensitive" } },
    select: { numericId: true, username: true, avatarUrl: true, _count: { select: { uploads: true } } },
    take: 6,
    orderBy: { username: "asc" },
  });
}


async function searchHashtag(rawQuery: string) {
  // Strip leading # if present
  const tag = rawQuery.startsWith("#") ? rawQuery : "#" + rawQuery;
  const q = tag.toLowerCase();
  const rows = await prisma.upload.findMany({
    where: {
      deletedAt: null,
      hidden: false,
      description: { contains: q, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true, numericId: true, plateText: true, country: true,
      imageUrl: true, brand: true, model: true, createdAt: true,
      description: true,
      user: { select: { username: true, numericId: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return rows;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; sort?: string }>;
}) {
  const { q, country, sort } = await searchParams;
  const query = (q ?? "").trim();
  const filterCountry = (country ?? "").trim().toLowerCase();
  const sortBy = (sort ?? "newest") as "newest" | "liked";
  const hasQuery = query.length > 0;
  const isHashtagQuery = query.startsWith("#") && query.length > 1;

  const [results, userResults, hashtagResults] = hasQuery
    ? await Promise.all([
        isHashtagQuery ? [] : searchPlates(query, filterCountry, sortBy),
        isHashtagQuery ? [] : searchUsers(query),
        isHashtagQuery ? searchHashtag(query) : [],
      ])
    : [[], [], []];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">

      {/* ─── Search bar ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-1 rounded-full bg-indigo-500" />
          <h1 className="text-2xl font-bold text-zinc-50">Search</h1>
        </div>
        <SearchAutocomplete defaultValue={query} />
        {hasQuery && (
          <p className="mt-2 text-xs text-zinc-500">
            {isHashtagQuery
              ? hashtagResults.length === 0
                ? `No spots tagged ${query}`
                : `${hashtagResults.length} spot${hashtagResults.length === 1 ? "" : "s"} tagged ${query}`
              : results.length === 0 && userResults.length === 0
              ? `No results for "${query}"`
              : `${results.length + userResults.length} result${results.length + userResults.length === 1 ? "" : "s"} for "${query}"`}
          </p>
        )}
      </div>

      {/* ─── Filters (only shown for plate search) ─── */}
      {hasQuery && !isHashtagQuery && (
        <SearchFilters
          query={query}
          filterCountry={filterCountry}
          sortBy={sortBy}
          countries={Object.entries(COUNTRY_META).map(([key, m]) => ({ key, name: m.name }))}
        />
      )}

      {/* ─── Results ─── */}
      {/* ─── User results ─── */}
      {userResults.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-1 rounded-full bg-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Users</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {userResults.map((u) => (
              <a
                key={u.numericId}
                href={`/u/${u.numericId}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-indigo-800/60 hover:bg-zinc-900 transition-all"
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-zinc-100">@{u.username}</div>
                  <div className="text-xs text-zinc-500">{u._count.uploads} spot{u._count.uploads !== 1 ? "s" : ""}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}


      {/* ─── Hashtag results ─── */}
      {isHashtagQuery && (
        <>
          {hashtagResults.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="text-4xl mb-3">#</div>
              <p className="text-sm text-zinc-400">No spots tagged <span className="font-mono text-zinc-200">{query}</span> yet.</p>
              <p className="mt-1 text-xs text-zinc-600">Be the first — upload a spot and use this hashtag in the description!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(hashtagResults as any[]).map((u) => {
                const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
                const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
                return (
                  <div key={u.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-950/30 transition-all">
                    <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-10" aria-label={u.plateText} />
                    <div className="relative bg-zinc-950 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                    </div>
                    <div className="p-3 border-t border-zinc-800/40 bg-zinc-900/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                        <Flag iso={meta.iso} />
                      </div>
                      {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>@{u.user.username}</span>
                        <span>♡ {u._count.likes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}


      {!isHashtagQuery && !hasQuery ? (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-zinc-500">Type a plate number above to search the archive.</p>
          <p className="mt-1 text-xs text-zinc-600">Works with dashes, spaces, or none — e.g. AB-123-CD, AB 123 CD, or AB123CD all find the same plate.</p>
        </div>
      ) : !isHashtagQuery && results.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🪪</div>
          <p className="text-sm text-zinc-400">No plates found matching <span className="font-mono text-zinc-200">"{query}"</span>.</p>
          <p className="mt-1 text-xs text-zinc-600">Try a shorter or different format.</p>
        </div>
      ) : !isHashtagQuery ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((u) => {
            const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <div key={u.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-950/30 transition-all">
                <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-10" aria-label={u.plateText} />
                <div className="relative bg-zinc-950 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={u.imageUrl} alt={`${u.plateText} plate`} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-3 border-t border-zinc-800/40 bg-zinc-900/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                    <a href={`/c/${u.country}`} className="relative z-20 shrink-0 rounded-full bg-zinc-800/60 px-2 py-0.5 text-sm hover:bg-zinc-700/60 transition-colors"><Flag iso={meta.iso} /></a>
                  </div>
                  {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <a href={`/u/${u.user.numericId}`} className="relative z-20 hover:text-indigo-300 transition-colors">@{u.user.username}</a>
                    <span className="flex items-center gap-2"><span>♡ {u._count.likes}</span><span className="hidden sm:inline">{relativeDays(u.createdAt)}</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
