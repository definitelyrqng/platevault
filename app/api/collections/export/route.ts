import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// GET /api/collections/export?id=<numericId>&format=csv|json
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format") ?? "csv";

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const collection = await (prisma as any).collection.findFirst({
    where: {
      numericId: Number(id),
      OR: [{ userId: user.id }, { isPublic: true }],
    },
    select: {
      name: true,
      items: {
        orderBy: { addedAt: "asc" },
        select: {
          addedAt: true,
          upload: {
            select: {
              numericId: true,
              plateText: true,
              country: true,
              brand: true,
              model: true,
              generation: true,
              trim: true,
              color: true,
              location: true,
              createdAt: true,
              imageUrl: true,
              user: { select: { username: true } },
              _count: { select: { likes: true } },
            },
          },
        },
      },
    },
  }) as {
    name: string;
    items: {
      addedAt: Date;
      upload: {
        numericId: number;
        plateText: string;
        country: string;
        brand: string | null;
        model: string | null;
        generation: string | null;
        trim: string | null;
        color: string | null;
        location: string | null;
        createdAt: Date;
        imageUrl: string;
        user: { username: string };
        _count: { likes: number };
      };
    }[];
  } | null;

  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = collection.items.map((item) => ({
    spot_id: item.upload.numericId,
    plate: item.upload.plateText,
    country: item.upload.country,
    brand: item.upload.brand ?? "",
    model: item.upload.model ?? "",
    generation: item.upload.generation ?? "",
    trim: item.upload.trim ?? "",
    color: item.upload.color ?? "",
    location: item.upload.location ?? "",
    spotted_by: item.upload.user.username,
    spotted_at: item.upload.createdAt.toISOString(),
    added_to_collection: item.addedAt.toISOString(),
    likes: item.upload._count.likes,
    url: `https://platevault.app/spot/${item.upload.numericId}`,
    image_url: item.upload.imageUrl,
  }));

  const safeName = collection.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  if (format === "json") {
    return new NextResponse(JSON.stringify({ collection: collection.name, spots: rows }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${safeName}.json"`,
      },
    });
  }

  // CSV
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String((row as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}.csv"`,
    },
  });
}
