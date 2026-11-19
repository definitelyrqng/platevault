import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import { prisma } from "@/app/lib/prisma";
import { isRegionMapCountry, REGION_MAP_FILE, REGION_UNIT, regionCodeOf } from "@/app/lib/regionMaps";
import RegionMap from "./RegionMap";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  return isRegionMapCountry(country.toLowerCase())
    ? { title: REGION_UNIT[country.toLowerCase() as keyof typeof REGION_UNIT].title, description: "Every region on one map: click one to see the plates spotted there." }
    : {};
}

export default async function CountryMapPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: raw } = await params;
  const country = raw.toLowerCase();
  if (!isRegionMapCountry(country)) notFound();
  const meta = getCountryMeta(country);
  const unit = REGION_UNIT[country];

  const uploads = await prisma.upload.findMany({
    where: { country, deletedAt: null, hidden: false },
    select: { plateText: true, plateRegion: true },
  });
  const counts: Record<string, number> = {};
  for (const u of uploads) {
    const code = regionCodeOf(country, u.plateText, u.plateRegion);
    if (code) counts[code] = (counts[code] ?? 0) + 1;
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-white">{unit.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">Every {unit.singular}, coloured by how many plates we have from there.</p>
          </div>
        </div>
        <a href={`/c/${country}`} className="text-sm text-zinc-400 transition-colors hover:text-white">All {meta.name} plates →</a>
      </div>
      <RegionMap country={country} dataUrl={REGION_MAP_FILE[country]} counts={counts} unit={unit} />
    </main>
  );
}
