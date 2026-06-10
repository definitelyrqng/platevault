"use client";

import { useState } from "react";
import TagPicker from "@/app/components/TagPicker";

interface Props {
  uploadId: string;
  initialTags: string[];
}

export default function TagEditor({ uploadId, initialTags }: Props) {
  const [tags, setTags] = useState(initialTags);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/uploads/${uploadId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {open ? "Cancel" : "Edit tags"}
      </button>
      {saved && <span className="ml-3 text-xs text-green-400">Saved</span>}

      {open && (
        <div className="mt-3 space-y-3">
          <TagPicker selected={tags} onChange={setTags} max={6} />
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save tags"}
          </button>
        </div>
      )}
    </div>
  );
}
