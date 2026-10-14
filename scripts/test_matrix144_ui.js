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

  console.log('--- Navigating to /chienluoc?sub=matrix144 ---');
  await page.goto('http://127.0.0.1:8899/chienluoc?sub=matrix144', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check title & elements
  const panelVisible = await page.$eval('#cl-panel-matrix144', el => window.getComputedStyle(el).display !== 'none');
  const cardCount = await page.$$eval('#cl-matrix-grid article', els => els.length);
  const filterButtons = await page.$$eval('#cl-matrix-filter-chips button', els => els.length);

  console.log('Panel matrix144 visible:', panelVisible);
  console.log('Card count in matrix:', cardCount);
  console.log('Filter chips count:', filterButtons);
  console.log('Console errors:', errors);

  // Take screenshot
  const shotDir = path.join(__dirname, '..', '_tmp-proof');
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
  const shotPath = path.join(shotDir, 'chienluoc_matrix144_proof.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Screenshot saved to:', shotPath);

  // Test click filter
  if (filterButtons > 1) {
    console.log('Testing click on second filter chip...');
    await page.click('#cl-matrix-filter-chips button:nth-child(2)');
    await page.waitForTimeout(500);
    const visibleCards = await page.$$eval('#cl-matrix-grid article', els => els.filter(el => window.getComputedStyle(el).display !== 'none').length);
    console.log('Visible cards after filter:', visibleCards);
  }

  await browser.close();
  if (errors.length > 0 || cardCount !== 144) {
    console.error('TEST FAILED!');
    process.exit(1);
  } else {
    console.log('TEST ALL PASS 144/144 CARDS OK!');
  }
})();
