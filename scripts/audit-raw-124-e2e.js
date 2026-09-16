const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

const BASE = process.env.H2DEV_BASE_URL || 'http://127.0.0.1:8899';
const OUT_PNG = 'docs/proof-raw124-full-audit.png';
const OUT_JSON = 'docs/proof-raw124-full-audit.json';
const IMG_TIMEOUT_MS = Number(process.env.H2DEV_IMG_TIMEOUT_MS || 90000);
const IMG_CONCURRENCY = Number(process.env.H2DEV_IMG_CONCURRENCY || 8);

function assert(cond, msg, details = {}) {
  if (!cond) {
    const err = new Error(msg);
    err.details = details;
    throw err;
  }
}

async function mapPool(items, concurrency, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return out;
}

(async () => {
  const results = {
    base: BASE,
    startedAt: new Date().toISOString(),
    checks: [],
    consoleErrors: [],
    failedRequests: [],
  };
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

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      results.consoleErrors.push(text);
      console.error('CONSOLE_ERROR', text);
    }
  });
  page.on('requestfailed', (req) => {
    results.failedRequests.push({ url: req.url(), failure: req.failure()?.errorText || '' });
  });

  try {
    const rawUrl = BASE.replace(/\/$/, '') + '/rawkenh';
    console.log(`Navigating to ${rawUrl}...`);
    await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const allCards = page.locator('article[data-raw-card]');
    const count = await allCards.count();
    // 16/09: count dong theo so records thuc trong JSON (truoc day hardcode 124)
    const rawJsonResp = await page.request.get(BASE.replace(/\/$/, '') + '/data-tabs/raw-kenh-mau.json');
    const rawJson = await rawJsonResp.json();
    const expectedCount = (rawJson.records || []).length;
    add('Raw Channels Cards Count', count === expectedCount, `Expected ${expectedCount}, got ${count}`);
    assert(count === expectedCount, `Expected ${expectedCount} raw cards, got ${count}`);

    const imgUrls = await page.evaluate(() => {
      const cards = document.querySelectorAll('article[data-raw-card]');
      return Array.from(cards).map((c) => ({
        id: c.getAttribute('data-raw-card'),
        src: c.querySelector('img')?.src || '',
      }));
    });

    const broken = [];
    let ok = 0;
    await mapPool(imgUrls, IMG_CONCURRENCY, async (item) => {
      if (!item.src) {
        broken.push({ id: item.id, reason: 'missing-src' });
        return;
      }
      try {
        let resp = await page.request.fetch(item.src, {
          method: 'HEAD',
          timeout: IMG_TIMEOUT_MS,
          maxRedirects: 5,
        });
        // Some hosts disallow HEAD — fallback GET but do not require full body wait forever
        if (resp.status() === 405 || resp.status() === 501) {
          resp = await page.request.get(item.src, { timeout: IMG_TIMEOUT_MS });
        }
        if (resp.status() === 200) {
          ok += 1;
          if (ok % 20 === 0 || ok === imgUrls.length) {
            console.log(`IMG_PROGRESS ${ok}/${imgUrls.length}`);
          }
        } else {
          broken.push({ id: item.id, src: item.src, status: resp.status(), via: 'head/get' });
        }
      } catch (e) {
        // Final GET fallback once
        try {
          const resp2 = await page.request.get(item.src, { timeout: IMG_TIMEOUT_MS });
          if (resp2.status() === 200) {
            ok += 1;
          } else {
            broken.push({ id: item.id, src: item.src, status: resp2.status(), err: String(e.message || e) });
          }
        } catch (e2) {
          broken.push({ id: item.id, src: item.src, reason: 'timeout-or-network', err: String(e2.message || e2) });
        }
      }
    });

    add(
      `All ${imgUrls.length} Images Return HTTP 200`,
      broken.length === 0 && ok === imgUrls.length,
      `Loaded: ${ok}/${imgUrls.length}, Broken: ${broken.length}`
    );
    assert(broken.length === 0 && ok === imgUrls.length, `Broken images: ${JSON.stringify(broken).slice(0, 2000)}`);

    const testIds = ['RAW-110', 'RAW-114', 'RAW-117', 'RAW-121', 'RAW-124', 'RAW-136', 'RAW-137', 'RAW-142'];
    for (const tid of testIds) {
      const card = page.locator(`article[data-raw-card="${tid}"]`);
      const visible = await card.isVisible();
      const txt = await card.innerText();
      add(`New Channel ${tid} Visible in DOM`, visible, `Preview: ${txt.split('\n')[0]}`);
      assert(visible, `Card ${tid} should be visible`);
    }

    const searchInput = page.locator('#fq, #raw-search-input, input.search-input-premium').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Overengineered');
      await page.waitForTimeout(400);
      const visibleCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article[data-raw-card]')).filter(
          (el) => window.getComputedStyle(el).display !== 'none'
        ).length;
      });
      add('Search Filter on New Channel @OverengineeredEN', visibleCount >= 1, `Found ${visibleCount} matching cards`);
      assert(visibleCount >= 1, 'Search should find Overengineered');
      await searchInput.fill('');
      await page.waitForTimeout(300);
    } else {
      add('Search Filter on New Channel @OverengineeredEN', false, 'search input missing');
      assert(false, 'search input missing');
    }

    add('Zero Console Errors', results.consoleErrors.length === 0, `Errors: ${results.consoleErrors.length}`);
    add('Zero Failed Network Requests', results.failedRequests.length === 0, `Failed: ${results.failedRequests.length}`);

    await page.screenshot({ path: OUT_PNG, fullPage: false });
    add('Screenshot Proof Captured', fs.existsSync(OUT_PNG), OUT_PNG);

    results.finishedAt = new Date().toISOString();
    results.passCount = results.checks.filter((c) => c.pass).length;
    results.totalChecks = results.checks.length;
    fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nAll tests completed! ${results.passCount}/${results.totalChecks} PASS -> ${OUT_JSON}`);
  } catch (err) {
    console.error('Test failed:', err);
    results.finishedAt = new Date().toISOString();
    results.error = String(err && err.message ? err.message : err);
    results.passCount = results.checks.filter((c) => c.pass).length;
    results.totalChecks = results.checks.length;
    try {
      fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    } catch (_) {}
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
