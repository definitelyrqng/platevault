"use client";

import { useState, useEffect, useCallback } from "react";

type Generation = { id: number; name: string };
type Model      = { id: number; name: string; generations: Generation[] };
type Brand      = { id: number; name: string; models: Model[] };

/* ── helpers ── */
async function api(url: string, method: string, body?: object) {
  const r = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error ?? `HTTP ${r.status}`);
  }
  return r.json();
}

/* ── inline editable text ── */
function EditableLabel({
  value, onSave, onDelete,
}: { value: string; onSave: (v: string) => Promise<void>; onDelete: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  async function save() {
    if (draft.trim() === value) { setEditing(false); return; }
    setSaving(true); setErr("");
    try { await onSave(draft.trim()); setEditing(false); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!confirm(`Delete "${value}"? This will also delete all its children.`)) return;
    setSaving(true);
    try { await onDelete(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); setSaving(false); }
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-sm text-zinc-100 outline-none focus:border-indigo-500 w-48"
        />
        <button onClick={save} disabled={saving} className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40">
          {saving ? "…" : "Save"}
        </button>
        <button onClick={() => { setDraft(value); setEditing(false); setErr(""); }} className="text-xs text-zinc-500 hover:text-zinc-300">
          Cancel
        </button>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 group">
      <span className="text-sm text-zinc-200">{value}</span>
      <button onClick={() => { setDraft(value); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-500 hover:text-indigo-400 px-1 py-0.5 rounded">
        ✏️
      </button>
      <button onClick={del} disabled={saving}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-500 hover:text-red-400 px-1 py-0.5 rounded disabled:opacity-40">
        🗑
      </button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </span>
  );
}

/* ── add row ── */
function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [open,  setOpen]  = useState(false);
  const [name,  setName]  = useState("");
  const [saving, setSaving] = useState(false);
  const [err,   setErr]   = useState("");

  async function submit() {
    if (!name.trim()) return;
    setSaving(true); setErr("");
    try { await onAdd(name.trim()); setName(""); setOpen(false); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors flex items-center gap-1 py-0.5">
      + Add {placeholder}
    </button>
  );

  return (
    <span className="flex items-center gap-1.5 mt-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setName(""); setOpen(false); } }}
        placeholder={placeholder}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-sm text-zinc-100 outline-none focus:border-indigo-500 w-48"
      />
      <button onClick={submit} disabled={saving || !name.trim()} className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40">
        {saving ? "…" : "Add"}
      </button>
      <button onClick={() => { setName(""); setOpen(false); setErr(""); }} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </span>
  );
}

/* ── main page ── */
export default function CatalogPage() {
  const [brands,  setBrands]  = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [openBrands, setOpenBrands] = useState<Set<number>>(new Set());
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/users/me/profile")
      .then((r) => r.json())
      .then((d) => setAuthorized(d.user?.role === "SUPERADMIN"))
      .catch(() => setAuthorized(false));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => { setBrands(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (authorized) load(); }, [load, authorized]);

  function toggleBrand(id: number) {
    setOpenBrands((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ── mutation helpers ── */
  async function renameBrand(id: number, name: string) {
    await api(`/api/catalog/brands/${id}`, "PATCH", { name });
    setBrands((prev) => prev.map((b) => b.id === id ? { ...b, name } : b));
  }
  async function deleteBrand(id: number) {
    await api(`/api/catalog/brands/${id}`, "DELETE");
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }
  async function addBrand(name: string) {
    const b = await api("/api/catalog", "POST", { name });
    setBrands((prev) => [...prev, { ...b, models: [] }].sort((a, z) => a.name.localeCompare(z.name)));
  }

  async function renameModel(brandId: number, modelId: number, name: string) {
    await api(`/api/catalog/models/${modelId}`, "PATCH", { name });
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: b.models.map((m) => m.id === modelId ? { ...m, name } : m),
    }));
  }
  async function deleteModel(brandId: number, modelId: number) {
    await api(`/api/catalog/models/${modelId}`, "DELETE");
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: b.models.filter((m) => m.id !== modelId),
    }));
  }
  async function addModel(brandId: number, name: string) {
    const m = await api(`/api/catalog/brands/${brandId}/models`, "POST", { name });
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: [...b.models, { ...m, generations: [] }].sort((a, z) => a.name.localeCompare(z.name)),
    }));
  }

  async function renameGen(brandId: number, modelId: number, genId: number, name: string) {
    await api(`/api/catalog/generations/${genId}`, "PATCH", { name });
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: b.models.map((m) => m.id !== modelId ? m : {
        ...m, generations: m.generations.map((g) => g.id === genId ? { ...g, name } : g),
      }),
    }));
  }
  async function deleteGen(brandId: number, modelId: number, genId: number) {
    await api(`/api/catalog/generations/${genId}`, "DELETE");
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: b.models.map((m) => m.id !== modelId ? m : {
        ...m, generations: m.generations.filter((g) => g.id !== genId),
      }),
    }));
  }
  async function addGen(brandId: number, modelId: number, name: string) {
    const g = await api(`/api/catalog/models/${modelId}/generations`, "POST", { name });
    setBrands((prev) => prev.map((b) => b.id !== brandId ? b : {
      ...b, models: b.models.map((m) => m.id !== modelId ? m : {
        ...m, generations: [...m.generations, g].sort((a, z) => a.name.localeCompare(z.name)),
      }),
    }));
  }

  const q = search.toLowerCase();
  const filtered = q
    ? brands.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.models.some((m) => m.name.toLowerCase().includes(q) ||
          m.generations.some((g) => g.name.toLowerCase().includes(q)))
      )
    : brands;

  if (authorized === null) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <span className="text-sm text-zinc-500">Loading…</span>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-sm text-zinc-400">Only superadmins can manage the vehicle catalog.</p>
        <a href="/" className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">← Back home</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
          <a href="/settings/profile" className="hover:text-zinc-300 transition-colors">Settings</a>
          <span>›</span>
          <span className="text-zinc-300">Vehicle Catalog</span>
        </div>
        <h1 className="text-2xl font-semibold">Vehicle Catalog</h1>
        <p className="mt-1 text-sm text-zinc-400 mb-6">Add, rename, or delete brands, models, and generations.</p>

        <div className="flex items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands, models, generations…"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          />
          {loading && <span className="text-xs text-zinc-500">Loading…</span>}
        </div>

        <div className="space-y-1">
          {filtered.map((brand) => {
            const open = openBrands.has(brand.id) || !!q;
            return (
              <div key={brand.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                {/* Brand row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button onClick={() => toggleBrand(brand.id)}
                    className={`text-xs text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}>
                    ▶
                  </button>
                  <EditableLabel
                    value={brand.name}
                    onSave={(name) => renameBrand(brand.id, name)}
                    onDelete={() => deleteBrand(brand.id)}
                  />
                  <span className="ml-auto text-xs text-zinc-600">{brand.models.length} model{brand.models.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Models */}
                {open && (
                  <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
                    {brand.models.map((model) => (
                      <div key={model.id}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-zinc-600 text-xs">╰</span>
                          <EditableLabel
                            value={model.name}
                            onSave={(name) => renameModel(brand.id, model.id, name)}
                            onDelete={() => deleteModel(brand.id, model.id)}
                          />
                          <span className="ml-1 text-[10px] text-zinc-600">{model.generations.length} gen{model.generations.length !== 1 ? "s" : ""}</span>
                        </div>

                        {/* Generations */}
                        <div className="ml-6 space-y-0.5">
                          {model.generations.map((gen) => (
                            <div key={gen.id} className="flex items-center gap-1">
                              <span className="text-zinc-700 text-xs">—</span>
                              <EditableLabel
                                value={gen.name}
                                onSave={(name) => renameGen(brand.id, model.id, gen.id, name)}
                                onDelete={() => deleteGen(brand.id, model.id, gen.id)}
                              />
                            </div>
                          ))}
                          <AddRow placeholder="generation name" onAdd={(name) => addGen(brand.id, model.id, name)} />
                        </div>
                      </div>
                    ))}
                    <AddRow placeholder="model name" onAdd={(name) => addModel(brand.id, name)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <AddRow placeholder="brand name" onAdd={addBrand} />
        </div>
      </div>
    </main>
  );
}
