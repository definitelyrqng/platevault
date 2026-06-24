"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.get("identifier"),
          password: form.get("password"),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      window.location.href = "/home";
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-700/40 bg-indigo-900/20 px-3 py-1 text-xs text-indigo-300 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            PlateVault
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              name="identifier"
              placeholder="Email or username"
              required
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
            />

            <div className="relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 pr-16 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <a href="/forgot-password" className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-950/50"
          >
            <span className="relative z-10">{loading ? "Signing in…" : "Log in"}</span>
            {!loading && <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-500">
            No account?{" "}
            <a href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Create one →
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
