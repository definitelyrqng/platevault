import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AddModelButton, DeleteBrandButton, DeleteModelButton } from "../CatalogAdminControls";

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

type GenRow = { id: number; name: string };
type ModelRow = { id: number; name: string; generations: GenRow[] };
type BrandRow = { id: number; name: string; models: ModelRow[] };

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params;

  const [currentUser, allBrands] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      orderBy: { name: "asc" },
      include: {
        models: {
          orderBy: { name: "asc" },
          include: { generations: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
        },
      },
    }) as Promise<BrandRow[]>,
  ]);

  const brand = allBrands.find((b) => toSlug(b.name) === brandSlug);
  if (!brand) return notFound();

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";

  const spots = await prisma.upload.findMany({
    where: { brand: brand.name, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, numericId: true, imageUrl: true, model: true, plateText: true },
  });

  const byModel: Record<string, typeof spots> = {};
  for (const m of brand.models) byModel[m.name] = [];
  for (const s of spots) {
    const m = s.model ?? "";
    if (byModel[m]) byModel[m].push(s);
  }

  const totalSpots = spots.length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-1 text-xs text-zinc-500">
        <a href="/catalog" className="hover:text-indigo-400 transition-colors">Catalog</a>
        <span className="mx-1.5 text-zinc-700">&#8250;</span>
        <span className="text-zinc-400">{brand.name}</span>
      </div>

      <div className="mt-4 mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="mt-1.5 h-5 w-1 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {totalSpots} spot{totalSpots !== 1 ? "s" : ""} across {brand.models.length} model{brand.models.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && <DeleteBrandButton brandId={brand.id} />}
          <a href="/upload" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shrink-0 shadow-lg shadow-indigo-950/50 transition-colors">
            Upload a spot
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {brand.models.map((m) => {
          const count = byModel[m.name]?.length ?? 0;
          return (
            <a
              key={m.id}
              href={"#" + toSlug(m.name)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:text-indigo-300 transition-colors"
            >
              {m.name}
              {count > 0 && <span className="text-zinc-500">{count}</span>}
            </a>
          );
        })}
      </div>

      <div className="space-y-10">
        {brand.models.map((m) => {
          const mSpots = byModel[m.name] ?? [];
          return (
            <section key={m.id} id={toSlug(m.name)}>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-semibold">{m.name}</h2>
                  <span className="text-sm text-zinc-500">{mSpots.length} spot{mSpots.length !== 1 ? "s" : ""}</span>
                  {isSuperAdmin && <DeleteModelButton modelId={m.id} />}
                </div>
                <a
                  href={"/catalog/" + brandSlug + "/" + toSlug(m.name)}
                  className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  View all &#8250;
                </a>
              </div>

              <p className="text-xs text-zinc-600 mb-3">
                {m.generations.map((g) => g.name).join(" · ")}
              </p>

              {mSpots.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-800 px-5 py-6">
                  <span className="text-sm text-zinc-600">No spots yet.</span>
                  <a href="/upload" className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors">Be the first &#8250;</a>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {mSpots.slice(0, 12).map((s) => (
                    <a
                      key={s.id}
                      href={"/spot/" + s.numericId}
                      className="group shrink-0 w-36 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-800/60 hover:shadow-md hover:shadow-indigo-950/30 transition-all"
                    >
                      <div className="aspect-video bg-zinc-900 overflow-hidden">
                        <img
                          src={s.imageUrl}
                          alt={s.plateText}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="font-mono text-[11px] font-bold tracking-widest text-zinc-200 truncate">{s.plateText}</p>
                      </div>
                    </a>
                  ))}
                  {mSpots.length > 12 && (
                    <a
                      href={"/catalog/" + brandSlug + "/" + toSlug(m.name)}
                      className="shrink-0 w-36 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      +{mSpots.length - 12} more
                    </a>
                  )}
                </div>
              )}
            </section>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4">
            <AddModelButton brandId={brand.id} />
          </div>
        )}
      </div>
    </main>
  );
}
