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
import DescriptionInput from "@/app/components/DescriptionInput";
import {
  CZECH_REGIONS_2001,
  CZECH_REGIONS_1960,
  CZECH_REGION_NUMS,
  CZECH_SERIAL_LETTERS_1960,
  CZECH_CATEGORIES,
  CZECH_FORMATS,
  CZECH_CATEGORY_GROUPS,
  buildCzechPlateText,
  type CzechCategoryId,
} from "@/app/lib/czechData";

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
  const streetWords = ["strasse","straße","str.","street","ulice","avenue","road","gasse","allee","weg"];
  return streetWords.some((w) => t.includes(w)) && /\b\d{1,4}[a-z]?\b/.test(t);
}

function RegionPicker2001({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return CZECH_REGIONS_2001;
    return CZECH_REGIONS_2001.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [search]);
  const sel = CZECH_REGIONS_2001.find((r) => r.code === value);
  return (
    <div className="relative" ref={ref}>
      <input value={search || value} onChange={(e) => { setSearch(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder="Region…"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-zinc-500 outline-none focus:border-zinc-600" />
      {value && !search && (
        <button type="button" onClick={() => { onChange(""); setSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-52 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
          {filtered.map((r) => (
            <button key={r.code} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(r.code); setSearch(""); setOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-800">
              <span className="font-mono font-bold w-6 shrink-0 text-zinc-100">{r.code}</span>
              <span className="text-xs text-zinc-300">{r.name}</span>
            </button>
          ))}
        </div>
      )}
      {sel && <p className="mt-1 text-xs text-indigo-400">{sel.code} — {sel.name}</p>}
    </div>
  );
}

function RegionPicker1960({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return CZECH_REGIONS_1960.slice(0, 60);
    return CZECH_REGIONS_1960.filter((r) => r.code.toLowerCase().startsWith(q) || r.name.toLowerCase().includes(q)).slice(0, 60);
  }, [search]);
  const sel = CZECH_REGIONS_1960.find((r) => r.code === value);
  return (
    <div className="relative" ref={ref}>
      <input value={search || value} onChange={(e) => { setSearch(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder="District…"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-zinc-500 outline-none focus:border-zinc-600" />
      {value && !search && (
        <button type="button" onClick={() => { onChange(""); setSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-52 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
          {filtered.map((r) => (
            <button key={r.code} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(r.code); setSearch(""); setOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-800">
              <span className="font-mono font-bold w-8 shrink-0 text-zinc-100">{r.code}</span>
              <span className="text-xs text-zinc-300">{r.name}</span>
            </button>
          ))}
        </div>
      )}
      {sel && <p className="mt-1 text-xs text-indigo-400">{sel.code} — {sel.name}</p>}
    </div>
  );
}

const DIGITS_1_9 = ["1","2","3","4","5","6","7","8","9"];
const DIGITS_0_9 = ["0","1","2","3","4","5","6","7","8","9"];
const DEALER_LETTERS = ["A","B","C","E","H","J","K","L","M","P","S","T","U","X","Z"];
const OPT_CHARS = ["", ...Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), ...Array.from("0123456789")];

export default function CzechUploadPage() {
  const router = useRouter();
  const [category, setCategory] = useState<CzechCategoryId>("car2001");
  const [plateFormat, setPlateFormat] = useState("single-euro");
  const [firstDigit, setFirstDigit]     = useState("1");
  const [regionLetter, setRegionLetter] = useState("");
  const [optionalChar, setOptionalChar] = useState("");
  const [fourDigits, setFourDigits]     = useState("");
  const [dealerLetter, setDealerLetter] = useState("A");
  const [regionNum, setRegionNum]       = useState("01");
  const [elDigit, setElDigit]           = useState("0");
  const [diplom1, setDiplom1]           = useState("");
  const [diplom2, setDiplom2]           = useState("");
  const [custom, setCustom]             = useState("");
  const [regionCode1960, setRegionCode1960] = useState("");
  const [serialLetter, setSerialLetter]     = useState("A");
  const [num1, setNum1]                     = useState("");
  const [num2, setNum2]                     = useState("");
  const [motoType1960, setMotoType1960]     = useState("trap60");
  const [location, setLocation]     = useState("");
  const [brand, setBrand]           = useState("");
  const [model, setModel]           = useState("");
  const [generation, setGeneration] = useState("");
  const [trim, setTrim]             = useState("");
  const [color, setColor]           = useState("");
  const [badge, setBadge]           = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [companyId, setCompanyId]   = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError]   = useState("");
  const [status, setStatus]         = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  useEffect(() => {
    if (status === "uploading") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [status]);
  const [errorMsg, setErrorMsg]     = useState("");
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);
  const [newSpotId, setNewSpotId] = useState<number | null>(null);
  type ExistingSpot = { numericId: number; plateText: string; username: string; userNumericId: number };
  const [multiSpotWarning, setMultiSpotWarning] = useState<ExistingSpot | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (multiSpotWarning && warningRef.current) warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }, [multiSpotWarning]);
  useEffect(() => { const fmts = CZECH_FORMATS[category]; if (fmts?.length) setPlateFormat(fmts[0].id); }, [category]);

  const plateText = useMemo(() => buildCzechPlateText(category, { firstDigit, regionLetter, optionalChar, fourDigits, regionNum, dealerLetter, elDigit, diplom1, diplom2, custom, regionCode1960, serialLetter, num1, num2 }),
    [category, firstDigit, regionLetter, optionalChar, fourDigits, regionNum, dealerLetter, elDigit, diplom1, diplom2, custom, regionCode1960, serialLetter, num1, num2]);

  const plateTypeStored = useMemo(() => category === "moto1960" ? `cz-moto1960-${motoType1960}` : `cz-${category}-${plateFormat}`, [category, plateFormat, motoType1960]);
  const locationWarning = useMemo(() => { if (!location.trim()) return ""; return locationTooExact(location) ? "Keep it broad — city or area only." : ""; }, [location]);
  const is1960 = ["car1960","moto1960","commercial1960","agricultural1960","trailer1977"].includes(category);
  const is2001RegionBased = ["car2001","moto2001","dealer2001","sport2001","oldtimer2001","electric","foreign"].includes(category);
  const isFreeText = ["vanity","export"].includes(category);
  const isDiplomatic = category === "diplomatic";
  const canSubmit = !!file && !fileError && plateText.trim().length >= 2 && location.trim().length >= 2 && !locationWarning && status === "idle";

  function handleFileSelect(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); setPreview(null); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { startUpload } = useUploadThing("plateImageUploader");

  async function doUpload() {
    if (!file) return;
    setMultiSpotWarning(null); setStatus("uploading"); setErrorMsg("");
    try {
      const uploaded = await startUpload([file]);
      if (!uploaded || !uploaded[0]?.ufsUrl) throw new Error("Image upload failed.");
      const imageUrl = uploaded[0].ufsUrl;
      setStatus("saving");
      const res = await fetch("/api/uploads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "czech", plateText: plateText.trim().toUpperCase(), plateType: plateTypeStored, imageUrl, location: location.trim(),
          plateRegion: is2001RegionBased ? (regionLetter || null) : (regionCode1960 || null),
          brand: brand.trim(), model: model.trim(), generation: generation.trim(), trim: trim.trim(), color: color.trim(), badge: badge.trim(), tags, companyId, description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save upload.");
      setNewSpotId(data.upload.numericId);
      setStatus("done");
      const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
      const STREAK_MILESTONES = [3, 7, 14, 30, 100];
      const isMilestone = UPLOAD_MILESTONES.includes(data.uploadCount) || (data.streak?.isNewDay && STREAK_MILESTONES.includes(data.streak?.current));
      if (isMilestone) { setNewSpotId(data.upload.numericId); setMilestoneData({ uploadCount: data.uploadCount, streak: data.streak }); }
      else { router.push(`/spot/${data.upload.numericId}`); }
    } catch (err) { setStatus("error"); setErrorMsg(err instanceof Error ? err.message : "Something went wrong."); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setErrorMsg("");
    try {
      const checkRes = await fetch(`/api/uploads/check?plateText=${encodeURIComponent(plateText.trim())}&country=czech`);
      if (checkRes.ok) { const checkData = await checkRes.json(); if (checkData.exists) { setMultiSpotWarning(checkData.spot); return; } }
    } catch { /* proceed */ }
    await doUpload();
  }

  const selectedCat = CZECH_CATEGORIES.find((c) => c.id === category)!;
  const formats = CZECH_FORMATS[category] ?? [];
  const previewTextColor =
    category === "dealer2001"        ? "text-green-400" :
    category === "commercial1960"    ? "text-yellow-300" :
    category === "agricultural1960"  ? "text-yellow-300" :
    category === "foreign"           ? "text-yellow-200" :
    category === "diplomatic"        ? "text-indigo-300" :
    "text-zinc-100";
  const previewBg =
    category === "commercial1960"   ? "bg-zinc-900 border-yellow-800/50" :
    category === "agricultural1960" ? "bg-zinc-900 border-yellow-800/50" :
    category === "foreign"          ? "bg-indigo-950/40 border-indigo-700/50" :
    "bg-zinc-950 border-zinc-700";

  const onCarChange = useCallback((d: { brand: string; model: string; generation: string; trim: string; color: string; badge: string }) => {
    setBrand(d.brand); setModel(d.model); setGeneration(d.generation); setTrim(d.trim); setColor(d.color); setBadge(d.badge);
  }, []);

  return (
    <>
      <MilestonePopup data={milestoneData} onDone={() => { setMilestoneData(null); router.push(`/spot/${newSpotId}`); }} />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <a href="/upload" className="hover:text-zinc-300 transition-colors">Upload</a>
              <span>›</span>
              <span className="text-zinc-300">Czech Republic 🇨🇿</span>
            </div>
            <h1 className="mt-2 text-2xl font-black">Upload — Czech Republic</h1>
            <p className="mt-1 text-sm text-zinc-400">All Czech plate types — current (2001+) and historical (1960).</p>
          </div>

          {status === "done" && (
            <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
              Uploaded! Redirecting to the Czech Republic gallery…
            </div>
          )}
          {status === "error" && (
            <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 px-5 py-4 text-sm text-red-300">
              {errorMsg} <button onClick={() => setStatus("idle")} className="ml-3 underline">Try again</button>
            </div>
          )}
          {multiSpotWarning && (
            <div ref={warningRef} className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/30 px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">📍</span>
                <div>
                  <p className="text-sm font-semibold text-amber-300">This plate has already been spotted!</p>
                  <p className="mt-1 text-sm text-amber-200/70">
                    <a href={`/spot/${multiSpotWarning.numericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">{multiSpotWarning.plateText}</a>{" "}
                    was first spotted by <a href={`/u/${multiSpotWarning.userNumericId}`} className="underline hover:text-amber-200" target="_blank" rel="noreferrer">@{multiSpotWarning.username}</a>. This will count as a Multi Spot.
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

              {/* Category selector */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <span className="text-sm font-medium text-zinc-200">Plate type</span>
                {[...CZECH_CATEGORY_GROUPS, { id: "special", label: "Special", ids: CZECH_CATEGORIES.filter((c) => c.group === "special").map((c) => c.id) as CzechCategoryId[] }].map((group) => {
                  const cats = CZECH_CATEGORIES.filter((c) => group.ids.includes(c.id));
                  if (!cats.length) return null;
                  return (
                    <div key={group.id}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">{group.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {cats.map((cat) => (
                          <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                              category === cat.id ? "border-indigo-600 bg-indigo-950/50 text-indigo-200" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                            }`}>
                            <span className="text-base shrink-0">{cat.emoji}</span>
                            <span className="font-medium leading-snug">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category hint */}
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-400 leading-relaxed">
                <span className="mr-2">{selectedCat.emoji}</span>
                <strong className="text-zinc-200">{selectedCat.label}:</strong>{" "}{selectedCat.hint}
                {" "}<span className="font-mono text-zinc-500">e.g. {selectedCat.example}</span>
              </div>

              {/* Main fields */}
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
                    style={{ minHeight: preview ? "auto" : "150px" }}>
                    {preview ? (
                      <div className="relative w-full group">
                        <ZoomImage src={preview} alt="Preview" className="rounded-xl" />
                        <button type="button" onClick={(e) => { e.preventDefault(); handleFileSelect(null); }}
                          className="absolute top-2 right-2 rounded-lg bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">Remove</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-8 text-center">
                        <span className="text-2xl">📷</span>
                        <p className="text-sm text-zinc-400">Drop image here or click to browse</p>
                      </div>
                    )}
                    <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
                  </label>
                  {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
                  {file && !fileError && (
                    <div className="mt-2">
                      <OcrHint file={file} onSuggest={(text: string) => { if (isFreeText) setCustom(text.replace(/\s+/g,"").toUpperCase().slice(0,9)); }} />
                    </div>
                  )}
                </div>
                <div className="border-t border-zinc-800" />

                {/* Plate fields */}
                <div>
                  <span className="block text-sm text-zinc-300 mb-3">Plate number</span>

                  {/* 2001 car / foreign */}
                  {(category === "car2001" || category === "foreign") && (
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Digit</label>
                        <select value={firstDigit} onChange={(e) => setFirstDigit(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                          {DIGITS_1_9.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Region</label>
                        <RegionPicker2001 value={regionLetter} onChange={setRegionLetter} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">3rd char</label>
                        <select value={optionalChar} onChange={(e) => setOptionalChar(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                          {OPT_CHARS.map((v) => <option key={v} value={v}>{v === "" ? "—" : v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">4 digits</label>
                        <input value={fourDigits} onChange={(e) => setFourDigits(e.target.value.replace(/[^A-Z0-9]/gi,"").slice(0,4).toUpperCase())}
                          placeholder="3165" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* 2001 motorcycle */}
                  {category === "moto2001" && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Digit</label>
                        <select value={firstDigit} onChange={(e) => setFirstDigit(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                          {DIGITS_1_9.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Region</label>
                        <RegionPicker2001 value={regionLetter} onChange={setRegionLetter} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">4 digits</label>
                        <input value={fourDigits} onChange={(e) => setFourDigits(e.target.value.replace(/[^A-Z0-9]/gi,"").slice(0,4).toUpperCase())}
                          placeholder="0128" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* Dealer */}
                  {category === "dealer2001" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Region letter</label>
                        <select value={dealerLetter} onChange={(e) => setDealerLetter(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono text-green-400 outline-none focus:border-zinc-600">
                          {DEALER_LETTERS.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">4 digits</label>
                        <input value={fourDigits} onChange={(e) => setFourDigits(e.target.value.replace(/[^A-Z0-9]/gi,"").slice(0,4).toUpperCase())}
                          placeholder="5912" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono text-green-400 outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* Sport / Oldtimer */}
                  {(category === "sport2001" || category === "oldtimer2001") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Region (01–14)</label>
                        <select value={regionNum} onChange={(e) => setRegionNum(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                          {CZECH_REGION_NUMS.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">4 digits</label>
                        <input value={fourDigits} onChange={(e) => setFourDigits(e.target.value.replace(/[^A-Z0-9]/gi,"").slice(0,4).toUpperCase())}
                          placeholder={category === "sport2001" ? "0466" : "1621"} maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* Electric */}
                  {category === "electric" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">EL + digit</label>
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-400 shrink-0">EL</span>
                          <select value={elDigit} onChange={(e) => setElDigit(e.target.value)} className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                            {DIGITS_0_9.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">4 digits</label>
                        <input value={fourDigits} onChange={(e) => setFourDigits(e.target.value.replace(/[^A-Z0-9]/gi,"").slice(0,4).toUpperCase())}
                          placeholder="1234" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* Diplomatic */}
                  {isDiplomatic && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">First 4 digits</label>
                        <input value={diplom1} onChange={(e) => setDiplom1(e.target.value.replace(/\D/g,"").slice(0,4))}
                          placeholder="1234" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Second 4 digits</label>
                        <input value={diplom2} onChange={(e) => setDiplom2(e.target.value.replace(/\D/g,"").slice(0,4))}
                          placeholder="5678" maxLength={4} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                      </div>
                    </div>
                  )}

                  {/* Vanity / Export */}
                  {isFreeText && (
                    <input value={custom} onChange={(e) => setCustom(e.target.value.toUpperCase().slice(0,9))}
                      placeholder={category === "vanity" ? "CZECHREP" : "EXPORT123"} maxLength={9}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                  )}

                  {/* 1960 system */}
                  {is1960 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-zinc-500">District code</label>
                          <RegionPicker1960 value={regionCode1960} onChange={setRegionCode1960} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-zinc-500">Letter (A–V)</label>
                          <select value={serialLetter} onChange={(e) => setSerialLetter(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600">
                            {CZECH_SERIAL_LETTERS_1960.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-zinc-500">Number (XX-YY)</label>
                          <div className="flex items-center gap-1">
                            <input value={num1} onChange={(e) => setNum1(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="47" maxLength={2} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                            <span className="text-zinc-500 shrink-0">-</span>
                            <input value={num2} onChange={(e) => setNum2(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="69" maxLength={2} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm font-mono outline-none focus:border-zinc-600" />
                          </div>
                        </div>
                      </div>
                      {category === "moto1960" && (
                        <div>
                          <label className="mb-1 block text-xs text-zinc-500">Plate style</label>
                          <div className="grid grid-cols-1 gap-1.5">
                            {[
                              { id: "trap60", label: "Two-row trapezoidal (1960)", rental: false },
                              { id: "trap86", label: "Two-row trapezoidal (1986)", rental: false },
                              { id: "rect94", label: "Two-row rectangular (1994)", rental: false },
                              { id: "rect99", label: "Two-row rectangular (1999)", rental: false },
                              { id: "rent99", label: "Two-row rectangular — Rental (1999)", rental: true },
                            ].map((t) => (
                              <button key={t.id} type="button" onClick={() => setMotoType1960(t.id)}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${motoType1960 === t.id ? "border-indigo-600 bg-indigo-950/50 text-indigo-200" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>
                                <span className={t.rental ? "text-red-400" : ""}>{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Format picker */}
                {formats.length > 1 && category !== "moto1960" && (
                  <>
                    <div className="border-t border-zinc-800" />
                    <div>
                      <span className="block text-sm text-zinc-300 mb-2">Plate format</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {formats.map((f) => (
                          <button key={f.id} type="button" onClick={() => setPlateFormat(f.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${plateFormat === f.id ? "border-indigo-600 bg-indigo-950/50 text-indigo-200" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Location */}
                <div className="border-t border-zinc-800 pt-5">
                  <label className="block text-sm text-zinc-300 mb-1.5">Where did you spot it? <span className="text-zinc-600 text-xs">(city or area)</span></label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Prague, Brno, Ostrava…"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-zinc-600" />
                  {locationWarning && <p className="mt-1 text-xs text-amber-400">{locationWarning}</p>}
                </div>
              </div>

              {/* Car details */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="block text-sm font-medium text-zinc-200 mb-4">Car details <span className="text-zinc-600 text-xs font-normal">(optional)</span></span>
                <CarDetailsFields onChange={onCarChange} />
              </div>

              {/* Company */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="block text-sm font-medium text-zinc-200 mb-3">Company / Fleet <span className="text-zinc-600 text-xs font-normal">(optional)</span></span>
                <CompanyPicker value={companyId} onChange={(id: string | null) => setCompanyId(id)} />
              </div>

              {/* Tags */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="block text-sm font-medium text-zinc-200 mb-3">Tags <span className="text-zinc-600 text-xs font-normal">(optional)</span></span>
                <DescriptionInput value={description} onChange={setDescription} />
                  <TagPicker selected={tags} onChange={setTags} />
              </div>

              <button type="submit" disabled={!canSubmit}
                className="group relative w-full overflow-hidden rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <span className="relative z-10">{status === "uploading" ? "Uploading image…" : status === "saving" ? "Saving…" : "Upload spot"}</span>
                {status === "idle" && canSubmit && <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />}
              </button>
            </form>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className={`rounded-2xl border p-6 text-center ${previewBg}`}>
                <div className={`font-mono text-3xl font-bold tracking-widest ${previewTextColor}`}>
                  {plateText.trim() || selectedCat.example}
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  {selectedCat.label} · {formats.find((f) => f.id === plateFormat)?.label ?? ""}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500 space-y-1.5">
                <p className="font-medium text-zinc-400">Czech Republic 🇨🇿</p>
                <p>Current plates use a single-letter region code (2001+). Historical plates use 2-letter district codes (1960 system).</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
