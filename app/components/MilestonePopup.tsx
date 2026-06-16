"use client";

import { useEffect, useState } from "react";

const UPLOAD_MILESTONES = [1, 10, 50, 100, 500, 1000];
const STREAK_MILESTONES = [3, 7, 14, 30, 100];

type MilestoneData = {
  uploadCount: number;
  streak: { current: number; isNewDay: boolean };
};

export default function MilestonePopup({ data, onDone }: { data: MilestoneData | null; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (data) setVisible(true);
  }, [data]);

  if (!data || !visible) return null;

  const isUploadMilestone = UPLOAD_MILESTONES.includes(data.uploadCount);
  const isStreakMilestone = data.streak.isNewDay && STREAK_MILESTONES.includes(data.streak.current);

  if (!isUploadMilestone && !isStreakMilestone) return null;

  function close() {
    setVisible(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-zinc-950/80 overflow-hidden">
        {/* Top gradient */}
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-amber-500" />

        <div className="p-8 text-center space-y-4">
          {/* Main milestone */}
          {isUploadMilestone && (
            <>
              <div className="text-5xl">
                {data.uploadCount === 1 ? "🎉" :
                 data.uploadCount === 10 ? "🔟" :
                 data.uploadCount === 50 ? "⭐" :
                 data.uploadCount === 100 ? "💯" :
                 data.uploadCount === 500 ? "🏆" :
                 "🌟"}
              </div>
              <div>
                <div className="text-xl font-bold text-zinc-50">
                  {data.uploadCount === 1 ? "First Spot!" :
                   `Spot #${data.uploadCount.toLocaleString()}!`}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  {data.uploadCount === 1 ? "Welcome to PlateVault — you're officially a spotter! 🚗" :
                   data.uploadCount === 10 ? "10 spots in the vault. You're on a roll!" :
                   data.uploadCount === 50 ? "50 spots! The community thanks you." :
                   data.uploadCount === 100 ? "100 spots! That's the Century badge unlocked." :
                   data.uploadCount === 500 ? "500 spots! Half Thousand — legendary." :
                   `${data.uploadCount.toLocaleString()} spots and counting. Incredible!`}
                </div>
              </div>
            </>
          )}

          {/* Streak bonus */}
          {isStreakMilestone && (
            <div className={`rounded-2xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 ${isUploadMilestone ? "mt-2" : ""}`}>
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-sm font-semibold text-amber-300">
                {data.streak.current}-Day Streak!
              </div>
              <div className="text-xs text-amber-400/70 mt-0.5">
                {data.streak.current === 3 ? "3 days in a row — you're getting into the habit!" :
                 data.streak.current === 7 ? "A full week of spotting. Amazing dedication!" :
                 data.streak.current === 14 ? "Two weeks straight. You're unstoppable!" :
                 data.streak.current === 30 ? "30-day streak! A whole month of daily spots!" :
                 "100 days in a row. Absolute legend."}
              </div>
            </div>
          )}

          <button
            onClick={close}
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Keep Spotting 🚘
          </button>
        </div>
      </div>
    </div>
  );
}
