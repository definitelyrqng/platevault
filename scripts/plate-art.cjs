#!/usr/bin/env node
/**
 * Plate artwork helper — prepares user-supplied plate backgrounds so every
 * plate of a country matches (same black rounded border, same seal).
 *
 *   node scripts/plate-art.cjs measure <png> [--rows y1,y2] [--cols x1,x2]
 *       Prints colour runs along the given rows/columns, to find the bands,
 *       the writable area and the existing border.
 *
 *   node scripts/plate-art.cjs frame <src.png> <out.png> --inner x0,y0,x1,y1
 *        --band <eagleBandWidthPx> [--seal cx,cy] [--inner-radius r]
 *       Cuts the plate's inner area (inside any existing border), optionally
 *       adds the Albanian seal (cut from the car artwork) centred at cx,cy
 *       (coordinates inside the inner area), and puts it on a black rounded
 *       border scaled from the car plate (border 8px / radius 16px for an
 *       87px eagle band). Prints the final size and the content offset.
 */
const sharp = require("sharp");
const path = require("path");

const CAR = path.join(__dirname, "..", "public/plates/albania/cars_current_single.png");
// Reference: the car plate (1000×221)
const REF = { band: 87, border: 8, radius: 16, sealBox: { left: 365, top: 87, size: 37 } };

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
const nums = (s) => (s ? s.split(",").map(Number) : []);

async function measure(file) {
  const { data, info } = await sharp(file).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const c = 4;
  const P = (x, y) => { const i = (y * w + x) * c; return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }; };
  const cls = (x, y) => {
    const p = P(x, y);
    if (p.a < 100) return "clear";
    if (p.r < 50 && p.g < 50 && p.b < 50) return "black";
    if (p.r > 200 && p.g > 200 && p.b > 200) return "white";
    if (p.b > 150 && p.r < 60 && p.g < 120) return "blue";
    if (p.g > 150 && p.b > 150 && p.r < 60) return "teal";
    if (p.r > 180 && p.g < 80 && p.b < 80) return "red";
    return "other";
  };
  const runs = (get, n) => {
    const out = []; let cur = null, st = 0;
    for (let k = 0; k < n; k++) { const t = get(k); if (t !== cur) { if (cur) out.push([cur, st, k - 1]); cur = t; st = k; } }
    out.push([cur, st, n - 1]);
    return out.filter(([, a, b]) => b - a >= 2).map(([t, a, b]) => `${t}:${a}-${b}`).join("  ");
  };
  console.log(`${path.basename(file)} ${w}x${h}`);
  for (const y of nums(arg("rows"))) console.log(`  row y=${y}: ${runs((x) => cls(x, y), w)}`);
  for (const x of nums(arg("cols"))) console.log(`  col x=${x}: ${runs((y) => cls(x, y), h)}`);
}

async function frame(src, out) {
  const [x0, y0, x1, y1] = nums(arg("inner"));
  const band = Number(arg("band"));
  if ([x0, y0, x1, y1, band].some((n) => !Number.isFinite(n))) throw new Error("need --inner x0,y0,x1,y1 and --band N");
  const k = band / REF.band;                         // scale relative to the car plate
  const b = Math.round(REF.border * k), r = Math.round(REF.radius * k);
  const innerR = Number(arg("inner-radius") ?? Math.round(r * 0.55));
  const W0 = x1 - x0 + 1, H0 = y1 - y0 + 1;

  const layers = [];
  const seal = nums(arg("seal"));
  if (seal.length === 2) {
    const { left, top, size } = REF.sealBox;
    const cut = await sharp(CAR).extract({ left, top, width: size, height: size })
      .composite([{ input: Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 0.9}" fill="#fff"/></svg>`), blend: "dest-in" }])
      .png().toBuffer();
    const D = Math.round(size * k);
    layers.push({ input: await sharp(cut).resize(D, D).png().toBuffer(), left: Math.round(seal[0] - D / 2), top: Math.round(seal[1] - D / 2) });
    console.log(`seal: diameter ${D}, inner box x ${Math.round(seal[0] - D / 2)}-${Math.round(seal[0] + D / 2)}`);
  }
  layers.push({ input: Buffer.from(`<svg width="${W0}" height="${H0}"><rect width="${W0}" height="${H0}" rx="${innerR}" fill="#fff"/></svg>`), blend: "dest-in" });
  const inner = await sharp(src).extract({ left: x0, top: y0, width: W0, height: H0 }).composite(layers).png().toBuffer();

  const mx = Math.round(10 * k), my = Math.round(5 * k); // small transparent margin, like the car plate
  const W = W0 + 2 * b + 2 * mx, H = H0 + 2 * b + 2 * my;
  const border = Buffer.from(`<svg width="${W}" height="${H}"><rect x="${mx}" y="${my}" width="${W - 2 * mx}" height="${H - 2 * my}" rx="${r}" fill="#000"/></svg>`);
  const buf = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: border, left: 0, top: 0 }, { input: inner, left: mx + b, top: my + b }])
    .png({ compressionLevel: 9 }).toBuffer();
  await sharp(buf).toFile(out);
  console.log(`framed ${path.basename(out)}: ${W}x${H}, border ${b}px, radius ${r}px, content offset +${mx + b},+${my + b}`);
}

const [cmd, a, b] = process.argv.slice(2);
(cmd === "measure" ? measure(a) : cmd === "frame" ? frame(a, b) : Promise.reject(new Error("usage: measure|frame")))
  .catch((e) => { console.error(e.message); process.exit(1); });
