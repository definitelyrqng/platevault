import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { logRoadTripCreate, logRoadTripDelete } from "@/app/lib/discord";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, numericId: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// GET /api/roadtrips — list my road trips
// GET /api/roadtrips?id=<numericId> — get one road trip
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const trip = await (prisma as any).roadTrip.findFirst({
      where: { numericId: Number(id), userId: user.id },
      select: {
        id: true,
        numericId: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        uploads: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            numericId: true,
            plateText: true,
            country: true,
            imageUrl: true,
            createdAt: true,
            _count: { select: { likes: true } },
          },
        },
      },
    });
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ trip });
  }

  const trips = await (prisma as any).roadTrip.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      numericId: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      _count: { select: { uploads: true } },
    },
  });

  return NextResponse.json({ trips });
}

// POST /api/roadtrips — create a road trip
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const description = String(body.description ?? "").trim().slice(0, 500) || null;
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const trip = await (prisma as any).roadTrip.create({
    data: { userId: user.id, name, description, startDate, endDate },
    select: { id: true, numericId: true, name: true, description: true, startDate: true, endDate: true, createdAt: true },
  });

  logRoadTripCreate({ username: user.username, name: trip.name, numericId: trip.numericId });

  return NextResponse.json({ trip }, { status: 201 });
}

// PATCH /api/roadtrips — update or add/remove upload
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tripId, uploadNumericId, action, name, description, startDate, endDate } = body;

  if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });

  const trip = await (prisma as any).roadTrip.findFirst({
    where: { id: tripId, userId: user.id },
    select: { id: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "addUpload" && uploadNumericId) {
    const upload = await prisma.upload.findFirst({
      where: { numericId: Number(uploadNumericId), userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    await prisma.upload.update({ where: { id: upload.id }, data: { roadTripId: tripId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "removeUpload" && uploadNumericId) {
    const upload = await prisma.upload.findFirst({
      where: { numericId: Number(uploadNumericId), userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    await prisma.upload.update({ where: { id: upload.id }, data: { roadTripId: null } });
    return NextResponse.json({ ok: true });
  }

  // Update metadata
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = String(name).trim().slice(0, 100);
  if (description !== undefined) data.description = String(description ?? "").trim().slice(0, 500) || null;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

  const updated = await (prisma as any).roadTrip.update({
    where: { id: tripId },
    data,
    select: { id: true, numericId: true, name: true, description: true, startDate: true, endDate: true },
  });
  return NextResponse.json({ trip: updated });
}

// DELETE /api/roadtrips?id=<tripId> (cuid)
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const trip = await (prisma as any).roadTrip.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unlink all uploads first
  await prisma.upload.updateMany({ where: { roadTripId: id }, data: { roadTripId: null } });
  await (prisma as any).roadTrip.delete({ where: { id } });

  logRoadTripDelete({ username: user.username, name: trip.name });

  return NextResponse.json({ ok: true });
}
