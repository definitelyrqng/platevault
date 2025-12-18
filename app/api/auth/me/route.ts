import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(name + "="));
  return part ? decodeURIComponent(part.split("=").slice(1).join("=")) : null;
}

export async function GET(req: Request) {
  try {
    const token = getCookie(req, "pv_session");

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
