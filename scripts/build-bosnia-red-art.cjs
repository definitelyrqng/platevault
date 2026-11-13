#!/usr/bin/env node
/**
 * Colour variants of the Bosnian euroband plates, made from standard-single.png / standard-two.png:
 *   -red     testing (TT) and portable (MT) plates: the black frame becomes red
 *   -green   agricultural plates: the black frame becomes green
 *   diplomatic-single / diplomatic-two: blue plate, no euroband (gold lettering is drawn by the renderer)
 *
 *   node scripts/build-bosnia-red-art.cjs
 */
const sharp = require("sharp");
const path = require("path");
const DIR = path.join(__dirname, "../public/plates/bosnia");

async function load(name) {
  return sharp(path.join(DIR, `${name}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}
async function save(data, info, name) {
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(DIR, `${name}.png`));
}

/** The dark frame takes the given colour (only dark neutral pixels: not the band, watermarks or wavy lines). */
async function frame(name, out, rgb) {
  const { data, info } = await load(name);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r + g + b) / 3;
    const neutral = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
    if (!neutral || lum >= 150 || data[i + 3] === 0) continue;
    const t = Math.min(1, (255 - lum) / (255 - 27));
    data[i] = Math.round(255 - (255 - rgb[0]) * t); data[i + 1] = Math.round(255 - (255 - rgb[1]) * t); data[i + 2] = Math.round(255 - (255 - rgb[2]) * t);
  }
  await save(data, info, out);
}

/**
 * Diplomatic: the white face (and the euroband) turn plate-blue, the watermarks and wavy lines
 * become darker blue (multiply), the frame stays dark.
 */
async function diplomatic(name, out, bandBox) {
  const { data, info } = await load(name);
  const B = [48, 160, 226];
  const W = info.width;
  for (let p = 0; p < W * info.height; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const x = p % W, y = (p / W) | 0;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const inBand = x >= bandBox[0] && x <= bandBox[1] && y >= bandBox[2] && y <= bandBox[3];
    const isBlueBand = b > 190 && r < 60 && g > 120 && g < 170;
    if (inBand && (isBlueBand || (r + g + b) / 3 > 90)) { data[i] = B[0]; data[i + 1] = B[1]; data[i + 2] = B[2]; continue; }   // euroband + its lettering → plate blue
    const lum = (r + g + b) / 3;
    const neutral = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
    if (neutral && lum > 150) {                                      // white face, grey watermarks / lines
      const k = lum / 255;
      data[i] = Math.round(B[0] * k); data[i + 1] = Math.round(B[1] * k); data[i + 2] = Math.round(B[2] * k);
    }
  }
  await save(data, info, out);
}

(async () => {
  await frame("standard-single", "standard-single-red", [217, 35, 28]);
  await frame("standard-two", "standard-two-red", [217, 35, 28]);
  await frame("standard-single", "standard-single-green", [38, 125, 50]);
  await frame("standard-two", "standard-two-green", [38, 125, 50]);
  await diplomatic("standard-single", "diplomatic-single", [40, 214, 0, 460]);       // band: x 46–212 inside the frame
  await diplomatic("standard-two", "diplomatic-two", [10, 168, 10, 270]);            // band: top-left block
  console.log("ok");
})();
