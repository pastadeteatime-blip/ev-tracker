const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "app-store-screenshots-2.0.0/font-candidates.png");
const svg = Buffer.from(`
<svg width="1284" height="1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f5fbff"/><stop offset="1" stop-color="#dceef8"/></linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff9e4"/><stop offset="1" stop-color="#fffdf5"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#143052" flood-opacity=".16"/></filter>
  </defs>
  <rect width="1284" height="1600" fill="url(#bg)"/>
  <text x="642" y="88" text-anchor="middle" font-family="Hiragino Sans, sans-serif" font-size="38" font-weight="600" fill="#143052" letter-spacing="3">フォント候補 3種類</text>

  <g transform="translate(72 140)" filter="url(#shadow)">
    <rect width="1140" height="420" rx="36" fill="url(#card)" stroke="#d6b34c" stroke-opacity=".42"/>
    <text x="48" y="62" font-family="Hiragino Sans, sans-serif" font-size="28" font-weight="600" fill="#54708a">01  ヒラギノ角ゴシック</text>
    <text x="570" y="178" text-anchor="middle" font-family="Hiragino Kaku Gothic ProN, Hiragino Sans, sans-serif" font-size="60" font-weight="400" fill="#183857" letter-spacing="5">期待値と実収支の</text>
    <text x="570" y="320" text-anchor="middle" font-family="Hiragino Kaku Gothic ProN, Hiragino Sans, sans-serif" font-size="112" font-weight="600" fill="#0b2d54" letter-spacing="2">ギャップも一目瞭然</text>
    <rect x="360" y="362" width="420" height="4" rx="2" fill="#d7aa28"/>
  </g>

  <g transform="translate(72 590)" filter="url(#shadow)">
    <rect width="1140" height="420" rx="36" fill="url(#card)" stroke="#d6b34c" stroke-opacity=".42"/>
    <text x="48" y="62" font-family="Hiragino Sans, sans-serif" font-size="28" font-weight="600" fill="#54708a">02  ヒラギノ丸ゴシック</text>
    <text x="570" y="178" text-anchor="middle" font-family="Hiragino Maru Gothic ProN, Hiragino Sans, sans-serif" font-size="60" font-weight="400" fill="#183857" letter-spacing="5">期待値と実収支の</text>
    <text x="570" y="320" text-anchor="middle" font-family="Hiragino Maru Gothic ProN, Hiragino Sans, sans-serif" font-size="108" font-weight="600" fill="#0b2d54" letter-spacing="1">ギャップも一目瞭然</text>
    <rect x="360" y="362" width="420" height="4" rx="2" fill="#d7aa28"/>
  </g>

  <g transform="translate(72 1040)" filter="url(#shadow)">
    <rect width="1140" height="420" rx="36" fill="url(#card)" stroke="#d6b34c" stroke-opacity=".42"/>
    <text x="48" y="62" font-family="Hiragino Sans, sans-serif" font-size="28" font-weight="600" fill="#54708a">03  ヒラギノ明朝・中太</text>
    <text x="570" y="178" text-anchor="middle" font-family="Hiragino Mincho ProN, YuMincho, serif" font-size="60" font-weight="500" fill="#183857" letter-spacing="6">期待値と実収支の</text>
    <text x="570" y="320" text-anchor="middle" font-family="Hiragino Mincho ProN, YuMincho, serif" font-size="108" font-weight="600" fill="#0b2d54" letter-spacing="5">ギャップも一目瞭然</text>
    <rect x="360" y="362" width="420" height="4" rx="2" fill="#d7aa28"/>
  </g>
</svg>`);

sharp(svg).removeAlpha().png().toFile(output)
  .then(() => console.log(output))
  .catch((error) => { console.error(error); process.exitCode = 1; });
