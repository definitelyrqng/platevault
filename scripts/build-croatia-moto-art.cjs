#!/usr/bin/env node
/**
 * Croatian motorcycle plate (square, three rows: region / digits / letters), made from the pieces of the
 * single-line plate (euroband and coat of arms) plus a drawn rim, face and stripes.
 * Run after build-croatia-art.cjs.
 *
 *   node scripts/build-croatia-moto-art.cjs  →  public/plates/croatia/moto-euroband.png, moto.png
 */
const sharp = require("sharp");
const path = require("path");
const DIR = path.join(__dirname, "../public/plates/croatia");

(async () => {
  const single = path.join(DIR, "standard-single.png");
  const W = 1024, H = 1044;
  const band = await sharp(single).extract({ left: 56, top: 52, width: 134, height: 298 }).resize(176, 300, { kernel: "lanczos3" }).toBuffer();
  const arms = await sharp(single).extract({ left: 524, top: 104, width: 148, height: 192 }).resize(170, 220, { kernel: "lanczos3" }).toBuffer();
  const svg = (withBand) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdbdc1"/><stop offset="1" stop-color="#80808a"/></linearGradient></defs>
    <rect width="${W}" height="${H}" rx="46" fill="url(#rim)"/>
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="40" fill="#ffffff"/>
    <rect x="${withBand ? 206 : 30}" y="48" width="${W}" height="6" fill="#c8202f"/><rect x="${withBand ? 206 : 30}" y="66" width="${W}" height="6" fill="#233c8f"/>
    <rect x="30" y="${H - 84}" width="${W}" height="6" fill="#c8202f"/><rect x="30" y="${H - 66}" width="${W}" height="6" fill="#233c8f"/>
  </svg>`);
  const clip = (buf) => buf;
  await sharp(svg(true)).composite([{ input: band, left: 30, top: 52 }, { input: arms, left: 706, top: 122 }]).png().toFile(path.join(DIR, "moto-euroband.png"));
  await sharp(svg(false)).composite([{ input: arms, left: 706, top: 122 }]).png().toFile(path.join(DIR, "moto.png"));
  // two-row car plate: region above, number below; coat of arms top right (a euroband version too)
  const TW = 1024, TH = 700;
  const arms2 = await sharp(path.join(DIR, "arms.png")).resize(150, 206, { kernel: "lanczos3" }).toBuffer();
  const tsvg = (withBand) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}">
    <defs><linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdbdc1"/><stop offset="1" stop-color="#80808a"/></linearGradient></defs>
    <rect width="${TW}" height="${TH}" rx="46" fill="url(#rim)"/>
    <rect x="6" y="6" width="${TW - 12}" height="${TH - 12}" rx="40" fill="#ffffff"/>
    <rect x="${withBand ? 206 : 30}" y="34" width="${TW}" height="6" fill="#c8202f"/><rect x="${withBand ? 206 : 30}" y="50" width="${TW}" height="6" fill="#233c8f"/>
    <rect x="30" y="${TH - 70}" width="${TW}" height="6" fill="#c8202f"/><rect x="30" y="${TH - 54}" width="${TW}" height="6" fill="#233c8f"/>
  </svg>`);
  const bandT = await sharp(single).extract({ left: 56, top: 52, width: 134, height: 298 }).resize(176, 300, { kernel: "lanczos3" }).toBuffer();
  await sharp(tsvg(true)).composite([{ input: bandT, left: 30, top: 38 }, { input: arms2, left: 800, top: 78 }]).png().toFile(path.join(DIR, "two-euroband.png"));
  await sharp(tsvg(false)).composite([{ input: arms2, left: 800, top: 78 }]).png().toFile(path.join(DIR, "two.png"));
  console.log("ok");
})();
