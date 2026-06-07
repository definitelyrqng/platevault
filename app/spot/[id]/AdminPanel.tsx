"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel({
  uploadId,
  initialBrand,
  initialModel,
  initialGeneration,
  initialTrim,
  initialColor,
}: {
  uploadId: string;
  initialBrand: string;
  initialModel: string;
  initialGeneration: string;
  initialTrim: string;
  initialColor: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [generation, setGeneration] = useState(initialGeneration);
  const [trim, setTrim] = useState(initialTrim);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function saveDetails() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, generation, trim, color }),
      });
      if (!res.ok) { setError("Failed to save."); return; }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this spot? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
      if (!res.ok) { setError("Failed to delete."); return; }
      window.location.href = "/home";
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400"
      >
        <span>⚙ Admin Panel</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {/* Car detail fields */}
          {[
            { label: "Brand", value: brand, set: setBrand },
            { label: "Model", value: model, set: setModel },
            { label: "Generation", value: generation, set: setGeneration },
            { label: "Trim", value: trim, set: setTrim },
            { label: "Color", value: color, set: setColor },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}…`}
                maxLength={60}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && <p className="text-xs text-emerald-400">Saved!</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
            <button
              onClick={deletePost}
              disabled={deleting}
              className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/60 disabled:opacity-50"
            >
              {deleting ? "…" : "Delete post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
