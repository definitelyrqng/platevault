"use client";

import { useMemo, useState } from "react";

const VEHICLE_CATEGORIES = ["Cars (2011)", "Motorcycles (2011)", "Trailers (2011)"] as const;
type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

const PLATE_TYPES = [
  { id: "car-modern", name: "Modern car plate", example: "AA 123 AB" },
  { id: "motorcycle", name: "Motorcycle plate", example: "AA 123" },
  { id: "trailer", name: "Trailer plate", example: "TR 1234 A" },
  { id: "unknown", name: "I don’t know", example: "—" },
] as const;
type PlateTypeId = (typeof PLATE_TYPES)[number]["id"];

function looksTooExact(location: string) {
  const t = location.toLowerCase();
  const streetWords = ["straße", "str.", "strasse", "street", "st.", "road", "rd.", "allee", "weg", "gasse"];
  const hasStreetWord = streetWords.some((w) => t.includes(w));
  const hasNumber = /\b\d{1,4}[a-z]?\b/.test(t);
  return hasStreetWord && hasNumber;
}

export default function AlbaniaUploadPage() {
  const [category, setCategory] = useState<VehicleCategory>("Cars (2011)");
  const [plateType, setPlateType] = useState<PlateTypeId>("car-modern");
  const [plateText, setPlateText] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const warning = useMemo(() => {
    if (!location.trim()) return "";
    return looksTooExact(location) ? "Keep it broad (city / area). No street + house number." : "";
  }, [location]);

  const canSubmit =
    !!photo && plateText.trim().length >= 2 && location.trim().length >= 3 && !warning;

  const selected = PLATE_TYPES.find((p) => p.id === plateType);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // Demo submit for now (no backend yet)
    console.log({
      country: "Albania",
      category,
      plateType,
      plateText: plateText.trim(),
      location: location.trim(),
      notes: notes.trim(),
      photoName: photo?.name,
    });

    alert("Saved (demo). Next step: store locally on your PC.");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Upload — Albania</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Simple Albania-specific upload. Keep location broad (e.g. “Tirana”, “Durrës”, “City center”).
            </p>
          </div>
          <a href="/upload" className="text-sm text-zinc-300 hover:text-white">
            ← Back to countries
          </a>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
          {/* Form */}
          <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Vehicle category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                >
                  {VEHICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Plate type</span>
                <select
                  value={plateType}
                  onChange={(e) => setPlateType(e.target.value as PlateTypeId)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                >
                  {PLATE_TYPES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-zinc-300">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-950 hover:file:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Plate text</span>
                <input
                  value={plateText}
                  onChange={(e) => setPlateText(e.target.value.toUpperCase())}
                  placeholder="AA 123 AB"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Location (broad)</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Tirana"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
                {warning ? (
                  <span className="text-xs text-amber-300">{warning}</span>
                ) : (
                  <span className="text-xs text-zinc-500">No street names + house numbers.</span>
                )}
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-zinc-300">Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything extra (rarity, story, car color, etc.)"
                  rows={3}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Upload
              </button>
              <span className="text-xs text-zinc-500">
                {canSubmit ? "Ready (demo submit)" : "Add photo + plate + location to enable upload"}
              </span>
            </div>
          </form>

          {/* Side preview */}
          <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="text-sm text-zinc-400">Preview</div>
            <div className="mt-1 text-lg font-semibold">Plate type example</div>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs text-zinc-500">Example</div>
              <div className="mt-2 rounded-xl bg-zinc-900 px-4 py-3 text-center text-lg font-semibold tracking-wide">
                {selected?.example ?? "—"}
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Later: replace with real example images.
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium">Location rule</div>
              <p className="mt-2 text-sm text-zinc-400">
                “Karlsplatz, Munich” is fine. Avoid exact addresses. Keep it broad.
              </p>
            </div>
          </aside>
        </div>

        {/* Examples section */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">Plate type examples</h2>
            <span className="text-sm text-zinc-500">Placeholders for now</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATE_TYPES.filter((p) => p.id !== "unknown").map((p) => (
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="rounded-lg bg-zinc-900 px-3 py-2 text-center font-semibold tracking-wide">
                    {p.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
