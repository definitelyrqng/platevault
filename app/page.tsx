import type { Metadata } from "next";
import HomePage from "./home/page";

// The front page is the home page itself (no redirect), so search engines index "/" directly.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "PlateVault — License Plate Archive & Plate Spotting Community" },
  description: "The license plate archive for Europe: browse and spot number plates from Germany, Austria, Czechia, Croatia and more, tag them by car and model, and build your collection. Free.",
  alternates: { canonical: "/" },
};

export default HomePage;
