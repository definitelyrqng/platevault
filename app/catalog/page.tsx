import { prisma } from "@/app/lib/prisma";
import { CAR_DATA, BRANDS } from "@/app/lib/carData";

export const dynamic = "force-dynamic";

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getCatalogData() {
  const rows = await prisma.upload.groupBy({
    by: ["brand"],
    where: { deletedAt: null, hidden: false, brand: { not: null } },
    _count: { id: true },
  });
  const countByBrand: Record<string, number> = {};
  for (const r of rows) if (r.brand) countByBrand[r.brand] = r._count.id;
  return countByBrand;
}

export default async function CatalogPage() {
  const counts = await getCatalogData();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Catalog</p>
        <h1 className="text-3xl font-bold">Vehicle Catalog</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Browse spotted plates by make and model.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((brand) => {
          const models = Object.keys(CAR_DATA[brand] ?? {});
          const spotted = counts[brand] ?? 0;
          return (
            <a
              key={brand}
              href={`/catalog/${toSlug(brand)}`}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-600 hover:bg-zinc-900/70 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {brand}
                </span>
                {spotted > 0 && (
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    {spotted} spotted
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {models.length} model{models.length !== 1 ? "s" : ""}
                {" · "}
                {models.reduce((n, m) => n + Object.keys(CAR_DATA[brand][m]).length, 0)} generations
              </p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {models.slice(0, 4).map((m) => (
                  <span key={m} className="rounded-lg bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-400">
                    {m}
                  </span>
                ))}
                {models.length > 4 && (
                  <span className="rounded-lg bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500">
                    +{models.length - 4} more
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
