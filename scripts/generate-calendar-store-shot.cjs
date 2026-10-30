const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "app-store-screenshots-2.0.0/source/02-calendar-real-5logs-iphone.png");
const output = path.join(root, "app-store-screenshots-2.0.0/final/02.png");
const W = 1284;
const H = 2778;

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff9df"/><stop offset=".55" stop-color="#fffdf4"/><stop offset="1" stop-color="#f7efd4"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8fcff"/><stop offset=".5" stop-color="#deeff8"/><stop offset="1" stop-color="#c8e2ef"/>
    </linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="30" flood-color="#15324b" flood-opacity=".32"/></filter>
  </defs>
  <rect width="${W}" height="690" fill="url(#cream)"/>
  <rect y="690" width="${W}" height="${H - 690}" fill="url(#sky)"/>
  <path d="M0 680 C340 625 900 735 1284 650 L1284 805 C900 835 390 725 0 795 Z" fill="#fff" fill-opacity=".55"/>
  <ellipse cx="642" cy="1740" rx="610" ry="920" fill="url(#halo)" opacity=".62"/>
  <g fill="#d7aa28" opacity=".55"><circle cx="100" cy="940" r="7"/><circle cx="1155" cy="1060" r="6"/><circle cx="112" cy="1840" r="5"/><circle cx="1170" cy="2100" r="7"/></g>
  <g fill="#fff" opacity=".92"><path d="M102 1480l8 22 22 8-22 8-8 22-8-22-22-8 22-8z"/><path d="M1150 1610l7 19 19 7-19 7-7 19-7-19-19-7 19-7z"/></g>
</svg>`);

const headline = Buffer.from(`
<svg width="${W}" height="690" xmlns="http://www.w3.org/2000/svg">
  <style>
    .gothic{font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif}
    .latin{font-family:"Avenir Next","Helvetica Neue",sans-serif}
  </style>
  <text x="642" y="78" text-anchor="middle" fill="#143052" font-size="30" font-weight="500" letter-spacing="3"><tspan class="gothic">期待値</tspan><tspan class="latin" dx="18">TRACKER</tspan></text>
  <text class="gothic" x="642" y="219" text-anchor="middle" fill="#0b2d54" font-weight="600"><tspan font-size="102" letter-spacing="5">期待値</tspan><tspan dx="16" font-size="56" font-weight="400">と</tspan><tspan dx="16" font-size="102" letter-spacing="5">実収支</tspan><tspan dx="11" font-size="56" font-weight="400">の</tspan></text>
  <text class="gothic" x="642" y="369" text-anchor="middle" fill="#183857" font-weight="500"><tspan font-size="91" letter-spacing="7">ギャップ</tspan><tspan dx="14" font-size="55" font-weight="400">も</tspan></text>
  <text class="gothic" x="642" y="550" text-anchor="middle" fill="#0b2d54" font-size="142" font-weight="600" letter-spacing="12">一目瞭然</text>
  <rect x="390" y="608" width="504" height="4" rx="2" fill="#d7aa28" opacity=".84"/>
</svg>`);

async function main() {
  const phoneW = 1120;
  const phoneH = Math.round(phoneW * 932 / 430);
  const app = await sharp(input)
    .resize({ width: phoneW, height: phoneH, fit: "fill" })
    .png()
    .toBuffer();
  const appMeta = await sharp(app).metadata();
  const frameW = phoneW + 80;
  const frameH = appMeta.height + 116;
  const frame = Buffer.from(`
    <svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="s"><feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#15324b" flood-opacity=".34"/></filter></defs>
      <rect x="20" y="20" width="${frameW - 40}" height="${frameH - 40}" rx="74" fill="#071322" stroke="#335675" stroke-width="7" filter="url(#s)"/>
    </svg>`);
  const phone = await sharp({ create: { width: frameW, height: frameH, channels: 4, background: { r:0,g:0,b:0,alpha:0 } } })
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: app, left: 40, top: 58 },
      { input: Buffer.from(`<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg"><rect x="481" y="69" width="238" height="58" rx="29" fill="#000"/></svg>`), left: 0, top: 0 },
    ])
    .png().toBuffer();
  const tilted = await sharp(phone).rotate(1.15, { background: { r:0,g:0,b:0,alpha:0 } }).png().toBuffer();
  const tiltedMeta = await sharp(tilted).metadata();
  await sharp(background)
    .composite([
      { input: headline, left: 0, top: 18 },
      { input: tilted, left: Math.round((W - tiltedMeta.width) / 2), top: 680 },
    ])
    .removeAlpha().png().toFile(output);
  console.log(output);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
