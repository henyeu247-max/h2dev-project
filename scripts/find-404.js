/**
 * find-404.js — Tìm chính xác URL trả 404 khi duyệt web
 * Chạy: node scripts/find-404.js [baseUrl]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = process.argv[2] || 'https://h2dev-learn.tonymmo.com';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const bad = [];
  page.on('response', res => {
    if (res.status() >= 400) bad.push({ status: res.status(), url: res.url() });
  });

  const pages = [
    '/index.html',
    '/learn.html',
    '/player.html?sku=VIDEO-DD983D',
    '/player.html?sku=ZOOM-01-Nen-tang-moi-truong',
  ];
  for (const p of pages) {
    console.log(`\n--- ${p} ---`);
    bad.length = 0;
    await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    if (!bad.length) console.log('  (no 4xx/5xx)');
    bad.forEach(b => console.log(`  ${b.status} | ${b.url}`));
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
