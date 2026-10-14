const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', '_tmp-proof', 'part7_8_e2e_screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runPart7And8E2E() {
  console.log('=== BẮT ĐẦU KIỂM THỬ VÀ NGHIỆM THU E2E TOÀN DIỆN PART 7 & PART 8 (BÀI 121 - 144: 24 VIDEO) ===');

  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data-tabs', 'videos.json'), 'utf8'));
  // Lấy từ index 120 đến hết (Bài 121 đến 144)
  const targetVideos = catalog.slice(120);

  console.log(`Tổng số video cần kiểm thử E2E: ${targetVideos.length}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    totalVideos: targetVideos.length,
    passed: 0,
    failed: 0,
    deadBadgesVerified: 0,
    results: []
  };

  for (let i = 0; i < targetVideos.length; i++) {
    const v = targetVideos[i];
    const lessonNum = 121 + i;
    const sku = v.sku;
    const url = `http://localhost:8899/player.html?sku=${encodeURIComponent(sku)}`;

    const pageErrors = [];
    const consoleErrors = [];

    const onPageError = err => pageErrors.push(err.message);
    const onConsole = msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!t.includes('cloudflare') && !t.includes('beacon.min.js')) {
          consoleErrors.push(t);
        }
      }
    };

    page.on('pageerror', onPageError);
    page.on('console', onConsole);

    const result = {
      lesson: lessonNum,
      sku: sku,
      title: v.title,
      url: url,
      checks: {},
      passed: true,
      errors: []
    };

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(600);

      // 1. Kiểm tra tiêu đề
      const ptitle = await page.$eval('#ptitle', el => el.textContent.trim()).catch(() => '');
      result.checks.titleRendered = ptitle.length > 0;
      if (!result.checks.titleRendered) {
        result.passed = false;
        result.errors.push('Tiêu đề #ptitle rỗng');
      }

      // 2. Kiểm tra Video Source & ReadyState
      const videoInfo = await page.$eval('#pv', el => ({
        src: el.src || el.currentSrc,
        readyState: el.readyState,
        paused: el.paused
      })).catch(() => null);

      result.checks.videoLoaded = Boolean(videoInfo && videoInfo.src && (videoInfo.src.includes('.mp4') || videoInfo.src.includes('.webm')));
      if (!result.checks.videoLoaded) {
        result.passed = false;
        result.errors.push('Video player không có src hợp lệ: ' + (videoInfo ? videoInfo.src : 'null'));
      }

      // 3. Kiểm tra Insights: Takeaways >= 5
      const takeawaysCount = await page.$$eval('#insightTakeaways li', els => els.length).catch(() => 0);
      result.checks.takeawaysCount = takeawaysCount;
      if (takeawaysCount < 5) {
        result.passed = false;
        result.errors.push(`Takeaways chỉ có ${takeawaysCount} mục (yêu cầu >= 5)`);
      }

      // 4. Kiểm tra Insights: SOP length >= 500
      const sopText = await page.$eval('#insightEditSop', el => el.textContent.trim()).catch(() => '');
      result.checks.sopTextLength = sopText.length;
      if (sopText.length < 500) {
        result.passed = false;
        result.errors.push(`SOP quá ngắn: ${sopText.length} ký tự (yêu cầu >= 500)`);
      }

      // 5. Kiểm tra Avoid Flags >= 3
      const avoidCount = await page.$$eval('#insightAvoidFlags li', els => els.length).catch(() => 0);
      result.checks.avoidFlagsCount = avoidCount;
      if (avoidCount < 3) {
        result.passed = false;
        result.errors.push(`Avoid flags chỉ có ${avoidCount} mục (yêu cầu >= 3)`);
      }

      // 6. Kiểm tra Transcript & Tương tác Seek
      const transcriptRows = await page.$$eval('#transcriptList .t-row, #transcriptList li, #transcriptList div[data-start]', els => els.length).catch(() => 0);
      result.checks.transcriptRows = transcriptRows;

      let seekWorked = false;
      if (transcriptRows > 2) {
        const targetRow = page.locator('#transcriptList .t-row, #transcriptList li, #transcriptList div[data-start]').nth(2);
        if (await targetRow.isVisible()) {
          await targetRow.click();
          await page.waitForTimeout(300);
          const currentTime = await page.$eval('#pv', el => el.currentTime).catch(() => 0);
          seekWorked = currentTime > 0;
        }
      }
      result.checks.seekWorked = seekWorked || transcriptRows === 0;

      // 7. Kiểm tra nút Watched Toggle
      const btnWatched = page.locator('#btnWatched');
      let watchedToggleWorked = false;
      if (await btnWatched.isVisible()) {
        const initialText = await btnWatched.textContent();
        await btnWatched.click();
        await page.waitForTimeout(300);
        const newText = await btnWatched.textContent();
        watchedToggleWorked = (initialText !== newText);
        await btnWatched.click(); // revert
      }
      result.checks.watchedToggleWorked = watchedToggleWorked;

      // 8. Kiểm tra kênh DIE badge
      const deadBadges = await page.$$eval('.channel-chip-dead-badge', els => els.length).catch(() => 0);
      result.checks.deadBadges = deadBadges;
      if (deadBadges > 0) {
        report.deadBadgesVerified += deadBadges;
      }

      // 9. Kiểm tra Console Errors
      result.checks.consoleErrors = consoleErrors.length;
      result.checks.pageErrors = pageErrors.length;
      if (consoleErrors.length > 0 || pageErrors.length > 0) {
        result.passed = false;
        result.errors.push(`Có ${consoleErrors.length} console errors và ${pageErrors.length} page errors`);
      }

      // 10. Chụp ảnh chứng thực
      const screenshotPath = path.join(screenshotDir, `${sku}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      result.screenshot = `_tmp-proof/part7_8_e2e_screenshots/${sku}.png`;

    } catch (e) {
      result.passed = false;
      result.errors.push('Lỗi ngoại lệ: ' + e.message);
    } finally {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
    }

    if (result.passed) {
      report.passed++;
      console.log(`[PASS] Bài ${lessonNum} (${sku}) - Takeaways:${result.checks.takeawaysCount}, SOP:${result.checks.sopTextLength} chars, Avoid:${result.checks.avoidFlagsCount}, DeadBadges:${result.checks.deadBadges}`);
    } else {
      report.failed++;
      console.log(`[FAIL] Bài ${lessonNum} (${sku}) - Errors:`, result.errors);
    }

    report.results.push(result);
  }

  await browser.close();

  const reportPath = path.join(__dirname, '..', 'docs', 'reports', '2026-10-09-part7-and-8-e2e-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ E2E PART 7 & PART 8 ===`);
  console.log(`Tổng video: ${report.totalVideos}`);
  console.log(`PASS: ${report.passed}`);
  console.log(`FAIL: ${report.failed}`);
  console.log(`Kênh DIE badges phát hiện: ${report.deadBadgesVerified}`);
  console.log(`Báo cáo lưu tại: ${reportPath}`);

  return report;
}

runPart7And8E2E().catch(console.error);
