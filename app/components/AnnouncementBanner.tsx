"use client";
import { useState, useEffect } from "react";
import type { Announcement } from "@/app/lib/announcement";

/**
 * The "What's new" bar. Settings come from the admin panel (Site tab).
 * A visitor sees it until they dismiss it, or — when a duration is set — for that many days
 * after the first time they saw it (remembered in this browser only; no cookie is set).
 */
export default function AnnouncementBanner({ enabled, label, text, link, linkText, days, version }: Announcement) {
  const [visible, setVisible] = useState(false);
  const dismissedKey = `pv-banner-v${version}`;
  const firstKey = `pv-banner-first-v${version}`;

  useEffect(() => {
    if (!enabled) { setVisible(false); return; }
    try {
      if (localStorage.getItem(dismissedKey)) return;
      if (days > 0) {
        const first = Number(localStorage.getItem(firstKey)) || Date.now();
        localStorage.setItem(firstKey, String(first));
        if (Date.now() - first > days * 86_400_000) return;
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [enabled, days, dismissedKey, firstKey]);

  function dismiss() {
    try { localStorage.setItem(dismissedKey, "1"); } catch {}
    setVisible(false);
  }

  if (!enabled || !visible || !text.trim()) return null;

  return (
    <div className="relative z-50 border-b border-zinc-800/80 bg-zinc-900">
      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-12 py-2 sm:px-14">
        <p className="min-w-0 text-center text-[13px] leading-snug text-zinc-400">
          {label.trim() && (
            <span className="mr-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{label}</span>
          )}
          <span>{text}</span>
          {link.trim() && linkText.trim() && (
            <a href={link} className="ml-2 font-medium text-zinc-200 underline-offset-2 hover:text-white hover:underline">
              {linkText}
            </a>
          )}
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:right-5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
