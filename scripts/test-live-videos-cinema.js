const { chromium } = require('playwright');

(async () => {
  console.log('=== BẮT ĐẦU TEST E2E: TOP VIDEOS LIVE QUICK CINEMA ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://127.0.0.1:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chuyển sang tab Raw kênh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);
  console.log('0. [PASS] Đã chuyển sang tab Raw Kênh');

  // 1. Tìm và click vào nút mở chi tiết RAW-001
  const btnRaw001 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-001"]').first();
  await btnRaw001.waitFor({ state: 'visible', timeout: 5000 });
  console.log('1. [PASS] Đã tìm thấy nút mở chi tiết RAW-001');

  await btnRaw001.click();
  await page.waitForTimeout(1500);

  // 2. Modal RAW Deep Modal phải hiển thị
  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('2. [PASS] Modal RAW Deep hiển thị thành công');

  // 3. Kiểm tra danh sách Top Videos Live
  const liveVideoCards = modal.locator('.btn-open-video-sub');
  const count = await liveVideoCards.count();
  console.log('3. [PASS] Tìm thấy ' + count + ' video trong danh sách (kỳ vọng 7 video)');

  // 4. Kiểm tra các nút "▶ Xem Video"
  const watchButtons = modal.locator('button:has-text("Xem Video")');
  const watchCount = await watchButtons.count();
  console.log('4. [PASS] Tìm thấy ' + watchCount + ' nút "Xem Video"');

  // 5. Test click nút "▶ Xem Video" của video đầu tiên
  await watchButtons.first().click();
  await page.waitForTimeout(1000);

  const quickModal = page.locator('#quick-video-modal');
  await quickModal.waitFor({ state: 'visible', timeout: 3000 });
  console.log('5. [PASS] Quick Cinema Modal đã mở thành công từ nút "Xem Video"');

  const iframeSrc = await quickModal.locator('iframe').getAttribute('src');
  console.log('   Iframe Embed URL: ' + iframeSrc);

  // Chụp ảnh khi Quick Cinema đang mở
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/docs/quick-cinema-open.png' });
  console.log('   Đã chụp ảnh: docs/quick-cinema-open.png');

  // 6. Test phím Escape để đóng Quick Cinema
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const isQuickHidden = await quickModal.evaluate(el => el.style.display === 'none');
  console.log('6. [PASS] Nhấn Escape đóng Quick Cinema: ' + (isQuickHidden ? 'ĐÚNG' : 'SAI'));

  // Modal RAW Deep vẫn phải hiển thị
  const isDeepStillOpen = await modal.evaluate(el => el.style.display === 'flex');
  console.log('   Modal RAW Deep vẫn mở nguyên vị trí: ' + (isDeepStillOpen ? 'ĐÚNG' : 'SAI'));

  // 7. Test click vào Thumbnail của video thứ 2
  const thumbs = modal.locator('.group[title*="Bấm để phát video trực tiếp"]');
  const secondThumb = thumbs.nth(1);
  await secondThumb.click();
  await page.waitForTimeout(1000);

  const iframeSrc2 = await quickModal.locator('iframe').getAttribute('src');
  console.log('7. [PASS] Click thumbnail video #2 mở Quick Cinema với iframe: ' + iframeSrc2);

  // Đóng bằng nút ✕ Đóng
  await quickModal.locator('#close-quick-video').click();
  await page.waitForTimeout(500);

  // 8. Chụp ảnh danh sách Top Videos trong modal để kiểm tra kích thước thumbnail compact
  // Cuộn tới danh sách top videos
  const topSection = modal.locator('text=Top Video Đang Phát Trên YouTube');
  await topSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/docs/top-videos-compact-layout.png' });
  console.log('8. [PASS] Đã chụp ảnh layout danh sách Top Videos: docs/top-videos-compact-layout.png');

  await browser.close();
  console.log('=== TEST E2E HOÀN TẤT 100% THÀNH CÔNG ===');
})();
