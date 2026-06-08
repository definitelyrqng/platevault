"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  pollNumericId: number;
  nomineeId: string;
  userVotedNomineeId: string | null;
  pollOpen: boolean;
  isLoggedIn: boolean;
};

export default function VoteButton({
  pollNumericId,
  nomineeId,
  userVotedNomineeId,
  pollOpen,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const hasVoted = userVotedNomineeId !== null;
  const votedThis = userVotedNomineeId === nomineeId;

  if (!pollOpen) return null;

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="block w-full rounded-xl border border-zinc-700 bg-zinc-900/40 py-2 text-center text-sm text-zinc-400 hover:bg-zinc-900"
      >
        Log in to vote
      </a>
    );
  }

  if (hasVoted) {
    return (
      <div className={`rounded-xl py-2 text-center text-sm font-medium ${
        votedThis
          ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300"
          : "bg-zinc-900/20 border border-zinc-800 text-zinc-600"
      }`}>
        {votedThis ? "✓ Your vote" : ""}
      </div>
    );
  }

  async function handleVote() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/polls/${pollNumericId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomineeId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        setErr(d.error ?? "Failed to vote.");
      }
    } catch {
      setErr("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleVote}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors"
      >
        {loading ? "Voting…" : "Vote"}
      </button>
      {err && <p className="text-xs text-red-400 text-center">{err}</p>}
    </div>
  );
}
