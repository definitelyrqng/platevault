"use client";

import { useEffect, useState } from "react";

type Challenge = {
  key: string;
  title: string;
  desc: string;
  goal: number;
  unit: string;
};

type ProgressItem = { key: string; current: number; goal: number };

type ChallengeData = {
  week: string;
  wStart: string;
  wEnd: string;
  challenges: Challenge[];
  progress: ProgressItem[];
  completions: string[];
} | null;

function daysLeft(wEnd: string) {
  const ms = new Date(wEnd).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / 86_400_000));
  return days;
}

export default function ChallengesPage() {
  const [data, setData] = useState<ChallengeData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-zinc-50">Weekly Challenges</h1>
          </div>
          {data?.wEnd && (
            <p className="text-sm text-zinc-400 ml-4">
              {daysLeft(data.wEnd)} day{daysLeft(data.wEnd) !== 1 ? "s" : ""} left this week ·{" "}
              <span className="text-zinc-500">{data.week}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : !data ? (
          <p className="text-zinc-500">Could not load challenges.</p>
        ) : (
          <>
            {/* Challenges grid */}
            <div className="space-y-4">
              {data.challenges.map((challenge) => {
                const prog = data.progress.find((p) => p.key === challenge.key);
                const done = data.completions.includes(challenge.key);
                const current = prog?.current ?? 0;
                const goal = prog?.goal ?? challenge.goal;
                const pct = Math.min(100, Math.round((current / goal) * 100));

                return (
                  <div
                    key={challenge.key}
                    className={`rounded-2xl border p-5 transition-all ${
                      done
                        ? "border-indigo-700/50 bg-indigo-950/20"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-xl grid place-items-center text-lg ${
                        done ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {done ? "✅" : "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold ${done ? "text-indigo-200" : "text-zinc-100"}`}>
                            {challenge.title}
                          </span>
                          {done && (
                            <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                              Completed!
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-400">{challenge.desc}</p>

                        {/* Progress bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={done ? "text-indigo-300" : "text-zinc-400"}>
                              {current} / {goal} {challenge.unit}
                            </span>
                            <span className={done ? "text-indigo-400" : "text-zinc-500"}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                done ? "bg-indigo-500" : "bg-zinc-600"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 text-center">
              <div className="text-3xl font-bold text-indigo-300">
                {data.completions.length}/{data.challenges.length}
              </div>
              <div className="text-sm text-zinc-400 mt-1">challenges completed this week</div>
              {data.completions.length === data.challenges.length && (
                <div className="mt-3 text-sm text-amber-300 font-medium">
                  🏆 Perfect week! All challenges done!
                </div>
              )}
            </div>

            {/* Sign in prompt for guests */}
            {data.completions.length === 0 && data.progress.length === 0 && (
              <p className="mt-4 text-center text-sm text-zinc-500">
                <a href="/login" className="text-indigo-400 hover:text-indigo-300 underline">Sign in</a> to track your progress.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
