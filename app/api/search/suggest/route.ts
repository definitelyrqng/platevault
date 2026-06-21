import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

function normalize(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 1) return NextResponse.json({ plates: [], users: [] });

  const rawUpper = q.toUpperCase();
  const normalized = normalize(q);

  const [plateRows, userRows] = await Promise.all([
    prisma.$queryRaw<{ plateText: string; country: string; numericId: number }[]>`
      SELECT DISTINCT ON (UPPER(u."plateText")) u."plateText", u.country, u."numericId"
      FROM "Upload" u
      WHERE u."deletedAt" IS NULL AND u.hidden = false
        AND (
          UPPER(u."plateText") LIKE ${rawUpper + "%"}
          OR REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') LIKE ${normalized + "%"}
        )
      ORDER BY UPPER(u."plateText"), u."createdAt" DESC
      LIMIT 6
    `,
    prisma.user.findMany({
      where: { username: { startsWith: q, mode: "insensitive" } },
      select: { numericId: true, username: true, avatarUrl: true },
      take: 4,
      orderBy: { username: "asc" },
    }),
  ]);

  return NextResponse.json({ plates: plateRows, users: userRows });
}
