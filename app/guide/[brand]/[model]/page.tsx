import { notFound } from "next/navigation";
import { CAR_DATA, getGenerations } from "@/app/lib/carData";

// ─── GUIDE CONTENT ────────────────────────────────────────────────────────────
// This is where you fill in the written content for each model's guide.
// Add an entry matching the brand + model keys from carData.ts.
//
// Structure per entry:
//   intro        — 1–2 sentences about the model
//   generations  — array of generation blocks (timeline cards)
//   facelifts    — array of before/after comparison blocks
//   trimNotes    — short text about trim differences
//   colorNote    — short note about color options
//
// Images: drop JPGs into /public/guide/<brand>/<model>/ and reference them as
//   "/guide/audi/a6/c7-front.jpg"  (lowercase, no spaces)
// ─────────────────────────────────────────────────────────────────────────────

type GenGuide = {
  name: string;          // matches the key in carData.ts
  years: string;
  tagline: string;       // one-liner
  bulletPoints: string[];
  imagePath?: string;    // optional photo
};

type FaceliftGuide = {
  title: string;         // e.g. "C7 vs C7 Facelift (C7.5)"
  before: { label: string; points: string[]; imagePath?: string };
  after:  { label: string; points: string[]; imagePath?: string };
};

type ModelGuide = {
  displayName: string;   // e.g. "Audi A6"
  intro: string;
  generations: GenGuide[];
  facelifts: FaceliftGuide[];
  trimNotes: string;
  colorNote: string;
};

const GUIDES: Record<string, Record<string, ModelGuide>> = {
  audi: {
    a6: {
      displayName: "Audi A6",
      intro:
        "The Audi A6 is Audi's executive saloon/estate, positioned above the A4 and below the A8. " +
        "The C7 generation (2011–2018) introduced a sleeker, more aerodynamic body and a full aluminium multi-link suspension.",
      generations: [
        {
          name: "C7 (2011–2014)",
          years: "2011 – 2014",
          tagline: "Pre-facelift — sharper lines, narrower headlights",
          bulletPoints: [
            "Single-frame grille with chrome surround",
            "Narrower, more angular headlight clusters",
            "Available with bi-xenon or LED headlights (LED was optional)",
            "Interior: older MMI 3G+ with physical rotary dial",
            "No standard LED taillights — often plain red units",
          ],
          imagePath: undefined, // TODO: add "/guide/audi/a6/c7-pre-facelift.jpg"
        },
        {
          name: "C7 Facelift (2014–2018)",
          years: "2014 – 2018",
          tagline: "Facelift (C7.5) — full LED standard, sharper face",
          bulletPoints: [
            "Full LED headlights became standard across most trims",
            "Revised grille — wider, more prominent chrome slats",
            "Updated bumpers front and rear — sharper, more angular",
            "LED taillights now standard",
            "Updated MMI with touchpad (replaced rotary dial on higher trims)",
            "New engine options including 272 hp 3.0 TDI",
          ],
          imagePath: undefined, // TODO: add "/guide/audi/a6/c7-facelift.jpg"
        },
      ],
      facelifts: [
        {
          title: "How to tell C7 vs C7 Facelift apart at a glance",
          before: {
            label: "C7 (2011–2014)",
            points: [
              "Headlights: narrower, more angular — xenon or halogen",
              "Front bumper: flatter lower grille opening",
              "Taillights: often plain red, no full LED strip",
              "Rear bumper: rounder diffuser area",
            ],
            imagePath: undefined,
          },
          after: {
            label: "C7 Facelift (2014–2018)",
            points: [
              "Headlights: full LED daytime running lights — wider look",
              "Front bumper: more aggressive lower intake, sharper crease",
              "Taillights: full LED strip across both sides",
              "Rear bumper: squared-off diffuser with chrome strip",
            ],
            imagePath: undefined,
          },
        },
      ],
      trimNotes:
        "UK trims run SE → SE Executive → S Line → S Line Plus → Black Edition. " +
        "S Line adds sport suspension, different bumpers and side skirts. " +
        "Black Edition adds gloss black exterior trim. " +
        "US market used Base / Premium / Premium Plus / Prestige.",
      colorNote:
        "Common colours to watch for: Daytona Grey Pearl Effect (dark metallic grey, very popular), " +
        "Scuba Blue Metallic (vivid blue, rare), Nardo Grey (flat grey, S/RS-focused). " +
        "Most A6s left the factory in Glacier White, Brilliant Black, or Floret Silver.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export default async function GuidePage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const guide = GUIDES[brandSlug.toLowerCase()]?.[modelSlug.toLowerCase()];

  // If no guide written yet, show a coming-soon placeholder
  if (!guide) {
    const brandKey = Object.keys(CAR_DATA).find(
      (b) => b.toLowerCase() === brandSlug.toLowerCase()
    );
    const modelKey = brandKey
      ? Object.keys(CAR_DATA[brandKey]).find(
          (m) => m.toLowerCase().replace(/\s+/g, "-") === modelSlug.toLowerCase()
        )
      : undefined;

    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">📖</div>
          <h1 className="text-2xl font-semibold">
            {modelKey ?? modelSlug.toUpperCase()} Guide
          </h1>
          <p className="mt-3 text-zinc-400">
            This guide is being written. Check back soon — it'll cover generation differences,
            facelift spotting tips, trim levels, and factory colour options.
          </p>
          <a
            href="/home"
            className="mt-6 inline-flex rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-2.5 text-sm text-zinc-200 hover:border-indigo-800/60 hover:text-indigo-300 hover:bg-indigo-950/20 transition-colors"
          >
            ← Back to PlateVault
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <a href="/home" className="hover:text-indigo-400 transition-colors">PlateVault</a>
          <span>›</span>
          <span>Guide</span>
          <span>›</span>
          <span className="text-zinc-300">{guide.displayName}</span>
        </div>

        {/* Hero */}
        <div className="rounded-3xl border border-indigo-900/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-zinc-950 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)"}} />
          <div className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Model Guide</div>
          <h1 className="text-3xl font-bold">{guide.displayName}</h1>
          <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">{guide.intro}</p>
        </div>

        {/* Generation timeline */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-1 rounded-full bg-indigo-500 shrink-0" />
            <h2 className="text-lg font-semibold">Generation timeline</h2>
          </div>
          <div className="space-y-4">
            {guide.generations.map((gen, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex gap-5">
                {/* Image placeholder */}
                <div className="hidden sm:flex shrink-0 w-32 h-24 rounded-xl bg-zinc-800 items-center justify-center text-zinc-600 text-xs text-center">
                  {gen.imagePath
                    ? <img src={gen.imagePath} alt={gen.name} className="w-full h-full object-cover rounded-xl" />
                    : <span>📷 photo<br />coming soon</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-zinc-100">{gen.name}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">{gen.years}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400 italic">{gen.tagline}</p>
                  <ul className="mt-2 space-y-1">
                    {gen.bulletPoints.map((p, j) => (
                      <li key={j} className="text-sm text-zinc-300 flex gap-2">
                        <span className="text-zinc-600 shrink-0">·</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Facelift comparisons */}
        {guide.facelifts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-4 w-1 rounded-full bg-indigo-500 shrink-0" />
              <h2 className="text-lg font-semibold">How to tell them apart</h2>
            </div>
            {guide.facelifts.map((fl, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
                <div className="text-sm font-semibold text-zinc-200 mb-4">{fl.title}</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[fl.before, fl.after].map((side, j) => (
                    <div key={j} className={`rounded-xl border p-4 ${j === 0 ? "border-zinc-700 bg-zinc-900/60" : "border-indigo-900/50 bg-indigo-950/20"}`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${j === 0 ? "text-zinc-400" : "text-indigo-400"}`}>
                        {side.label}
                      </div>
                      {side.imagePath
                        ? <img src={side.imagePath} alt={side.label} className="w-full h-28 object-cover rounded-lg mb-3" />
                        : <div className="w-full h-28 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-600 mb-3">📷 photo coming soon</div>
                      }
                      <ul className="space-y-1.5">
                        {side.points.map((p, k) => (
                          <li key={k} className="text-sm text-zinc-300 flex gap-2">
                            <span className={j === 0 ? "text-zinc-600" : "text-indigo-500"}>›</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Trim & colour notes */}
        <section className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-2">Trim levels</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{guide.trimNotes}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-2">Factory colours</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{guide.colorNote}</p>
          </div>
        </section>

      </div>
    </main>
  );
}
