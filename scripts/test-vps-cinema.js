const { chromium } = require('playwright');

(async () => {
  console.log('=== TEST LIVE VPS: TOP VIDEOS QUICK CINEMA PLAYER ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://h2dev-learn.tonymmo.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Chuyển sang tab Raw kênh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  // Mở modal RAW-001
  const btnRaw001 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-001"]').first();
  await btnRaw001.click();
  await page.waitForTimeout(1500);

  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // Cuộn tới danh sách top videos
  const topSection = modal.locator('text=Top Video Đang Phát Trên YouTube');
  await topSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Chụp ảnh Live VPS layout
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/_audit/vps-proof-top-videos-compact.png' });
  console.log('[PASS] Đã chụp ảnh VPS Live layout: _audit/vps-proof-top-videos-compact.png');

  // Test click nút Xem Video trên Live VPS
  const watchButtons = modal.locator('button:has-text("Xem Video")');
  await watchButtons.first().click();
  await page.waitForTimeout(1000);

  const quickModal = page.locator('#quick-video-modal');
  await quickModal.waitFor({ state: 'visible', timeout: 4000 });
  const iframeSrc = await quickModal.locator('iframe').getAttribute('src');
  console.log('[PASS] Live VPS Quick Cinema Embed URL: ' + iframeSrc);

  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/_audit/vps-proof-quick-cinema-live.png' });
  console.log('[PASS] Đã chụp ảnh VPS Live Quick Cinema: _audit/vps-proof-quick-cinema-live.png');

  await browser.close();
  console.log('=== TEST LIVE VPS 100% THÀNH CÔNG ===');
})();
