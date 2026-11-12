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

  // 0) the emblem + dash + DIV stamp stack becomes its own seal image
  await sharp(SRC).extract({ left: 296, top: 58, width: 60, height: 184 }).png().toFile(path.join(OUT, "seal.png"));
  // 1) paint out the lettering, emblem and stamp
  const boxes = [[140, 40, 262, 245], [290, 50, 362, 245], [378, 40, 765, 245], [770, 95, 860, 175], [866, 40, 1243, 245]];
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, [255, 255, 255]);

  // 2) screw holes: copy a clean patch from the same column
  for (const [hx, hy, dy] of [[33, 36, 112], [33, 243, -100], [1245, 36, 100], [1245, 243, -100]]) {
    const patch = [];
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) patch.push([x, y, get(hx + x, hy + y + dy)]);
    for (const [x, y, c] of patch) if (x * x + y * y <= 15 * 15) set(hx + x, hy + y, c);
  }
  // trim the white margin around the template and make everything outside the rounded plate transparent
  const M = 7, SW = W - 2 * M, SH = H - 2 * M;
  const outline = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}"><rect width="${SW}" height="${SH}" rx="22" fill="#fff"/></svg>`);
  const single = await sharp(data, { raw: { width: W, height: H, channels: C } }).extract({ left: M, top: M, width: SW, height: SH }).png().composite([{ input: outline, blend: "dest-in" }]).toBuffer();
  await sharp(single).toFile(path.join(OUT, "regular-single.png"));

  // 3) two rows: same border style, the single-row euroband scaled into the lower left
  const band = await sharp(single).extract({ left: 15, top: 15, width: 106, height: 232 }).toBuffer();
  const PW = 1000, PH = 600, bt = 14, r = 34;
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
  // 4) military plate (single row): metal rim, black frame line, Belgian flag strip, black digits go on top
  const MW = 1040, MH = 241;
  const mil = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}"><defs>
      <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d9d7"/><stop offset="1" stop-color="#a9a9a7"/></linearGradient>
      <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f2"/><stop offset="1" stop-color="#e4e4e1"/></linearGradient></defs>
    <rect x=".75" y=".75" width="${MW - 1.5}" height="${MH - 1.5}" rx="12" fill="url(#rim)" stroke="#555" stroke-width="1.5"/>
    <rect x="12" y="12" width="${MW - 24}" height="${MH - 24}" rx="7" fill="#1b1b1b"/>
    <rect x="17" y="17" width="${MW - 34}" height="${MH - 34}" rx="4" fill="url(#face)"/>
    <rect x="218" y="53" width="20" height="134" fill="#1b1b1b"/><rect x="238" y="53" width="20" height="134" fill="#fcd116"/><rect x="258" y="53" width="20" height="134" fill="#ee2a35"/>
    <rect x="218" y="53" width="60" height="134" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1"/>
  </svg>`;
  await sharp(Buffer.from(mil)).png().toFile(path.join(OUT, "military-single.png"));
  // 4b) agricultural plate: dark red plate, thin white line, white lettering, same euroband
  {
    const AW = SW, AH = SH;
    const bandA = await sharp(single).extract({ left: 15, top: 15, width: 106, height: 232 }).resize(104, AH - 36, { kernel: "lanczos3" }).toBuffer();
    const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${AW}" height="${AH}">
      <rect width="${AW}" height="${AH}" rx="22" fill="#a51f1f"/>
      <rect x="11" y="11" width="${AW - 22}" height="${AH - 22}" rx="13" fill="none" stroke="#f1f1f1" stroke-width="4"/></svg>`);
    await sharp(base).composite([{ input: bandA, left: 17, top: 18 }]).png().toFile(path.join(OUT, "agricultural-single.png"));
  }
  // 5) green variants (dealer, testing, professional plates): red border / emblem recoloured to green
  async function greenify(file, out) {
    const { data: d, info: i } = await sharp(path.join(OUT, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let p = 0; p < d.length; p += 4) {
      const r = d[p], g = d[p + 1], b = d[p + 2];
      const t = Math.max(0, Math.min(1, (r - g - 50) / 60));      // how red the pixel is
      if (!t) continue;
      const gr = [Math.round(r * 0.12), Math.round(r * 0.72), Math.round(r * 0.36)];
      d[p] = Math.round(r + (gr[0] - r) * t); d[p + 1] = Math.round(g + (gr[1] - g) * t); d[p + 2] = Math.round(b + (gr[2] - b) * t);
    }
    await sharp(d, { raw: { width: i.width, height: i.height, channels: 4 } }).png().toFile(path.join(OUT, out));
  }
  await greenify("regular-single.png", "regular-single-green.png");
  await greenify("regular-two.png", "regular-two-green.png");
  await greenify("seal.png", "seal-green.png");
  console.log("ok");
})();
