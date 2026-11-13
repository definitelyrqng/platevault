"use client";

import { useState } from "react";
import type { Announcement } from "@/app/lib/announcement";

const INPUT = "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500";

/** Super admin: edit, turn off, and set the duration of the "What's new" banner. */
export default function AnnouncementSettings({ initial }: { initial: Announcement }) {
  const [a, setA] = useState(initial);
  const [showAgain, setShowAgain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof Announcement>(k: K, v: Announcement[K]) => setA((cur) => ({ ...cur, [k]: v }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, showAgain }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Could not save." }); return; }
      setA(data); setShowAgain(false);
      setMsg({ ok: true, text: "Saved." });
    } catch {
      setMsg({ ok: false, text: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">"What's new" banner</h2>
        <p className="mt-0.5 text-xs text-zinc-500">The bar at the top of every page. Visitors can always close it themselves.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-200">Show the banner</span>
          <button type="button" role="switch" aria-checked={a.enabled} onClick={() => set("enabled", !a.enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${a.enabled ? "bg-indigo-600" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${a.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>

        <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
          <label className="grid gap-1.5 text-xs text-zinc-500">Tag
            <input value={a.label} maxLength={20} onChange={(e) => set("label", e.target.value)} placeholder="New" className={INPUT} />
          </label>
          <label className="grid gap-1.5 text-xs text-zinc-500">Message
            <input value={a.text} maxLength={300} onChange={(e) => set("text", e.target.value)} placeholder="What's new on PlateVault…" className={INPUT} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs text-zinc-500">Link text
            <input value={a.linkText} maxLength={40} onChange={(e) => set("linkText", e.target.value)} placeholder="Try now →" className={INPUT} />
          </label>
          <label className="grid gap-1.5 text-xs text-zinc-500">Link (page or https://…)
            <input value={a.link} maxLength={200} onChange={(e) => set("link", e.target.value)} placeholder="/challenges" className={INPUT} />
          </label>
        </div>

        <label className="grid gap-1.5 text-xs text-zinc-500">
          Show it for how many days to a new visitor?
          <div className="flex items-center gap-3">
            <input type="number" min={0} max={365} value={a.days} onChange={(e) => set("days", Number(e.target.value) || 0)} className={INPUT + " w-28"} />
            <span className="text-xs text-zinc-500">
              {a.days > 0 ? `Hides ${a.days} day${a.days === 1 ? "" : "s"} after they first saw it.` : "0 = until they close it."}
            </span>
          </div>
        </label>

        <label className="flex items-start gap-2.5 text-xs text-zinc-400">
          <input type="checkbox" checked={showAgain} onChange={(e) => setShowAgain(e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
          <span>Show it again to everyone — including people who closed it, and restart the day count (use after changing the message).</span>
        </label>

        {/* preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-[13px] text-zinc-400">
          {a.label.trim() && <span className="mr-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{a.label}</span>}
          {a.text || <span className="text-zinc-600">(empty — the banner will not show)</span>}
          {a.link.trim() && a.linkText.trim() && <span className="ml-2 font-medium text-zinc-200 underline">{a.linkText}</span>}
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40">
            {busy ? "Saving…" : "Save"}
          </button>
          {msg && <span className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>}
        </div>
      </div>
    </section>
  );
}
