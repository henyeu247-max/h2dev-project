/* A11y matrix: axe-core scan 5 trang chinh — baseline nghiem thu.
 * Xuat: data/a11y-report.json (violation theo page + impact).
 * Dung xoa file nay (script tam nghiem thu).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const AXE = fs.readFileSync(path.join(__dirname, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const report = { date: '2026-09-29', base: BASE, pages: [] };
const PAGES = ['/', '/rawkenh', '/kenh-mau', '/nhac', '/player.html?sku=VIDEO-DD983D'];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ bypassCSP: true });
  for (const pg of PAGES) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 80)));
    await p.goto(BASE + pg, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(2500);
    await p.addScriptTag({ content: AXE });
    const axe = await p.evaluate(() => axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    }).then(r => r.violations.map(v => ({
      id: v.id, impact: v.impact, nodes: v.nodes.length,
      help: v.help.slice(0, 80),
      sample: v.nodes.slice(0, 2).map(n => (n.target || []).join(' ').slice(0, 80))
    })))).catch(e => [{ id: 'axe-error', impact: 'critical', nodes: 1, help: String(e).slice(0, 120), sample: [] }]);
    const summary = {};
    for (const v of axe) summary[v.impact || 'minor'] = (summary[v.impact || 'minor'] || 0) + v.nodes;
    report.pages.push({ page: pg, violations: axe, summary, pageErrors: errs.length });
    console.log(`${pg} -> ${JSON.stringify(summary)} | pageerror=${errs.length}`);
    await p.close();
  }
  await b.close();
  const total = {};
  for (const pg of report.pages) for (const [k, v] of Object.entries(pg.summary)) total[k] = (total[k] || 0) + v;
  report.totalByImpact = total;
  fs.writeFileSync(path.join(__dirname, 'data', 'a11y-report.json'), JSON.stringify(report, null, 1), 'utf8');
  console.log('TOTAL:', JSON.stringify(total));
  console.log('A11Y-DONE');
})();
