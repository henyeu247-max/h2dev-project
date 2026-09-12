const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/SaxukeB/.gemini/antigravity/brain/a2e4c820-6071-45ab-ad92-8c402a4bd23d';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Loading home page...');
  await page.goto('https://h2dev-learn.tonymmo.com/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  console.log('2. Clicking Lộ trình tab...');
  await page.locator('#tabs [data-tab="lotrinh"]').click();
  await page.waitForTimeout(2000);
  console.log('   URL after tab click:', page.url());

  console.log('3. Finding VIDEO-5c438a inside Lộ trình iframe...');
  const iframeEl = page.frameLocator('iframe.learn-frame');
  const targetRow = iframeEl.locator('.lesson-row[data-sku="VIDEO-5c438a" i]');
  const count = await targetRow.count();
  console.log('   Found VIDEO-5c438a rows:', count);

  if (count > 0) {
    const watchBtn = targetRow.locator('.lesson-watch, .row-thumb').first();
    await watchBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('4. Clicking watch on VIDEO-5C438A...');
    await watchBtn.dispatchEvent('click');
    await page.waitForTimeout(3500);
    await page.waitForSelector('#pmeta .badge', { timeout: 15000 });
    console.log('   Top URL after click:', page.url());
    
    const ptitle = await page.locator('#ptitle').textContent();
    console.log('   Video Title:', ptitle);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evidence-video-5c438a-live.png'), fullPage: false });
    console.log('   Screenshot saved: evidence-video-5c438a-live.png');

    console.log('5. Clicking Quay lại button...');
    await page.locator('#btnBack').click();
    await page.waitForTimeout(2500);
    console.log('   URL after back:', page.url());
  }

  await browser.close();
  console.log('Targeted check for VIDEO-5C438A completed successfully!');
})();
