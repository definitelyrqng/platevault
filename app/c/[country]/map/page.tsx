import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import { prisma } from "@/app/lib/prisma";
import GermanyMap from "./GermanyMap";

export const revalidate = 300;

export const metadata: Metadata = { title: "Germany plate map", description: "Every German district on one map: click a district to see the plates spotted there." };

export default async function CountryMapPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: raw } = await params;
  const country = raw.toLowerCase();
  if (country !== "germany") notFound();            // only Germany has a map for now
  const meta = getCountryMeta(country);

  const groups = await prisma.upload.groupBy({
    by: ["plateRegion"],
    where: { country, deletedAt: null, hidden: false, plateRegion: { not: null } },
    _count: { id: true },
  });
  const counts: Record<string, number> = {};
  for (const g of groups) if (g.plateRegion) counts[g.plateRegion.toUpperCase()] = (counts[g.plateRegion.toUpperCase()] ?? 0) + g._count.id;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <nav className="mb-4 text-xs text-zinc-500">
        <a href="/countries" className="transition-colors hover:text-zinc-300">Countries</a>
        <span className="mx-1.5">/</span>
        <a href={`/c/${country}`} className="transition-colors hover:text-zinc-300">{meta.name}</a>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-300">Map</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="flex items-center gap-4">
          <span className="leading-none shadow-md ring-1 ring-black/30"><Flag iso={meta.iso} size="lg" /></span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Plate map of {meta.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">Every district, coloured by how many plates we have from there.</p>
          </div>
        </div>
        <a href={`/c/${country}`} className="text-sm text-zinc-400 transition-colors hover:text-white">All {meta.name} plates →</a>
      </div>
      <GermanyMap counts={counts} />
    </main>
  );
}
