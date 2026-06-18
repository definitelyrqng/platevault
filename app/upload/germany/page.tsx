"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import TagPicker from "@/app/components/TagPicker";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import {
  GERMANY_REGIONS,
  GERMANY_CATEGORIES,
  CATEGORY_GROUPS,
  GERMANY_PLATE_FORMATS,
  GERMANY_STATE_AUTHORITIES,
  GERMANY_FEDERAL_BD,
  GERMANY_BP_VEHICLE_TYPES,
  GERMANY_BW_BRANCHES,
  RED_PLATE_CODES,
  TRANSFERABLE_SUFFIXES,
  MONTHS,
  buildGermanyPlateText,
  maxSuffixChars,
  PLATE_TYPE_LABELS,
  type GermanyCategoryId,
  type RedPlateCode,
} from "@/app/lib/germanyData";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return "Only JPG and PNG files are allowed.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return "File too large (max 8 MB).";
  return null;
}

function locationTooExact(loc: string) {
  const t = loc.toLowerCase();
  const streetWords = ["strasse", "straße", "str.", "street", "allee", "weg", "gasse", "road", "blvd", "avenue", "ave."];
  return streetWords.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}

// ── Region picker ─────────────────────────────────────────────────────────────
function RegionPicker({
  value,
  onChange,
  placeholder = "Search by code or city…",
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return GERMANY_REGIONS.slice(0, 80);

    const codeStartsWith = GERMANY_REGIONS.filter((r) => r.code.toLowerCase().startsWith(q));
    const nameIncludes   = GERMANY_REGIONS.filter((r) =>
      !r.code.toLowerCase().startsWith(q) && r.name.toLowerCase().includes(q)
    );

    // Within code matches: exact code match first, then shorter codes first (N before NÜ before NAB),
    // active before historical within same length
    codeStartsWith.sort((a, b) => {
      if (a.code.toLowerCase() === q && b.code.toLowerCase() !== q) return -1;
      if (b.code.toLowerCase() === q && a.code.toLowerCase() !== q) return  1;
      if (a.code.length !== b.code.length) return a.code.length - b.code.length;
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.code.localeCompare(b.code, "de");
    });

    return [...codeStartsWith, ...nameIncludes].slice(0, 60);
  }, [search]);

  const selectedRegion = GERMANY_REGIONS.find((r) => r.code === value);

  return (
    <div className="relative" ref={ref}>
      <input
        value={search || value}
        onChange={(e) => { setSearch(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-zinc-500 outline-none focus:border-zinc-600"
      />
      {value && !search && (
        <button
          type="button"
          onClick={() => { onChange(""); setSearch(""); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 text-xs"
        >✕</button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
          {filtered.map((r) => (
            <button
              key={r.code}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(r.code); setSearch(""); setOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors"
            >
              <span className={`font-mono font-bold w-12 shrink-0 ${r.active ? "text-zinc-100" : "text-zinc-500"}`}>{r.code}</span>
              <span className={`min-w-0 truncate text-xs ${r.active ? "text-zinc-300" : "text-zinc-500 italic"}`}>
                {r.name}{!r.active && " (hist.)"}
              </span>
            </button>
          ))}
        </div>
      )}
      {selectedRegion && (
        <p className="mt-1 text-xs text-indigo-400">{selectedRegion.code} — {selectedRegion.name}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GermanyUploadPage() {
  const router = useRouter();

  // ── Category & format
  const [category, setCategory] = useState<GermanyCategoryId>("regular");
  const [plateFormat, setPlateFormat] = useState("single");

  // ── Region-based fields
  const [regionCode, setRegionCode]   = useState("");
  const [plateSuffix, setPlateSuffix] = useState(""); // letters+numbers combined e.g. "AB1234"

  // ── Transit / export
  const [transitDate, setTransitDate]       = useState(""); // DD.MM.YY
  const [exportCheckLetter, setExportCheckLetter] = useState("");
  const [exportDate, setExportDate]         = useState(""); // DD.MM.YY

  // ── Seasonal
  const [seasonStart, setSeasonStart] = useState("04");
  const [seasonEnd, setSeasonEnd]     = useState("10");

  // ── Transferable
  const [transferSuffix, setTransferSuffix] = useState("0");

  // ── Red plate
  const [redCode, setRedCode] = useState<RedPlateCode>("04");
  const [redNumbers, setRedNumbers] = useState("");

  // ── Official / state authority
  const [officialNumbers, setOfficialNumbers] = useState("");
  const [stateCode, setStateCode]             = useState("");

  // ── Federal (BD / BP / BW / THW)
  const [federalSub, setFederalSub]         = useState<"bd" | "bp" | "bw" | "thw">("bd");
  const [federalBdNum, setFederalBdNum]     = useState<number | null>(null);
  const [federalBpCode, setFederalBpCode]   = useState<number | null>(null);
  const [federalBwBranch, setFederalBwBranch] = useState<number | null>(null);
  const [federalNumbers, setFederalNumbers] = useState("");

  // ── Diplomatic
  const [diplomPrefix, setDiplomPrefix]           = useState<"0" | "B" | "BN">("0");
  const [diplomCountryCode, setDiplomCountryCode] = useState("");
  const [diplomSerial, setDiplomSerial]           = useState("");
  const [diplomCheckLetter, setDiplomCheckLetter] = useState("");

  // ── Common fields
  const [location, setLocation]     = useState("");
  const [brand, setBrand]           = useState("");
  const [model, setModel]           = useState("");
  const [generation, setGeneration] = useState("");
  const [trim, setTrim]             = useState("");
  const [color, setColor]           = useState("");
  const [badge, setBadge]           = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [companyId, setCompanyId]   = useState<string | null>(null);

  // ── File / upload
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError]   = useState("");
  const [status, setStatus]   = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);

  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (multiSpotWarning && warningRef.current)
      warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [multiSpotWarning]);

  // ── Computed plate text
  const plateText = useMemo(() => buildGermanyPlateText({
    category,
    regionCode,
    plateSuffix,
    date: category === "transit-5day" ? transitDate : category === "export" ? exportDate : undefined,
    exportCheckLetter: category === "export" ? exportCheckLetter : undefined,
    seasonStart: (category === "seasonal" || category === "seasonal-h") ? seasonStart : undefined,
    seasonEnd:   (category === "seasonal" || category === "seasonal-h") ? seasonEnd   : undefined,
    transferSuffix: category === "transferable" ? transferSuffix : undefined,
    redCode:  category === "red" ? redCode : undefined,
    numbers:  category === "red" ? redNumbers
            : category === "transit-5day" ? officialNumbers
            : category === "official" ? officialNumbers
            : category === "state-authority" ? officialNumbers
            : category === "federal" ? federalNumbers
            : undefined,
    stateCode: category === "state-authority" ? stateCode : undefined,
    federalSub: category === "federal" ? federalSub : undefined,
    federalBdNum: category === "federal" && federalSub === "bd" ? federalBdNum : undefined,
    federalBpCode: category === "federal" && federalSub === "bp" ? federalBpCode : undefined,
    federalBwBranch: category === "federal" && federalSub === "bw" ? federalBwBranch : undefined,
    diplomPrefix: category === "diplomatic" ? diplomPrefix : undefined,
    diplomCountryCode: category === "diplomatic" ? diplomCountryCode : undefined,
    diplomSerial: category === "diplomatic" ? diplomSerial : undefined,
    diplomCheckLetter: category === "diplomatic" ? diplomCheckLetter : undefined,
  }), [category, regionCode, plateSuffix, transitDate, exportDate, exportCheckLetter,
       seasonStart, seasonEnd, transferSuffix, redCode, redNumbers, officialNumbers,
       stateCode, federalSub, federalBdNum, federalBpCode, federalBwBranch, federalNumbers,
       diplomPrefix, diplomCountryCode, diplomSerial, diplomCheckLetter]);

  // ── Plate type stored in DB
  const plateTypeStored = useMemo(() => {
    if (category === "regular" || category === "din") return `de-${category}-${plateFormat}`;
    if (category === "red") return `de-red-${redCode}`;
    if (category === "federal") return `de-federal-${federalSub}`;
    return `de-${category}`;
  }, [category, plateFormat, redCode, federalSub]);

  const plateTypeLabel = PLATE_TYPE_LABELS[plateTypeStored] ?? plateTypeStored;

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(location) ? "Keep it broad — city or area only, no street + number." : "";
  }, [location]);

  const canSubmit =
    !!file && !fileError &&
    plateText.trim().length >= 2 &&
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
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { startUpload } = useUploadThing("plateImageUploader");

  async function doUpload() {
    if (!file) return;
    setMultiSpotWarning(null);
    setStatus("uploading");
    setErrorMsg("");
    try {
      const uploaded = await startUpload([file]);
      if (!uploaded || !uploaded[0]?.ufsUrl) throw new Error("Image upload failed.");
      const imageUrl = uploaded[0].ufsUrl;
      setStatus("saving");
      const plateRegion =
        category === "state-authority" ? stateCode :
        category === "federal" ? null :
        category === "diplomatic" ? null :
        regionCode || null;
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "germany",
          plateText: plateText.trim().toUpperCase(),
          plateType: plateTypeStored,
          imageUrl,
          location: location.trim(),
          plateRegion,
          brand: brand.trim(), model: model.trim(),
          generation: generation.trim(), trim: trim.trim(),
          color: color.trim(), badge: badge.trim(),
          tags, companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");
      setStatus("done");
      const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
      const STREAK_MILESTONES = [3, 7, 14, 30, 100];
      const isMilestone =
        UPLOAD_MILESTONES.includes(data.uploadCount) ||
        (data.streak?.isNewDay && STREAK_MILESTONES.includes(data.streak?.current));
      if (isMilestone) {
        setMilestoneData({ uploadCount: data.uploadCount, streak: data.streak });
      } else {
        setTimeout(() => router.push("/c/germany"), 1500);
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
      const checkRes = await fetch(`/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=germany`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) { setMultiSpotWarning(checkData.spot); return; }
      }
    } catch { /* proceed */ }
    await doUpload();
  }

  // ── Helpers
  const isRegionBased = ["regular","din","transit-5day","export","oldtimer","seasonal","seasonal-h","electric","transferable","red","official"].includes(category);
  const isDIN     = category === "din";
  const regularFormats = GERMANY_PLATE_FORMATS.filter((f) => f.group === "regular");
  const dinFormats     = GERMANY_PLATE_FORMATS.filter((f) => f.group === "din");
  const selectedCat = GERMANY_CATEGORIES.find((c) => c.id === category)!;

  const maxSfx = maxSuffixChars(regionCode);

  // ── Preview styling
  const previewBg =
    category === "transit-5day"  ? "bg-yellow-900/40 border-yellow-700/50" :
    category === "export"        ? "bg-red-950/40 border-red-800/50" :
    category === "red"           ? "bg-red-950/40 border-red-800/50" :
    category === "din"           ? "bg-zinc-800 border-zinc-600" :
    "bg-zinc-950 border-zinc-700";

  const previewTextColor =
    category === "transit-5day"  ? "text-zinc-900" :
    category === "export"        ? "text-red-200" :
    category === "red"           ? "text-red-200" :
    category === "din"           ? "text-zinc-100" :
    "text-zinc-100";

  const placeholderText =
    category === "regular"        ? "B-AB1234" :
    category === "din"            ? "B-AB1234" :
    category === "transit-5day"   ? "B-123456 23.06.26" :
    category === "export"         ? "B-AB1234-A 01.01.27" :
    category === "oldtimer"       ? "B-AB1234H" :
    category === "seasonal"       ? "B-AB1234 04/10" :
    category === "seasonal-h"     ? "B-AB1234H 04/10" :
    category === "electric"       ? "B-AB1234E" :
    category === "transferable"   ? "B-AB1234-0" :
    category === "red"            ? "B-041234" :
    category === "official"       ? "B-123456" :
    category === "state-authority"? "THL-123456" :
    category === "federal"        ? "BD 5-123456" :
    category === "diplomatic"     ? "0-42-123456A" :
    "…";

  return (
    <>
      <MilestonePopup data={milestoneData} onDone={() => { setMilestoneData(null); router.push("/c/germany"); }} />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <a href="/upload" className="hover:text-zinc-300 transition-colors">Upload</a>
              <span>›</span>
              <span className="text-zinc-300">Germany 🇩🇪</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Upload — Germany</h1>
            <p className="mt-1 text-sm text-zinc-400">All Kfz-Kennzeichen types — regular, historic, official, federal & diplomatic.</p>
          </div>

          {/* Status banners */}
          {status === "done" && (
            <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
              Uploaded! Redirecting to the Germany gallery…
            </div>
          )}
          {status === "error" && (
            <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
              {errorMsg}
              <button onClick={() => setStatus("idle")} className="ml-3 underline">Try again</button>
            </div>
          )}

          {/* Multi-spot warning */}
          {multiSpotWarning && (
            <div ref={warningRef} className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/30 px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">📍</span>
                <div>
                  <p className="text-sm font-semibold text-amber-300">This plate has already been spotted!</p>
                  <p className="mt-1 text-sm text-amber-200/70">
                    <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">
                      {multiSpotWarning.plateText}
                    </a>{" "}was first spotted by{" "}
                    <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">
                      @{multiSpotWarning.username}
                    </a>. This will count as a Multi Spot.
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
            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Category selector ── */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <span className="text-sm font-medium text-zinc-200">Plate type</span>
                {CATEGORY_GROUPS.map((group) => {
                  const cats = GERMANY_CATEGORIES.filter((c) => c.group === group.id);
                  if (!cats.length) return null;
                  return (
                    <div key={group.id}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">{group.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {cats.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                              category === cat.id
                                ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                            }`}
                          >
                            <span className="text-base shrink-0">{cat.emoji}</span>
                            <span className="font-medium leading-snug">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Category description ── */}
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-400 leading-relaxed">
                <span className="mr-2">{selectedCat.emoji}</span>
                <strong className="text-zinc-200">{selectedCat.label}:</strong>{" "}
                {selectedCat.desc}
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
                      isDragging ? "border-zinc-400 bg-zinc-800/60" :
                      fileError  ? "border-red-800 bg-red-950/20" :
                      "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"
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
                  <OcrHint file={file} />
                </div>

                {/* ── Plate format (regular / din only) ── */}
                {(category === "regular" || isDIN) && (
                  <div>
                    <span className="block text-sm text-zinc-300 mb-2">Format</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(isDIN ? dinFormats : regularFormats).map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setPlateFormat(fmt.id)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                            plateFormat === fmt.id
                              ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          <div className="font-medium">{fmt.label}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{fmt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Region-based fields ── */}
                {isRegionBased && (
                  <div className="space-y-4">
                    {/* District code */}
                    <div className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">District code</span>
                      <RegionPicker value={regionCode} onChange={setRegionCode} />
                    </div>

                    {/* 5-day transit date */}
                    {category === "transit-5day" && (
                      <div>
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Expiry date <span className="text-zinc-600 text-xs">(DD.MM.YY)</span></span>
                          <input
                            value={transitDate}
                            onChange={(e) => setTransitDate(e.target.value.slice(0, 8))}
                            placeholder="23.06.26"
                            maxLength={8}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                          />
                        </label>
                        <p className="mt-1 text-xs text-zinc-600">Format: DD.MM.YY</p>
                      </div>
                    )}

                    {/* Export fields */}
                    {category === "export" && (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1.5 col-span-2">
                          <span className="text-sm text-zinc-300">Expiry date <span className="text-zinc-600 text-xs">(DD.MM.YY)</span></span>
                          <input
                            value={exportDate}
                            onChange={(e) => setExportDate(e.target.value.slice(0, 8))}
                            placeholder="01.01.27"
                            maxLength={8}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Check letter <span className="text-zinc-600 text-xs">(A–Z)</span></span>
                          <input
                            value={exportCheckLetter}
                            onChange={(e) => setExportCheckLetter(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0,1).toUpperCase())}
                            placeholder="A"
                            maxLength={1}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-zinc-600"
                          />
                        </label>
                      </div>
                    )}

                    {/* Seasonal months */}
                    {(category === "seasonal" || category === "seasonal-h") && (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Season start</span>
                          <select value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600">
                            {MONTHS.map((m) => <option key={m.num} value={m.num}>{m.label}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Season end</span>
                          <select value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600">
                            {MONTHS.map((m) => <option key={m.num} value={m.num}>{m.label}</option>)}
                          </select>
                        </label>
                      </div>
                    )}

                    {/* Suffix for regular/DIN/oldtimer/seasonal/electric */}
                    {!["transit-5day","export","red","official"].includes(category) && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">
                          Plate suffix <span className="text-zinc-600 text-xs">(letters + numbers, max {maxSfx} chars)</span>
                        </span>
                        <input
                          value={plateSuffix}
                          onChange={(e) => setPlateSuffix(e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0, maxSfx).toUpperCase())}
                          placeholder="AB1234"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-zinc-600"
                        />
                        {regionCode && <p className="text-xs text-zinc-600">e.g. {regionCode}-AB1234 · total incl. region: max 8 chars</p>}
                      </label>
                    )}

                    {/* Transit serial numbers */}
                    {category === "transit-5day" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Serial number <span className="text-zinc-600 text-xs">(6 digits)</span></span>
                        <input
                          value={officialNumbers}
                          onChange={(e) => setOfficialNumbers(e.target.value.replace(/\D/g,"").slice(0,6))}
                          placeholder="123456"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                        />
                      </label>
                    )}

                    {/* Official / consulate serial */}
                    {category === "official" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Number <span className="text-zinc-600 text-xs">(up to 6 digits)</span></span>
                        <input
                          value={officialNumbers}
                          onChange={(e) => setOfficialNumbers(e.target.value.replace(/\D/g,"").slice(0,6))}
                          placeholder="123456"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                        />
                      </label>
                    )}

                    {/* Red plate */}
                    {category === "red" && (
                      <div className="space-y-3">
                        <div className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Red plate type</span>
                          <div className="grid grid-cols-2 gap-2">
                            {RED_PLATE_CODES.map((rc2) => (
                              <button
                                key={rc2.code}
                                type="button"
                                onClick={() => setRedCode(rc2.code)}
                                className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                                  redCode === rc2.code
                                    ? "border-red-700 bg-red-950/60 text-red-200"
                                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                                }`}
                              >
                                {rc2.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Number <span className="text-zinc-600 text-xs">(1–4 digits)</span></span>
                          <input
                            value={redNumbers}
                            onChange={(e) => setRedNumbers(e.target.value.replace(/\D/g,"").slice(0,4))}
                            placeholder="1234"
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                          />
                        </label>
                      </div>
                    )}

                    {/* Transferable suffix */}
                    {category === "transferable" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Wechsel suffix</span>
                        <select value={transferSuffix} onChange={(e) => setTransferSuffix(e.target.value)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                          {TRANSFERABLE_SUFFIXES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <p className="text-xs text-zinc-600">Suffix identifies which vehicle is currently using the plate</p>
                      </label>
                    )}
                  </div>
                )}

                {/* ── State authority ── */}
                {category === "state-authority" && (
                  <div className="space-y-3">
                    <label className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">State authority</span>
                      <select
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      >
                        <option value="">Select authority…</option>
                        {GERMANY_STATE_AUTHORITIES.map((a) => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">Number <span className="text-zinc-600 text-xs">(up to 6 digits)</span></span>
                      <input
                        value={officialNumbers}
                        onChange={(e) => setOfficialNumbers(e.target.value.replace(/\D/g,"").slice(0,6))}
                        placeholder="123456"
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                      />
                    </label>
                    <p className="text-xs text-zinc-500">Format: STATECODE-123456 · e.g. THL-123456</p>
                  </div>
                )}

                {/* ── Federal agencies (BD / BP / BW / THW) ── */}
                {category === "federal" && (
                  <div className="space-y-4">
                    {/* Sub-type picker */}
                    <div>
                      <span className="block text-sm text-zinc-300 mb-2">Agency type</span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {([
                          { id: "bd",  label: "BD",  desc: "Federal ministries" },
                          { id: "bp",  label: "BP",  desc: "Federal Police" },
                          { id: "bw",  label: "BW",  desc: "Federal Waterways" },
                          { id: "thw", label: "THW", desc: "Federal Relief" },
                        ] as const).map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setFederalSub(sub.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                              federalSub === sub.id
                                ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            <div className="font-mono font-bold">{sub.label}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{sub.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BD agency selector */}
                    {federalSub === "bd" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Ministry / Agency</span>
                        <select
                          value={federalBdNum ?? ""}
                          onChange={(e) => setFederalBdNum(e.target.value ? Number(e.target.value) : null)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                        >
                          <option value="">Select agency…</option>
                          {GERMANY_FEDERAL_BD.map((a) => (
                            <option key={a.num} value={a.num}>BD {a.num} — {a.name}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {/* BP vehicle type */}
                    {federalSub === "bp" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Vehicle type code</span>
                        <select
                          value={federalBpCode ?? ""}
                          onChange={(e) => setFederalBpCode(e.target.value ? Number(e.target.value) : null)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                        >
                          <option value="">Select type…</option>
                          {GERMANY_BP_VEHICLE_TYPES.map((t) => (
                            <option key={t.code} value={t.code}>{t.label}</option>
                          ))}
                        </select>
                        <p className="text-xs text-zinc-600">Format: BP {federalBpCode ?? "XX"}-123456</p>
                      </label>
                    )}

                    {/* BW branch */}
                    {federalSub === "bw" && (
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Branch office</span>
                        <select
                          value={federalBwBranch ?? ""}
                          onChange={(e) => setFederalBwBranch(e.target.value ? Number(e.target.value) : null)}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                        >
                          <option value="">Select branch…</option>
                          {GERMANY_BW_BRANCHES.map((b) => (
                            <option key={b.num} value={b.num}>{b.num} — {b.name} ({b.city})</option>
                          ))}
                        </select>
                        <p className="text-xs text-zinc-600">Format: BW {federalBwBranch ?? "X"}-123456</p>
                      </label>
                    )}

                    {/* Serial number (all federal types) */}
                    <label className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">Serial number <span className="text-zinc-600 text-xs">(up to 6 digits)</span></span>
                      <input
                        value={federalNumbers}
                        onChange={(e) => setFederalNumbers(e.target.value.replace(/\D/g,"").slice(0,6))}
                        placeholder="123456"
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                      />
                    </label>
                  </div>
                )}

                {/* ── Diplomatic ── */}
                {category === "diplomatic" && (
                  <div className="space-y-4">
                    {/* Prefix */}
                    <div>
                      <span className="block text-sm text-zinc-300 mb-2">Prefix</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(["0","B","BN"] as const).map((pre) => (
                          <button
                            key={pre}
                            type="button"
                            onClick={() => setDiplomPrefix(pre)}
                            className={`rounded-xl border px-3 py-2 text-center text-sm font-mono font-bold transition-all ${
                              diplomPrefix === pre
                                ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >{pre}</button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-zinc-600">
                        0 = Foreign diplomatic · B = Consular / staff · BN = Honorary consul (Bonn era)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Country code <span className="text-zinc-600 text-xs">(10–317)</span></span>
                        <input
                          value={diplomCountryCode}
                          onChange={(e) => setDiplomCountryCode(e.target.value.replace(/\D/g,"").slice(0,3))}
                          placeholder="42"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-sm text-zinc-300">Serial <span className="text-zinc-600 text-xs">(up to 6 digits)</span></span>
                        <input
                          value={diplomSerial}
                          onChange={(e) => setDiplomSerial(e.target.value.replace(/\D/g,"").slice(0,6))}
                          placeholder="123456"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                        />
                      </label>
                    </div>

                    <label className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">Check letter <span className="text-zinc-600 text-xs">(optional, A–Z)</span></span>
                      <input
                        value={diplomCheckLetter}
                        onChange={(e) => setDiplomCheckLetter(e.target.value.replace(/[^a-zA-Z]/g,"").slice(0,1).toUpperCase())}
                        placeholder="A"
                        maxLength={1}
                        className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-zinc-600"
                      />
                    </label>
                    <p className="text-xs text-zinc-500">Format: {diplomPrefix}-XX-123456A</p>
                  </div>
                )}

                {/* ── Location ── */}
                <label className="grid gap-1.5">
                  <span className="text-sm text-zinc-300">Location <span className="text-zinc-600 text-xs">(city required)</span></span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Berlin, Germany"
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  />
                  {locationWarning
                    ? <span className="text-xs text-amber-400">{locationWarning}</span>
                    : <span className="text-xs text-zinc-600">City only, no street or house number.</span>}
                </label>

                {/* ── Car details ── */}
                <div className="pt-2 border-t border-zinc-800">
                  <CarDetailsFields onChange={useCallback((d) => {
                    setBrand(d.brand); setModel(d.model); setGeneration(d.generation);
                    setTrim(d.trim); setColor(d.color); setBadge(d.badge);
                  }, [])} />
                </div>

                {/* ── Tags ── */}
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
                      {!file ? "Add a photo" : plateText.trim().length < 2 ? "Enter plate text" : location.trim().length < 2 ? "Enter a location" : "Ready"}
                    </span>
                  )}
                </div>
              </div>
            </form>

            {/* ── Sidebar ── */}
            <aside className="space-y-4">
              {/* Live preview */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Live preview</div>
                <div className={`rounded-xl border px-4 py-5 text-center ${previewBg}`}>
                  {/* EU band for standard plates */}
                  {["regular","electric","oldtimer","seasonal","seasonal-h","transferable"].includes(category) && (
                    <div className="mb-2 flex items-center justify-center gap-1">
                      <div className="h-4 w-5 rounded-sm bg-blue-800 flex items-center justify-center">
                        <span className="text-[7px] text-yellow-300 font-bold">EU</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">DE</span>
                    </div>
                  )}
                  {/* Yellow band for transit */}
                  {category === "transit-5day" && (
                    <div className="mb-2 flex items-center justify-center">
                      <div className="h-4 px-2 rounded-sm bg-yellow-500 flex items-center justify-center">
                        <span className="text-[7px] text-black font-bold">5 TAGE</span>
                      </div>
                    </div>
                  )}
                  <div className={`font-mono text-xl font-bold tracking-widest ${previewTextColor}`}>
                    {plateText.trim() || placeholderText}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">Germany 🇩🇪</div>
                </div>
              </div>

              {/* Stored as */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
                <div className="text-sm font-medium text-zinc-200 mb-1">📋 Stored as</div>
                <p className="text-xs text-indigo-400 font-mono">{plateTypeStored}</p>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{plateTypeLabel}</p>
              </div>

              {/* Format guide */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5">
                <div className="text-sm font-medium text-zinc-200 mb-2">📖 Format guide</div>
                <div className="text-xs text-zinc-400 space-y-1.5 leading-relaxed">
                  {category === "regular" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234</span> — Berlin, AB 1234</p>
                    <p><span className="font-mono text-zinc-200">MÜ-K1</span> — Mühldorf, K 1</p>
                    <p className="text-zinc-600">Max 8 total chars including region code</p>
                  </>}
                  {category === "din" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234</span> — pre-1994 black plate</p>
                    <p className="text-zinc-600">White text on black background</p>
                  </>}
                  {category === "transit-5day" && <>
                    <p><span className="font-mono text-zinc-200">B-123456 23.06.26</span></p>
                    <p className="text-zinc-600">Yellow background · valid up to 5 days</p>
                  </>}
                  {category === "export" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234-A 01.01.27</span></p>
                    <p className="text-zinc-600">Red plate with check letter + expiry date</p>
                  </>}
                  {category === "oldtimer" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234H</span></p>
                    <p className="text-zinc-600">H suffix directly attached · 30+ year old vehicle</p>
                  </>}
                  {category === "seasonal" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234 04/10</span></p>
                    <p className="text-zinc-600">Start/end month shown on the sticker</p>
                  </>}
                  {category === "seasonal-h" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234H 04/10</span></p>
                    <p className="text-zinc-600">Historic + seasonal · H before season</p>
                  </>}
                  {category === "electric" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234E</span></p>
                    <p className="text-zinc-600">E suffix directly attached · EV or hydrogen</p>
                  </>}
                  {category === "transferable" && <>
                    <p><span className="font-mono text-zinc-200">B-AB1234-0</span></p>
                    <p className="text-zinc-600">Suffix 0–9, 0H–9H, 0E–9E identifies vehicle</p>
                  </>}
                  {category === "red" && <>
                    <p><span className="font-mono text-zinc-200">B-041234</span> — 04 Dealer</p>
                    <p><span className="font-mono text-zinc-200">B-061234</span> — 06 Trade</p>
                    <p className="text-zinc-600">Red background · no EU band</p>
                  </>}
                  {category === "official" && <>
                    <p><span className="font-mono text-zinc-200">B-123456</span></p>
                    <p className="text-zinc-600">Official services &amp; consulates · numeric only</p>
                  </>}
                  {category === "state-authority" && <>
                    <p><span className="font-mono text-zinc-200">THL-123456</span> — Thuringia</p>
                    <p><span className="font-mono text-zinc-200">BBL-123456</span> — Brandenburg</p>
                  </>}
                  {category === "federal" && federalSub === "bd" && <>
                    <p><span className="font-mono text-zinc-200">BD 5-123456</span></p>
                    <p className="text-zinc-600">BD + agency number + serial</p>
                  </>}
                  {category === "federal" && federalSub === "bp" && <>
                    <p><span className="font-mono text-zinc-200">BP 15-123456</span></p>
                    <p className="text-zinc-600">BP + vehicle type code (10–62) + serial</p>
                  </>}
                  {category === "federal" && federalSub === "bw" && <>
                    <p><span className="font-mono text-zinc-200">BW 3-123456</span></p>
                    <p className="text-zinc-600">BW + branch number (1–7) + serial</p>
                  </>}
                  {category === "federal" && federalSub === "thw" && <>
                    <p><span className="font-mono text-zinc-200">THW-123456</span></p>
                    <p className="text-zinc-600">THW + serial, no space</p>
                  </>}
                  {category === "diplomatic" && <>
                    <p><span className="font-mono text-zinc-200">0-42-123456A</span></p>
                    <p className="text-zinc-600">0 · country code · serial · check letter</p>
                  </>}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
