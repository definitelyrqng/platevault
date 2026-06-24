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

type ViewTrip = {
  id: string;
  numericId: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  uploads: Upload[];
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const fieldCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 placeholder:text-zinc-600";

export default function RoadTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTrip, setViewTrip] = useState<ViewTrip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Add spot
  const [addPlate, setAddPlate] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

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
    setEditing(false);
    setAddPlate(""); setAddError("");
    setLoadingTrip(true);
    const res = await fetch(`/api/roadtrips?id=${trip.numericId}`);
    const data = await res.json();
    if (data.trip) setViewTrip(data.trip);
    setLoadingTrip(false);
  }

  function startEdit() {
    if (!viewTrip) return;
    setEditName(viewTrip.name);
    setEditDesc(viewTrip.description ?? "");
    setEditStart(toDateInput(viewTrip.startDate));
    setEditEnd(toDateInput(viewTrip.endDate));
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!viewTrip || !editName.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/roadtrips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: viewTrip.id,
          name: editName,
          description: editDesc || null,
          startDate: editStart || null,
          endDate: editEnd || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.trip) {
        const updated: ViewTrip = { ...viewTrip, ...data.trip };
        setViewTrip(updated);
        setTrips((prev) =>
          prev.map((t) =>
            t.id === updated.id
              ? { ...t, name: updated.name, description: updated.description, startDate: updated.startDate, endDate: updated.endDate }
              : t
          )
        );
        setEditing(false);
      }
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteTrip(id: string) {
    if (!confirm("Delete this road trip? Spots won't be deleted, just removed from the trip.")) return;
    const res = await fetch(`/api/roadtrips?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (viewTrip?.id === id) setViewTrip(null);
    }
  }

  async function addSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!viewTrip || !addPlate.trim() || addLoading) return;
    setAddError(""); setAddLoading(true);

    // Search for the spot by plate text
    try {
      const searchRes = await fetch(`/api/search/suggest?q=${encodeURIComponent(addPlate.trim())}`);
      const searchData = await searchRes.json();
      const match = searchData.plates?.find(
        (p: { plateText: string; numericId: number }) =>
          p.plateText.replace(/\s/g, "").toUpperCase() === addPlate.replace(/\s/g, "").toUpperCase()
      );
      if (!match) {
        setAddError("Spot not found. Enter the exact plate text.");
        setAddLoading(false);
        return;
      }

      const res = await fetch("/api/roadtrips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: viewTrip.id, action: "addUpload", uploadNumericId: match.numericId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add spot.");
        setAddLoading(false);
        return;
      }

      // Reload trip to get updated uploads list
      const tripRes = await fetch(`/api/roadtrips?id=${viewTrip.numericId}`);
      const tripData = await tripRes.json();
      if (tripData.trip) {
        setViewTrip(tripData.trip);
        setTrips((prev) =>
          prev.map((t) =>
            t.id === viewTrip.id ? { ...t, _count: { uploads: tripData.trip.uploads.length } } : t
          )
        );
      }
      setAddPlate("");
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setAddLoading(false);
    }
  }

  async function removeSpot(uploadNumericId: number) {
    if (!viewTrip) return;
    const res = await fetch("/api/roadtrips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: viewTrip.id, action: "removeUpload", uploadNumericId }),
    });
    if (res.ok) {
      setViewTrip((prev) =>
        prev ? { ...prev, uploads: prev.uploads.filter((u) => u.numericId !== uploadNumericId) } : prev
      );
      setTrips((prev) =>
        prev.map((t) =>
          t.id === viewTrip.id ? { ...t, _count: { uploads: t._count.uploads - 1 } } : t
        )
      );
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
            onClick={() => { setShowForm((v) => !v); setEditing(false); }}
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
              className={fieldCls}
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              maxLength={500}
              rows={2}
              className={`${fieldCls} resize-none`}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Start date</label>
                <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">End date</label>
                <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className={fieldCls} />
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
              <div className="h-full grid place-items-center py-16">
                <div className="text-zinc-600 text-sm animate-pulse">Loading…</div>
              </div>
            ) : !viewTrip ? (
              <div className="h-full grid place-items-center p-8 text-center">
                <div>
                  <div className="text-4xl mb-3">🗺️</div>
                  <p className="text-sm text-zinc-500">Select a road trip to see its spots.</p>
                </div>
              </div>
            ) : editing ? (
              /* ── Edit form ── */
              <form onSubmit={saveEdit} className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-zinc-200">Edit Trip</div>
                  <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Cancel
                  </button>
                </div>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Trip name"
                  maxLength={100}
                  required
                  className={fieldCls}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={500}
                  rows={2}
                  className={`${fieldCls} resize-none`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Start date</label>
                    <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">End date</label>
                    <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className={fieldCls} />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!editName.trim() || editSaving}
                  className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </form>
            ) : (
              /* ── Trip detail view ── */
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-zinc-100 truncate">{viewTrip.name}</h2>
                    {viewTrip.description && <p className="text-sm text-zinc-400 mt-0.5">{viewTrip.description}</p>}
                    {(viewTrip.startDate || viewTrip.endDate) && (
                      <p className="text-xs text-zinc-600 mt-1">
                        {fmtDate(viewTrip.startDate)}{viewTrip.startDate && viewTrip.endDate ? " → " : ""}{fmtDate(viewTrip.endDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <button
                      onClick={startEdit}
                      className="text-xs text-zinc-500 hover:text-indigo-300 transition-colors"
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => deleteTrip(viewTrip.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Add spot */}
                <form onSubmit={addSpot} className="mt-4 mb-5 flex gap-2">
                  <input
                    value={addPlate}
                    onChange={(e) => { setAddPlate(e.target.value); setAddError(""); }}
                    placeholder="Add spot by plate e.g. 6P9 2125"
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono tracking-wider text-zinc-100 outline-none focus:border-indigo-700/60 placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={!addPlate.trim() || addLoading}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors shrink-0"
                  >
                    {addLoading ? "…" : "+ Add"}
                  </button>
                </form>
                {addError && <p className="text-xs text-red-400 -mt-3 mb-4">{addError}</p>}

                {/* Uploads grid */}
                {viewTrip.uploads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-center text-sm text-zinc-500">
                    No spots in this trip yet.<br />
                    Type a plate number above to add your first spot!
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {viewTrip.uploads.map((u) => (
                      <div key={u.numericId} className="group relative rounded-2xl border border-zinc-800 overflow-hidden hover:border-indigo-800/60 transition-all">
                        <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-10" aria-label={u.plateText} />
                        <div className="bg-zinc-950 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                          <img
                            src={u.imageUrl}
                            alt={u.plateText}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-mono text-xs font-bold text-zinc-100 tracking-wider">{u.plateText}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{cap(u.country)}</div>
                          </div>
                          <button
                            onClick={() => removeSpot(u.numericId)}
                            className="relative z-20 text-xs text-zinc-700 hover:text-red-400 transition-colors p-1"
                            title="Remove from trip"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
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
