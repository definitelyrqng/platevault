"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import TagPicker from "@/app/components/TagPicker";
import CroatiaPlateInput from "@/app/upload/CroatiaPlateInput";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import {
  CROATIA_CATEGORIES, CROATIA_FORMATS_FOR, HR_FORMAT_LABELS, CROATIA_REGIONS,
  type CroatiacategoryId,
} from "@/app/lib/croatiaData";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();
const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function locationTooExact(loc: string) {
  const t = loc.toLowerCase();
  const words = ["ulica", "street", "str.", "road", "rd.", "avenue", "blvd", "cesta"];
  return words.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}
function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG and PNG files are allowed.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large — max ${MAX_SIZE_MB} MB.`;
  return null;
}

type MilestoneData = { uploadCount: number; streak: { current: number; isNewDay: boolean } };

export default function CroatiaUploadPage() {
  const router = useRouter();

  const [category, setCategory] = useState<CroatiacategoryId>("regular");
  const [plateText, setPlateText] = useState("");
  const [format, setFormat] = useState<string>(CROATIA_FORMATS_FOR["regular"][0]);

  function handleCategoryChange(c: CroatiacategoryId) {
    setCategory(c);
    setPlateText("");
    setFormat(CROATIA_FORMATS_FOR[c][0]);
  }

  const [location, setLocation] = useState("");
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
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);

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

  const catMeta = CROATIA_CATEGORIES.find((c) => c.id === category)!;
  const formats = CROATIA_FORMATS_FOR[category];

  const canSubmit =
    !!file && !fileError &&
    plateText.trim().length >= 2 &&
    location.trim().length >= 2 &&
    !locationWarning && status === "idle";

  function handleFileSelect(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); setPreview(null); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const d = e.dataTransfer.files[0]; if (d) handleFileSelect(d);
  }, []);

  const { startUpload } = useUploadThing("plateImageUploader");

  const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
  const STREAK_MILESTONES = [3, 7, 14, 30, 100];

  async function doUpload() {
    setMultiSpotWarning(null); setStatus("uploading"); setErrorMsg("");
    try {
      const uploaded = await startUpload([file!]);
      if (!uploaded?.[0]?.ufsUrl) throw new Error("Image upload failed — please try again.");
      const imageUrl = uploaded[0].ufsUrl;
      setStatus("saving");
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "croatia", plateText: plateText.trim().toUpperCase(),
          plateType: format, imageUrl, location: location.trim(),
          brand: brand.trim(), model: model.trim(), generation: generation.trim(),
          trim: trim.trim(), color: color.trim(), badge: badge.trim(),
          tags, companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");
      setStatus("done");
      const isMilestone = UPLOAD_MILESTONES.includes(data.uploadCount) ||
        (data.streak?.isNewDay && STREAK_MILESTONES.includes(data.streak?.current));
      if (isMilestone) {
        setMilestoneData({ uploadCount: data.uploadCount, streak: data.streak });
      } else {
        router.push(`/spot/${data.upload.numericId}`);
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setErrorMsg("");
    try {
      const r = await fetch(`/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=croatia`);
      if (r.ok) { const d = await r.json(); if (d.exists) { setMultiSpotWarning(d.spot); return; } }
    } catch { /* proceed */ }
    await doUpload();
  }

  const previewColors: Record<CroatiacategoryId, { bg: string; text: string; border: string }> = {
    regular:     { bg: "bg-zinc-950", text: "text-zinc-100",   border: "border-zinc-700" },
    foreign:     { bg: "bg-zinc-950", text: "text-green-400",  border: "border-green-900/50" },
    exceptional: { bg: "bg-zinc-950", text: "text-red-400",    border: "border-red-900/50" },
    motorcycle:  { bg: "bg-zinc-950", text: "text-zinc-100",   border: "border-zinc-700" },
    vanity:      { bg: "bg-zinc-950", text: "text-zinc-100",   border: "border-zinc-700" },
    dealer:      { bg: "bg-zinc-950", text: "text-zinc-100",   border: "border-zinc-700" },
    oldtimer:    { bg: "bg-zinc-950", text: "text-amber-300",  border: "border-amber-900/50" },
    military:    { bg: "bg-zinc-950", text: "text-yellow-400", border: "border-yellow-900/50" },
    export:      { bg: "bg-zinc-950", text: "text-green-400",  border: "border-green-900/50" },
    police:      { bg: "bg-zinc-950", text: "text-blue-400",   border: "border-blue-900/50" },
  };
  const pc = previewColors[category];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
      {milestoneData && (
        <MilestonePopup
          data={milestoneData}
          onDone={() => { setMilestoneData(null); router.push("/c/croatia"); }}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
          <a href="/upload" className="hover:text-zinc-300 transition-colors">Upload</a>
          <span>›</span>
          <span className="text-zinc-300">Croatia 🇭🇷</span>
        </div>
        <h1 className="text-2xl font-semibold">Upload — Croatia</h1>
        <p className="mt-1 text-sm text-zinc-400">Regular, foreign, exceptional, motorcycle, vanity, dealer, oldtimer, military, export and police plates</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Category picker */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <span className="text-sm font-medium text-zinc-200">Plate type</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CROATIA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                      category === cat.id
                        ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    <span className="flex items-center gap-2"><span className="text-base shrink-0">{cat.emoji}</span><span className="font-medium">{cat.label}</span></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category hint */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-400 leading-relaxed">
              <span className="mr-1">{catMeta.emoji}</span>
              <strong className="text-zinc-200">{catMeta.label}:</strong> {catMeta.hint}
            </div>

            {/* Plate fields */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Plate details</div>
              <CroatiaPlateInput category={category} onChange={setPlateText} />
            </div>

            {/* Format */}
            {formats.length > 1 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Plate layout</div>
                <div className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all ${
                        format === f
                          ? "border-indigo-600 bg-indigo-950/40 text-indigo-200"
                          : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {HR_FORMAT_LABELS[f] ?? f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <span className="block text-sm text-zinc-300 mb-2">Photo <span className="text-zinc-600 text-xs">(JPG or PNG, max 8 MB)</span></span>
              <div
                className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  isDragging ? "border-indigo-500 bg-indigo-950/20" : "border-zinc-700 hover:border-zinc-600"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById("hr-file-input")?.click()}
              >
                {preview ? (
                  <ZoomImage src={preview} alt="Preview" className="max-h-64 w-full rounded-lg object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <div className="text-sm text-zinc-400">Drop a photo or click to browse</div>
                    <div className="text-xs text-zinc-600 mt-1">JPG or PNG, max 8 MB</div>
                  </div>
                )}
                <input
                  id="hr-file-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>
              {fileError && <p className="mt-2 text-xs text-red-400">{fileError}</p>}
              <OcrHint file={file} onSuggest={(t) => setPlateText(t)} />
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <span className="block text-sm text-zinc-300 mb-2">Location spotted</span>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                placeholder="e.g. Zagreb, Split, Dubrovnik…"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {locationWarning && <p className="mt-2 text-xs text-amber-400">⚠ {locationWarning}</p>}
            </div>

            {/* Car details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <span className="block text-sm text-zinc-300 mb-3">Vehicle details <span className="text-zinc-600 text-xs">(optional)</span></span>
              <CarDetailsFields onChange={useCallback((d) => {
                setBrand(d.brand); setModel(d.model); setGeneration(d.generation);
                setTrim(d.trim); setColor(d.color); setBadge(d.badge);
              }, [])} />
            </div>

            {/* Company */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <span className="block text-sm text-zinc-300 mb-2">Company <span className="text-zinc-600 text-xs">(optional)</span></span>
              <CompanyPicker value={companyId} onChange={(id) => setCompanyId(id)} />
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <span className="block text-sm text-zinc-300 mb-2">Tags <span className="text-zinc-600 text-xs">(optional, up to 6)</span></span>
              <TagPicker selected={tags} onChange={setTags} max={6} />
            </div>

            {/* Duplicate warning */}
            {multiSpotWarning && (
              <div ref={warningRef} className="rounded-2xl border border-amber-800/50 bg-amber-950/20 p-4">
                <p className="text-sm text-amber-300 font-medium mb-2">⚠ This plate has already been spotted!</p>
                <p className="text-xs text-amber-400 mb-3">
                  <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200">{multiSpotWarning.plateText}</a>
                  {" "}was uploaded by{" "}
                  <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200">@{multiSpotWarning.username}</a>.
                  Submit anyway?
                </p>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-700 hover:bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors"
                    onClick={() => setMultiSpotWarning(null)}
                  >
                    Yes, submit anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiSpotWarning(null)}
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "uploading" ? "Uploading photo…"
                : status === "saving" ? "Saving spot…"
                : "Upload spot"}
            </button>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

            {/* Live preview */}
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
              <div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">Live preview</div>
              <div className={`rounded-xl border ${pc.border} ${pc.bg} px-6 py-4 text-center shadow-inner`}>
                <div className={`font-mono text-2xl font-bold tracking-widest ${pc.text}`}>
                  {plateText || <span className="opacity-30">—</span>}
                </div>
                {format && (
                  <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">
                    {HR_FORMAT_LABELS[format] ?? format}
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
                <span className="text-zinc-600">Stored as: </span>
                <span className="font-mono text-zinc-300">{plateText || "—"}</span>
              </div>
            </div>

            {/* Format guide */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Format guide</div>
              <div className="space-y-1.5">
                {CROATIA_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className={category === cat.id ? "text-indigo-300 font-medium" : "text-zinc-500"}>
                      {cat.label}
                    </span>
                    <span className="font-mono text-zinc-600">{cat.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Region codes reference */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Region codes</div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                {CROATIA_REGIONS.map((r) => (
                  <div key={r.code} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-indigo-400 w-6 shrink-0">{r.code}</span>
                    <span className="text-zinc-500">{r.city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>
    </main>
  );
}
