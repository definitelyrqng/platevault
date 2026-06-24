"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-red-500" : score <= 3 ? "bg-yellow-500" : score <= 4 ? "bg-indigo-400" : "bg-emerald-500";

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? color : "bg-zinc-700"}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${score <= 1 ? "text-red-400" : score <= 3 ? "text-yellow-400" : score <= 4 ? "text-indigo-400" : "text-emerald-400"}`}>
        {label}
      </p>
    </div>
  );
}

function ResetForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [status,    setStatus]    = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg,  setErrorMsg]  = useState("");

  useEffect(() => {
    if (!token) setErrorMsg("Missing or invalid reset link. Please request a new one.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg("Passwords don't match."); return; }
    setStatus("loading"); setErrorMsg("");

    const res  = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }

    setStatus("done");
    setTimeout(() => router.push("/login"), 2500);
  }

  /* ── Success ── */
  if (status === "done") {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-800/50 bg-emerald-950/50">
            <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-lg font-bold text-zinc-100">Password updated!</h1>
        <p className="text-sm text-zinc-400">You're being redirected to login…</p>
      </div>
    );
  }

  /* ── Invalid token ── */
  if (!token) {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-800/50 bg-red-950/50">
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-lg font-bold text-zinc-100">Invalid link</h1>
        <p className="mb-5 text-sm text-zinc-400">This reset link is missing or malformed.</p>
        <a href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Request a new link →
        </a>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <>
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-800/50 bg-indigo-950/50">
            <span className="text-2xl">🔑</span>
          </div>
        </div>
        <h1 className="text-lg font-bold text-zinc-100">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Must be at least 8 characters with upper, lower, number &amp; symbol.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">New password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-3.5 py-2.5 pr-16 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-700/60 focus:bg-zinc-800"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>

        {/* Confirm */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Confirm password</label>
          <input
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className={`w-full rounded-xl border bg-zinc-800/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:bg-zinc-800 ${
              confirm && confirm !== password
                ? "border-red-700/60 focus:border-red-600"
                : "border-zinc-700 focus:border-indigo-700/60"
            }`}
          />
          {confirm && confirm !== password && (
            <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
          )}
        </div>

        {(status === "error" || errorMsg) && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3.5 py-2.5 text-sm text-red-400">
            {errorMsg}
            {(errorMsg.includes("expired") || errorMsg.includes("already been used")) && (
              <a href="/forgot-password" className="ml-1.5 underline hover:text-red-300 transition-colors">
                Request a new link →
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !password || !confirm || password !== confirm}
          className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-950/50"
        >
          <span className="relative z-10">
            {status === "loading" ? "Updating…" : "Set new password"}
          </span>
          {status === "idle" && (
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-zinc-100">
            Plate<span className="text-indigo-400">Vault</span>
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-zinc-950/50">
          <Suspense fallback={<div className="text-center text-sm text-zinc-500">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-600">
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to login
          </a>
        </p>

      </div>
    </main>
  );
}
