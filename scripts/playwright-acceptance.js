/**
 * playwright-acceptance.js — Nghiệm thu độc lập bằng Playwright (Chromium/WebKit)
 * Cross-check kết quả Puppeteer để chắc chắn không phụ thuộc 1 engine.
 *
 * Chạy: node scripts/playwright-acceptance.js [baseUrl]
 */
const { chromium, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'https://h2dev-learn.tonymmo.com';
const OUT = path.resolve(__dirname, '..', '_internal', 'pw-acceptance');
fs.mkdirSync(OUT, { recursive: true });

const res = [];
const check = (n, ok, d = '') => { res.push({ n, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${n}${d ? ' | ' + d : ''}`); };

(async () => {
  for (const [engineName, engine] of [['chromium', chromium], ['firefox', firefox]]) {
    console.log(`\n===== ENGINE: ${engineName} =====`);
    let browser;
    try {
      browser = await engine.launch();
    } catch (e) {
      console.log(`SKIP | ${engineName} not available: ${e.message.split('\n')[0]}`);
      continue;
    }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
    const bad4xx = [];
    page.on('response', r => { if (r.status() >= 400) bad4xx.push(`${r.status()} ${r.url()}`); });

    // Index
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    check(`${engineName} index title`, /H2DEV/.test(title), title);
    await page.screenshot({ path: path.join(OUT, `${engineName}-01-index.png`) });

    // Player mp4
    await page.goto(`${BASE}/player.html?sku=VIDEO-DD983D`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3500);
    const mp4 = await page.evaluate(() => {
      const el = document.getElementById('pv');
      return el ? { w: el.videoWidth, d: el.duration, src: el.currentSrc || el.src } : null;
    });
    check(`${engineName} mp4 loaded`, !!(mp4 && mp4.w > 0), mp4 ? `${mp4.src.split('/').pop()} ${mp4.w}px ${mp4.d?.toFixed(1)}s` : 'null');

    // Player webm Zoom
    await page.goto(`${BASE}/player.html?sku=ZOOM-02-Chien-luoc-kenh-san-xuat`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3500);
    const webm = await page.evaluate(() => {
      const el = document.getElementById('pv');
      const meta = document.getElementById('pmeta');
      const tl = document.getElementById('transcriptList');
      return {
        w: el?.videoWidth, d: el?.duration, src: el?.currentSrc || el?.src,
        errBadge: meta ? /Không đọc được nguồn phát/.test(meta.innerHTML) : null,
        transcript: tl ? tl.textContent.trim().length : 0
      };
    });
    check(`${engineName} webm Zoom loaded`, !!(webm.w > 0 && !webm.errBadge), `${webm.src?.split('/').pop()} ${webm.w}px ${webm.d?.toFixed(0)}s`);
    check(`${engineName} Zoom transcript rendered`, webm.transcript > 100, `${webm.transcript} chars`);
    await page.screenshot({ path: path.join(OUT, `${engineName}-02-player-zoom.png`) });

    // Learn
    await page.goto(`${BASE}/learn.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    const learn = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.trim(),
      secs: document.querySelectorAll('.mod-sec, section[data-mod]').length,
      rows: document.querySelectorAll('.row-item, .lesson-row, .row-list > *').length
    }));
    check(`${engineName} learn 12 module`, /12/.test(learn.h1 || ''), learn.h1);
    check(`${engineName} learn sections`, learn.secs >= 11, `${learn.secs} sections, ${learn.rows} rows`);
    await page.screenshot({ path: path.join(OUT, `${engineName}-03-learn.png`) });

    // 404 + console
    const real4xx = bad4xx.filter(u => !/favicon/.test(u));
    check(`${engineName} no 4xx`, real4xx.length === 0, real4xx.slice(0, 3).join(' ;; '));
    check(`${engineName} no console errors`, errs.length === 0, errs.slice(0, 3).join(' ;; '));

    await browser.close();
  }

  const okCount = res.filter(r => r.ok).length;
  console.log(`\n================ PLAYWRIGHT SUMMARY: ${okCount}/${res.length} PASS ================`);
  const fails = res.filter(r => !r.ok);
  if (fails.length) { console.log('FAILED:'); fails.forEach(f => console.log('  - ' + f.n)); }
  console.log(`Screenshots: ${OUT}`);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, results: res }, null, 2), 'utf-8');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
