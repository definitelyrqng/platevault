"use client";

import { useRouter } from "next/navigation";

interface Props {
  query: string;
  filterCountry: string;
  sortBy: string;
  countries: { key: string; name: string }[];
}

export default function SearchFilters({ query, filterCountry, sortBy, countries }: Props) {
  const router = useRouter();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (key !== "country") params.set("country", filterCountry);
    if (key !== "sort")    params.set("sort", sortBy);
    if (value) params.set(key, value);
    router.push(`/search?${params.toString()}`);
  }

  const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Country filter */}
      <select
        value={filterCountry}
        onChange={(e) => update("country", e.target.value)}
        className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-700/60 cursor-pointer hover:border-zinc-700 transition-colors"
      >
        <option value="">All countries</option>
        {sorted.map((c) => (
          <option key={c.key} value={c.key}>{c.name}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => update("sort", e.target.value)}
        className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-700/60 cursor-pointer hover:border-zinc-700 transition-colors"
      >
        <option value="newest">Most relevant</option>
        <option value="liked">Most liked</option>
      </select>

      {/* Active filter chips */}
      {filterCountry && (
        <button
          onClick={() => update("country", "")}
          className="flex items-center gap-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/50 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-950 transition-colors"
        >
          {countries.find(c => c.key === filterCountry)?.name ?? filterCountry}
          <span className="text-indigo-500">✕</span>
        </button>
      )}
    </div>
  );
}
