// Builds the invitation email's artwork by rendering it in Chrome with the site's own fonts and
// peonies, at 2x for sharp screens:
//   public/email/invite-hero.png    the invitation itself: peonies, names in script, date
//   public/email/invite-footer.png  the peony garland that closes the email
// Gmail and Outlook ignore web fonts, so the script names have to travel as an image to look right;
// every fact in the hero is repeated as live text and alt text in the email.
// Usage: node scripts/email-art.mjs   (needs Google Chrome or Microsoft Edge installed)
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const executablePath = BROWSERS.find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge is needed to render the email artwork.");

const dataUrl = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
// Trim the empty space around each spray so placement is predictable.
const trimmed = async (p) => `data:image/png;base64,${(await sharp(p).trim({ threshold: 1 }).png().toBuffer()).toString("base64")}`;
const tl = await trimmed("public/art/peony-top-left.png");
const garland = dataUrl("public/art/garland-bottom.png");

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Pinyon+Script&display=block" rel="stylesheet">`;
const BASE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 600px; background: #fdfbf8; font-family: 'Cormorant Garamond', Georgia, serif; color: #5e4430; -webkit-font-smoothing: antialiased; font-variant-numeric: lining-nums; }
`;

const HERO = `<!doctype html><html><head>${FONTS}<style>${BASE}
  .hero { position: relative; height: 548px; overflow: hidden;
    background: radial-gradient(55% 45% at 50% 58%, #fbf3ec 0%, #fdfbf8 70%); }
  .spray { position: absolute; top: -18px; width: 238px;
    -webkit-mask-image: linear-gradient(to bottom, #000 50%, transparent 86%); mask-image: linear-gradient(to bottom, #000 50%, transparent 86%); }
  .spray.l { left: -22px; }
  .spray.r { right: -22px; transform: scaleX(-1); }
  .text { position: absolute; inset: 158px 0 0; text-align: center; }
  .together { font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #7a5b41; }
  .names { font-family: 'Pinyon Script', cursive; font-size: 58px; line-height: 1.12; color: #8a6a4f; margin-top: 14px; }
  .amp { display: flex; align-items: center; justify-content: center; gap: 16px; font-family: 'Pinyon Script', cursive; font-size: 40px; line-height: 1; color: #a8854e; margin: 2px 0 4px; }
  .amp::before, .amp::after { content: ""; width: 86px; height: 1px; }
  .amp::before { background: linear-gradient(90deg, transparent, #d6c2a0); }
  .amp::after { background: linear-gradient(90deg, #d6c2a0, transparent); }
  .lead { font-style: italic; font-size: 19px; color: #7a5b41; margin-top: 18px; }
  .rule { width: 72px; height: 1px; margin: 20px auto; background: linear-gradient(90deg, transparent, #a8854e, transparent); }
  .date { font-size: 23px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #5e4430; }
  .date sup { font-size: 13px; letter-spacing: 1px; }
</style></head><body><div class="hero">
  <img class="spray l" src="${tl}"><img class="spray r" src="${tl}">
  <div class="text">
    <div class="together">Together with their families</div>
    <div class="names">Linda Todorovski</div>
    <div class="amp">&amp;</div>
    <div class="names" style="margin-top:0">Marko Pupavac</div>
    <div class="lead">invite you to join them as they celebrate their marriage on</div>
    <div class="rule"></div>
    <div class="date">Saturday, May 15<sup>th</sup>, 2027</div>
  </div>
</div></body></html>`;

const FOOTER = `<!doctype html><html><head>${FONTS}<style>${BASE}
  .foot { position: relative; height: 210px; overflow: hidden; }
  .sign { position: absolute; top: 18px; width: 100%; text-align: center; font-family: 'Pinyon Script', cursive; font-size: 34px; color: #8a6a4f; }
  .garland { position: absolute; left: -20px; bottom: -34px; width: 640px; }
</style></head><body><div class="foot">
  <div class="sign">With love, Linda &amp; Marko</div>
  <img class="garland" src="${garland}">
</div></body></html>`;

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  for (const [html, out, height] of [
    [HERO, "public/email/invite-hero.png", 548],
    [FOOTER, "public/email/invite-footer.png", 210],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 600, height } });
    await sharp(png).png({ compressionLevel: 9, palette: false }).toFile(out);
    console.log(`wrote ${out}`);
  }
} finally {
  await browser.close();
}
