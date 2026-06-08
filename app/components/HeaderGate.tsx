"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";

const HIDE_ON = new Set<string>(["/status", "/coming-soon"]);

export default function HeaderGate() {
  const pathname = usePathname();

  // exact match only
  if (HIDE_ON.has(pathname)) return null;

  return <SiteHeader />;
}
