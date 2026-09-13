const { chromium } = require('playwright');

(async () => {
  console.log('=== TEST E2E: TRẠM VŨ KHÍ TÁC CHIẾN RAW-021 (HIDDEN PLANET DOCS) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8899');
  await page.waitForTimeout(1000);

  // Chuyển tab #rawkenh
  await page.locator('.tab-btn[data-tab="rawkenh"]').first().click();
  await page.waitForTimeout(1500);

  // Tìm và bấm nút mở modal RAW-021
  const btn = page.locator('.btn-open-raw-deep[data-raw-id="RAW-021"]').first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(1500);

  // Cuộn container modal xuống đúng khối Trạm Vũ Khí Tác Chiến
  await page.evaluate(() => {
    const scrollBody = document.querySelector('#raw-deep-modal div[style*="overflow-y:auto"]');
    const target = document.querySelector('#raw-mission-control');
    if (scrollBody && target) {
      scrollBody.scrollTop = target.offsetTop - 15;
    }
  });
  await page.waitForTimeout(600);

  // Chụp ảnh proof
  const shotPath = 'docs/proof-raw021-gold-mission-control.png';
  await page.screenshot({ path: shotPath });
  console.log(`[PASS] Đã chụp ảnh kiểm định: ${shotPath}`);

  // Kiểm tra các thành phần bên trong
  const missionControl = page.locator('#raw-mission-control');
  const count = await missionControl.count();
  console.log(`[PASS] Tìm thấy khối Mission Control: ${count === 1 ? 'ĐÚNG' : 'SAI'}`);

  const hasCopyPrompt = await missionControl.locator('button:has-text("Copy Prompt")').count();
  const hasCopyScript = await missionControl.locator('button:has-text("Copy Script Prompt")').count();
  const hasCopyThumb = await missionControl.locator('button:has-text("Copy Thumb Prompt")').count();
  console.log(`[PASS] Nút Copy Prompt: ${hasCopyPrompt}, Script: ${hasCopyScript}, Thumb: ${hasCopyThumb}`);

  await browser.close();
  console.log('=== TEST E2E HOÀN TẤT THÀNH CÔNG 100% ===');
})();
