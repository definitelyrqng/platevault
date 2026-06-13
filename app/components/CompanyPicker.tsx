"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Company = { id: string; numericId: number; name: string; country: string | null; city: string | null };

type Props = {
  value: string | null;
  onChange: (companyId: string | null, company: Company | null) => void;
};

const FIELD = "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-500 placeholder:text-zinc-600";

export default function CompanyPicker({ value, onChange }: Props) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [open,     setOpen]     = useState(false);
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

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
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
            <div className="px-3 py-2.5 text-sm text-zinc-500">No company found.</div>
          )}
        </div>
      )}
    </div>
  );
}
