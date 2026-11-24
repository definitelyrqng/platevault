"use client";

import { useState } from "react";
import type { DirectNotice } from "@/app/lib/directNotice";

const INPUT = "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500";

/** Super admin: the warning shown every time someone opens the site directly (typed URL, bookmark, no referrer). */
export default function DirectNoticeSettings({ initial }: { initial: DirectNotice }) {
  const [n, setN] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof DirectNotice>(k: K, v: DirectNotice[K]) => setN((c) => ({ ...c, [k]: v }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/direct-notice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Could not save." }); return; }
      setN(data); setMsg({ ok: true, text: "Saved." });
    } catch {
      setMsg({ ok: false, text: "Network error — try again." });
    } finally { setBusy(false); }
  }

  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Direct-visit warning</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Shown every time someone opens PlateVault directly (typing the address, a bookmark, or a link without a referrer). Not shown to search engines. Visitors can close it.</p>
      </div>
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-200">Show the warning</span>
          <button type="button" role="switch" aria-checked={n.enabled} onClick={() => set("enabled", !n.enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${n.enabled ? "bg-indigo-600" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${n.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>
        <label className="grid gap-1.5 text-xs text-zinc-500">Title
          <input value={n.title} maxLength={60} onChange={(e) => set("title", e.target.value)} placeholder="Heads up" className={INPUT} />
        </label>
        <label className="grid gap-1.5 text-xs text-zinc-500">Message
          <textarea value={n.text} maxLength={400} rows={3} onChange={(e) => set("text", e.target.value)} className={INPUT} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs text-zinc-500">Link text (optional)
            <input value={n.linkText} maxLength={40} onChange={(e) => set("linkText", e.target.value)} placeholder="Read the rules →" className={INPUT} />
          </label>
          <label className="grid gap-1.5 text-xs text-zinc-500">Link (page or https://…)
            <input value={n.link} maxLength={200} onChange={(e) => set("link", e.target.value)} placeholder="/rules" className={INPUT} />
          </label>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-zinc-900 p-3 text-[13px]">
          <p className="font-semibold text-zinc-100">⚠ {n.title || <span className="text-zinc-600">(no title)</span>}</p>
          <p className="mt-0.5 text-zinc-400">{n.text || <span className="text-zinc-600">(empty — the warning will not show)</span>}</p>
          {n.link.trim() && n.linkText.trim() && <p className="mt-1 text-amber-300 underline">{n.linkText}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40">{busy ? "Saving…" : "Save"}</button>
          {msg && <span className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>}
        </div>
      </div>
    </section>
  );
}
