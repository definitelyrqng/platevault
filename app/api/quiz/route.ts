import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/quiz?count=1
// Returns `count` random spots, each with 4 country choices (1 correct + 3 distractors)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(Number(searchParams.get("count") ?? "1"), 5);

  // Grab all distinct countries to use as distractors
  const allCountries = await prisma.upload.groupBy({
    by: ["country"],
    where: { deletedAt: null, hidden: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  if (allCountries.length < 4) {
    return NextResponse.json({ error: "Not enough data" }, { status: 503 });
  }

  const countryList = allCountries.map((c) => c.country);

  // Pick `count` random spots
  const totalSpots = await prisma.upload.count({ where: { deletedAt: null, hidden: false } });
  const questions = [];

  for (let i = 0; i < count; i++) {
    const skip = Math.floor(Math.random() * totalSpots);
    const [spot] = await prisma.upload.findMany({
      where: { deletedAt: null, hidden: false },
      skip,
      take: 1,
      select: {
        numericId: true,
        imageUrl: true,
        plateText: true,
        country: true,
      },
    });

    if (!spot) continue;

    // Build 4 choices: correct + 3 random distractors
    const distractors = countryList
      .filter((c) => c !== spot.country)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const choices = [spot.country, ...distractors].sort(() => Math.random() - 0.5);

    questions.push({
      spotId: spot.numericId,
      imageUrl: spot.imageUrl,
      plateText: spot.plateText,
      correctAnswer: spot.country,
      choices,
    });
  }

  return NextResponse.json({ questions });
}
