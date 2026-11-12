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

  // A–Z: every make under the letter it starts with ("#" for names that start with a digit)
  const letterOf = (name: string) => {
    const c = name.trim().charAt(0).toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "");
    return c || "#";
  };
  const sorted = [...brands].sort((x, y) => x.name.localeCompare(y.name, "en", { sensitivity: "base", numeric: true }));
  const groups = new Map<string, BrandRow[]>();
  for (const br of sorted) {
    const l = letterOf(br.name);
    groups.set(l, [...(groups.get(l) ?? []), br]);
  }
  const letters = [...groups.keys()].sort((x, y) => (x === "#" ? 1 : y === "#" ? -1 : x.localeCompare(y)));
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

      {/* A–Z jump bar */}
      <nav aria-label="Jump to letter" className="sticky top-14 z-20 -mx-4 border-b border-zinc-800/60 bg-zinc-950/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-3">
        <ul className="flex flex-wrap items-center gap-0.5 text-sm">
          {ALPHABET.map((l) => {
            const has = groups.has(l);
            return (
              <li key={l}>
                {has
                  ? <a href={"#letter-" + l} className="grid h-7 w-7 place-items-center rounded-md font-semibold text-zinc-200 transition-colors hover:bg-indigo-600 hover:text-white">{l}</a>
                  : <span className="grid h-7 w-7 place-items-center text-zinc-700">{l}</span>}
              </li>
            );
          })}
          {groups.has("#") && <li><a href="#letter-%23" className="grid h-7 w-7 place-items-center rounded-md font-semibold text-zinc-200 hover:bg-indigo-600 hover:text-white">#</a></li>}
        </ul>
      </nav>

      <div className="mt-6 space-y-10">
        {letters.map((l) => {
          const list = groups.get(l) ?? [];
          const spotted = list.filter((br) => (countByBrand.get(br.name) ?? 0) > 0);
          const waiting = list.filter((br) => (countByBrand.get(br.name) ?? 0) === 0);
          return (
            <section key={l} id={"letter-" + l} className="scroll-mt-28">
              <div className="mb-3 flex items-baseline gap-3 border-b border-zinc-800/60 pb-2">
                <h2 className="text-2xl font-bold text-white">{l}</h2>
                <span className="text-xs tabular-nums text-zinc-500">{list.length} make{list.length === 1 ? "" : "s"}</span>
              </div>

              {spotted.length > 0 && (
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
                </div>
              )}

              {waiting.length > 0 && (
                <div className={"flex flex-wrap gap-2 " + (spotted.length > 0 ? "mt-3" : "")}>
                  {waiting.map((br) => (
                    <a key={br.id} href={"/catalog/" + toSlug(br.name)}
                      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
                      {br.name} <span className="ml-1 text-xs tabular-nums text-zinc-600">{br.models.length}</span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {brands.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            Nothing in the catalog yet. <a href="/upload" className="text-indigo-300 hover:underline">Upload the first spot →</a>
          </p>
        )}
        {isSuperAdmin && <div className="pt-2"><AddBrandButton /></div>}
      </div>
    </main>
  );
}
