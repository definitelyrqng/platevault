import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.platevault.app"),
  title: {
    default: "PlateVault",
    template: "%s · PlateVault",
  },
  description: "Spot, tag and archive license plates — a clean, modern alternative to PlatesMania.",
  openGraph: {
    type: "website",
    siteName: "PlateVault",
    title: "PlateVault",
    description: "Spot, tag and archive license plates — clean, modern, minimal.",
    url: "https://www.platevault.app",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "PlateVault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlateVault",
    description: "Spot, tag and archive license plates — clean, modern, minimal.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};
