"use client";
import { useState, useEffect } from "react";

// Bump the version string to show the banner again after dismiss
const BANNER_KEY = "pv-banner-v3";

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(BANNER_KEY)) setVisible(true);
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(BANNER_KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative z-50 border-b border-zinc-800/80 bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <p className="min-w-0 truncate text-[13px] text-zinc-400">
          <span className="mr-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
          <span className="hidden sm:inline">Weekly challenges, direct messages, road trips, collection export &amp; Germany plates are live.</span>
          <span className="sm:hidden">Challenges, DMs, road trips &amp; more.</span>
          <a href="/challenges" className="ml-2 font-medium text-zinc-200 underline-offset-2 hover:text-white hover:underline">
            Try now →
          </a>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
