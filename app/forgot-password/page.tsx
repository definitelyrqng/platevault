"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      // Always show "sent" — never reveal if the email exists
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

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

          {status === "sent" ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-800/50 bg-indigo-950/50">
                  <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              <h1 className="mb-2 text-lg font-bold text-zinc-100">Check your inbox</h1>
              <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
                If <span className="font-mono text-zinc-300">{email}</span> is linked to a PlateVault account, you'll receive a reset link within a minute.
              </p>
              <p className="text-xs text-zinc-600">
                Didn't get it? Check your spam folder, or{" "}
                <button
                  onClick={() => setStatus("idle")}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700/50 bg-zinc-800/60">
                    <svg className="h-6 w-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                </div>
                <h1 className="text-lg font-bold text-zinc-100">Forgot your password?</h1>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-700/60 focus:bg-zinc-800"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400">Something went wrong — please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-950/50"
                >
                  <span className="relative z-10">
                    {status === "loading" ? "Sending…" : "Send reset link"}
                  </span>
                  {status === "idle" && (
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  )}
                </button>
              </form>
            </>
          )}

        </div>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Remember it?{" "}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Log in →
          </a>
        </p>

      </div>
    </main>
  );
}
