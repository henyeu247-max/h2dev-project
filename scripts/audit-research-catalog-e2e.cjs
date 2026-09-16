/**
 * audit-research-catalog-e2e.cjs — Verify tab "Kịch bản & Tài liệu" (Tìm prompt)
 * render 43 entry RESEARCH-* mới từ corpus data/research-20260916/.
 *
 * Chay: node scripts/audit-research-catalog-e2e.cjs
 */
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.H2DEV_BASE || 'http://127.0.0.1:8899';
const OUT = path.join(__dirname, '..', 'docs', 'proof-research-catalog.png');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const netFails = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => netFails.push(r.url()));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('[data-tab="kichban"]');
  await page.waitForSelector('#fq', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Dem tong card tren tab
  const totalCards = await page.locator('article.card').count();

  // Loc theo "RESEARCH-"
  await page.fill('#fq', 'RESEARCH-');
  await page.waitForTimeout(800);
  const researchCards = await page.locator('article.card').count();

  // Dem so the co nut "File local"
  const fileBtns = await page.locator('article.card a:has-text("File local")').count();

  // Kiem 1 card cu the hien thi
  const has3D = await page.locator('article.card', { hasText: '3D Documentary' }).count();

  await page.screenshot({ path: OUT, fullPage: false });

  console.log('=== E2E RESEARCH CATALOG ===');
  console.log('  URL:', BASE, '| tab: kichban');
  console.log('  Tong card (chua loc):', totalCards);
  console.log('  Card sau loc "RESEARCH-":', researchCards, '(ky vong 43)');
  console.log('  Nut "File local":', fileBtns);
  console.log('  Card "3D Documentary" xuat hien:', has3D > 0 ? 'CO' : 'KHONG');
  console.log('  Console errors:', consoleErrors.length);
  console.log('  Network fails:', netFails.length);
  console.log('  Screenshot:', OUT);
  const pass = researchCards === 43 && has3D > 0 && consoleErrors.length === 0 && netFails.length === 0;
  console.log('  =>', pass ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(1); });
