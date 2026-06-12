"use client";

import { useState, useEffect } from "react";
import { BRANDS, getModels, getGenerations } from "@/app/lib/carData";
import { getBadges } from "@/app/lib/modelBadges";

type Props = {
  onChange: (details: {
    brand: string;
    model: string;
    generation: string;
    trim: string;
    color: string;
    badge: string;
  }) => void;
};

const SELECT_CLS =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed";

export default function CarDetailsFields({ onChange }: Props) {
  const [brand, setBrand]           = useState("");
  const [model, setModel]           = useState("");
  const [generation, setGeneration] = useState("");
  const [trim, setTrim]             = useState("");
  const [color, setColor]           = useState("");
  const [badge, setBadge]           = useState("");

  const models      = brand ? getModels(brand)                   : [];
  const generations = model ? getGenerations(brand, model)       : [];
  const badges      = brand && model ? getBadges(brand, model)   : [];

  useEffect(() => { setModel(""); setGeneration(""); setTrim(""); setColor(""); setBadge(""); }, [brand]);
  useEffect(() => { setGeneration(""); setTrim(""); setColor(""); setBadge(""); }, [model]);
  useEffect(() => { setTrim(""); setColor(""); }, [generation]);

  useEffect(() => {
    onChange({ brand, model, generation, trim, color, badge });
  }, [brand, model, generation, trim, color, badge, onChange]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">Car details — all optional</p>

      {/* Brand */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Brand</label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className={SELECT_CLS}>
          <option value="">— Select brand —</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!brand}
          className={SELECT_CLS}
        >
          <option value="">— Select model —</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Engine badge */}
      {badges.length > 0 && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Engine / variant badge</label>
          <select
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">— Select badge (optional) —</option>
            {badges.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      {/* Generation */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Generation</label>
        <select
          value={generation}
          onChange={(e) => setGeneration(e.target.value)}
          disabled={!model}
          className={SELECT_CLS}
        >
          <option value="">— Select generation —</option>
          {generations.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Trim — free text */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Trim</label>
        <input
          type="text"
          value={trim}
          onChange={(e) => setTrim(e.target.value)}
          placeholder="e.g. AMG Line, Sport, Luxury..."
          className={SELECT_CLS}
        />
      </div>

      {/* Color — free text */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Color</label>
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="e.g. Obsidian Black Metallic..."
          className={SELECT_CLS}
        />
      </div>
    </div>
  );
}
