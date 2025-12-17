"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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

      router.push("/upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 space-y-3">
          <input
            name="identifier"
            placeholder="Email or username"
            required
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
          />

          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-zinc-100 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>

        <a href="/signup" className="mt-3 block text-sm text-zinc-400 hover:text-zinc-200">
          Need an account? Create one →
        </a>
      </form>
    </main>
  );
}
