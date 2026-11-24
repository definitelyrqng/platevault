import type { Metadata } from "next";
import HomePage from "./home/page";

// The front page is the home page itself (no redirect), so search engines index "/" directly.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "PlateVault — License Plate Spotting & Car Spotting Archive" },
  description: "PlateVault is the free license plate spotting & car spotting archive for Europe: browse and upload number plates from Germany, Austria, Czechia, Croatia and more, tag cars and models, and build your plate collection.",
  alternates: { canonical: "/" },
};

export default HomePage;
