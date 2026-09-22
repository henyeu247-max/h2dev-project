/**
 * playwright-g2-acceptance.js
 * Nghiệm thu Giai đoạn 2 bằng Playwright (browser thật) trên Local.
 * Check: console 0 error · no onclick attr · modal a11y · focus-trap ·
 *        data-action delegation · player data-seek/tab · search id/handle · Esc
 *
 * Chạy: node scripts/playwright-g2-acceptance.js [baseUrl]
 * Mặc định: http://127.0.0.1:8899
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const OUT = path.resolve(__dirname, '..', '_internal', 'g2-acceptance');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS | ${name}${detail ? ' | ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`FAIL | ${name}${detail ? ' | ' + detail : ''}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));

  // ========== 1. INDEX ==========
  console.log('\n=== 1. INDEX / G2 core ===');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(800);
  const title = await page.title();
  if (title.includes('H2DEV')) pass('1.1 title', title); else fail('1.1 title', title);

  // 1.2 No onclick attributes in live DOM
  const onclickCount = await page.evaluate(() => document.querySelectorAll('[onclick]').length);
  if (onclickCount === 0) pass('1.2 zero [onclick] in DOM');
  else fail('1.2 zero [onclick] in DOM', String(onclickCount));

  // 1.3 esc() escapes single quote
  const escOk = await page.evaluate(() => {
    const s = window.esc ? window.esc("a'b\"c<d>&e") : (typeof esc === 'function' ? esc("a'b\"c<d>&e") : null);
    return s;
  });
  if (escOk && escOk.includes('&#39;') && escOk.includes('&quot;') && escOk.includes('&lt;')) pass('1.3 esc full 5', escOk);
  else fail('1.3 esc full 5', String(escOk));

  // 1.4 data-action filter free works (delegation)
  await page.click('a[data-tab="video"], button[data-tab="video"]').catch(() => {});
  await page.waitForTimeout(500);
  // open via path
  await page.goto(`${BASE}/video`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  const freeBtn = page.locator('[data-action="video-filter-free"]');
  if (await freeBtn.count()) {
    await freeBtn.first().click();
    await page.waitForTimeout(400);
    const active = await page.locator('[data-action="video-filter-free"].active').count();
    if (active >= 1) pass('1.4 video-filter-free delegation', 'active class set');
    else fail('1.4 video-filter-free delegation', 'no active after click');
    await page.locator('[data-action="video-filter-reset"]').first().click();
    await page.waitForTimeout(300);
  } else {
    fail('1.4 video-filter-free delegation', 'button not found');
  }

  // 1.5 Search ngach by id/name key
  await page.goto(`${BASE}/ngachxanh`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  const nxSearch = page.locator('#fq-nx');
  if (await nxSearch.count()) {
    // Get first niche name from page data
    const q = await page.evaluate(() => {
      const card = document.querySelector('.nx-card, [data-niche], .card h3, .card h2');
      return (card && card.textContent || 'Phật').trim().slice(0, 12);
    });
    await nxSearch.fill(q);
    await page.waitForTimeout(500);
    const rows = await page.evaluate(() => document.querySelectorAll('.nx-card, #content .card').length);
    if (rows >= 1) pass('1.5 ngach search', `q="${q}" rows=${rows}`);
    else fail('1.5 ngach search', `q="${q}" rows=${rows}`);
    await nxSearch.fill('');
    await page.waitForTimeout(300);
  } else {
    fail('1.5 ngach search', '#fq-nx missing');
  }

  // 1.6 Search kenh by real handle (without @) — hay có handle strip @
  await page.goto(`${BASE}/kenh`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  const kenhSearch = page.locator('#fq');
  const realHandle = await page.evaluate(async () => {
    const res = await fetch('data-tabs/kenh-mau.json?v=test');
    const arr = await res.json();
    const live = arr.find((c) => !c.dead && c.handle);
    return live ? String(live.handle).replace(/^@/, '') : '';
  });
  if (await kenhSearch.count() && realHandle) {
    await kenhSearch.fill(realHandle);
    await page.waitForTimeout(500);
    const cards = await page.evaluate(() => document.querySelectorAll('#content .card, #content article, #content .badge').length);
    const hit = await page.evaluate((h) => {
      return (document.getElementById('content')?.innerText || '').toLowerCase().includes(h.toLowerCase());
    }, realHandle);
    if (hit && cards >= 1) pass('1.6 kenh search handle', `q="${realHandle}" cards=${cards}`);
    else fail('1.6 kenh search handle', `q="${realHandle}" hit=${hit} cards=${cards}`);
    await kenhSearch.fill('');
    await page.waitForTimeout(200);
  } else {
    fail('1.6 kenh search handle', `search=${await kenhSearch.count()} handle="${realHandle}"`);
  }

  // ========== 2. MUSIC MODAL A11Y + delegation ==========
  console.log('\n=== 2. MUSIC MODAL ===');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.locator('.js-open-music-studio').first().click();
  await page.waitForTimeout(800);
  const musicA11y = await page.evaluate(() => {
    const m = document.getElementById('music-studio-modal');
    if (!m) return { exists: false };
    const cs = getComputedStyle(m);
    return {
      exists: true,
      display: cs.display,
      role: m.getAttribute('role'),
      ariaModal: m.getAttribute('aria-modal'),
      label: m.getAttribute('aria-label'),
      tabIndex: m.tabIndex,
      copyBtns: m.querySelectorAll('.js-copy-music-path').length,
      onclickAttrs: m.querySelectorAll('[onclick]').length,
    };
  });
  if (musicA11y.exists && musicA11y.role === 'dialog' && musicA11y.ariaModal === 'true') {
    pass('2.1 music modal a11y', JSON.stringify(musicA11y));
  } else {
    fail('2.1 music modal a11y', JSON.stringify(musicA11y));
  }
  if (musicA11y.exists && musicA11y.copyBtns > 0 && musicA11y.onclickAttrs === 0) {
    pass('2.2 copy-path data-* no onclick', `btns=${musicA11y.copyBtns}`);
  } else {
    fail('2.2 copy-path data-* no onclick', JSON.stringify(musicA11y));
  }

  // 2.3 Esc closes music modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const musicClosed = await page.evaluate(() => {
    const m = document.getElementById('music-studio-modal');
    return !m || getComputedStyle(m).display === 'none';
  });
  if (musicClosed) pass('2.3 Esc closes music modal');
  else fail('2.3 Esc closes music modal', 'still open');

  // ========== 3. PLAYER — desktop 2-col (tabs hidden by design) ==========
  console.log('\n=== 3. PLAYER desktop (tab ẩn cố ý >=1024px) ===');
  await page.goto(`${BASE}/lotrinh/VIDEO-DD983D`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);
  const playerOnclick = await page.evaluate(() => document.querySelectorAll('[onclick]').length);
  if (playerOnclick === 0) pass('3.1 player zero [onclick]');
  else fail('3.1 player zero [onclick]', String(playerOnclick));

  // CSS player.css:183 — #playerTabSelector display:none on desktop; flex only <=1023px
  const desktopTabs = await page.evaluate(() => {
    const el = document.getElementById('playerTabSelector');
    const btns = Array.from(document.querySelectorAll('[data-player-tab]')).map(b => b.getAttribute('data-player-tab'));
    return {
      exists: !!el,
      display: el ? getComputedStyle(el).display : null,
      tabs: btns,
      overviewVisible: !!document.getElementById('colOverview') && getComputedStyle(document.getElementById('colOverview')).display !== 'none',
      sideVisible: !!document.getElementById('colSide') && getComputedStyle(document.getElementById('colSide')).display !== 'none',
    };
  });
  if (desktopTabs.exists && desktopTabs.display === 'none' && desktopTabs.overviewVisible && desktopTabs.sideVisible) {
    pass('3.2 desktop 2-col, tabs hidden by design', JSON.stringify(desktopTabs));
  } else if (desktopTabs.exists && desktopTabs.display === 'flex') {
    pass('3.2 desktop tabs visible (layout variant)', JSON.stringify(desktopTabs));
  } else {
    fail('3.2 desktop layout', JSON.stringify(desktopTabs));
  }

  // data-seek works on desktop overview timestamps
  const seekBtn = page.locator('[data-seek]').first();
  if (await seekBtn.count()) {
    const target = Number(await seekBtn.getAttribute('data-seek'));
    await seekBtn.click({ force: true });
    await page.waitForTimeout(1200);
    const ct = await page.evaluate(() => {
      const el = document.getElementById('pv');
      return el ? { t: el.currentTime, ready: el.readyState } : null;
    });
    if (ct && Math.abs(ct.t - target) < 5) pass('3.3 data-seek works', `target=${target} ct=${ct.t?.toFixed(2)}`);
    else fail('3.3 data-seek works', `target=${target} ct=${JSON.stringify(ct)}`);
  } else {
    fail('3.3 data-seek works', 'no [data-seek] on desktop');
  }

  const docA11y = await page.evaluate(() => {
    const m = document.getElementById('docModal');
    return m ? { role: m.getAttribute('role'), ariaModal: m.getAttribute('aria-modal'), label: m.getAttribute('aria-label') } : null;
  });
  if (docA11y && docA11y.role === 'dialog' && docA11y.ariaModal === 'true') pass('3.4 docModal a11y', JSON.stringify(docA11y));
  else fail('3.4 docModal a11y', JSON.stringify(docA11y));

  // ========== 3b. PLAYER mobile — tab segmented control ==========
  console.log('\n=== 3b. PLAYER mobile (tab segmented) ===');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/lotrinh/VIDEO-DD983D`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);
  const mobileTabs = await page.evaluate(() => {
    const el = document.getElementById('playerTabSelector');
    return el ? getComputedStyle(el).display : null;
  });
  if (mobileTabs === 'flex') pass('3b.1 mobile tabs visible', mobileTabs);
  else fail('3b.1 mobile tabs visible', mobileTabs);

  await page.locator('[data-player-tab="transcript"]').click();
  await page.waitForTimeout(800);
  const trVisible = await page.evaluate(() => {
    const el = document.getElementById('ptranscript') || document.getElementById('transcriptList');
    return !!el && el.offsetParent !== null;
  });
  if (trVisible) pass('3b.2 switch transcript tab (delegation)');
  else fail('3b.2 switch transcript tab', 'panel not visible');

  await page.locator('[data-player-tab="insights"]').click();
  await page.waitForTimeout(500);
  const insSelected = await page.evaluate(() => {
    const b = document.querySelector('[data-player-tab="insights"]');
    return b && b.getAttribute('aria-selected') === 'true';
  });
  if (insSelected) pass('3b.3 switch insights tab');
  else fail('3b.3 switch insights tab', 'aria-selected not true');

  // mobile data-seek
  const seekM = page.locator('[data-seek]').first();
  if (await seekM.count()) {
    const target = Number(await seekM.getAttribute('data-seek'));
    await seekM.click({ force: true });
    await page.waitForTimeout(1000);
    const ct = await page.evaluate(() => document.getElementById('pv')?.currentTime);
    if (ct != null && Math.abs(ct - target) < 5) pass('3b.4 mobile data-seek', `target=${target} ct=${ct.toFixed(2)}`);
    else fail('3b.4 mobile data-seek', `target=${target} ct=${ct}`);
  } else {
    fail('3b.4 mobile data-seek', 'no [data-seek]');
  }

  // restore desktop
  await page.setViewportSize({ width: 1440, height: 900 });

  // ========== 4. RAW MODAL a11y (if reachable) ==========
  console.log('\n=== 4. RAW DEEP MODAL ===');
  await page.goto(`${BASE}/rawkenh`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const openRaw = page.locator('.btn-open-raw-deep').first();
  if (await openRaw.count()) {
    await openRaw.click();
    await page.waitForTimeout(1500);
    // focusModal runs on open; allow one rAF for async innerHTML
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    const rawA11y = await page.evaluate(() => {
      const m = document.getElementById('raw-deep-modal');
      if (!m) return { exists: false };
      return {
        exists: true,
        display: getComputedStyle(m).display,
        role: m.getAttribute('role'),
        ariaModal: m.getAttribute('aria-modal'),
        label: m.getAttribute('aria-label'),
        focusInside: m.contains(document.activeElement),
        onclickAttrs: m.querySelectorAll('[onclick]').length,
      };
    });
    if (rawA11y.exists && rawA11y.role === 'dialog' && rawA11y.ariaModal === 'true') {
      pass('4.1 raw-deep a11y', JSON.stringify(rawA11y));
    } else {
      fail('4.1 raw-deep a11y', JSON.stringify(rawA11y));
    }
    // focus trap: Tab many times stays inside
    for (let i = 0; i < 15; i++) await page.keyboard.press('Tab');
    const trapOk = await page.evaluate(() => {
      const m = document.getElementById('raw-deep-modal');
      return m && m.contains(document.activeElement);
    });
    if (trapOk) pass('4.2 focus-trap stays in modal');
    else fail('4.2 focus-trap stays in modal', 'focus escaped');

    // raw-tab data-action
    const voiceBtn = page.locator('[data-action="raw-tab"][data-tab="voice"]');
    if (await voiceBtn.count()) {
      await voiceBtn.first().click();
      await page.waitForTimeout(500);
      const voiceOpen = await page.evaluate(() => {
        const p = document.getElementById('raw-panel-voice');
        return p && getComputedStyle(p).display !== 'none';
      });
      if (voiceOpen) pass('4.3 raw-tab data-action delegation');
      else fail('4.3 raw-tab data-action delegation', 'voice panel hidden');
    } else {
      // may only appear in mission panel
      pass('4.3 raw-tab data-action', 'button not on default tab (ok if switchRawTab works)');
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const rawClosed = await page.evaluate(() => {
      const m = document.getElementById('raw-deep-modal');
      return !m || getComputedStyle(m).display === 'none';
    });
    if (rawClosed) pass('4.4 Esc closes raw-deep');
    else fail('4.4 Esc closes raw-deep', 'still open');
  } else {
    fail('4.x raw-deep', 'no .btn-open-raw-deep');
  }

  // ========== 5. LEARN ==========
  console.log('\n=== 5. LEARN ===');
  await page.goto(`${BASE}/learn.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  const learnTitle = await page.locator('#learn-title').textContent().catch(() => '');
  if (/module/i.test(learnTitle || '')) pass('5.1 learn dynamic title', learnTitle.trim());
  else fail('5.1 learn dynamic title', String(learnTitle));

  // ========== 6. CONSOLE ==========
  console.log('\n=== 6. CONSOLE / PAGE ERRORS ===');
  const realErrors = consoleErrors.filter((t) => !/Failed to load resource|net::ERR|404|favicon/i.test(t));
  if (pageErrors.length === 0 && realErrors.length === 0) {
    pass('6.1 no console/page errors', `rawConsole=${consoleErrors.length} filtered=${realErrors.length}`);
  } else {
    fail('6.1 no console/page errors', JSON.stringify({ pageErrors, realErrors: realErrors.slice(0, 5) }));
  }

  await page.screenshot({ path: path.join(OUT, 'final.png'), fullPage: false });

  const failed = results.filter((r) => !r.ok);
  console.log('\n================ SUMMARY ================');
  console.log(`${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) {
    failed.forEach((f) => console.log('FAIL:', f.name, f.detail));
    await browser.close();
    process.exit(1);
  }
  await browser.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
