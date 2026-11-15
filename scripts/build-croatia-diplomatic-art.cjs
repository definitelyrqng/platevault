#!/usr/bin/env node
/** Croatian diplomatic plate: plain light-blue plate, no euroband, stripes or coat of arms (lettering is drawn by the renderer). */
const sharp = require("sharp");
const path = require("path");
(async () => {
  const W = 1659, H = 393;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fa6b2"/><stop offset="1" stop-color="#6d7380"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9be6"/><stop offset="1" stop-color="#2f8bd8"/></linearGradient></defs>
    <rect x="26" y="26" width="${W - 52}" height="${H - 52}" rx="46" fill="url(#r)"/>
    <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="40" fill="url(#f)"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, "../public/plates/croatia/diplomatic-single.png"));
})();
