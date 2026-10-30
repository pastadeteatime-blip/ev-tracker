const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "app-store-screenshots-2.0.0/source/03-log-controls-real-iphone17.png");
const output = path.join(root, "app-store-screenshots-2.0.0/final/03.png");
const W = 1284;
const H = 2778;

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff9df"/><stop offset=".55" stop-color="#fffdf4"/><stop offset="1" stop-color="#f7efd4"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fcff"/><stop offset=".5" stop-color="#deeff8"/><stop offset="1" stop-color="#c8e2ef"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="690" fill="url(#cream)"/><rect y="690" width="${W}" height="${H - 690}" fill="url(#sky)"/>
  <path d="M0 680 C340 625 900 735 1284 650 L1284 805 C900 835 390 725 0 795 Z" fill="#fff" fill-opacity=".55"/>
  <ellipse cx="642" cy="1740" rx="610" ry="920" fill="url(#halo)" opacity=".62"/>
  <g fill="#d7aa28" opacity=".55"><circle cx="100" cy="940" r="7"/><circle cx="1155" cy="1060" r="6"/><circle cx="112" cy="1840" r="5"/><circle cx="1170" cy="2100" r="7"/></g>
  <g fill="#fff" opacity=".92"><path d="M102 1480l8 22 22 8-22 8-8 22-8-22-22-8 22-8z"/><path d="M1150 1610l7 19 19 7-19 7-7 19-7-19-19-7 19-7z"/></g>
</svg>`);

const headline = Buffer.from(`
<svg width="${W}" height="690" xmlns="http://www.w3.org/2000/svg">
  <style>.gothic{font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif}.latin{font-family:"Avenir Next","Helvetica Neue",sans-serif}</style>
  <text x="642" y="78" text-anchor="middle" fill="#143052" font-size="30" font-weight="500" letter-spacing="3"><tspan class="gothic">期待値</tspan><tspan class="latin" dx="18">TRACKER</tspan></text>
  <text class="gothic" x="642" y="260" text-anchor="middle" fill="#0b2d54" font-weight="600"><tspan font-size="142" letter-spacing="10">入力</tspan><tspan dx="20" font-size="58" font-weight="400">は</tspan></text>
  <text class="gothic" x="642" y="445" text-anchor="middle" fill="#0b2d54" font-weight="600"><tspan font-size="64" font-weight="400" letter-spacing="3">迷わず</tspan><tspan dx="24" font-size="150" letter-spacing="10">最短</tspan></text>
  <rect x="390" y="500" width="504" height="4" rx="2" fill="#d7aa28" opacity=".84"/>
  <text class="gothic" x="642" y="582" text-anchor="middle" fill="#183857" font-size="46" font-weight="500" letter-spacing="2">実戦中でも押しやすい操作設計</text>
</svg>`);

async function main() {
  const phoneW = 1120;
  const app = await sharp(input).resize({ width: phoneW }).png().toBuffer();
  const appMeta = await sharp(app).metadata();
  const phoneH = appMeta.height;
  const frameW = phoneW + 80;
  const frameH = phoneH + 116;
  const frame = Buffer.from(`<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="s"><feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#15324b" flood-opacity=".34"/></filter></defs><rect x="20" y="20" width="${frameW - 40}" height="${frameH - 40}" rx="74" fill="#071322" stroke="#335675" stroke-width="7" filter="url(#s)"/></svg>`);
  const phone = await sharp({ create: { width: frameW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: app, left: 40, top: 58 },
      { input: Buffer.from(`<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg"><rect x="481" y="69" width="238" height="58" rx="29" fill="#000"/></svg>`), left: 0, top: 0 },
    ]).png().toBuffer();
  const tilted = await sharp(phone).rotate(-0.35, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const meta = await sharp(tilted).metadata();
  await sharp(background).composite([
    { input: headline, left: 0, top: 18 },
    { input: tilted, left: Math.round((W - meta.width) / 2), top: 680 },
  ]).removeAlpha().png().toFile(output);
  console.log(output);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
