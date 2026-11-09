"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** DD:MM:YYYY HH:MM:SS in the viewer's local time. */
export function exactTime(d: Date) {
  return `${pad(d.getDate())}:${pad(d.getMonth() + 1)}:${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Relative time ("4 months ago") that reveals the exact upload time on hover
 * (or focus / tap). The exact time is formatted in the browser so it shows the
 * viewer's own timezone; the relative label comes from the server.
 */
export default function TimeAgo({ iso, label, className = "" }: { iso: string; label: string; className?: string }) {
  const [exact, setExact] = useState<string | null>(null);
  useEffect(() => { setExact(exactTime(new Date(iso))); }, [iso]);

  return (
    <time dateTime={iso} tabIndex={0} className={`group/time relative inline-block cursor-help outline-none ${className}`}>
      <span className="underline decoration-zinc-700 decoration-dotted underline-offset-2">{label}</span>
      {exact && (
        <span role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover/time:opacity-100 group-focus/time:opacity-100">
          {exact}
        </span>
      )}
    </time>
  );
}
