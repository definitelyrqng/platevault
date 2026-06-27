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

function foldUmlauts(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ä/g, "A").replace(/Ö/g, "O").replace(/Ü/g, "U")
    .replace(/ß/g, "SS")
    .replace(/É|È|Ê|Ë/g, "E").replace(/À|Â/g, "A")
    .replace(/Î|Ï/g, "I").replace(/Ô/g, "O").replace(/Û/g, "U")
    .replace(/Á/g, "A").replace(/Í/g, "I").replace(/Ó/g, "O").replace(/Ú/g, "U")
    .replace(/[^A-Z0-9]/g, "");
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
  const folded = foldUmlauts(rawQuery);
  if (!normalized || normalized.length < 1) return [];

  const matchRows = await prisma.$queryRaw<{ id: string; sort_order: number }[]>`
    SELECT u.id,
      CASE
        WHEN UPPER(u."plateText") = ${rawUpper}                                                          THEN 0
        WHEN REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') = ${normalized}                 THEN 1
        WHEN REGEXP_REPLACE(TRANSLATE(UPPER(u."plateText"), 'ÄÖÜÁÀÂÉÈÊÍÎÓÔÚÛ', 'AOUAAAEEEIIOOUU'), '[^A-Z0-9]', '', 'g') = ${folded} THEN 1
        WHEN UPPER(u."plateText") LIKE ${rawUpper + "%"}                                                  THEN 2
        WHEN REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') LIKE ${normalized + "%"}         THEN 3
        WHEN REGEXP_REPLACE(TRANSLATE(UPPER(u."plateText"), 'ÄÖÜÁÀÂÉÈÊÍÎÓÔÚÛ', 'AOUAAAEEEIIOOUU'), '[^A-Z0-9]', '', 'g') LIKE ${folded + "%"} THEN 3
        ELSE 4
      END AS sort_order
    FROM "Upload" u
    WHERE u."deletedAt" IS NULL
      AND u.hidden = false
      AND (
        UPPER(u."plateText")                                                        LIKE ${"%" + rawUpper + "%"}
        OR REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g')              LIKE ${"%" + normalized + "%"}
        OR REGEXP_REPLACE(TRANSLATE(UPPER(u."plateText"), 'ÄÖÜÁÀÂÉÈÊÍÎÓÔÚÛ', 'AOUAAAEEEIIOOUU'), '[^A-Z0-9]', '', 'g') LIKE ${"%" + folded + "%"}
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-8">

      {/* ─── Search bar ─── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-50 mb-4">Search</h1>
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
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Spotters</h2>
          <div className="flex flex-wrap gap-3">
            {userResults.map((u) => (
              <a key={u.numericId} href={`/u/${u.numericId}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-indigo-700/60 hover:bg-zinc-900 hover:-translate-y-0.5 transition-all">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 grid place-items-center text-xs font-bold text-indigo-300">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-zinc-100">@{u.username}</div>
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
                      <div className="mt-2 text-xs text-zinc-600">@{u.user.username}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}


      {!isHashtagQuery && !hasQuery ? (
        <div className="mt-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base font-semibold text-zinc-300">Search the vault</p>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">Type a plate number above — works with dashes, spaces, or none. AB-123-CD, AB123CD, same thing.</p>
        </div>
      ) : !isHashtagQuery && results.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="text-5xl mb-4">🪪</div>
          <p className="text-base font-semibold text-zinc-300">Nothing in the vault</p>
          <p className="mt-2 text-sm text-zinc-500">No plates found for <span className="font-mono text-zinc-300">"{query}"</span>. Try a shorter format.</p>
        </div>
      ) : !isHashtagQuery ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((u) => {
            const meta = COUNTRY_META[u.country] ?? { iso: null, name: u.country };
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
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-600">@{u.user.username}</span>
                    <span className="text-zinc-700">{relativeDays(u.createdAt)}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
