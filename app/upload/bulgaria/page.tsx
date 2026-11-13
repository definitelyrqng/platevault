"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import DescriptionField, { locationOf } from "@/app/components/DescriptionField";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import PlateBadge from "@/app/components/PlateBadge";
import TagPicker from "@/app/components/TagPicker";
import BulgariaPlateInput from "@/app/upload/BulgariaPlateInput";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import {
  BULGARIA_CATEGORIES, BULGARIA_FORMATS_FOR, BG_FORMAT_LABELS, BULGARIA_PATTERNS,
  type BulgariacategoryId,
} from "@/app/lib/bulgariaData";
import { padBelgiumPlate as padPlate } from "@/app/lib/belgiumData";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function locationTooExact(loc: string) {
  const t = loc.toLowerCase();
  const streetWords = ["ulitsa", "street", "str.", "road", "avenue", "blvd", "bul."];
  return streetWords.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}
function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG and PNG files are allowed.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large — max ${MAX_SIZE_MB} MB.`;
  return null;
}

export default function BulgariaUploadPage() {
  const router = useRouter();

  // ── Plate state (all lifted here) ──
  const [category, setCategory]   = useState<BulgariacategoryId>("standard");
  const [plateText, setPlateText] = useState("");
  const [format, setFormat]       = useState<string>(BULGARIA_FORMATS_FOR["standard"][0]);
  const [variant, setVariant]     = useState(0);
  const [plateComplete, setPlateComplete] = useState(false);

  // When user manually switches category, reset format to that category's first
  function handleCategoryChange(c: BulgariacategoryId) {
    setCategory(c);
    setVariant(0);
    setFormat(BULGARIA_FORMATS_FOR[c][0]);
    setPlateText("");
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
  useEffect(() => {
    if (status === "uploading") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [status]);
  const [errorMsg, setErrorMsg]       = useState("");
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);
  const redirectCountry = "/c/bulgaria";

  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (multiSpotWarning && warningRef.current)
      warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [multiSpotWarning]);

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(locationOf(location)) ? "Keep it broad — city or area only, no street + number." : "";
  }, [location]);

  const catMeta = BULGARIA_CATEGORIES.find((c) => c.id === category);

  const pat = BULGARIA_PATTERNS[category]?.[variant] ?? BULGARIA_PATTERNS[category]?.[0];
  const livePlate = pat ? padPlate(plateText.trim(), pat) : (plateText.trim() || catMeta?.example || "C 5096 MK");
  const canSubmit =
    !!file && !fileError &&
    plateText.trim().length >= 1 && (!BULGARIA_PATTERNS[category] || plateComplete) &&
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
      const composedType = `${category}__${format}`;
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "bulgaria",
          plateText: plateText.trim().toUpperCase(),
          plateType: composedType,
          imageUrl, location: locationOf(location), description: location.trim() || null,
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
      const checkRes = await fetch(`/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=bulgaria`);
      if (checkRes.ok) {
        const d = await checkRes.json();
        if (d.exists) { setMultiSpotWarning(d.spot); return; }
      }
    } catch { /* proceed */ }
    await doUpload();
  }

  const composedType = `${category}__${format}`;

  return (
    <>
    <MilestonePopup data={milestoneData} onDone={() => { setMilestoneData(null); router.push(redirectCountry); }} />
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <a href="/upload" className="hover:text-zinc-300 transition-colors">Upload</a>
            <span>›</span>
            <span className="text-zinc-300">Bulgaria 🇧🇬</span>
          </div>
          <h1 className="mt-2 text-2xl font-black">Upload — Bulgaria</h1>
          <p className="mt-1 text-sm text-zinc-400">Standard, motorcycle, military, vanity, temporary, diplomatic and foreign registered plates.</p>
        </div>

        {status === "done" && (
          <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
            Uploaded! Redirecting to the Bulgaria gallery…
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
                <span className="text-[10px] text-zinc-600 italic">pick one — the plate format fills in for you</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BULGARIA_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" onClick={() => handleCategoryChange(c.id as BulgariacategoryId)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center text-sm transition-all ${
                      category === c.id
                        ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }`}>
                    <span className="block h-[44px] w-full overflow-hidden text-center leading-[44px]">
                      <PlateBadge country="bulgaria" text={c.example} plateType={`${c.id}__${BULGARIA_FORMATS_FOR[c.id as BulgariacategoryId][0]}`} size="md" />
                    </span>
                    <span>{c.label}</span>
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

              {/* Plate input */}
              <div className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Plate text</span>
                <BulgariaPlateInput
                  category={category} format={format}
                  onFormatChange={setFormat}
                  onChange={setPlateText}
                  variant={variant} onVariantChange={setVariant} onComplete={setPlateComplete}
                />
              </div>

              {/* Location */}
              <DescriptionField value={location} onChange={setLocation} warning={locationWarning} />

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
                    {!file ? "Add a photo" : plateText.trim().length < 1 ? "Enter plate text" : location.trim().length < 2 ? "Add where you saw it" : "Ready"}
                  </span>
                )}
              </div>
            </div>
          </form>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
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
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Live preview</div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-5 text-center text-zinc-300">
                <div className="flex justify-center">
                  <PlateBadge country="bulgaria" text={livePlate} plateType={composedType} size="lg" />
                </div>
                <div className="mt-2 text-xs opacity-70">{catMeta?.label} · Bulgaria 🇧🇬</div>
                <div className="mt-1 text-[10px] opacity-50">{BG_FORMAT_LABELS[format]}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-sm font-medium text-zinc-200 mb-1">📋 Stored as</div>
              <p className="text-xs text-indigo-400 font-mono">{composedType}</p>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{BG_FORMAT_LABELS[format] ?? format}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
              <div className="text-sm font-medium text-zinc-200 mb-2">📍 Location rule</div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                City + country required — e.g. <span className="text-zinc-300">Sofia, Bulgaria</span>.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </main>
    </>
  );
}
