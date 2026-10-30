const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "app-store-screenshots-2.0.0/source/01-source.png");
const output = path.join(root, "app-store-screenshots-2.0.0/final/01.png");
const W = 1284;
const H = 2778;

const headline = Buffer.from(`
<svg width="${W}" height="650" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff9df"/>
      <stop offset=".55" stop-color="#fffdf4"/>
      <stop offset="1" stop-color="#f7efd4"/>
    </linearGradient>
  </defs>
  <style>
    .gothic{font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif}
    .latin{font-family:"Avenir Next","Helvetica Neue",sans-serif}
  </style>
  <rect width="${W}" height="650" fill="url(#cream)"/>
  <text x="642" y="78" text-anchor="middle" fill="#143052" font-size="30" font-weight="500" letter-spacing="3"><tspan class="gothic">期待値</tspan><tspan class="latin" dx="18">TRACKER</tspan></text>
  <text class="gothic" x="642" y="265" text-anchor="middle" fill="#0b2d54" font-weight="600"><tspan font-size="132" letter-spacing="8">期待値</tspan><tspan dx="20" font-size="58" font-weight="400">を</tspan></text>
  <text class="gothic" x="642" y="445" text-anchor="middle" fill="#0b2d54" font-weight="600"><tspan font-size="132" letter-spacing="8">正確</tspan><tspan dx="18" font-size="58" font-weight="400">に</tspan><tspan dx="18" font-size="144" letter-spacing="10">記録</tspan></text>
  <rect x="390" y="500" width="504" height="4" rx="2" fill="#d7aa28" opacity=".84"/>
  <text class="gothic" x="642" y="582" text-anchor="middle" fill="#183857" font-size="50" font-weight="500" letter-spacing="3">店舗・交換率を登録可能</text>
</svg>`);

async function main() {
  await sharp(input)
    .resize({ width: W, height: H, fit: "fill" })
    .composite([{ input: headline, left: 0, top: 0 }])
    .removeAlpha()
    .png()
    .toFile(output);
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
