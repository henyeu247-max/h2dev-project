const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(BASE_DIR, 'docs', 'reports', '2026-10-09-teamwork-e2e-verification-report.json');

(async () => {
  const results = {
    report_title: "H2DEV Teamwork E2E Verification & Reality Audit Report",
    timestamp: new Date().toISOString(),
    overall_status: "PENDING",
    sections: {}
  };

  console.log("=== BẮT ĐẦU TEAMWORK E2E VERIFICATION ===");

  // 1. PHYSICAL DISK & DATA INTEGRITY
  console.log("\n[1] KIỂM TRA ĐĨA VẬT LÝ & DATA PARITY...");
  const videosJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data-tabs', 'videos.json'), 'utf8'));
  const docsJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data-tabs', 'tai-lieu-full.json'), 'utf8'));
  const rawJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data-tabs', 'raw-kenh-mau.json'), 'utf8'));
  const kenhJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data-tabs', 'kenh-mau.json'), 'utf8'));

  let videoFilesOk = 0;
  let transcriptFilesOk = 0;
  let totalTranscriptWords = 0;

  for (const v of videosJson) {
    const vPath = path.join(BASE_DIR, 'video', v.sku, `${v.sku}.mp4`);
    const wPath = path.join(BASE_DIR, 'video', v.sku, `${v.sku}.webm`);
    if (fs.existsSync(vPath) || fs.existsSync(wPath)) videoFilesOk++;

    const tPath = path.join(BASE_DIR, 'video', v.sku, 'transcript.txt');
    if (fs.existsSync(tPath)) {
      transcriptFilesOk++;
      const txt = fs.readFileSync(tPath, 'utf8');
      totalTranscriptWords += txt.split(/\s+/).filter(Boolean).length;
    }
  }

  results.sections.physical_integrity = {
    total_videos_checked: videosJson.length,
    video_files_verified: videoFilesOk,
    transcript_files_verified: transcriptFilesOk,
    total_transcript_words: totalTranscriptWords,
    total_docs_in_catalog: docsJson.length,
    total_raw_channels: (rawJson.records || []).length,
    total_catalog_channels: kenhJson.length,
    status: (videoFilesOk === 144 && transcriptFilesOk === 144) ? "PASS" : "FAIL"
  };
  console.log(` - Video MP4/WEBM: ${videoFilesOk}/144`);
  console.log(` - Transcript files: ${transcriptFilesOk}/144 (Tổng từ: ${totalTranscriptWords.toLocaleString()})`);
  console.log(` - Tài liệu học liệu: ${docsJson.length}/300`);

  // 2. 4 CORE QUALITY GATES
  console.log("\n[2] KIỂM TRA 4 QUALITY GATES & SYNC COUNTS...");
  const gateResults = {};
  const runGate = (cmd, name) => {
    try {
      execSync(cmd, { cwd: BASE_DIR, stdio: 'pipe' });
      gateResults[name] = "ALL PASS";
      console.log(` - ${name}: PASS`);
    } catch (e) {
      gateResults[name] = "FAIL: " + (e.stdout ? e.stdout.toString() : e.message);
      console.error(` - ${name}: FAIL`);
    }
  };

  runGate('node scripts/validate-project.js', 'validate-project');
  runGate('node scripts/gate-icons.js', 'gate-icons');
  runGate('node scripts/gate-typography.js', 'gate-typography');
  runGate('node scripts/gate-shell.js', 'gate-shell');
  runGate('node scripts/sync-counts.js --check', 'sync-counts');

  results.sections.quality_gates = gateResults;

  // 3. E2E BROWSER TESTING (PLAYWRIGHT)
  console.log("\n[3] KIỂM THỬ PLAYWRIGHT BROWSER THẬT...");
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ];

  const browserResults = {};

  for (const vp of viewports) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    // Test sub=workflow
    await page.goto('http://127.0.0.1:8899/chienluoc?sub=workflow', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const stepsCount = await page.$$eval('#cl-panel-workflow section .grid > div', els => els.length);
    const skusRendered = await page.$$eval('#cl-panel-workflow a[href*="player.html?sku="]', els => els.length);

    // Test sub=matrix144
    await page.goto('http://127.0.0.1:8899/chienluoc?sub=matrix144', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const cardsCount = await page.$$eval('#cl-matrix-grid article', els => els.length);
    const chipsCount = await page.$$eval('#cl-matrix-filter-chips button', els => els.length);

    // Test click filter chip
    await page.click('#cl-matrix-filter-chips button:nth-child(2)');
    await page.waitForTimeout(300);
    const visibleCardsAfterFilter = await page.$$eval('#cl-matrix-grid article', els => els.filter(el => window.getComputedStyle(el).display !== 'none').length);

    // Test sub=principles
    await page.goto('http://127.0.0.1:8899/chienluoc?sub=principles', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const principlesCount = await page.$$eval('#cl-panel-principles article', els => els.length);

    // Test sub=distribution
    await page.goto('http://127.0.0.1:8899/chienluoc?sub=distribution', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const distributionVisible = await page.$eval('#cl-panel-distribution', el => window.getComputedStyle(el).display !== 'none');

    // Test sub=policy
    await page.goto('http://127.0.0.1:8899/chienluoc?sub=policy', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const policyVisible = await page.$eval('#cl-panel-policy', el => window.getComputedStyle(el).display !== 'none');

    // Test player.html with first SKU
    await page.goto('http://127.0.0.1:8899/player.html?sku=VIDEO-DD983D', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const ptitle = await page.$eval('#ptitle', el => el.textContent.trim()).catch(() => "");
    const transcriptLines = await page.$$eval('#transcriptList .transcript-line', els => els.length).catch(() => 0);

    browserResults[vp.name] = {
      workflow_steps_count: stepsCount,
      workflow_skus_rendered: skusRendered,
      matrix144_cards_count: cardsCount,
      matrix144_filter_chips: chipsCount,
      matrix144_filtered_cards: visibleCardsAfterFilter,
      principles_cards_count: principlesCount,
      distribution_panel_visible: distributionVisible,
      policy_panel_visible: policyVisible,
      player_title: ptitle,
      player_transcript_lines: transcriptLines,
      console_errors: errors,
      status: (errors.length === 0 && stepsCount === 16 && skusRendered === 144 && cardsCount === 144) ? "PASS" : "FAIL"
    };

    console.log(` - Steps in workflow: ${stepsCount}/16`);
    console.log(` - SKUs in workflow: ${skusRendered}/144`);
    console.log(` - Cards in matrix144: ${cardsCount}/144`);
    console.log(` - Filter chips: ${chipsCount}`);
    console.log(` - Console errors: ${errors.length}`);

    await context.close();
  }

  await browser.close();
  results.sections.browser_testing = browserResults;

  // OVERALL EVALUATION
  const allGatesPass = Object.values(gateResults).every(v => v === "ALL PASS");
  const allBrowserPass = Object.values(browserResults).every(v => v.status === "PASS");
  const diskPass = results.sections.physical_integrity.status === "PASS";

  if (allGatesPass && allBrowserPass && diskPass) {
    results.overall_status = "ALL PASS 100%";
  } else {
    results.overall_status = "NEEDS WORK";
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n=== KẾT QUẢ TỔNG THỂ: ${results.overall_status} ===`);
  console.log(`Biên bản đã lưu tại: ${REPORT_FILE}`);
})();
