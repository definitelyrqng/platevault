import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import opentype from "opentype.js";
import {
  plateLayout, runStartX, CAP_TOP, CAP_BOTTOM, CONDENSE, STROKE, UMLAUT_BASE, AL_SIDE_BEARING, AL_SPACE, AT_SIDE_BEARING, AT_SPACE, type TextRun, type PlateFont,
} from "@/app/lib/plateLayout";
import albaniaFont from "@/app/lib/albaniaFont.json";
import austriaFont from "@/app/lib/austriaFont.json";

/**
 * GET /api/plate?c=<country>&t=<plate text>&h=<height px>[&p=<plateType>]
 *
 * Bakes a plate into a PNG (artwork + lettering) so it can be right-click
 * copied / saved as one image. Output is deterministic for its query, so it
 * is cached forever at the CDN — bump PLATE_IMAGE_VERSION in PlateBadge when
 * the rendering changes.
 */

export const runtime = "nodejs";

let fontPromise: Promise<opentype.Font> | null = null;
function getFont() {
  fontPromise ??= readFile(path.join(process.cwd(), "assets/fonts/FE-FONT.ttf")).then((buf) =>
    opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)),
  );
  return fontPromise;
}

const artCache = new Map<string, Promise<string>>();
function getArtDataUri(src: string) {
  let p = artCache.get(src);
  if (!p) {
    p = readFile(path.join(process.cwd(), "public", src)).then((b) => `data:image/png;base64,${b.toString("base64")}`);
    artCache.set(src, p);
  }
  return p;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** SVG for one run of text: glyph outlines, umlauts synthesised (font has none). */
function runSvg(font: opentype.Font, run: TextRun, color = "#111") {
  const { text, fontSize, centerY } = run;
  const scale = fontSize / font.unitsPerEm;
  const out = new opentype.Path();
  const dots: string[] = [];
  let x = 0;

  for (const ch of text) {
    const base = UMLAUT_BASE[ch];
    const glyph = font.charToGlyph(base ?? ch);
    const gp = glyph.getPath(x, 0, fontSize);
    if (base) {
      // squash the letter towards its foot and put two dots above it
      const foot = CAP_BOTTOM * fontSize;
      const sq = (y?: number) => (y === undefined ? y : foot + (y - foot) * 0.8);
      for (const cmd of gp.commands) {
        const c = cmd as { y?: number; y1?: number; y2?: number };
        if ("y" in c) c.y = sq(c.y);
        if ("y1" in c) c.y1 = sq(c.y1);
        if ("y2" in c) c.y2 = sq(c.y2);
      }
      const cx = x + (glyph.advanceWidth ?? 0) * scale / 2;
      const cy = (CAP_TOP + 0.055) * fontSize;
      const r = 0.066 * fontSize;
      dots.push(`<circle cx="${(cx - 0.17 * fontSize).toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}"/>`,
                `<circle cx="${(cx + 0.17 * fontSize).toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}"/>`);
    }
    out.extend(gp);
    x += (glyph.advanceWidth ?? 0) * scale;
  }

  const width = x * CONDENSE;
  const startX = runStartX(run, width);
  const baseline = centerY - ((CAP_TOP + CAP_BOTTOM) / 2) * fontSize;
  const sw = (STROKE * fontSize).toFixed(2);
  return `<g transform="translate(${startX.toFixed(2)} ${baseline.toFixed(2)}) scale(${CONDENSE} 1)" fill="${color}" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round">`
    + `<path d="${out.toPathData(2)}"/>${dots.join("")}</g>`;
}

/** SVG for one run in the traced Albanian plate lettering (see scripts/build-albania-font.cjs). */
function runSvgTraced(run: TextRun, color: string, which: "al" | "at") {
  const [source, bearing, space] = which === "at" ? [austriaFont, AT_SIDE_BEARING, AT_SPACE] : [albaniaFont, AL_SIDE_BEARING, AL_SPACE];
  const { text, fontSize, centerY } = run;
  const { capHeight, glyphs } = source as {
    capHeight: number;
    glyphs: Record<string, { w: number; dx: number; dy: number; d: string }>;
  };
  const capPx = fontSize * (CAP_BOTTOM - CAP_TOP);   // same capital height as FE plates
  const scale = capPx / capHeight;
  const paths: string[] = [];
  let x = 0;
  for (const ch of text) {
    const g = glyphs[ch];
    if (!g) { x += space; continue; }
    paths.push(`<path transform="translate(${x + bearing + g.dx} ${g.dy})" d="${g.d}"/>`);
    x += g.w + 2 * bearing;
  }
  const startX = runStartX(run, x * scale);
  const baseline = centerY + capPx / 2;
  return `<g transform="translate(${startX.toFixed(2)} ${baseline.toFixed(2)}) scale(${scale.toFixed(5)})" fill="${color}" fill-rule="evenodd">${paths.join("")}</g>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("c") ?? "").toLowerCase();
  const text = (searchParams.get("t") ?? "").slice(0, 24);
  const height = Math.round(Math.min(400, Math.max(16, Number(searchParams.get("h")) || 172)));

  if (!/^[a-z-]{2,30}$/.test(country) || !text.trim()) {
    return new Response("Bad plate request", { status: 400 });
  }

  const plateType = (searchParams.get("p") ?? "").slice(0, 60) || null;
  if (plateType && !/^[a-z0-9-]+$/i.test(plateType)) {
    return new Response("Bad plate type", { status: 400 });
  }

  const layout = plateLayout(country, text, height, plateType);
  const font = await getFont();
  const { width, height: h } = layout;

  let background = "";
  if (layout.art) {
    const uri = await getArtDataUri(layout.art.src);
    background = `<image href="${uri}" x="0" y="0" width="${width}" height="${h}" preserveAspectRatio="none"/>`;
  } else if (layout.chip) {
    const { border: b, radius } = layout.chip;
    background = `<rect x="${b / 2}" y="${b / 2}" width="${width - b}" height="${h - b}" rx="${radius}" fill="#fbfbf8" stroke="#161616" stroke-width="${b}"/>`;
  }

  // Seal(s): drawn per plate, between the text pieces, so margins stay equal on both sides
  let seals = "";
  if (layout.seals.length) {
    seals = (await Promise.all(layout.seals.map(async (k) => {
      const src = k.src ?? layout.art?.seal;
      if (!src) return "";
      const uri = await getArtDataUri(src);
      const sh = k.h ?? k.d;
      return `<image href="${uri}" x="${(k.cx - k.d / 2).toFixed(2)}" y="${(k.cy - sh / 2).toFixed(2)}" width="${k.d.toFixed(2)}" height="${sh.toFixed(2)}" preserveAspectRatio="none"/>`;
    }))).join("");
  }

  const color = layout.art?.textColor ?? "#111";
  const runs = layout.runs.map((r) => layout.font !== "fe"
    ? runSvgTraced(r, color, layout.font as Exclude<PlateFont, "fe">)
    : runSvg(font, r, color)).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">`
    + `<title>${esc(layout.printed)}</title>${background}${seals}${runs}</svg>`;

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  // ASCII-only filename (HTTP headers can't carry Ä/Ö/Ü)
  const fileName = `${layout.printed.replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE")
    .replace(/[^A-Z0-9 -]/g, "").trim().replace(/\s+/g, "-") || "plate"}.png`;

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
