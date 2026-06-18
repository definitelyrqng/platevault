"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import TagPicker from "@/app/components/TagPicker";
import BelgiumPlateInput from "@/app/upload/BelgiumPlateInput";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import {
  BELGIUM_CATEGORIES, BELGIUM_FORMATS_FOR, BE_FORMAT_LABELS,
  BE_COLOR_CLASSES, BELGIUM_1951_ERAS,
  type BelgiumCategoryId,
} from "@/app/lib/belgiumData";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function locationTooExact(loc: string) {
  const t = loc.toLowerCase();
  const streetWords = ["straat", "laan", "weg", "rue", "avenue", "boulevard", "street", "str.", "road", "rd."];
  return streetWords.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}
function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG and PNG files are allowed.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large — max ${MAX_SIZE_MB} MB.`;
  return null;
}

export default function BelgiumUploadPage() {
  const router = useRouter();

  // ── Plate state (all lifted here) ──
  const [category, setCategory]   = useState<BelgiumCategoryId>("regular");
  const [plateText, setPlateText] = useState("");
  const [format, setFormat]       = useState<string>(BELGIUM_FORMATS_FOR["regular"][0]);
  const [era, setEra]             = useState<string>(BELGIUM_1951_ERAS[0].id);

  // When user manually switches category, reset format to that category's first
  function handleCategoryChange(c: BelgiumCategoryId) {
    setCategory(c);
    setFormat(BELGIUM_FORMATS_FOR[c][0]);
    setPlateText("");
    setEra(BELGIUM_1951_ERAS[0].id);
  }
  // Called by auto-detection in BelgiumPlateInput
  function handleCategoryDetected(c: BelgiumCategoryId) {
    if (c === category) return;
    setCategory(c);
    setFormat(BELGIUM_FORMATS_FOR[c][0]);
  }

  const [location, setLocation]       = useState("");
  const [brand, setBrand]             = useState("");
  const [model, setModel]             = useState("");
  const [generation, setGeneration]   = useState("");
  const [trim, setTrim]               = useState("");
  const [color, setColor]             = useState("");
  const [badge, setBadge]             = useState("");
  const [companyId, setCompanyId]     = useState<string | null>(null);
  const [tags, setTags]               = useState<string[]>([]);

  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [fileError, setFileError]     = useState("");
  const [status, setStatus]           = useState<"idle"|"uploading"|"saving"|"done"|"error">("idle");
  const [errorMsg, setErrorMsg]       = useState("");
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);
  const redirectCountry = "/c/belgium";

  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (multiSpotWarning && warningRef.current)
      warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [multiSpotWarning]);

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(location) ? "Keep it broad — city or area only, no street + number." : "";
  }, [location]);

  const catMeta = BELGIUM_CATEGORIES.find((c) => c.id === category);
  const plateColorClass = BE_COLOR_CLASSES[catMeta?.color ?? "red"];
  const eraData = BELGIUM_1951_ERAS.find((e) => e.id === era) ?? BELGIUM_1951_ERAS[0];

  const canSubmit =
    !!file && !fileError &&
    plateText.trim().length >= 1 &&
    location.trim().length >= 2 &&
    !locationWarning &&
    status === "idle";

  function handleFileSelect(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const { startUpload } = useUploadThing("plateImageUploader");

  async function doUpload() {
    if (!file) return;
    setMultiSpotWarning(null); setStatus("uploading"); setErrorMsg("");
    try {
      const uploaded = await startUpload([file]);
      if (!uploaded || !uploaded[0]?.ufsUrl) throw new Error("Image upload failed — please try again.");
      const imageUrl = uploaded[0].ufsUrl;
      setStatus("saving");
      const composedType = category === "year-1951" ? `${format}__${era}` : format;
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "belgium",
          plateText: plateText.trim().toUpperCase(),
          plateType: composedType,
          imageUrl, location: location.trim(),
          brand: brand.trim(), model: model.trim(), generation: generation.trim(),
          trim: trim.trim(), color: color.trim(), badge: badge.trim(),
          tags, companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");
      setStatus("done");
      const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
      const STREAK_MILESTONES = [3, 7, 14, 30, 100];
      const isMilestone = UPLOAD_MILESTONES.includes(data.uploadCount) ||
        (data.streak?.isNewDay && STREAK_MILESTONES.includes(data.streak?.current));
      if (isMilestone) {
        setMilestoneData({ uploadCount: data.uploadCount, streak: data.streak });
      } else {
        setTimeout(() => router.push(redirectCountry), 1500);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setErrorMsg("");
    try {
      const checkRes = await fetch(`/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=belgium`);
      if (checkRes.ok) {
        const d = await checkRes.json();
        if (d.exists) { setMultiSpotWarning(d.spot); return; }
      }
    } catch { /* proceed */ }
    await doUpload();
  }

  const composedType = category === "year-1951" ? `${format}__${era}` : format;

  return (
    <>
    <MilestonePopup data={milestoneData} onDone={() => { setMilestoneData(null); router.push(redirectCountry); }} />
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <a href="/upload" className="hover:text-zinc-300 transition-colors">Upload</a>
            <span>›</span>
            <span className="text-zinc-300">Belgium 🇧🇪</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Upload — Belgium</h1>
          <p className="mt-1 text-sm text-zinc-400">Regular, transit, diplomatic, dealer, export &amp; historical plates.</p>
        </div>

        {status === "done" && (
          <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
            Uploaded! Redirecting to the Belgium gallery…
          </div>
        )}
        {status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {errorMsg}
            <button onClick={() => setStatus("idle")} className="ml-3 underline">Try again</button>
          </div>
        )}
        {multiSpotWarning && (
          <div ref={warningRef} className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/30 px-5 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">📍</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">This plate has already been spotted!</p>
                <p className="mt-1 text-sm text-amber-200/70">
                  <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">{multiSpotWarning.plateText}</a>{" "}was first spotted by{" "}
                  <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">@{multiSpotWarning.username}</a>. This will count as a Multi Spot.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMultiSpotWarning(null)} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={doUpload} className="flex-1 rounded-xl border border-amber-800 bg-amber-950/60 py-2 text-sm font-medium text-amber-300 hover:bg-amber-950 transition-colors">Yes, upload as Multi Spot</button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Category picker card ── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">Plate category</span>
                <span className="text-[10px] text-zinc-600 italic">auto-detected from plate text</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BELGIUM_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" onClick={() => handleCategoryChange(c.id as BelgiumCategoryId)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                      category === c.id
                        ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }`}>
                    {c.label}{c.color === "green" ? " 🟢" : ""}
                  </button>
                ))}
              </div>
              {catMeta?.hint && <p className="text-xs text-zinc-600">{catMeta.hint}</p>}
            </div>

            {/* ── Description ── */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">{catMeta?.label ?? category}</strong>
              {catMeta?.example && <span className="ml-2 text-indigo-400">· e.g. {catMeta.example}</span>}
            </div>

            {/* ── Main fields card ── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">

              {/* Photo */}
              <div>
                <span className="block text-sm text-zinc-300 mb-2">Photo <span className="text-zinc-600 text-xs">(JPG or PNG, max 8 MB)</span></span>
                <label
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                    isDragging ? "border-zinc-400 bg-zinc-800/60" : fileError ? "border-red-800 bg-red-950/20" : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"
                  }`}
                  style={{ minHeight: preview ? "auto" : "150px" }}
                >
                  {preview ? (
                    <div className="relative w-full group">
                      <ZoomImage src={preview} alt="Preview" className="rounded-xl" />
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/0 group-hover:bg-zinc-950/50 transition-colors rounded-xl pointer-events-none">
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-zinc-200 transition-opacity">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center px-4">
                      <div className="text-2xl mb-2">📷</div>
                      <div className="text-sm text-zinc-400">Drag &amp; drop or <span className="text-zinc-200 underline">browse</span></div>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
                </label>
                {fileError && <p className="mt-1.5 text-xs text-red-400">{fileError}</p>}
                <OcrHint file={file} onSuggest={setPlateText} />
              </div>

              {/* Plate input */}
              <div className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Plate text</span>
                <BelgiumPlateInput
                  category={category} era={era} format={format}
                  onCategoryDetected={handleCategoryDetected}
                  onEraDetected={setEra}
                  onFormatChange={setFormat}
                  onChange={setPlateText}
                />
              </div>

              {/* Location */}
              <label className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Location <span className="text-zinc-600 text-xs">(city + country required)</span></span>
                <input value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Brussels, Belgium"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600" />
                {locationWarning
                  ? <span className="text-xs text-amber-400">{locationWarning}</span>
                  : <span className="text-xs text-zinc-600">City + country only — no street or house number.</span>}
              </label>

              {/* Car details */}
              <div className="pt-2 border-t border-zinc-800">
                <CarDetailsFields onChange={useCallback((d) => {
                  setBrand(d.brand); setModel(d.model); setGeneration(d.generation);
                  setTrim(d.trim); setColor(d.color); setBadge(d.badge);
                }, [])} />
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
                <button type="submit" disabled={!canSubmit}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {status === "uploading" ? "Uploading image…" : status === "saving" ? "Saving…" : "Upload spot"}
                </button>
                {status === "idle" && (
                  <span className="text-xs text-zinc-500">
                    {!file ? "Add a photo" : plateText.trim().length < 1 ? "Enter plate text" : location.trim().length < 2 ? "Enter a location" : "Ready"}
                  </span>
                )}
              </div>
            </div>
          </form>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Live preview</div>
              <div className={`rounded-xl border px-4 py-5 text-center ${plateColorClass}`}>
                <div className="font-mono text-xl font-bold tracking-widest">
                  {plateText.trim() || catMeta?.example || "1-ABC-123"}
                </div>
                <div className="mt-2 text-xs opacity-70">
                  {catMeta?.label}
                  {category === "year-1951" ? ` · ${eraData.label.split("/")[1]?.trim()}` : ""}
                  {" · "}Belgium 🇧🇪
                </div>
                <div className="mt-1 text-[10px] opacity-50">{BE_FORMAT_LABELS[format]}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-sm font-medium text-zinc-200 mb-1">📋 Stored as</div>
              <p className="text-xs text-indigo-400 font-mono">{composedType}</p>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{BE_FORMAT_LABELS[format] ?? format}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-sm font-medium text-zinc-200 mb-2">📍 Location rule</div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                City + country required — e.g. <span className="text-zinc-300">Brussels, Belgium</span>.
              </p>
            </div>

            {category === "year-1951" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Era format reference</div>
                <div className="space-y-1">
                  {BELGIUM_1951_ERAS.map((e) => (
                    <div key={e.id}
                      className={`flex justify-between text-xs py-0.5 px-2 rounded-lg transition-colors ${e.id === era ? "bg-zinc-800 text-zinc-200" : "text-zinc-500"}`}>
                      <span>{e.label.split("/")[0].trim()}</span>
                      <span className="font-mono">{e.placeholder}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
    </>
  );
}
