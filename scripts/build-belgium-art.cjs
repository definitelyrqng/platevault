#!/usr/bin/env node
/**
 * Belgian plate backgrounds, built from the supplied templates:
 *   assets/belgium-single-source.png  (single row, "1-ABC-003")
 * Single row: lettering and screw holes painted out, emblem + DIV stamp kept.
 * Two rows: border drawn to match, with the single-row euroband scaled into the lower left.
 *
 *   node scripts/build-belgium-art.cjs
 */
const sharp = require("sharp");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets/belgium-single-source.png");
const OUT = path.join(ROOT, "public/plates/belgium");

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 3;
  const set = (x, y, c) => { data[(y * W + x) * C] = c[0]; data[(y * W + x) * C + 1] = c[1]; data[(y * W + x) * C + 2] = c[2]; };
  const get = (x, y) => [data[(y * W + x) * C], data[(y * W + x) * C + 1], data[(y * W + x) * C + 2]];

  // 1) paint out the lettering (the emblem at 300–352 × 60–118 and the DIV stamp at 303–350 × 198–240 stay)
  const boxes = [[140, 40, 262, 245], [290, 120, 362, 182], [378, 40, 765, 245], [770, 95, 860, 175], [866, 40, 1243, 245]];
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, [255, 255, 255]);

  // 2) screw holes: copy a clean patch from the same column
  for (const [hx, hy, dy] of [[33, 36, 112], [33, 243, -100], [1245, 36, 100], [1245, 243, -100]]) {
    const patch = [];
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) patch.push([x, y, get(hx + x, hy + y + dy)]);
    for (const [x, y, c] of patch) if (x * x + y * y <= 15 * 15) set(hx + x, hy + y, c);
  }
  const single = await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
  await sharp(single).toFile(path.join(OUT, "regular-single.png"));

  // 3) two rows: same border style, the single-row euroband scaled into the lower left
  const band = await sharp(single).extract({ left: 22, top: 22, width: 106, height: 232 }).toBuffer();
  const PW = 1000, PH = 600, bt = 26, r = 40;
  const bh = Math.round((PH - 2 * bt) * 0.5), bw = Math.round(bh * 106 / 232);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><defs>
    <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b02a30"/><stop offset="1" stop-color="#96202a"/></linearGradient></defs>
    <rect x=".75" y=".75" width="${PW - 1.5}" height="${PH - 1.5}" rx="${r}" fill="#8d8d8d"/>
    <rect x="3" y="3" width="${PW - 6}" height="${PH - 6}" rx="${r - 2}" fill="url(#red)"/>
    <rect x="${bt - 1.5}" y="${bt - 1.5}" width="${PW - 2 * bt + 3}" height="${PH - 2 * bt + 3}" rx="${r - bt + 4}" fill="#6b6b6b"/>
    <rect x="${bt}" y="${bt}" width="${PW - 2 * bt}" height="${PH - 2 * bt}" rx="${r - bt + 2}" fill="#fff"/>
  </svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><rect width="${bw}" height="${bh}" rx="0" fill="#fff"/><rect y="${bh - 40}" width="40" height="40" fill="#000"/><circle cx="${40}" cy="${bh - 40}" r="40" fill="#fff"/><rect x="40" y="${bh - 40}" width="${bw - 40}" height="40" fill="#fff"/></svg>`);
  const bandImg = await sharp(band).resize(bw, bh, { kernel: "lanczos3" }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  await sharp(Buffer.from(svg)).composite([{ input: bandImg, left: bt, top: PH - bt - bh }]).png().toFile(path.join(OUT, "regular-two.png"));
  console.log("ok");
})();
