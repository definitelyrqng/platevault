import { prisma } from "@/app/lib/prisma";
import { plateTypeLabel } from "@/app/lib/plateTypes";
import { getSessionUser } from "@/app/lib/session";
import { notFound } from "next/navigation";
import SpotCard, { PhotoPill } from "@/app/components/SpotCard";
import GenerationLink from "@/app/components/GenerationLink";
import { codeSlug, codesOf, hasCode, toSlug, yearSpan } from "@/app/lib/chassis";
import { AddGenerationButton, DeleteGenerationButton, RenameGenerationButton } from "../../CatalogAdminControls";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

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
  searchParams: Promise<{ platform?: string; page?: string }>;
}) {
  const [{ brand: brandSlug, model: modelSlug }, sp] = await Promise.all([params, searchParams]);
  const platform = sp.platform ? codeSlug(sp.platform) : null;
  const requestedPage = Math.max(1, Number(sp.page) || 1);

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
  const base = `/catalog/${brandSlug}/${modelSlug}`;
  const fullName = `${brandData.name} ${modelData.name}`;
  const select = {
    id: true, numericId: true, plateText: true, plateType: true, country: true,
    generation: true, brand: true, model: true, imageUrl: true, createdAt: true,
    user: { select: { username: true } },
    _count: { select: { likes: true, comments: true } },
  } as const;

  const card = (s: { id: string; plateType: string | null; country: string } & Parameters<typeof SpotCard>[0]["spot"]) => {
    const type = plateTypeLabel(s.country, s.plateType);
    return <SpotCard key={s.id} spot={s} badge={type && type !== "Standard" ? <PhotoPill>{type}</PhotoPill> : undefined} />;
  };

  /* ───────────────────────────────────────────────────────────────────────────
     Results view — "License plates found N / You have searched: …" (PlatesMania style)
     e.g. ?platform=c8 → every A7 Sportback C8, facelift included.
     ─────────────────────────────────────────────────────────────────────────── */
  if (platform) {
    const matching = modelData.generations.filter((g) => hasCode(g.name, platform));
    const genNames = matching.map((g) => g.name);
    const activeCode = codesOf(genNames).find((c) => codeSlug(c) === platform) ?? platform.toUpperCase();
    const where = { brand: brandData.name, model: modelData.name, deletedAt: null, hidden: false, generation: { in: genNames } };

    const perGen = genNames.length ? await prisma.upload.groupBy({ by: ["generation"], where, _count: { id: true } }) : [];
    const countByGen = new Map(perGen.map((r) => [r.generation ?? "", r._count.id]));
    const total = [...countByGen.values()].reduce((a, b) => a + b, 0);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(requestedPage, pages);                 // a page number past the end lands on the last page
    const spots = total
      ? await prisma.upload.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select })
      : [];
    const span = yearSpan(genNames);
    const pageHref = (n: number) => `${base}?platform=${platform}${n > 1 ? `&page=${n}` : ""}`;

    const pager = pages > 1 && (
      <nav className="my-6 flex flex-wrap items-center justify-center gap-1 text-sm" aria-label="Pagination">
        {page > 1 && <a href={pageHref(page - 1)} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600 hover:text-white">«</a>}
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
          .map((p, i, arr) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-zinc-600">…</span>}
              <a href={pageHref(p)} aria-current={p === page ? "page" : undefined}
                className={`min-w-9 rounded-md px-3 py-2 text-center tabular-nums ${
                  p === page ? "bg-indigo-600 font-semibold text-white" : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"}`}>{p}</a>
            </span>
          ))}
        {page < pages && <a href={pageHref(page + 1)} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600 hover:text-white">»</a>}
      </nav>
    );

    return (
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <nav className="mb-5 text-xs text-zinc-500">
          <a href="/catalog" className="transition-colors hover:text-zinc-300">Catalog</a>
          <span className="mx-1.5 text-zinc-700">/</span>
          <a href={`/catalog/${brandSlug}`} className="transition-colors hover:text-zinc-300">{brandData.name}</a>
          <span className="mx-1.5 text-zinc-700">/</span>
          <a href={base} className="transition-colors hover:text-zinc-300">{modelData.name}</a>
          <span className="mx-1.5 text-zinc-700">/</span>
          <span className="text-zinc-300">{activeCode}</span>
        </nav>

        <header className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8" aria-label="Your search">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{fullName} · {activeCode}</p>
              <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                License plates found
                <span className="rounded-xl bg-indigo-500/15 px-3 py-0.5 tabular-nums text-indigo-200 ring-1 ring-indigo-500/30">{total.toLocaleString()}</span>
              </h1>
              <p className="mt-2 text-sm tabular-nums text-zinc-400">
                {genNames.length} generation{genNames.length === 1 ? "" : "s"}
                {span && <> · {span}</>}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
              <a href={base} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-center text-sm font-medium sm:flex-none text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white">
                Show all {modelData.name}
              </a>
              <a href="/upload" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500 sm:flex-none">↑ Upload a spot</a>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">You have searched</p>
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-sm font-medium text-indigo-100">
              <span className="text-indigo-400" aria-hidden="true">✓</span>
              {fullName} ({activeCode}{span ? `, ${span}` : ""})
            </p>
            {genNames.length > 0 && (
              <ul className="divide-y divide-zinc-800/70 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
                {genNames.map((n) => {
                  const c = countByGen.get(n) ?? 0;
                  return (
                    <li key={n} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0 text-zinc-300">{n}</span>
                      <span className={`shrink-0 text-xs tabular-nums ${c > 0 ? "text-zinc-400" : "text-zinc-600"}`}>{c} spot{c === 1 ? "" : "s"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </header>

        {total === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">
              {genNames.length === 0 ? `No ${modelData.name} generation is on the ${activeCode} platform.` : `Nobody has spotted a ${fullName} ${activeCode} yet.`}
            </p>
            <a href={base} className="mt-2 inline-block text-sm text-indigo-300 hover:underline">Show all {modelData.name} →</a>
          </div>
        ) : (
          <>
            {pager}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">{spots.map(card)}</div>
            {pager}
          </>
        )}
      </main>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     Gallery view — every generation of the model, newest spots first
     ─────────────────────────────────────────────────────────────────────────── */
  const gens = modelData.generations;
  const spots = await prisma.upload.findMany({
    where: { brand: brandData.name, model: modelData.name, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 200,
    select,
  });
  const byGen: Record<string, typeof spots> = {};
  for (const g of gens) byGen[g.name] = [];
  const ungrouped: typeof spots = [];
  for (const s of spots) {
    if (s.generation && byGen[s.generation]) byGen[s.generation].push(s);
    else ungrouped.push(s);
  }
  const span = yearSpan(gens.map((g) => g.name));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <nav className="mb-5 text-xs text-zinc-500">
        <a href="/catalog" className="transition-colors hover:text-zinc-300">Catalog</a>
        <span className="mx-1.5 text-zinc-700">/</span>
        <a href={`/catalog/${brandSlug}`} className="transition-colors hover:text-zinc-300">{brandData.name}</a>
        <span className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-300">{modelData.name}</span>
      </nav>

      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">{brandData.name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">{modelData.name}</h1>
            <p className="mt-2 text-sm tabular-nums text-zinc-400">
              {spots.length === 0 ? "No spots yet" : `${spots.length} spot${spots.length === 1 ? "" : "s"}`}
              {" · "}{gens.length} generation{gens.length === 1 ? "" : "s"}
              {span && <> · {span}</>}
            </p>
          </div>
          <a href="/upload" className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
            ↑ Upload a spot
          </a>
        </div>
      </header>

      {/* Jump to a generation — full names, as PlatesMania lists them */}
      {gens.length > 1 && (
        <nav className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Generations">
          {gens.map((g) => {
            const n = byGen[g.name].length;
            return (
              <a key={g.id} href={"#" + toSlug(g.name)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-indigo-500/60 hover:text-white ${
                  n > 0 ? "border-zinc-700 text-zinc-200" : "border-zinc-800 text-zinc-500"}`}>
                {g.name}
                {n > 0 && <span className="ml-1.5 text-zinc-500">{n}</span>}
              </a>
            );
          })}
        </nav>
      )}

      <div className="mt-10 space-y-14">
        {gens.map((gen) => {
          const gSpots = byGen[gen.name];
          return (
            <section key={gen.id} id={toSlug(gen.name)} className="scroll-mt-20">
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-800/70 pb-3">
                <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
                  <GenerationLink name={gen.name} brandSlug={brandSlug} modelSlug={modelSlug} />
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">{gSpots.map(card)}</div>
              )}
            </section>
          );
        })}

        {isSuperAdmin && <div><AddGenerationButton modelId={modelData.id} /></div>}

        {ungrouped.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-3 border-b border-zinc-800/70 pb-3">
              <h2 className="text-lg font-semibold text-zinc-400">Generation not set</h2>
              <span className="text-xs tabular-nums text-zinc-600">{ungrouped.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">{ungrouped.map(card)}</div>
          </section>
        )}

        {gens.length === 0 && <p className="text-sm text-zinc-500">No generations have been added for this model yet.</p>}
      </div>
    </main>
  );
}
