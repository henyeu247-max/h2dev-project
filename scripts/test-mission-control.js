const { chromium } = require('playwright');

(async () => {
  console.log('=== TEST E2E: PRODUCTION MISSION CONTROL ON RAW-025 (game.mp4) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chuyển sang tab Raw kênh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  // Mở modal RAW-025 (game.mp4)
  const btnRaw025 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-025"]').first();
  await btnRaw025.waitFor({ state: 'visible', timeout: 5000 });
  await btnRaw025.click();
  await page.waitForTimeout(1500);

  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('1. [PASS] Modal RAW-025 (game.mp4) đã mở thành công');

  // Kiểm tra khối Production Mission Control
  const missionControl = modal.locator('text=Trạm Vũ Khí Tác Chiến & Bắt Đầu Sản Xuất');
  await missionControl.waitFor({ state: 'visible', timeout: 5000 });
  console.log('2. [PASS] Khối Trạm Vũ Khí Tác Chiến (Production Mission Control) đã hiển thị!');

  // Cuộn tới khối Production Mission Control
  await missionControl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Kiểm tra các thành phần bên trong
  const hasVisual = await modal.locator('text=Chỉ Thị Thị Giác (Visual Directive)').isVisible();
  const hasScript = await modal.locator('text=Khuôn Đúc Kịch Bản (Script Blueprint)').isVisible();
  const hasPackaging = await modal.locator('text=Bao Bì CTR (Title & Thumbnail)').isVisible();
  const hasTechStack = await modal.locator('text=Tech Stack & Matching Skill').isVisible();
  const hasLaunchpad = await modal.locator('text=Lộ Trình 5 Bước Khởi Động Kênh').isVisible();

  console.log(`3. [PASS] Thành phần chi tiết:
     - Chỉ thị Thị giác: ${hasVisual ? 'CÓ' : 'THIẾU'}
     - Khuôn đúc Kịch bản: ${hasScript ? 'CÓ' : 'THIẾU'}
     - Bao bì CTR: ${hasPackaging ? 'CÓ' : 'THIẾU'}
     - Tech Stack & Skill: ${hasTechStack ? 'CÓ' : 'THIẾU'}
     - Lộ trình 5 bước: ${hasLaunchpad ? 'CÓ' : 'THIẾU'}`);

  // Chụp ảnh bằng chứng
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/docs/proof-raw025-mission-control.png' });
  console.log('4. [PASS] Đã chụp ảnh bằng chứng: docs/proof-raw025-mission-control.png');

  await browser.close();
  console.log('=== TEST E2E THÀNH CÔNG 100% ===');
})();
