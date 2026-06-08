import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const now = new Date();

  const polls = await prisma.poll.findMany({
    orderBy: [{ closesAt: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: {
      numericId: true,
      country: true,
      type: true,
      year: true,
      month: true,
      opensAt: true,
      closesAt: true,
      _count: { select: { nominees: true, votes: true } },
    },
  });

  return NextResponse.json({ polls, now: now.toISOString() });
}
