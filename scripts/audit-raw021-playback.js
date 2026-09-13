/**
 * Audit thực tế từng nút "Xem Video" / thumbnail của RAW-021 Hidden Planet Docs.
 * Mục tiêu: xác định video nào THẬT SỰ phát được trong app (không chỉ public trên YouTube).
 * Chạy: node scripts/audit-raw021-playback.js  (H2DEV_BASE_URL có thể override)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

const BASE = process.env.H2DEV_BASE_URL || 'http://127.0.0.1:8899';
const OUT_JSON = path.join(PROJECT_ROOT, 'docs', 'proof-raw021-playback.json');

const results = [];
const add = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail !== undefined ? ' | ' + detail : ''}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));

  await page.goto(`${BASE}/rawkenh`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.locator('article[data-raw-card="RAW-021"] button:has-text("Xem Prompts")').first().click();
  await page.locator('#raw-deep-modal').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1500);

  const videoIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#raw-deep-modal [data-vid]'))
      .map((el) => el.getAttribute('data-vid'))
      .filter((v, i, a) => v && a.indexOf(v) === i);
  });
  add('Lấy được danh sách video trong modal', videoIds.length === 10, `count=${videoIds.length}`);

  for (let i = 0; i < videoIds.length; i++) {
    const vid = videoIds[i];
    // Mở lại modal RAW nếu đã bị đóng
    if (!(await page.locator('#raw-deep-modal').isVisible().catch(() => false))) {
      await page.locator('article[data-raw-card="RAW-021"] button:has-text("Xem Prompts")').first().click();
      await page.locator('#raw-deep-modal').waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForTimeout(1200);
    }

    const playBtn = page.locator(`#raw-deep-modal button:has-text("Xem Video")`).nth(i);
    const hasBtn = await playBtn.count();
    if (!hasBtn) { add(`Video ${vid} có nút Xem Video`, false, 'missing button'); continue; }
    await playBtn.first().scrollIntoViewIfNeeded();
    await playBtn.first().click({ force: true });

    let modalOk = false;
    try {
      await page.locator('#quick-video-modal').waitFor({ state: 'visible', timeout: 15000 });
      modalOk = true;
    } catch (e) { /* noop */ }
    add(`Video ${vid} mở được modal player`, modalOk, modalOk ? 'visible' : 'timeout');

    if (!modalOk) continue;

    // Chờ iframe xuất hiện
    let frameOk = false;
    let iframeSrc = '';
    try {
      await page.waitForFunction(() => {
        const f = document.querySelector('#quick-video-modal iframe');
        return !!f && !!f.src && f.src.includes('/embed/');
      }, null, { timeout: 15000 });
      iframeSrc = await page.locator('#quick-video-modal iframe').first().getAttribute('src');
      frameOk = true;
    } catch (e) { /* noop */ }
    add(`Video ${vid} iframe player load`, frameOk && iframeSrc.includes(vid), iframeSrc || 'no src');

    // Đợi frame YouTube attach và thử phát
    let playState = 'NO_FRAME';
    try {
      await page.waitForTimeout(3000);
      const frame = page.frames().find((f) => f.url().includes('/embed/'));
      if (frame) {
        playState = 'FRAME_NO_VIDEO';
        const hasVideo = await frame.locator('video').count();
        if (hasVideo) {
          // Thử phát chủ động (click vào player) nếu autoplay bị chặn
          try { await frame.locator('video').first().evaluate((v) => { v.muted = true; const p = v.play(); if (p && p.catch) return p.catch(() => {}); }); } catch (e) { /* noop */ }
          await page.waitForTimeout(4000);
          const st = await frame.locator('video').first().evaluate((v) => ({
            readyState: v.readyState, currentTime: v.currentTime, paused: v.paused, duration: v.duration,
          }));
          playState = st.currentTime > 0 && !st.paused
            ? 'PLAYING'
            : (st.readyState >= 2 ? 'READY_PAUSED' : 'NOT_READY');
          add(`Video ${vid} phát được trong app`, playState === 'PLAYING', JSON.stringify(st));
        } else {
          add(`Video ${vid} phát được trong app`, false, 'không tìm thấy thẻ video trong iframe');
        }
      } else {
        add(`Video ${vid} phát được trong app`, false, 'không có frame embed');
      }
    } catch (e) {
      add(`Video ${vid} phát được trong app`, false, 'ERR ' + e.message);
    }

    // Đóng modal
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
    const closeBtn = page.locator('#close-quick-video');
    if (await closeBtn.count()) await closeBtn.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }

  add('Không có console error', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' || '));

  await page.screenshot({ path: path.join(PROJECT_ROOT, 'docs', 'proof-raw021-playback.png') }).catch(() => {});

  const passed = results.filter((r) => r.pass).length;
  fs.writeFileSync(OUT_JSON, JSON.stringify({ base: BASE, total: results.length, passed, checks: results }, null, 2), 'utf-8');
  console.log(`\nPLAYBACK RESULT | ${passed}/${results.length} | ${passed === results.length ? 'ALL PASS' : 'HAS FAIL'}`);
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
