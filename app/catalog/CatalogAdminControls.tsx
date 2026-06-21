"use client";

import { useState } from "react";

// ─── Shared inline-edit row ───────────────────────────────────────────────────
function InlineRename({
  endpoint,
  current,
  onClose,
}: {
  endpoint: string;
  current: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(current);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === current) { onClose(); return; }
    setBusy(true);
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    onClose();
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-center mt-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-indigo-800/60 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-600 min-w-0"
      />
      <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40">
        {busy ? "…" : "Save"}
      </button>
      <button type="button" onClick={onClose} className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">
        Cancel
      </button>
    </form>
  );
}

// ─── Add Brand ────────────────────────────────────────────────────────────────
export function AddBrandButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    setName("");
    setOpen(false);
    window.location.reload();
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all flex items-center gap-2"
    >
      <span className="text-lg leading-none">+</span> Add brand
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 flex gap-2 items-center">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Brand name..."
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
      />
      <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-40">
        {busy ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300">
        Cancel
      </button>
    </form>
  );
}

// ─── Rename Brand ─────────────────────────────────────────────────────────────
export function RenameBrandButton({ brandId, current }: { brandId: number; current: string }) {
  const [open, setOpen] = useState(false);
  if (open) return <InlineRename endpoint={`/api/catalog/brands/${brandId}`} current={current} onClose={() => setOpen(false)} />;
  return (
    <button onClick={() => setOpen(true)} className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-indigo-700/50 transition-colors">
      ✏ Rename
    </button>
  );
}

// ─── Delete Brand ─────────────────────────────────────────────────────────────
export function DeleteBrandButton({ brandId }: { brandId: number }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this brand and ALL its models and generations? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/catalog/brands/${brandId}`, { method: "DELETE" });
    window.location.href = "/catalog";
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/60 hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      {busy ? "Deleting…" : "Delete brand"}
    </button>
  );
}

// ─── Add Model ────────────────────────────────────────────────────────────────
export function AddModelButton({ brandId }: { brandId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await fetch(`/api/catalog/brands/${brandId}/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    setName("");
    setOpen(false);
    window.location.reload();
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all flex items-center gap-2"
    >
      <span className="text-lg leading-none">+</span> Add model
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 flex gap-2 items-center">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Model name..."
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
      />
      <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-40">
        {busy ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300">
        Cancel
      </button>
    </form>
  );
}

// ─── Rename Model ─────────────────────────────────────────────────────────────
export function RenameModelButton({ modelId, current }: { modelId: number; current: string }) {
  const [open, setOpen] = useState(false);
  if (open) return <InlineRename endpoint={`/api/catalog/models/${modelId}`} current={current} onClose={() => setOpen(false)} />;
  return (
    <button onClick={() => setOpen(true)} className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-indigo-700/50 transition-colors">
      ✏
    </button>
  );
}

// ─── Delete Model ─────────────────────────────────────────────────────────────
export function DeleteModelButton({ modelId }: { modelId: number }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this model and ALL its generations? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/catalog/models/${modelId}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-lg border border-red-900/60 bg-red-950/30 px-2 py-1 text-[11px] text-red-400 hover:bg-red-950/60 hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}

// ─── Add Generation ───────────────────────────────────────────────────────────
export function AddGenerationButton({ modelId }: { modelId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await fetch(`/api/catalog/models/${modelId}/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    setName("");
    setOpen(false);
    window.location.reload();
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
    >
      + Add generation
    </button>
  );

  return (
    <form onSubmit={submit} className="flex gap-2 items-center mt-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. 2nd Gen Facelift (B9.5) (2020-2024)"
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
      />
      <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-40">
        {busy ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300">
        Cancel
      </button>
    </form>
  );
}

// ─── Rename Generation ────────────────────────────────────────────────────────
export function RenameGenerationButton({ genId, current }: { genId: number; current: string }) {
  const [open, setOpen] = useState(false);
  if (open) return <InlineRename endpoint={`/api/catalog/generations/${genId}`} current={current} onClose={() => setOpen(false)} />;
  return (
    <button onClick={() => setOpen(true)} className="shrink-0 rounded border border-zinc-700/50 bg-zinc-900/40 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-200 hover:border-indigo-700/50 transition-colors">
      ✏
    </button>
  );
}

// ─── Delete Generation ────────────────────────────────────────────────────────
export function DeleteGenerationButton({ genId }: { genId: number }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this generation?")) return;
    setBusy(true);
    await fetch(`/api/catalog/generations/${genId}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="ml-auto shrink-0 rounded border border-red-900/50 bg-red-950/20 px-2 py-0.5 text-[10px] text-red-500 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      {busy ? "…" : "✕"}
    </button>
  );
}
