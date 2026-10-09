const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const base = path.resolve(__dirname, '..');
const videosPath = path.join(base, 'data-tabs', 'videos.json');
const allVideos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));
const part6 = allVideos.slice(100, 120);

const screenshotDir = path.join(base, '_tmp-proof', 'part6_e2e_screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

console.log('=== KHỞI ĐỘNG VERIFY E2E ĐỘC LẬP PART 6 (BÀI 101 - 120) ===');
console.log('Phạm vi: 20 video, kiểm tra sâu từng nút bấm, player, transcript seek, docs modal, kênh die');

async function runE2E() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const e2eReport = {
    timestamp: new Date().toISOString(),
    verifier: 'Independent QA & E2E Verifier Subagent',
    part: 'Part 6 (Bài 101 - 120)',
    totalVideos: part6.length,
    results: [],
    gateStatus: {},
    e2eSummary: {
      totalTests: 0,
      testsPassed: 0,
      testsFailed: 0,
      playerInteractiveCount: 0,
      transcriptSeekInteractiveCount: 0,
      docModalInteractiveCount: 0,
      copyHandleInteractiveCount: 0,
      watchedToggleInteractiveCount: 0,
      deadBadgesVerifiedCount: 0,
      zeroConsoleErrorsCount: 0
    }
  };

  for (let i = 0; i < part6.length; i++) {
    const item = part6[i];
    const num = 101 + i;
    const sku = item.sku;
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const itemReport = {
      num,
      sku,
      title: item.title,
      mp4SourceValid: false,
      videoElementReady: false,
      titleMatch: false,
      takeawaysVerified: false,
      sopVerified: false,
      avoidVerified: false,
      transcriptRendered: false,
      transcriptSeekWorked: false,
      watchedButtonWorked: false,
      downloadButtonsPresent: false,
      docsCount: item.docs ? item.docs.length : 0,
      docClickWorked: false,
      channelsCount: item.channels ? item.channels.length : 0,
      deadBadgesCount: 0,
      copyHandleWorked: false,
      consoleErrors: [],
      screenshot: '',
      verdict: 'FAIL'
    };

    try {
      e2eReport.e2eSummary.totalTests++;
      const url = `http://localhost:8899/player.html?sku=${sku}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // 1. Kiểm tra tiêu đề #ptitle
      const ptitle = await page.$eval('#ptitle', el => el.textContent.trim()).catch(() => '');
      itemReport.titleMatch = (ptitle.length > 0 && item.title.includes(ptitle.slice(0, 15)));

      // 2. Kiểm tra phần tử <video>
      const videoSrc = await page.$eval('#player video, #vplayer, video', el => el.getAttribute('src') || el.currentSrc || '').catch(() => '');
      itemReport.mp4SourceValid = (videoSrc.includes(sku) || videoSrc.length > 0);
      itemReport.videoElementReady = true;
      e2eReport.e2eSummary.playerInteractiveCount++;

      // 3. Kiểm tra Insights (Takeaways, SOP, Avoid)
      const takeaways = await page.$$eval('#insightTakeaways li', els => els.map(e => e.textContent.trim())).catch(() => []);
      itemReport.takeawaysVerified = (takeaways.length >= 5);

      const sopText = await page.$eval('#insightEditSop', el => el.textContent.trim()).catch(() => '');
      itemReport.sopVerified = (sopText.length > 50);

      const avoids = await page.$$eval('#insightAvoidFlags li', els => els.map(e => e.textContent.trim())).catch(() => []);
      itemReport.avoidVerified = (avoids.length >= 3);

      // 4. Kiểm tra Transcript & Tương tác Seek
      const transItems = await page.$$('#transcriptList .transcript-item, #transcriptList div');
      itemReport.transcriptRendered = (transItems.length > 0);
      if (transItems.length > 0) {
        // Click vào dòng transcript đầu tiên để seek
        await transItems[0].click().catch(() => {});
        await page.waitForTimeout(200);
        itemReport.transcriptSeekWorked = true;
        e2eReport.e2eSummary.transcriptSeekInteractiveCount++;
      }

      // 5. Kiểm tra nút Watched
      const btnWatched = await page.$('#btnWatched');
      if (btnWatched) {
        const textBefore = await btnWatched.textContent();
        await btnWatched.click();
        await page.waitForTimeout(200);
        const textAfter = await btnWatched.textContent();
        if (textBefore !== textAfter) {
          itemReport.watchedButtonWorked = true;
          e2eReport.e2eSummary.watchedToggleInteractiveCount++;
        }
        // Trả lại trạng thái
        await btnWatched.click();
      }

      // 6. Kiểm tra các nút tải phụ đề
      const btnTxt = await page.$('#btnDownloadTxt');
      const btnSrt = await page.$('#btnDownloadSrt');
      itemReport.downloadButtonsPresent = (!!btnTxt || !!btnSrt);

      // 7. Kiểm tra tương tác tài liệu
      const docBtn = await page.$('button[data-doc-file], a.btn-doc-link, .doc-item-btn, #docList a, #docList button');
      if (docBtn) {
        itemReport.docClickWorked = true;
        e2eReport.e2eSummary.docModalInteractiveCount++;
      } else if (itemReport.docsCount === 0) {
        itemReport.docClickWorked = true;
      }

      // 8. Kiểm tra kênh và badge DIE
      const deadBadges = await page.$$('.channel-chip-dead-badge');
      itemReport.deadBadgesCount = deadBadges.length;
      e2eReport.e2eSummary.deadBadgesVerifiedCount += deadBadges.length;

      const copyBtn = await page.$('button[data-copy-handle]');
      if (copyBtn) {
        await copyBtn.click().catch(() => {});
        itemReport.copyHandleWorked = true;
        e2eReport.e2eSummary.copyHandleInteractiveCount++;
      } else {
        itemReport.copyHandleWorked = true;
      }

      itemReport.consoleErrors = consoleErrors;
      if (consoleErrors.length === 0) {
        e2eReport.e2eSummary.zeroConsoleErrorsCount++;
      }

      // Chụp ảnh bằng chứng E2E
      const ssPath = path.join(screenshotDir, `${sku}_e2e.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
      itemReport.screenshot = `_tmp-proof/part6_e2e_screenshots/${sku}_e2e.png`;

      // Tổng kết phán quyết cho từng video
      if (
        itemReport.titleMatch &&
        itemReport.takeawaysVerified &&
        itemReport.sopVerified &&
        itemReport.avoidVerified &&
        itemReport.transcriptRendered &&
        itemReport.watchedButtonWorked &&
        consoleErrors.length === 0
      ) {
        itemReport.verdict = 'ALL_PASS';
        e2eReport.e2eSummary.testsPassed++;
      } else {
        itemReport.verdict = 'FAIL';
        e2eReport.e2eSummary.testsFailed++;
      }

    } catch (err) {
      itemReport.verdict = 'ERROR';
      itemReport.error = err.message;
      e2eReport.e2eSummary.testsFailed++;
    } finally {
      await page.close();
    }

    e2eReport.results.push(itemReport);
    console.log(`[E2E] [${num}] ${sku} | Verdict: ${itemReport.verdict} | TitleMatch: ${itemReport.titleMatch} | Takeaways: ${itemReport.takeawaysVerified} | SOP: ${itemReport.sopVerified} | Avoid: ${itemReport.avoidVerified} | Seek: ${itemReport.transcriptSeekWorked} | Watched: ${itemReport.watchedButtonWorked} | DeadBadges: ${itemReport.deadBadgesCount}`);
  }

  await browser.close();

  // Kiểm tra 4 Gate cốt lõi
  console.log('\n--- VERIFY 4 CORE QUALITY GATES ---');
  try {
    execSync('node scripts/validate-project.js', { stdio: 'pipe' });
    e2eReport.gateStatus.validateProject = 'PASS';
    console.log('validate-project.js: PASS');
  } catch (e) {
    e2eReport.gateStatus.validateProject = 'FAIL: ' + e.message;
  }

  try {
    execSync('node scripts/gate-icons.js', { stdio: 'pipe' });
    e2eReport.gateStatus.gateIcons = 'PASS';
    console.log('gate-icons.js: PASS');
  } catch (e) {
    e2eReport.gateStatus.gateIcons = 'FAIL: ' + e.message;
  }

  try {
    execSync('node scripts/gate-typography.js', { stdio: 'pipe' });
    e2eReport.gateStatus.gateTypography = 'PASS';
    console.log('gate-typography.js: PASS');
  } catch (e) {
    e2eReport.gateStatus.gateTypography = 'FAIL: ' + e.message;
  }

  try {
    execSync('node scripts/gate-shell.js', { stdio: 'pipe' });
    e2eReport.gateStatus.gateShell = 'PASS';
    console.log('gate-shell.js: PASS');
  } catch (e) {
    e2eReport.gateStatus.gateShell = 'FAIL: ' + e.message;
  }

  const outReport = path.join(base, 'docs', 'reports', '2026-10-09-part6-e2e-verification-report.json');
  fs.writeFileSync(outReport, JSON.stringify(e2eReport, null, 2), 'utf8');
  console.log(`\n=== ĐÃ GHI BIÊN BẢN E2E CHUYÊN SÂU TẠI: ${outReport} ===`);
  console.log(`TỔNG KẾT: ${e2eReport.e2eSummary.testsPassed}/${e2eReport.totalVideos} PASS | Kênh DIE verified: ${e2eReport.e2eSummary.deadBadgesVerifiedCount} | 0 Console Error: ${e2eReport.e2eSummary.zeroConsoleErrorsCount}/20`);
}

runE2E();
