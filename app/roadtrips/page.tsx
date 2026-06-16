"use client";

import { useEffect, useState } from "react";

type Trip = {
  id: string;
  numericId: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count: { uploads: number };
};

type Upload = {
  numericId: number;
  plateText: string;
  country: string;
  imageUrl: string;
  createdAt: string;
  _count: { likes: number };
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RoadTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [viewTrip, setViewTrip] = useState<{ id: string; numericId: number; name: string; description: string | null; uploads: Upload[] } | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // New trip form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/roadtrips")
      .then((r) => r.json())
      .then((d) => { if (d.trips) setTrips(d.trips); })
      .finally(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/roadtrips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, startDate: newStart || null, endDate: newEnd || null }),
      });
      const data = await res.json();
      if (res.ok && data.trip) {
        setTrips((prev) => [{ ...data.trip, _count: { uploads: 0 } }, ...prev]);
        setNewName(""); setNewDesc(""); setNewStart(""); setNewEnd("");
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function loadTrip(trip: Trip) {
    setLoadingTrip(true);
    const res = await fetch(`/api/roadtrips?id=${trip.numericId}`);
    const data = await res.json();
    if (data.trip) setViewTrip(data.trip);
    setLoadingTrip(false);
  }

  async function deleteTrip(id: string) {
    if (!confirm("Delete this road trip?")) return;
    const res = await fetch(`/api/roadtrips?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (viewTrip?.id === id) setViewTrip(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-indigo-500" />
            <h1 className="text-2xl font-bold text-zinc-50">Road Trips 🗺️</h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New Trip
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={create} className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900/40 p-5 space-y-3">
            <div className="text-sm font-semibold text-zinc-200">New Road Trip</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Trip name e.g. Balkans 2025"
              maxLength={100}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-700/60"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              maxLength={500}
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-700/60 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Start date</label>
                <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-700/60 text-zinc-200" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">End date</label>
                <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-700/60 text-zinc-200" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!newName.trim() || saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                {saving ? "Creating…" : "Create Trip"}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Trip list */}
          <aside className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-20 rounded-2xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />)}
              </div>
            ) : trips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-6 text-center text-sm text-zinc-500">
                No road trips yet.<br />Create one to group your spots!
              </div>
            ) : (
              trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => loadTrip(trip)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    viewTrip?.id === trip.id
                      ? "border-indigo-700/60 bg-indigo-950/20"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-medium text-sm text-zinc-100">{trip.name}</div>
                  {trip.description && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{trip.description}</div>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                    <span>{trip._count.uploads} spot{trip._count.uploads !== 1 ? "s" : ""}</span>
                    {trip.startDate && <span>{fmtDate(trip.startDate)}</span>}
                    {trip.endDate && <><span>→</span><span>{fmtDate(trip.endDate)}</span></>}
                  </div>
                </button>
              ))
            )}
          </aside>

          {/* Trip detail */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 min-h-64">
            {loadingTrip ? (
              <div className="h-full grid place-items-center">
                <div className="text-zinc-600 text-sm animate-pulse">Loading…</div>
              </div>
            ) : !viewTrip ? (
              <div className="h-full grid place-items-center p-8 text-center">
                <div>
                  <div className="text-4xl mb-3">🗺️</div>
                  <p className="text-sm text-zinc-500">Select a road trip to see its spots.</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">{viewTrip.name}</h2>
                    {viewTrip.description && <p className="text-sm text-zinc-400 mt-0.5">{viewTrip.description}</p>}
                  </div>
                  <button
                    onClick={() => deleteTrip(viewTrip.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors ml-4 shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {viewTrip.uploads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-center text-sm text-zinc-500">
                    No spots in this trip yet.<br />
                    Add spots to a trip from the upload form or the spot editor.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {viewTrip.uploads.map((u) => (
                      <a
                        key={u.numericId}
                        href={`/spot/${u.numericId}`}
                        className="group rounded-2xl border border-zinc-800 overflow-hidden hover:border-indigo-800/60 transition-all"
                      >
                        <div className="aspect-video bg-zinc-950 overflow-hidden">
                          <img
                            src={u.imageUrl}
                            alt={u.plateText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2.5">
                          <div className="font-mono text-xs font-bold text-zinc-100 tracking-wider">{u.plateText}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{cap(u.country)}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
