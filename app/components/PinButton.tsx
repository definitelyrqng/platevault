"use client";

import { useState } from "react";

interface Props {
  uploadId: string;
  initialPinned: boolean;
  pinnedCount: number; // how many currently pinned
}

export default function PinButton({ uploadId, initialPinned, pinnedCount }: Props) {
  const [pinned, setPinned] = useState(initialPinned);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    if (!pinned && pinnedCount >= 3) {
      alert("You can pin up to 3 spots. Unpin one first.");
      return;
    }
    setLoading(true);
    const method = pinned ? "DELETE" : "POST";
    const res = await fetch("/api/profile/pin", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    });
    if (res.ok) setPinned(!pinned);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={pinned ? "Unpin from profile" : "Pin to profile"}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-10 text-sm font-medium transition-all disabled:opacity-40 ${
        pinned
          ? "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-950/60"
          : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-amber-300 hover:border-amber-800/40"
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {pinned ? "Pinned" : "Pin"}
    </button>
  );
}
