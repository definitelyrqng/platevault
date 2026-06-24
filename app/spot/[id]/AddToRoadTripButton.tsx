"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  uploadId: string;
  uploadNumericId: number;
}

type Trip = {
  id: string;
  numericId: number;
  name: string;
  _count: { uploads: number };
};

export default function AddToRoadTripButton({ uploadId, uploadNumericId }: Props) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // tripId being saved
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchTrips() {
    if (trips.length > 0) return; // already loaded
    setLoading(true);
    const res = await fetch("/api/roadtrips");
    const data = await res.json();
    if (data.trips) setTrips(data.trips);
    setLoading(false);
  }

  async function toggle(trip: Trip) {
    if (saving) return;
    const isAdded = addedIds.has(trip.id);
    setSaving(trip.id);
    const res = await fetch("/api/roadtrips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: trip.id,
        action: isAdded ? "removeUpload" : "addUpload",
        uploadNumericId,
      }),
    });
    if (res.ok) {
      setAddedIds((prev) => {
        const next = new Set(prev);
        if (isAdded) next.delete(trip.id); else next.add(trip.id);
        return next;
      });
    }
    setSaving(null);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchTrips(); }}
        title="Add to road trip"
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 h-10 text-sm font-medium text-zinc-400 hover:text-indigo-300 hover:border-indigo-800/40 transition-all"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h12" />
        </svg>
        Road Trip
      </button>

      {open && (
        <div className="absolute z-50 right-0 mt-2 w-64 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-zinc-950/80 overflow-hidden">
          <div className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold border-b border-zinc-800/60">
            Add to Road Trip
          </div>
          {loading ? (
            <div className="px-4 py-4 text-xs text-zinc-600 animate-pulse">Loading trips…</div>
          ) : trips.length === 0 ? (
            <div className="px-4 py-4 text-xs text-zinc-500">
              No road trips yet.{" "}
              <a href="/roadtrips" className="text-indigo-400 hover:underline">Create one →</a>
            </div>
          ) : (
            <div className="py-1 max-h-56 overflow-y-auto">
              {trips.map((trip) => {
                const added = addedIds.has(trip.id);
                const busy = saving === trip.id;
                return (
                  <button
                    key={trip.id}
                    onClick={() => toggle(trip)}
                    disabled={busy}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-zinc-900 ${
                      added ? "text-indigo-300" : "text-zinc-300"
                    }`}
                  >
                    <span className="truncate text-left">{trip.name}</span>
                    <span className="ml-3 shrink-0 text-xs text-zinc-600">
                      {busy ? "…" : added ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="border-t border-zinc-800/60 px-4 py-2">
            <a href="/roadtrips" className="text-xs text-zinc-600 hover:text-indigo-300 transition-colors">
              Manage road trips →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
