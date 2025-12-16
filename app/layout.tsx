import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.platevault.app"),

  title: "PlateVault — Spot. Tag. Archive.",
  description: "A modern license plate archive. Spot. Tag. Archive.",

  openGraph: {
    type: "website",
    url: "https://www.platevault.app",
    siteName: "PlateVault",
    title: "PlateVault — Spot. Tag. Archive.",
    description: "A modern license plate archive. Spot. Tag. Archive.",
  },

  twitter: {
    card: "summary",
    title: "PlateVault — Spot. Tag. Archive.",
    description: "A modern license plate archive. Spot. Tag. Archive.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>

          <footer className="py-8 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} PlateVault
          </footer>
        </div>
      </body>
    </html>
  );
}
