import { prisma } from "@/app/lib/prisma";
import { getSessionUser } from "@/app/lib/session";
import { notFound } from "next/navigation";
import { CodeChip } from "@/app/components/GenerationLabel";
import { codesOf, toSlug, yearSpan } from "@/app/lib/chassis";
import { AddModelButton, DeleteBrandButton, DeleteModelButton, RenameBrandButton, RenameModelButton } from "../CatalogAdminControls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const name = brand.charAt(0).toUpperCase() + brand.slice(1);
  return {
    title: name,
    description: `Browse all spotted license plates for ${name} vehicles on PlateVault.`,
    openGraph: { title: `${name} · PlateVault`, description: `Every ${name} plate in the archive.` },
  };
}

type GenRow = { id: number; name: string };
type ModelRow = { id: number; name: string; generations: GenRow[] };
type BrandRow = { id: number; name: string; models: ModelRow[] };

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params;

  const [currentUser, allBrands] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      orderBy: { name: "asc" },
      include: { models: { orderBy: { name: "asc" }, include: { generations: { orderBy: { name: "asc" }, select: { id: true, name: true } } } } },
    }) as Promise<BrandRow[]>,
  ]);
  const brand = allBrands.find((b) => toSlug(b.name) === brandSlug);
  if (!brand) return notFound();
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";

  const visible = { brand: brand.name, deletedAt: null, hidden: false };
  const [modelCounts, covers] = await Promise.all([
    prisma.upload.groupBy({ by: ["model"], where: { ...visible, model: { not: null } }, _count: { id: true } }),
    prisma.upload.findMany({
      where: { ...visible, model: { not: null } },
      orderBy: { createdAt: "desc" },
      distinct: ["model"],
      select: { model: true, imageUrl: true },
    }),
  ]);
  const countByModel = new Map(modelCounts.map((r) => [r.model ?? "", r._count.id]));
  const coverByModel = new Map(covers.map((r) => [r.model ?? "", r.imageUrl]));
  const totalSpots = [...countByModel.values()].reduce((a, b) => a + b, 0);
  const totalGens = brand.models.reduce((n, m) => n + m.generations.length, 0);

  // Models with spots first, then the rest A–Z
  const models = [...brand.models].sort(
    (a, b) => (countByModel.get(b.name) ?? 0) - (countByModel.get(a.name) ?? 0) || a.name.localeCompare(b.name),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <nav className="mb-5 text-xs text-zinc-500">
        <a href="/catalog" className="transition-colors hover:text-zinc-300">Catalog</a>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-300">{brand.name}</span>
      </nav>

      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Make</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{brand.name}</h1>
            <p className="mt-2 text-sm tabular-nums text-zinc-400">
              {totalSpots} spot{totalSpots === 1 ? "" : "s"} · {brand.models.length} model{brand.models.length === 1 ? "" : "s"} · {totalGens} generation{totalGens === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && <><RenameBrandButton brandId={brand.id} current={brand.name} /><DeleteBrandButton brandId={brand.id} /></>}
            <a href="/upload" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">↑ Upload a spot</a>
          </div>
        </div>

      </header>

      {/* Models */}
      <section className="mt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((m) => {
            const n = countByModel.get(m.name) ?? 0;
            const cover = coverByModel.get(m.name);
            const names = m.generations.map((g) => g.name);
            const span = yearSpan(names);
            const codes = codesOf(names).slice(0, 4);
            return (
              <div key={m.id}
                className={`group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800/80 transition hover:ring-indigo-500/60 ${n === 0 ? "opacity-70 hover:opacity-100" : ""}`}>
                <a href={`/catalog/${brandSlug}/${toSlug(m.name)}`} className="absolute inset-0 z-10" aria-label={`${brand.name} ${m.name}`} />
                {cover ? (
                  <img src={cover} alt="" loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-zinc-800/60 to-zinc-900 font-plate text-5xl text-white/[0.06]" aria-hidden="true">
                    {m.name.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {isSuperAdmin && (
                  <div className="absolute right-2 top-2 z-20 flex gap-1.5">
                    <RenameModelButton modelId={m.id} current={m.name} />
                    <DeleteModelButton modelId={m.id} />
                  </div>
                )}

                <div className="relative p-3.5">
                  <div className="truncate text-base font-semibold text-white">{m.name}</div>
                  <div className="mt-0.5 text-xs tabular-nums text-white/70">
                    {n > 0 ? `${n} spot${n === 1 ? "" : "s"}` : "no spots yet"} · {m.generations.length} gen{m.generations.length === 1 ? "" : "s"}
                    {span && <> · {span}</>}
                  </div>
                  {codes.length > 0 && (
                    <div className="relative z-20 mt-2 flex flex-wrap gap-1">
                      {codes.map((c) => <CodeChip key={c} brandSlug={brandSlug} modelSlug={toSlug(m.name)} raw={c} code={c} className="bg-black/40 backdrop-blur" />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {isSuperAdmin && <div className="pt-6"><AddModelButton brandId={brand.id} /></div>}
      </section>
    </main>
  );
}
