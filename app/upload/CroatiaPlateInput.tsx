"use client";

import { useEffect, useState } from "react";
import { CROATIA_REGIONS, HR_LETTERS, type CroatiacategoryId } from "@/app/lib/croatiaData";

interface Props {
  category: CroatiacategoryId;
  onChange: (text: string) => void;
}

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 w-full";
const selectCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 w-full";

function RegionSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">— Region —</option>
      {CROATIA_REGIONS.map((r) => (
        <option key={r.code} value={r.code}>{r.code} — {r.city}</option>
      ))}
    </select>
  );
}

function LetterSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">—</option>
        {HR_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );
}

export default function CroatiaPlateInput({ category, onChange }: Props) {
  const [region, setRegion] = useState("");
  const [digits, setDigits] = useState("");
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [vanity, setVanity] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  useEffect(() => {
    setRegion(""); setDigits(""); setL1(""); setL2("");
    setVanity(""); setP1(""); setP2("");
  }, [category]);

  useEffect(() => {
    let text = "";
    const suffix = l1 && l2 ? `${l1}${l2}` : (l1 || l2 || "");
    switch (category) {
      case "regular":
      case "foreign":
      case "exceptional":
      case "motorcycle":
        text = [region, digits, suffix].filter(Boolean).join(" ");
        break;
      case "vanity":
        text = [region, vanity].filter(Boolean).join(" ");
        break;
      case "dealer":
        text = [region, "PP", digits].filter(Boolean).join(" ");
        break;
      case "oldtimer":
        text = [region, "PV", digits].filter(Boolean).join(" ");
        break;
      case "military":
        text = ["HV", digits, suffix].filter(Boolean).join(" ");
        break;
      case "export":
        text = ["RH", digits, suffix].filter(Boolean).join(" ");
        break;
      case "police":
        text = [p1, p2].filter(Boolean).join(" ");
        break;
    }
    onChange(text.toUpperCase());
  }, [category, region, digits, l1, l2, vanity, p1, p2, onChange]);

  // Regular / Foreign / Exceptional / Motorcycle
  if (["regular", "foreign", "exceptional", "motorcycle"].includes(category)) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Region</label>
          <RegionSelect value={region} onChange={setRegion} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Number (4 digits)</label>
            <input
              className={inputCls}
              value={digits}
              maxLength={4}
              placeholder="1234"
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <LetterSelect label="Letter 1" value={l1} onChange={setL1} />
          <LetterSelect label="Letter 2" value={l2} onChange={setL2} />
        </div>
      </div>
    );
  }

  // Vanity
  if (category === "vanity") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Region</label>
          <RegionSelect value={region} onChange={setRegion} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Custom text (max 7, numbers optional)</label>
          <input
            className={inputCls}
            value={vanity}
            maxLength={7}
            placeholder="BIRTHDAY"
            onChange={(e) => setVanity(e.target.value.toUpperCase())}
          />
        </div>
      </div>
    );
  }

  // Dealer
  if (category === "dealer") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Region</label>
            <RegionSelect value={region} onChange={setRegion} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Fixed</label>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 font-mono">PP</div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Number (4 digits)</label>
          <input
            className={inputCls}
            value={digits}
            maxLength={4}
            placeholder="1234"
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    );
  }

  // Oldtimer
  if (category === "oldtimer") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Region</label>
            <RegionSelect value={region} onChange={setRegion} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Fixed</label>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 font-mono">PV</div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Number (4 digits)</label>
          <input
            className={inputCls}
            value={digits}
            maxLength={4}
            placeholder="1234"
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    );
  }

  // Military
  if (category === "military") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Prefix</label>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 font-mono">HV</div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Number (4 digits)</label>
            <input
              className={inputCls}
              value={digits}
              maxLength={4}
              placeholder="1234"
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LetterSelect label="Letter 1" value={l1} onChange={setL1} />
          <LetterSelect label="Letter 2" value={l2} onChange={setL2} />
        </div>
      </div>
    );
  }

  // Export
  if (category === "export") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Prefix</label>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 font-mono">RH</div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Number (4 digits)</label>
            <input
              className={inputCls}
              value={digits}
              maxLength={4}
              placeholder="1234"
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LetterSelect label="Letter 1" value={l1} onChange={setL1} />
          <LetterSelect label="Letter 2" value={l2} onChange={setL2} />
        </div>
      </div>
    );
  }

  // Police
  if (category === "police") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Group 1 (3 digits)</label>
          <input
            className={inputCls}
            value={p1}
            maxLength={3}
            placeholder="123"
            onChange={(e) => setP1(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Group 2 (3 digits)</label>
          <input
            className={inputCls}
            value={p2}
            maxLength={3}
            placeholder="456"
            onChange={(e) => setP2(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    );
  }

  return null;
}
