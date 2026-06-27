"use client";

// Note: metadata for client pages is set via layout template

import { useEffect, useState } from "react";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";

type CollectionItem = {
  upload: {
    numericId: number;
    imageUrl: string;
    plateText: string;
    country: string;
  };
};

type Collection = {
  id: string;
  numericId: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { items: number };
  items: CollectionItem[];
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      if (!me.user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? []);
      }
      setLoading(false);
    })();
  }, []);

  async function createCollection() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: newDesc.trim() || null }),
    });
    if (res.ok) {
      const { collection } = await res.json();
      setCollections((prev) => [{ ...collection, _count: { items: 0 }, items: [] }, ...prev]);
      setNewName("");
      setNewDesc("");
      setCreating(false);
    }
  }

  async function deleteCollection(numericId: number) {
    if (!confirm("Delete this collection?")) return;
    const res = await fetch(`/api/collections/${numericId}`, { method: "DELETE" });
    if (res.ok) setCollections((prev) => prev.filter((c) => c.numericId !== numericId));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <a href="/home" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
          ← Back
        </a>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-zinc-50">My Collections</h1>
          </div>
          {loggedIn && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 transition-colors"
            >
              + New Collection
            </button>
          )}
        </div>

        {!loggedIn && !loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <p className="text-zinc-400">Sign in to manage your collections.</p>
            <a href="/login" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Sign in
            </a>
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-indigo-800/40 bg-indigo-950/20 p-5">
            <h2 className="mb-3 text-sm font-semibold text-indigo-300">New Collection</h2>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCollection()}
                placeholder="Collection name…"
                maxLength={80}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60 transition-colors"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)…"
                maxLength={280}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={createCollection}
                  disabled={!newName.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 shadow-lg shadow-indigo-950/50 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}
                  className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm text-zinc-400 hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 h-48 animate-pulse" />
            ))}
          </div>
        ) : collections.length === 0 && loggedIn ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <div className="text-4xl">🗂️</div>
            <div className="mt-4 text-sm font-medium text-zinc-200">No collections yet</div>
            <p className="mt-1 text-xs text-zinc-500">Create a collection and save your favourite spots to it.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <div key={col.numericId} className="flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all">
                {/* Preview images */}
                <div className="grid grid-cols-3 h-32 bg-zinc-950">
                  {col.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="overflow-hidden border-r border-zinc-900/60 last:border-0">
                      <img src={item.upload.imageUrl} alt={item.upload.plateText} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div className="col-span-3 flex items-center justify-center text-zinc-600 text-xs">Empty collection</div>
                  )}
                </div>

                <div className="flex flex-col flex-1 px-4 py-3.5 gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <a href={`/collections/${col.numericId}`} className="font-bold text-zinc-100 hover:text-indigo-200 transition-colors text-sm leading-snug">
                      {col.name}
                    </a>
                    {!col.isPublic && (
                      <span className="text-[10px] rounded-full bg-zinc-800/80 border border-zinc-700/50 px-2 py-0.5 text-zinc-500 shrink-0">private</span>
                    )}
                  </div>
                  {col.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">{col.description}</p>
                  )}
                  <div className="mt-auto pt-2.5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{col._count.items} spot{col._count.items !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => deleteCollection(col.numericId)}
                      className="text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
