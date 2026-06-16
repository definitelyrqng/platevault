"use client";

import { useEffect, useState } from "react";

export default function RareButton({ spotNumericId }: { spotNumericId: number }) {
  const [state, setState] = useState<{ count: number; voted: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [meRes, rareRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/rare/${spotNumericId}`),
      ]);
      const me = await meRes.json();
      setLoggedIn(!!me.user);
      if (rareRes.ok) setState(await rareRes.json());
    })();
  }, [spotNumericId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const method = state?.voted ? "DELETE" : "POST";
    const res = await fetch(`/api/rare/${spotNumericId}`, { method });
    if (res.ok) {
      const data = await res.json();
      setState({ count: data.count, voted: data.voted });
    }
    setBusy(false);
  }

  if (state === null) return null;

  return (
    <button
      onClick={loggedIn ? toggle : undefined}
      disabled={busy}
      title={loggedIn ? (state.voted ? "Remove rare vote" : "Mark as rare") : "Sign in to vote"}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-10 text-sm font-medium transition-all disabled:opacity-50 ${
        state.voted
          ? "border-amber-700/60 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50"
          : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-amber-700/40 hover:bg-amber-950/10 hover:text-amber-300"
      } ${!loggedIn ? "cursor-default" : "cursor-pointer"}`}
    >
      <span>✨</span>
      <span>{state.voted ? "Rare!" : "Rare"}</span>
      {state.count > 0 && (
        <span className={`text-xs tabular-nums ${state.voted ? "text-amber-400" : "text-zinc-500"}`}>
          {state.count}
        </span>
      )}
    </button>
  );
}
