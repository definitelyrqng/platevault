"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type MeResponse =
  | { user: null }
  | { user: { id: string; numericId: number; username: string; email: string } };

function MoreMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const links = [
    { href: "/catalog",     label: "Catalog",     emoji: "📋" },
    { href: "/companies",   label: "Companies",   emoji: "🚌" },
    { href: "/quiz",        label: "Quiz",        emoji: "🎮" },
    { href: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
    ...(loggedIn ? [
      { href: "/feed",        label: "Feed",        emoji: "🌐" },
      { href: "/messages",    label: "Messages",    emoji: "💬" },
      { href: "/collections", label: "Collections", emoji: "🗂️" },
      { href: "/roadtrips",   label: "Road Trips",  emoji: "🗺️" },
      { href: "/challenges",  label: "Challenges",  emoji: "🎯" },
      { href: "/polls",       label: "Polls",       emoji: "🗳️" },
    ] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
          open
            ? "border-indigo-700/60 bg-indigo-950/30 text-indigo-300"
            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-indigo-800/60 hover:text-indigo-300 hover:bg-indigo-950/20"
        }`}
        aria-label="More"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-zinc-950/60 overflow-hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-950/30 hover:text-indigo-200 transition-colors"
            >
              <span className="text-base">{l.emoji}</span>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-5">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-3 shrink-0 group">
        <div className="grid h-9 w-9 place-items-center rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-zinc-800 group-hover:ring-indigo-700/60 transition-all">
          <img src="/logo.png" alt="PlateVault" className="h-7 w-7 object-contain" />
        </div>
        <div className="hidden sm:block">
          <div className="text-lg font-semibold leading-none text-zinc-100 group-hover:text-indigo-300 transition-colors">PlateVault</div>
          <div className="text-xs text-zinc-500">Spot. Tag. Archive.</div>
        </div>
      </Link>

      {/* Search bar — flex-1, no max-width cap, grows to fill available space */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 items-center">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plates..."
            autoComplete="off"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60 focus:bg-zinc-900 transition-colors"
          />
        </div>
      </form>

      {/* Nav — shrink-0, only essential items + More dropdown */}
      <nav className="flex items-center gap-2 shrink-0">
        {/* Mobile search icon */}
        <Link
          href="/search"
          className="md:hidden grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-indigo-800/60 hover:text-indigo-400 hover:bg-indigo-950/20 transition-colors"
          aria-label="Search"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </Link>

        <ThemeToggle />

        <Link
          href="/upload"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/50 whitespace-nowrap"
        >
          + Upload
        </Link>

        {loading ? (
          <>
            <div className="h-9 w-9 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="h-9 w-20 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="h-9 w-16 rounded-xl bg-zinc-900 animate-pulse" />
          </>
        ) : me.user ? (
          <>
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-indigo-800/60 hover:text-indigo-400 hover:bg-indigo-950/20 transition-colors"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white ring-1 ring-zinc-950">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <Link
              href={`/u/${me.user.numericId}`}
              className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 px-4 py-2 text-sm text-indigo-300 hover:border-indigo-700 hover:bg-indigo-950/50 transition-colors whitespace-nowrap"
            >
              @{me.user.username}
            </Link>

            <button
              onClick={logout}
              className="hidden sm:block rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Log out
            </button>

            <MoreMenu loggedIn={true} />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-indigo-800/60 bg-indigo-950/30 px-4 py-2 text-sm text-indigo-300 hover:border-indigo-600 hover:bg-indigo-950/50 transition-colors"
            >
              Sign up
            </Link>
            <MoreMenu loggedIn={false} />
          </>
        )}
      </nav>
    </header>
  );
}
