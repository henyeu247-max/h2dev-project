/**
 * ===================================================================================
 * scripts/e2e-check-any-video.cjs — Nghiệm thu E2E Trình Duyệt Tự Động Cho Mọi Video
 * ===================================================================================
 *
 * ⚠️ LƯU Ý KỶ LUẬT LÀM VIỆC CHUYÊN NGHIỆP (BẮT BUỘC TUÂN THỦ):
 * -----------------------------------------------------------------------------------
 * Mặc dù script này tự động hóa kiểm tra DOM, mạng, player, modal và phụ đề trên trình duyệt,
 * nhưng đối với BẤT KỲ VIDEO NÀO ĐƯỢC CHUẨN HÓA MỚI, Agent / Kỹ sư BẮT BUỘC PHẢI CHECK PASS
 * LẠI BẰNG TAY (MANUAL VERIFICATION 100%):
 *
 * 1. Trích xuất khung hình thật (FFmpeg) tại các mốc giây đối thủ xuất hiện để mổ xẻ handle/avatar.
 * 2. Đọc lại toàn bộ transcript thật để bảo đảm 0 ảo giác Whisper và không nén chữ.
 * 3. Soát từng mấu chốt bài giảng (Key Takeaways) phải 100% grounded lời tác giả, cấm đoán mò.
 * 4. Script tự động chưa chắc đã bắt hết các sắc thái nội dung đặc thù của từng video;
 *    chỉ khi cả SCRIPT PASS và KIỂM ĐỊNH TAY PASS thì video mới được coi là ĐẠT CHUẨN NGHIỆM THU.
 *
 * Cách chạy:
 *   node scripts/e2e-check-any-video.cjs <SKU> [BASE_URL]
 * Ví dụ:
 *   node scripts/e2e-check-any-video.cjs VIDEO-73d98a https://h2dev-learn.tonymmo.com
 *   node scripts/e2e-check-any-video.cjs VIDEO-3a38f9 http://127.0.0.1:8899
 * ===================================================================================
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SKU = process.argv[2] || 'VIDEO-73d98a';
const BASE_URL = (process.argv[3] || 'https://h2dev-learn.tonymmo.com').replace(/\/$/, '');
const TARGET_URL = `${BASE_URL}/lotrinh/${encodeURIComponent(SKU)}`;

const ROOT_DIR = path.resolve(__dirname, '..');
const PROOF_DIR = path.resolve(ROOT_DIR, '_audit', 'e2e-proofs');
fs.mkdirSync(PROOF_DIR, { recursive: true });

// Đọc dữ liệu chuẩn tại local để làm cơ sở đối chiếu tất định
let localCatalogItem = null;
let localInsightsItem = null;
let expectedSegmentCount = 0;

try {
  const catPath = path.join(ROOT_DIR, 'data', 'catalog_full.json');
  if (fs.existsSync(catPath)) {
    const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    localCatalogItem = cat.find(x => x.sku === SKU) || null;
  }
  const insPath = path.join(ROOT_DIR, 'data', 'video_insights.json');
  if (fs.existsSync(insPath)) {
    const ins = JSON.parse(fs.readFileSync(insPath, 'utf8'));
    localInsightsItem = ins[SKU] || null;
  }
  const trPath = path.join(ROOT_DIR, 'video', SKU, 'transcript.json');
  if (fs.existsSync(trPath)) {
    const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
    expectedSegmentCount = Array.isArray(tr) ? tr.length : (tr.segments ? tr.segments.length : 0);
  }
} catch (e) {
  console.warn('⚠️ Cảnh báo: Không thể đọc toàn bộ dữ liệu local benchmark:', e.message);
}

const results = [];
function check(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail });
  const status = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${id}] ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  console.log(`===================================================================================`);
  console.log(`KHỞI ĐỘNG E2E CHECK BROWSER CHO BÀI HỌC: [${SKU}]`);
  console.log(`Đích kiểm thử: ${TARGET_URL}`);
  console.log(`===================================================================================\n`);

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
    check('1.1', 'HTTP Status 200 OK', res && res.status() === 200, `HTTP Code: ${res ? res.status() : 'null'}`);

    await page.waitForTimeout(1500);

    const title = await page.title();
    const expectedTitleSnippet = localCatalogItem ? localCatalogItem.title.slice(0, 30) : SKU;
    check('1.2', 'Page Title nạp đúng', title.includes(expectedTitleSnippet) || title.includes(SKU), `Title: "${title}"`);

    // 2. Video Player
    const videoSrc = await page.$eval('#pv', el => el.getAttribute('src') || el.currentSrc || '');
    check('2.1', 'Video Player Source tồn tại', Boolean(videoSrc && videoSrc.length > 0), `src: ${videoSrc}`);

    // 3. Channels Section
    const expectedChannels = (localCatalogItem && localCatalogItem.channels) || [];
    if (expectedChannels.length > 0) {
      const channelsVisible = await page.$eval('#pchannels', el => !el.classList.contains('hidden'));
      const channelHandles = await page.$$eval('#pchannelslist a', els => els.map(e => e.textContent.trim()));
      const allChannelsPresent = expectedChannels.every(ch => channelHandles.some(h => h.includes(ch)));
      check('3.1', 'Khối Kênh đối thủ hiển thị', channelsVisible, `Visible: ${channelsVisible}`);
      check('3.2', 'Đủ số lượng kênh đối thủ bóc tách', channelHandles.length >= expectedChannels.length && allChannelsPresent, `Đã hiển thị: ${channelHandles.join(', ')}`);
    } else {
      check('3.1', 'Kênh đối thủ (không có kênh mẫu trong video)', true, 'Video này không có kênh mẫu');
    }

    // 4. Documents Section
    const expectedDocs = (localCatalogItem && localCatalogItem.docs) || [];
    if (expectedDocs.length > 0) {
      const docsVisible = await page.$eval('#pdocs', el => !el.classList.contains('hidden'));
      check('4.1', 'Khối Tài liệu đính kèm hiển thị', docsVisible, `Visible: ${docsVisible}`);

      const readBtn = await page.$('#pdocslist button');
      let modalOpened = false;
      let modalSnippet = '';
      if (readBtn) {
        await readBtn.click();
        await page.waitForTimeout(800);
        const modalVisible = await page.$eval('#docModal', el => !el.classList.contains('hidden') && el.style.display !== 'none');
        modalSnippet = await page.$eval('#docModalBody', el => el.textContent.slice(0, 100));
        modalOpened = modalVisible && modalSnippet.length > 10;
        await page.evaluate(() => { if (typeof closeDocModal === 'function') closeDocModal(); });
        await page.waitForTimeout(400);
      }
      check('4.2', 'Modal đọc tài liệu Markdown mở thành công', modalOpened, `Snippet: "${modalSnippet.replace(/\s+/g, ' ').trim()}"`);
    } else {
      check('4.1', 'Tài liệu đính kèm', true, 'Video này chưa gắn kèm tài liệu SOP');
    }

    // 5. Insights & Legacy Notice
    const insightsVisible = await page.$eval('#pinsights', el => !el.classList.contains('hidden'));
    check('5.1', 'Khối Phân tích thực chiến Insights hiển thị', insightsVisible, `Visible: ${insightsVisible}`);

    const isVisualChecked = Boolean(localInsightsItem && localInsightsItem.visual_audio_checked);
    const legacyNoticeHidden = await page.$eval('#legacyInsightNotice', el => el.classList.contains('hidden'));
    if (isVisualChecked) {
      check('5.2', 'Banner heuristic cũ ĐÃ ẨN VĨNH VIỄN (visual_audio_checked = true)', legacyNoticeHidden, `Legacy Notice Hidden = ${legacyNoticeHidden}`);
    } else {
      check('5.2', 'Banner heuristic cũ đang hiển thị (visual_audio_checked = false)', !legacyNoticeHidden, 'Cần chuẩn hóa chuyên sâu và kiểm định tay trước khi bật cờ');
    }

    // 6. Takeaways
    const expectedTakeawaysCount = (localInsightsItem && localInsightsItem.key_takeaways) ? localInsightsItem.key_takeaways.length : 0;
    const takeaways = await page.$$eval('#insightTakeaways li', els => els.map(e => e.textContent.trim()));
    check('6.1', 'Mấu chốt bài giảng thực chiến (Key Takeaways)', takeaways.length >= Math.min(expectedTakeawaysCount, 3), `Render: ${takeaways.length} điểm mấu chốt (Kỳ vọng: ${expectedTakeawaysCount})`);

    // 7. Timestamps
    const expectedTimestamps = (localInsightsItem && localInsightsItem.key_timestamps) || [];
    const timestamps = await page.$$eval('#insightTimeline button', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    if (expectedTimestamps.length > 0) {
      check('7.1', 'Đủ mốc tua nhanh thời gian (Key Timestamps)', timestamps.length === expectedTimestamps.length, `Render: ${timestamps.length} mốc (Kỳ vọng: ${expectedTimestamps.length})`);
      if (timestamps.length >= 2) {
        const secondBtn = (await page.$$('#insightTimeline button'))[1];
        if (secondBtn) {
          await secondBtn.click();
          await page.waitForTimeout(400);
          const currTime = await page.$eval('#pv', el => el.currentTime);
          const targetSec = expectedTimestamps[1].seconds;
          const seekOk = Math.abs(currTime - targetSec) <= 1.5;
          check('7.2', 'Bấm mốc tua video nhảy chính xác từng giây', seekOk, `Video currentTime: ${currTime}s (Target: ${targetSec}s)`);
        }
      }
    } else {
      check('7.1', 'Mốc tua nhanh (không có mốc định sẵn)', true, 'Video chưa định nghĩa mốc tua');
    }

    // 8. Transcript segments
    if (expectedSegmentCount > 0) {
      const domSegCount = await page.$$eval('#transcriptList > div', els => els.length);
      check('8.1', 'Transcript tương tác render đủ phân đoạn', domSegCount === expectedSegmentCount, `DOM: ${domSegCount} segments (Kỳ vọng: ${expectedSegmentCount})`);
    }

    // 9. Errors
    const realConsoleErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('font'));
    const realNetworkErrors = networkErrors.filter(e => !e.includes('favicon'));
    check('9.1', '0 Console Error', realConsoleErrors.length === 0, `Lỗi: ${realConsoleErrors.join('; ') || '0 lỗi'}`);
    check('9.2', '0 Network Error 4xx/5xx', realNetworkErrors.length === 0, `Lỗi: ${realNetworkErrors.join('; ') || '0 lỗi'}`);

    // Screenshot proof
    const shotPath = path.join(PROOF_DIR, `proof-${SKU}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`\n📸 Đã chụp ảnh proof tại: ${shotPath}`);

  } catch (err) {
    console.error('❌ Lỗi khi thực thi E2E script:', err);
  } finally {
    await browser.close();
  }

  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;
  console.log(`\n===================================================================================`);
  console.log(`TỔNG KẾT E2E: ${passCount}/${totalCount} CHECKS PASS`);
  console.log(`ĐÁNH GIÁ: ${passCount === totalCount ? '✅ ĐẠT CHUẨN NGHIỆM THU E2E TỰ ĐỘNG' : '⚠️ CÒN ĐIỂM CHƯA ĐẠT'}`);
  console.log(`NHẮC NHỞ: Vẫn phải kiểm định lại bằng tay (trích xuất frame, nghe lại thoại, rà kịch bản)!`);
  console.log(`===================================================================================\n`);
})();
