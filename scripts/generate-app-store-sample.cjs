const path = require("node:path");
const fs = require("node:fs");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const screenshotRoot = path.join(root, "app-store-screenshots-1.2.1");
const rawDir = path.join(screenshotRoot, "raw");
const outputDir = path.join(screenshotRoot, "final");
fs.mkdirSync(outputDir, { recursive: true });

const W = 1284;
const H = 2778;
const phoneW = 930;
const phoneH = Math.round(phoneW * 932 / 430);

const background = Buffer.from(`
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff9df"/>
        <stop offset=".55" stop-color="#fffdf1"/>
        <stop offset="1" stop-color="#f8efd0"/>
      </linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f7fcff"/>
        <stop offset=".46" stop-color="#deeff8"/>
        <stop offset="1" stop-color="#c8e2ef"/>
      </linearGradient>
      <radialGradient id="halo">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".92"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity=".28"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="${W}" height="670" fill="url(#cream)"/>
    <rect y="670" width="${W}" height="${H - 670}" fill="url(#sky)"/>
    <path d="M0 670 C330 620 880 735 1284 650 L1284 790 C890 820 390 725 0 785 Z" fill="#ffffff" fill-opacity=".52"/>
    <ellipse cx="640" cy="1630" rx="600" ry="880" fill="url(#halo)" opacity=".56"/>
    <ellipse cx="640" cy="2490" rx="470" ry="90" fill="#315878" fill-opacity=".14" filter="url(#soft)"/>

    <g fill="#d7aa28" opacity=".56">
      <circle cx="104" cy="915" r="7"/><circle cx="1135" cy="1025" r="6"/>
      <circle cx="118" cy="1685" r="5"/><circle cx="1170" cy="1830" r="7"/>
      <circle cx="180" cy="2305" r="6"/><circle cx="1090" cy="2375" r="5"/>
    </g>
    <g fill="#ffffff" opacity=".88">
      <path d="M172 1110 l8 21 21 8-21 8-8 21-8-21-21-8 21-8z"/>
      <path d="M1090 1320 l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/>
      <path d="M110 2050 l6 16 16 6-16 6-6 16-6-16-16-6 16-6z"/>
      <path d="M1140 2170 l9 24 24 9-24 9-9 24-9-24-24-9 24-9z"/>
    </g>
    <g fill="none" stroke="#d7aa28" stroke-width="4" opacity=".48">
      <circle cx="1088" cy="880" r="13"/><circle cx="155" cy="1450" r="10"/>
      <circle cx="1085" cy="1930" r="11"/>
    </g>
  </svg>
`);

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function copySvg({ lead1, support1, support2, lead2, subtitle }) {
  return Buffer.from(`
  <svg width="${W}" height="720" xmlns="http://www.w3.org/2000/svg">
    <style>text { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; }</style>
    <text x="642" y="78" text-anchor="middle" fill="#143052" font-size="30" font-weight="600" letter-spacing="3">期待値 TRACKER</text>
    <text x="642" y="250" text-anchor="middle" fill="#0b2d54"><tspan font-size="170" font-weight="900" letter-spacing="-1">${escapeXml(lead1)}</tspan><tspan dx="34" font-size="66" font-weight="400" letter-spacing="3">${escapeXml(support1)}</tspan></text>
    <text x="642" y="414" text-anchor="middle" fill="#0b2d54"><tspan font-size="66" font-weight="400" letter-spacing="3">${escapeXml(support2)}</tspan><tspan dx="34" font-size="170" font-weight="900" letter-spacing="-1">${escapeXml(lead2)}</tspan></text>
    <rect x="395" y="448" width="494" height="6" rx="3" fill="#d7aa28" opacity=".82"/>
    <text x="642" y="520" text-anchor="middle" fill="#34506c" font-size="35" font-weight="500">${escapeXml(subtitle)}</text>
  </svg>
`);
}

const frame = Buffer.from(`
  <svg width="1010" height="2210" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-50%" y="-30%" width="200%" height="180%">
        <feDropShadow dx="0" dy="32" stdDeviation="34" flood-color="#15324b" flood-opacity=".34"/>
      </filter>
    </defs>
    <rect x="20" y="20" width="970" height="2170" rx="76" fill="#071322" stroke="#335675" stroke-width="7" filter="url(#shadow)"/>
  </svg>
`);

const dynamicIsland = Buffer.from(`
  <svg width="1010" height="2210" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="island" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#08090d"/>
        <stop offset="1" stop-color="#000000"/>
      </linearGradient>
    </defs>
    <rect x="386" y="78" width="238" height="62" rx="31" fill="url(#island)"/>
    <ellipse cx="585" cy="96" rx="8" ry="5" fill="#182233" opacity=".72"/>
  </svg>
`);

async function makeScreenshot(config) {
  const phone = await sharp(path.join(rawDir, config.raw))
    .resize(phoneW, phoneH, { fit: "fill" })
    .composite([{
      input: Buffer.from(`<svg width="${phoneW}" height="${phoneH}" xmlns="http://www.w3.org/2000/svg"><rect width="${phoneW}" height="${phoneH}" rx="58" fill="#fff"/></svg>`),
      blend: "dest-in",
    }])
    .png()
    .toBuffer();

  const framed = await sharp({
    create: { width: 1010, height: 2210, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: phone, left: 40, top: 58 },
      { input: dynamicIsland, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  const tilted = await sharp(framed)
    .rotate(-2.2, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(background)
    .composite([
      { input: copySvg(config), left: 0, top: 32 },
      { input: tilted, left: 116, top: 655 },
    ])
    .removeAlpha()
    .png()
    .toFile(path.join(outputDir, `${String(config.number).padStart(2, "0")}.png`));
}

async function main() {
  const screenshots = [
    {
      number: 1, raw: "log-main.png",
      lead1: "期待値", support1: "を", support2: "正確に", lead2: "記録",
      subtitle: "店舗・交換率を登録可能",
    },
    {
      number: 2, raw: "calendar.png",
      lead1: "実収支", support1: "も", support2: "ひと目で", lead2: "確認",
      subtitle: "期待値との差をカレンダーで確認",
    },
    {
      number: 3, raw: "log-detail.png",
      lead1: "入力", support1: "は", support2: "迷わず", lead2: "最短",
      subtitle: "実戦中でも押しやすい操作設計",
    },
    {
      number: 4, raw: "calculation.png",
      lead1: "期待値", support1: "を", support2: "その場で", lead2: "計算",
      subtitle: "回転率と持ち玉比率を自動反映",
    },
    {
      number: 5, raw: "annual.png",
      lead1: "年間", support1: "と", support2: "まとめて", lead2: "累計",
      subtitle: "実収支・期待値・差を見やすく比較",
    },
    {
      number: 6, raw: "machine-picker.png",
      lead1: "人気機種", support1: "を", support2: "すぐに", lead2: "検索",
      subtitle: "確率とボーダーを一覧で確認",
    },
  ];

  for (const config of screenshots) {
    await makeScreenshot(config);
  }

  fs.copyFileSync(
    path.join(outputDir, "01.png"),
    path.join(screenshotRoot, "sample-01-sparkle.png"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
