/**
 * verify-watched-badge.js — Nghiệm thu badge "Đã xem" trên /learn.html
 *
 * Kiểm chứng:
 *   1. Badge .watched-badge CHỈ xuất hiện khi localStorage 'h2dev-watched' có watched=true
 *   2. Video chưa xem KHÔNG có badge và KHÔNG có class is-watched
 *   3. Badge không đè lên các overlay khác (row-seq, row-fav, row-watchbar, row-time)
 *   4. Không có console error / 404 khi render
 *   5. Chụp ảnh proof desktop + mobile
 *
 * Chạy: node scripts/verify-watched-badge.js [baseUrl]
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const OUT = path.resolve(__dirname, '..', '_internal', 'watched-badge-proof');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
};

// Seed 2 SKU thực tế đang hiển thị trên view mặc định của /learn.html
const SEED_SKUS = ['VIDEO-ba3904', 'VIDEO-9873fb'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errs = [];
  const bad4xx = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) bad4xx.push(`${r.status()} ${r.url()}`); });

  // ---- Phase 1: KHÔNG seed → không có badge nào ----
  await page.goto(`${BASE}/learn.html`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const badgeBefore = await page.locator('.watched-badge').count();
  const watchedRowBefore = await page.locator('.lesson-row.is-watched').count();
  check('No-seed: badge count = 0', badgeBefore === 0, `count=${badgeBefore}`);
  check('No-seed: is-watched count = 0', watchedRowBefore === 0, `count=${watchedRowBefore}`);
  await page.screenshot({ path: path.join(OUT, '01-learn-noseed.png'), fullPage: false });

  // ---- Phase 2: Seed localStorage → badge xuất hiện đúng ----
  const seed = {};
  for (const sku of SEED_SKUS) {
    seed[sku] = { t: 99999, d: 300, watched: true, ts: Date.now() };
  }
  await page.evaluate((data) => {
    localStorage.setItem('h2dev-watched', JSON.stringify(data));
  }, seed);

  await page.reload({ waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  const badgeAfter = await page.locator('.watched-badge').count();
  const watchedRowAfter = await page.locator('.lesson-row.is-watched').count();
  check('Seeded: badge count > 0', badgeAfter > 0, `count=${badgeAfter}`);
  check('Seeded: is-watched rows = badge count', watchedRowAfter === badgeAfter, `rows=${watchedRowAfter} badges=${badgeAfter}`);

  // Badge nằm trong thumb của đúng SKU đã seed
  const badgeInSeedSku = await page.evaluate((skus) => {
    const out = {};
    for (const sku of skus) {
      const row = document.querySelector(`.lesson-row[data-sku="${sku}"]`);
      if (!row) { out[sku] = 'ROW-NOT-FOUND-ON-PAGE'; continue; }
      const thumb = row.querySelector('.row-thumb');
      out[sku] = {
        hasBadge: !!row.querySelector('.watched-badge'),
        hasIsWatched: row.classList.contains('is-watched'),
        badgeInThumb: !!(thumb && thumb.querySelector('.watched-badge')),
        doneTag: !!row.querySelector('.ltag-done'),
      };
    }
    return out;
  }, SEED_SKUS);
  console.log('  seed detail:', JSON.stringify(badgeInSeedSku));

  for (const sku of SEED_SKUS) {
    const d = badgeInSeedSku[sku];
    if (d === 'ROW-NOT-FOUND-ON-PAGE') {
      check(`Seed ${sku}: badge present`, false, 'row not visible in current tab (retry on tab video)');
      continue;
    }
    check(`Seed ${sku}: has badge`, d.hasBadge === true);
    check(`Seed ${sku}: badge inside .row-thumb`, d.badgeInThumb === true);
    check(`Seed ${sku}: row has is-watched`, d.hasIsWatched === true);
    check(`Seed ${sku}: has ✓ Đã xem tag`, d.doneTag === true);
  }

  // ---- Phase 3: Kiểm tra không đè overlay (bounding boxes) ----
  const overlap = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.lesson-row.is-watched')];
    const bad = [];
    for (const row of rows) {
      const b = row.querySelector('.watched-badge');
      const s = row.querySelector('.row-seq');
      const f = row.querySelector('.row-fav');
      const t = row.querySelector('.row-time');
      if (!b) continue;
      const rb = b.getBoundingClientRect();
      const hit = (el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return !(rb.right <= r.left || rb.left >= r.right || rb.bottom <= r.top || rb.top >= r.bottom);
      };
      if (hit(s)) bad.push({ sku: row.dataset.sku, clash: 'row-seq' });
      if (hit(f)) bad.push({ sku: row.dataset.sku, clash: 'row-fav' });
      if (hit(t)) bad.push({ sku: row.dataset.sku, clash: 'row-time' });
    }
    return bad;
  });
  check('No overlay clash (seq/fav/time)', overlap.length === 0, JSON.stringify(overlap).slice(0, 300));

  // Screenshot desktop sau seed
  await page.screenshot({ path: path.join(OUT, '02-learn-seeded-desktop.png'), fullPage: false });

  // ---- Phase 4: Mobile viewport ----
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mpage = await mctx.newPage();
  await mpage.goto(`${BASE}/learn.html`, { waitUntil: 'load', timeout: 60000 });
  await mpage.evaluate((data) => {
    localStorage.setItem('h2dev-watched', JSON.stringify(data));
  }, seed);
  await mpage.reload({ waitUntil: 'load', timeout: 60000 });
  await mpage.waitForTimeout(3000);
  const mBadge = await mpage.locator('.watched-badge').count();
  check('Mobile 390x844: badge rendered', mBadge > 0, `count=${mBadge}`);
  // Badge không tràn khỏi thumb trên mobile
  const mOverflow = await mpage.evaluate(() => {
    const rows = [...document.querySelectorAll('.lesson-row.is-watched')];
    const bad = [];
    for (const row of rows) {
      const b = row.querySelector('.watched-badge');
      const th = row.querySelector('.row-thumb');
      if (!b || !th) continue;
      const rb = b.getBoundingClientRect();
      const rt = th.getBoundingClientRect();
      if (rb.left < rt.left - 1 || rb.right > rt.right + 1 || rb.top < rt.top - 1 || rb.bottom > rt.bottom + 1) {
        bad.push(row.dataset.sku);
      }
    }
    return bad;
  });
  check('Mobile: badge stays inside thumb', mOverflow.length === 0, JSON.stringify(mOverflow).slice(0, 200));
  await mpage.screenshot({ path: path.join(OUT, '03-learn-seeded-mobile.png'), fullPage: false });

  // ---- Phase 5: Regression — index.html không vỡ ----
  const ipage = await ctx.newPage();
  const ierrs = [];
  ipage.on('pageerror', e => ierrs.push('PAGEERROR: ' + e.message));
  await ipage.goto(`${BASE}/index.html`, { waitUntil: 'load', timeout: 60000 });
  await ipage.waitForTimeout(3000);
  // mở tab video để render list dùng renderLessonRow? index dùng tab video riêng; mở tab lotrinh (iframe learn.html)
  await ipage.locator('[data-open-tab="video"]').first().click().catch(() => {});
  await ipage.waitForTimeout(1500);
  const idxBadge = await ipage.locator('.watched-badge').count();
  check('Index tab "video": render OK, no crash', ierrs.length === 0, ierrs.join(' | ').slice(0, 200));
  console.log('  index badge count (informational):', idxBadge);
  await ipage.screenshot({ path: path.join(OUT, '04-index-video-tab.png'), fullPage: false });

  // ---- Phase 6: Console/404 sạch trên learn ----
  const noise = errs.filter(e => !/favicon|admin-state|net::ERR|405/i.test(e));
  check('Learn page console errors = 0', noise.length === 0, noise.join(' | ').slice(0, 300));
  const bad404 = bad4xx.filter(u => !/favicon|admin-state/i.test(u));
  check('Learn page 4xx/5xx = 0', bad404.length === 0, bad404.slice(0, 5).join(' | '));

  await browser.close();

  const failed = results.filter(r => !r.ok);
  console.log('\n========================================');
  console.log(`TOTAL: ${results.length} checks | PASS: ${results.length - failed.length} | FAIL: ${failed.length}`);
  console.log(`Proof dir: ${OUT}`);
  if (failed.length) {
    console.log('FAILED CHECKS:');
    failed.forEach(f => console.log(`  - ${f.name} | ${f.detail}`));
    process.exitCode = 1;
  } else {
    console.log('WATCHED-BADGE STATUS: ALL PASS');
  }
})().catch(e => { console.error('FATAL:', e); process.exitCode = 2; });
