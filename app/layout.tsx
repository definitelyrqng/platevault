import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarGate from "./components/SidebarGate";
import ThemeProvider from "./components/ThemeProvider";
import AnnouncementBanner from "./components/AnnouncementBanner";
import MaintenanceBanner from "./components/MaintenanceBanner";
import NavProgress from "./components/NavProgress";
import { statusInfo } from "./status-config";
import { getMaintenanceSettings } from "@/app/lib/maintenance";
import { getSessionUser, getUnreadCount } from "@/app/lib/session";
import { AuthProvider } from "./components/AuthProvider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.platevault.app"),
  title: { default: "PlateVault", template: "%s · PlateVault" },
  description: "The internet\'s license plate archive. Spot plates from across Europe, tag them, and build your collection. Free, forever.",
  keywords: ["license plates", "number plates", "plate spotting", "car plates", "plate archive", "Europe"],
  openGraph: {
    type: "website",
    url: "https://www.platevault.app",
    siteName: "PlateVault",
    title: "PlateVault — Spot. Tag. Archive.",
    description: "The internet\'s license plate archive. Spot plates from across Europe, tag them, and build your collection.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@platevault",
    title: "PlateVault — Spot. Tag. Archive.",
    description: "The internet\'s license plate archive. Spot plates from across Europe, tag them, and build your collection.",
  },
};

const FOOTER_LINKS = [
  { href: "/countries",   label: "Countries" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/quiz",        label: "Quiz" },
  { href: "/rules",       label: "Rules" },
  { href: "/legal",       label: "Terms & Privacy" },
  { href: "/contact",     label: "Contact" },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ maintenanceMode }, me] = await Promise.all([getMaintenanceSettings(), getSessionUser()]);
  const unread = me ? await getUnreadCount(me.id) : 0;
  const info = statusInfo[maintenanceMode ? "maintenance" : "online"];
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark" className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pv-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider user={me} unread={unread}>
          <MaintenanceBanner />
          <AnnouncementBanner />
          <NavProgress />
          <SidebarGate />
          <div className="min-h-[70vh]">{children}</div>
          <footer className="mb-20 border-t border-zinc-800/60 md:mb-0">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="" className="h-5 w-5 object-contain opacity-80" />
                <span className="font-semibold text-zinc-400">PlateVault</span>
                <span className="text-zinc-600">© {new Date().getFullYear()}</span>
              </div>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {FOOTER_LINKS.map((l) => (
                  <a key={l.href} href={l.href} className="transition-colors hover:text-zinc-200">{l.label}</a>
                ))}
                <a href="https://x.com/platevault" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-200">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  @platevault
                </a>
              </nav>
              <a href="/status" className={"inline-flex items-center gap-1.5 transition-colors hover:text-zinc-300 " + info.text}>
                <span className={"h-1.5 w-1.5 rounded-full " + info.dotBg} />
                {info.label}
              </a>
            </div>
          </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
