"use client";

import { useState } from "react";

export default function SpotActions({
  uploadId,
  initialLikes,
  hasLiked: initialHasLiked,
  isOwner,
  isLoggedIn,
}: {
  uploadId: string;
  initialLikes: number;
  hasLiked: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading || isOwner || !isLoggedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: liked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      if (res.ok) {
        setLiked((v) => !v);
        setLikes((v) => (liked ? v - 1 : v + 1));
      }
    } finally {
      setLoading(false);
    }
  }

  const disabled = isOwner || !isLoggedIn || loading;
  const title = isOwner
    ? "You can't like your own spot"
    : !isLoggedIn
    ? "Sign in to like"
    : liked
    ? "Unlike"
    : "Like";

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all w-full justify-center h-10
        ${liked
          ? "bg-pink-500/10 border border-pink-500/40 text-pink-400 hover:bg-pink-500/20"
          : disabled
          ? "border border-zinc-800 bg-zinc-900/30 text-zinc-600 cursor-not-allowed"
          : "border border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:border-pink-500/40 hover:text-pink-400"
        }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {liked ? "Liked" : "Like"}
    </button>
  );
}
