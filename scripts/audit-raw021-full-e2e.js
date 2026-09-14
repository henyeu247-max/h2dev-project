const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

const BASE = process.env.H2DEV_BASE_URL || 'http://127.0.0.1:8899';
const OUT = 'docs/proof-raw021-full-audit.png';

function assert(cond, msg, details = {}) {
  if (!cond) {
    const err = new Error(msg);
    err.details = details;
    throw err;
  }
}

(async () => {
  const results = { base: BASE, checks: [], consoleErrors: [], failedRequests: [] };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const add = (name, pass, detail = '') => {
    results.checks.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      results.consoleErrors.push(text);
      console.error('CONSOLE_ERROR', text);
    }
  });
  page.on('requestfailed', req => {
    results.failedRequests.push({ url: req.url(), failure: req.failure()?.errorText || '' });
  });

  try {
    const rawUrl = BASE.replace(/\/$/, '') + '/rawkenh';
    await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1800);

    const card = page.locator('article[data-raw-card="RAW-021"]');
    await card.waitFor({ state: 'visible', timeout: 10000 });
    const cardText = await card.innerText();
    add('Card RAW-021 visible', true);
    add('Card title Hidden Planet Docs', cardText.includes('Hidden Planet Docs'), 'title');
    add('Card tags count 36', cardText.includes('36 tags') && !cardText.includes('0 tags'), '36 tags no 0 tags');
    add('Card revenue normalized', cardText.includes('$800 – $2.400/tháng') && !cardText.includes('kênh chững view'), '$800–$2.400');
    add('Card language flag EN', cardText.includes('🇺🇸 EN'), 'flag');

    const promptBtn = card.locator('button:has-text("Xem Prompts & Vũ Khí Tác Chiến")');
    await promptBtn.click();
    await page.waitForTimeout(1600);
    const modal = page.locator('#raw-deep-modal');
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    add('RAW deep modal opens', true);

    const modalText = await modal.innerText();
    const requiredTexts = [
      'Hidden Planet Docs',
      '@HiddenPlanetDocs',
      '91.100',
      '$800 – $2.400/tháng',
      'Voice DNA Studio',
      'Trạm Vũ Khí Tác Chiến',
      'Visual Directive',
      'Khuôn Đúc Kịch Bản',
      'Bao Bì CTR',
      'Top Video Đang Phát Trên YouTube',
      'Sao chép tất cả Tags',
      'YPP Risk Note',
      'Display Rank',
      'Source Rank gốc',
      'Public retention signal — không phải AVD thật',
      'PROXY_ONLY',
      'Điểm tín hiệu công khai',
      'Độ tin cậy: MEDIUM',
      '10/10 video',
      'transcript đầy đủ 10/10',
      'Hồ sơ Benchmark đối thủ đã khóa',
    ];
    // Data Gaps UI (new collapsed-when-resolved design)
    add('Data Gaps block present', modalText.includes('Kiểm định Data Gaps'), 'data gaps block');
    add('Data Gaps all-resolved label', modalText.includes('Hoàn tất') || modalText.includes('resolved'), 'all resolved');
    add('Data Gaps audit timestamp', modalText.includes('14/09/2026'), 'audit timestamp');
    add('Data Gaps human label: Live snapshot', modalText.includes('Live snapshot'), 'live snapshot label');
    add('Data Gaps human label: Thumbnail', modalText.includes('Thumbnail 10/10'), 'thumbnail label');
    add('Data Gaps human label: Retention proxy', modalText.includes('Retention proxy'), 'retention proxy label');
    // Status codes hidden in collapsed mode (tooltip only) — verify NOT rendering as raw text
    add('Data Gaps: status codes collapsed (not raw text)', !modalText.includes('REFRESHED_LIVE_2026_09_14') && !modalText.includes('COMPLETED_SCORED') && !modalText.includes('PROXY_ACCEPTED_FOR_BENCHMARK'), 'status codes collapsed');
    for (const t of requiredTexts) add(`Modal contains: ${t}`, modalText.includes(t), t);
    add('AVD proxy score is 63/100', modalText.includes('63/100'), 'proxy score');
    add('AVD proxy does not claim minutes or percentage', !/AVD\s*[:=]?\s*\d+\s*(phút|%)/i.test(modalText), 'no false AVD claim');
    add('Xóa bỏ triệt để nghiệm thu mù: không còn Sẵn sàng bấm máy', !modalText.includes('Sẵn sàng bấm máy'), 'no blind acceptance');
    add('Giải trình số âm minh bạch trong modal', modalText.includes('thanh lọc') || modalText.includes('Đã lọc'), 'anomaly explained');


    const missionControl = modal.locator('#raw-mission-control');
    await missionControl.waitFor({ state: 'visible', timeout: 10000 });
    add('Mission Control visible', true);

    const copyChecks = [
      ['.btn-copy-visual-prompt', 'Copy Master Shot', 500],
      ['.btn-copy-visual-kit', 'Copy Trọn Bộ Visual Kit', 3000],
      ['.btn-copy-master-prompt', 'Copy Full Master Prompt', 1500],
      ['.btn-copy-thumb-prompt', 'Copy AI Image Prompt', 600],
      ['.btn-copy-full-packaging', 'Copy Trọn Bộ Bao Bì CTR', 1500],
      ['#btn-copy-raw-tags', 'Sao chép tất cả Tags', 500],
      ['.btn-copy-scene', 'Copy Scene', 100],
      ['.btn-copy-context', 'Copy Context', 100],
      ['.btn-copy-speech-block', 'Copy Speech Block', 500],
      ['.btn-copy-combined-prompt', 'Copy Trọn Bộ Audio Prompt', 900],
      ['.btn-copy-voice-design', 'Copy Voice Design', 100],
    ];
    for (const [selector, label, minLen] of copyChecks) {
      const btn = modal.locator(selector).first();
      const count = await btn.count();
      add(`Button exists: ${label}`, count === 1, selector);
      if (count === 1) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click({ timeout: 5000 });
        await page.waitForTimeout(250);
        const text = await page.evaluate(() => navigator.clipboard.readText());
        add(`Clipboard ${label} length >= ${minLen}`, text.length >= minLen, `len=${text.length}`);
        assert(text.length >= minLen, `Clipboard too short for ${label}`, { len: text.length, minLen });
      }
    }

    const topVideoButtons = modal.locator('#raw-top-videos .btn-open-video-sub');
    const subCount = await topVideoButtons.count();
    add('Top video transcript buttons count 10', subCount === 10, `count=${subCount}`);
    assert(subCount === 10, 'Expected 10 top video transcript buttons', { subCount });

    const seen = [];
    for (let i = 0; i < subCount; i++) {
      const btn = topVideoButtons.nth(i);
      const vid = await btn.getAttribute('data-vid');
      seen.push(vid);
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      const transcriptModal = page.locator('#video-transcript-modal');
      await transcriptModal.waitFor({ state: 'visible', timeout: 10000 });
      await transcriptModal.locator('.sub-tab-btn').first().waitFor({ state: 'visible', timeout: 15000 });
      await transcriptModal.locator('#sub-content-body').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForFunction(() => {
        const m = document.getElementById('video-transcript-modal');
        const body = document.getElementById('sub-content-body');
        return m && m.style.display !== 'none' && body && body.innerText && body.innerText.length > 1000;
      }, null, { timeout: 15000 });
      const tText = await transcriptModal.innerText();
      add(`Transcript modal opens ${i + 1}/10 ${vid}`, tText.includes(vid) || tText.length > 1000, `textLen=${tText.length}`);
      const tabTexts = ['Song ngữ 1:1', 'Tiếng Việt', 'Tiếng Gốc', 'Kịch bản AI'];
      for (const tt of tabTexts) add(`Transcript ${vid} has tab ${tt}`, tText.includes(tt), tt);
      const transcriptCopy = transcriptModal.locator('#btn-copy-sub-active');
      await transcriptCopy.click();
      await page.waitForTimeout(150);
      const copiedSub = await page.evaluate(() => navigator.clipboard.readText());
      add(`Transcript ${vid} active tab copy non-empty`, copiedSub.length > 1000, `len=${copiedSub.length}`);
      const closeBtn = transcriptModal.locator('button:has-text("Đóng"), button:has-text("×")').first();
      if (await closeBtn.count()) await closeBtn.click({ timeout: 2000 }).catch(() => {});
      await page.evaluate(() => {
        const m = document.getElementById('video-transcript-modal');
        if (m) {
          m.style.display = 'none';
          m.innerHTML = '';
        }
      });
      await page.waitForTimeout(80);
    }
    add('Transcript opened unique 10 videos', new Set(seen).size === 10, seen.join(','));

    const sopLinks = [
      ['SOP Skill', 'a:has-text("Xem Toàn Bộ SOP Skill Gốc")'],
      ['Repo Code', 'a:has-text("Repo Code")'],
      ['North Effect SOP', 'a:has-text("SOP North Effect")'],
    ];
    for (const [label, selector] of sopLinks) {
      const href = await modal.locator(selector).first().getAttribute('href');
      add(`Link exists: ${label}`, !!href, href || '');
      const resp = await page.request.get(`${BASE}/${href}`);
      add(`HTTP 200: ${label}`, resp.status() === 200, `${resp.status()} ${href}`);
    }

    await missionControl.scrollIntoViewIfNeeded();
    await page.screenshot({ path: OUT, fullPage: false });
    add('Proof screenshot saved', fs.existsSync(OUT), OUT);
    add('No console errors', results.consoleErrors.length === 0, String(results.consoleErrors.length));
    add('No failed local requests', results.failedRequests.filter(r => r.url.startsWith(BASE)).length === 0, String(results.failedRequests.length));

    const pass = results.checks.every(c => c.pass) && results.consoleErrors.length === 0;
    results.pass = pass;
    fs.writeFileSync('docs/proof-raw021-full-audit.json', JSON.stringify(results, null, 2), 'utf8');
    console.log(`FINAL ${pass ? 'PASS' : 'FAIL'} | checks=${results.checks.length}`);
    if (!pass) process.exitCode = 1;
  } catch (err) {
    results.pass = false;
    results.error = { message: err.message, details: err.details || null, stack: err.stack };
    fs.writeFileSync('docs/proof-raw021-full-audit.json', JSON.stringify(results, null, 2), 'utf8');
    console.error('FINAL FAIL', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
