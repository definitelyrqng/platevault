import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendEmail, digestHtml } from "@/app/lib/email";

/**
 * POST /api/email/digest
 * Sends the weekly digest to all users.
 * Called by Vercel Cron (see vercel.json) every Monday at 08:00 UTC.
 * Protected by CRON_SECRET header.
 */
export async function POST(req: Request) {
  // Verify cron secret (set CRON_SECRET in env)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://platevault.app";
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get hot spots (most liked in the last week)
  const hotSpots = await prisma.upload.findMany({
    where: { deletedAt: null, hidden: false, createdAt: { gte: oneWeekAgo } },
    orderBy: { likes: { _count: "desc" } },
    take: 3,
    select: {
      numericId: true,
      plateText: true,
      country: true,
      imageUrl: true,
      _count: { select: { likes: true } },
    },
  });

  const hotSpotsData = hotSpots.map((s) => ({
    numericId: s.numericId,
    plateText: s.plateText,
    country: s.country,
    imageUrl: s.imageUrl,
    likes: s._count.likes,
  }));

  // Get all users with email (emailDigest opt-in — we send to all by default for now)
  const users = await prisma.user.findMany({
    where: { email: { not: "" } },
    select: {
      id: true,
      email: true,
      username: true,
      numericId: true,
      currentStreak: true,
      uploads: {
        where: { deletedAt: null, createdAt: { gte: oneWeekAgo } },
        orderBy: { likes: { _count: "desc" } },
        take: 3,
        select: {
          numericId: true,
          plateText: true,
          country: true,
          imageUrl: true,
          _count: { select: { likes: true } },
        },
      },
    },
  });

  // Get challenge completions for this week
  const now = new Date();
  const weekNum = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 / 7);
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const completions = await (prisma as any).challengeCompletion.count({
        where: { userId: user.id, challengeKey: { startsWith: weekKey } },
      }) as number;

      const weekLabel = `Week ${weekNum}, ${now.getFullYear()}`;
      const userSpots = user.uploads.map((s: { numericId: number; plateText: string; country: string; imageUrl: string; _count: { likes: number } }) => ({
        numericId: s.numericId,
        plateText: s.plateText,
        country: s.country,
        imageUrl: s.imageUrl,
        likes: s._count.likes,
      }));

      const html = digestHtml({
        username: user.username,
        weekLabel,
        topSpots: userSpots,
        hotSpots: hotSpotsData,
        streakCurrent: user.currentStreak,
        challengesDone: completions,
        challengesTotal: 3,
        unsubUrl: `${base}/settings/notifications`,
      });

      const ok = await sendEmail({
        to: user.email,
        subject: `🚗 PlateVault Weekly Digest — ${weekLabel}`,
        html,
      });

      if (ok) sent++; else failed++;
    } catch (err) {
      console.error(`[digest] Failed for user ${user.username}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: users.length });
}
