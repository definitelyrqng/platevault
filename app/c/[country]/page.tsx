import Flag from "@/app/components/Flag";
import SpotCard from "@/app/components/SpotCard";
import { getCountryMeta } from "@/app/lib/countries";
import { plateTypeLabel } from "@/app/lib/plateTypes";
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
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const [{ country: rawCountry }, sp] = await Promise.all([params, searchParams]);
  const country = rawCountry.toLowerCase();
  const meta = getCountryMeta(country);
  // ?type= may hold several IDs (comma-separated) that share one display name
  const type = sp.type || null;
  const selectedTypes = type ? type.split(",").filter(Boolean) : [];
  const page = Math.max(1, Number(sp.page) || 1);

  const base = { country, deletedAt: null, hidden: false };
  const where = selectedTypes.length ? { ...base, plateType: { in: selectedTypes } } : base;

  const [uploads, filteredCount, totalCount, typeGroups, spotterGroups, currentUser] = await Promise.all([
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
  ]);

  // Merge stored type IDs that share a display name into one filter chip
  const chips: { label: string; types: string[]; count: number }[] = [];
  for (const g of typeGroups) {
    if (!g.plateType) continue;
    const label = plateTypeLabel(country, g.plateType) ?? g.plateType;
    const chip = chips.find((c) => c.label === label);
    if (chip) { chip.types.push(g.plateType); chip.count += g._count.id; }
    else chips.push({ label, types: [g.plateType], count: g._count.id });
  }
  chips.sort((a, b) => b.count - a.count);
  const chipActive = (c: { types: string[] }) =>
    selectedTypes.length > 0 && selectedTypes.every((t) => c.types.includes(t));

  const uploadHref = UPLOAD_COUNTRIES.has(country) ? `/upload/${country}` : "/upload";
  const pages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const href = (p: { type?: string | null; page?: number }) => {
    const qs = new URLSearchParams();
    const t = p.type === undefined ? type : p.type;
    if (t) qs.set("type", t);
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

      {/* ─── Plate type filter ─── */}
      {chips.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <a href={href({ type: null })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              !type ? "border-indigo-500 bg-indigo-600 text-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
            }`}>
            All <span className="ml-1 opacity-70 tabular-nums">{totalCount}</span>
          </a>
          {chips.map((c) => (
            <a key={c.label} href={href({ type: c.types.join(",") })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                chipActive(c) ? "border-indigo-500 bg-indigo-600 text-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}>
              {c.label} <span className="ml-1 opacity-70 tabular-nums">{c.count}</span>
            </a>
          ))}
        </div>
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
