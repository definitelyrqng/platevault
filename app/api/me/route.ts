import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return NextResponse.json({ user: null });

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, numericId: true, username: true, role: true, avatarUrl: true } },
    },
  });
  if (!session || session.expiresAt < new Date()) return NextResponse.json({ user: null });
  return NextResponse.json({ user: session.user });
}
