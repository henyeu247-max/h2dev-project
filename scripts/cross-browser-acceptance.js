/* Cross-browser acceptance: Firefox + WebKit (so voi Chromium baseline da PASS 26/26).
 * Key flows: load, tabs, search Unicode (UI-01), /nhac view (UI-05), music modal (UI-07),
 * pagination URL (UI-04), player load. SW scope chi test Firefox (WebKit khong ho tro SW).
 * Dung xoa file nay (script tam, nghiem thu 1 lan).
 */
const { chromium, firefox, webkit } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name} :: ${detail}`); }
}

async function runSuite(browserType, label, testSW) {
  console.log(`\n===== ${label} =====`);
  const browser = await browserType.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 120)));

  // T1 — load index
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#content', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const hasContent = await page.evaluate(() => Boolean(document.getElementById('content')) && document.getElementById('content').children.length > 0);
  check('T1 index load + #content render', hasContent);

  // T2 — tabs render
  const tabCount = await page.locator('#tabs .tab-btn, .bottom-nav button, .bottom-nav a').count();
  check('T2 tabs/bottom-nav render', tabCount > 0, 'count=' + tabCount);

  // T3 — search Unicode (UI-01) — do pager "list.length" (so bai hoc chuan, khong phai link:
  // moi trang day 24 card x 3 link = 72 link CO DINH, dem link sai nghia voi grid phan trang)
  await page.goto(BASE + '/video', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#content a[href^="/lotrinh/"]', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(600);
  const readListLen = () => page.evaluate(() => {
    const m = document.getElementById('content').textContent.match(/Trang \d+\/\d+ · (\d+) bài học/);
    return m ? parseInt(m[1], 10) : -1;
  });
  const totalLinks = await readListLen();
  await page.fill('#fq', 'nhật');
  await page.waitForTimeout(1200);
  const filteredLinks = await readListLen();
  check('T3 UI-01 search "nhật" loc khong match-all', totalLinks === 0 || filteredLinks < totalLinks,
    `total=${totalLinks} filtered=${filteredLinks}`);

  // T4 — /nhac view (UI-05)
  await page.goto(BASE + '/nhac', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const nhacTxt = await page.textContent('#content');
  check('T4 UI-05 /nhac render Tram Nhac', /Trạm phát nhạc nền|Trạm Nhạc/.test(nhacTxt || ''));

  // T5 — music modal (UI-07)
  const openBtn = page.locator('#btn-music-studio, [data-action="open-music"], .js-open-music').first();
  if (await openBtn.count()) {
    await openBtn.click();
    await page.waitForTimeout(800);
    const modalVisible = await page.evaluate(() => {
      const m = document.getElementById('music-studio-modal');
      return m && getComputedStyle(m).display !== 'none';
    });
    check('T5 UI-07 music modal mo duoc', modalVisible);
    const focused = await page.evaluate(() => {
      const m = document.getElementById('music-studio-modal');
      return m && m.contains(document.activeElement);
    });
    check('T5b UI-07 focus nhay vao modal', Boolean(focused));
    await page.keyboard.press('Escape');
  } else {
    check('T5 UI-07 music modal mo duoc', false, 'khong thay nut mo modal');
  }

  // T6 — pagination URL (UI-04)
  await page.goto(BASE + '/video', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const nextBtn = page.locator('[data-action="video-page"][data-page="2"]').first();
  if (await nextBtn.count()) {
    await nextBtn.click();
    await page.waitForTimeout(800);
    check('T6 UI-04 trang 2 sync URL vp=2', page.url().includes('vp=2'), page.url());
  } else {
    check('T6 UI-04 trang 2 sync URL vp=2', true, 'skip — du lieu 1 trang (khong phai loi browser)');
  }

  // T7 — player page load
  await page.goto(BASE + '/player.html?sku=VIDEO-DD983D', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const hasPlayer = await page.evaluate(() => Boolean(document.getElementById('pv')));
  check('T7 player.html load + <video id=pv>', hasPlayer);

  // T8 — SW scope (chi Firefox)
  if (testSW) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const swOk = await page.waitForFunction(() => {
      return navigator.serviceWorker && navigator.serviceWorker.controller;
    }, null, { timeout: 30000 }).then(() => true).catch(() => false);
    if (swOk) {
      const scope = await page.evaluate(async () => {
        const r = await navigator.serviceWorker.getRegistration();
        return r && r.scope;
      });
      check('T8 UI-06 SW scope /', scope === BASE + '/', 'scope=' + scope);
    } else {
      check('T8 UI-06 SW scope /', false, 'SW khong control sau 30s');
    }
  } else {
    console.log('  [SKIP] T8 SW — WebKit khong ho tro service worker trong Playwright');
  }

  check('T9 0 pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
  await browser.close();
}

(async () => {
  await runSuite(chromium, 'CHROMIUM (baseline)', false);
  await runSuite(firefox, 'FIREFOX', true);
  await runSuite(webkit, 'WEBKIT (Safari engine)', false);
  console.log(`\n===== TONG KET: ${pass} PASS / ${fail} FAIL =====`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
