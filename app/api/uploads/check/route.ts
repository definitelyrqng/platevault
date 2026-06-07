import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/uploads/check?plateText=XX&country=albania
// Returns the first non-deleted spot matching that plate+country, or null
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plateText = searchParams.get("plateText")?.trim().toUpperCase();
  const country   = searchParams.get("country")?.trim().toLowerCase();

  if (!plateText || !country) {
    return NextResponse.json({ exists: false });
  }

  const spot = await prisma.upload.findFirst({
    where: { plateText, country, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      numericId: true,
      plateText: true,
      createdAt: true,
      user: { select: { username: true, numericId: true } },
    },
  });

  if (!spot) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists: true,
    spot: {
      numericId: spot.numericId,
      plateText: spot.plateText,
      username:  spot.user.username,
      userNumericId: spot.user.numericId,
      createdAt: spot.createdAt.toISOString(),
    },
  });
}
