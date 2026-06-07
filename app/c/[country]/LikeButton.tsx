"use client";

import { useState } from "react";

export default function LikeButton({
  uploadId,
  initialLikes,
  isOwner,
  isLoggedIn,
}: {
  uploadId: string;
  initialLikes: number;
  isOwner: boolean;
  isLoggedIn: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate to spot page
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

  const title = isOwner ? "Can't like your own spot" : !isLoggedIn ? "Sign in to like" : liked ? "Unlike" : "Like";

  return (
    <button
      onClick={toggle}
      disabled={loading || isOwner || !isLoggedIn}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all
        ${liked
          ? "text-pink-400 bg-pink-500/10"
          : isOwner || !isLoggedIn
          ? "text-zinc-700 cursor-default"
          : "text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10"
        }`}
    >
      <span className="text-base" aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{likes}</span>
    </button>
  );
}
