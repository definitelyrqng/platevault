import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isLastDayOfMonth(d: Date) {
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return next.getDate() === 1;
}

async function createPollsForPeriod(
  type: "MONTHLY" | "YEARLY",
  year: number,
  month: number, // 1-12 for monthly, 0 for yearly
  since: Date,
  until: Date,
  closesAt: Date,
) {
  // Find eligible countries (≥2 visible spots in the period)
  const groups = await prisma.upload.groupBy({
    by: ["country"],
    where: { deletedAt: null, hidden: false, createdAt: { gte: since, lte: until } },
    _count: { id: true },
    having: { id: { _count: { gte: 2 } } },
  });

  const created: string[] = [];

  for (const { country } of groups) {
    // Skip if poll already exists
    const existing = await prisma.poll.findUnique({
      where: { country_type_year_month: { country, type, year, month } },
    });
    if (existing) continue;

    // Top 5 by likes in the period
    const topUploads = await prisma.upload.findMany({
      where: { country, deletedAt: null, hidden: false, createdAt: { gte: since, lte: until } },
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      select: { id: true },
    });

    if (topUploads.length < 2) continue;

    await prisma.poll.create({
      data: {
        country,
        type,
        year,
        month,
        opensAt: new Date(),
        closesAt,
        nominees: { create: topUploads.map((u) => ({ uploadId: u.id })) },
      },
    });

    created.push(country);
  }

  return created;
}

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET (Vercel sets Authorization: Bearer <secret>)
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const force = req.nextUrl.searchParams.get("force") === "1" && process.env.NODE_ENV !== "production";

  if (secret && auth !== `Bearer ${secret}` && !force) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1–12

  if (!isLastDayOfMonth(now) && !force) {
    return NextResponse.json({ message: "Not the last day of the month — skipping." });
  }

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const monthlyCloses = new Date(now);
  monthlyCloses.setDate(monthlyCloses.getDate() + 7); // 7 days to vote

  const monthlyCountries = await createPollsForPeriod(
    "MONTHLY", year, month, startOfMonth, endOfMonth, monthlyCloses,
  );

  let yearlyCountries: string[] = [];
  const isDecember31 = month === 12 && now.getDate() === 31;
  if (isDecember31 || force) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const yearlyCloses = new Date(now);
    yearlyCloses.setDate(yearlyCloses.getDate() + 30); // 30 days to vote
    yearlyCountries = await createPollsForPeriod(
      "YEARLY", year, 0, startOfYear, endOfYear, yearlyCloses,
    );
  }

  const totalNew = monthlyCountries.length + yearlyCountries.length;

  if (totalNew > 0) {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const monthName = MONTH_NAMES[month];

    const messages: { monthly: string; yearly?: string } = {
      monthly: monthlyCountries.length > 0
        ? `🗳️ Plate of the Month — ${monthName} ${year} polls are open for: ${monthlyCountries.join(", ")}. You have 7 days to vote!`
        : "",
    };

    if (yearlyCountries.length > 0) {
      messages.yearly = `🏆 Plate of the Year ${year} polls are open! Vote for the best plate of the year across ${yearlyCountries.length} countr${yearlyCountries.length === 1 ? "y" : "ies"}. You have 30 days!`;
    }

    const notifRows = allUsers.flatMap((u) => {
      const rows = [];
      if (monthlyCountries.length > 0) {
        rows.push({
          userId: u.id,
          type: "POLL" as const,
          title: `🗳️ Plate of the Month — ${monthName} ${year}`,
          message: `Voting is open for ${monthlyCountries.length} countr${monthlyCountries.length === 1 ? "y" : "ies"}. Pick your favourite — polls close in 7 days.`,
          url: "/polls",
        });
      }
      if (yearlyCountries.length > 0) {
        rows.push({
          userId: u.id,
          type: "POLL" as const,
          title: `🏆 Plate of the Year ${year}`,
          message: `Vote for the best plate of ${year}! Polls close in 30 days.`,
          url: "/polls",
        });
      }
      return rows;
    });

    if (notifRows.length > 0) {
      await prisma.notification.createMany({ data: notifRows });
    }
  }

  return NextResponse.json({
    ok: true,
    monthlyPolls: monthlyCountries,
    yearlyPolls: yearlyCountries,
  });
}
