#!/usr/bin/env node
/** Two-row Bulgarian plate backgrounds (stars and flag band); run after build-bulgaria-art.cjs. */
const sharp = require("sharp");
const path = require("path");
const OUT = path.join(__dirname, "../public/plates/bulgaria");
(async () => {
  // bands from the single-line plates: stars (standard) and flag (military / flag option)
  const band = async (file) => sharp(path.join(OUT, file)).extract({ left: 15, top: 15, width: 85, height: 191 }).toBuffer();
  const W = 1024, H = 660, f = 14, BW = 156, BH = 272;
  const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="40" fill="#1b1816"/>
    <rect x="${f}" y="${f}" width="${W - 2 * f}" height="${H - 2 * f}" rx="28" fill="#fff"/></svg>`);
  for (const [src, out] of [["standard-single.png", "standard-two.png"], ["military-single.png", "flag-two.png"]]) {
    const b = await sharp(await band(src)).resize(BW, BH, { kernel: "lanczos3" }).toBuffer();
    await sharp(frame).composite([{ input: b, left: f, top: f }]).png().toFile(path.join(OUT, out));
  }
  console.log("ok");
})();
