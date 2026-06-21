"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

type Me = { id: string; numericId: number; username: string } | null;

const NAV_ITEMS = [
  { href: "/home",        label: "Home",        icon: "home" },
  { href: "/search",      label: "Search",      icon: "search" },
  { href: "/for-you",     label: "For You",     icon: "sparkles", authOnly: false },
  { href: "/feed",        label: "Following",   icon: "users",   authOnly: true },
  { href: "/catalog",     label: "Catalog",     icon: "books" },
  { href: "/collections", label: "Collections", icon: "folders", authOnly: true },
  { href: "/stats",       label: "Stats",       icon: "chart-bar" },
];

const MORE_ITEMS = [
  { href: "/companies",   label: "Companies",  icon: "building" },
  { href: "/leaderboard", label: "Leaderboard",icon: "trophy" },
  { href: "/quiz",        label: "Quiz",       icon: "question-mark" },
  { href: "/roadtrips",   label: "Road Trips", icon: "map-pin" },
  { href: "/challenges",  label: "Challenges", icon: "target" },
  { href: "/polls",       label: "Polls",      icon: "chart-dots" },
  { href: "/messages",    label: "Messages",   icon: "message" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, string> = {
    home:          "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    search:        "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    users:         "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    books:         "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    folders:       "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    "chart-bar":   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    bell:          "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    user:          "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    building:      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    trophy:        "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    "question-mark":"M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "map-pin":     "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    target:        "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    "chart-dots":  "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
    message:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    upload:        "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    logout:        "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    dots:          "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
    sparkles:      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] ?? icons.dots} />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me>(null);
  const [unread, setUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await r.json();
        if (data.user) {
          setMe(data.user);
          const nr = await fetch("/api/notifications?unread=true");
          if (nr.ok) {
            const nd = await nr.json();
            setUnread((nd.notifications ?? []).length);
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  function NavLink({ href, label, icon, badge }: { href: string; label: string; icon: string; badge?: number }) {
    return (
      <Link href={href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all border ${
          isActive(href)
            ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/40"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent"
        }`}>
        <span className="shrink-0 relative">
          <Icon name={icon} size={18} />
          {badge ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </span>
        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
          {label}
        </span>
      </Link>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setMoreOpen(false); }}
        className={`fixed left-0 top-0 h-screen z-40 flex-col border-r border-zinc-800/60 bg-zinc-950 transition-[width] duration-200 hidden md:flex ${
          expanded ? "w-56" : "w-16"
        }`}
      >
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 px-3 py-4 shrink-0">
          <div className="h-9 w-9 shrink-0 rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center">
            <img src="/logo.png" alt="PlateVault" className="h-7 w-7 object-contain" />
          </div>
          <div className={`overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
            <div className="font-bold text-zinc-100 text-sm whitespace-nowrap leading-tight">PlateVault</div>
            <div className="text-[10px] text-zinc-600 whitespace-nowrap">Spot. Tag. Archive.</div>
          </div>
        </Link>

        {/* Upload CTA */}
        <div className="px-2 mb-3">
          <Link href="/upload"
            className={`flex items-center gap-3 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all ${expanded ? "" : "justify-center"}`}>
            <span className="shrink-0"><Icon name="upload" size={18} /></span>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
              Upload
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.filter((item) => !item.authOnly || me).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}

          {me && (
            <NavLink href="/notifications" label="Notifications" icon="bell" badge={unread > 0 ? unread : undefined} />
          )}

          {/* More popover */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all border ${
                moreOpen
                  ? "bg-zinc-800/60 text-zinc-200 border-zinc-700/40"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent"
              }`}
            >
              <span className="shrink-0"><Icon name="dots" size={18} /></span>
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
                More
              </span>
            </button>
            {moreOpen && (
              <div className={`absolute z-50 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-zinc-950/60 py-1 ${
                expanded ? "left-0 right-0 top-full mt-1" : "left-full ml-2 top-0 w-44"
              }`}>
                {MORE_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-indigo-950/30 hover:text-indigo-200 transition-colors">
                    <Icon name={item.icon} size={16} />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom: theme + profile */}
        <div className="px-2 pb-4 space-y-0.5 border-t border-zinc-800/60 pt-3">
          <div className={`px-3 py-1.5 ${expanded ? "flex items-center gap-2 text-xs text-zinc-600" : "flex justify-center"}`}>
            <ThemeToggle />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
              Theme
            </span>
          </div>
          {me ? (
            <>
              <Link href={`/u/${me.numericId}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all border ${
                  pathname.startsWith("/u/") ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/40" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent"
                }`}>
                <span className="shrink-0"><Icon name="user" size={18} /></span>
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
                  @{me.username}
                </span>
              </Link>
              <button onClick={logout}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-all border border-transparent">
                <span className="shrink-0"><Icon name="logout" size={18} /></span>
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
                  Log out
                </span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all border border-transparent">
                <span className="shrink-0"><Icon name="user" size={18} /></span>
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
                  Log in
                </span>
              </Link>
              <Link href="/signup"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/30 transition-all border border-transparent">
                <span className="shrink-0"><Icon name="user" size={18} /></span>
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
                  Sign up
                </span>
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur px-2 pt-2 pb-3">
        {(
          [
            { href: "/home",          icon: "home",   label: "Home" },
            { href: "/search",        icon: "search", label: "Search" },
            { href: "/upload",        icon: "upload", label: "Upload", cta: true },
            { href: "/notifications", icon: "bell",   label: "Alerts", badge: unread },
            me
              ? { href: `/u/${me.numericId}`, icon: "user", label: "Profile" }
              : { href: "/login",             icon: "user", label: "Log in" },
          ] as Array<{ href: string; icon: string; label: string; cta?: boolean; badge?: number }>
        ).map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all ${
                item.cta
                  ? "bg-indigo-600 text-white rounded-2xl px-4"
                  : active
                  ? "text-indigo-300"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}>
              <span className="relative">
                <Icon name={item.icon} size={20} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
