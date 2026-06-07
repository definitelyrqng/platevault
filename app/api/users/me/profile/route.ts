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
            bannerUrl: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: session.user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
