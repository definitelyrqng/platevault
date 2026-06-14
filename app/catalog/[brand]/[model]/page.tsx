import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AddGenerationButton, DeleteGenerationButton } from "../../CatalogAdminControls";

export const dynamic = "force-dynamic";

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

export default async function ModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;

  const [currentUser, allBrands] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      include: {
        models: {
          include: { generations: { orderBy: { name: "asc" } } },
        },
      },
    }) as Promise<BrandRow[]>,
  ]);

  const brandData = allBrands.find((b) => toSlug(b.name) === brandSlug);
  if (!brandData) return notFound();

  const modelData = brandData.models.find((m) => toSlug(m.name) === modelSlug);
  if (!modelData) return notFound();

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const gens = modelData.generations;

  const spots = await prisma.upload.findMany({
    where: { brand: brandData.name, model: modelData.name, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, numericId: true, plateText: true, plateType: true,
      generation: true, badge: true, color: true,
      imageUrl: true, createdAt: true,
      user: { select: { username: true, numericId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const byGen: Record<string, typeof spots> = {};
  for (const g of gens) byGen[g.name] = [];
  for (const s of spots) {
    const g = s.generation ?? "__other__";
    if (byGen[g]) byGen[g].push(s);
    else { byGen["__other__"] = byGen["__other__"] ?? []; byGen["__other__"].push(s); }
  }
  const ungrouped = byGen["__other__"] ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-1 text-xs text-zinc-500">
        <a href="/catalog" className="hover:text-zinc-300 transition-colors">Catalog</a>
        <span className="mx-1.5 text-zinc-700">&#8250;</span>
        <a href={"/catalog/" + brandSlug} className="hover:text-zinc-300 transition-colors">{brandData.name}</a>
        <span className="mx-1.5 text-zinc-700">&#8250;</span>
        <span className="text-zinc-400">{modelData.name}</span>
      </div>

      <div className="mt-4 mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{brandData.name} {modelData.name}</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {spots.length === 0
              ? "No spots yet"
              : spots.length + " spot" + (spots.length !== 1 ? "s" : "") + " across " + gens.length + " generation" + (gens.length !== 1 ? "s" : "")}
          </p>
        </div>
        <a href="/upload" className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white shrink-0 transition-colors">
          Upload a spot
        </a>
      </div>

      {gens.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {gens.map((g) => {
            const count = byGen[g.name]?.length ?? 0;
            return (
              <a
                key={g.id}
                href={"#" + toSlug(g.name)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
              >
                {g.name}
                {count > 0 && <span className="text-zinc-500">{count}</span>}
              </a>
            );
          })}
        </div>
      )}

      <div className="space-y-14">
        {gens.map((gen) => {
          const gSpots = byGen[gen.name] ?? [];
          return (
            <section key={gen.id} id={toSlug(gen.name)}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{gen.name}</h2>
                  <p className="text-xs text-zinc-500">{gSpots.length} spot{gSpots.length !== 1 ? "s" : ""}</p>
                  {isSuperAdmin && <DeleteGenerationButton genId={gen.id} />}
                </div>
                <div className="flex-1 border-t border-zinc-800 ml-2" />
              </div>

              {gSpots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center">
                  <p className="text-sm text-zinc-600">No spots for this generation yet.</p>
                  <a href="/upload" className="mt-1 inline-block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Upload one &#8250;
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
                    {gSpots.slice(0, 10).map((s) => (
                      <a
                        key={s.id + "-thumb"}
                        href={"/spot/" + s.numericId}
                        className="group shrink-0 w-32 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors"
                      >
                        <div className="aspect-video bg-zinc-900 overflow-hidden">
                          <img
                            src={s.imageUrl}
                            alt={s.plateText}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-2 py-1">
                          <p className="font-mono text-[10px] font-bold tracking-widest text-zinc-300 truncate">{s.plateText}</p>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gSpots.map((u) => (
                      <div
                        key={u.id}
                        className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-600 transition-colors"
                      >
                        <a href={"/spot/" + u.numericId} className="absolute inset-0 z-0" aria-label={u.plateText} />
                        <div className="relative bg-zinc-950 aspect-video overflow-hidden">
                          <img
                            src={u.imageUrl}
                            alt={u.plateText + " plate"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex flex-col gap-2 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-mono text-lg font-bold tracking-widest text-zinc-100">{u.plateText}</div>
                              {(u.badge || u.color) && (
                                <div className="text-xs text-zinc-400 mt-0.5">
                                  {[u.badge, u.color].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                            {u.plateType && (
                              <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                                {u.plateType.replace(/-/g, " ")}
                              </span>
                            )}
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800">
                            <a href={"/u/" + u.user.numericId} className="relative z-10 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                              @{u.user.username}
                            </a>
                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                              <span>{relativeDays(u.createdAt)}</span>
                              <span>&#128172; {u._count.comments}</span>
                              <span>&#10084; {u._count.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-2">
            <AddGenerationButton modelId={modelData.id} />
          </div>
        )}

        {ungrouped.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-semibold text-zinc-500">Untagged</h2>
              <div className="flex-1 border-t border-zinc-800 ml-2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ungrouped.map((u) => (
                <a key={u.id} href={"/spot/" + u.numericId}
                  className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-600 transition-colors">
                  <div className="bg-zinc-950 aspect-video overflow-hidden">
                    <img src={u.imageUrl} alt={u.plateText}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="font-mono text-base font-bold tracking-widest text-zinc-100">{u.plateText}</div>
                    <div className="mt-1 text-xs text-zinc-500">@{u.user.username}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
