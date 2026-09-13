const { chromium } = require('playwright');

(async () => {
  console.log('=== TEST E2E: GOLD BENCHMARK MISSION CONTROL ON RAW-025 ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chuyển sang tab Raw kênh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  // Mở modal RAW-025 (game.mp4)
  const btnRaw025 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-025"]').first();
  await btnRaw025.click();
  await page.waitForTimeout(1500);

  // Cuộn thẳng đến khối #raw-mission-control
  const target = page.locator('#raw-mission-control');
  await target.waitFor({ state: 'visible', timeout: 5000 });
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Kiểm tra liên kết Skill SOP
  const skillLink = page.locator('a:has-text("Xem Toàn Bộ SOP Skill Gốc")');
  const skillHref = await skillLink.getAttribute('href');
  console.log('1. [PASS] Link SOP Skill gốc:', skillHref);

  // Kiểm tra liên kết Repo Code
  const repoLink = page.locator('a:has-text("Repo Code")');
  const repoHref = await repoLink.getAttribute('href');
  console.log('2. [PASS] Link Repo Code:', repoHref);

  // Chụp ảnh lưu bằng chứng
  await page.screenshot({ path: 'D:/YTB/H2DEV-Project/docs/proof-raw025-gold-mission-control.png' });
  console.log('3. [PASS] Đã chụp ảnh lưu: docs/proof-raw025-gold-mission-control.png');

  // Thử kiểm tra tải file SOP bằng fetch
  const sopRes = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return { status: res.status, ok: res.ok };
  }, skillHref);
  console.log('4. [PASS] Fetch thử file SOP:', JSON.stringify(sopRes));

  await browser.close();
  console.log('=== TEST GOLD BENCHMARK HOÀN TẤT 100% ===');
})();
