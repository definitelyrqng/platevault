"use client";

import { useId } from "react";

/** Extracts hashtags from a description string */
export function parseHashtags(text: string): string[] {
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) ?? [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

/** Renders description text with #hashtags as clickable links */
export function DescriptionText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return (
    <p className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        /^#[a-zA-Z0-9_]+$/.test(part) ? (
          <a
            key={i}
            href={`/search?q=${encodeURIComponent(part)}`}
            className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

/** Textarea with live hashtag preview and character count */
export default function DescriptionInput({
  value,
  onChange,
  placeholder = "Add a description… use #hashtags to tag your spot",
  maxLength = 1000,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  const hashtags = parseHashtags(value);
  const remaining = maxLength - value.length;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
        Description <span className="text-zinc-600 font-normal">(optional)</span>
      </label>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-700/60 focus:bg-zinc-900 resize-none transition-colors"
        />
        <span className={`absolute bottom-2.5 right-3 text-[10px] tabular-nums ${remaining < 100 ? "text-amber-500" : "text-zinc-700"}`}>
          {remaining}
        </span>
      </div>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-indigo-950/50 border border-indigo-800/40 px-2.5 py-0.5 text-[11px] text-indigo-400">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-zinc-600">
        Use <span className="text-zinc-500">#hashtags</span> to make your spot discoverable — they&apos;re searchable but won&apos;t show as official tags.
      </p>
    </div>
  );
}
