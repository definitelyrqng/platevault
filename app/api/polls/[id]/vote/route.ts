import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, banError } = await getSessionUserWithBanCheck();
  if (!user) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  if (banError) return NextResponse.json({ error: banError }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return NextResponse.json({ error: "Invalid poll" }, { status: 400 });

  const poll = await prisma.poll.findUnique({
    where: { numericId },
    select: { id: true, closesAt: true },
  });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  if (poll.closesAt < new Date()) return NextResponse.json({ error: "This poll is closed." }, { status: 410 });

  const { nomineeId } = await req.json();
  if (!nomineeId) return NextResponse.json({ error: "Missing nomineeId" }, { status: 400 });

  // Verify nominee belongs to this poll
  const nominee = await prisma.pollNominee.findUnique({
    where: { id: nomineeId },
    select: { pollId: true },
  });
  if (!nominee || nominee.pollId !== poll.id) {
    return NextResponse.json({ error: "Invalid nominee" }, { status: 400 });
  }

  // Check already voted
  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId: poll.id, userId: user.id } },
  });
  if (existing) return NextResponse.json({ error: "Already voted." }, { status: 409 });

  await prisma.pollVote.create({
    data: { pollId: poll.id, nomineeId, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
