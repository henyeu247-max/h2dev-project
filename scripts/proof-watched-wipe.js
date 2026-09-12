/**
 * proof-watched-wipe.js — Chứng minh bug: hydrateAdmin() xoá sạch watched data
 * Seed localStorage → reload → đọc lại localStorage + đếm badge.
 * Chạy: node scripts/proof-watched-wipe.js [baseUrl]
 */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();

  const API = await page.request.get(`${BASE}/api/admin-state`).catch(() => null);
  console.log('SERVER /api/admin-state:', API ? await API.text() : 'unreachable');

  await page.goto(`${BASE}/learn.html`, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('h2dev-watched', JSON.stringify({
      'VIDEO-DD983D': { t: 99999, d: 300, watched: true, note: 'test' }
    }));
  });
  const before = await page.evaluate(() => localStorage.getItem('h2dev-watched'));
  console.log('BEFORE reload :', before);

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => localStorage.getItem('h2dev-watched'));
  console.log('AFTER  reload :', after);
  const badges = await page.locator('.watched-badge').count();
  console.log('badge count   :', badges);

  const wiped = (() => { try { return Object.keys(JSON.parse(after)).length === 0; } catch (e) { return false; } })();
  console.log('\nRESULT:', wiped ? 'WIPE CONFIRMED — hydrateAdmin ghi đè localStorage bằng state rỗng' : 'no wipe');

  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exitCode = 1; });
