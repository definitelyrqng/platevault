"use client";

import { ALL_TAGS, TAG_GROUPS } from "@/app/lib/tags";

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export default function TagPicker({ selected, onChange, max = 6 }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((t) => t !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-3">
      {TAG_GROUPS.map((group) => {
        const tags = ALL_TAGS.filter((t) => t.group === group);
        return (
          <div key={group}>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">{group}</div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selected.includes(tag.id);
                const disabled = !active && selected.length >= max;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    disabled={disabled}
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                      active
                        ? "bg-blue-600 border-blue-500 text-white"
                        : disabled
                        ? "bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected.length > 0 && (
        <p className="text-xs text-zinc-500">{selected.length}/{max} selected</p>
      )}
    </div>
  );
}
