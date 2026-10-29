/**
 * find-404.js — Tìm chính xác URL trả 4xx/5xx khi duyệt web.
 * Chạy: node scripts/find-404.js [baseUrl]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = (process.argv[2] || 'http://127.0.0.1:8899').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function readSpaRoutes() {
  const source = fs.readFileSync(path.join(ROOT, 'assets', 'app', 'main.js'), 'utf8');
  const tabsBlock = source.match(/const\s+TABS\s*=\s*\[([\s\S]*?)\n\s*\];/);
  if (!tabsBlock) throw new Error('Khong doc duoc TABS[] tu assets/app/main.js');
  const ids = [...tabsBlock[1].matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  if (!ids.length) throw new Error('TABS[] khong co route nao');
  return ids.map(id => `/${id}`);
}

function readPlayerRoutes(limit = 3) {
  const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'videos.json'), 'utf8'));
  const skus = videos.filter(v => v && v.sku).map(v => v.sku);
  if (!skus.length) throw new Error('data-tabs/videos.json khong co SKU');
  const indexes = [...new Set([0, Math.floor((skus.length - 1) / 2), skus.length - 1])];
  return indexes.slice(0, limit).map(i => `/lotrinh/${encodeURIComponent(skus[i])}`);
}

function buildPages() {
  return [...new Set([...readSpaRoutes(), '/lotrinh', '/graph', ...readPlayerRoutes()])];
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const pages = buildPages();
  const responses = new Set();
  const bad = new Map();
  const navigationErrors = [];

  page.on('response', res => {
    const url = res.url();
    responses.add(url);
    if (res.status() >= 400) bad.set(`${res.status()} ${url}`, { status: res.status(), url });
  });

  try {
    for (const route of pages) {
      console.log(`\n--- ${route} ---`);
      const before = bad.size;
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        navigationErrors.push({ route, message: error.message });
        console.error(`  NAVIGATION ERROR | ${error.message}`);
      }
      if (bad.size === before && !navigationErrors.some(x => x.route === route)) console.log('  (no 4xx/5xx)');
    }
  } finally {
    await browser.close();
  }

  console.log(`\nTong route da mo: ${pages.length}`);
  console.log(`Tong URL response da kiem: ${responses.size}`);
  if (bad.size) {
    console.error(`Tong response 4xx/5xx: ${bad.size}`);
    for (const item of bad.values()) console.error(`  ${item.status} | ${item.url}`);
  }
  if (navigationErrors.length) console.error(`Tong navigation error: ${navigationErrors.length}`);
  process.exitCode = bad.size || navigationErrors.length ? 1 : 0;
}

main().catch(error => { console.error(error); process.exit(1); });
