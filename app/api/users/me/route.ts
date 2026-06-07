import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true } },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// PATCH /api/users/me — update bio (bio field only; avatar/banner are set by uploadthing)
export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bio } = body as { bio?: string };

    // Only allow known fields
    const data: { bio?: string | null } = {};
    if (bio !== undefined) {
      const trimmed = typeof bio === "string" ? bio.trim().slice(0, 280) : null;
      data.bio = trimmed || null;
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: { bio: true, avatarUrl: true, bannerUrl: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
