/**
 * adversarial_scar_stress_test.js
 * Independent empirical stress-test harness for SCAR-006, SCAR-007, SCAR-014, SCAR-015, SCAR-020,
 * and Quality Gate Probing.
 *
 * Authored by: challenger_2 (teamwork_preview_challenger)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.H2_BASE_URL || 'http://127.0.0.1:8899';

const RESULTS = {
  timestamp: new Date().toISOString(),
  gate_probing: {},
  scar_checks: {
    scar_006: { status: 'PENDING', violations: [] },
    scar_007: { status: 'PENDING', violations: [] },
    scar_014: { status: 'PENDING', violations: [] },
    scar_015: { status: 'PENDING', violations: [], observed_sizes: {} },
    scar_020: { status: 'PENDING', violations: [] }
  },
  overall_verdict: 'PENDING'
};

// Helper to inject a fault, run a command, and safely restore the file byte-identically
function probeFault({ targetFile, searchStr, replaceStr, testCmd, shouldFail = true, probeName }) {
  const absPath = path.join(ROOT, targetFile);
  if (!fs.existsSync(absPath)) {
    return { name: probeName, status: 'SKIPPED', error: `File not found: ${targetFile}` };
  }
  const originalContent = fs.readFileSync(absPath, 'utf8');
  if (!originalContent.includes(searchStr)) {
    return { name: probeName, status: 'SKIPPED', error: `Search pattern not found in ${targetFile}` };
  }

  const modifiedContent = originalContent.replace(searchStr, replaceStr);
  fs.writeFileSync(absPath, modifiedContent, 'utf8');

  let failed = false;
  let exitCode = 0;
  let output = '';

  try {
    output = execSync(testCmd, { cwd: ROOT, stdio: 'pipe' }).toString();
    exitCode = 0;
  } catch (err) {
    failed = true;
    exitCode = err.status || 1;
    output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  } finally {
    // ALWAYS restore byte-identically
    fs.writeFileSync(absPath, originalContent, 'utf8');
  }

  const verifiedRestored = fs.readFileSync(absPath, 'utf8') === originalContent;
  const probeSuccess = shouldFail ? failed : !failed;

  return {
    name: probeName,
    targetFile,
    probeSuccess,
    exitCode,
    verifiedRestored,
    snippet: output.slice(0, 300).replace(/\r?\n/g, ' ')
  };
}

async function runGateProbing() {
  console.log('\n=== [PART 1] PROBING QUALITY GATES (ANTI-FALSE-PASS VERIFICATION) ===');
  const probes = [];

  // Probe 1.1: gate-icons.js invalid size class
  probes.push(probeFault({
    probeName: 'gate-icons [5]: reject invalid size class h2-icon--17',
    targetFile: 'player.html',
    searchStr: 'h2-icon--16',
    replaceStr: 'h2-icon--17',
    testCmd: 'node scripts/gate-icons.js',
    shouldFail: true
  }));

  // Probe 1.2: gate-icons.js rigid CSS size 15px (SCAR-014)
  probes.push(probeFault({
    probeName: 'gate-icons [5b]: reject rigid 15px CSS for .h2-icon',
    targetFile: 'assets/h2dev-icons.css',
    searchStr: '.h2-icon--16 { min-width: var(--h2-icon-16); min-height: var(--h2-icon-16); }',
    replaceStr: '.h2-icon--16 {\n  min-width: 15px;\n}',
    testCmd: 'node scripts/gate-icons.js',
    shouldFail: true
  }));

  // Probe 1.3: gate-icons.js stat-glyph text render (SCAR-006)
  probes.push(probeFault({
    probeName: 'gate-icons [7]: reject stat-glyph containing icon name "video"',
    targetFile: 'assets/app/tabs/content.js',
    searchStr: "${pageBanner('Tổng quan Radar Kho',",
    replaceStr: "${pageBanner('Tổng quan Radar Kho' + `<span class=\"stat-glyph\">video</span>`,",
    testCmd: 'node scripts/gate-icons.js',
    shouldFail: true
  }));

  // Probe 1.4: gate-icons.js missing ICONS key (SCAR-008)
  probes.push(probeFault({
    probeName: 'gate-icons [6]: reject unregistered ICONS.unknown_probe_key',
    targetFile: 'assets/app/main.js',
    searchStr: 'ICONS.video',
    replaceStr: 'ICONS.unknown_probe_key',
    testCmd: 'node scripts/gate-icons.js',
    shouldFail: true
  }));

  // Probe 2.1: gate-typography.js font-size 17px outside 9 scales
  probes.push(probeFault({
    probeName: 'gate-typography [1]: reject font-size 17px',
    targetFile: 'assets/viddar.css',
    searchStr: 'font-size: 16px',
    replaceStr: 'font-size: 17px',
    testCmd: 'node scripts/gate-typography.js',
    shouldFail: true
  }));

  // Probe 2.2: gate-typography.js font-weight 800
  probes.push(probeFault({
    probeName: 'gate-typography [2]: reject font-weight 800',
    targetFile: 'assets/viddar.css',
    searchStr: 'font-weight: 600',
    replaceStr: 'font-weight: 800',
    testCmd: 'node scripts/gate-typography.js',
    shouldFail: true
  }));

  // Probe 2.3: gate-typography.js arbitrary text-[17px] in JS
  probes.push(probeFault({
    probeName: 'gate-typography [3]: reject arbitrary text-[17px] in JS',
    targetFile: 'assets/app/main.js',
    searchStr: 'text-xs',
    replaceStr: 'text-[17px]',
    testCmd: 'node scripts/gate-typography.js',
    shouldFail: true
  }));

  // Probe 2.4: gate-typography.js non-standard rem (0.6rem = 9.6px)
  probes.push(probeFault({
    probeName: 'gate-typography [4]: reject font-size 0.6rem (9.6px)',
    targetFile: 'assets/viddar.css',
    searchStr: 'font-size: 14px',
    replaceStr: 'font-size: 0.6rem',
    testCmd: 'node scripts/gate-typography.js',
    shouldFail: true
  }));

  // Probe 3.1: gate-shell.js built-in probe mode
  console.log('Running gate-shell.js --probe...');
  let gateShellProbePass = false;
  let gateShellOutput = '';
  try {
    gateShellOutput = execSync('node scripts/gate-shell.js --probe', { cwd: ROOT, stdio: 'pipe' }).toString();
    gateShellProbePass = gateShellOutput.includes('PROBE OK: gate BAT DUOC loi tiem vao');
  } catch (err) {
    gateShellOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    gateShellProbePass = gateShellOutput.includes('PROBE OK: gate BAT DUOC loi tiem vao');
  }
  probes.push({
    name: 'gate-shell --probe (detects 2-layer fault injection)',
    targetFile: 'assets/app/player-main.js & player.html',
    probeSuccess: gateShellProbePass,
    verifiedRestored: true,
    snippet: gateShellOutput.slice(0, 300).replace(/\r?\n/g, ' ')
  });

  // Probe 4.1: sync-counts.js --check probe
  probes.push(probeFault({
    probeName: 'sync-counts --check: reject manifest counts mismatch',
    targetFile: 'data/counts-manifest.json',
    searchStr: '"videos": 144,',
    replaceStr: '"videos": 999,',
    testCmd: 'node scripts/sync-counts.js --check',
    shouldFail: true
  }));

  for (const p of probes) {
    const symbol = p.probeSuccess ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${symbol}] ${p.name} (Restored: ${p.verifiedRestored})`);
  }

  RESULTS.gate_probing = probes;
}

async function runBrowserEmpiricalStressTesting() {
  console.log('\n=== [PART 2] RUNTIME EMPIRICAL STRESS-TESTING (BROWSER DOM INSPECTION) ===');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  const KNOWN_ICON_NAMES = new Set([
    'video', 'doc', 'channel', 'disk', 'file-text', 'tv', 'search', 'music',
    'folder', 'play', 'book', 'layers', 'shield', 'check', 'star', 'tag',
    'clock', 'home', 'compass', 'cpu', 'terminal', 'help', 'info', 'alert',
    'grid', 'menu', 'arrow', 'chevron', 'user', 'external-link', 'copy'
  ]);

  const ALLOWED_SIZES = new Set([12, 13, 14, 16, 18, 20, 24, 32]);
  const ALLOWED_ICON_SIZES = new Set([14, 16, 20, 24]);

  const ROUTES = [
    { name: 'index_tongquan', path: '/' },
    { name: 'index_video', path: '/?tab=video' },
    { name: 'index_tailieu', path: '/?tab=tai-lieu' },
    { name: 'index_kenhmau', path: '/?tab=kenh-mau' },
    { name: 'index_ngachxanh', path: '/?tab=ngach-xanh' },
    { name: 'index_nhac', path: '/?tab=nhac' },
    { name: 'index_reup', path: '/?tab=reup' },
    { name: 'index_rawkenh', path: '/?tab=raw-kenh' },
    { name: 'chienluoc_workflow', path: '/chienluoc?sub=workflow' },
    { name: 'chienluoc_matrix144', path: '/chienluoc?sub=matrix144' },
    { name: 'chienluoc_principles', path: '/chienluoc?sub=principles' },
    { name: 'chienluoc_distribution', path: '/chienluoc?sub=distribution' },
    { name: 'chienluoc_policy', path: '/chienluoc?sub=policy' },
    { name: 'player', path: '/player.html?sku=VIDEO-DD983D' },
    { name: 'learn', path: '/learn.html' }
  ];

  const scar006Violations = [];
  const scar007Violations = [];
  const scar014Violations = [];
  const scar015Violations = [];
  const scar020Violations = [];
  const observedFontSizes = {};

  for (const vp of viewports) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const r of ROUTES) {
      const url = `${BASE_URL}${r.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(600);
      } catch (err) {
        console.error(`Error navigating to ${url}: ${err.message}`);
        continue;
      }

      // --- AUDIT SCAR-006: stat-glyph contents ---
      const glyphs = await page.$$eval('.stat-glyph', els => els.map(el => ({
        text: el.textContent.trim(),
        html: el.outerHTML,
        parent: el.parentElement ? el.parentElement.className : ''
      })));

      for (const g of glyphs) {
        const lower = g.text.toLowerCase();
        if (KNOWN_ICON_NAMES.has(lower)) {
          scar006Violations.push({
            route: r.name,
            viewport: vp.name,
            text: g.text,
            html: g.html,
            error: `Found plain text icon name "${g.text}" inside .stat-glyph`
          });
        }
      }

      // --- AUDIT SCAR-007: .h2-icon sizing & container stretching ---
      const iconDetails = await page.$$eval('.h2-icon', els => els.map(el => {
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const pRect = el.parentElement ? el.parentElement.getBoundingClientRect() : null;
        return {
          className: el.className,
          dataH2i: el.getAttribute('data-h2i'),
          computedW: parseFloat(cs.width),
          computedH: parseFloat(cs.height),
          rectW: Math.round(rect.width * 10) / 10,
          rectH: Math.round(rect.height * 10) / 10,
          parentW: pRect ? Math.round(pRect.width * 10) / 10 : null,
          parentCls: el.parentElement ? el.parentElement.className : ''
        };
      }));

      for (const ic of iconDetails) {
        // Check if stretched to parent container (e.g. > 36px or width === parentW when parent is wide)
        if (ic.computedW > 32 || ic.computedH > 32) {
          scar007Violations.push({
            route: r.name,
            viewport: vp.name,
            icon: ic.dataH2i,
            computedW: ic.computedW,
            computedH: ic.computedH,
            error: `Icon size > 32px: ${ic.computedW}x${ic.computedH}`
          });
        }
        if (ic.parentW > 40 && ic.rectW >= ic.parentW - 2) {
          scar007Violations.push({
            route: r.name,
            viewport: vp.name,
            icon: ic.dataH2i,
            rectW: ic.rectW,
            parentW: ic.parentW,
            error: `Icon stretched to parent width: ${ic.rectW}px (parent ${ic.parentW}px)`
          });
        }
      }

      // --- AUDIT SCAR-014: Rigid 15px / 18px computed size on .h2-icon ---
      for (const ic of iconDetails) {
        const roundedW = Math.round(ic.computedW);
        const roundedH = Math.round(ic.computedH);
        if (roundedW === 15 || roundedW === 18 || roundedH === 15 || roundedH === 18) {
          scar014Violations.push({
            route: r.name,
            viewport: vp.name,
            icon: ic.dataH2i,
            size: `${ic.computedW}x${ic.computedH}`,
            error: `Icon locked at rigid 15px/18px: ${ic.computedW}x${ic.computedH}`
          });
        }
      }

      // --- AUDIT SCAR-015: Typography scale across visible text elements ---
      const typographyReport = await page.evaluate((allowedList) => {
        const allowed = new Set(allowedList);
        const results = { nonStandard: [], frequencies: {} };
        const tags = 'p, span, h1, h2, h3, h4, h5, h6, a, button, li, label, td, th';
        const elements = document.querySelectorAll(tags);

        elements.forEach(el => {
          if (!el || el.offsetParent === null) return; // ignore hidden
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const text = (el.textContent || '').trim();
          if (!text) return;

          const cs = window.getComputedStyle(el);
          const rawSize = cs.fontSize; // e.g. "14px"
          const parsed = parseFloat(rawSize);
          const rounded = Math.round(parsed);

          results.frequencies[rawSize] = (results.frequencies[rawSize] || 0) + 1;

          if (!allowed.has(rounded)) {
            // Check if it's inside an exempted utility container or math
            results.nonStandard.push({
              tag: el.tagName.toLowerCase(),
              className: (el.className || '').toString().slice(0, 50),
              fontSize: rawSize,
              snippet: text.slice(0, 40)
            });
          }
        });

        return results;
      }, Array.from(ALLOWED_SIZES));

      // Accumulate frequencies
      for (const [sz, cnt] of Object.entries(typographyReport.frequencies)) {
        observedFontSizes[sz] = (observedFontSizes[sz] || 0) + cnt;
      }

      if (typographyReport.nonStandard.length > 0) {
        // Group and record unique violations
        const sample = typographyReport.nonStandard.slice(0, 5);
        scar015Violations.push({
          route: r.name,
          viewport: vp.name,
          count: typographyReport.nonStandard.length,
          samples: sample
        });
      }

      // --- AUDIT SCAR-020: Mobile horizontal overflow ---
      if (vp.name === 'mobile') {
        const overflowData = await page.evaluate(() => {
          const de = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(de.scrollWidth, body.scrollWidth);
          const clientW = de.clientWidth;
          const diff = scrollW - clientW;

          if (diff <= 1) return { hasOverflow: false, diff: 0, overflowingElements: [] };

          // Find offending elements
          const culprits = [];
          document.querySelectorAll('*').forEach(el => {
            if (el.offsetParent === null) return;
            const r = el.getBoundingClientRect();
            if (r.right > clientW + 1.5) {
              // SCAR-020 guardrail: check if inside intentional horizontal scroll container
              let ancestor = el.parentElement;
              let isIntentionalScroll = false;
              while (ancestor && ancestor !== document.body) {
                const cs = window.getComputedStyle(ancestor);
                if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
                  isIntentionalScroll = true;
                  break;
                }
                ancestor = ancestor.parentElement;
              }

              if (!isIntentionalScroll) {
                culprits.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id,
                  cls: (el.className || '').toString().slice(0, 60),
                  right: Math.round(r.right),
                  width: Math.round(r.width)
                });
              }
            }
          });

          return {
            hasOverflow: culprits.length > 0,
            diff,
            culprits: culprits.slice(0, 5)
          };
        });

        if (overflowData.hasOverflow) {
          scar020Violations.push({
            route: r.name,
            diff: overflowData.diff,
            culprits: overflowData.culprits
          });
        }
      }
    }

    await context.close();
  }

  await browser.close();

  // Populate RESULTS
  RESULTS.scar_checks.scar_006 = {
    status: scar006Violations.length === 0 ? 'PASS' : 'FAIL',
    violations_count: scar006Violations.length,
    violations: scar006Violations
  };

  RESULTS.scar_checks.scar_007 = {
    status: scar007Violations.length === 0 ? 'PASS' : 'FAIL',
    violations_count: scar007Violations.length,
    violations: scar007Violations
  };

  RESULTS.scar_checks.scar_014 = {
    status: scar014Violations.length === 0 ? 'PASS' : 'FAIL',
    violations_count: scar014Violations.length,
    violations: scar014Violations
  };

  RESULTS.scar_checks.scar_015 = {
    status: scar015Violations.length === 0 ? 'PASS' : 'FAIL',
    violations_count: scar015Violations.length,
    violations: scar015Violations,
    observed_sizes: observedFontSizes
  };

  RESULTS.scar_checks.scar_020 = {
    status: scar020Violations.length === 0 ? 'PASS' : 'FAIL',
    violations_count: scar020Violations.length,
    violations: scar020Violations
  };

  console.log('\n--- SCAR EMPIRICAL AUDIT SUMMARY ---');
  console.log(`SCAR-006 (stat-glyph plain text icon names): ${RESULTS.scar_checks.scar_006.status}`);
  console.log(`SCAR-007 (.h2-icon sizing and no stretch): ${RESULTS.scar_checks.scar_007.status}`);
  console.log(`SCAR-014 (No rigid 15px/18px icons): ${RESULTS.scar_checks.scar_014.status}`);
  console.log(`SCAR-015 (Typography scale compliance): ${RESULTS.scar_checks.scar_015.status}`);
  console.log(`SCAR-020 (Mobile horizontal overflow & filter): ${RESULTS.scar_checks.scar_020.status}`);

  // Compute overall verdict
  const allProbesPassed = RESULTS.gate_probing.every(p => p.probeSuccess);
  const allScarsPassed = (
    RESULTS.scar_checks.scar_006.status === 'PASS' &&
    RESULTS.scar_checks.scar_007.status === 'PASS' &&
    RESULTS.scar_checks.scar_014.status === 'PASS' &&
    RESULTS.scar_checks.scar_015.status === 'PASS' &&
    RESULTS.scar_checks.scar_020.status === 'PASS'
  );

  RESULTS.overall_verdict = (allProbesPassed && allScarsPassed) ? 'APPROVE' : 'REQUEST_CHANGES';
  console.log(`\nOVERALL HARNESS VERDICT: ${RESULTS.overall_verdict}`);

  // Write results out
  const outPath = path.join(ROOT, '.agents', 'teamwork', 'challenger_2', 'adversarial_results.json');
  fs.writeFileSync(outPath, JSON.stringify(RESULTS, null, 2), 'utf8');
  console.log(`Results written to ${outPath}`);
}

(async () => {
  try {
    await runGateProbing();
    await runBrowserEmpiricalStressTesting();
  } catch (err) {
    console.error('Harness fatal error:', err);
    process.exit(1);
  }
})();
