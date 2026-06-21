"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  plates: { plateText: string; country: string; numericId: number }[];
  users: { numericId: number; username: string; avatarUrl: string | null }[];
}

export default function SearchAutocomplete({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion>({ plates: [], users: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setSuggestions({ plates: [], users: [] }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.plates.length > 0 || data.users.length > 0);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(q), 220);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    if (value.trim()) router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  function selectPlate(plateText: string) {
    setOpen(false);
    setValue(plateText);
    router.push(`/search?q=${encodeURIComponent(plateText)}`);
  }

  function selectUser(numericId: number) {
    setOpen(false);
    router.push(`/u/${numericId}`);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = suggestions.plates.length > 0 || suggestions.users.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            name="q"
            value={value}
            onChange={handleChange}
            onFocus={() => hasResults && setOpen(true)}
            placeholder="Plate number or username…"
            autoComplete="off"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-sm font-mono tracking-wider text-zinc-100 placeholder:text-zinc-600 placeholder:font-sans placeholder:tracking-normal outline-none focus:border-indigo-700/60 focus:bg-zinc-900 transition-colors"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {open && hasResults && (
        <div className="absolute z-50 left-0 right-14 mt-2 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-zinc-950/80 overflow-hidden">
          {suggestions.plates.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Plates</div>
              {suggestions.plates.map((p) => (
                <button
                  key={p.plateText + p.country}
                  onMouseDown={() => selectPlate(p.plateText)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900 transition-colors text-left group"
                >
                  <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors">
                    {p.plateText}
                  </span>
                  <span className="ml-auto text-xs text-zinc-600 capitalize">{p.country}</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.users.length > 0 && (
            <div className={suggestions.plates.length > 0 ? "border-t border-zinc-800/60" : ""}>
              <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Users</div>
              {suggestions.users.map((u) => (
                <button
                  key={u.numericId}
                  onMouseDown={() => selectUser(u.numericId)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900 transition-colors"
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} className="h-6 w-6 rounded-lg object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-lg bg-zinc-800 grid place-items-center text-[9px] font-bold text-zinc-500">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-zinc-300">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
