"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/app/lib/session";

type Auth = { user: SessionUser | null; unread: number };
const AuthContext = createContext<Auth>({ user: null, unread: 0 });

/**
 * Who is logged in, resolved on the server in the root layout and handed down.
 * Components read it with useAuth() instead of asking /api/auth/me after the
 * page has loaded — so buttons and the header are right on the very first paint.
 * (Login / logout do a full page load, which refreshes this.)
 */
export function AuthProvider({ user, unread, children }: Auth & { children: React.ReactNode }) {
  return <AuthContext.Provider value={{ user, unread }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
