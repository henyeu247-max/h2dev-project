/* Web Vitals baseline: LCP / CLS / TBT (PerformanceObserver) cho 5 trang, local + production.
 * Chi GHI NHAN baseline — khong toi uu trong phien nay.
 * Xuat: data/web-vitals-baseline.json
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGES = ['/', '/rawkenh', '/kenh-mau', '/nhac', '/player.html?sku=VIDEO-DD983D'];
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : ['http://127.0.0.1:8899', 'https://h2dev-learn.tonymmo.com'];

async function measure(base, pagePath, browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, tbt: 0 };
    new PerformanceObserver(l => { const e = l.getEntries(); if (e.length) window.__vitals.lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__vitals.tbt += (e.duration - 50); }).observe({ type: 'longtask', buffered: true });
  });
  const t0 = Date.now();
  await p.goto(base + pagePath, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(4000);
  const v = await p.evaluate(() => window.__vitals).catch(() => null);
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { ttfb: Math.round(n.responseStart), domContentLoaded: Math.round(n.domContentLoadedEventEnd) } : null; }).catch(() => null);
  await ctx.close();
  return { page: pagePath, lcpMs: v ? Math.round(v.lcp) : null, cls: v ? +v.cls.toFixed(3) : null, tbtMs: v ? Math.round(v.tbt) : null, loadMs: Date.now() - t0, ...nav };
}

(async () => {
  const browser = await chromium.launch();
  const report = { date: '2026-09-29', note: 'Lab metrics (Playwright chromium, 1280x800). Targets: LCP<2500, CLS<0.1, TBT<200', targets: {} };
  for (const base of TARGETS) {
    report.targets[base] = [];
    console.log('=== ' + base + ' ===');
    for (const pg of PAGES) {
      const m = await measure(base, pg, browser);
      report.targets[base].push(m);
      console.log(`${pg}: LCP=${m.lcpMs}ms CLS=${m.cls} TBT=${m.tbtMs}ms load=${m.loadMs}ms`);
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'data', 'web-vitals-baseline.json'), JSON.stringify(report, null, 1), 'utf8');
  console.log('VITALS-DONE');
})();
