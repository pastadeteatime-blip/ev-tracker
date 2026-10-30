const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "app-store-screenshots-1.2.1", "raw");
const outDir = path.join(root, "app-store-screenshots-1.2.1", "final");
fs.mkdirSync(outDir, { recursive: true });

const W = 1284;
const H = 2778;
const phoneW = 1010;
const phoneH = Math.round(phoneW * 932 / 430);
const phoneX = Math.round((W - phoneW) / 2);
const phoneY = 790;

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function backgroundSvg(index, accent = "#ffd84d") {
  const pairOffset = index === 2 ? -W : 0;
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#02052d"/>
          <stop offset="0.55" stop-color="#06275f"/>
          <stop offset="1" stop-color="#155bb2"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
      <g transform="translate(${pairOffset} 0)">
        <circle cx="1284" cy="360" r="710" fill="url(#glow)"/>
        <path d="M-140 560 C560 190 1790 180 2700 610" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="5"/>
        <path d="M-200 740 C650 330 1740 350 2750 810" fill="none" stroke="${accent}" stroke-opacity=".16" stroke-width="3"/>
      </g>
      <path d="M0 2200 L${W} 1740 L${W} ${H} L0 ${H} Z" fill="#02052d" fill-opacity=".28"/>
    </svg>
  `);
}

function textSvg({ eyebrow, titleLines, subtitle, titleSize = 104, align = "middle" }) {
  const anchor = align === "start" ? "start" : "middle";
  const x = align === "start" ? 92 : W / 2;
  const lineHeight = Math.round(titleSize * 1.04);
  const tspans = titleLines.map((line, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join("");
  const subtitleY = 215 + (titleLines.length - 1) * lineHeight + 150;
  return Buffer.from(`
    <svg width="${W}" height="760" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; }
      </style>
      <text x="${x}" y="86" text-anchor="${anchor}" fill="#9fd8ff" font-size="36" font-weight="600" letter-spacing="4">${escapeXml(eyebrow)}</text>
      <text x="${x}" y="215" text-anchor="${anchor}" fill="#fff8db" font-size="${titleSize}" font-weight="800" letter-spacing="-3">${tspans}</text>
      <text x="${x}" y="${subtitleY}" text-anchor="${anchor}" fill="#ffffff" fill-opacity=".78" font-size="39" font-weight="500">${escapeXml(subtitle)}</text>
    </svg>
  `);
}

function phoneFrameSvg() {
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-30%" width="200%" height="180%">
          <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#000000" flood-opacity=".48"/>
        </filter>
      </defs>
      <rect x="${phoneX - 16}" y="${phoneY - 16}" width="${phoneW + 32}" height="${phoneH + 32}" rx="72"
        fill="#050814" stroke="#9dc8ef" stroke-opacity=".62" stroke-width="5" filter="url(#shadow)"/>
      <rect x="${W / 2 - 112}" y="${phoneY + 20}" width="224" height="54" rx="27" fill="#03050c"/>
    </svg>
  `);
}

async function phoneShot(file) {
  const screenshot = await sharp(path.join(rawDir, file))
    .resize(phoneW, phoneH, { fit: "fill" })
    .png()
    .toBuffer();
  const mask = Buffer.from(`
    <svg width="${phoneW}" height="${phoneH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${phoneW}" height="${phoneH}" rx="56" fill="#fff"/>
    </svg>
  `);
  return sharp(screenshot)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function makeScreenshot({
  number,
  raw,
  eyebrow,
  titleLines,
  subtitle,
  accent,
  titleSize,
}) {
  const phone = await phoneShot(raw);
  const canvas = sharp(backgroundSvg(number, accent));
  await canvas
    .composite([
      { input: textSvg({ eyebrow, titleLines, subtitle, titleSize }), left: 0, top: 30 },
      { input: phoneFrameSvg(), left: 0, top: 0 },
      { input: phone, left: phoneX, top: phoneY },
    ])
    .removeAlpha()
    .png()
    .toFile(path.join(outDir, `${String(number).padStart(2, "0")}.png`));
}

async function main() {
  await makeScreenshot({
    number: 1,
    raw: "log-main.png",
    eyebrow: "期待値 TRACKER",
    titleLines: ["期待値も、"],
    subtitle: "店舗・機種・回転をすばやく記録",
    accent: "#ffd84d",
    titleSize: 122,
  });
  await makeScreenshot({
    number: 2,
    raw: "calendar.png",
    eyebrow: "EXPECTATION × RESULT",
    titleLines: ["実収支も。"],
    subtitle: "日々の結果をカレンダーで見える化",
    accent: "#ffd84d",
    titleSize: 122,
  });
  await makeScreenshot({
    number: 3,
    raw: "log-detail.png",
    eyebrow: "SIMPLE INPUT",
    titleLines: ["入力は、", "迷わず最短。"],
    subtitle: "実戦中でも押しやすい操作設計",
    accent: "#72d6ff",
    titleSize: 92,
  });
  await makeScreenshot({
    number: 4,
    raw: "calculation.png",
    eyebrow: "EXPECTED VALUE",
    titleLines: ["期待値を", "その場で確認。"],
    subtitle: "回転率と持ち玉比率を計算に反映",
    accent: "#ffd84d",
    titleSize: 92,
  });
  await makeScreenshot({
    number: 5,
    raw: "annual.png",
    eyebrow: "YEARLY REPORT",
    titleLines: ["年間と累計を", "ひと目で。"],
    subtitle: "実収支・期待値・差を見やすく比較",
    accent: "#b68cff",
    titleSize: 92,
  });
  await makeScreenshot({
    number: 6,
    raw: "machine-picker.png",
    eyebrow: "MACHINE SEARCH",
    titleLines: ["人気機種を", "すぐ検索。"],
    subtitle: "確率とボーダーを一覧で確認",
    accent: "#72d6ff",
    titleSize: 92,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
