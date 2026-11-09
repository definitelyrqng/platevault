import { prisma } from "@/app/lib/prisma";
import { plateTypeLabel } from "@/app/lib/plateTypes";
import { getSessionUser } from "@/app/lib/session";
import { notFound } from "next/navigation";
import SpotCard, { PhotoPill } from "@/app/components/SpotCard";
import GenerationLabel, { CodeChip } from "@/app/components/GenerationLabel";
import { codeSlug, codesOf, formatYears, hasCode, parseGeneration, toSlug, yearSpan } from "@/app/lib/chassis";
import { AddGenerationButton, DeleteGenerationButton, RenameGenerationButton } from "../../CatalogAdminControls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ brand: string; model: string }> }) {
  const { brand, model } = await params;
  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
  const modelName = model.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${brandName} ${modelName}`;
  const desc = `Browse all ${brandName} ${modelName} license plates spotted and archived on PlateVault.`;
  return {
    title,
    description: desc,
    openGraph: { title: `${title} · PlateVault`, description: desc },
  };
}

type GenRow = { id: number; name: string };
type ModelRow = { id: number; name: string; generations: GenRow[] };
type BrandRow = { id: number; name: string; models: ModelRow[] };

export default async function ModelPage({ params, searchParams }: {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<{ platform?: string }>;
}) {
  const [{ brand: brandSlug, model: modelSlug }, sp] = await Promise.all([params, searchParams]);
  const platform = sp.platform ? codeSlug(sp.platform) : null;

  const [currentUser, allBrands] = await Promise.all([
    getSessionUser(),
    (prisma as any).carBrand.findMany({
      include: { models: { include: { generations: { orderBy: { name: "asc" } } } } },
    }) as Promise<BrandRow[]>,
  ]);

  const brandData = allBrands.find((b) => toSlug(b.name) === brandSlug);
  if (!brandData) return notFound();
  const modelData = brandData.models.find((m) => toSlug(m.name) === modelSlug);
  if (!modelData) return notFound();

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const allGens = modelData.generations;
  // Platform filter: ONLY this model's generations that carry the code (e.g. A7 Sportback → its C8s)
  const gens = platform ? allGens.filter((g) => hasCode(g.name, platform)) : allGens;

  const spots = await prisma.upload.findMany({
    where: { brand: brandData.name, model: modelData.name, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, numericId: true, plateText: true, plateType: true, country: true,
      generation: true, brand: true, model: true, imageUrl: true, createdAt: true,
      user: { select: { username: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const byGen: Record<string, typeof spots> = {};
  for (const g of allGens) byGen[g.name] = [];
  const ungrouped: typeof spots = [];
  for (const s of spots) {
    if (s.generation && byGen[s.generation]) byGen[s.generation].push(s);
    else ungrouped.push(s);
  }
  // Spots whose generation text isn't in the catalog: show them only when no filter, or if they carry the code
  const shownUngrouped = platform ? ungrouped.filter((s) => hasCode(s.generation, platform)) : ungrouped;

  const platformCodes = codesOf(allGens.map((g) => g.name));
  const activeCode =
    platform ? platformCodes.find((c) => codeSlug(c) === platform) ?? platform.toUpperCase() : null;
  const shownSpotCount = gens.reduce((n, g) => n + byGen[g.name].length, 0) + shownUngrouped.length;
  const span = yearSpan(gens.map((g) => g.name));
  const base = `/catalog/${brandSlug}/${modelSlug}`;

  const card = (s: (typeof spots)[number]) => {
    const type = plateTypeLabel(s.country, s.plateType);
    return <SpotCard key={s.id} spot={s} badge={type && type !== "Standard" ? <PhotoPill>{type}</PhotoPill> : undefined} />;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <nav className="mb-5 text-xs text-zinc-500">
        <a href="/catalog" className="transition-colors hover:text-zinc-300">Catalog</a>
        <span className="mx-1.5 text-zinc-700">/</span>
        <a href={`/catalog/${brandSlug}`} className="transition-colors hover:text-zinc-300">{brandData.name}</a>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-300">{modelData.name}</span>
      </nav>

      {/* Header */}
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{brandData.name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {modelData.name}
              {activeCode && <span className="ml-3 rounded-lg border border-indigo-400/50 bg-indigo-500/15 px-2.5 py-1 align-middle font-mono text-lg font-semibold text-indigo-200 sm:text-xl">{activeCode}</span>}
            </h1>
            <p className="mt-2 text-sm tabular-nums text-zinc-400">
              {shownSpotCount === 0 ? "No spots yet" : `${shownSpotCount} spot${shownSpotCount === 1 ? "" : "s"}`}
              {" · "}{gens.length} generation{gens.length === 1 ? "" : "s"}
              {span && <> · {span}</>}
            </p>
          </div>
          <a href="/upload" className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
            ↑ Upload a spot
          </a>
        </div>

        {platformCodes.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Filter by platform
            {platformCodes.map((c) => {
              const active = codeSlug(c) === platform;
              return <CodeChip key={c} brandSlug={brandSlug} modelSlug={modelSlug} raw={c} code={c} active={active} href={active ? base : undefined} />;
            })}
            {platform && <a href={base} className="ml-1 text-zinc-400 underline underline-offset-4 transition-colors hover:text-white">Show all {modelData.name}</a>}
          </div>
        )}
      </header>

      {/* Jump chips */}
      {gens.length > 1 && (
        <nav className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Generations">
          {gens.map((g) => {
            const p = parseGeneration(g.name);
            const n = byGen[g.name].length;
            return (
              <a key={g.id} href={"#" + toSlug(g.name)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-indigo-500/60 hover:text-white ${
                  n > 0 ? "border-zinc-700 text-zinc-200" : "border-zinc-800 text-zinc-500"}`}>
                {p.label}{p.years ? <span className="ml-1.5 text-zinc-500">{formatYears(p.years)}</span> : null}
                {n > 0 && <span className="ml-1.5 rounded-full bg-indigo-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-indigo-300">{n}</span>}
              </a>
            );
          })}
        </nav>
      )}

      <div className="mt-10 space-y-14">
        {platform && gens.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">No {modelData.name} generation is on the {platform.toUpperCase()} platform.</p>
            <a href={base} className="mt-2 inline-block text-sm text-indigo-300 hover:underline">Show all {modelData.name} →</a>
          </div>
        )}

        {gens.map((gen) => {
          const gSpots = byGen[gen.name];
          return (
            <section key={gen.id} id={toSlug(gen.name)} className="scroll-mt-20">
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-800/70 pb-3">
                <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
                  <GenerationLabel name={gen.name} brandSlug={brandSlug} modelSlug={modelSlug} />
                </h2>
                <span className="text-xs tabular-nums text-zinc-500">{gSpots.length} spot{gSpots.length === 1 ? "" : "s"}</span>
                {isSuperAdmin && (
                  <span className="ml-auto flex items-center gap-2">
                    <RenameGenerationButton genId={gen.id} current={gen.name} />
                    <DeleteGenerationButton genId={gen.id} />
                  </span>
                )}
              </div>

              {gSpots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-8 text-center">
                  <p className="text-sm text-zinc-500">No spots for this generation yet.</p>
                  <a href="/upload" className="mt-1 inline-block text-xs text-zinc-400 transition-colors hover:text-indigo-300">Upload one →</a>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                  {gSpots.map(card)}
                </div>
              )}
            </section>
          );
        })}

        {isSuperAdmin && !platform && <div><AddGenerationButton modelId={modelData.id} /></div>}

        {shownUngrouped.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-3 border-b border-zinc-800/70 pb-3">
              <h2 className="text-lg font-semibold text-zinc-400">{platform ? `Other ${activeCode} spots` : "Generation not set"}</h2>
              <span className="text-xs tabular-nums text-zinc-600">{shownUngrouped.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {shownUngrouped.map(card)}
            </div>
          </section>
        )}

        {!platform && gens.length === 0 && (
          <p className="text-sm text-zinc-500">No generations have been added for this model yet.</p>
        )}
      </div>
    </main>
  );
}
