import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pv_session")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const session = await prisma.session.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            numericId: true,
            username: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // bannerUrl added in a later migration — fetch separately so old deploys don't break
    let bannerUrl: string | null = null;
    try {
      const extra = await prisma.$queryRaw<{ bannerUrl: string | null }[]>`
        SELECT "bannerUrl" FROM "User" WHERE id = ${session.user.id} LIMIT 1
      `;
      bannerUrl = extra[0]?.bannerUrl ?? null;
    } catch {
      // column may not exist yet — ignore until migration runs
    }

    return NextResponse.json({ user: { ...session.user, bannerUrl } });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
