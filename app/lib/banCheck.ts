import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  username: string;
  role: string;
};

/**
 * Returns the session user, or null if not logged in.
 * Also returns a banError string if the user is currently banned.
 */
export async function getSessionUserWithBanCheck(): Promise<
  { user: SessionUser; banError: null } | { user: null; banError: null } | { user: SessionUser; banError: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return { user: null, banError: null };

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          bannedAt: true,
          banExpiresAt: true,
          banReason: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return { user: null, banError: null };

  const u = session.user;
  const isBanned = !!u.bannedAt && (!u.banExpiresAt || u.banExpiresAt > new Date());

  if (isBanned) {
    const until = u.banExpiresAt
      ? ` until ${u.banExpiresAt.toLocaleDateString("en-GB")}`
      : " permanently";
    const banError = `Your account is restricted${until}.${u.banReason ? ` Reason: ${u.banReason}` : ""}`;
    return { user: { id: u.id, username: u.username, role: u.role }, banError };
  }

  return { user: { id: u.id, username: u.username, role: u.role }, banError: null };
}
