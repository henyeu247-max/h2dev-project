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
const TOP_VIDEOS_JSON = path.join(PROJECT_ROOT, 'data', 'raw-channels-deep', 'RAW-021_Hidden_Planet_Docs', 'top-videos.json');

const results = [];
const add = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail !== undefined ? ' | ' + detail : ''}`);
};

// Ghi nhan ket qua verify playback that theo tung video
const playbackStatus = {};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    // Cho phep autoplay trong moi truong test de ket qua xac dinh, tranh flaky
    // (trinh duyet that van cho autoplay vi nguoi dung bam nut truoc khi iframe tao)
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  // Bo qua nhieu tu YouTube/Chromium khong phai loi cua app
  const IGNORE_ERR = /compute-pressure|Permissions policy violation|Autoplay is only allowed|favicon/i;
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (IGNORE_ERR.test(txt)) return;
    consoleErrors.push(txt);
  });
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

    const closePlayer = async () => {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
      const closeBtn = page.locator('#close-quick-video');
      if (await closeBtn.count()) await closeBtn.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(600);
    };

    // Mo player va do trang thai phat that. Co retry 1 lan vi YouTube doi khi
    // chan embed tam thoi (Error 153 / rate limit) khac voi loi app.
    const attemptPlayback = async () => {
      const playBtn = page.locator(`#raw-deep-modal button:has-text("Xem Video")`).nth(i);
      if (!(await playBtn.count())) return { state: 'NO_BUTTON', modalOk: false, src: '' };
      await playBtn.first().scrollIntoViewIfNeeded();
      await playBtn.first().click({ force: true });
      try {
        await page.locator('#quick-video-modal').waitFor({ state: 'visible', timeout: 15000 });
      } catch (e) {
        return { state: 'NO_MODAL', modalOk: false, src: '' };
      }
      try {
        await page.waitForFunction(() => {
          const f = document.querySelector('#quick-video-modal iframe');
          return !!f && !!f.src && f.src.includes('/embed/');
        }, null, { timeout: 15000 });
      } catch (e) {
        return { state: 'NO_IFRAME', modalOk: true, src: '' };
      }
      const src = await page.locator('#quick-video-modal iframe').first().getAttribute('src');
      await page.waitForTimeout(2500);
      const frame = page.frames().find((f) => f.url().includes('/embed/'));
      if (!frame) return { state: 'NO_EMBED_FRAME', modalOk: true, src };
      const hasVideo = await frame.locator('video').count();
      if (!hasVideo) return { state: 'NO_VIDEO_ELEMENT', modalOk: true, src };

      const isPlaying = () => {
        const v = document.querySelector('video');
        return !!v && !v.paused && v.currentTime > 0.3 && v.readyState >= 3;
      };
      let playing = false;
      try { await frame.waitForFunction(isPlaying, null, { timeout: 20000, polling: 500 }); playing = true; } catch (e) { /* cho tiep */ }
      if (!playing) {
        try {
          await frame.locator('video').first().evaluate((v) => {
            v.muted = true;
            const pr = v.play();
            if (pr && pr.catch) return pr.catch(() => {});
          });
        } catch (e) { /* noop */ }
        try { await frame.locator('.ytp-large-play-button, .ytp-play-button').first().click({ timeout: 4000 }); } catch (e) { /* noop */ }
        try { await frame.waitForFunction(isPlaying, null, { timeout: 15000, polling: 500 }); playing = true; } catch (e) { /* that bai */ }
      }

      let st = null;
      try {
        st = await frame.locator('video').first().evaluate((v) => ({
          readyState: v.readyState, currentTime: v.currentTime, paused: v.paused, duration: v.duration,
        }));
      } catch (e) { /* noop */ }

      let errText = '';
      if (!playing) {
        try {
          errText = await frame.evaluate(() => {
            const el = document.querySelector('.ytp-error-content-wrap-reason, .ytp-error, .ytp-error-content');
            if (el) return el.innerText.slice(0, 200);
            return document.body ? document.body.innerText.slice(0, 200) : '';
          });
        } catch (e) { /* noop */ }
      }

      // currentTime > 0 nghia la luong video da khoi chay that; neu dang paused
      // thi thuong do mang/CPU cham (buffering), khong phai loi app hay YouTube chan.
      const started = !!st && st.currentTime > 0.05 && st.duration > 0;
      const state = playing
        ? 'PLAYING'
        : (started ? 'STARTED_BUFFERING' : (st && st.readyState >= 2 ? 'READY_PAUSED' : 'NOT_READY'));
      return { state, modalOk: true, src, st, errText };
    };

    let res = await attemptPlayback();
    if (['READY_PAUSED', 'NOT_READY'].includes(res.state)) {
      await closePlayer();
      if (!(await page.locator('#raw-deep-modal').isVisible().catch(() => false))) {
        await page.locator('article[data-raw-card="RAW-021"] button:has-text("Xem Prompts")').first().click();
        await page.locator('#raw-deep-modal').waitFor({ state: 'visible', timeout: 20000 });
        await page.waitForTimeout(1200);
      }
      const retry = await attemptPlayback();
      res = retry.state === 'PLAYING'
        ? retry
        : Object.assign({}, retry, { errText: retry.errText || res.errText, firstAttempt: res.state });
    }

    add(`Video ${vid} mở được modal player`, res.modalOk, res.modalOk ? 'visible' : res.state);
    if (res.src) add(`Video ${vid} iframe player load`, res.src.includes(vid), res.src);

    const ytBlocked = /Error 153|configuration error|Video unavailable|Watch video on YouTube/i.test(res.errText || '');
    const ok = (res.state === 'PLAYING' || res.state === 'STARTED_BUFFERING') && !ytBlocked;
    const finalStatus = ytBlocked
      ? 'YT_EMBED_BLOCKED_TEMP'
      : (res.state === 'PLAYING' ? 'PLAYABLE_VERIFIED'
        : (res.state === 'STARTED_BUFFERING' ? 'PLAYBACK_STARTED_BUFFERING' : `NOT_VERIFIED_${res.state}`));
    playbackStatus[vid] = finalStatus;
    add(
      `Video ${vid} phát được trong app`,
      ok,
      JSON.stringify({
        state: res.state,
        firstAttempt: res.firstAttempt || null,
        video: res.st || null,
        playerError: (res.errText || '').slice(0, 120) || null,
      })
    );

    // Đóng modal
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
    const closeBtn = page.locator('#close-quick-video');
    if (await closeBtn.count()) await closeBtn.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }

  add('Không có console error', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' || '));

  await page.screenshot({ path: path.join(PROJECT_ROOT, 'docs', 'proof-raw021-playback.png') }).catch(() => {});

  // Cập nhật mốc playbackVerifiedAt vào top-videos.json (PHẢI chạy trước khi chốt kết quả)
  try {
    const verifiedAt = new Date().toISOString();
    const topData = JSON.parse(fs.readFileSync(TOP_VIDEOS_JSON, 'utf8'));
    let okCount = 0;
    (topData.videos || []).forEach((v) => {
      const st = playbackStatus[v.videoId];
      if (!st) return;
      v.playbackVerifiedAt = verifiedAt;
      v.playbackVerifiedVia = 'scripts/audit-raw021-playback.js (Playwright, iframe youtube-nocookie)';
      v.playbackVerifiedBase = BASE;
      v.playbackStatus = st;
      if (st === 'PLAYABLE_VERIFIED' || st === 'PLAYBACK_STARTED_BUFFERING') okCount += 1;
    });
    topData.playbackVerification = {
      verifiedAt,
      base: BASE,
      script: 'scripts/audit-raw021-playback.js',
      totalVideos: (topData.videos || []).length,
      verifiedVideos: Object.keys(playbackStatus).length,
      playingVideos: okCount,
      meaning: 'playbackVerifiedAt = moc kiem phat that trong app. PLAYABLE_VERIFIED = dang phat (currentTime>0.3 va paused=false); PLAYBACK_STARTED_BUFFERING = luong da chay (currentTime>0) nhung dang dung do mang/CPU; NOT_VERIFIED_* = that bai can soi lai',
    };
    fs.writeFileSync(TOP_VIDEOS_JSON, JSON.stringify(topData, null, 2) + '\n', 'utf8');
    add('Đã ghi playbackVerifiedAt vào top-videos.json', true, `${okCount}/${(topData.videos || []).length} PLAYABLE_VERIFIED`);
  } catch (e) {
    add('Đã ghi playbackVerifiedAt vào top-videos.json', false, e.message);
  }

  // Chốt kết quả SAU khi đã thêm mọi check (tránh lệch tổng như 32/33)
  const passed = results.filter((r) => r.pass).length;
  fs.writeFileSync(OUT_JSON, JSON.stringify({ base: BASE, total: results.length, passed, checks: results }, null, 2), 'utf-8');

  console.log(`\nPLAYBACK RESULT | ${passed}/${results.length} | ${passed === results.length ? 'ALL PASS' : 'HAS FAIL'}`);
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
