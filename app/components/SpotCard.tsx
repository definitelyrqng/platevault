import type { ReactNode } from "react";
import PlateBadge from "./PlateBadge";
import Flag from "./Flag";
import { getCountryMeta } from "@/app/lib/countries";

export type SpotCardData = {
  numericId: number;
  plateText: string;
  country: string;
  imageUrl: string;
  brand?: string | null;
  model?: string | null;
  createdAt?: Date | string;
  user?: { username: string; avatarUrl?: string | null } | null;
  _count?: { likes?: number; comments?: number };
};

export function timeAgo(d: Date | string) {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Photo-first spot card: photo, real rendered plate, vehicle, spotter.
 * `badge` sits on the photo (top-left); `action` replaces the like count
 * (e.g. an interactive LikeButton).
 */
export default function SpotCard({
  spot,
  badge,
  action,
  showFlag = true,
}: {
  spot: SpotCardData;
  badge?: ReactNode;
  action?: ReactNode;
  showFlag?: boolean;
}) {
  const meta = getCountryMeta(spot.country);
  const car = [spot.brand, spot.model].filter(Boolean).join(" ");
  const likes = spot._count?.likes ?? 0;
  const comments = spot._count?.comments ?? 0;

  return (
    <a href={`/spot/${spot.numericId}`} className="group block min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800/80 transition group-hover:ring-indigo-500/60">
        <img
          src={spot.imageUrl}
          alt={`${spot.plateText} — ${car || meta.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
        {showFlag && meta.iso && (
          <div className="absolute right-2 top-2 rounded-[3px] shadow-md ring-1 ring-black/30 leading-none">
            <Flag iso={meta.iso} size="sm" />
          </div>
        )}
      </div>

      {/* Plate — centred under the photo */}
      <div className="mt-3 flex justify-center">
        <PlateBadge country={spot.country} text={spot.plateText} size="sm" />
      </div>

      <div className="mt-2 truncate text-center text-sm font-medium text-zinc-200 group-hover:text-white">
        {car || <span className="text-zinc-500">Unknown vehicle</span>}
      </div>
      <div className="mt-0.5 flex items-center justify-center gap-2 text-xs text-zinc-500">
        {(spot.user || spot.createdAt) && (
          <span className="truncate">
            {spot.user && <>@{spot.user.username}</>}
            {spot.user && spot.createdAt && " · "}
            {spot.createdAt && timeAgo(spot.createdAt)}
          </span>
        )}
        {action ?? (
          (likes > 0 || comments > 0) && (
            <span className="flex shrink-0 items-center gap-2 tabular-nums">
              {likes > 0 && <span>♥ {likes}</span>}
              {comments > 0 && <span>💬 {comments}</span>}
            </span>
          )
        )}
      </div>
    </a>
  );
}

/** Small pill used on top of spot photos. */
export function PhotoPill({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "hot" | "rare" | "accent" }) {
  const tones = {
    dark: "bg-black/65 text-white",
    hot: "bg-rose-600 text-white",
    rare: "bg-amber-400 text-black",
    accent: "bg-indigo-600 text-white",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow backdrop-blur ${tones[tone]}`}>
      {children}
    </span>
  );
}
