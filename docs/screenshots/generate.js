/**
 * Generate README screenshots for adrianlaynez.dev
 *
 * Usage:
 *   npm install playwright
 *   node docs/screenshots/generate.js
 *
 * Outputs:
 *   docs/screenshots/home.png
 *   docs/screenshots/home-about.png
 *   docs/screenshots/lab-landing.png
 *   docs/screenshots/lab-bigram.png
 *   docs/screenshots/lab-mlp.png
 *   docs/screenshots/lab-mlp-interactive.png
 *   docs/screenshots/latent-space-essays.png
 *   docs/screenshots/latent-space-mind.png
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE = 'https://adrianlaynez.dev';
const OUT  = path.join(__dirname);
const W    = 1400;
const H    = 800;

async function shot(page, name, setup) {
  if (setup) await setup(page);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`✓ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  // Home — hero
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, 'home');

  // Home — about/bento section
  await shot(page, 'home-about', p => p.evaluate(() => window.scrollTo(0, 900)));

  // Lab landing
  await page.goto(`${BASE}/lab`, { waitUntil: 'networkidle' });
  await shot(page, 'lab-landing');

  // Bigram chapter
  await page.goto(`${BASE}/lab/bigram`, { waitUntil: 'networkidle' });
  await shot(page, 'lab-bigram');

  // MLP chapter — hero
  await page.goto(`${BASE}/lab/mlp`, { waitUntil: 'networkidle' });
  await shot(page, 'lab-mlp');

  // MLP chapter — first interactive block
  await shot(page, 'lab-mlp-interactive', p => p.evaluate(() => window.scrollTo(0, 1600)));

  // Latent Space — essays mode
  await page.goto(`${BASE}/latent-space`, { waitUntil: 'networkidle' });
  await shot(page, 'latent-space-essays');

  // Latent Space — mind mode
  await page.goto(`${BASE}/latent-space?mode=mind`, { waitUntil: 'networkidle' });
  await shot(page, 'latent-space-mind');

  await browser.close();
  console.log('\nDone. Commit docs/screenshots/ and push.');
})();
