import Flag from "@/app/components/Flag";
import PlateBadge from "@/app/components/PlateBadge";
import SpotCard from "@/app/components/SpotCard";
import { getCountryMeta } from "@/app/lib/countries";
import { plateTypeLabel } from "@/app/lib/plateTypes";
import { catalogPlateTypes } from "@/app/lib/countryPlateTypes";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import LikeButton from "./LikeButton";

const PAGE_SIZE = 48;
// Countries that have a dedicated upload form under /upload/<country>
const UPLOAD_COUNTRIES = new Set(["albania", "austria", "belgium", "bosnia", "bulgaria", "croatia", "czech", "germany"]);

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const meta = getCountryMeta(country);
  const title = `${meta.name} Plates`;
  const desc = `Browse all license plates spotted in ${meta.name} on PlateVault.`;
  return {
    title,
    description: desc,
    openGraph: { title: `${title} · PlateVault`, description: desc },
  };
}


async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ type?: string; page?: string; q?: string; brand?: string; user?: string; from?: string; to?: string }>;
}) {
  const [{ country: rawCountry }, sp] = await Promise.all([params, searchParams]);
  const country = rawCountry.toLowerCase();
  const meta = getCountryMeta(country);
  // ?type= may hold several IDs (comma-separated) that share one display name
  const type = sp.type || null;
  const selectedTypes = type ? type.split(",").filter(Boolean) : [];
  const page = Math.max(1, Number(sp.page) || 1);

  const base = { country, deletedAt: null, hidden: false };
  const q = (sp.q ?? "").trim().slice(0, 30);
  const brandQ = (sp.brand ?? "").trim().slice(0, 40);
  const userQ = (sp.user ?? "").trim().slice(0, 40);
  const validDate = (v?: string) => (v && /^d{4}-d{2}-d{2}$/.test(v) && !isNaN(Date.parse(v)) ? new Date(v) : null);
  const fromD = validDate(sp.from);
  const toD = validDate(sp.to);
  const lookupActive = !!(q || brandQ || userQ || fromD || toD);
  const where: Record<string, unknown> = { ...base };
  if (selectedTypes.length) where.plateType = { in: selectedTypes };
  if (q) where.plateText = { contains: q, mode: "insensitive" };
  if (brandQ) where.brand = { contains: brandQ, mode: "insensitive" };
  if (userQ) where.user = { username: { contains: userQ, mode: "insensitive" } };
  if (fromD || toD) where.createdAt = { ...(fromD ? { gte: fromD } : {}), ...(toD ? { lt: new Date(toD.getTime() + 86_400_000) } : {}) };

  const [uploads, filteredCount, totalCount, typeGroups, spotterGroups, currentUser, typeSamples, popular] = await Promise.all([
    prisma.upload.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        numericId: true,
        plateText: true,
        plateType: true,
        country: true,
        imageUrl: true,
        createdAt: true,
        userId: true,
        brand: true,
        model: true,
        user: { select: { username: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.upload.count({ where }),
    prisma.upload.count({ where: base }),
    prisma.upload.groupBy({
      by: ["plateType"],
      where: { ...base, plateType: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.upload.groupBy({ by: ["userId"], where: base }),
    getCurrentUser(),
    // a real plate of each type, for the overview tiles
    prisma.upload.findMany({
      where: { ...base, plateType: { not: null } },
      distinct: ["plateType"],
      orderBy: { createdAt: "desc" },
      select: { plateType: true, plateText: true },
    }),
    page === 1 && !type && !lookupActive
      ? prisma.upload.findMany({
          where: base,
          orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
          take: 8,
          select: { id: true, numericId: true, plateText: true, plateType: true, country: true, imageUrl: true, createdAt: true, userId: true, brand: true, model: true, user: { select: { username: true } }, _count: { select: { likes: true, comments: true } } },
        })
      : Promise.resolve([]),
  ]);
  const sampleOf = new Map(typeSamples.map((t) => [t.plateType as string, t.plateText]));

  // Merge stored type IDs that share a display name into one filter chip
  const chips: { label: string; types: string[]; count: number; sample?: string }[] = [];
  for (const g of typeGroups) {
    if (!g.plateType) continue;
    const label = plateTypeLabel(country, g.plateType) ?? g.plateType;
    const chip = chips.find((c) => c.label === label);
    if (chip) { chip.types.push(g.plateType); chip.count += g._count.id; }
    else chips.push({ label, types: [g.plateType], count: g._count.id, sample: sampleOf.get(g.plateType) });
  }
  chips.sort((a, b) => b.count - a.count);
  // plate types the upload form offers but nobody has spotted yet
  for (const e of catalogPlateTypes(country) ?? []) {
    const label = plateTypeLabel(country, e.type) ?? e.type;
    if (!chips.some((c) => c.label === label)) chips.push({ label, types: [e.type], count: 0, sample: e.sample });
  }
  const chipActive = (c: { types: string[] }) =>
    selectedTypes.length > 0 && selectedTypes.every((t) => c.types.includes(t));

  const uploadHref = UPLOAD_COUNTRIES.has(country) ? `/upload/${country}` : "/upload";
  const pages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const href = (p: { type?: string | null; page?: number }) => {
    const qs = new URLSearchParams();
    const t = p.type === undefined ? type : p.type;
    if (t) qs.set("type", t);
    if (q) qs.set("q", q);
    if (brandQ) qs.set("brand", brandQ);
    if (userQ) qs.set("user", userQ);
    if (sp.from) qs.set("from", sp.from);
    if (sp.to) qs.set("to", sp.to);
    if (p.page && p.page > 1) qs.set("page", String(p.page));
    const s = qs.toString();
    return `/c/${country}${s ? `?${s}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">

      {/* ─── Header ─── */}
      <nav className="mb-4 text-xs text-zinc-500">
        <a href="/countries" className="transition-colors hover:text-zinc-300">Countries</a>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-300">{meta.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div className="flex items-center gap-4">
          <span className="leading-none shadow-md ring-1 ring-black/30"><Flag iso={meta.iso} size="lg" /></span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{meta.name}</h1>
            <p className="mt-1 text-sm text-zinc-400 tabular-nums">
              {totalCount.toLocaleString()} photo{totalCount === 1 ? "" : "s"} · {spotterGroups.length} spotter{spotterGroups.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <a href={uploadHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
          ↑ Upload a spot
        </a>
      </div>

      {/* ─── Plate types: what is in the archive ─── */}
      {chips.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Plate types</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {chips.map((c) => (
              <a key={c.label} href={href({ type: chipActive(c) ? null : c.types.join(","), page: 1 })}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  chipActive(c) ? "border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500/50" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                }`}>
                <span className="block h-[52px] w-full overflow-hidden text-center leading-[52px]">
                  {c.sample && <PlateBadge country={country} text={c.sample} plateType={c.types[0]} size="md" />}
                </span>
                <span className="text-sm font-medium text-zinc-200">{c.label}</span>
                <span className={`text-xs tabular-nums ${c.count ? "text-zinc-500" : "text-zinc-600"}`}>{c.count ? `${c.count.toLocaleString()} photo${c.count === 1 ? "" : "s"}` : "not spotted yet"}</span>
              </a>
            ))}
          </div>
          {type && <a href={href({ type: null })} className="mt-3 inline-block text-xs text-indigo-300 hover:text-indigo-200">× Show all plate types</a>}
        </section>
      )}

      {/* ─── Lookup ─── */}
      <form method="get" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Lookup in {meta.name}</h2>
        {type && <input type="hidden" name="type" value={type} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([["q", "Plate number", q], ["brand", "Brand", brandQ], ["user", "Spotter", userQ]] as const).map(([name, label, val]) => (
            <label key={name} className="text-xs text-zinc-500">{label}
              <input name={name} defaultValue={val} className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500" />
            </label>
          ))}
          <label className="text-xs text-zinc-500">From
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs text-zinc-500">To
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500" />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Search</button>
          {(lookupActive || type) && <a href={`/c/${country}`} className="text-xs text-zinc-400 hover:text-white">Clear</a>}
          {(lookupActive || type) && <span className="text-xs tabular-nums text-zinc-500">{filteredCount.toLocaleString()} result{filteredCount === 1 ? "" : "s"}</span>}
        </div>
      </form>

      {/* ─── Popular ─── */}
      {popular.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Popular</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {popular.map((u) => <SpotCard key={u.id} spot={u} showFlag={false} />)}
          </div>
          <h2 className="mb-3 mt-10 text-xs font-bold uppercase tracking-widest text-zinc-500">Latest</h2>
        </section>
      )}

      {/* ─── Grid ─── */}
      {uploads.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <div className="mx-auto w-fit leading-none"><Flag iso={meta.iso} size="lg" /></div>
          <div className="mt-4 text-sm font-medium text-zinc-200">No spots here yet</div>
          <p className="mt-1 text-sm text-zinc-500">Be the first to upload a plate from {meta.name}.</p>
          <a href={uploadHref} className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
            Upload now
          </a>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {uploads.map((u) => (
            <SpotCard
              key={u.id}
              spot={u}
              showFlag={false}
              action={
                <LikeButton
                  uploadId={u.id}
                  initialLikes={u._count.likes}
                  isOwner={currentUser?.id === u.userId}
                  isLoggedIn={!!currentUser}
                />
              }
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-1 text-sm" aria-label="Pagination">
          {page > 1 && (
            <a href={href({ page: page - 1 })} className="rounded-lg border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600 hover:text-white">← Prev</a>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-zinc-600">…</span>}
                <a href={href({ page: p })}
                  className={`min-w-9 rounded-lg px-3 py-2 text-center tabular-nums ${
                    p === page ? "bg-indigo-600 font-semibold text-white" : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}>
                  {p}
                </a>
              </span>
            ))}
          {page < pages && (
            <a href={href({ page: page + 1 })} className="rounded-lg border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600 hover:text-white">Next →</a>
          )}
        </nav>
      )}
    </main>
  );
}
