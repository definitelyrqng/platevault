"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type MeResponse = { user: null | { id: string; username: string; email: string } };

export default function SiteHeader() {
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data: MeResponse = await res.json();
      setMe(data.user);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // reload on route change
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMe(null);
    router.refresh();
    router.push("/coming-soon");
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <a href="/" className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
          <span className="text-sm font-semibold">PV</span>
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">PlateVault</div>
          <div className="text-xs text-zinc-400">Spot. Tag. Archive.</div>
        </div>
      </a>

      <nav className="flex items-center gap-3">
        {loading ? (
          <span className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-400">
            Checking…
          </span>
        ) : me ? (
          <>
            <span className="hidden sm:inline rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300">
              @{me.username}
            </span>

            <a
              href="/upload"
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Upload
            </a>

            <button
              onClick={logout}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <a
              href="/login"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Sign up
            </a>
          </>
        )}
      </nav>
    </header>
  );
}
