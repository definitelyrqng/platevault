"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeResponse =
  | { user: null }
  | { user: { id: string; username: string; email: string } };

export default function SiteHeader() {
  const [me, setMe] = useState<MeResponse>({ user: null });
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as MeResponse;
      setMe(data);
    } catch {
      setMe({ user: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ user: null });
  }

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/home" className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <span className="text-sm font-semibold">PV</span>
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">PlateVault</div>
          <div className="text-xs text-zinc-400">Spot. Tag. Archive.</div>
        </div>
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          href="/upload"
          className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
        >
          Upload
        </Link>

        {!loading && me.user ? (
          <>
            <Link
              href={`/u/${me.user.username}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
              title="View profile"
            >
              @{me.user.username}
            </Link>
            <button
              onClick={logout}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/40"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
