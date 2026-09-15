const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

const BASE = process.env.H2DEV_BASE_URL || 'http://127.0.0.1:8899';
const OUT_PNG = 'docs/proof-raw124-full-audit.png';
const OUT_JSON = 'docs/proof-raw124-full-audit.json';

function assert(cond, msg, details = {}) {
  if (!cond) {
    const err = new Error(msg);
    err.details = details;
    throw err;
  }
}

(async () => {
  const results = { base: BASE, checks: [], consoleErrors: [], failedRequests: [] };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const add = (name, pass, detail = '') => {
    results.checks.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      results.consoleErrors.push(text);
      console.error('CONSOLE_ERROR', text);
    }
  });
  page.on('requestfailed', req => {
    results.failedRequests.push({ url: req.url(), failure: req.failure()?.errorText || '' });
  });

  try {
    const rawUrl = BASE.replace(/\/$/, '') + '/rawkenh';
    console.log(`Navigating to ${rawUrl}...`);
    await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 1. Check total raw cards count
    const allCards = page.locator('article[data-raw-card]');
    const count = await allCards.count();
    add('Raw Channels Cards Count', count === 124, `Expected 124, got ${count}`);
    assert(count === 124, `Expected 124 raw cards, got ${count}`);

    // 2. Check all 124 card image URLs return HTTP 200
    const imgUrls = await page.evaluate(() => {
      const cards = document.querySelectorAll('article[data-raw-card]');
      return Array.from(cards).map(c => ({
        id: c.getAttribute('data-raw-card'),
        src: c.querySelector('img')?.src || ''
      }));
    });

    let broken = [];
    let ok = 0;
    for (const item of imgUrls) {
      if (!item.src) {
        broken.push({ id: item.id, reason: 'missing-src' });
      } else {
        const resp = await page.request.get(item.src);
        if (resp.status() === 200) {
          ok++;
        } else {
          broken.push({ id: item.id, src: item.src, status: resp.status() });
        }
      }
    }
    add('All 124 Images Return HTTP 200', broken.length === 0, `Loaded: ${ok}/124, Broken: ${broken.length}`);
    assert(broken.length === 0, `Broken images: ${JSON.stringify(broken)}`);

    // 3. Check sample new channels rendered in DOM
    const testIds = ['RAW-110', 'RAW-114', 'RAW-117', 'RAW-121', 'RAW-124', 'RAW-136'];
    for (const tid of testIds) {
      const card = page.locator(`article[data-raw-card="${tid}"]`);
      const visible = await card.isVisible();
      const txt = await card.innerText();
      add(`New Channel ${tid} Visible in DOM`, visible, `Preview: ${txt.split('\n')[0]}`);
      assert(visible, `Card ${tid} should be visible`);
    }

    // 4. Test Search Filter with newly added channel
    const searchInput = page.locator('#raw-search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Overengineered');
      await page.waitForTimeout(400);
      const visibleCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article[data-raw-card]'))
          .filter(el => window.getComputedStyle(el).display !== 'none').length;
      });
      add('Search Filter on New Channel @OverengineeredEN', visibleCount >= 1, `Found ${visibleCount} matching cards`);
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // 5. Check Console Errors and 404 Requests
    add('Zero Console Errors', results.consoleErrors.length === 0, `Errors: ${results.consoleErrors.length}`);
    add('Zero Failed Network Requests', results.failedRequests.length === 0, `Failed: ${results.failedRequests.length}`);

    // 6. Screenshot Proof
    await page.screenshot({ path: OUT_PNG, fullPage: false });
    add('Screenshot Proof Captured', fs.existsSync(OUT_PNG), OUT_PNG);

    fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nAll tests completed! Results saved to ${OUT_JSON}`);
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
