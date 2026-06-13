import type { Metadata } from "next";
import "./globals.css";
import HeaderGate from "./components/HeaderGate";
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
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="min-h-screen flex flex-col">
          <HeaderGate />
          <main className="flex-1">{children}</main>
          <footer className="py-8 text-center text-xs text-zinc-600 space-y-2">
            <div className="flex items-center justify-center gap-4">
              <span>&#169; {new Date().getFullYear()} PlateVault</span>
              <a href="/rules" className="hover:text-zinc-400 transition-colors">Rules</a>
              <a href="/legal" className="hover:text-zinc-400 transition-colors">Terms &amp; Privacy</a>
              <a href="/contact" className="hover:text-zinc-400 transition-colors">Contact</a>
            </div>
            <div>
              <a href="/status" className={"inline-flex items-center gap-1.5 transition-colors hover:text-zinc-400 " + info.text}>
                <span className={"h-1.5 w-1.5 rounded-full " + info.dotBg} />
                {info.label}
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
