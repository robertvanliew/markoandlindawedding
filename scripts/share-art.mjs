// Renders the link-preview card and the site icons in Chrome with the site's own fonts and peonies:
//   app/opengraph-image.jpg, app/twitter-image.jpg   1200 x 630 card shown when the link is shared
//                                                     (iMessage, WhatsApp, Facebook, X, Slack...)
//   app/icon.png (512), app/apple-icon.png (180)      L & M monogram for browser tabs and home screens
//   app/favicon.ico                                   the same monogram for browsers that ask for /favicon.ico
// Usage: node scripts/share-art.mjs   (needs Google Chrome or Microsoft Edge installed)
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { existsSync, writeFileSync } from "node:fs";

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const executablePath = BROWSERS.find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge is needed to render the share art.");

const dataUrl = async (p) =>
  `data:image/png;base64,${(await sharp(p).trim({ threshold: 1 }).resize({ width: 700 }).png().toBuffer()).toString("base64")}`;
const peony = await dataUrl("public/art/peony-top-left.png");

const FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Pinyon+Script&display=block" rel="stylesheet">';
const BASE = `* { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cormorant Garamond', Georgia, serif; -webkit-font-smoothing: antialiased; font-variant-numeric: lining-nums; }`;

// Card: everything important sits in the centre square, so apps that crop to a square still show it.
const CARD = `<!doctype html><html><head>${FONTS}<style>${BASE}
  .c { position: relative; width: 1200px; height: 630px; overflow: hidden;
    background: radial-gradient(60% 70% at 50% 50%, #fbf4ee 0%, #fdfbf8 70%); }
  .frame { position: absolute; inset: 26px; border: 1.5px solid #cdb79c; }
  .frame::after { content: ""; position: absolute; inset: 6px; border: 1.5px solid #cdb79c; }
  .p { position: absolute; width: 330px; }
  .p.tl { top: -30px; left: -34px; }
  .p.br { bottom: -30px; right: -34px; transform: rotate(180deg); }
  .t { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .together { font-size: 22px; font-weight: 600; letter-spacing: 7px; text-transform: uppercase; color: #7a5b41; }
  .names { font-family: 'Pinyon Script', cursive; font-size: 104px; line-height: 1.02; color: #8a6a4f; margin-top: 16px; }
  .amp { font-family: 'Pinyon Script', cursive; font-size: 62px; color: #a8854e; line-height: 0.9; }
  .rule { width: 120px; height: 2px; margin: 26px 0 22px; background: linear-gradient(90deg, transparent, #a8854e, transparent); }
  .date { font-size: 34px; font-weight: 600; letter-spacing: 7px; text-transform: uppercase; color: #5e4430; }
</style></head><body><div class="c">
  <div class="frame"></div>
  <img class="p tl" src="${peony}"><img class="p br" src="${peony}">
  <div class="t">
    <div class="together">Together with their families</div>
    <div class="names">Linda</div>
    <div class="amp">&amp;</div>
    <div class="names" style="margin-top:0">Marko</div>
    <div class="rule"></div>
    <div class="date">Saturday, May 15, 2027</div>
  </div>
</div></body></html>`;

const ICON = `<!doctype html><html><head>${FONTS}<style>${BASE}
  .i { width: 512px; height: 512px; display: flex; align-items: center; justify-content: center;
    background: #fdfbf8; border: 10px solid #fdfbf8; box-shadow: inset 0 0 0 4px #cdb79c, inset 0 0 0 16px #fdfbf8, inset 0 0 0 19px #cdb79c; }
  .m { font-family: 'Pinyon Script', cursive; color: #8a6a4f; font-size: 150px; line-height: 1; display: flex; align-items: baseline; margin-top: -10px; }
  .m .a { font-size: 72px; color: #a8854e; margin: 0 2px; }
</style></head><body><div class="i"><div class="m"><span>L</span><span class="a">&amp;</span><span>M</span></div></div></body></html>`;

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const shot = async (html, width, height) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    return page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
  };

  const card = await shot(CARD, 1200, 630);
  for (const name of ["opengraph-image", "twitter-image"]) {
    await sharp(card).jpeg({ quality: 88, mozjpeg: true }).toFile(`app/${name}.jpg`);
    writeFileSync(`app/${name}.alt.txt`, "Linda & Marko, Saturday, May 15, 2027");
  }

  const icon = await shot(ICON, 512, 512);
  await sharp(icon).png({ compressionLevel: 9 }).toFile("app/icon.png");
  await sharp(icon).resize(180).png({ compressionLevel: 9 }).toFile("app/apple-icon.png");

  // favicon.ico holding 16, 32 and 48 px PNG images
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => sharp(icon).resize(s).ensureAlpha().png({ palette: false }).toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s, e);
    header.writeUInt8(s, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(pngs[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  writeFileSync("app/favicon.ico", Buffer.concat([header, ...pngs]));
  console.log("wrote app/opengraph-image.jpg, app/twitter-image.jpg, app/icon.png, app/apple-icon.png, app/favicon.ico");
} finally {
  await browser.close();
}
