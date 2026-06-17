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
    <div className="relative z-50 bg-gradient-to-r from-indigo-950/90 via-violet-950/90 to-indigo-950/90 border-b border-indigo-700/30 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">✨</span>
          <p className="text-sm text-zinc-300 leading-tight min-w-0">
            <span className="font-semibold text-indigo-300">New on PlateVault: </span>
            <span className="hidden sm:inline">Weekly Challenges, Direct Messages, Road Trips, Collection Export &amp; Germany plates are live!</span>
            <span className="sm:hidden">Weekly Challenges, DMs, Road Trips &amp; more!</span>
            <a
              href="/challenges"
              className="ml-2 text-indigo-400 hover:text-indigo-200 underline underline-offset-2 transition-colors text-xs whitespace-nowrap"
            >
              Try now →
            </a>
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
