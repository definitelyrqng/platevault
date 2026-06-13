"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import TagPicker from "@/app/components/TagPicker";
import AlbaniaPlateInput from "@/app/upload/AlbaniaPlateInput";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/* ─── Constants ─── */

const VEHICLE_CATEGORIES = [
  "Cars (2011–present)",
  "Motorcycles (2011–present)",
  "Trailers (2011–present)",
  "Cars (1993–2010)",
] as const;

type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

const PLATE_TYPES_BY_CATEGORY: Record<VehicleCategory, { id: string; name: string; example: string }[]> = {
  "Cars (2011–present)": [
    { id: "car-2011-standard", name: "Standard (single line)", example: "AA 123 AB" },
    { id: "car-2011-double", name: "Double line", example: "AA 123 / AB" },
    { id: "car-2011-us", name: "US-size single line", example: "AA 123 AB" },
  ],
  "Motorcycles (2011–present)": [
    { id: "moto-2011", name: "Motorcycle plate", example: "AA 1234" },
  ],
  "Trailers (2011–present)": [
    { id: "trailer-2011-single", name: "Trailer (single line)", example: "TR R 1234" },
    { id: "trailer-2011-double", name: "Trailer (double line)", example: "TR R / 1234" },
  ],
  "Cars (1993–2010)": [
    { id: "car-1993-single", name: "Old format (single line)", example: "BC 1234 AA" },
    { id: "car-1993-double", name: "Old format (double line)", example: "BC 1234 / AA" },
  ],
};

const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function locationTooExact(loc: string) {
  const t = loc.toLowerCase();
  const streetWords = ["straße", "str.", "strasse", "street", "st.", "road", "rd.", "allee", "weg", "gasse", "rruga", "blvd", "avenue", "ave."];
  return streetWords.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}

function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG and PNG files are allowed.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large — max ${MAX_SIZE_MB} MB.`;
  return null;
}

/* ─── Component ─── */

export default function AlbaniaUploadPage() {
  const router = useRouter();

  const [category, setCategory] = useState<VehicleCategory>("Cars (2011–present)");
  const [plateTypeId, setPlateTypeId] = useState("car-2011-standard");
  const [plateText, setPlateText] = useState("");
  const [location, setLocation] = useState("");
  const [plateRegion, setPlateRegion] = useState("");
  const onPlateChange = useCallback((text: string, region: string) => {
    setPlateText(text);
    setPlateRegion(region);
  }, []);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [generation, setGeneration] = useState("");
  const [trim, setTrim] = useState("");
  const [color, setColor] = useState("");
  const [badge, setBadge] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Multi-spot warning
  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (multiSpotWarning && warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [multiSpotWarning]);

  const plateTypes = PLATE_TYPES_BY_CATEGORY[category];
  const selectedType = plateTypes.find((p) => p.id === plateTypeId) ?? plateTypes[0];

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(location) ? "Keep it broad — city or area only, no street + number." : "";
  }, [location]);

  const canSubmit =
    !!file &&
    !fileError &&
    plateText.trim().length >= 2 &&
    location.trim().length >= 2 &&
    !locationWarning &&
    status === "idle";

  /* ─── File input ─── */

  function handleFileSelect(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  /* ─── Upload ─── */

  const { startUpload } = useUploadThing("plateImageUploader");

  async function doUpload() {
    if (!file) return;
    setMultiSpotWarning(null);
    setStatus("uploading");
    setErrorMsg("");

    try {
      const uploaded = await startUpload([file]);
      if (!uploaded || !uploaded[0]?.ufsUrl) throw new Error("Image upload failed — please try again.");
      const imageUrl = uploaded[0].ufsUrl;

      setStatus("saving");
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "albania",
          plateText: plateText.trim().toUpperCase(),
          plateType: selectedType.id,
          imageUrl,
          location: location.trim(),
          plateRegion: plateRegion || null,
          brand: brand.trim(),
          model: model.trim(),
          generation: generation.trim(),
          trim: trim.trim(),
          color: color.trim(),
          badge: badge.trim(),
          tags,
          companyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");

      setStatus("done");
      setTimeout(() => router.push("/c/albania"), 1500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setErrorMsg("");

    // Check for existing spot (multi-spot detection)
    try {
      const checkRes = await fetch(
        `/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=albania`
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setMultiSpotWarning(checkData.spot);
          return; // show warning, wait for user confirmation
        }
      }
    } catch {
      // if check fails, proceed anyway
    }

    await doUpload();
  }

  function onCategoryChange(c: VehicleCategory) {
    setCategory(c);
    setPlateTypeId(PLATE_TYPES_BY_CATEGORY[c][0].id);
  }

  /* ─── Render ─── */

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <a href="/upload" className="hover:text-zinc-300">Upload</a>
            <span>›</span>
            <span className="text-zinc-300">Albania 🇦🇱</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Upload — Albania</h1>
          <p className="mt-1 text-sm text-zinc-400">Photo · plate text · city &amp; country. Done in seconds.</p>
        </div>

        {/* Success banner */}
        {status === "done" && (
          <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
            ✓ Uploaded! Redirecting to the Albania gallery…
          </div>
        )}

        {/* Error banner */}
        {status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            ✗ {errorMsg}
            <button onClick={() => setStatus("idle")} className="ml-3 underline hover:no-underline">Try again</button>
          </div>
        )}

        {/* Multi-spot warning */}
        {multiSpotWarning && (
          <div
            ref={warningRef}
            className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/30 px-5 py-4 space-y-3 animate-[multispot-flash_0.6s_ease-in-out_3]"
            style={{ animationName: "multispot-flash" }}
          >
            <style>{`
              @keyframes multispot-flash {
                0%, 100% { background-color: rgb(120 53 15 / 0.3); }
                50%       { background-color: rgb(120 53 15 / 0.7); border-color: rgb(217 119 6); }
              }
            `}</style>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">📍</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">This plate has already been spotted!</p>
                <p className="mt-1 text-sm text-amber-200/70">
                  <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">
                    {multiSpotWarning.plateText}
                  </a>{" "}
                  was first spotted by{" "}
                  <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">
                    @{multiSpotWarning.username}
                  </a>.
                  This will count as a Multi Spot — they'll be notified.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMultiSpotWarning(null)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={doUpload}
                className="flex-1 rounded-xl border border-amber-800 bg-amber-950/60 py-2 text-sm font-medium text-amber-300 hover:bg-amber-950"
              >
                Yes, upload as Multi Spot
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">

            {/* Photo drop zone */}
            <div>
              <span className="block text-sm text-zinc-300 mb-2">Photo <span className="text-zinc-600 text-xs">(JPG or PNG, max 8 MB)</span></span>
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
                  ${isDragging ? "border-zinc-400 bg-zinc-800/60" : fileError ? "border-red-800 bg-red-950/20" : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"}`}
                style={{ minHeight: preview ? "auto" : "150px" }}
              >
                {preview ? (
                  <div className="relative w-full group">
                    <img src={preview} alt="Preview" className="w-full object-contain max-h-64 rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/0 group-hover:bg-zinc-950/50 transition-colors rounded-xl">
                      <span className="opacity-0 group-hover:opacity-100 text-xs text-zinc-200 transition-opacity">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center px-4">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-sm text-zinc-400">
                      Drag & drop or <span className="text-zinc-200 underline">browse</span>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
              </label>
              {fileError && <p className="mt-1.5 text-xs text-red-400">{fileError}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Vehicle category</span>
                <select value={category} onChange={(e) => onCategoryChange(e.target.value as VehicleCategory)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600">
                  {VEHICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Plate type</span>
                <select value={plateTypeId} onChange={(e) => setPlateTypeId(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600">
                  {plateTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>

              <div className="md:col-span-2 grid gap-1.5">
                <span className="text-sm text-zinc-300">Plate text</span>
                <AlbaniaPlateInput category={category} onChange={onPlateChange} />
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Location <span className="text-zinc-600 text-xs">(city + country required)</span></span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Berlin, Germany" className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600" />
                {locationWarning
                  ? <span className="text-xs text-amber-400">{locationWarning}</span>
                  : <span className="text-xs text-zinc-600">City + country only — no street or house number.</span>
                }
              </label>

              {/* Car details — cascading dropdowns */}
              <div className="md:col-span-2 pt-2 border-t border-zinc-800">
                <CarDetailsFields
                  onChange={useCallback((d) => {
                    setBrand(d.brand);
                    setModel(d.model);
                    setGeneration(d.generation);
                    setTrim(d.trim);
                    setColor(d.color);
                    setBadge(d.badge);
                  }, [])}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="text-sm text-zinc-300">Tags <span className="text-zinc-600 text-xs">(optional, up to 6)</span></div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Transport company</p>
                <CompanyPicker value={companyId} onChange={(id) => setCompanyId(id)} />
              </div>

              <TagPicker selected={tags} onChange={setTags} max={6} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={!canSubmit} className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                {status === "uploading" ? "Uploading image…" : status === "saving" ? "Saving…" : "Upload spot"}
              </button>
              {status === "idle" && (
                <span className="text-xs text-zinc-500">
                  {!file ? "Add a photo" : plateText.trim().length < 2 ? "Enter plate text" : location.trim().length < 2 ? "Enter a location" : "Ready ✓"}
                </span>
              )}
            </div>
          </form>

          {/* ─── Sidebar ─── */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Live preview</div>
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-5 text-center">
                <div className="font-mono text-xl font-bold tracking-widest text-zinc-100">
                  {plateText.trim() || selectedType.example}
                </div>
                <div className="mt-2 text-xs text-zinc-500">{selectedType.name} · Albania 🇦🇱</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-sm font-medium text-zinc-200 mb-2">📍 Location rule</div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                City + country is required - for example <span className="text-zinc-300">Berlin, Germany</span> or <span className="text-zinc-300">Tirana, Albania</span>. No street names or house numbers.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Formats</div>
              <div className="space-y-1.5">
                {plateTypes.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPlateTypeId(p.id)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors
                      ${plateTypeId === p.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900/60"}`}>
                    <span>{p.name}</span>
                    <span className="font-mono text-xs opacity-70">{p.example}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
