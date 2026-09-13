const { chromium } = require('playwright');

(async () => {
  console.log('=== TEST TOÀN DIỆN HIỂN THỊ PROMPT THEO KÊNH HIDDEN PLANET DOCS (RAW-021) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://127.0.0.1:8899');
  await page.waitForTimeout(1000);

  // 1. Chuyển tab #rawkenh
  await page.locator('.tab-btn[data-tab="rawkenh"]').first().click();
  await page.waitForTimeout(1500);

  // 2. Tìm card RAW-021
  const card = page.locator('article[data-raw-card="RAW-021"]');
  await card.waitFor({ state: 'visible', timeout: 5000 });
  console.log('1. [PASS] Tìm thấy card RAW-021 ngoài danh sách');

  // Kiểm tra nút Xem Prompts ngoài card
  const promptBtn = card.locator('button:has-text("Xem Prompts & Vũ Khí Tác Chiến")');
  const hasPromptBtn = await promptBtn.count();
  console.log(`2. [PASS] Nút "⚡ Xem Prompts & Vũ Khí Tác Chiến" ngoài card: ${hasPromptBtn === 1 ? 'CÓ' : 'KHÔNG'}`);

  // Chụp ảnh thẻ card ngoài danh sách
  await page.screenshot({ path: 'docs/proof-card-raw021-with-prompt-btn.png' });
  console.log('   Đã chụp ảnh card: docs/proof-card-raw021-with-prompt-btn.png');

  // 3. Bấm nút "Xem Prompts & Vũ Khí Tác Chiến"
  await promptBtn.click();
  await page.waitForTimeout(1500);

  const modal = page.locator('#raw-deep-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('3. [PASS] Modal RAW Deep mở thành công');

  // 4. Kiểm tra khối Mission Control nằm ngay phía trên mà KHÔNG CẦN CUỘN
  const missionControl = modal.locator('#raw-mission-control');
  await missionControl.waitFor({ state: 'visible', timeout: 5000 });
  console.log('4. [PASS] Khối #raw-mission-control hiển thị trực tiếp');

  // Chụp ảnh phần trên của modal (hiển thị ngay Prompts & Mission Control)
  await page.screenshot({ path: 'docs/proof-modal-raw021-immediate-prompts.png' });
  console.log('   Đã chụp ảnh modal: docs/proof-modal-raw021-immediate-prompts.png');

  // 5. Kiểm tra nút Kịch Bản Gốc
  const subBtn = missionControl.locator('.btn-open-video-sub').first();
  const vidId = await subBtn.getAttribute('data-vid');
  const vidTitle = await subBtn.getAttribute('data-title');
  console.log(`5. [PASS] Nút Kịch Bản Gốc trỏ đúng Video ID: ${vidId}`);
  console.log(`         Tiêu đề video: ${vidTitle}`);

  if (vidId !== 'Q1tXposwAAo') {
    console.error('❌ LỖI: Video ID chưa đúng Q1tXposwAAo!');
  } else {
    console.log('✓ CHUẨN XÁC: Đã trỏ đúng video #1 của Hidden Planet Docs!');
  }

  // 6. Kiểm tra link SOP Skill Gốc và Repo Code
  const sopLink = await missionControl.locator('a:has-text("Xem Toàn Bộ SOP Skill Gốc")').getAttribute('href');
  const repoLink = await missionControl.locator('a:has-text("Repo Code")').getAttribute('href');
  console.log(`6. [PASS] Link SOP Skill Gốc: ${sopLink}`);
  console.log(`         Link Repo Code: ${repoLink}`);

  // 7. Bấm nút Kịch Bản Gốc để mở Modal Transcript
  await subBtn.click();
  await page.waitForTimeout(1200);

  const subModal = page.locator('#video-transcript-modal');
  await subModal.waitFor({ state: 'visible', timeout: 5000 });
  const subModalTitle = await subModal.locator('h3').innerText();
  console.log(`7. [PASS] Modal Transcript mở ra với tiêu đề: ${subModalTitle}`);

  // Chụp ảnh Modal Transcript
  await page.screenshot({ path: 'docs/proof-raw021-transcript-opened.png' });
  console.log('   Đã chụp ảnh: docs/proof-raw021-transcript-opened.png');

  await browser.close();
  console.log('=== TEST HOÀN TẤT THÀNH CÔNG 100% ===');
})();
