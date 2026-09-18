/**
 * deep-ui-acceptance.js — Nghiệm thu sâu bằng browser thật (Puppeteer)
 * Kiểm tra: index tabs, player phát video (mp4 + webm), learn route 12 modules,
 * seek video, tra cứu ngách, console errors.
 *
 * Chạy: node scripts/deep-ui-acceptance.js [baseUrl]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'https://h2dev-learn.tonymmo.com';
const OUT = path.resolve(__dirname, '..', '_internal', 'ui-acceptance');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const consoleErrors = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS | ${name}${detail ? ' | ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`FAIL | ${name}${detail ? ' | ' + detail : ''}`);
}

async function main() {
  const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

  // ---------- 1. INDEX ----------
  console.log('\n=== 1. INDEX TAB ===');
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle2', timeout: 60000 });
  const title = await page.title();
  if (title.includes('H2DEV')) pass('1.1 index title', title); else fail('1.1 index title', title);

  await page.screenshot({ path: path.join(OUT, '01-index.png') });

  const tabInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('[data-tab], .tab-btn, nav button'));
    return { count: btns.length, labels: btns.map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 12) };
  });
  if (tabInfo.count >= 8) pass('1.2 index tabs', `${tabInfo.count} tabs: ${tabInfo.labels.join(' | ')}`);
  else fail('1.2 index tabs', `only ${tabInfo.count}`);

  // ---------- 2. PLAYER mp4 ----------
  console.log('\n=== 2. PLAYER (mp4) ===');
  await page.goto(`${BASE}/player.html?sku=VIDEO-DD983D`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  let v = await page.evaluate(() => {
    const el = document.getElementById('pv');
    return el ? {
      src: el.currentSrc || el.src, readyState: el.readyState,
      duration: el.duration, videoWidth: el.videoWidth, error: el.error ? el.error.code : null
    } : null;
  });
  if (v && v.videoWidth > 0) pass('2.1 mp4 video loaded', `src=${v.src.split('/').slice(-1)[0]} ${v.videoWidth}px dur=${v.duration?.toFixed(1)}s`);
  else fail('2.1 mp4 video loaded', JSON.stringify(v));

  await page.screenshot({ path: path.join(OUT, '02-player-mp4.png') });

  // seek test
  const seekOk = await page.evaluate(async () => {
    const el = document.getElementById('pv');
    if (!el || !el.duration) return false;
    el.currentTime = Math.min(30, el.duration * 0.5);
    await new Promise(r => setTimeout(r, 1500));
    return el.currentTime > 1 && el.readyState >= 2;
  });
  if (seekOk) pass('2.2 mp4 seek works'); else fail('2.2 mp4 seek works');

  // ---------- 3. PLAYER webm (Zoom) ----------
  console.log('\n=== 3. PLAYER (webm / Zoom) ===');
  for (const sku of ['ZOOM-01-Nen-tang-moi-truong', 'ZOOM-03-Quy-trinh-tool-toi-uu']) {
    await page.goto(`${BASE}/player.html?sku=${sku}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    const z = await page.evaluate(() => {
      const el = document.getElementById('pv');
      const meta = document.getElementById('pmeta');
      return el ? {
        src: el.currentSrc || el.src, videoWidth: el.videoWidth,
        duration: el.duration, errBadge: meta ? /Không đọc được nguồn phát/.test(meta.innerHTML) : false
      } : null;
    });
    if (z && z.videoWidth > 0 && !z.errBadge) {
      pass(`3.x webm ${sku}`, `src=${z.src.split('/').slice(-1)[0]} ${z.videoWidth}px dur=${z.duration?.toFixed(0)}s`);
    } else {
      fail(`3.x webm ${sku}`, JSON.stringify(z));
    }
  }
  await page.screenshot({ path: path.join(OUT, '03-player-webm.png') });

  // verify no "error badge"
  const badge = await page.evaluate(() => {
    const m = document.getElementById('pmeta');
    return m ? m.innerHTML.includes('Không đọc được nguồn phát') : null;
  });
  if (badge === false) pass('3.y no error badge on Zoom player'); else fail('3.y no error badge', String(badge));

  // ---------- 4. LEARN (route 12 modules) ----------
  console.log('\n=== 4. LEARN / LỘ TRÌNH ===');
  await page.goto(`${BASE}/learn.html`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  const learn = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const secs = document.querySelectorAll('.mod-sec, section[data-mod]');
    return { h1: h1 ? h1.textContent.trim() : null, moduleCount: secs.length };
  });
  if (learn.h1 && learn.h1.includes('12')) pass('4.1 learn header', learn.h1); else fail('4.1 learn header', JSON.stringify(learn.h1));
  if (learn.moduleCount >= 11) pass('4.2 learn modules rendered', `${learn.moduleCount} sections`);
  else fail('4.2 learn modules rendered', `${learn.moduleCount}`);

  await page.screenshot({ path: path.join(OUT, '04-learn.png'), fullPage: false });

  // ---------- 5. NICHE TAB ----------
  console.log('\n=== 5. TAB NGÁCH XANH ===');
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  const nicheOk = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role=tab]'));
    const t = btns.find(b => /ngách/i.test(b.textContent || ''));
    if (t) { t.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 2500));
  const nicheRows = await page.evaluate(() => document.querySelectorAll('.card, .niche, tr, [data-niche]').length);
  if (nicheOk) pass('5.1 niche tab clickable', `${nicheRows} rows`); else fail('5.1 niche tab clickable');

  await page.screenshot({ path: path.join(OUT, '05-niche.png') });

  // ---------- 6. CONSOLE ERRORS ----------
  console.log('\n=== 6. CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) pass('6.1 no console errors');
  else fail('6.1 console errors', `${consoleErrors.length}: ${consoleErrors.slice(0, 3).join(' ;; ')}`);

  await browser.close();

  // ---------- SUMMARY ----------
  const okCount = results.filter(r => r.ok).length;
  console.log(`\n================ SUMMARY: ${okCount}/${results.length} PASS ================`);
  const failures = results.filter(r => !r.ok);
  if (failures.length) {
    console.log('FAILED ITEMS:');
    failures.forEach(f => console.log('  - ' + f.name + ' | ' + f.detail));
  }
  console.log(`Screenshots: ${OUT}`);

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ base: BASE, results, consoleErrors }, null, 2), 'utf-8');
  process.exit(failures.length ? 1 : 0);
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
