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
      setError("Password doesn't meet the requirements.");
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
        className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
          ok ? "bg-indigo-400" : "bg-zinc-700"
        }`}
      />
      <span className={`transition-colors ${ok ? "text-indigo-300" : "text-zinc-500"}`}>{label}</span>
    </div>
  );

  return (
    <main className="min-h-[calc(100vh-96px)] grid place-items-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-7">
          <a href="/home" className="inline-flex items-center gap-2 rounded-full border border-indigo-700/40 bg-indigo-900/20 px-3 py-1 text-xs text-indigo-300 mb-4 hover:bg-indigo-900/40 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            PlateVault
          </a>
          <h1 className="text-3xl font-black text-zinc-50">Join the vault</h1>
          <p className="text-sm text-zinc-500 mt-1.5">It's free. No plates, no entry.</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              name="email"
              placeholder="Email"
              required
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
            />
            <input
              name="username"
              placeholder="Username"
              required
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
            />

            <div className="relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 pr-16 text-sm text-zinc-100 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
              <div className="text-zinc-500 mb-2 font-medium">Password requirements</div>
              <div className="space-y-1.5">
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
            className="group relative mt-5 w-full overflow-hidden rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-950/50"
          >
            <span className="relative z-10">{loading ? "Creating…" : "Create account"}</span>
            {!loading && <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in →
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
