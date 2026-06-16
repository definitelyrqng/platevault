import type { Metadata } from "next";
import "./globals.css";
import HeaderGate from "./components/HeaderGate";
import ThemeProvider from "./components/ThemeProvider";
import { siteStatus, statusInfo } from "./status-config";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.platevault.app"),
  title: "PlateVault -- Spot. Tag. Archive.",
  description: "A modern license plate archive. Spot. Tag. Archive.",
  openGraph: {
    type: "website",
    url: "https://www.platevault.app",
    siteName: "PlateVault",
    title: "PlateVault -- Spot. Tag. Archive.",
    description: "A modern license plate archive. Spot. Tag. Archive.",
  },
  twitter: {
    card: "summary",
    title: "PlateVault -- Spot. Tag. Archive.",
    description: "A modern license plate archive. Spot. Tag. Archive.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const info = statusInfo[siteStatus];
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        {/* Blocking script: restores theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pv-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <HeaderGate />
            <main className="flex-1">{children}</main>
            <footer className="py-8 text-center text-xs text-zinc-600 space-y-2 border-t border-zinc-800/40">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span>&#169; {new Date().getFullYear()} PlateVault</span>
                <a href="/rules" className="hover:text-indigo-400 transition-colors">Rules</a>
                <a href="/legal" className="hover:text-indigo-400 transition-colors">Terms &amp; Privacy</a>
                <a href="/contact" className="hover:text-indigo-400 transition-colors">Contact</a>
                <a href="https://x.com/platevault" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  @platevault
                </a>
              </div>
              <div>
                <a href="/status" className={"inline-flex items-center gap-1.5 transition-colors hover:text-zinc-400 " + info.text}>
                  <span className={"h-1.5 w-1.5 rounded-full " + info.dotBg} />
                  {info.label}
                </a>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
