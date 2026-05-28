/**
 * Generate README screenshots for adrianlaynez.dev
 *
 * Usage (from project root):
 *   node docs/screenshots/generate.js
 *
 * Uses your already-installed system Chrome — no downloads needed.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'https://adrianlaynez.dev';
const OUT  = __dirname;   // docs/screenshots/
const W    = 1400;
const H    = 800;

// Common Chrome paths on Windows — tries each until one exists
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
];

const fs = require('fs');
const executablePath = CHROME_PATHS.find(p => { try { return fs.existsSync(p); } catch { return false; } });

if (!executablePath) {
  console.error('Chrome not found. Tried:\n' + CHROME_PATHS.join('\n'));
  process.exit(1);
}

console.log('Using Chrome at:', executablePath);

async function shot(page, name, setup) {
  if (setup) await setup(page);
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    clip: { x: 0, y: 0, width: W, height: H },
  });
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });

  console.log('\n→ Home');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await shot(page, 'home');
  await shot(page, 'home-about', p => p.evaluate(() => window.scrollTo(0, 900)));

  console.log('→ Lab landing');
  await page.goto(`${BASE}/lab`, { waitUntil: 'networkidle2', timeout: 30000 });
  await shot(page, 'lab-landing');

  console.log('→ Bigram chapter');
  await page.goto(`${BASE}/lab/bigram`, { waitUntil: 'networkidle2', timeout: 30000 });
  await shot(page, 'lab-bigram');

  console.log('→ MLP chapter');
  await page.go