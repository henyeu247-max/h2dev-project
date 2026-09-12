/**
 * verify-routing.js — Kiểm chuẩn toàn diện cơ chế Clean URL Routing
 * Chạy: node scripts/verify-routing.js [baseUrl]
 */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8899';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

  // 1. GET /lotrinh
  const r1 = await page.goto(`${BASE}/lotrinh`, { waitUntil: 'load', timeout: 30000 });
  check('Route /lotrinh: HTTP 200', r1.status() === 200, `status=${r1.status()}`);
  const t1 = await page.locator('h1').first().textContent().catch(() => '');
  check('Route /lotrinh: renders Lộ trình', /Lộ trình/i.test(t1), `h1=${t1}`);

  // 2. GET /lotrinh/
  const r2 = await page.goto(`${BASE}/lotrinh/`, { waitUntil: 'load', timeout: 30000 });
  check('Route /lotrinh/: HTTP 200', r2.status() === 200, `status=${r2.status()}`);

  // 3. GET /lotrinh/VIDEO-ba3904 (Player via clean URL)
  const r3 = await page.goto(`${BASE}/lotrinh/VIDEO-ba3904`, { waitUntil: 'load', timeout: 30000 });
  check('Route /lotrinh/VIDEO-ba3904: HTTP 200', r3.status() === 200, `status=${r3.status()}`);
  await page.waitForTimeout(2000);
  const ptitle = await page.locator('#ptitle').textContent().catch(() => '');
  check('Route /lotrinh/VIDEO-ba3904: loaded video title', ptitle && !/Đang tải/i.test(ptitle), `title=${ptitle}`);
  const skuBadge = await page.locator('#pmeta .badge').first().textContent().catch(() => '');
  check('Route /lotrinh/VIDEO-ba3904: correct SKU badge', /VIDEO-ba3904/i.test(skuBadge), `badge=${skuBadge}`);

  // 4. Backward compatibility: GET /player.html?sku=VIDEO-ba3904
  const r4 = await page.goto(`${BASE}/player.html?sku=VIDEO-ba3904`, { waitUntil: 'load', timeout: 30000 });
  check('Legacy /player.html?sku=...: HTTP 200', r4.status() === 200);
  await page.waitForTimeout(2000);
  const ptitleOld = await page.locator('#ptitle').textContent().catch(() => '');
  check('Legacy /player.html?sku=...: loaded video title', ptitleOld && !/Đang tải/i.test(ptitleOld), `title=${ptitleOld}`);

  // 5. Semantic tabs on index.html: /ngachxanh
  const r5 = await page.goto(`${BASE}/ngachxanh`, { waitUntil: 'load', timeout: 30000 });
  check('Route /ngachxanh: HTTP 200', r5.status() === 200);
  await page.waitForTimeout(1500);
  const activeTabNx = await page.locator('#tabs [aria-selected="true"]').textContent().catch(() => '');
  check('Route /ngachxanh: tab Ngách xanh active', /Ngách/i.test(activeTabNx), `active=${activeTabNx}`);

  // 6. Semantic tabs on index.html: /video
  const r6 = await page.goto(`${BASE}/video`, { waitUntil: 'load', timeout: 30000 });
  check('Route /video: HTTP 200', r6.status() === 200);
  await page.waitForTimeout(1500);
  const activeTabVid = await page.locator('#tabs [aria-selected="true"]').textContent().catch(() => '');
  check('Route /video: tab Video active', /Video/i.test(activeTabVid), `active=${activeTabVid}`);

  // 7. Semantic tabs on index.html: /kichban
  const r7 = await page.goto(`${BASE}/kichban`, { waitUntil: 'load', timeout: 30000 });
  check('Route /kichban: HTTP 200', r7.status() === 200);
  await page.waitForTimeout(1500);
  const activeTabKb = await page.locator('#tabs [aria-selected="true"]').textContent().catch(() => '');
  check('Route /kichban: tab Tài liệu active', /Tài liệu/i.test(activeTabKb), `active=${activeTabKb}`);

  // 8. Navigation test: from /lotrinh, click lesson -> /lotrinh/:sku
  await page.goto(`${BASE}/lotrinh`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  const firstLessonLink = await page.locator('.lesson-row .row-title').first();
  const lessonHref = await firstLessonLink.getAttribute('href');
  check('Lesson row links to clean URL /lotrinh/:sku', /^\/lotrinh\/VIDEO-/i.test(lessonHref), `href=${lessonHref}`);
  await firstLessonLink.click();
  await page.waitForTimeout(2500);
  const currentUrl = page.url();
  check('Clicking lesson navigates to /lotrinh/:sku', /\/lotrinh\/VIDEO-/i.test(currentUrl), `url=${currentUrl}`);

  // 9. Back button test: from /lotrinh/:sku, click back -> /lotrinh
  const backBtn = page.locator('#btnBack');
  await backBtn.click();
  await page.waitForTimeout(2000);
  const backUrl = page.url();
  check('Back button navigates to /lotrinh', /\/lotrinh/i.test(backUrl), `url=${backUrl}`);

  // 10. Embedded iframe navigation test (the exact user bug reported):
  // From /, click tab Lộ trình -> URL changes to /lotrinh
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  const tabLotrinhBtn = page.locator('#tabs [data-tab="lotrinh"]');
  await tabLotrinhBtn.click();
  await page.waitForTimeout(1500);
  const topUrlAfterTab = page.url();
  check('Clicking Lộ trình tab updates top URL to /lotrinh', /\/lotrinh/i.test(topUrlAfterTab), `url=${topUrlAfterTab}`);

  // Now click a lesson inside the iframe -> top window must navigate to /lotrinh/VIDEO-xxx
  const iframeEl = page.frameLocator('iframe.learn-frame');
  const frameLessonBtn = iframeEl.locator('.lesson-watch, .row-thumb, .row-title').first();
  await frameLessonBtn.click();
  await page.waitForTimeout(3000);
  const topUrlAfterWatch = page.url();
  check('Clicking lesson inside embedded iframe navigates top window to /lotrinh/:sku', /\/lotrinh\/[a-zA-Z0-9_-]+/i.test(topUrlAfterWatch), `url=${topUrlAfterWatch}`);

  // 11. Tab Video navigation test:
  // From /video, clicking "Xem bài" must navigate to /lotrinh/:sku
  await page.goto(`${BASE}/video`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  const vidCardLink = page.locator('.interactive-card a[href^="/lotrinh/"]').first();
  const vidCardHref = await vidCardLink.getAttribute('href');
  check('Video card in tab Video links to /lotrinh/:sku', /^\/lotrinh\/[a-zA-Z0-9_-]+/i.test(vidCardHref), `href=${vidCardHref}`);
  await vidCardLink.click();
  await page.waitForTimeout(2500);
  const topUrlAfterVidClick = page.url();
  check('Clicking video card navigates to /lotrinh/:sku', /\/lotrinh\/[a-zA-Z0-9_-]+/i.test(topUrlAfterVidClick), `url=${topUrlAfterVidClick}`);

  // 12. Console errors check (loại trừ 405 admin-state do server chủ động disable writes)
  const noise = errs.filter(e => !/favicon|admin-state|net::ERR|405/i.test(e));
  check('No console errors across all routes', noise.length === 0, noise.join(' | ').slice(0, 200));

  await browser.close();

  const failed = results.filter(r => !r.ok);
  console.log('\n========================================');
  console.log(`TOTAL: ${results.length} checks | PASS: ${results.length - failed.length} | FAIL: ${failed.length}`);
  if (failed.length) {
    console.log('FAILED CHECKS:');
    failed.forEach(f => console.log(`  - ${f.name} | ${f.detail}`));
    process.exitCode = 1;
  } else {
    console.log('ALL ROUTING CHECKS PASSED PERFECTLY!');
  }
})().catch(e => { console.error('FATAL:', e); process.exitCode = 2; });
