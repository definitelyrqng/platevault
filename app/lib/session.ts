import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export type SessionUser = { id: string; numericId: number; username: string; role: string };

/**
 * The logged-in user for this request, or null. Cached per request, so the
 * root layout and any page that asks only hit the database once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, numericId: true, username: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export const getUnreadCount = cache(async (userId: string) =>
  prisma.notification.count({ where: { userId, readAt: null } }),
);
