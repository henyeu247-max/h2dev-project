const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('--- Navigating to /chienluoc?sub=workflow ---');
  await page.goto('http://127.0.0.1:8899/chienluoc?sub=workflow', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check 16 steps
  const stepCount = await page.$$eval('#cl-panel-workflow section .grid > div', els => els.length);
  const totalSkusInSteps = await page.$$eval('#cl-panel-workflow a[href*="player.html?sku="]', els => els.length);

  console.log('Step count in workflow:', stepCount);
  console.log('Total SKU links rendered in workflow:', totalSkusInSteps);
  console.log('Console errors:', errors);

  // Take screenshot
  const shotDir = path.join(__dirname, '..', '_tmp-proof');
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
  const shotPath = path.join(shotDir, 'chienluoc_workflow_16steps_proof.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Screenshot saved to:', shotPath);

  await browser.close();
  if (errors.length > 0 || stepCount !== 16 || totalSkusInSteps !== 144) {
    console.error('TEST FAILED!');
    process.exit(1);
  } else {
    console.log('TEST ALL PASS 16 STEPS COVERING 144/144 SKUS OK!');
  }
})();
