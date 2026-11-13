#!/usr/bin/env node
/**
 * Builds the Bulgarian plate lettering from real plates (assets/bulgaria-samples/*):
 * every character is cut out of one of the plates, normalised to the same capital height and traced.
 * T and Y did not appear on any plate and are drawn with the stem width measured from the H; O is a widened 0.
 *
 *   node scripts/build-bulgaria-font.cjs
 *
 * Writes app/lib/bulgariaFont.json (outlines, used by /api/plate) and app/lib/bulgariaFontMetrics.ts (widths).
 * Units: 4× a 140-pixel capital (CAP = 560).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Potrace } = require("potrace");

const ROOT = path.join(__dirname, "..");
const CAP = 560;

const dark = (r, g, b) => r < 90 && g < 90 && b < 90;
const SOURCES = {
  "93.png":  { text: "C5096MK",  reg: [105, 20, 975, 205],  ink: dark },
  "97.png":  { text: "BA509096", reg: [105, 20, 975, 205],  ink: dark },
  "98.png":  { text: "CP59096",  reg: [105, 20, 975, 205],  ink: (r, g, b) => b > 100 && r < 80 && g < 100 },
  "94.webp": { text: "C9396HP",  reg: [300, 40, 1880, 380], ink: (r, g, b) => (r + g + b) / 3 < 80 },
  "99.webp": { text: "XX9043",   reg: [230, 70, 1600, 370], ink: (r, g, b) => r > 215 && g > 215 && b > 215 },
  "100.png": { text: "CC7711",   reg: [100, 25, 735, 175],  ink: (r, g, b) => r > 215 && g > 205 && b > 205 },
  "101.png": { text: "EA0082AA", reg: [50, 14, 480, 92],    ink: (r, g, b) => g > r + 12 && g > b + 8 && g < 150 },
  "102.png": { text: "CB2830KP", reg: [75, 20, 625, 120],   ink: (r, g, b) => r > 140 && r > g + 45 && r > b + 35 },
};
// which plate (and which position in its text) each character is taken from
const PICK = {
  "0": ["93.png", 2], "1": ["100.png", 4], "2": ["102.png", 2], "3": ["94.webp", 2], "4": ["99.webp", 4],
  "5": ["93.png", 1], "6": ["93.png", 4], "7": ["100.png", 2], "8": ["102.png", 3], "9": ["93.png", 3],
  A: ["97.png", 1], B: ["97.png", 0], C: ["93.png", 0], E: ["101.png", 0], H: ["94.webp", 5],
  K: ["93.png", 6], M: ["93.png", 5], P: ["98.png", 1], X: ["99.webp", 1],
};

async function components(name) {
  const s = SOURCES[name];
  const { data, info } = await sharp(path.join(ROOT, "assets/bulgaria-samples", name)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, [x0, y0, x1, y1] = s.reg;
  const mask = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 3; if (s.ink(data[i], data[i + 1], data[i + 2])) mask[y * W + x] = 1; }
  const lab = new Int32Array(W * H); const out = []; let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (mask[y * W + x] && !lab[y * W + x]) {
    n++; const pts = []; const st = [[x, y]]; lab[y * W + x] = n;
    while (st.length) {
      const [cx, cy] = st.pop(); pts.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
        const k = ny * W + nx; if (mask[k] && !lab[k]) { lab[k] = n; st.push([nx, ny]); }
      }
    }
    if (pts.length > 150) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      out.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), pts });
    }
  }
  const tall = Math.max(...out.map((c) => c.y1 - c.y0 + 1));
  return out.filter((c) => c.y1 - c.y0 + 1 > tall * 0.6).sort((a, b) => a.x0 - b.x0);   // drops specks and the little "1" under the plate letters
}

function trace(png) {
  return new Promise((resolve, reject) => {
    const p = new Potrace({ threshold: 128, turdSize: 80, optTolerance: 1.0, alphaMax: 1.1 });
    p.loadImage(png, (err) => { if (err) return reject(err); const m = p.getPathTag().match(/ d="([^"]+)"/); resolve(m ? m[1].trim() : ""); });
  });
}

async function glyphFrom(c) {
  const h = c.y1 - c.y0 + 1, w = c.x1 - c.x0 + 1, f = CAP / h;
  const PAD = 12;
  const W = Math.round(w * f) + 2 * PAD, H = CAP + 2 * PAD;
  // small bitmap → smooth upscale (blur + threshold) → clean outlines
  const small = Buffer.alloc(w * h, 255);
  for (const [x, y] of c.pts) small[(y - c.y0) * w + (x - c.x0)] = 0;
  // fill specks inside the glyph (dirt, insects on the photos); real counters (0, 4, 6, 8, 9, A, B, P …) are much bigger and stay
  {
    const seen = new Uint8Array(w * h);
    const flood = (sx, sy, collect) => {
      const st = [[sx, sy]]; seen[sy * w + sx] = 1; const cells = [];
      while (st.length) { const [x, y] = st.pop(); cells.push(y * w + x);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) { collect.touches = true; continue; } const k = ny * w + nx; if (!seen[k] && small[k] === 255) { seen[k] = 1; st.push([nx, ny]); } } }
      return cells;
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!seen[y * w + x] && small[y * w + x] === 255) {
      const info = { touches: false }; const cells = flood(x, y, info);
      if (!info.touches && cells.length < 0.012 * w * h) for (const k of cells) small[k] = 0;
    }
  }
  const big = await sharp(small, { raw: { width: w, height: h, channels: 1 } })
    .resize(Math.round(w * f), CAP, { kernel: "lanczos3" }).blur(Math.min(24, Math.max(2.2, f * 1.6))).threshold(128).toColourspace("b-w").extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 255, g: 255, b: 255 } }).png().toBuffer();
  const d = await trace(big);
  if (!d) throw new Error("trace failed");
  return { w: Math.round(w * f), dx: -PAD, dy: -(CAP + PAD), d };      // dy: baseline at y = 0 (caps go negative), PAD offsets already in the path
}

(async () => {
  const cache = {};
  const glyphs = {};
  for (const [ch, [file, idx]] of Object.entries(PICK)) {
    cache[file] ??= await components(file);
    const comps = cache[file];
    if (comps.length !== SOURCES[file].text.length) throw new Error(`${file}: expected ${SOURCES[file].text.length} glyphs, found ${comps.length}`);
    if (SOURCES[file].text[idx] !== ch) throw new Error(`${file}[${idx}] is ${SOURCES[file].text[idx]}, not ${ch}`);
    glyphs[ch] = await glyphFrom(comps[idx]);
  }

  // stem width from the H (width of the left stem, at 60% height)
  const H = glyphs.H;
  const hBox = cache["94.webp"][5];
  const rowY = hBox.y0 + Math.round((hBox.y1 - hBox.y0) * 0.75);
  let run = 0; for (let x = hBox.x0; x <= hBox.x1; x++) { if (hBox.pts.some((p) => p[0] === x && p[1] === rowY)) run++; else if (run) break; }
  const stem = Math.round(run * (CAP / (hBox.y1 - hBox.y0 + 1)));

  // O = a wider 0
  const z = glyphs["0"];
  glyphs.O = { ...z, w: Math.round(z.w * 1.22), d: z.d, scaleX: 1.22 };
  // T and Y (drawn): same capital height and stem weight
  const tw = Math.round(CAP * 0.74);
  const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1} Z`;
  const PADD = 12;
  { const c = PADD + tw / 2, h2 = stem / 2;                                    // one outline: the renderer fills even-odd
    glyphs.T = { w: tw, dx: -PADD, dy: -(CAP + PADD), d: `M${PADD} ${PADD} L${PADD + tw} ${PADD} L${PADD + tw} ${PADD + stem} L${c + h2} ${PADD + stem} L${c + h2} ${PADD + CAP} L${c - h2} ${PADD + CAP} L${c - h2} ${PADD + stem} L${PADD} ${PADD + stem} Z` }; }
  // Y: one outline (the renderer fills with even-odd, so no overlapping shapes)
  const yw = Math.round(CAP * 0.8), cx = PADD + yw / 2, ym = PADD + Math.round(CAP * 0.5), sw = stem * 1.25;
  const slope = (cx - stem / 2 - PADD) / (ym - PADD);                       // outer edge: x per y
  const yj = PADD + (cx - (PADD + sw)) / slope;                              // inner apex of the V
  glyphs.Y = { w: yw, dx: -PADD, dy: -(CAP + PADD), d:
    `M${PADD} ${PADD} L${PADD + sw} ${PADD} L${cx} ${yj} L${PADD + yw - sw} ${PADD} L${PADD + yw} ${PADD} L${cx + stem / 2} ${ym} L${cx + stem / 2} ${PADD + CAP} L${cx - stem / 2} ${PADD + CAP} L${cx - stem / 2} ${ym} Z` };

  fs.writeFileSync(path.join(ROOT, "app/lib/bulgariaFont.json"), JSON.stringify({ source: "assets/bulgaria-samples", capHeight: CAP, pad: 12, glyphs }));
  const widths = Object.fromEntries(Object.entries(glyphs).map(([k, g]) => [k, g.w]));
  fs.writeFileSync(path.join(ROOT, "app/lib/bulgariaFontMetrics.ts"),
`// Generated by scripts/build-bulgaria-font.cjs — do not edit by hand.
// Ink widths of the Bulgarian plate glyphs (4× a 140px capital); capHeight is the capital height.
export const BG_CAP_HEIGHT = ${CAP};
export const BG_WIDTHS: Record<string, number> = ${JSON.stringify(widths)};
`);
  console.log("glyphs", Object.keys(glyphs).join(""), "stem", stem);
})().catch((e) => { console.error(e.message); process.exit(1); });
