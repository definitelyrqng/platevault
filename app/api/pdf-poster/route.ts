import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getCountryMeta } from "@/app/lib/countries";

export const runtime = "nodejs";
export const maxDuration = 30;

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, username: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// GET /api/pdf-poster?user=<numericId>  (omit for own profile)
export async function GET(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetNumericId = searchParams.get("user");

  // Resolve target user
  let targetUser: { id: string; username: string } | null = null;
  if (targetNumericId) {
    const found = await prisma.user.findUnique({
      where: { numericId: Number(targetNumericId) },
      select: { id: true, username: true },
    });
    targetUser = found;
  } else {
    targetUser = sessionUser;
  }
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Fetch all spots (without images to avoid CORS in PDF)
  const spots = await prisma.upload.findMany({
    where: { userId: targetUser.id, deletedAt: null, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: {
      numericId: true,
      plateText: true,
      country: true,
      brand: true,
      model: true,
    },
  });

  if (spots.length === 0) {
    return NextResponse.json({ error: "No spots to export" }, { status: 404 });
  }

  // ── Generate PDF with @react-pdf/renderer ────────────────────────────────
  const React = await import("react");
  const { renderToBuffer, Document, Page, View, Text, StyleSheet } =
    await import("@react-pdf/renderer");

  // A4 landscape
  const PW = 841.89, PH = 595.28;
  const M = 30;
  const GAP = 6;
  const COLS = 4;
  const CARD_W = (PW - M * 2 - GAP * (COLS - 1)) / COLS;
  const CARD_H = 70;

  const s = StyleSheet.create({
    page: {
      backgroundColor: "#111113",
      paddingTop: M,
      paddingBottom: M + 20,
      paddingHorizontal: M,
      fontFamily: "Helvetica",
    },
    header: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#27272a",
      paddingBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    headerTitle: { color: "#f4f4f5", fontSize: 14, fontFamily: "Helvetica-Bold" },
    headerSub: { color: "#71717a", fontSize: 8, marginTop: 3 },
    headerCount: { color: "#52525b", fontSize: 8 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
    card: {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: "#1c1c1f",
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#27272a",
      padding: 9,
    },
    plateText: {
      color: "#f4f4f5",
      fontSize: 13,
      fontFamily: "Courier-Bold",
      letterSpacing: 1.5,
    },
    country: { color: "#71717a", fontSize: 7, marginTop: 5 },
    carLabel: { color: "#3f3f46", fontSize: 6.5, marginTop: 2 },
    footer: {
      position: "absolute",
      bottom: M,
      left: M,
      right: M,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: { color: "#27272a", fontSize: 7 },
  });

  const cards = spots.map((spot) => {
    const meta = getCountryMeta(spot.country);
    const carLabel = [spot.brand, spot.model].filter(Boolean).join(" ");
    return React.createElement(
      View,
      { key: String(spot.numericId), style: s.card },
      React.createElement(Text, { style: s.plateText }, spot.plateText),
      React.createElement(Text, { style: s.country }, meta.name),
      carLabel
        ? React.createElement(Text, { style: s.carLabel }, carLabel)
        : null
    );
  });

  const now = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const doc = React.createElement(
    Document,
    { title: `Platevault — @${targetUser.username}` },
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: s.page },
      // Header
      React.createElement(
        View,
        { style: s.header },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: s.headerTitle },
            `PLATEVAULT — @${targetUser.username}`
          ),
          React.createElement(
            Text,
            { style: s.headerSub },
            `${spots.length} spot${spots.length !== 1 ? "s" : ""} · generated ${now}`
          )
        ),
        React.createElement(
          Text,
          { style: s.headerCount },
          "platevault.com"
        )
      ),
      // Grid
      React.createElement(View, { style: s.grid }, ...cards),
      // Footer
      React.createElement(
        View,
        { style: s.footer },
        React.createElement(
          Text,
          { style: s.footerText },
          `platevault.com — @${targetUser.username}'s collection`
        ),
        React.createElement(
          Text,
          { style: s.footerText },
          now
        )
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  const safeName = targetUser.username.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="platevault-${safeName}.pdf"`,
    },
  });
}
