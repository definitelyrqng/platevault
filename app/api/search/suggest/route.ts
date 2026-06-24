import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

function normalize(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Replace common umlauts/diacritics with ASCII equivalents */
function foldUmlauts(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ä/g, "A").replace(/Ö/g, "O").replace(/Ü/g, "U")
    .replace(/ß/g, "SS")
    .replace(/É|È|Ê|Ë/g, "E").replace(/À|Â/g, "A")
    .replace(/Î|Ï/g, "I").replace(/Ô/g, "O").replace(/Û/g, "U")
    .replace(/Á/g, "A").replace(/Í/g, "I").replace(/Ó/g, "O").replace(/Ú/g, "U");
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 1) return NextResponse.json({ plates: [], users: [] });

  const rawUpper = q.toUpperCase();
  const normalized = normalize(q);
  // Query with umlauts folded to ASCII (e.g. "TOL" matches stored "TÖL")
  const folded = foldUmlauts(q).replace(/[^A-Z0-9]/g, "");

  const [plateRows, userRows] = await Promise.all([
    prisma.$queryRaw<{ plateText: string; country: string; numericId: number }[]>`
      SELECT DISTINCT ON (UPPER(u."plateText")) u."plateText", u.country, u."numericId"
      FROM "Upload" u
      WHERE u."deletedAt" IS NULL AND u.hidden = false
        AND (
          UPPER(u."plateText") LIKE ${rawUpper + "%"}
          OR REGEXP_REPLACE(UPPER(u."plateText"), '[^A-Z0-9]', '', 'g') LIKE ${normalized + "%"}
          OR REGEXP_REPLACE(
               TRANSLATE(UPPER(u."plateText"), 'ÄÖÜÁÀÂÉÈÊÍÎÓÔÚÛ', 'AOUAAAEEEIIOOUU'),
               '[^A-Z0-9]', '', 'g'
             ) LIKE ${folded + "%"}
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
