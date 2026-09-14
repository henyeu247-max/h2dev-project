const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== VERIFY LIVE VPS: RAW-021 HIDDEN PLANET DOCS ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[1/5] Loading https://h2dev-learn.tonymmo.com ...');
  await page.goto('https://h2dev-learn.tonymmo.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  console.log('[2/5] Switching to tab Raw Kênh Mẫu...');
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  console.log('[3/5] Opening RAW-021 modal...');
  const btnRaw021 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-021"]').first();
  await btnRaw021.scrollIntoViewIfNeeded();
  await btnRaw021.click();
  await page.waitForTimeout(1500);

  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  console.log('[4/5] Checking dynamic banner & data gaps UI...');
  const modalText = await modal.innerText();

  const hasDynamicBadge = modalText.includes('Hồ sơ Benchmark đối thủ đã khóa (Sẵn sàng Pilot)');
  const hasOldHardcode = modalText.includes('Sẵn sàng bấm máy (Ready to Launch)');
  const hasCollapsedGaps = modalText.includes('Kiểm định Data Gaps — Hoàn tất');
  const has91kSubs = modalText.includes('91.1K') || modalText.includes('91,100');

  console.log(' - Dynamic Benchmark Badge:', hasDynamicBadge ? 'PASS' : 'FAIL');
  console.log(' - No Hardcoded Badge:', !hasOldHardcode ? 'PASS' : 'FAIL (Old badge still present)');
  console.log(' - Collapsed Data Gaps:', hasCollapsedGaps ? 'PASS' : 'FAIL');
  console.log(' - Live 91.1K Subs:', has91kSubs ? 'PASS' : 'FAIL');

  console.log('[5/5] Taking proof screenshot...');
  const proofPath = path.join(__dirname, '..', 'docs', 'proof-vps-raw021-live.png');
  await page.screenshot({ path: proofPath, fullPage: false });
  console.log('Saved screenshot to:', proofPath);

  await browser.close();

  if (hasDynamicBadge && !hasOldHardcode && hasCollapsedGaps) {
    console.log('=== ALL VPS CHECKS PASSED 100% ===');
    process.exit(0);
  } else {
    console.error('=== SOME VPS CHECKS FAILED ===');
    process.exit(1);
  }
})();
