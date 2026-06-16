import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

function getISOWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function weekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

// Hardcoded weekly challenges — rotate by week number
function getChallenges(year: number, week: number) {
  const weekKey = `${year}-W${String(week).padStart(2, "0")}`;
  // Cycle through challenge sets based on week
  const rotation = week % 4;

  const sets = [
    [
      { key: `${weekKey}-spot3`,      title: "Spot 3 Plates",       desc: "Upload 3 new plates this week.",                goal: 3,  unit: "spots" },
      { key: `${weekKey}-country2`,   title: "Two Countries",        desc: "Spot plates from at least 2 countries.",        goal: 2,  unit: "countries" },
      { key: `${weekKey}-like10`,     title: "Spread the Love",      desc: "Like 10 spots from other spotters.",            goal: 10, unit: "likes given" },
    ],
    [
      { key: `${weekKey}-spot5`,      title: "Spot 5 Plates",        desc: "Upload 5 plates this week.",                    goal: 5,  unit: "spots" },
      { key: `${weekKey}-comment3`,   title: "Join the Chat",        desc: "Leave 3 comments on spots.",                   goal: 3,  unit: "comments" },
      { key: `${weekKey}-country1`,   title: "New Discovery",        desc: "Spot a plate from a country new to you.",       goal: 1,  unit: "new country" },
    ],
    [
      { key: `${weekKey}-spot2`,      title: "Casual Spotter",       desc: "Upload 2 plates this week.",                   goal: 2,  unit: "spots" },
      { key: `${weekKey}-like5`,      title: "Liker",                desc: "Like 5 spots from the community.",             goal: 5,  unit: "likes given" },
      { key: `${weekKey}-multispot`,  title: "Double Sighting",      desc: "Spot a plate that already exists in the vault.", goal: 1, unit: "multi-spots" },
    ],
    [
      { key: `${weekKey}-spot7`,      title: "Week Warrior",         desc: "Upload a plate every day this week.",           goal: 7,  unit: "spots" },
      { key: `${weekKey}-country3`,   title: "Globe Hopper",         desc: "Spot plates from 3 different countries.",       goal: 3,  unit: "countries" },
      { key: `${weekKey}-comment5`,   title: "Community Member",     desc: "Leave 5 comments on other spotters' plates.",   goal: 5,  unit: "comments" },
    ],
  ];

  return sets[rotation];
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true, numericId: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function GET() {
  const user = await getUser();
  const now = new Date();
  const { year, week } = getISOWeek(now);
  const wStart = weekStart(now);
  const wEnd = new Date(wStart);
  wEnd.setUTCDate(wEnd.getUTCDate() + 7);

  const challenges = getChallenges(year, week);

  if (!user) {
    return NextResponse.json({ week: `${year}-W${String(week).padStart(2, "0")}`, challenges, progress: [], completions: [] });
  }

  // Fetch completions for this week
  const keys = challenges.map((c) => c.key);
  const completions = await (prisma as any).challengeCompletion.findMany({
    where: { userId: user.id, challengeKey: { in: keys } },
    select: { challengeKey: true, completedAt: true },
  }) as { challengeKey: string; completedAt: Date }[];

  // Compute actual progress for each challenge
  const [spotsThisWeek, likesGiven, commentsGiven, countriesThisWeek, multiSpotsThisWeek] = await Promise.all([
    prisma.upload.findMany({
      where: { userId: user.id, deletedAt: null, createdAt: { gte: wStart, lt: wEnd } },
      select: { country: true },
    }),
    prisma.like.count({ where: { userId: user.id, createdAt: { gte: wStart, lt: wEnd } } }),
    prisma.comment.count({ where: { userId: user.id, createdAt: { gte: wStart, lt: wEnd } } }),
    // Countries before this week (to detect "new country")
    prisma.upload.findMany({
      where: { userId: user.id, deletedAt: null, createdAt: { lt: wStart } },
      select: { country: true },
      distinct: ["country"],
    }),
    // Multi-spots this week: plates where another spot of same plateText+country already existed
    (async () => {
      const thisWeekUploads = await prisma.upload.findMany({
        where: { userId: user.id, deletedAt: null, createdAt: { gte: wStart, lt: wEnd } },
        select: { plateText: true, country: true },
      });
      let count = 0;
      for (const u of thisWeekUploads) {
        const others = await prisma.upload.count({
          where: { plateText: u.plateText, country: u.country, deletedAt: null, NOT: { userId: user.id } },
        });
        if (others > 0) count++;
      }
      return count;
    })(),
  ]);

  const spotsCount = spotsThisWeek.length;
  const countriesThisWeekSet = new Set(spotsThisWeek.map((u) => u.country));
  const countriesBeforeSet = new Set(countriesThisWeek.map((u) => u.country));
  const newCountriesCount = [...countriesThisWeekSet].filter((c) => !countriesBeforeSet.has(c)).length;
  const weekKey = `${year}-W${String(week).padStart(2, "0")}`;

  // Map challenge key suffix to progress
  const progressMap: Record<string, { current: number; goal: number }> = {
    [`${weekKey}-spot3`]:     { current: spotsCount,        goal: 3 },
    [`${weekKey}-spot5`]:     { current: spotsCount,        goal: 5 },
    [`${weekKey}-spot2`]:     { current: spotsCount,        goal: 2 },
    [`${weekKey}-spot7`]:     { current: spotsCount,        goal: 7 },
    [`${weekKey}-country2`]:  { current: countriesThisWeekSet.size, goal: 2 },
    [`${weekKey}-country3`]:  { current: countriesThisWeekSet.size, goal: 3 },
    [`${weekKey}-country1`]:  { current: newCountriesCount, goal: 1 },
    [`${weekKey}-like10`]:    { current: likesGiven,        goal: 10 },
    [`${weekKey}-like5`]:     { current: likesGiven,        goal: 5 },
    [`${weekKey}-comment3`]:  { current: commentsGiven,     goal: 3 },
    [`${weekKey}-comment5`]:  { current: commentsGiven,     goal: 5 },
    [`${weekKey}-multispot`]: { current: multiSpotsThisWeek, goal: 1 },
  };

  // Auto-complete: if progress meets goal and not yet completed, mark as done
  for (const challenge of challenges) {
    const prog = progressMap[challenge.key];
    const alreadyDone = completions.some((c) => c.challengeKey === challenge.key);
    if (prog && prog.current >= prog.goal && !alreadyDone) {
      try {
        await (prisma as any).challengeCompletion.create({
          data: { userId: user.id, challengeKey: challenge.key },
        });
        completions.push({ challengeKey: challenge.key, completedAt: new Date() });
        // Fire CHALLENGE notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "CHALLENGE",
            title: `✅ Challenge complete: ${challenge.title}`,
            message: challenge.desc,
            url: "/challenges",
          },
        });
      } catch {
        // already exists (race condition), ignore
      }
    }
  }

  return NextResponse.json({
    week: weekKey,
    wStart: wStart.toISOString(),
    wEnd: wEnd.toISOString(),
    challenges,
    progress: challenges.map((c) => ({ key: c.key, ...(progressMap[c.key] ?? { current: 0, goal: c.goal }) })),
    completions: completions.map((c) => c.challengeKey),
  });
}
