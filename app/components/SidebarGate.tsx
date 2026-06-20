"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// Pages where the sidebar should not appear
const HIDE_ON = new Set([
  "/login",
  "/signup",
  "/status",
  "/forgot-password",
  "/reset-password",
]);

export default function SidebarGate() {
  const pathname = usePathname();
  if (HIDE_ON.has(pathname)) return null;
  return <Sidebar />;
}
