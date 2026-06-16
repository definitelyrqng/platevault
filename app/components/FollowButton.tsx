"use client";

import { useEffect, useState } from "react";

export default function FollowButton({ targetNumericId }: { targetNumericId: number }) {
  const [state, setState] = useState<{
    following: boolean;
    followerCount: number;
    followingCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [meRes, followRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/follow/${targetNumericId}`),
      ]);
      const me = await meRes.json();
      setLoggedIn(!!me.user);
      if (followRes.ok) {
        setState(await followRes.json());
      }
      setLoading(false);
    })();
  }, [targetNumericId]);

  if (loading || loggedIn === false) return null;

  async function toggle() {
    if (!state || busy) return;
    setBusy(true);
    const method = state.following ? "DELETE" : "POST";
    const res = await fetch(`/api/follow/${targetNumericId}`, { method });
    if (res.ok) {
      setState((s) =>
        s
          ? {
              ...s,
              following: !s.following,
              followerCount: s.following ? s.followerCount - 1 : s.followerCount + 1,
            }
          : s
      );
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      {state && (
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span><span className="font-semibold text-zinc-200">{state.followerCount}</span> followers</span>
          <span><span className="font-semibold text-zinc-200">{state.followingCount}</span> following</span>
        </div>
      )}
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          state?.following
            ? "border border-indigo-700/60 bg-indigo-950/30 text-indigo-300 hover:bg-red-950/30 hover:border-red-700/60 hover:text-red-400"
            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50"
        }`}
      >
        {state?.following ? "Following" : "+ Follow"}
      </button>
    </div>
  );
}
