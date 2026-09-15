// audit-10-kids-mission-control.js
// Kiem thu E2E: mo modal Mission Control cho 10 kenh Kids/Animation
// Xac nhan Trạm Vũ Khí Tác Chiến render + Voice Profile + Top Videos Most Viewed
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8899/rawkenh';
const TARGETS = [
  { id: 'RAW-001', title: 'Peekaboo Songs' },
  { id: 'RAW-010', title: "Landon's Animation Wheelhouse" },
  { id: 'RAW-023', title: 'LatentDiffusion' },
  { id: 'RAW-025', title: 'game.mp4' },
  { id: 'RAW-029', title: 'Mama Toons' },
  { id: 'RAW-031', title: 'Jota Drive' },
  { id: 'RAW-050', title: '新・戦艦ヤマト2030' },
  { id: 'RAW-075', title: 'The Regular Recap' },
  { id: 'RAW-079', title: 'Jesse Jokes' },
  { id: 'RAW-088', title: 'No Villains Are SAFE!' }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', r => failedRequests.push(r.url()));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('article[data-raw-card]', { timeout: 30000 });

  let pass = 0, fail = 0;
  const results = [];

  function check(name, ok, extra = '') {
    ok ? pass++ : fail++;
    results.push(`${ok ? 'PASS' : 'FAIL'} | ${name}${extra ? ' | ' + extra : ''}`);
  }

  for (const t of TARGETS) {
    try {
      // Tim card chua chip RAW-xxx, roi click nut '.btn-open-raw-deep' ben trong card
      const card = page.locator(`article[data-raw-card]:has-text("${t.id}")`).first();
      const cardVisible = await card.isVisible().catch(() => false);
      if (!cardVisible) { check(`${t.id} card visible`, false); continue; }
      const openBtn = card.locator('.btn-open-raw-deep').first();
      const btnVisible = await openBtn.isVisible().catch(() => false);
      if (!btnVisible) { check(`${t.id} open button visible`, false); continue; }
      await openBtn.click();
      await page.waitForTimeout(2000); // cho modal fetch profile+toolkit

      // Modal da mo
      const modalOpen = await page.locator('text=Phân Tích Sâu').count().catch(() => 0);
      const mcBox = await page.locator('#raw-mission-control').count().catch(() => 0);
      const voiceBox = await page.locator('#raw-voice-dna').count().catch(() => 0);
      const demoBox = await page.locator('#raw-demo-video').count().catch(() => 0);

      check(`${t.id} modal open`, modalOpen > 0 || mcBox > 0 || demoBox > 0);
      check(`${t.id} Mission Control render`, mcBox > 0);
      check(`${t.id} Voice Profile render`, voiceBox > 0);
      check(`${t.id} Demo Video render`, demoBox > 0);

      // Kiem tra noi dung Mission Control co du lieu (khong rong)
      if (mcBox > 0) {
        const tkText = await page.locator('#raw-mission-control').innerText().catch(() => '');
        const hasTarget = tkText.includes('Thị trường mục tiêu');
        const hasScript = tkText.includes('Khuôn Đúc Kịch Bản');
        const hasCTR = tkText.includes('Bao Bì CTR');
        const hasStack = tkText.includes('Tech Stack');
        check(`${t.id} MC: targetMarket+script+CTR+stack`, hasTarget && hasScript && hasCTR && hasStack);
      }
      // Dong modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      check(`${t.id} exception`, false, e.message.slice(0, 120));
    }
  }

  check('Zero console errors', consoleErrors.length === 0, `errors=${consoleErrors.length}`);
  check('Zero failed network requests', failedRequests.length === 0, `failed=${failedRequests.length}`);

  await page.screenshot({ path: 'docs/proof-10-kids-mission-control.png', fullPage: false });
  await browser.close();

  console.log(results.join('\n'));
  console.log(`\nAll tests completed! ${pass}/${pass + fail} PASS`);
  require('fs').writeFileSync('docs/proof-10-kids-mission-control.json', JSON.stringify({
    date: new Date().toISOString(),
    pass, fail, results
  }, null, 2));
  process.exit(fail > 0 ? 1 : 0);
})();
