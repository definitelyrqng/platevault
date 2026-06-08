import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/app/lib/prisma";
import { logUploadDelete, logUploadEdit } from "@/app/lib/discord";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, role: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

function canAdmin(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// PATCH — edit car details (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const opt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : null);

  // Fetch before updating so we can diff and notify
  const before = await prisma.upload.findUnique({
    where: { id },
    select: {
      numericId: true, plateText: true,
      userId: true, brand: true, model: true, generation: true, trim: true, color: true,
      user: { select: { username: true } },
    },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newBrand      = opt(body.brand);
  const newModel      = opt(body.model);
  const newGeneration = opt(body.generation);
  const newTrim       = opt(body.trim);
  const newColor      = opt(body.color);

  const upload = await prisma.upload.update({
    where: { id },
    data: { brand: newBrand, model: newModel, generation: newGeneration, trim: newTrim, color: newColor },
    select: { id: true, brand: true, model: true, generation: true, trim: true, color: true },
  });

  // Build a human-readable diff
  const fields: Record<string, [string | null, string | null]> = {
    Brand:      [before.brand,      newBrand],
    Model:      [before.model,      newModel],
    Generation: [before.generation, newGeneration],
    Trim:       [before.trim,       newTrim],
    Color:      [before.color,      newColor],
  };
  const changedLines = Object.entries(fields)
    .filter(([, [oldVal, newVal]]) => oldVal !== newVal)
    .map(([label, [oldVal, newVal]]) => `${label}: ${oldVal ?? "—"} → ${newVal ?? "—"}`);
  const changesText = changedLines.length > 0 ? changedLines.join("\n") : "No fields changed";

  // Notify owner (skip if admin edited their own spot)
  if (before.userId !== user.id && changedLines.length > 0) {
    await prisma.notification.create({
      data: {
        userId:  before.userId,
        type:    "SYSTEM",
        title:   `Your spot ${before.plateText} was edited by a moderator`,
        message: changesText,
        url:     `/spot/${before.numericId}`,
      },
    });
  }

  logUploadEdit({
    actorUsername: user.username,
    ownerUsername: before.user.username,
    plateText:     before.plateText,
    numericId:     before.numericId,
    changes:       changesText,
  });

  return NextResponse.json({ upload });
}

// DELETE — hard delete with UT cleanup + notification (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" && body.reason.trim()
    ? body.reason.trim().slice(0, 280)
    : null;

  // Fetch upload before deleting so we have imageUrl + owner
  const upload = await prisma.upload.findUnique({
    where: { id },
    select: { userId: true, imageUrl: true, plateText: true, country: true, user: { select: { username: true } } },
  });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete image from UploadThing
  try {
    const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
    const match = upload.imageUrl.match(/\/f\/([^/?#]+)/);
    if (match) {
      await utapi.deleteFiles([match[1]]);
      console.log("[DELETE] UT file deleted:", match[1]);
    }
  } catch (e) {
    // Don't block deletion if UT cleanup fails
    console.error("[DELETE] UT delete failed:", e);
  }

  // Notify the original uploader (skip if admin is deleting their own post)
  if (upload.userId !== user.id) {
    const plate = upload.plateText.toUpperCase();
    await prisma.notification.create({
      data: {
        userId:  upload.userId,
        type:    "UPLOAD_DELETED",
        title:   `Your spot ${plate} was removed`,
        message: reason ?? "Your spot was removed by a moderator.",
      },
    });
  }

  // Hard delete — cascades to likes & comments via schema
  await prisma.upload.delete({ where: { id } });

  logUploadDelete({
    actorUsername: user.username,
    plateText:     upload.plateText,
    ownerUsername: upload.user.username,
    reason,
  });

  return NextResponse.json({ ok: true });
}
