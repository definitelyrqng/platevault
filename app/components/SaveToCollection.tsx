"use client";

import { useEffect, useRef, useState } from "react";

type Collection = {
  numericId: number;
  name: string;
  _count: { items: number };
};

export default function SaveToCollection({ spotNumericId }: { spotNumericId: number }) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setLoggedIn(!!d.user));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openDropdown() {
    if (!loggedIn) return;
    setOpen(true);
    if (collections.length === 0) {
      setLoading(true);
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? []);
      }
      setLoading(false);
    }
  }

  async function toggle(col: Collection) {
    setBusy(col.numericId);
    const inCollection = saved.has(col.numericId);
    const method = inCollection ? "DELETE" : "POST";
    const res = await fetch(`/api/collections/${col.numericId}/items`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadNumericId: spotNumericId }),
    });
    if (res.ok || res.status === 409) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (inCollection) next.delete(col.numericId);
        else next.add(col.numericId);
        return next;
      });
    }
    setBusy(null);
  }

  async function createAndAdd() {
    const name = newName.trim();
    if (!name) return;
    setBusy(-1);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { collection } = await res.json();
      // Immediately add spot
      await fetch(`/api/collections/${collection.numericId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadNumericId: spotNumericId }),
      });
      setCollections((prev) => [{ ...collection, _count: { items: 1 } }, ...prev]);
      setSaved((prev) => new Set(prev).add(collection.numericId));
      setNewName("");
      setCreating(false);
    }
    setBusy(null);
  }

  if (loggedIn === false) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={open ? () => setOpen(false) : openDropdown}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 h-10 text-sm text-zinc-400 hover:border-indigo-700/40 hover:text-indigo-300 transition-all"
      >
        <span>🗂️</span>
        <span>Save</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-zinc-950/60 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400">Save to collection</div>

          <div className="max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-xs text-zinc-500 animate-pulse">Loading…</div>
            )}
            {!loading && collections.length === 0 && !creating && (
              <div className="px-4 py-3 text-xs text-zinc-500">No collections yet.</div>
            )}
            {collections.map((col) => {
              const inCollection = saved.has(col.numericId);
              return (
                <button
                  key={col.numericId}
                  onClick={() => toggle(col)}
                  disabled={busy !== null}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-zinc-800/60 disabled:opacity-50 ${inCollection ? "text-indigo-300" : "text-zinc-300"}`}
                >
                  <span className="truncate">{col.name}</span>
                  <span className={`shrink-0 text-xs ${inCollection ? "text-indigo-400" : "text-zinc-600"}`}>
                    {inCollection ? "✓" : `${col._count.items}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-800">
            {creating ? (
              <div className="flex gap-2 p-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                  placeholder="Collection name…"
                  maxLength={80}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60"
                />
                <button
                  onClick={createAndAdd}
                  disabled={!newName.trim() || busy !== null}
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full px-4 py-2.5 text-left text-xs text-zinc-500 hover:text-indigo-300 transition-colors"
              >
                + New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
