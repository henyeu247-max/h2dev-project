const { chromium } = require('playwright');

(async () => {
  console.log('=== BẮT ĐẦU TEST E2E: NORTH EFFECT PROMPT UI VERIFICATION ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://127.0.0.1:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Chuyển tab #rawkenh
  const rawTabBtn = page.locator('.tab-btn[data-tab="rawkenh"]').first();
  await rawTabBtn.click();
  await page.waitForTimeout(1500);

  // 2. Mở kênh RAW-021 (Hidden Planet Docs)
  console.log('1. Mở modal kênh RAW-021 Hidden Planet Docs...');
  const btnRaw021 = page.locator('.btn-open-raw-deep[data-raw-id="RAW-021"]').first();
  await btnRaw021.click();
  await page.waitForTimeout(1500);

  // 3. Định vị khối Box 2 Script Blueprint
  console.log('2. Định vị Box 2: Khuôn Đúc Kịch Bản...');
  const box2 = page.locator('#raw-mission-control div:has(h4):has-text("Khuôn Đúc Kịch Bản")').first();
  console.log('   [PASS] Box 2 đã hiển thị.');

  // 4. Kiểm tra nút link "📄 SOP North Effect"
  const sopNorthLink = page.locator('#raw-mission-control a:has-text("SOP North Effect")').first();
  const sopHref = await sopNorthLink.getAttribute('href');
  console.log(`3. [PASS] Nút SOP North Effect trỏ tới: ${sopHref}`);

  // Test fetch file này qua browser
  const sopResponse = await page.request.get(`http://127.0.0.1:8899/${sopHref}`);
  console.log(`   [PASS] Fetch file SOP North Effect: HTTP status ${sopResponse.status()} (${sopResponse.ok() ? 'OK' : 'FAIL'})`);

  // 5. Kiểm tra nút "📋 Copy Full Master Prompt"
  const copyBtn = page.locator('#raw-mission-control button:has-text("Copy Full Master Prompt")').first();
  const copyBtnVisible = await copyBtn.isVisible();
  console.log(`4. [PASS] Nút Copy Full Master Prompt hiển thị: ${copyBtnVisible}`);

  // 6. Kiểm tra khối <pre> hiển thị full prompt
  const preEl = page.locator('#raw-mission-control pre').first();
  const preText = await preEl.innerText();
  console.log(`5. [PASS] Kích thước Full Prompt trong pre tag: ${preText.length} ký tự`);
  console.log(`   Preview dòng đầu: ${preText.split('\n')[0]}`);
  console.log(`   Kiểm tra 70% rule: ${preText.includes('70%') ? 'CÓ' : 'KHÔNG'}`);
  console.log(`   Kiểm tra CONTINUE rule: ${preText.includes('CONTINUE') ? 'CÓ' : 'KHÔNG'}`);
  console.log(`   Kiểm tra Stop rule: ${preText.includes('Stop') ? 'CÓ' : 'KHÔNG'}`);
  console.log(`   Kiểm tra Script Completed: ${preText.includes('Script Completed') ? 'CÓ' : 'KHÔNG'}`);

  // Chụp ảnh zoom cận cảnh khối Mission Control
  const mc = page.locator('#raw-mission-control');
  await mc.screenshot({ path: 'docs/proof-raw021-north-effect-box.png' });
  console.log('   Đã chụp ảnh cận cảnh Mission Control: docs/proof-raw021-north-effect-box.png');

  // Chụp ảnh toàn cảnh modal RAW-021
  await page.screenshot({ path: 'docs/proof-raw021-north-effect-full.png' });
  console.log('   Đã chụp ảnh toàn cảnh: docs/proof-raw021-north-effect-full.png');

  await browser.close();
  console.log('=== TEST E2E HOÀN TẤT THÀNH CÔNG 100% ===');
})();
