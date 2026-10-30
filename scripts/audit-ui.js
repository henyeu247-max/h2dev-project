#!/usr/bin/env node
/**
 * H2DEV — GATE 13: UI/UX STANDARD VIEWPORT AUDIT (audit-ui.js)
 * ==========================================================================
 * Standalone automated CLI runner for UI/UX standard audits across 6 viewports:
 *   360 (Mobile narrow), 390 (Mobile standard), 768 (Tablet portrait),
 *   820 (Tablet large), 1024 (Desktop small), 1440 (Desktop large).
 *
 * Verifies:
 *   [1] Route accessibility: HTTP 200 on /ngachxanh and /ngach
 *   [2] Zero horizontal overflow (SCAR-020: scrollWidth <= clientWidth on #content & .niche-card)
 *   [3] Zero offscreen unclipped interactive elements (skipping shell containers #panel-root/body/html)
 *   [4] Zero raw template tokens ('undefined', 'null', 'NaN', '[object Object]')
 *   [5] Layout integrity: active tab contains 'Ngách xanh', title contains 'Ngách xanh — 97yo-dev', cardCount === 12
 *   [6] Typography & touch target audit metrics reporting
 *   [7] Zero uncaught pageerror and console errors
 * ==========================================================================
 */

const { chromium } = require('playwright');

const BASE = (process.env.H2_GATE_BASE || 'http://127.0.0.1:8899').replace(/\/+$/, '');

const VIEWPORTS = [
  { width: 360, height: 640, name: '360 Mobile S' },
  { width: 390, height: 844, name: '390 Mobile Std' },
  { width: 768, height: 1024, name: '768 Tablet' },
  { width: 820, height: 1180, name: '820 Tablet L' },
  { width: 1024, height: 768, name: '1024 Desktop S' },
  { width: 1440, height: 900, name: '1440 Desktop L' },
];

const ROUTES = ['/ngachxanh', '/ngach'];

/**
 * DOM evaluation function based on ui-ux-standard methodology.
 */
function runDomAudit() {
  // Automatically open all <details> drawers to audit drawer contents
  document.querySelectorAll('details').forEach(d => { d.open = true; });

  const cs = (el) => getComputedStyle(el);
  const px = (v) => parseFloat(v) || 0;
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden' || px(s.opacity) === 0) return false;
    return !el.closest('[hidden],[aria-hidden="true"],.sr-only');
  };
  const text = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const pack = (arr) => ({ count: arr.length, samples: arr.slice(0, 8) });

  const root = document.body;
  const out = {};
  out.viewport = [window.innerWidth, window.innerHeight];

  // Overflow detection: evaluate on documentElement, #content, and .niche-card directly
  // so horizontal overflow is not masked by overflow-x: hidden on root shell containers.
  const docOverflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const contentEl = document.querySelector('#content');
  const contentOverflow = contentEl ? Math.max(0, contentEl.scrollWidth - contentEl.clientWidth) : 0;
  let cardMaxOverflow = 0;
  for (const c of document.querySelectorAll('.niche-card')) {
    const diff = c.scrollWidth - c.clientWidth;
    if (diff > cardMaxOverflow) cardMaxOverflow = diff;
  }
  out.overflowX = Math.max(docOverflow, contentOverflow, cardMaxOverflow);
  out.contentOverflow = contentOverflow;
  out.cardMaxOverflow = cardMaxOverflow;

  const textEls = [...root.querySelectorAll('*')].filter((el) =>
    isVisible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));

  const sizes = {};
  let under12 = 0;
  for (const el of textEls) {
    const s = cs(el);
    const fs = Math.round(px(s.fontSize) * 10) / 10;
    sizes[fs] = (sizes[fs] || 0) + 1;
    if (fs < 12) under12 += 1;
  }
  out.textElements = textEls.length;
  out.distinctSizes = Object.keys(sizes).length;
  out.under12Count = under12;

  // Offscreen detection: do NOT treat #panel-root, #app, body, or html as clipping boundaries
  const offscreen = [];
  for (const el of root.querySelectorAll('*')) {
    if (!isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= window.innerWidth + 1) continue;
    let clipped = false;
    for (let n = el.parentElement; n && n.id !== 'panel-root' && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (n.classList.contains('app-shell') || n.id === 'app') continue;
      const ox = cs(n).overflowX;
      if (ox !== 'visible') {
        clipped = true;
        break;
      }
    }
    if (!clipped) offscreen.push(el.tagName.toLowerCase() + ' ' + text(el) + ` (right=${Math.round(r.right)})`);
  }
  out.offscreen = pack(offscreen);

  const tokens = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (!t || !/(^|\s)(undefined|null|NaN)(\s|$)|\[object Object\]/.test(t)) continue;
    const el = node.parentElement;
    if (!el || el.closest('script,style,noscript,template') || !isVisible(el)) continue;
    tokens.push(t.slice(0, 40));
  }
  out.rawTokens = pack(tokens);

  const small = [];
  let below44 = 0;
  const contentScope = document.querySelector('#content') || root;
  for (const el of contentScope.querySelectorAll('button,a[href],input,select,textarea,summary,[role="button"],[role="tab"],[role="switch"]')) {
    if (!isVisible(el) || el.matches('[class*="skip"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) below44 += 1;
    if (r.width < 24 || r.height < 24) small.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + text(el));
  }
  out.smallTargets = pack(small);
  out.targetsBelow44 = below44;

  out.activeTab = document.querySelector('.tab-btn.active')?.textContent?.trim() || '';
  out.title = document.title || '';
  out.cardCount = document.querySelectorAll('.niche-card').length;

  return out;
}

async function run() {
  console.log('================ GATE 13: UI/UX AUDIT RUNNER ================');
  console.log(`Base URL: ${BASE}`);
  console.log(`Target Routes: ${ROUTES.join(', ')}`);
  console.log(`Testing 6 viewports: ${VIEWPORTS.map(v => v.width + 'x' + v.height).join(', ')}\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error(`[FAIL] Could not launch Playwright Chromium: ${err.message}`);
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  for (const route of ROUTES) {
    console.log(`--- Auditing Route: ${route} ---`);
    for (const vp of VIEWPORTS) {
      totalTests++;
      const tag = `[${route} @ ${vp.name}]`;
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();

      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      try {
        const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
        const status = res ? res.status() : 0;
        if (status !== 200) {
          failures.push(`${tag} HTTP status error: expected 200, got ${status}`);
          continue;
        }

        const metrics = await page.evaluate(runDomAudit);

        // Verification checks
        const errors = [];
        if (!metrics.activeTab.includes('Ngách xanh')) {
          errors.push(`Active tab mismatch: expected to include 'Ngách xanh', got '${metrics.activeTab}'`);
        }
        if (!metrics.title.includes('Ngách xanh — 97yo-dev')) {
          errors.push(`Page title mismatch: expected to include 'Ngách xanh — 97yo-dev', got '${metrics.title}'`);
        }
        if (metrics.cardCount !== 12) {
          errors.push(`cardCount mismatch: expected 12 .niche-card elements on page 1, got ${metrics.cardCount}`);
        }
        if (metrics.overflowX > 0) {
          errors.push(`Horizontal overflow detected: scrollWidth exceeds clientWidth by ${metrics.overflowX}px (content: ${metrics.contentOverflow}px, card: ${metrics.cardMaxOverflow}px)`);
        }
        if (metrics.offscreen.count > 0) {
          errors.push(`Offscreen unclipped elements: ${metrics.offscreen.count} (samples: ${metrics.offscreen.samples.join('; ')})`);
        }
        if (metrics.rawTokens.count > 0) {
          errors.push(`Raw template tokens detected: ${metrics.rawTokens.count} (${metrics.rawTokens.samples.join(', ')})`);
        }
        if (metrics.smallTargets.count > 0) {
          errors.push(`Interactive touch targets below 24px in #content: ${metrics.smallTargets.count} (${metrics.smallTargets.samples.join(', ')})`);
        }
        if (pageErrors.length > 0) {
          errors.push(`Page errors detected: ${pageErrors.join('; ')}`);
        }
        if (consoleErrors.length > 0) {
          errors.push(`Console errors detected: ${consoleErrors.join('; ')}`);
        }

        if (errors.length > 0) {
          failures.push(`${tag} ${errors.join(' | ')}`);
          console.log(`  [FAIL] ${vp.name.padEnd(16)}: ${errors.join('; ')} [metrics: smallTargets=${metrics.smallTargets.count}, below44=${metrics.targetsBelow44}, under12=${metrics.under12Count}, sizes=${metrics.distinctSizes}]`);
        } else {
          passedTests++;
          console.log(`  [PASS] ${vp.name.padEnd(16)}: overflowX=${metrics.overflowX} | cards=${metrics.cardCount} | smallTargets=${metrics.smallTargets.count} | below44=${metrics.targetsBelow44} | under12=${metrics.under12Count} | sizes=${metrics.distinctSizes}`);
        }
      } catch (err) {
        failures.push(`${tag} Exception: ${err.message}`);
        console.log(`  [FAIL] ${vp.name.padEnd(16)}: ${err.message}`);
      } finally {
        await context.close();
      }
    }
    console.log('');
  }

  await browser.close();

  console.log('================ SUMMARY ================');
  console.log(`Audited: ${totalTests} checks across ${ROUTES.length} routes and ${VIEWPORTS.length} viewports.`);
  console.log(`Passed:  ${passedTests}/${totalTests}`);

  if (failures.length > 0) {
    console.error(`\nGATE 13 FAILED with ${failures.length} issues:`);
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
  }

  console.log('\n================ GATE 13: ALL PASS (EXIT 0) ================\n');
  process.exit(0);
}

run();
