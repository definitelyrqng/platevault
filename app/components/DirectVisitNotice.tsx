"use client";
import { useEffect, useState } from "react";
import type { DirectNotice } from "@/app/lib/directNotice";

/**
 * Shown every time the site is opened directly — a typed address, a bookmark or a link with no referrer.
 * Text comes from the admin panel (Site tab). It is a small card, not a full-screen overlay, and is never
 * shown to search-engine crawlers, so it cannot hide the page from Google.
 */
export default function DirectVisitNotice({ enabled, title, text, link, linkText }: DirectNotice) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !text.trim()) return;
    if (/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent)) return;
    if (document.referrer === "") setVisible(true);   // no referrer = typed in the address bar / bookmark / app link
  }, [enabled, text]);

  if (!visible) return null;
  return (
    <div role="status" className="fixed bottom-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-amber-500/40 bg-zinc-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur md:bottom-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg leading-none text-amber-400" aria-hidden="true">⚠</span>
        <div className="min-w-0 flex-1">
          {title.trim() && <p className="text-sm font-semibold text-zinc-100">{title}</p>}
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">{text}</p>
          {link.trim() && linkText.trim() && (
            <a href={link} className="mt-2 inline-block text-[13px] font-medium text-amber-300 underline-offset-2 hover:underline">{linkText}</a>
          )}
        </div>
        <button onClick={() => setVisible(false)} aria-label="Close notice" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
