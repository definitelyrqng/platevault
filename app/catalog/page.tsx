import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { AddBrandButton } from "./CatalogAdminControls";

export const dynamic = "force-dynamic";

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

type BrandRow = { id: number; name: string; models: { id: number; name: string; generations: { id: number }[] }[] };

export default async function CatalogPage() {
  const [currentUser, brands, spotCounts] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      orderBy: { name: "asc" },
      include: {
        models: {
          orderBy: { name: "asc" },
          include: { generations: { select: { id: true } } },
        },
      },
    }) as Promise<BrandRow[]>,
    prisma.upload.groupBy({
      by: ["brand"],
      where: { deletedAt: null, hidden: false, brand: { not: null } },
      _count: { id: true },
    }),
  ]);

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const countByBrand: Record<string, number> = {};
  for (const r of spotCounts) if (r.brand) countByBrand[r.brand] = r._count.id;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="mt-1.5 h-5 w-1 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Vehicle Catalog</p>
            <h1 className="text-3xl font-bold">Browse by Make</h1>
            <p className="mt-2 text-sm text-zinc-400">Explore spotted plates organised by brand and model.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const genCount = brand.models.reduce((n, m) => n + m.generations.length, 0);
          const spotted  = countByBrand[brand.name] ?? 0;
          return (
            <a
              key={brand.id}
              href={"/catalog/" + toSlug(brand.name)}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-lg hover:shadow-indigo-950/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {brand.name}
                </span>
                {spotted > 0 && (
                  <span className="shrink-0 rounded-full border border-indigo-900/40 bg-indigo-950/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                    {spotted} spotted
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {brand.models.length} model{brand.models.length !== 1 ? "s" : ""}
                {" · "}
                {genCount} generation{genCount !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {brand.models.slice(0, 4).map((m) => (
                  <span key={m.id} className="rounded-lg bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-400">
                    {m.name}
                  </span>
                ))}
                {brand.models.length > 4 && (
                  <span className="rounded-lg bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500">
                    +{brand.models.length - 4} more
                  </span>
                )}
              </div>
            </a>
          );
        })}

        {isSuperAdmin && <AddBrandButton />}
      </div>
    </main>
  );
}
