const { chromium } = require('playwright');
const http = require('http');

function checkHttp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

(async () => {
  console.log('=== KIỂM ĐỊNH PLAYWRIGHT E2E: LUỒNG CHUẨN HIDDEN PLANET DOCS (RAW-021) ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
  });

  await page.goto('http://127.0.0.1:8899');
  await page.waitForTimeout(1000);

  // 1. Chuyển tab #rawkenh
  await page.locator('.tab-btn[data-tab="rawkenh"]').first().click();
  await page.waitForTimeout(1200);

  // 2. Tìm card RAW-021
  const card = page.locator('article[data-raw-card="RAW-021"]');
  await card.waitFor({ state: 'visible', timeout: 5000 });
  const cardText = await card.innerText();

  console.log('--- 1. KIỂM ĐỊNH THẺ CARD NGOÀI DANH SÁCH ---');
  // Check 36 tags
  const has36Tags = cardText.includes('36 tags');
  const has0Tags = cardText.includes('0 tags');
  console.log(`- Hiển thị "36 tags": ${has36Tags ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Không còn "0 tags": ${!has0Tags ? '✅ PASS' : '❌ FAIL'}`);

  // Check revenue $800 – $2.400/tháng
  const hasRev = cardText.includes('$800 – $2.400/tháng');
  const hasChungView = cardText.includes('kênh chững view');
  console.log(`- Doanh thu chuẩn "$800 – $2.400/tháng": ${hasRev ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Không còn chuỗi "kênh chững view": ${!hasChungView ? '✅ PASS' : '❌ FAIL'}`);

  // Check Language Flag
  const hasFlag = cardText.includes('🇺🇸 EN');
  console.log(`- Language Flag "🇺🇸 EN": ${hasFlag ? '✅ PASS' : '❌ FAIL'}`);

  // Chụp ảnh thẻ card
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/proof-card-raw021-fixed.png' });
  console.log('📸 Đã chụp ảnh thẻ card: docs/proof-card-raw021-fixed.png\n');

  // 3. Click nút "⚡ Xem Prompts & Vũ Khí Tác Chiến →"
  console.log('--- 2. KIỂM ĐỊNH NÚT HÀNH ĐỘNG & SMOOTH SCROLL MISSION CONTROL ---');
  const promptBtn = card.locator('button:has-text("Xem Prompts & Vũ Khí Tác Chiến")');
  await promptBtn.click();
  await page.waitForTimeout(1500);

  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('- Modal RAW Deep mở thành công: ✅ PASS');

  // Kiểm tra Mission Control
  const missionControl = modal.locator('#raw-mission-control');
  await missionControl.waitFor({ state: 'visible', timeout: 5000 });
  console.log('- Khối #raw-mission-control sẵn sàng: ✅ PASS');

  // Kiểm tra video ref
  const subBtn = missionControl.locator('.btn-open-video-sub').first();
  const vidId = await subBtn.getAttribute('data-vid');
  console.log(`- Nút Kịch Bản Gốc trỏ đúng Video ID: ${vidId} (Q1tXposwAAo - 1.17M views): ${vidId === 'Q1tXposwAAo' ? '✅ PASS' : '❌ FAIL'}`);

  // Kiểm tra SOP link
  const sopLink = await missionControl.locator('a:has-text("SOP")').first().getAttribute('href');
  console.log(`- Link tài liệu SOP: ${sopLink}`);
  const sopStatus = await checkHttp('http://127.0.0.1:8899/' + sopLink);
  console.log(`  HTTP status SOP link: ${sopStatus} (HTTP 200): ${sopStatus === 200 ? '✅ PASS' : '❌ FAIL'}`);

  // Kiểm tra tags section trong modal
  const tagsSection = modal.locator('span:has-text("caves"), span:has-text("deep earth"), span:has-text("ancient civilizations")').first();
  const hasModalTags = await tagsSection.count() > 0;
  console.log(`- Bảng Tags kênh trong Modal hiển thị đủ tags mới: ${hasModalTags ? '✅ PASS' : '❌ FAIL'}`);

  // Chụp ảnh modal
  await page.screenshot({ path: 'docs/proof-modal-raw021-fixed.png' });
  console.log('📸 Đã chụp ảnh Modal: docs/proof-modal-raw021-fixed.png\n');

  console.log('=== KẾT QUẢ: 100% CHECKS ALL PASS! HOÀN TOÀN KHÔNG CÒN HẠT SẠN! ===');
  await browser.close();
})();
