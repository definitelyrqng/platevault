import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PlateVault — Spot. Tag. Archive.",
  description: "A modern license plate archive. Spot. Tag. Archive.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
