import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserWithBanCheck } from "@/app/lib/banCheck";
import { logNewUpload } from "@/app/lib/discord";
import { applyWatermark } from "@/app/lib/watermark";
import { UTApi, UTFile } from "uploadthing/server";
import { sanitizeTags } from "@/app/lib/tags";

function optStr(val: unknown, max: number): string | null {
  const s = String(val ?? "").trim();
  return s.length > 0 ? s.slice(0, max) : null;
}

export async function POST(req: Request) {
  try {
    const { user, banError } = await getSessionUserWithBanCheck();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (banError) return NextResponse.json({ error: banError }, { status: 403 });

    const body = await req.json();

    const country   = String(body.country ?? "").trim().toLowerCase();
    const plateText = String(body.plateText ?? "").trim().toUpperCase();
    const plateType = optStr(body.plateType, 60);
    const imageUrl  = String(body.imageUrl ?? "").trim();

    const location    = optStr(body.location, 120);
    const plateRegion = optStr(body.plateRegion, 10);
    const badge       = optStr(body.badge, 30);
    const tags        = sanitizeTags(body.tags);
    const brand       = optStr(body.brand, 60);
    const model       = optStr(body.model, 60);
    const generation  = optStr(body.generation, 60);
    const trim        = optStr(body.trim, 60);
    const color       = optStr(body.color, 60);
    const companyId   = typeof body.companyId === "string" && body.companyId.trim() ? body.companyId.trim() : null;

    if (!country || !plateText || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields: country, plateText, imageUrl" }, { status: 400 });
    }
    if (plateText.length < 2 || plateText.length > 32) {
      return NextResponse.json({ error: "Plate text must be 2-32 characters" }, { status: 400 });
    }
    if (!imageUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    let finalImageUrl = imageUrl;
    try {
      const watermarked = await applyWatermark(imageUrl);
      const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
      const filename = "wm_" + Date.now() + "_" + plateText.replace(/\s/g, "_") + ".jpg";
      const [uploaded] = await utapi.uploadFiles([new UTFile([new Uint8Array(watermarked)], filename, { type: "image/jpeg" })]);
      if (uploaded?.data?.ufsUrl) {
        finalImageUrl = uploaded.data.ufsUrl;
        const key = imageUrl.split("/f/")[1];
        if (key) utapi.deleteFiles([key]).catch(() => {});
      }
    } catch (wmErr) {
      console.error("[watermark] failed, using original:", wmErr);
    }

    const existingSpot = await prisma.upload.findFirst({
      where: { plateText, country, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, numericId: true, userId: true, plateText: true },
    });

    // ── Streak logic ──────────────────────────────────────────────────────────
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { numericId: true, currentStreak: true, longestStreak: true, lastUploadDate: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastDate = fullUser?.lastUploadDate ? new Date(fullUser.lastUploadDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    let newStreak = 1;
    if (lastDate) {
      if (lastDate.getTime() === today.getTime()) {
        newStreak = fullUser!.currentStreak; // already uploaded today
      } else if (lastDate.getTime() === yesterday.getTime()) {
        newStreak = (fullUser!.currentStreak) + 1; // consecutive day
      } else {
        newStreak = 1; // streak broken
      }
    }
    const newLongest = Math.max(newStreak, fullUser?.longestStreak ?? 0);
    const isNewStreakDay = !lastDate || lastDate.getTime() !== today.getTime();

    await prisma.user.update({
      where: { id: user.id },
      data: { currentStreak: newStreak, longestStreak: newLongest, lastUploadDate: new Date() },
    });

    // Notify on streak milestones (3, 7, 14, 30, 100 days)
    if (isNewStreakDay && [3, 7, 14, 30, 100].includes(newStreak)) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "STREAK",
          title: `🔥 ${newStreak}-day streak!`,
          message: `You've uploaded ${newStreak} days in a row. Keep it up!`,
          url: `/u/${fullUser?.numericId}`,
        },
      });
    }

    const upload = await prisma.upload.create({
      data: { userId: user.id, country, plateText, plateType, imageUrl: finalImageUrl, location, plateRegion, badge, brand, model, generation, trim, color, tags, companyId },
      select: { id: true, numericId: true, country: true, plateText: true, plateType: true, imageUrl: true, createdAt: true },
    });

    if (existingSpot && existingSpot.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId:  existingSpot.userId,
          type:    "MULTISPOT",
          title:   plateText + " was spotted again!",
          message: "@" + user.username + " also spotted " + plateText + " in " + country.charAt(0).toUpperCase() + country.slice(1) + ".",
          url:     "/spot/" + upload.numericId,
        },
      });
    }

    logNewUpload({
      username:  user.username,
      plateText: upload.plateText,
      country:   upload.country,
      location,
      imageUrl:  finalImageUrl,
      numericId: upload.numericId,
    });

    // Upload count for milestone check (client shows popup)
    const uploadCount = await prisma.upload.count({ where: { userId: user.id, deletedAt: null } });

    return NextResponse.json({
      upload,
      streak: { current: newStreak, longest: newLongest, isNewDay: isNewStreakDay },
      uploadCount,
    }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country")?.toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    const uploads = await prisma.upload.findMany({
      where: { deletedAt: null, ...(country ? { country } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, country: true, plateText: true, plateType: true, imageUrl: true, createdAt: true,
        brand: true, model: true, generation: true, trim: true, color: true,
        user: { select: { username: true } },
        _count: { select: { likes: true } },
      },
    });

    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("Fetch uploads error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
