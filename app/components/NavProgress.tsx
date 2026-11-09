"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Makes navigation feel instant, site-wide:
 *  - turns clicks on ordinary internal <a href="/…"> links into client-side
 *    navigation (no full page reload — header, fonts and scripts stay put);
 *  - prefetches a page when its link is hovered / touched, so the click lands
 *    on an already-loaded (or at least skeleton-ready) page;
 *  - shows a thin progress bar while the next page is loading.
 *
 * Opt a link out with data-no-client-nav. next/link links already handle
 * themselves (they preventDefault first) and are left alone.
 */
export default function NavProgress() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bar, setBar] = useState<"idle" | "run" | "done">("idle");
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    if (pending) { setBar("run"); return; }
    if (bar === "run") {
      setBar("done");
      const t = setTimeout(() => setBar("idle"), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    /** The internal URL an anchor points to, or null if it should be left to the browser. */
    function internalTarget(a: HTMLAnchorElement | null) {
      if (!a || a.hasAttribute("download") || a.hasAttribute("data-no-client-nav")) return null;
      if (a.target && a.target !== "_self") return null;
      let url: URL;
      try { url = new URL(a.href, location.href); } catch { return null; }
      if (url.origin !== location.origin) return null;
      if (url.pathname.startsWith("/api/")) return null;
      return url;
    }
    const anchorOf = (e: Event) => (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = internalTarget(anchorOf(e));
      if (!url) return;
      // Same page, only a #hash → let the browser scroll
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      e.preventDefault();
      startTransition(() => router.push(url.pathname + url.search + url.hash));
    }

    function warm(e: Event) {
      const url = internalTarget(anchorOf(e));
      if (!url) return;
      const path = url.pathname + url.search;
      if (path === location.pathname + location.search || prefetched.current.has(path)) return;
      prefetched.current.add(path);
      router.prefetch(path);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", warm, { passive: true });
    document.addEventListener("touchstart", warm, { passive: true });
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", warm);
      document.removeEventListener("touchstart", warm);
    };
  }, [router]);

  if (bar === "idle") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5">
      <div
        className={`h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)] ${bar === "run" ? "nav-progress-run" : "nav-progress-done"}`}
      />
    </div>
  );
}
