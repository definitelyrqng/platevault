"use client";

import { useCallback, useEffect, useState } from "react";

// Map country string → ISO code for flags
const COUNTRY_ISO: Record<string, string> = {
  "Albania": "al",
  "Austria": "at",
  "Belgium": "be",
  "Bosnia": "ba",
  "Germany": "de",
  "Croatia": "hr",
  "Czech Republic": "cz",
  "Denmark": "dk",
  "Estonia": "ee",
  "Finland": "fi",
  "France": "fr",
  "Greece": "gr",
  "Hungary": "hu",
  "Ireland": "ie",
  "Italy": "it",
  "Latvia": "lv",
  "Lithuania": "lt",
  "Luxembourg": "lu",
  "Malta": "mt",
  "Netherlands": "nl",
  "Norway": "no",
  "Poland": "pl",
  "Portugal": "pt",
  "Romania": "ro",
  "Serbia": "rs",
  "Slovakia": "sk",
  "Slovenia": "si",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Ukraine": "ua",
  "United Kingdom": "gb",
  "United States": "us",
  "Kosovo": "xk",
  "Montenegro": "me",
  "North Macedonia": "mk",
  "Moldova": "md",
  "Belarus": "by",
  "Bulgaria": "bg",
  "Cyprus": "cy",
};

function flagUrl(country: string) {
  const iso = COUNTRY_ISO[country];
  if (!iso) return null;
  return `https://flagcdn.com/24x18/${iso}.png`;
}

type Question = {
  spotId: number;
  imageUrl: string;
  plateText: string;
  correctAnswer: string;
  choices: string[];
};

type AnswerState = "unanswered" | "correct" | "wrong";

const BATCH_SIZE = 5;

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz?count=${BATCH_SIZE}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setIdx(0);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  const current = questions[idx];

  function handleAnswer(choice: string) {
    if (answerState !== "unanswered" || !current) return;
    const correct = choice === current.correctAnswer;
    setChosen(choice);
    setAnswerState(correct ? "correct" : "wrong");
    setTotal((t) => t + 1);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const next = st + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  }

  function handleNext() {
    setAnswerState("unanswered");
    setChosen(null);
    if (idx + 1 >= questions.length) {
      // fetch next batch
      fetchBatch();
    } else {
      setIdx((i) => i + 1);
    }
  }

  function handleRestart() {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setDone(false);
    fetchBatch();
  }

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <a href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
            ← Back to PlateVault
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Plate Quiz</h1>
          <p className="mt-1 text-sm text-zinc-500">Guess which country the plate is from</p>
        </div>

        {/* Score bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Score</span>
            <span className="font-semibold text-zinc-100">{score}/{total}</span>
            {total > 0 && <span className="text-xs text-zinc-600">({pct}%)</span>}
          </div>
          <div className="flex items-center gap-3">
            {streak >= 3 && (
              <span className="rounded-full bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                🔥 {streak} streak
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              Best <span className="font-semibold text-zinc-300">×{bestStreak}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 py-24">
            <div className="text-sm text-zinc-500 animate-pulse">Loading question…</div>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <div className="text-4xl font-bold text-zinc-50">{pct}%</div>
            <div className="mt-2 text-sm text-zinc-400">{score} correct out of {total}</div>
            <div className="mt-1 text-xs text-zinc-500">Best streak: ×{bestStreak}</div>
            <button
              onClick={handleRestart}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 transition-colors"
            >
              Play again
            </button>
          </div>
        ) : current ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            {/* Plate image */}
            <div className="relative aspect-video bg-zinc-950">
              <img
                src={current.imageUrl}
                alt="Spot"
                className="w-full h-full object-cover"
              />
              {/* Blur plate text to not give away location */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950/80 to-transparent" />
            </div>

            <div className="p-5">
              <p className="mb-4 text-xs text-zinc-500 text-center">Which country is this plate from?</p>

              <div className="grid grid-cols-2 gap-2">
                {current.choices.map((choice) => {
                  const flag = flagUrl(choice);
                  let cls = "rounded-xl border px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 ";
                  if (answerState === "unanswered") {
                    cls += "border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-indigo-700/60 hover:bg-indigo-950/20 hover:text-indigo-200 cursor-pointer";
                  } else if (choice === current.correctAnswer) {
                    cls += "border-green-700/60 bg-green-950/30 text-green-300";
                  } else if (choice === chosen) {
                    cls += "border-red-700/60 bg-red-950/30 text-red-400";
                  } else {
                    cls += "border-zinc-800/40 bg-zinc-900/20 text-zinc-600 cursor-default";
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={answerState !== "unanswered"}
                      className={cls}
                    >
                      {flag && (
                        <img src={flag} alt={choice} width={24} height={18} className="rounded-sm shrink-0" />
                      )}
                      <span>{choice}</span>
                      {answerState !== "unanswered" && choice === current.correctAnswer && (
                        <span className="ml-auto text-green-400">✓</span>
                      )}
                      {answerState !== "unanswered" && choice === chosen && choice !== current.correctAnswer && (
                        <span className="ml-auto text-red-400">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {answerState !== "unanswered" && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${
                    answerState === "correct"
                      ? "bg-green-950/30 border border-green-800/40 text-green-300"
                      : "bg-red-950/30 border border-red-800/40 text-red-300"
                  }`}>
                    {answerState === "correct"
                      ? streak >= 3 ? `🔥 Correct! ×${streak} streak!` : "✓ Correct!"
                      : `✗ It was ${current.correctAnswer}`}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/spot/${current.spotId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-indigo-700/60 hover:text-indigo-300 text-center transition-colors"
                    >
                      View spot →
                    </a>
                    <button
                      onClick={handleNext}
                      className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-zinc-500 py-12">No questions available yet.</div>
        )}
      </div>
    </div>
  );
}
