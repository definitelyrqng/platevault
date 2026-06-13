"use client";

import { useState, useEffect } from "react";
import { BRANDS, getModels, getGenerations } from "@/app/lib/carData";

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

const FIELD =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 " +
  "outline-none transition-colors focus:border-zinc-500 focus:bg-zinc-900 " +
  "disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-zinc-600";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">{children}</label>;
}

export default function CarDetailsFields({ onChange }: Props) {
  const [brand,      setBrand]      = useState("");
  const [model,      setModel]      = useState("");
  const [generation, setGeneration] = useState("");
  const [color,      setColor]      = useState("");
  const [badge,      setBadge]      = useState("");

  const models      = brand ? getModels(brand)             : [];
  const generations = model ? getGenerations(brand, model) : [];

  useEffect(() => { setModel(""); setGeneration(""); setColor(""); setBadge(""); }, [brand]);
  useEffect(() => { setGeneration(""); setColor(""); setBadge(""); }, [model]);
  useEffect(() => { setColor(""); }, [generation]);

  useEffect(() => {
    onChange({ brand, model, generation, trim: "", color, badge });
  }, [brand, model, generation, color, badge, onChange]);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">Vehicle details</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Brand</Label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={FIELD}>
            <option value="">Select brand...</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <Label>Model</Label>
          <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className={FIELD}>
            <option value="">Select model...</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <Label>Generation</Label>
          <select value={generation} onChange={(e) => setGeneration(e.target.value)} disabled={!model} className={FIELD}>
            <option value="">Select generation...</option>
            {generations.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <Label>Badge</Label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="3.0 TDI, RS6..."
            className={FIELD}
          />
        </div>

        <div>
          <Label>Color</Label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Obsidian Black..."
            className={FIELD}
          />
        </div>
      </div>
    </div>
  );
}
