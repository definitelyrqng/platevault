#!/usr/bin/env node
/**
 * Builds the German plate seals and inspection stickers.
 *
 *   node scripts/build-germany-seals.cjs
 *
 * - public/plates/germany/seals/<ST>.png  round state seal (316 px), ST = state code (BW, BY, …)
 *   NW uses the supplied photo of a real seal (assets/germany-seals/nrw.png); the others are drawn
 *   from the state coat of arms (assets/germany-seals/coa/<ST>.png) in the same style.
 * - public/plates/germany/hu/<yy>.png     inspection sticker (HU) for the years 2000–2039, in that year's colour
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SEALS = path.join(ROOT, "public/plates/germany/seals");
const HU = path.join(ROOT, "public/plates/germany/hu");
fs.mkdirSync(SEALS, { recursive: true });
fs.mkdirSync(HU, { recursive: true });

const STATES = {
  BW: "BADEN-WÜRTTEMBERG", BY: "BAYERN", BE: "BERLIN", BB: "BRANDENBURG", HB: "BREMEN", HH: "HAMBURG", HE: "HESSEN",
  MV: "MECKLENBURG-VORPOMMERN", NI: "NIEDERSACHSEN", RP: "RHEINLAND-PFALZ", SL: "SAARLAND", SN: "SACHSEN",
  ST: "SACHSEN-ANHALT", SH: "SCHLESWIG-HOLSTEIN", TH: "THÜRINGEN",
};
const S = 316;
const opentype = require("opentype.js");
const FONT = opentype.loadSync("C:/Windows/Fonts/times.ttf");
/** The name as outlined glyphs along the top arc of the seal (no font needed at render time). */
function arcText(name, size) {
  const r = S / 2 - 38;                                   // baseline radius
  const scale = size / FONT.unitsPerEm;
  const adv = [...name].map((ch) => FONT.charToGlyph(ch).advanceWidth * scale);
  const total = adv.reduce((x, y) => x + y, 0);
  let x = -total / 2, out = "";
  [...name].forEach((ch, i) => {
    const mid = x + adv[i] / 2, ang = (mid / r) * (180 / Math.PI);             // degrees from the top
    const d = FONT.charToGlyph(ch).getPath(-adv[i] / 2, 0, size).toPathData(2);
    out += `<path d="${d}" fill="#16224f" transform="translate(${S / 2} ${S / 2}) rotate(${ang.toFixed(2)}) translate(0 ${-r})"/>`;
    x += adv[i];
  });
  return out;
}


async function seal(code, name) {
  const coa = fs.readFileSync(path.join(ROOT, `assets/germany-seals/coa/${code}.png`));
  const meta = await sharp(coa).metadata();
  const maxW = 175, maxH = 175;
  const k = Math.min(maxW / meta.width, maxH / meta.height);
  const w = Math.round(meta.width * k), h = Math.round(meta.height * k);
  const uri = "data:image/png;base64," + (await sharp(coa).resize(w * 2, h * 2).png().toBuffer()).toString("base64");
  const fs_ = name.length > 16 ? 25 : name.length > 12 ? 30 : 36;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
  <radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#e3e5e8"/><stop offset="1" stop-color="#b9bcc2"/></radialGradient>
  <path id="top" d="M 38 ${S / 2} A ${S / 2 - 38} ${S / 2 - 38} 0 0 1 ${S - 38} ${S / 2}"/>
</defs>
<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 1}" fill="#d2d4d8"/>
<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 7}" fill="url(#g)" stroke="#16224f" stroke-width="3"/>
${arcText(name, fs_)}
<image xlink:href="${uri}" x="${(S - w) / 2}" y="${(S - h) / 2 + 30}" width="${w}" height="${h}"/>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(SEALS, `${code}.png`));
}

// the real seal photo, cut to a circle
async function realSeal(src, code) {
  const meta = await sharp(src).metadata();
  const side = Math.min(meta.width, meta.height);
  const mask = Buffer.from(`<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/></svg>`);
  await sharp(src).extract({ left: Math.floor((meta.width - side) / 2), top: Math.floor((meta.height - side) / 2), width: side, height: side })
    .resize(S, S).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(SEALS, `${code}.png`));
}

// year colours repeat every six years (2020 blue, 21 yellow, 22 red, 23 pink, 24 green, 25 orange)
const COLORS = ["#1ab0ee", "#f5ef12", "#d85c4c", "#f7a0b8", "#18b082", "#e89000"];
function sticker(yy) {
  const R = 134, c = R, col = COLORS[(((yy - 20) % 6) + 6) % 6];
  let g = "";
  // black month segment at the top
  const a0 = (-34 * Math.PI) / 180, a1 = (34 * Math.PI) / 180, ri = R * 0.66, ro = R * 0.985;
  const P = (r, a) => `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
  g += `<path d="M ${P(ri, a0)} L ${P(ro, a0)} A ${ro} ${ro} 0 0 1 ${P(ro, a1)} L ${P(ri, a1)} A ${ri} ${ri} 0 0 0 ${P(ri, a0)} Z" fill="#000"/>`;
  for (let m = 0; m < 12; m++) {
    const a = ((m * 30 + 15) * Math.PI) / 180;                                            // tick between the numbers
    g += `<line x1="${P(R * 0.34, a).split(" ")[0]}" y1="${P(R * 0.34, a).split(" ")[1]}" x2="${P(R * 0.99, a).split(" ")[0]}" y2="${P(R * 0.99, a).split(" ")[1]}" stroke="#000" stroke-width="3"/>`;
  }
  for (let m = 1; m <= 12; m++) {
    const deg = (m % 12) * 30, a = (deg * Math.PI) / 180, [x, y] = P(R * 0.62, a).split(" ");
    g += `<text x="${x}" y="${y}" transform="rotate(${deg} ${x} ${y})" font-family="Arial Narrow, Arial, sans-serif" font-weight="bold" font-size="40" text-anchor="middle" dominant-baseline="central" fill="${m === 12 ? "#fff" : "#000"}">${m}</text>`;
  }
  g += `<circle cx="${c}" cy="${c}" r="${R * 0.3}" fill="${col}" stroke="#000" stroke-width="3"/>`;
  g += `<text x="${c}" y="${c}" font-family="Arial, sans-serif" font-weight="bold" font-size="42" text-anchor="middle" dominant-baseline="central" fill="#000">${String(yy).padStart(2, "0")}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * R}" height="${2 * R}" viewBox="0 0 ${2 * R} ${2 * R}"><circle cx="${c}" cy="${c}" r="${R - 1.5}" fill="${col}" stroke="#000" stroke-width="3"/>${g}</svg>`;
}

(async () => {
  for (const [code, name] of Object.entries(STATES)) await seal(code, name);
  // fallback for district codes without a state (federal / special codes): a plain seal
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 1}" fill="#d2d4d8"/><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 7}" fill="#c4c7cc" stroke="#16224f" stroke-width="3"/></svg>`)).png().toFile(path.join(SEALS, "XX.png"));
  await realSeal(path.join(ROOT, "assets/germany-seals/nrw.png"), "NW");
  for (let y = 0; y < 40; y++) await sharp(Buffer.from(sticker(y))).png().toFile(path.join(HU, `${String(y).padStart(2, "0")}.png`));
  console.log("seals:", fs.readdirSync(SEALS).length, "stickers:", fs.readdirSync(HU).length);
})().catch((e) => { console.error(e); process.exit(1); });
