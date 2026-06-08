"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MeResponse =
  | { user: null }
  | { user: { id: string; numericId: number; username: string; email: string } };

export default function SiteHeader() {
  const [me, setMe] = useState<MeResponse>({ user: null });
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await r.json()) as MeResponse;
        setMe(data);

        if (data.user) {
          const nr = await fetch("/api/notifications?unread=true");
          if (nr.ok) {
            const nd = await nr.json();
            setUnread((nd.notifications ?? []).length);
          }
        }
      } catch {
        setMe({ user: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-6">
      <Link href="/home" className="flex items-center gap-3 shrink-0">
        <div className="grid h-9 w-9 place-items-center rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-zinc-800">
          <img src="/logo.png" alt="PlateVault" className="h-7 w-7 object-contain" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">PlateVault</div>
          <div className="text-xs text-zinc-400">Spot. Tag. Archive.</div>
        </div>
      </Link>

      {/* Search bar — hidden on small screens */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plates…"
            autoComplete="off"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </form>

      <nav className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Mobile search icon */}
        <Link
          href="/search"
          className="md:hidden grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900"
          aria-label="Search"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </Link>

        <Link
          href="/upload"
          className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
        >
          Upload
        </Link>

        {loading ? (
          <>
            <div className="h-9 w-8 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="h-9 w-20 rounded-xl bg-zinc-900 animate-pulse" />
          </>
        ) : me.user ? (
          <>
            {/* Bell */}
            <Link
              href="/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <Link
              href={`/u/${me.user.numericId}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              @{me.user.username}
            </Link>
            <button
              onClick={logout}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
