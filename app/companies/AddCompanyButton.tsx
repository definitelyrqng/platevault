"use client";

import { useState } from "react";

const FIELD = "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">{children}</label>;
}

export default function AddCompanyButton() {
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState("");
  const [country, setCountry] = useState("");
  const [city,    setCity]    = useState("");
  const [desc,    setDesc]    = useState("");
  const [website, setWebsite] = useState("");
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");

  function reset() {
    setName(""); setCountry(""); setCity(""); setDesc(""); setWebsite(""); setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim() || null,
          city: city.trim() || null,
          description: desc.trim() || null,
          website: website.trim() || null,
        }),
      });
      if (!r.ok) { setError("Failed to create company."); return; }
      reset();
      setOpen(false);
      window.location.reload();
    } finally { setBusy(false); }
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all flex items-center gap-2"
    >
      <span className="text-lg leading-none">+</span> Add company
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-5 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">New company</p>

      <div>
        <Label>Name *</Label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Autohaus Example" className={FIELD} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Country</Label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Austria" className={FIELD} />
        </div>
        <div>
          <Label>City</Label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Vienna" className={FIELD} />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={FIELD + " resize-none"} />
      </div>

      <div>
        <Label>Website</Label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={FIELD} />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={busy || !name.trim()}
          className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors">
          {busy ? "Creating..." : "Create company"}
        </button>
        <button type="button" onClick={() => { reset(); setOpen(false); }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
