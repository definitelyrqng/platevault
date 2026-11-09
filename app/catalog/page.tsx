import { prisma } from "@/app/lib/prisma";
import { getSessionUser } from "@/app/lib/session";
import { toSlug } from "@/app/lib/chassis";
import { AddBrandButton } from "./CatalogAdminControls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vehicle Catalog",
  description: "Browse spotted plates organised by car brand and model. Find every generation of every make.",
  openGraph: { title: "Vehicle Catalog · PlateVault", description: "Every spotted plate, sorted by brand and model." },
};

type BrandRow = { id: number; name: string; models: { id: number; name: string; generations: { id: number }[] }[] };

export default async function CatalogPage() {
  const visible = { deletedAt: null, hidden: false, brand: { not: null } } as const;
  const [currentUser, brands, spotCounts, covers] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      orderBy: { name: "asc" },
      include: { models: { orderBy: { name: "asc" }, include: { generations: { select: { id: true } } } } },
    }) as Promise<BrandRow[]>,
    prisma.upload.groupBy({ by: ["brand"], where: visible, _count: { id: true } }),
    prisma.upload.findMany({ where: visible, orderBy: { createdAt: "desc" }, distinct: ["brand"], select: { brand: true, imageUrl: true } }),
  ]);

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const countByBrand = new Map(spotCounts.map((r) => [r.brand ?? "", r._count.id]));
  const coverByBrand = new Map(covers.map((r) => [r.brand ?? "", r.imageUrl]));

  const spotted = brands.filter((b) => (countByBrand.get(b.name) ?? 0) > 0)
    .sort((a, b) => (countByBrand.get(b.name) ?? 0) - (countByBrand.get(a.name) ?? 0) || a.name.localeCompare(b.name));
  const unspotted = brands.filter((b) => (countByBrand.get(b.name) ?? 0) === 0);

  const totalSpots = [...countByBrand.values()].reduce((a, b) => a + b, 0);
  const totalModels = brands.reduce((n, b) => n + b.models.length, 0);
  const totalGens = brands.reduce((n, b) => n + b.models.reduce((m, x) => m + x.generations.length, 0), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="border-b border-zinc-800/60 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Vehicle catalog</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Browse by make</h1>
        <p className="mt-2 text-sm tabular-nums text-zinc-400">
          {brands.length} brands · {totalModels} models · {totalGens} generations · {totalSpots.toLocaleString()} spots
        </p>
      </header>

      {/* Spotted makes: photo tiles */}
      <section className="mt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {spotted.map((brand) => {
            const n = countByBrand.get(brand.name) ?? 0;
            const cover = coverByBrand.get(brand.name);
            const gens = brand.models.reduce((x, m) => x + m.generations.length, 0);
            return (
              <a key={brand.id} href={"/catalog/" + toSlug(brand.name)}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800/80 transition hover:ring-indigo-500/70">
                {cover && (
                  <img src={cover} alt="" loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute right-2.5 top-2.5 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow">{n}</span>
                <div className="relative p-3.5">
                  <div className="truncate text-lg font-semibold text-white">{brand.name}</div>
                  <div className="text-xs tabular-nums text-white/70">{brand.models.length} model{brand.models.length === 1 ? "" : "s"} · {gens} generation{gens === 1 ? "" : "s"}</div>
                </div>
              </a>
            );
          })}
          {spotted.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
              Nothing has been spotted yet. <a href="/upload" className="text-indigo-300 hover:underline">Upload the first one →</a>
            </p>
          )}
        </div>
      </section>

      {/* Makes nobody has spotted yet */}
      {(unspotted.length > 0 || isSuperAdmin) && (
        <section className="mt-12">
          <h2 className="text-sm font-semibold text-zinc-200">Waiting for their first spot</h2>
          <p className="mt-0.5 text-xs text-zinc-500">In the catalog, but no plate has been archived yet.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unspotted.map((b) => (
              <a key={b.id} href={"/catalog/" + toSlug(b.name)}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
                {b.name} <span className="ml-1 text-xs tabular-nums text-zinc-600">{b.models.length}</span>
              </a>
            ))}
            {isSuperAdmin && <AddBrandButton />}
          </div>
        </section>
      )}
    </main>
  );
}
