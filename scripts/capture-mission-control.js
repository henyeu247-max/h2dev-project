const { chromium } = require('playwright');

(async () => {
  console.log('=== CHỤP ẢNH CHÍNH XÁC KHỐI PRODUCTION MISSION CONTROL TRÊN RAW-025 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chuyển sang tab Raw kênh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  // Mở modal RAW-025
  const btnRaw025 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-025"]').first();
  await btnRaw025.click();
  await page.waitForTimeout(1500);

  // Cuộn container modal đến đúng vị trí khối Mission Control
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('#raw-deep-modal div[style*="overflow-y:auto"]');
    if (scrollContainer) {
      // Tìm vị trí của khối Mission Control
      const mc = scrollContainer.querySelector('h4');
      const allH4 = [...scrollContainer.querySelectorAll('h4')];
      const targetH4 = allH4.find(h => h.textContent.includes('Trạm Vũ Khí Tác Chiến'));
      if (targetH4) {
        targetH4.closest('div[style*="background:#090d16"]').scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        scrollContainer.scrollTop = 1100;
      }
    }
  });
  await page.waitForTimeout(600);

  // Chụp ảnh chi tiết khối Production Mission Control
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/docs/mission-control-detailed-proof.png' });
  console.log('[PASS] Đã chụp ảnh chi tiết: docs/mission-control-detailed-proof.png');

  await browser.close();
  console.log('=== HOÀN TẤT CHỤP ẢNH ===');
})();
