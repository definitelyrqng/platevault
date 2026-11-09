"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import Flag from "./Flag";
import { COUNTRY_META } from "@/app/lib/countries";

type Menu = "countries" | "more" | "user" | null;

const PRIMARY = [
  { href: "/for-you",     label: "For You" },
  { href: "/catalog",     label: "Catalog" },
  { href: "/leaderboard", label: "Leaderboard" },
];

const MORE_ITEMS = [
  { href: "/feed",        label: "Following",   icon: "users",         authOnly: true },
  { href: "/companies",   label: "Companies",   icon: "building" },
  { href: "/polls",       label: "Polls",       icon: "chart-dots" },
  { href: "/challenges",  label: "Challenges",  icon: "target" },
  { href: "/quiz",        label: "Quiz",        icon: "question-mark" },
  { href: "/roadtrips",   label: "Road Trips",  icon: "map-pin" },
  { href: "/rules",       label: "Rules",       icon: "books" },
];

const USER_ITEMS = [
  { href: "/stats",            label: "My stats",    icon: "chart-bar" },
  { href: "/collections",      label: "Collections", icon: "folders" },
  { href: "/messages",         label: "Messages",    icon: "message" },
  { href: "/roadtrips",        label: "Road trips",  icon: "map-pin" },
  { href: "/settings/profile", label: "Settings",    icon: "cog" },
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
    trophy:        "M8 21h8m-4-4v4m-5-17h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3m10-3h3a3 3 0 01-3 3",
    "question-mark":"M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "map-pin":     "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    target:        "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    "chart-dots":  "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
    message:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    upload:        "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    logout:        "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    cog:           "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    shield:        "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    chevron:       "M19 9l-7 7-7-7",
    globe:         "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    dots:          "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] ?? icons.dots} />
    </svg>
  );
}

const COUNTRY_LIST = Object.entries(COUNTRY_META)
  .map(([key, m]) => ({ key, ...m }))
  .sort((a, b) => a.name.localeCompare(b.name));

function MenuLink({ href, icon, children, onClick, tone }: {
  href: string; icon?: string; children: React.ReactNode; onClick?: () => void; tone?: "amber";
}) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        tone === "amber" ? "text-amber-400 hover:bg-amber-500/10" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }`}>
      {icon && <span className="text-zinc-500"><Icon name={icon} size={16} /></span>}
      {children}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: me, unread } = useAuth(); // resolved on the server — no flash of "Log in"
  const [open, setOpen] = useState<Menu>(null);
  const [q, setQ] = useState("");
  const headerRef = useRef<HTMLElement>(null);

  // Close menus on outside click / route change / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => { setOpen(null); }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/home";
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  const toggle = (m: Menu) => setOpen((cur) => (cur === m ? null : m));
  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);
  const countryActive = pathname.startsWith("/c/") || pathname === "/countries";

  const navBtn = (active: boolean) =>
    `inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? "text-white bg-zinc-800/70" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
    }`;

  return (
    <>
      {/* ── Top header ── */}
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/home" className="mr-2 flex shrink-0 items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-zinc-100">PlateVault</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {/* Countries mega-menu */}
            <div className="relative">
              <button onClick={() => toggle("countries")} className={navBtn(countryActive || open === "countries")}
                aria-expanded={open === "countries"}>
                Countries
                <span className={`transition-transform ${open === "countries" ? "rotate-180" : ""}`}><Icon name="chevron" size={14} /></span>
              </button>
              {open === "countries" && (
                <div className="absolute left-0 top-full mt-2 w-[min(560px,90vw)] rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl shadow-black/50">
                  <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
                    {COUNTRY_LIST.map((c) => (
                      <Link key={c.key} href={`/c/${c.key}`}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname === `/c/${c.key}` ? "bg-indigo-600/15 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        }`}>
                        <Flag iso={c.iso} size="sm" />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link href="/countries"
                    className="mt-1 flex items-center justify-between rounded-lg border-t border-zinc-800 px-3 pb-1.5 pt-2.5 text-sm font-medium text-indigo-400 hover:text-indigo-300">
                    All countries &amp; stats <span>→</span>
                  </Link>
                </div>
              )}
            </div>

            {PRIMARY.map((item) => (
              <Link key={item.href} href={item.href} className={`${navBtn(isActive(item.href))} hidden lg:inline-flex`}>{item.label}</Link>
            ))}

            {/* More */}
            <div className="relative">
              <button onClick={() => toggle("more")} className={navBtn(open === "more")} aria-expanded={open === "more"}>
                More
                <span className={`transition-transform ${open === "more" ? "rotate-180" : ""}`}><Icon name="chevron" size={14} /></span>
              </button>
              {open === "more" && (
                <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
                  {/* Primary links collapse into this menu below lg */}
                  <div className="lg:hidden">
                    {PRIMARY.map((i) => (
                      <MenuLink key={i.href} href={i.href}>{i.label}</MenuLink>
                    ))}
                    <div className="my-1 border-t border-zinc-800" />
                  </div>
                  {MORE_ITEMS.filter((i) => !i.authOnly || me).map((i) => (
                    <MenuLink key={i.href} href={i.href} icon={i.icon}>{i.label}</MenuLink>
                  ))}
                  {!me && (
                    <div className="mt-1 flex items-center justify-between border-t border-zinc-800 px-3 pb-0.5 pt-2 text-sm text-zinc-400 xl:hidden">
                      Theme <ThemeToggle />
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="flex-1" />

          {/* Plate search */}
          <form onSubmit={submitSearch} className="hidden lg:block" role="search">
            <div className="flex h-9 items-center overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900 transition-colors focus-within:border-indigo-500">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search plate or user"
                aria-label="Search plates or users"
                className="h-full w-52 bg-transparent px-3 text-sm uppercase tracking-wider text-zinc-100 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 xl:w-60"
              />
              <button type="submit" aria-label="Search"
                className="grid h-full w-9 place-items-center bg-indigo-600 text-white transition-colors hover:bg-indigo-500">
                <Icon name="search" size={16} />
              </button>
            </div>
          </form>

          {/* Search icon (below lg) */}
          <Link href="/search" aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white lg:hidden">
            <Icon name="search" size={18} />
          </Link>

          <Link href="/upload"
            className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 md:inline-flex">
            <Icon name="upload" size={16} />
            Upload
          </Link>

          {me ? (
            <>
              <Link href="/notifications" aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                <Icon name="bell" size={18} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <div className="relative hidden md:block">
                <button onClick={() => toggle("user")} aria-expanded={open === "user"} aria-label="Account menu"
                  className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold uppercase ring-1 transition ${
                    open === "user" ? "bg-indigo-600 text-white ring-indigo-400" : "bg-zinc-800 text-zinc-200 ring-zinc-700 hover:ring-zinc-500"
                  }`}>
                  {me.username.slice(0, 2)}
                </button>
                {open === "user" && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
                    <Link href={`/u/${me.numericId}`} className="mb-1 block rounded-lg px-3 py-2.5 hover:bg-zinc-800">
                      <div className="text-sm font-semibold text-white">@{me.username}</div>
                      <div className="text-xs text-zinc-500">View profile</div>
                    </Link>
                    <div className="my-1 border-t border-zinc-800" />
                    {USER_ITEMS.map((i) => (
                      <MenuLink key={i.href} href={i.href} icon={i.icon}>{i.label}</MenuLink>
                    ))}
                    {(me.role === "SUPERADMIN" || me.role === "ADMIN") && (
                      <MenuLink href="/admin" icon="shield" tone="amber">Admin panel</MenuLink>
                    )}
                    <div className="my-1 border-t border-zinc-800" />
                    <div className="flex items-center justify-between px-3 py-1.5 text-sm text-zinc-400">
                      Theme <ThemeToggle />
                    </div>
                    <button onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                      <span className="text-zinc-500"><Icon name="logout" size={16} /></span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1 whitespace-nowrap md:flex">
              <span className="hidden xl:block"><ThemeToggle /></span>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-zinc-100 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-800/70 bg-zinc-950/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
        {(
          [
            { href: "/home",      icon: "home",   label: "Home" },
            { href: "/countries", icon: "globe",  label: "Countries" },
            { href: "/upload",    icon: "upload", label: "Upload", cta: true },
            me
              ? { href: "/notifications", icon: "bell", label: "Alerts", badge: unread }
              : { href: "/leaderboard",   icon: "trophy", label: "Top" },
            me
              ? { href: `/u/${me.numericId}`, icon: "user", label: "Profile" }
              : { href: "/login",             icon: "user", label: "Log in" },
          ] as Array<{ href: string; icon: string; label: string; cta?: boolean; badge?: number }>
        ).map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                item.cta ? "bg-indigo-600 px-4 text-white" : active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}>
              <span className="relative">
                <Icon name={item.icon} size={20} />
                {item.badge ? (
                  <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white">
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
