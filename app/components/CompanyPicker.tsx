"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Company = { id: string; numericId: number; name: string; country: string | null; city: string | null };

type Props = {
  value: string | null;
  onChange: (companyId: string | null, company: Company | null) => void;
};

const FIELD = "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-500 placeholder:text-zinc-600";

export default function CompanyPicker({ value, onChange }: Props) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<Company[]>([]);
  const [selected,  setSelected]  = useState<Company | null>(null);
  const [open,      setOpen]      = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState("");
  const [newCountry,setNewCountry]= useState("");
  const [newCity,   setNewCity]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    fetch("/api/companies/" + value)
      .then((r) => r.json())
      .then((d) => { if (d.company) setSelected(d.company); })
      .catch(() => {});
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const r = await fetch("/api/companies?q=" + encodeURIComponent(q) + "&take=8");
    const d = await r.json();
    setResults(d.companies ?? []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(c: Company) {
    setSelected(c); onChange(c.id, c);
    setQuery(""); setResults([]); setOpen(false);
  }

  function clear() {
    setSelected(null); onChange(null, null); setQuery("");
  }

  async function createCompany() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), country: newCountry.trim() || null, city: newCity.trim() || null }),
      });
      const d = await r.json();
      if (d.company) { pick(d.company); setCreating(false); setNewName(""); setNewCountry(""); setNewCity(""); }
    } finally { setSaving(false); }
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-2.5">
        <span className="text-sm text-zinc-100 flex-1 truncate">
          {selected.name}
          {(selected.city || selected.country) && (
            <span className="text-zinc-500 ml-1.5 text-xs">
              {[selected.city, selected.country].filter(Boolean).join(", ")}
            </span>
          )}
        </span>
        <button type="button" onClick={clear} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none">
          &#215;
        </button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">New company</p>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name *" className={FIELD} />
        <div className="grid grid-cols-2 gap-2">
          <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Country" className={FIELD} />
          <input value={newCity}    onChange={(e) => setNewCity(e.target.value)}    placeholder="City"    className={FIELD} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={createCompany} disabled={!newName.trim() || saving}
            className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors">
            {saving ? "Saving..." : "Add company"}
          </button>
          <button type="button" onClick={() => setCreating(false)}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search transport company..."
        className={FIELD}
      />
      {open && (query.trim() || results.length > 0) && (
        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
            >
              <span className="text-sm text-zinc-100 truncate">{c.name}</span>
              {(c.city || c.country) && (
                <span className="text-xs text-zinc-500 shrink-0">
                  {[c.city, c.country].filter(Boolean).join(", ")}
                </span>
              )}
            </button>
          ))}
          {results.length === 0 && query.trim() && (
            <div className="px-3 py-2.5 text-sm text-zinc-500">No matches found.</div>
          )}
          <div className="border-t border-zinc-800 px-3 py-2">
            <button type="button" onClick={() => { setCreating(true); setOpen(false); setNewName(query.trim()); }}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              + Add new company
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
