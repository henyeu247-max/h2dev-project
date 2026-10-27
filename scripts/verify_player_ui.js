const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyLesson(sku) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  
  const url = `http://127.0.0.1:8899/lotrinh/${sku}`;
  console.log(`\n========================================`);
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check Video element
  const videoSrc = await page.evaluate(() => {
    const v = document.getElementById('pv');
    return v ? v.src : null;
  });
  console.log(`[${sku}] Video element src:`, videoSrc);

  // Check Docs element
  const docsInfo = await page.evaluate(() => {
    const wrap = document.getElementById('pdocs');
    const isHidden = wrap ? wrap.classList.contains('hidden') : true;
    const list = document.getElementById('pdocslist');
    return {
      visible: !isHidden,
      htmlSnippet: list ? list.innerText.replace(/\n+/g, ' ').slice(0, 150) : null
    };
  });
  console.log(`[${sku}] Docs visible:`, docsInfo.visible, `| Text:`, docsInfo.htmlSnippet);

  // Check Badges
  const badges = await page.evaluate(() => {
    const el = document.getElementById('insightBadges');
    return el ? Array.from(el.querySelectorAll('span')).map(s => s.innerText.trim()) : [];
  });
  console.log(`[${sku}] Tool badges:`, badges);

  // Check Timestamps
  const timestamps = await page.evaluate(() => {
    const el = document.getElementById('insightTimeline');
    if (!el) return [];
    return Array.from(el.querySelectorAll('button')).map(b => ({
      time: b.innerText.trim().slice(0, 5),
      seek: b.getAttribute('data-seek'),
      text: b.innerText.trim().replace(/\n+/g, ' ')
    }));
  });
  console.log(`[${sku}] Timestamps count:`, timestamps.length);
  timestamps.forEach(t => console.log(`   - [${t.time}] (${t.seek}s) ${t.text.slice(0, 70)}`));

  // Check Takeaways
  const takeaways = await page.evaluate(() => {
    const el = document.getElementById('insightTakeaways');
    return el ? Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim().replace(/\n+/g, ' ')) : [];
  });
  console.log(`[${sku}] Takeaways count:`, takeaways.length);
  takeaways.forEach((tw, idx) => console.log(`   ${idx+1}. ${tw.slice(0, 85)}...`));

  // Check SOP in #insightEditSop
  const sop = await page.evaluate(() => {
    const el = document.getElementById('insightEditSop');
    if (!el) return { text: null, items: [] };
    const items = Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim());
    return {
      text: el.innerText.replace(/\n+/g, ' ').slice(0, 200),
      items
    };
  });
  console.log(`[${sku}] SOP summary:`, sop.text);
  sop.items.forEach(it => console.log(`   * ${it.slice(0, 75)}`));

  // Check Avoid flags
  const avoid = await page.evaluate(() => {
    const el = document.getElementById('insightAvoidFlags');
    return el ? Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim()) : [];
  });
  console.log(`[${sku}] Avoid flags (${avoid.length}):`);
  avoid.forEach(a => console.log(`   ! ${a.slice(0, 75)}`));

  // Save screenshot
  const screenshotPath = path.resolve(__dirname, `../screenshots_${sku}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[${sku}] Saved full-page screenshot: ${screenshotPath}`);

  await browser.close();
}

async function main() {
  await verifyLesson('VIDEO-a152a6');
  await verifyLesson('VIDEO-96b420');
}

main().catch(err => {
  console.error('Error verifying lesson:', err);
  process.exit(1);
});
