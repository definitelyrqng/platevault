import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

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

// GET /api/dm — list conversations (last message per partner)
// GET /api/dm?with=<numericId> — messages with a specific user
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withId = searchParams.get("with");

  if (withId) {
    // Conversation with a specific user
    const partner = await prisma.user.findUnique({
      where: { numericId: Number(withId) },
      select: { id: true, numericId: true, username: true, avatarUrl: true },
    });
    if (!partner) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const messages = await (prisma as any).directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: partner.id },
          { senderId: partner.id, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        numericId: true,
        content: true,
        senderId: true,
        readAt: true,
        createdAt: true,
      },
    }) as { id: string; numericId: number; content: string; senderId: string; readAt: Date | null; createdAt: Date }[];

    // Mark unread messages as read
    const unreadIds = messages
      .filter((m) => m.senderId === partner.id && !m.readAt)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await (prisma as any).directMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ partner, messages });
  }

  // Inbox: one entry per conversation partner, latest message
  const allMessages = await (prisma as any).directMessage.findMany({
    where: {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      content: true,
      readAt: true,
      createdAt: true,
      sender: { select: { numericId: true, username: true, avatarUrl: true } },
      receiver: { select: { numericId: true, username: true, avatarUrl: true } },
    },
  }) as {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    readAt: Date | null;
    createdAt: Date;
    sender: { numericId: number; username: string; avatarUrl: string | null };
    receiver: { numericId: number; username: string; avatarUrl: string | null };
  }[];

  // Build conversation list (dedupe by partner)
  const seen = new Set<string>();
  const conversations = [];
  for (const msg of allMessages) {
    const isMe = msg.senderId === user.id;
    const partnerId = isMe ? msg.receiverId : msg.senderId;
    const partner = isMe ? msg.receiver : msg.sender;
    if (!seen.has(partnerId)) {
      seen.add(partnerId);
      const unread = allMessages.filter(
        (m) => m.senderId === partnerId && m.receiverId === user.id && !m.readAt
      ).length;
      conversations.push({
        partner,
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unread,
      });
    }
  }

  return NextResponse.json({ conversations });
}

// POST /api/dm — send a message
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toNumericId, content } = await req.json();
  if (!toNumericId || !content?.trim()) {
    return NextResponse.json({ error: "Missing toNumericId or content" }, { status: 400 });
  }
  const trimmed = String(content).trim().slice(0, 2000);
  if (trimmed.length < 1) return NextResponse.json({ error: "Message too short" }, { status: 400 });

  const receiver = await prisma.user.findUnique({
    where: { numericId: Number(toNumericId) },
    select: { id: true, numericId: true, username: true },
  });
  if (!receiver) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (receiver.id === user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  const message = await (prisma as any).directMessage.create({
    data: { senderId: user.id, receiverId: receiver.id, content: trimmed },
    select: { id: true, numericId: true, content: true, senderId: true, readAt: true, createdAt: true },
  }) as { id: string; numericId: number; content: string; senderId: string; readAt: Date | null; createdAt: Date };

  // DM notification
  await prisma.notification.create({
    data: {
      userId: receiver.id,
      type: "DM",
      title: `@${user.username} sent you a message`,
      message: trimmed.slice(0, 80) + (trimmed.length > 80 ? "…" : ""),
      url: `/messages?with=${user.numericId}`,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
