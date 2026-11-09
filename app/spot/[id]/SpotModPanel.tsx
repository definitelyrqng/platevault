"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CompanyPicker from "@/app/components/CompanyPicker";
import TagPicker from "@/app/components/TagPicker";
import { COUNTRY_META } from "@/app/lib/countries";
import { plateTypeLabel } from "@/app/lib/plateTypes";

/**
 * One moderation panel per spot (replaces the old tag editor + two-tab admin box).
 *   Moderators:  hide / restore, edit tags
 *   Admins:      + edit every field, delete
 * One section is open at a time; quick actions are always one click away.
 */

type Fields = {
  plateText: string; plateType: string; plateRegion: string; country: string; location: string;
  description: string; brand: string; model: string; generation: string; trim: string;
  color: string; badge: string; companyId: string | null; tags: string[];
};
type View = null | "edit" | "hide" | "delete";
type Row = { id: number; name: string };

const COUNTRIES = Object.entries(COUNTRY_META).map(([slug, m]) => ({ slug, name: m.name })).sort((a, b) => a.name.localeCompare(b.name));

const INPUT = "h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500 disabled:opacity-40";
const LABEL = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500";

function Btn({ children, onClick, tone = "default", disabled, active }: {
  children: React.ReactNode; onClick: () => void; tone?: "default" | "danger" | "good"; disabled?: boolean; active?: boolean;
}) {
  const tones = {
    default: "border-zinc-700 text-zinc-200 hover:bg-zinc-800",
    danger: "border-red-900/60 text-red-300 hover:bg-red-950/40",
    good: "border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/30",
  } as const;
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${tones[tone]} ${active ? "bg-zinc-800 ring-1 ring-zinc-600" : ""}`}>
      {children}
    </button>
  );
}

export default function SpotModPanel({ uploadId, role, initial, initialHidden }: {
  uploadId: string;
  role: "SUPERADMIN" | "ADMIN" | "MOD";
  initial: Fields;
  initialHidden: boolean;
}) {
  const router = useRouter();
  const canEdit = role === "SUPERADMIN" || role === "ADMIN";

  const [view, setView] = useState<View>(null);
  const [f, setF] = useState<Fields>(initial);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((s) => ({ ...s, [k]: v }));
  const [hidden, setHidden] = useState(initialHidden);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Catalog (brand → model → generation) is only loaded when the edit form opens
  const [brands, setBrands] = useState<Row[]>([]);
  const [models, setModels] = useState<Row[]>([]);
  const [gens, setGens] = useState<Row[]>([]);
  useEffect(() => {
    if (view !== "edit" || !canEdit || brands.length) return;
    fetch("/api/catalog").then((r) => r.json()).then((d: Row[]) => setBrands(d)).catch(() => {});
  }, [view, canEdit, brands.length]);
  const brandId = brands.find((b) => b.name === f.brand)?.id;
  useEffect(() => {
    if (!brandId) { setModels([]); return; }
    fetch(`/api/catalog/brands/${brandId}/models`).then((r) => r.json()).then(setModels).catch(() => {});
  }, [brandId]);
  const modelId = models.find((m) => m.name === f.model)?.id;
  useEffect(() => {
    if (!modelId) { setGens([]); return; }
    fetch(`/api/catalog/models/${modelId}/generations`).then((r) => r.json()).then(setGens).catch(() => {});
  }, [modelId]);

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 3000);
  }
  const open = (v: View) => { setView((cur) => (cur === v ? null : v)); setReason(""); setMsg(null); };

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: {} };
    } finally {
      setBusy(false);
    }
  }

  async function toggleHidden(next: boolean) {
    const r = await call(`/api/admin/uploads/${uploadId}/visibility`, "PATCH", { hidden: next, reason: next ? reason.trim() || null : null });
    if (!r.ok) return flash(false, "Couldn't change visibility.");
    setHidden(next); setView(null); setReason("");
    flash(true, next ? "Spot hidden." : "Spot is visible again.");
    router.refresh();
  }

  async function save() {
    if (canEdit) {
      const r = await call(`/api/uploads/${uploadId}`, "PATCH", {
        plateText: f.plateText, plateType: f.plateType, plateRegion: f.plateRegion, country: f.country,
        location: f.location, description: f.description, brand: f.brand, model: f.model,
        generation: f.generation, trim: f.trim, color: f.color, badge: f.badge, companyId: f.companyId,
      });
      if (!r.ok) return flash(false, (r.data as { error?: string }).error ?? "Save failed.");
    }
    if (JSON.stringify(f.tags) !== JSON.stringify(initial.tags) || !canEdit) {
      const t = await call(`/api/uploads/${uploadId}/tags`, "PATCH", { tags: f.tags });
      if (!t.ok) return flash(false, "Tags couldn't be saved.");
    }
    setView(null);
    flash(true, "Saved.");
    router.refresh();
  }

  async function remove() {
    const r = await call(`/api/uploads/${uploadId}`, "DELETE", { reason: reason.trim() || null });
    if (!r.ok) return flash(false, "Delete failed — try again.");
    window.location.href = "/home";
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50" aria-label="Moderation">
      {/* Header: what you can see at a glance */}
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/15 text-amber-400" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>
        </span>
        <h2 className="text-sm font-semibold text-zinc-100">Moderation</h2>
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{role === "SUPERADMIN" ? "Super admin" : role.toLowerCase()}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          hidden ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"}`}>
          {hidden ? "Hidden" : "Visible"}
        </span>
      </header>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {hidden
          ? <Btn tone="good" onClick={() => toggleHidden(false)} disabled={busy}>↑ Restore</Btn>
          : <Btn onClick={() => open("hide")} active={view === "hide"}>↓ Hide</Btn>}
        <Btn onClick={() => open("edit")} active={view === "edit"}>{canEdit ? "✏ Edit spot" : "# Edit tags"}</Btn>
        {canEdit && <Btn tone="danger" onClick={() => open("delete")} active={view === "delete"}>🗑 Delete</Btn>}
        {msg && <span className={`ml-auto self-center text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</span>}
      </div>

      {/* Hide */}
      {view === "hide" && (
        <div className="space-y-3 border-t border-zinc-800 px-4 py-4">
          <label className="block">
            <span className={LABEL}>Reason <span className="normal-case text-zinc-600">(optional, shown to the spotter)</span></span>
            <input className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={280} placeholder="Under review, duplicate, breaks the rules…" />
          </label>
          <div className="flex gap-2">
            <Btn onClick={() => toggleHidden(true)} disabled={busy}>{busy ? "Hiding…" : "Hide spot"}</Btn>
            <Btn onClick={() => setView(null)}>Cancel</Btn>
          </div>
          <p className="text-xs text-zinc-500">Hidden spots disappear from the site and search; admins can still see them here.</p>
        </div>
      )}

      {/* Edit */}
      {view === "edit" && (
        <div className="space-y-4 border-t border-zinc-800 px-4 py-4">
          {canEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label><span className={LABEL}>Plate</span>
                  <input className={`${INPUT} font-mono uppercase tracking-wider`} value={f.plateText} maxLength={32} onChange={(e) => set("plateText", e.target.value.toUpperCase())} /></label>
                <label><span className={LABEL}>Country</span>
                  <select className={INPUT} value={f.country} onChange={(e) => set("country", e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select></label>
                <label><span className={LABEL}>Plate type</span>
                  <input className={`${INPUT} font-mono text-xs`} value={f.plateType} maxLength={60} onChange={(e) => set("plateType", e.target.value)} />
                  <span className="mt-1 block text-[11px] text-zinc-500">Shown as: {plateTypeLabel(f.country, f.plateType) ?? "—"}</span></label>
                <label><span className={LABEL}>Region code</span>
                  <input className={`${INPUT} font-mono uppercase`} value={f.plateRegion} maxLength={10} onChange={(e) => set("plateRegion", e.target.value.toUpperCase())} /></label>
              </div>

              <label className="block"><span className={LABEL}>Location</span>
                <input className={INPUT} value={f.location} maxLength={120} onChange={(e) => set("location", e.target.value)} placeholder="City or area" /></label>

              <div className="grid grid-cols-3 gap-3">
                <label><span className={LABEL}>Brand</span>
                  <select className={INPUT} value={f.brand} onChange={(e) => setF((s) => ({ ...s, brand: e.target.value, model: "", generation: "" }))}>
                    <option value="">—</option>
                    {f.brand && !brands.some((b) => b.name === f.brand) && <option value={f.brand}>{f.brand}</option>}
                    {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select></label>
                <label><span className={LABEL}>Model</span>
                  <select className={INPUT} value={f.model} disabled={!f.brand} onChange={(e) => setF((s) => ({ ...s, model: e.target.value, generation: "" }))}>
                    <option value="">—</option>
                    {f.model && !models.some((m) => m.name === f.model) && <option value={f.model}>{f.model}</option>}
                    {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select></label>
                <label><span className={LABEL}>Generation</span>
                  <select className={INPUT} value={f.generation} disabled={!f.model} onChange={(e) => set("generation", e.target.value)}>
                    <option value="">—</option>
                    {f.generation && !gens.some((g) => g.name === f.generation) && <option value={f.generation}>{f.generation}</option>}
                    {gens.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select></label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label><span className={LABEL}>Trim</span><input className={INPUT} value={f.trim} maxLength={60} onChange={(e) => set("trim", e.target.value)} /></label>
                <label><span className={LABEL}>Badge</span><input className={INPUT} value={f.badge} maxLength={30} onChange={(e) => set("badge", e.target.value)} /></label>
                <label><span className={LABEL}>Colour</span><input className={INPUT} value={f.color} maxLength={60} onChange={(e) => set("color", e.target.value)} /></label>
              </div>

              <div><span className={LABEL}>Transport company</span>
                <CompanyPicker value={f.companyId} onChange={(id) => set("companyId", id)} /></div>

              <label className="block"><span className={LABEL}>Description <span className="normal-case text-zinc-600">{f.description.length}/1000</span></span>
                <textarea className={`${INPUT} h-auto resize-none py-2`} rows={3} maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
            </>
          )}

          <div><span className={LABEL}>Tags</span><TagPicker selected={f.tags} onChange={(t) => set("tags", t)} max={6} /></div>

          <div className="flex gap-2 border-t border-zinc-800 pt-4">
            <button type="button" onClick={save} disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50">
              {busy ? "Saving…" : "Save changes"}
            </button>
            <Btn onClick={() => { setF(initial); setView(null); }}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Delete */}
      {view === "delete" && canEdit && (
        <div className="space-y-3 border-t border-red-900/40 bg-red-950/10 px-4 py-4">
          <p className="text-sm text-red-200">Delete this spot? The photo and its likes and comments go with it. <strong>This can&apos;t be undone.</strong></p>
          <label className="block">
            <span className={LABEL}>Reason <span className="normal-case text-zinc-600">(shown to the spotter)</span></span>
            <textarea className={`${INPUT} h-auto resize-none py-2`} rows={2} maxLength={280} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Duplicate, blurry, breaks the rules…" />
          </label>
          <div className="flex gap-2">
            <Btn tone="danger" onClick={remove} disabled={busy}>{busy ? "Deleting…" : "Delete forever"}</Btn>
            <Btn onClick={() => setView(null)}>Cancel</Btn>
          </div>
        </div>
      )}
    </section>
  );
}
