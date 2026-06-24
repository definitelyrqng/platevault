"use client";

import { useState } from "react";

interface Props {
  uploadId: string;
  initial: {
    brand: string | null;
    model: string | null;
    generation: string | null;
    trim: string | null;
    color: string | null;
    badge: string | null;
    description: string | null;
  };
}

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 placeholder:text-zinc-600";

export default function EditSpotDetails({ uploadId, initial }: Props) {
  const [open, setOpen]             = useState(false);
  const [brand, setBrand]           = useState(initial.brand ?? "");
  const [model, setModel]           = useState(initial.model ?? "");
  const [generation, setGeneration] = useState(initial.generation ?? "");
  const [trim, setTrim]             = useState(initial.trim ?? "");
  const [color, setColor]           = useState(initial.color ?? "");
  const [badge, setBadge]           = useState(initial.badge ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus]         = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr]               = useState("");

  const remaining = 1000 - description.length;

  async function save() {
    setStatus("saving"); setErr("");
    const res = await fetch(`/api/uploads/${uploadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, model, generation, trim, color, badge, description: description.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Save failed"); setStatus("error"); return; }
    setStatus("saved");
    setTimeout(() => { setStatus("idle"); setOpen(false); }, 1200);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-zinc-500 hover:text-indigo-300 transition-colors"
      >
        {open ? "Cancel" : "✏ Edit details"}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Description */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Description
              <span className={`ml-2 tabular-nums ${remaining < 100 ? "text-amber-500" : "text-zinc-700"}`}>
                {remaining} left
              </span>
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={description}
              placeholder="Add a description… use #hashtags to tag your spot"
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            />
          </div>

          {/* Car fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Brand</label>
              <input className={inputCls} value={brand} placeholder="e.g. BMW" onChange={e => setBrand(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Model</label>
              <input className={inputCls} value={model} placeholder="e.g. 320d" onChange={e => setModel(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Generation</label>
              <input className={inputCls} value={generation} placeholder="e.g. F34 LCI" onChange={e => setGeneration(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Trim</label>
              <input className={inputCls} value={trim} placeholder="e.g. M Sport" onChange={e => setTrim(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Color</label>
              <input className={inputCls} value={color} placeholder="e.g. Mineral White" onChange={e => setColor(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Badge</label>
              <input className={inputCls} value={badge} placeholder="e.g. 320d xDrive" onChange={e => setBadge(e.target.value)} />
            </div>
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <span className="relative z-10">{status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved" : "Save changes"}</span>
            {status === "idle" && <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />}
          </button>
        </div>
      )}
    </div>
  );
}
