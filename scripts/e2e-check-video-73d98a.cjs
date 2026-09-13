/**
 * e2e-check-video-73d98a.cjs
 * End-to-End browser verification for https://h2dev-learn.tonymmo.com/lotrinh/VIDEO-73d98a
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_URL = process.argv[2] || 'https://h2dev-learn.tonymmo.com/lotrinh/VIDEO-73d98a';
const PROOF_DIR = path.resolve(__dirname, '..', '_audit', 'e2e-proof-73d98a');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const results = [];
function check(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail });
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${id}] ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  console.log(`Bắt đầu E2E Test trên URL: ${TARGET_URL}\n`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push('PAGEERROR: ' + err.message);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      networkErrors.push(`${resp.status()} ${resp.url()}`);
    }
  });

  try {
    const res = await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    check('1.1', 'HTTP Status 200 OK', res.status() === 200, `Status code: ${res.status()}`);

    // Wait a little for async fetch in player.html to complete
    await page.waitForTimeout(1500);

    const title = await page.title();
    check('1.2', 'Page Title khớp bài học', title.includes('Update key (ngách cực nhỏ) mới nhất 06-09-2026'), `Title: "${title}"`);

    // 2. Video Player Element
    const videoSrc = await page.$eval('#pv', el => el.getAttribute('src') || el.currentSrc);
    check('2.1', 'Video Player Source', Boolean(videoSrc && videoSrc.includes('VIDEO-73d98a.mp4')), `src: ${videoSrc}`);

    // 3. Channels Section
    const channelsVisible = await page.$eval('#pchannels', el => !el.classList.contains('hidden'));
    const channelHandles = await page.$$eval('#pchannelslist a', els => els.map(e => e.textContent.trim()));
    const expectedChannels = ['@涙のひと駅', '@사연만남1짱', '@simbot2', '@元気な老後-t5d'];
    const allChannelsPresent = expectedChannels.every(ch => channelHandles.some(h => h.includes(ch)));
    check('3.1', 'Khối Kênh đối thủ hiển thị', channelsVisible, `Visible: ${channelsVisible}`);
    check('3.2', 'Đủ 4 kênh đối thủ bóc tách thực tế', channelHandles.length === 4 && allChannelsPresent, `Handles: ${channelHandles.join(', ')}`);

    // 4. Documents Section
    const docsVisible = await page.$eval('#pdocs', el => !el.classList.contains('hidden'));
    const docTitles = await page.$$eval('#pdocslist article div.font-semibold', els => els.map(e => e.textContent.trim()));
    check('4.1', 'Khối Tài liệu đính kèm hiển thị', docsVisible, `Visible: ${docsVisible}`);
    check('4.2', 'Tên cẩm nang Master SOP khớp', docTitles.some(t => t.includes('SOP Khai Thác Ngách Cực Nhỏ')), `Docs: ${docTitles.join(', ')}`);

    // 5. Modal Read Doc
    const readBtn = await page.$('#pdocslist button');
    let modalOpened = false;
    let modalContentSnippet = '';
    if (readBtn) {
      await readBtn.click();
      await page.waitForTimeout(800);
      const modalVisible = await page.$eval('#docModal', el => !el.classList.contains('hidden') && el.style.display !== 'none');
      modalContentSnippet = await page.$eval('#docModalBody', el => el.textContent.slice(0, 150));
      modalOpened = modalVisible && modalContentSnippet.length > 20;
      // Close modal
      await page.evaluate(() => { if (typeof closeDocModal === 'function') closeDocModal(); });
      await page.waitForTimeout(500);
    }
    check('5.1', 'Modal đọc tài liệu mở thành công & render Markdown', modalOpened, `Snippet: "${modalContentSnippet.replace(/\s+/g, ' ').trim()}"`);

    // 6. Insights & Notice
    const insightsVisible = await page.$eval('#pinsights', el => !el.classList.contains('hidden'));
    const legacyNoticeHidden = await page.$eval('#legacyInsightNotice', el => el.classList.contains('hidden'));
    check('6.1', 'Khối Phân tích thực chiến Insights hiển thị', insightsVisible, `Visible: ${insightsVisible}`);
    check('6.2', 'Banner cảnh báo heuristic cũ đã ẩn vĩnh viễn', legacyNoticeHidden, `Legacy Notice Hidden: ${legacyNoticeHidden}`);

    // 7. Takeaways
    const takeaways = await page.$$eval('#insightTakeaways li', els => els.map(e => e.textContent.trim()));
    check('7.1', 'Đủ 5 Mấu chốt bài giảng thực chiến (Key Takeaways)', takeaways.length === 5, `Số lượng: ${takeaways.length}`);

    // 8. Timestamps Timeline
    const timestamps = await page.$$eval('#insightTimeline button', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    check('8.1', 'Đủ 5 Mốc tua nhanh thời gian (Key Timestamps)', timestamps.length === 5, `Mốc: ${timestamps.join(' | ')}`);

    // Test clicking timestamp 2 (02:14 -> 134s)
    const secondBtn = (await page.$$('#insightTimeline button'))[1];
    let seekOk = false;
    if (secondBtn) {
      await secondBtn.click();
      await page.waitForTimeout(500);
      const currTime = await page.$eval('#pv', el => el.currentTime);
      seekOk = Math.abs(currTime - 134) <= 1.0;
      check('8.2', 'Bấm nút mốc tua video nhảy chính xác từng giây', seekOk, `Video currentTime: ${currTime}s (mục tiêu 134s)`);
    }

    // 9. Interactive Subtitle
    // Click tab transcript if on mobile or ensure transcript is rendered
    const segCount = await page.$$eval('#transcriptList > div', els => els.length);
    check('9.1', 'Transcript tương tác render đủ 211 phân đoạn', segCount === 211, `Số segments trong DOM: ${segCount}`);

    // 10. Network & Console Cleanliness
    // Filter out potential non-blocking tracking/font errors if any
    const realConsoleErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('font'));
    const realNetworkErrors = networkErrors.filter(e => !e.includes('favicon'));
    check('10.1', 'Không có Console Error', realConsoleErrors.length === 0, `Lỗi: ${realConsoleErrors.join('; ') || '0 lỗi'}`);
    check('10.2', 'Không có Network 4xx/5xx Error', realNetworkErrors.length === 0, `Lỗi: ${realNetworkErrors.join('; ') || '0 lỗi'}`);

    // Capture screenshot
    const shotPath = path.join(PROOF_DIR, 'e2e-proof-73d98a.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`\n📸 Đã chụp ảnh màn hình proof tại: ${shotPath}`);

  } catch (err) {
    console.error('Lỗi khi chạy E2E:', err);
  } finally {
    await browser.close();
  }

  const allPassed = results.every(r => r.pass);
  console.log(`\n==============================================`);
  console.log(`TỔNG KẾT E2E CHECK: ${results.filter(r => r.pass).length}/${results.length} CHECKS PASS`);
  console.log(`KẾT LUẬN: ${allPassed ? '✅ HOÀN TOÀN ĐẦY ĐỦ VÀ CHUẨN XÁC 100%' : '❌ CÒN THIẾU SÓT'}`);
  console.log(`==============================================`);
})();
