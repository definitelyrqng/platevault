"use client";

import { useEffect, useState } from "react";
import {
  BULGARIA_REGIONS,
  type BulgariacategoryId,
  detectBulgariaCategory,
} from "@/app/lib/bulgariaData";

interface Props {
  category: BulgariacategoryId;
  onChange: (text: string) => void;
  onCategoryDetected?: (cat: BulgariacategoryId) => void;
}

export default function BulgariaPlateInput({ category, onChange, onCategoryDetected }: Props) {
  // Shared region state (for standard / motorcycle / vanity)
  const [region, setRegion] = useState("");
  // Standard / Motorcycle fields
  const [digits, setDigits] = useState("");
  const [letters, setLetters] = useState("");
  // Vanity custom field
  const [vanityText, setVanityText] = useState("");
  // Military serial
  const [milSerial, setMilSerial] = useState("");
  // Temporary fields
  const [tempSerial, setTempSerial] = useState("");
  const [tempYear, setTempYear] = useState("");
  // Diplomatic free text
  const [dipText, setDipText] = useState("");
  // Foreign (XH) fields
  const [xhDigits, setXhDigits] = useState("");
  const [xhYear, setXhYear] = useState("");

  // Build plate text and emit on any change
  useEffect(() => {
    let text = "";
    switch (category) {
      case "standard":
      case "motorcycle":
        text = [region, digits, letters].filter(Boolean).join(" ");
        break;
      case "vanity":
        text = [region, vanityText].filter(Boolean).join(" ");
        break;
      case "military":
        text = milSerial ? `BA ${milSerial}` : "";
        break;
      case "temporary":
        text = [tempSerial, tempYear].filter(Boolean).join(" ");
        break;
      case "diplomatic":
        text = dipText.trim();
        break;
      case "foreign":
        text = ["XH", xhDigits, xhYear].filter(Boolean).join(" ");
        break;
    }
    onChange(text.toUpperCase());
  }, [category, region, digits, letters, vanityText, milSerial, tempSerial, tempYear, dipText, xhDigits, xhYear, onChange]);

  // Auto-detect on diplomatic free-text
  function handleDipChange(val: string) {
    setDipText(val);
    const detected = detectBulgariaCategory(val);
    if (detected && detected !== category) onCategoryDetected?.(detected);
  }

  const regionSelect = (
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 w-full"
    >
      <option value="">— Region —</option>
      {BULGARIA_REGIONS.map((r) => (
        <option key={r.code} value={r.code}>
          {r.code} — {r.province}
        </option>
      ))}
    </select>
  );

  if (category === "standard" || category === "motorcycle") {
    return (
      <div className="space-y-2">
        {regionSelect}
        <div className="flex gap-2">
          <input
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 uppercase tracking-widest"
          />
          <input
            value={letters}
            onChange={(e) => setLetters(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase())}
            placeholder="BC"
            maxLength={2}
            className="w-16 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 uppercase tracking-widest"
          />
        </div>
      </div>
    );
  }

  if (category === "vanity") {
    return (
      <div className="space-y-2">
        {regionSelect}
        <input
          value={vanityText}
          onChange={(e) => setVanityText(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="BATMAN"
          maxLength={8}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 w-full uppercase tracking-widest"
        />
      </div>
    );
  }

  if (category === "military") {
    return (
      <div className="flex gap-2 items-center">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-300 select-none">
          BA
        </div>
        <input
          value={milSerial}
          onChange={(e) => setMilSerial(e.target.value.replace(/\D/g, "").slice(0, 7))}
          placeholder="1234567"
          maxLength={7}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 tracking-widest"
        />
      </div>
    );
  }

  if (category === "temporary") {
    return (
      <div className="flex gap-2">
        <input
          value={tempSerial}
          onChange={(e) => setTempSerial(e.target.value.replace(/\D/g, "").slice(0, 7))}
          placeholder="1234567"
          maxLength={7}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 tracking-widest"
        />
        <input
          value={tempYear}
          onChange={(e) => setTempYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
          placeholder="YY"
          maxLength={2}
          className="w-16 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 tracking-widest"
        />
      </div>
    );
  }

  if (category === "diplomatic") {
    return (
      <input
        value={dipText}
        onChange={(e) => handleDipChange(e.target.value)}
        placeholder="01 DM 42 01"
        maxLength={24}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 uppercase tracking-widest"
      />
    );
  }

  // foreign (XH)
  return (
    <div className="flex gap-2 items-center">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-300 select-none">
        XH
      </div>
      <input
        value={xhDigits}
        onChange={(e) => setXhDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="1234"
        maxLength={4}
        className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 tracking-widest"
      />
      <input
        value={xhYear}
        onChange={(e) => setXhYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder="YY"
        maxLength={2}
        className="w-16 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-600 tracking-widest"
      />
    </div>
  );
}
