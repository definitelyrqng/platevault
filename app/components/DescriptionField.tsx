"use client";

import { useId } from "react";
import { parseHashtags } from "@/app/components/DescriptionInput";

/** First line of the description — kept as the spot's `location` for filters and search. */
export function locationOf(text: string) {
  return text.trim().split("\n")[0].slice(0, 120).trim();
}

/**
 * The one text field of an upload: where it was spotted, plus anything else worth saying.
 * Shown under the plate on the spot page. Required (the first line is the location).
 */
export default function DescriptionField({
  value, onChange, placeholder = "Where did you spot it? e.g. Vienna, Austria — then add anything you like", warning, maxLength = 1000,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  warning?: string;
  maxLength?: number;
}) {
  const id = useId();
  const tags = parseHashtags(value);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
        Description <span className="text-xs font-normal text-zinc-600">(required)</span>
      </label>
      <textarea id={id} value={value} rows={3} onChange={(e) => onChange(e.target.value.slice(0, maxLength))} placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500" />
      {warning
        ? <p className="text-xs text-amber-400">{warning}</p>
        : <p className="text-xs text-zinc-600">Start with the place — city or area, no street or house number. Add a note or #hashtags on the next lines if you like.</p>}
      {tags.length > 0 && <p className="text-xs text-indigo-400">{tags.join(" ")}</p>}
    </div>
  );
}
