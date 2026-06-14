"use client";

import { useState, useEffect, useCallback } from "react";

type Brand = { id: number; name: string };
type Model = { id: number; name: string };
type Gen   = { id: number; name: string };

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
  const [brands,      setBrands]      = useState<Brand[]>([]);
  const [models,      setModels]      = useState<Model[]>([]);
  const [generations, setGenerations] = useState<Gen[]>([]);

  const [brandId,      setBrandId]      = useState<number | "">("");
  const [modelId,      setModelId]      = useState<number | "">("");
  const [generationId, setGenerationId] = useState<number | "">("");

  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [genName,   setGenName]   = useState("");
  const [color,     setColor]     = useState("");
  const [badge,     setBadge]     = useState("");

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: (Brand & { models: unknown[] })[]) => setBrands(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setModelId(""); setModelName(""); setGenerationId(""); setGenName("");
    setModels([]); setGenerations([]);
    if (!brandId) return;
    fetch("/api/catalog/brands/" + brandId + "/models")
      .then((r) => r.json())
      .then((data: Model[]) => setModels(data))
      .catch(() => {});
  }, [brandId]);

  useEffect(() => {
    setGenerationId(""); setGenName(""); setGenerations([]);
    if (!modelId) return;
    fetch("/api/catalog/models/" + modelId + "/generations")
      .then((r) => r.json())
      .then((data: Gen[]) => setGenerations(data))
      .catch(() => {});
  }, [modelId]);

  const handleBrandChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : "";
    setBrandId(id);
    setBrandName(brands.find((b) => b.id === id)?.name ?? "");
  }, [brands]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : "";
    setModelId(id);
    setModelName(models.find((m) => m.id === id)?.name ?? "");
  }, [models]);

  const handleGenChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : "";
    setGenerationId(id);
    setGenName(generations.find((g) => g.id === id)?.name ?? "");
  }, [generations]);

  useEffect(() => {
    onChange({ brand: brandName, model: modelName, generation: genName, trim: "", color, badge });
  }, [brandName, modelName, genName, color, badge, onChange]);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">Vehicle details</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Brand</Label>
          <select value={brandId} onChange={handleBrandChange} className={FIELD}>
            <option value="">Select brand...</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <Label>Model</Label>
          <select value={modelId} onChange={handleModelChange} disabled={!brandId} className={FIELD}>
            <option value="">Select model...</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <Label>Generation</Label>
          <select value={generationId} onChange={handleGenChange} disabled={!modelId} className={FIELD}>
            <option value="">Select generation...</option>
            {generations.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
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
