"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function validatePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const ok = Object.values(checks).every(Boolean);
  return { ok, checks };
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwState = useMemo(() => validatePassword(pw), [pw]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!pwState.ok) {
      setError("Password doesn’t meet the requirements.");
      return;
    }

    const form = new FormData(e.currentTarget);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          username: form.get("username"),
          password: form.get("password"),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Signup failed");
        return;
      }

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  const checkRow = (ok: boolean, label: string) => (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      />
      <span className={`${ok ? "text-zinc-200" : "text-zinc-500"}`}>{label}</span>
    </div>
  );

  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Username + email + password. Uploads require an account.
        </p>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 space-y-3">
          <input
            name="email"
            placeholder="Email"
            required
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
          />
          <input
            name="username"
            placeholder="Username"
            required
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
          />

          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 pr-12 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
            <div className="text-zinc-400 mb-2">Password requirements</div>
            <div className="space-y-1">
              {checkRow(pwState.checks.length, "8+ characters")}
              {checkRow(pwState.checks.upper, "1 uppercase letter")}
              {checkRow(pwState.checks.lower, "1 lowercase letter")}
              {checkRow(pwState.checks.number, "1 number")}
              {checkRow(pwState.checks.special, "1 special character")}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-zinc-100 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>

        <a href="/login" className="mt-3 block text-sm text-zinc-400 hover:text-zinc-200">
          Already have an account? Sign in →
        </a>
      </form>
    </main>
  );
}
