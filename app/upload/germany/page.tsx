"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import DescriptionField, { locationOf } from "@/app/components/DescriptionField";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/lib/uploadthing";
import CarDetailsFields from "@/app/upload/CarDetailsFields";
import CompanyPicker from "@/app/components/CompanyPicker";
import ZoomImage from "@/app/components/ZoomImage";
import TagPicker from "@/app/components/TagPicker";
import MilestonePopup from "@/app/components/MilestonePopup";
import OcrHint from "@/app/components/OcrHint";
import { diplomaticCountry } from "@/app/lib/germanyDiplomatic";
import PlateBadge from "@/app/components/PlateBadge";
import Flag from "@/app/components/Flag";
import DescriptionInput from "@/app/components/DescriptionInput";
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

    // Fold umlauts so "tol" matches "TÖL", "mun" matches "MÜN", etc.
    const foldUmlauts = (s: string) =>
      s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    const qFolded = foldUmlauts(q);

    const codeMatch = (r: typeof GERMANY_REGIONS[0]) => {
      const c = r.code.toLowerCase();
      return c.startsWith(q) || foldUmlauts(c).startsWith(qFolded);
    };
    const nameMatch = (r: typeof GERMANY_REGIONS[0]) => {
      const n = r.name.toLowerCase();
      return n.includes(q) || foldUmlauts(n).includes(qFolded);
    };

    const codeStartsWith = GERMANY_REGIONS.filter(codeMatch);
    const nameIncludes   = GERMANY_REGIONS.filter((r) =>
      !codeMatch(r) && nameMatch(r)
    );

    // Within code matches: exact code match first, then shorter codes first (N before NÜ before NAB),
    // active before historical within same length
    codeStartsWith.sort((a, b) => {
      const aExact = a.code.toLowerCase() === q || foldUmlauts(a.code.toLowerCase()) === qFolded;
      const bExact = b.code.toLowerCase() === q || foldUmlauts(b.code.toLowerCase()) === qFolded;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return  1;
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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>
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
/** Plate kinds drawn with the realistic single-row artwork, and the colours of the inspection stickers by year. */
const HU_TYPES = /^(de-(regular|electric|oldtimer|seasonal|seasonal-h|transferable|official|state-authority|diplomatic)-(single|double|us|moto|moto-old)|de-(din|official|state-authority|diplomatic)-din-(single|double|us))$/;
const OLD_MOTO: string[] = ["regular"];                // the old motorcycle plate has no seasonal, historic (H), electric, transferable, 5-day or export versions
const HU_YEARS = ["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
const HU_COLORS = ["#1ab0ee", "#f5ef12", "#d85c4c", "#f7a0b8", "#18b082", "#e89000"];


/** One real single-line plate per category, shown on the picker tiles. */
const CATEGORY_TILE: Record<string, { type: string; text: string }> = {
  regular:           { type: "de-regular-single-hu25",       text: "B-AB1234" },
  din:               { type: "de-din-din-single-hu25",       text: "B-AB123" },
  "transit-5day":    { type: "de-transit-5day-single",       text: "B-123456 23.06.26" },
  export:            { type: "de-export-single",             text: "DGF-73B 01.01.27" },
  transferable:      { type: "de-transferable-single-hu25",  text: "HER-H22-2" },
  oldtimer:          { type: "de-oldtimer-single-hu25",      text: "B-AB123H" },
  seasonal:          { type: "de-seasonal-single-hu25",      text: "B-AB123 04/10" },
  "seasonal-h":      { type: "de-seasonal-h-single-hu25",    text: "B-AB12H 04/10" },
  electric:          { type: "de-electric-single-hu25",      text: "B-AB123E" },
  red:               { type: "de-red-06-single",             text: "B-06123" },
  official:          { type: "de-official-single-hu25",      text: "B-1234" },
  "state-authority": { type: "de-state-authority-single-hu25", text: "THL-12345" },
  federal:           { type: "de-federal-bd-single-hu25",    text: "BD 5-12345" },
  diplomatic:        { type: "de-diplomatic-single-hu25",    text: "0-73-14" },
  military:          { type: "de-military-single",           text: "Y-123456" },
};

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

export default function GermanyUploadPage() {
  const router = useRouter();

  // ── Category & format
  const [category, setCategory] = useState<GermanyCategoryId>("regular");
  const [plateFormat, setPlateFormat] = useState("single");
  // inspection sticker (HU) on the plate: its year (= colour), or none on front plates
  const [huYear, setHuYear] = useState("25");
  const [frontPlate, setFrontPlate] = useState(false);
  const [noSeals, setNoSeals] = useState(false);               // no seals and stickers on the plate
  const [shortPlate, setShortPlate] = useState(false);         // shortened plate (standard single row only): cut to the length of the registration

  // ── Region-based fields
  const [regionCode, setRegionCode]   = useState("");
  const [plateSuffix, setPlateSuffix] = useState(""); // letters+numbers combined e.g. "AB1234"

  // ── Military
  const [militaryPrefix, setMilitaryPrefix] = useState<"Y" | "X">("Y");

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
  const [description, setDescription] = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [companyId, setCompanyId]   = useState<string | null>(null);

  // ── Auto-tag oldtimer for H-Kennzeichen and Saison-H
  useEffect(() => {
    const isOldtimer = category === "oldtimer" || category === "seasonal-h";
    setTags((prev) => {
      const hasTag = prev.includes("oldtimer");
      if (isOldtimer && !hasTag) return [...prev, "oldtimer"];
      if (!isOldtimer && hasTag) return prev.filter((t) => t !== "oldtimer");
      return prev;
    });
  }, [category]);

  // ── File / upload
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError]   = useState("");
  const [status, setStatus]   = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    if (status === "uploading") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [status]);
  const [milestoneData, setMilestoneData] = useState<{ uploadCount: number; streak: { current: number; isNewDay: boolean } } | null>(null);
  const [newSpotId, setNewSpotId] = useState<number | null>(null);

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
    plateSuffix: plateFormat === "moto-old" ? plateSuffix.slice(0, 3) : plateFormat === "moto" ? plateSuffix.slice(0, 4) : plateSuffix,
    date: category === "transit-5day" ? transitDate : category === "export" ? exportDate : undefined,
    exportCheckLetter: category === "export" ? exportCheckLetter : undefined,
    seasonStart: (category === "seasonal" || category === "seasonal-h") ? seasonStart : undefined,
    seasonEnd:   (category === "seasonal" || category === "seasonal-h") ? seasonEnd   : undefined,
    transferSuffix: category === "transferable" ? transferSuffix : undefined,
    redCode:  category === "red" ? redCode : undefined,
    numbers:  category === "red" ? redNumbers
            : category === "transit-5day" ? officialNumbers.slice(0, Math.max(1, Math.min(plateFormat === "us" ? 5 : 6, 8 - regionCode.length)))
            : category === "official" ? officialNumbers
            : category === "state-authority" ? officialNumbers
            : category === "federal" ? federalNumbers
            : category === "military" ? officialNumbers
            : undefined,
    militaryPrefix: category === "military" ? militaryPrefix : undefined,
    stateCode: category === "state-authority" ? stateCode : undefined,
    federalSub: category === "federal" ? federalSub : undefined,
    federalBdNum: category === "federal" && federalSub === "bd" ? federalBdNum : undefined,
    federalBpCode: category === "federal" && federalSub === "bp" ? federalBpCode : undefined,
    federalBwBranch: category === "federal" && federalSub === "bw" ? federalBwBranch : undefined,
    diplomPrefix: category === "diplomatic" ? diplomPrefix : undefined,
    diplomCountryCode: category === "diplomatic" ? diplomCountryCode : undefined,
    diplomSerial: category === "diplomatic" ? diplomSerial : undefined,
    diplomCheckLetter: category === "diplomatic" ? diplomCheckLetter : undefined,
  }), [category, plateFormat, regionCode, plateSuffix, transitDate, exportDate, exportCheckLetter,
       seasonStart, seasonEnd, transferSuffix, redCode, redNumbers, officialNumbers,
       stateCode, federalSub, federalBdNum, federalBpCode, federalBwBranch, federalNumbers,
       diplomPrefix, diplomCountryCode, diplomSerial, diplomCheckLetter, militaryPrefix]);

  // ── Plate type stored in DB
  const plateTypeStored = useMemo(() => {
    if (category === "red") { const f = ["single", "double", "us", "moto", "din-single", "din-double", "din-us"].includes(plateFormat) ? plateFormat : "single"; return `de-red-${redCode}-${f}${noSeals ? "-ns" : ""}`; }
    if (category === "military") return `de-military${militaryPrefix === "X" ? "-nato" : ""}-${["single", "double", "us", "moto"].includes(plateFormat) ? plateFormat : "single"}${noSeals ? "-ns" : ""}`;
    const base = category === "federal" ? `de-federal-${federalSub}-${plateFormat}` : `de-${category}-${plateFormat}`;
    const stripPlate = (category === "transit-5day" || category === "export") && ["single", "double", "us"].includes(plateFormat);
    const t = HU_TYPES.test(category === "federal" ? `de-official-${plateFormat}` : base) ? `${base}${shortPlate && base === "de-regular-single" ? "-short" : ""}-hu${frontPlate ? "0" : huYear}` : base;
    return noSeals && (HU_TYPES.test(category === "federal" ? `de-official-${plateFormat}` : base) || stripPlate) ? `${t}-ns` : t;                // "-ns": no seals or stickers
  }, [category, plateFormat, redCode, federalSub, huYear, frontPlate, shortPlate, noSeals, militaryPrefix]);
  const drawn = HU_TYPES.test(category === "federal" ? `de-official-${plateFormat}` : `de-${category}-${plateFormat}`);
  const redDrawn = category === "red" || category === "military";
  const transitDrawn = (category === "transit-5day" || category === "export") && ["single", "double", "us"].includes(plateFormat);
  // export plates: 1–4 digits and a letter (8 characters in total with the district code)
  const exportMax = Math.max(1, Math.min(plateFormat === "us" ? 4 : 5, 7 - regionCode.length));
  // plates have 8 characters at most: a long district code leaves fewer digits (5-day plates: 6 digits, 5 on the US size)
  const transitMax = Math.max(1, Math.min(plateFormat === "us" ? 5 : 6, 8 - regionCode.length));               // the plate kinds we have artwork for

  const plateTypeLabel = PLATE_TYPE_LABELS[plateTypeStored] ?? PLATE_TYPE_LABELS[plateTypeStored.replace(/-(single|double|us|moto|din-single|din-double|din-us)(-ns)?$/, "")] ?? plateTypeStored;

  const locationWarning = useMemo(() => {
    if (!location.trim()) return "";
    return locationTooExact(locationOf(location)) ? "Keep it broad — city or area only, no street + number." : "";
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
          location: locationOf(location), description: location.trim() || null,
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
      setNewSpotId(data.upload.numericId);
      const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
      const STREAK_MILESTONES = [3, 7, 14, 30, 100];
      const isMilestone =
        UPLOAD_MILESTONES.includes(data.uploadCount) ||
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
  // the old motorcycle plate (until 2011) exists only for regular and seasonal plates: no historic, transferable, electric, 5-day or export versions
  // the DIN categories have their own formats: pick a matching one when the category changes (otherwise there is no preview)
  useEffect(() => {
    if (category === "din" && !plateFormat.startsWith("din-")) setPlateFormat("din-single");
    else if (category !== "din" && category !== "red" && category !== "official" && category !== "state-authority" && category !== "federal" && category !== "diplomatic" && category !== "military" && plateFormat.startsWith("din-")) setPlateFormat("single");
  }, [category, plateFormat]);
  useEffect(() => { if ((plateFormat === "moto-old" && !OLD_MOTO.includes(category)) || (category === "red" && plateFormat === "moto-old")) setPlateFormat("moto"); }, [category, plateFormat]);
  const dinFormats     = GERMANY_PLATE_FORMATS.filter((f) => f.group === "din");
  const selectedCat = GERMANY_CATEGORIES.find((c) => c.id === category)!;

  // motorcycle plates are short: the lower row holds 3 characters on the old plate and 4 on the new one, so the letters stay big
  const maxSfx = plateFormat === "moto-old" ? Math.min(3, maxSuffixChars(regionCode)) : plateFormat === "moto" ? Math.min(4, maxSuffixChars(regionCode)) : maxSuffixChars(regionCode);

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

  const placeholderBase =
    category === "regular"        ? "B-AB1234" :
    category === "din"            ? "B-AB1234" :
    category === "transit-5day"   ? "B-123456 23.06.26" :
    category === "export"         ? "DGF-73B 01.01.27" :
    category === "oldtimer"       ? "B-AB1234H" :
    category === "seasonal"       ? "B-AB1234 04/10" :
    category === "seasonal-h"     ? "B-AB1234H 04/10" :
    category === "electric"       ? "B-AB1234E" :
    category === "transferable"   ? "B-AB1234-0" :
    category === "red"            ? `ND-${redCode}${redNumbers || "485"}` :
    category === "official"       ? "B-123456" :
    category === "state-authority"? "THL-123456" :
    category === "federal"        ? "BD 5-123456" :
    category === "diplomatic"     ? "0-42-123456A" :
    category === "military"       ? `${militaryPrefix}-${militaryPrefix === "X" ? "1234" : "123456"}` :
    "…";
  // motorcycle plates hold fewer characters in the lower row: shorten the sample to match
  const placeholderText = (plateFormat === "moto-old" || plateFormat === "moto") && /^[A-ZÄÖÜ]{1,3}-/.test(placeholderBase)
    ? placeholderBase.replace(/^([A-ZÄÖÜ]{1,3}-)(\S+)/, (_m, d: string, rest: string) => { const [, body, tag] = rest.match(/^(.*?)([EH])?$/)!; return d + body.slice(0, plateFormat === "moto-old" ? 3 : 4) + (tag ?? ""); }) : placeholderBase;

  // the number is not typed yet: the preview shows a sample number after the code ("BP 29-" → BP 29 | seal | 123456)
  const typed = plateText.trim();
  const previewText = typed && /-$/.test(typed) && ["federal", "official", "state-authority", "military"].includes(category) ? `${typed}${category === "military" && militaryPrefix === "X" ? "1234" : "123456"}` : typed && category === "diplomatic" && /-$/.test(typed) ? `${typed}73-14` : typed || placeholderText;

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
                <span className="text-zinc-300">Germany</span>
              </nav>
              <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="leading-none shadow ring-1 ring-black/30"><Flag iso="de" size="lg" /></span>
                Upload a German plate
              </h1>
            </div>
            <a href="/c/germany" className="text-sm text-zinc-400 transition-colors hover:text-white">Germany gallery →</a>
          </div>

          {/* Status banners */}
          {status === "uploading" && (
            <div className="mt-6 rounded-2xl border border-indigo-800 bg-indigo-950/40 px-5 py-4 text-sm text-indigo-300 flex items-center gap-3">
              <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Uploading image… hang tight
            </div>
          )}
          {status === "saving" && (
            <div className="mt-6 rounded-2xl border border-indigo-800 bg-indigo-950/40 px-5 py-4 text-sm text-indigo-300 flex items-center gap-3">
              <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Saving your spot…
            </div>
          )}
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

          <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0 space-y-6">

              {/* ── 1. Plate type — visual picker ── */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
                <StepTitle n={1} title="Which plate is it?" done />
                <div className="space-y-5">
                  {CATEGORY_GROUPS.map((group) => {
                    const cats = GERMANY_CATEGORIES.filter((c) => c.group === group.id);
                    if (!cats.length) return null;
                    return (
                      <div key={group.id}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">{group.label}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                          {cats.map((cat) => {
                            const tile = CATEGORY_TILE[cat.id];
                            const active = category === cat.id;
                            return (
                              <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} aria-pressed={active}
                                className={`group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                                  active ? "border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500/50" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-600"
                                }`}>
                                <span className="block h-[64px] w-full overflow-hidden text-center leading-[64px]">
                                  {tile ? <PlateBadge country="germany" text={tile.text} plateType={tile.type} size="sm" /> : <span className="text-2xl">{cat.emoji}</span>}
                                </span>
                                <span>
                                  <span className={`block text-sm font-medium ${active ? "text-white" : "text-zinc-300"}`}>{cat.label}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  <strong className="text-zinc-300">{selectedCat.label}:</strong> {selectedCat.desc}
                </p>
              </section>

              {/* ── 2. Plate number + live preview ── */}
              <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
                <StepTitle n={2} title="Plate details" done={plateText.trim().length >= 2} />
                <div className="flex min-h-[110px] items-center justify-center rounded-xl bg-zinc-950/70 px-3 py-5">
                  <div className={`max-w-full transition-opacity ${plateText.trim() ? "opacity-100" : "opacity-40"}`}>
                    <PlateBadge country="germany" text={previewText} plateType={plateTypeStored} size="xl" />
                  </div>
                </div>

                {/* ── Plate format (all categories) ── */}
                {(
                  <div>
                    <span className="block text-sm text-zinc-300 mb-2">Format</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(isDIN ? dinFormats : category === "military" ? regularFormats.filter((f) => ["single", "double", "us", "moto"].includes(f.id)) : (category === "red" || category === "official" || category === "state-authority" || category === "federal" || category === "diplomatic") ? [...regularFormats.filter((f) => ["single", "double", "us", "moto"].includes(f.id)), ...dinFormats] : (category === "transit-5day" || category === "export") ? regularFormats.filter((f) => ["single", "double", "us"].includes(f.id)) : regularFormats.filter((f) => f.id !== "moto-old" || OLD_MOTO.includes(category))).map((fmt) => (
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

                {/* ── Inspection sticker (HU) ── */}
                {drawn && (
                  <div>
                    {category === "regular" && plateFormat === "single" && (
                      <label className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
                        <input type="checkbox" checked={shortPlate} onChange={(e) => setShortPlate(e.target.checked)} className="accent-indigo-500" />
                        Shortened plate <span className="text-xs text-zinc-500">(as short as the registration allows, 340–520 mm)</span>
                      </label>
                    )}
                    <span className="block text-sm text-zinc-300 mb-1">Inspection sticker (TÜV / HU) <span className="text-zinc-600 text-xs">(optional)</span></span>
                    <p className="mb-2 text-xs text-zinc-500">Picking the right colour and year for the TÜV sticker is optional — you don't have to, it only changes how the plate preview looks.</p>
                    <label className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                      <input type="checkbox" checked={frontPlate} onChange={(e) => setFrontPlate(e.target.checked)} className="accent-indigo-500" />
                      Front plate — no inspection sticker, only the state seal
                    </label>
                    {!frontPlate && (
                      <div className="flex flex-wrap gap-1.5">
                        {HU_YEARS.map((y) => (
                          <button key={y} type="button" onClick={() => setHuYear(y)} aria-pressed={huYear === y}
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors ${huYear === y ? "border-indigo-500 bg-indigo-950/50 text-indigo-200" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
                            <span className="inline-block h-3 w-3 rounded-full" style={{ background: HU_COLORS[((Number(y) - 20) % 6 + 6) % 6] }} />
                            20{y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Remove the seals ── */}
                {(drawn || transitDrawn || redDrawn) && (
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={noSeals} onChange={(e) => setNoSeals(e.target.checked)} className="accent-indigo-500" />
                    No seals <span className="text-xs text-zinc-500">(remove the state seal and the stickers from the plate)</span>
                  </label>
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
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Numbers <span className="text-zinc-600 text-xs">(digits)</span></span>
                          <input
                            value={plateSuffix}
                            onChange={(e) => setPlateSuffix(e.target.value.replace(/[^0-9]/g, "").slice(0, exportMax))}
                            placeholder="73"
                            maxLength={exportMax}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className="text-sm text-zinc-300">Check letter <span className="text-zinc-600 text-xs">(A–Z)</span></span>
                          <input
                            value={exportCheckLetter}
                            onChange={(e) => setExportCheckLetter(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0,1).toUpperCase())}
                            placeholder="B"
                            maxLength={1}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-zinc-600"
                          />
                        </label>
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
                        <span className="text-sm text-zinc-300">Serial number <span className="text-zinc-600 text-xs">(up to {transitMax} digits — 8 characters in total with the district code)</span></span>
                        <input
                          value={officialNumbers}
                          onChange={(e) => setOfficialNumbers(e.target.value.replace(/\D/g,"").slice(0,transitMax))}
                          placeholder={"123456".slice(0, transitMax)}
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
                        {diplomCountryCode && (
                          <p className={`text-xs ${diplomaticCountry(diplomCountryCode) ? "text-emerald-400" : "text-amber-400"}`}>
                            {diplomaticCountry(diplomCountryCode) ?? "No country assigned to this code"}
                          </p>
                        )}
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

                {category === "military" && (
                  <div className="space-y-3">
                    <label className="grid gap-1.5">
                      <span className="text-sm text-zinc-300">Plate number</span>
                      <div className="flex items-center gap-2">
                        {(["Y", "X"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setMilitaryPrefix(p)}
                            className={`rounded-xl border px-3 py-2 text-sm font-mono font-bold transition-all ${
                              militaryPrefix === p
                                ? "border-indigo-600 bg-indigo-950/50 text-indigo-200"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >{p}</button>
                        ))}
                        <span className="text-zinc-400 font-mono font-bold text-sm select-none">-</span>
                        <input
                          value={officialNumbers}
                          onChange={(e) => setOfficialNumbers(e.target.value.replace(/\D/g,"").slice(0, militaryPrefix === "X" ? 4 : 6))}
                          placeholder={militaryPrefix === "X" ? "1234" : "123456"}
                          maxLength={militaryPrefix === "X" ? 4 : 6}
                          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600"
                        />
                      </div>
                      <p className="text-xs text-zinc-600">Y = Bundeswehr (up to 6 digits) · X = NATO forces (up to 4 digits)</p>
                    </label>
                    <p className="text-xs text-zinc-500">White plate, black text — centrally issued</p>
                  </div>
                )}

              </section>

              {/* ── 4. Where & what ── */}
              <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
                <StepTitle n={4} title="Where & what" done={location.trim().length >= 2 && !locationWarning} />
                {/* ── Location ── */}
                <DescriptionField value={location} onChange={setLocation} warning={locationWarning} />

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

              </section>
            </div>


            {/* ── Sidebar ── */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
              {/* ── 3. Photo ── */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
                <StepTitle n={3} title="Photo" done={!!file && !fileError}>
                  <span className="text-xs text-zinc-500">JPG or PNG, max 8 MB</span>
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
                <OcrHint file={file} />
              </section>

              {/* ── Summary ── */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Your spot</div>
                <div className={`mt-3 flex justify-center ${plateText.trim() ? "" : "opacity-40"}`}>
                  <PlateBadge country="germany" text={previewText} plateType={plateTypeStored} size="sm" />
                </div>
                <div className="mt-2 text-center text-sm text-zinc-300">
                  {[brand, model].filter(Boolean).join(" ") || <span className="text-zinc-600">Vehicle (optional)</span>}
                </div>
                <div className="mt-0.5 text-center text-xs text-zinc-500">{selectedCat.label}{location.trim() && ` · ${locationOf(location)}`}</div>

                <ul className="mt-4 space-y-1.5 border-t border-zinc-800 pt-4 text-sm">
                  {[
                    { ok: !!file && !fileError, label: "Photo" },
                    { ok: plateText.trim().length >= 2, label: "Plate number" },
                    { ok: location.trim().length >= 2 && !locationWarning, label: "Description" },
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
                {status === "idle" && !canSubmit && (
                  <p className="mt-2 text-center text-xs text-zinc-500">
                    {!file ? "Add a photo" : plateText.trim().length < 2 ? "Enter the plate number" : "Add where you saw it"} to upload.
                  </p>
                )}
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
                    <p className="text-zinc-600">White plate · yellow band on right · valid up to 5 days</p>
                  </>}
                  {category === "export" && <>
                    <p><span className="font-mono text-zinc-200">DGF-73B 01.01.27</span></p>
                    <p className="text-zinc-600">White plate · red band on right · check letter + expiry date</p>
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
                  {category === "military" && <>
                    <p><span className="font-mono text-zinc-200">Y-123456</span> — Bundeswehr</p>
                    <p><span className="font-mono text-zinc-200">X-123456</span> — NATO forces</p>
                    <p className="text-zinc-600">Up to 6 digits · white plate, black text</p>
                  </>}
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>
    </>
  );
}
