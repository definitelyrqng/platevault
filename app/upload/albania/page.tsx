"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import TagPicker from "@/app/components/TagPicker";
import DescriptionInput from "@/app/components/DescriptionInput";
import AlbaniaPlateInput, { albaniaExample } from "@/app/upload/AlbaniaPlateInput";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import PlateBadge from "@/app/components/PlateBadge";
import { plateArtFor } from "@/app/lib/plateLayout";
import Flag from "@/app/components/Flag";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/* ─── Plate types (one flat, visual list) ─── */

const PLATE_TYPES = [
  { id: "car-2011-standard",   label: "2011 Series",      hint: "Most cars" },
  { id: "car-2011-double",     label: "Two-line",         hint: "Letters above digits" },
  { id: "car-2011-us",         label: "US-size",          hint: "US import size" },
  { id: "moto-2011",           label: "Motorcycle",       hint: "New square plate" },
  { id: "trailer-2011-single", label: "Trailer",          hint: "Teal, white text" },
  { id: "trailer-2011-double", label: "Trailer two-line", hint: "Green, two rows" },
  { id: "car-1993-single",     label: "1993 Series",      hint: "Old red band" },
] as const;

/** True when this type's artwork is a tall two-line plate (so it needs a bigger preview). */
function isSquarish(plateType: string) {
  const art = plateArtFor("albania", plateType);
  return !!art && art.w / art.h < 3;
}

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

function StepTitle({ n, title, done, children }: { n: number; title: string; done?: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-100">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
          done ? "bg-emerald-500/20 text-emerald-300" : "bg-indigo-600/20 text-indigo-300"
        }`}>{done ? "✓" : n}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ─── Component ─── */

export default function AlbaniaUploadPage() {
  const router = useRouter();

  const [plateTypeId, setPlateTypeId] = useState<string>("car-2011-standard");
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
  const [moreOpen, setMoreOpen] = useState(false);

  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  useEffect(() => {
    if (status === "uploading") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [status]);
  const [errorMsg, setErrorMsg] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);
  const [newSpotId, setNewSpotId] = useState<number | null>(null);

  // Multi-spot warning
  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (multiSpotWarning && warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [multiSpotWarning]);

  const selectedType = PLATE_TYPES.find((p) => p.id === plateTypeId) ?? PLATE_TYPES[0];

  // Live plate preview — debounced so typing doesn't request an image per keystroke
  const [previewText, setPreviewText] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setPreviewText(plateText), 250);
    return () => clearTimeout(t);
  }, [plateText]);
  const showingExample = !previewText.trim();

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(location) ? "Keep it broad — city or area only, no street + number." : "";
  }, [location]);

  const hasPhoto = !!file && !fileError;
  const hasPlate = plateText.trim().length >= 2;
  const hasLocation = location.trim().length >= 2 && !locationWarning;
  const canSubmit = hasPhoto && hasPlate && hasLocation && status === "idle";

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
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");

      setNewSpotId(data.upload.numericId);
      setStatus("done");
      const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
      const STREAK_MILESTONES = [3, 7, 14, 30, 100];
      const isMilestone = UPLOAD_MILESTONES.includes(data.uploadCount) ||
        (data.streak?.isNewDay && STREAK_MILESTONES.includes(data.streak?.current));
      if (isMilestone) {
        setMilestoneData({ uploadCount: data.uploadCount, streak: data.streak });
      } else {
        router.push(`/spot/${data.upload.numericId}`);
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

  const onCarDetails = useCallback((d: { brand: string; model: string; generation: string; trim: string; color: string; badge: string }) => {
    setBrand(d.brand); setModel(d.model); setGeneration(d.generation);
    setTrim(d.trim); setColor(d.color); setBadge(d.badge);
  }, []);

  const missing = [!hasPhoto && "a photo", !hasPlate && "the plate number", !hasLocation && "a location"].filter(Boolean) as string[];

  /* ─── Render ─── */

  return (
    <>
    <MilestonePopup data={milestoneData} onDone={() => { setMilestoneData(null); router.push(`/spot/${newSpotId}`); }} />
    <main className="px-4 pb-16 pt-8 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800/60 pb-5">
          <div>
            <nav className="mb-2 text-xs text-zinc-500">
              <a href="/upload" className="transition-colors hover:text-zinc-300">Upload</a>
              <span className="mx-1.5">/</span>
              <span className="text-zinc-300">Albania</span>
            </nav>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="leading-none shadow ring-1 ring-black/30"><Flag iso="al" size="lg" /></span>
              Upload an Albanian plate
            </h1>
          </div>
          <a href="/c/albania" className="text-sm text-zinc-400 transition-colors hover:text-white">Albania gallery →</a>
        </div>

        {status === "done" && (
          <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
            Uploaded! Taking you to your spot…
          </div>
        )}
        {status === "error" && (
          <div className="mt-6 rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {errorMsg}
            <button type="button" onClick={() => setStatus("idle")} className="ml-3 underline">Try again</button>
          </div>
        )}

        {multiSpotWarning && (
          <div ref={warningRef} className="mt-6 space-y-3 rounded-xl border border-amber-800 bg-amber-950/30 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-xl">📍</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">This plate has already been spotted!</p>
                <p className="mt-1 text-sm text-amber-200/70">
                  <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">{multiSpotWarning.plateText}</a>{" "}was first spotted by{" "}
                  <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">@{multiSpotWarning.username}</a>. This will count as a Multi Spot.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMultiSpotWarning(null)} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800">Cancel</button>
              <button type="button" onClick={doUpload} className="flex-1 rounded-lg border border-amber-800 bg-amber-950/60 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-950">Yes, upload as Multi Spot</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">

            {/* ── 1. Plate type — visual picker ── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <StepTitle n={1} title="Which plate is it?" done />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {PLATE_TYPES.map((t) => {
                  const active = plateTypeId === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setPlateTypeId(t.id)} aria-pressed={active}
                      className={`group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        active ? "border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500/50" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-600"
                      }`}>
                      <span className="flex h-14 items-center justify-center">
                        {/* two-line plates are tall and narrow — show them bigger so they read */}
                        <PlateBadge country="albania" text={albaniaExample(t.id)} plateType={t.id} size={isSquarish(t.id) ? "lg" : "sm"} />
                      </span>
                      <span>
                        <span className={`block text-sm font-medium ${active ? "text-white" : "text-zinc-300"}`}>{t.label}</span>
                        <span className="block text-[11px] text-zinc-500">{t.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 2. Plate number + live preview ── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <StepTitle n={2} title="Plate number" done={hasPlate} />
              <div className="mb-5 flex min-h-[110px] items-center justify-center rounded-xl bg-zinc-950/70 px-3 py-5">
                <div className={`max-w-full transition-opacity ${showingExample ? "opacity-40" : "opacity-100"}`}>
                  <PlateBadge
                    country="albania"
                    text={showingExample ? albaniaExample(plateTypeId) : previewText}
                    plateType={plateTypeId}
                    size={isSquarish(plateTypeId) ? "xl" : "lg"}
                  />
                </div>
              </div>
              <AlbaniaPlateInput plateType={plateTypeId} onChange={onPlateChange} />
              <p className="mt-2 text-xs text-zinc-500">Tip: paste the whole plate (e.g. AB123CD) into the first box.</p>
            </section>

            {/* ── 3. Photo ── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <StepTitle n={3} title="Photo" done={hasPhoto}>
                <span className="text-xs text-zinc-500">JPG or PNG, max {MAX_SIZE_MB} MB</span>
              </StepTitle>
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  isDragging ? "border-indigo-400 bg-indigo-950/30" : fileError ? "border-red-800 bg-red-950/20" : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"
                }`}
                style={{ minHeight: preview ? "auto" : "170px" }}
              >
                {preview ? (
                  <div className="group relative w-full">
                    <ZoomImage src={preview} alt="Preview" className="rounded-lg" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-950/0 transition-colors group-hover:bg-zinc-950/50">
                      <span className="text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="mb-2 text-3xl">📷</div>
                    <div className="text-sm text-zinc-300">Drop your photo here, or <span className="text-indigo-300 underline">browse</span></div>
                    <div className="mt-1 text-xs text-zinc-500">Make sure the plate is readable</div>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
              </label>
              {fileError && <p className="mt-1.5 text-xs text-red-400">{fileError}</p>}
              <OcrHint file={file} onSuggest={setPlateText} />
            </section>

            {/* ── 4. Where & what ── */}
            <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
              <StepTitle n={4} title="Where & what" done={hasLocation} />
              <label className="grid gap-1.5">
                <span className="text-sm text-zinc-300">Location <span className="text-xs text-zinc-600">(required)</span></span>
                <input value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tirana, Albania"
                  className="h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none transition-colors focus:border-indigo-500" />
                {locationWarning
                  ? <span className="text-xs text-amber-400">{locationWarning}</span>
                  : <span className="text-xs text-zinc-600">City or area only — no street or house number.</span>}
              </label>

              <div className="border-t border-zinc-800 pt-4">
                <CarDetailsFields onChange={onCarDetails} />
              </div>

              {/* More details (optional) */}
              <div className="border-t border-zinc-800 pt-4">
                <button type="button" onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-sm font-medium text-zinc-300 hover:text-white" aria-expanded={moreOpen}>
                  <span>More details <span className="text-xs font-normal text-zinc-600">— tags, company, notes (optional)</span></span>
                  <span className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
                <div className={moreOpen ? "mt-4 space-y-4" : "hidden"}>
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">Transport company</p>
                    <CompanyPicker value={companyId} onChange={(id) => setCompanyId(id)} />
                  </div>
                  <DescriptionInput value={description} onChange={setDescription} />
                  <TagPicker selected={tags} onChange={setTags} max={6} />
                </div>
              </div>
            </section>
          </div>

          {/* ── Summary (sticky on desktop) ── */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Your spot</div>
              <div className="overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-zinc-800">
                {preview
                  ? <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                  : <div className="grid aspect-[4/3] place-items-center text-xs text-zinc-600">No photo yet</div>}
              </div>
              <div className={`mt-3 flex justify-center ${showingExample ? "opacity-40" : ""}`}>
                <PlateBadge country="albania" text={showingExample ? albaniaExample(plateTypeId) : previewText} plateType={plateTypeId} size="sm" />
              </div>
              <div className="mt-2 text-center text-sm text-zinc-300">
                {[brand, model].filter(Boolean).join(" ") || <span className="text-zinc-600">Vehicle (optional)</span>}
              </div>
              <div className="mt-0.5 text-center text-xs text-zinc-500">{selectedType.label}{location.trim() && ` · ${location.trim()}`}</div>

              <ul className="mt-4 space-y-1.5 border-t border-zinc-800 pt-4 text-sm">
                {[
                  { ok: hasPhoto, label: "Photo" },
                  { ok: hasPlate, label: "Plate number" },
                  { ok: hasLocation, label: "Location" },
                ].map((c) => (
                  <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-zinc-300" : "text-zinc-500"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${c.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-600"}`}>
                      {c.ok ? "✓" : ""}
                    </span>
                    {c.label}
                  </li>
                ))}
              </ul>

              <button type="submit" disabled={!canSubmit}
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
                {status === "uploading" ? "Uploading image…" : status === "saving" ? "Saving…" : "Upload spot"}
              </button>
              {status === "idle" && missing.length > 0 && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Add {missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0]} to upload.
                </p>
              )}
            </div>
          </aside>
        </form>
      </div>
    </main>
    </>
  );
}
