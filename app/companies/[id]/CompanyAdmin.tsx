"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  company: {
    id: string;
    name: string;
    country: string | null;
    city: string | null;
    description: string | null;
    website: string | null;
  };
};

const FIELD = "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600";

export default function CompanyAdmin({ company }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState(company.name);
  const [country, setCountry] = useState(company.country ?? "");
  const [city,    setCity]    = useState(company.city ?? "");
  const [desc,    setDesc]    = useState(company.description ?? "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [saving,  setSaving]  = useState(false);
  const [delMode, setDelMode] = useState(false);
  const [deleting,setDeleting]= useState(false);
  const [error,   setError]   = useState("");

  async function save() {
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/companies/" + company.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country: country || null, city: city || null, description: desc || null, website: website || null }),
      });
      if (!r.ok) { setError("Failed to save."); return; }
      router.refresh();
      setOpen(false);
    } finally { setSaving(false); }
  }

  async function remove() {
    setDeleting(true);
    try {
      const r = await fetch("/api/companies/" + company.id, { method: "DELETE" });
      if (!r.ok) { setError("Failed to delete."); return; }
      router.push("/companies");
    } finally { setDeleting(false); }
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-amber-950/10 p-4">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-500">
        <span>Mod Panel</span>
        <span className="text-amber-700">{open ? "&#9650;" : "&#9660;"}</span>
      </button>

      {open && !delMode && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Austria" className={FIELD} />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Vienna" className={FIELD} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={FIELD + " resize-none"} />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={FIELD} />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving || !name.trim()}
              className="flex-1 rounded-xl bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors">
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button onClick={() => setDelMode(true)}
              className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}

      {open && delMode && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-red-300/80">
            This removes the company from the directory. All linked spots will be unlinked (not deleted).
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setDelMode(false); setError(""); }}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button onClick={remove} disabled={deleting}
              className="flex-1 rounded-xl border border-red-900/50 bg-red-950/50 py-2 text-xs font-medium text-red-300 hover:bg-red-950 disabled:opacity-40 transition-colors">
              {deleting ? "Deleting..." : "Delete company"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
