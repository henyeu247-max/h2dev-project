const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8899';
const PROOF_DIR = path.resolve(__dirname, '..', '_tmp-proof');
if (!fs.existsSync(PROOF_DIR)) fs.mkdirSync(PROOF_DIR, { recursive: true });

(async () => {
  const summary = {
    title: 'Adversarial Mobile Responsiveness & Interactive Stress Test Report',
    timestamp: new Date().toISOString(),
    viewport: { width: 390, height: 844 },
    routes_tested: [],
    overflow_results: {},
    modal_results: {},
    stress_results: {},
    console_errors: [],
    page_errors: [],
    verdict: 'PENDING'
  };

  console.log('=== STARTING CHALLENGER MOBILE STRESS TEST (390x844) ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.error('[BROWSER CONSOLE ERROR]:', text);
      summary.console_errors.push(text);
    }
  });

  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]:', err.message);
    summary.page_errors.push(err.message);
  });

  // -------------------------------------------------------------
  // TEST 1: HORIZONTAL OVERFLOW CHECK (SCAR-020) ACROSS 10 ROUTES
  // -------------------------------------------------------------
  console.log('[TEST 1] HORIZONTAL OVERFLOW CHECK ON MOBILE (390x844)');
  const routes = [
    { name: 'root', path: '/' },
    { name: 'chienluoc_default', path: '/chienluoc' },
    { name: 'chienluoc_workflow', path: '/chienluoc?sub=workflow' },
    { name: 'chienluoc_matrix144', path: '/chienluoc?sub=matrix144' },
    { name: 'chienluoc_principles', path: '/chienluoc?sub=principles' },
    { name: 'chienluoc_distribution', path: '/chienluoc?sub=distribution' },
    { name: 'chienluoc_policy', path: '/chienluoc?sub=policy' },
    { name: 'chienluoc_all', path: '/chienluoc?sub=all' },
    { name: 'player', path: '/player.html?sku=VIDEO-DD983D' },
    { name: 'learn', path: '/learn.html' }
  ];

  for (const r of routes) {
    console.log(`Checking route: ${r.name} (${r.path})...`);
    summary.routes_tested.push(r.path);
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      const scrollWidthDoc = doc.scrollWidth;
      const scrollWidthBody = body.scrollWidth;
      const innerWidth = window.innerWidth;

      // Find overflowing elements ignoring intentional scroll containers
      const overflowingElements = [];
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.nodeType !== 1) continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 2) {
          // Check ancestors for overflow-x: auto/scroll or overflow: hidden
          let parent = el.parentElement;
          let isContained = false;
          while (parent && parent !== doc) {
            const pStyle = window.getComputedStyle(parent);
            if (['auto', 'scroll', 'hidden'].includes(pStyle.overflowX) || ['auto', 'scroll', 'hidden'].includes(pStyle.overflow)) {
              isContained = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!isContained) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
              rectRight: Math.round(rect.right),
              clientWidth: clientWidth
            });
          }
        }
      }

      return {
        clientWidth,
        scrollWidthDoc,
        scrollWidthBody,
        innerWidth,
        bodyOverflows: scrollWidthBody > clientWidth,
        docOverflows: scrollWidthDoc > innerWidth,
        overflowingCount: overflowingElements.length,
        overflowingSample: overflowingElements.slice(0, 5)
      };
    });

    const isPass = !metrics.bodyOverflows && !metrics.docOverflows && metrics.overflowingCount === 0;
    summary.overflow_results[r.name] = {
      path: r.path,
      metrics,
      status: isPass ? 'PASS' : 'FAIL'
    };

    console.log(` -> ${r.name}: clientWidth=${metrics.clientWidth}, bodyScrollWidth=${metrics.scrollWidthBody}, docScrollWidth=${metrics.scrollWidthDoc}, uncontainedOverflows=${metrics.overflowingCount} [${isPass ? 'PASS' : 'FAIL'}]`);

    const shotPath = path.join(PROOF_DIR, `mobile_${r.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
  }

  // -------------------------------------------------------------
  // TEST 2: MODAL DIALOG STRESS TESTING ON MOBILE
  // -------------------------------------------------------------
  console.log('\n[TEST 2] MODAL DIALOGS STRESS TESTING ON MOBILE');

  // 2A: More Menu Sheet on /
  console.log('2A: Testing moreMenuSheet on / ...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const moreBtn = await page.$('#m-tab-more');
  let moreMenuPassed = false;
  if (!moreBtn) {
    console.error('FAIL: #m-tab-more not found in DOM on mobile root!');
  } else {
    // 1. Open More Menu
    await moreBtn.click();
    await page.waitForTimeout(300);
    const sheetExists = await page.$('#moreMenuSheet') !== null;
    const backdropExists = await page.$('#moreMenuBackdrop') !== null;
    const sheetAria = await page.$eval('#moreMenuSheet', el => ({
      role: el.getAttribute('role'),
      ariaModal: el.getAttribute('aria-modal'),
      tabIndex: el.tabIndex
    })).catch(() => null);

    console.log(' -> moreMenuSheet opened:', sheetExists, 'backdrop:', backdropExists, 'aria:', sheetAria);
    await page.screenshot({ path: path.join(PROOF_DIR, 'mobile_more_menu_open.png') });

    // 2. Close via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const sheetAfterEsc = await page.$('#moreMenuSheet') !== null;
    console.log(' -> sheet closed via Escape:', !sheetAfterEsc);

    // 3. Re-open and close via Backdrop click
    // Tapping at (x: 50, y: 200) is safely below the 56px sticky topbar and outside the bottom-right menu sheet
    await moreBtn.click();
    await page.waitForTimeout(300);
    await page.mouse.click(50, 200);
    await page.waitForTimeout(300);
    const sheetAfterBackdrop = await page.$('#moreMenuSheet') !== null;
    console.log(' -> sheet closed via backdrop click at (50, 200):', !sheetAfterBackdrop);

    // 4. Re-open and click menu item
    await moreBtn.click();
    await page.waitForTimeout(300);
    const firstMoreItem = await page.$('#moreMenuSheet button.more-item');
    if (firstMoreItem) {
      await firstMoreItem.click();
      await page.waitForTimeout(500);
    }
    const sheetAfterNav = await page.$('#moreMenuSheet') !== null;
    console.log(' -> sheet closed via item click:', !sheetAfterNav);

    moreMenuPassed = sheetExists && !sheetAfterEsc && !sheetAfterBackdrop && !sheetAfterNav;
  }

  summary.modal_results.moreMenu = {
    status: moreMenuPassed ? 'PASS' : 'FAIL'
  };

  // 2B: #docModal on /player.html?sku=VIDEO-DD983D
  console.log('\n2B: Testing #docModal on /player.html?sku=VIDEO-DD983D ...');
  await page.goto(`${BASE_URL}/player.html?sku=VIDEO-DD983D`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  let docModalPassed = false;
  // Locate doc button in #pdocslist or invoke viewDocInModal
  const docButton = await page.$('button[data-doc-file], .btn-doc-link');
  if (docButton) {
    await docButton.click();
  } else {
    await page.evaluate(() => {
      if (typeof window.viewDocInModal === 'function') {
        window.viewDocInModal('assets/docs/VIDEO-DD983D/SOP-KY-THUAT-EDIT-BROLL-THAT-NE-QUET-AI.md', 'SOP Kỹ thuật');
      }
    });
  }
  await page.waitForTimeout(600);

  const modalOpenMetrics = await page.evaluate(() => {
    const modal = document.getElementById('docModal');
    if (!modal) return null;
    const style = window.getComputedStyle(modal);
    const bodyOverflow = document.body.style.overflow;
    return {
      display: style.display,
      visibility: style.visibility,
      zIndex: style.zIndex,
      bodyOverflow: bodyOverflow,
      role: modal.getAttribute('role'),
      ariaModal: modal.getAttribute('aria-modal')
    };
  });

  console.log(' -> #docModal open state:', modalOpenMetrics);
  await page.screenshot({ path: path.join(PROOF_DIR, 'mobile_doc_modal_open.png') });

  // 1. Close via close button
  const closeBtn = await page.$('#docModal [data-action="close-doc"]');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  const modalAfterCloseBtn = await page.evaluate(() => {
    const modal = document.getElementById('docModal');
    return {
      display: window.getComputedStyle(modal).display,
      bodyOverflow: document.body.style.overflow
    };
  });
  console.log(' -> #docModal closed via button:', modalAfterCloseBtn);

  // 2. Re-open and close via Escape
  await page.evaluate(() => {
    if (typeof window.viewDocInModal === 'function') {
      window.viewDocInModal('assets/docs/VIDEO-DD983D/SOP-KY-THUAT-EDIT-BROLL-THAT-NE-QUET-AI.md', 'SOP Kỹ thuật');
    }
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const modalAfterEsc = await page.evaluate(() => {
    const modal = document.getElementById('docModal');
    return window.getComputedStyle(modal).display;
  });
  console.log(' -> #docModal closed via Escape:', modalAfterEsc === 'none');

  // 3. Re-open and close via backdrop click (click at top area of modal where panel bottom sheet doesn't reach, e.g. y=20)
  await page.evaluate(() => {
    if (typeof window.viewDocInModal === 'function') {
      window.viewDocInModal('assets/docs/VIDEO-DD983D/SOP-KY-THUAT-EDIT-BROLL-THAT-NE-QUET-AI.md', 'SOP Kỹ thuật');
    }
  });
  await page.waitForTimeout(300);
  // On mobile bottom-sheet (height 95vh = 801px), the top 42px (y: 0..42) is the backdrop area
  await page.mouse.click(20, 20);
  await page.waitForTimeout(300);
  const modalAfterBackdrop = await page.evaluate(() => {
    const modal = document.getElementById('docModal');
    return window.getComputedStyle(modal).display;
  });
  console.log(' -> #docModal closed via backdrop click at (20, 20):', modalAfterBackdrop === 'none');

  docModalPassed = modalOpenMetrics &&
                   modalOpenMetrics.display !== 'none' &&
                   modalAfterCloseBtn.display === 'none' &&
                   modalAfterCloseBtn.bodyOverflow === '' &&
                   modalAfterEsc === 'none' &&
                   modalAfterBackdrop === 'none';

  summary.modal_results.docModal = {
    modalOpenMetrics,
    modalAfterCloseBtn,
    closedViaEsc: modalAfterEsc === 'none',
    closedViaBackdrop: modalAfterBackdrop === 'none',
    status: docModalPassed ? 'PASS' : 'FAIL'
  };

  // -------------------------------------------------------------
  // TEST 3: RAPID INTERACTIVE STRESS TESTING
  // -------------------------------------------------------------
  console.log('\n[TEST 3] RAPID INTERACTIVE STRESS TESTING');

  // 3A: Fast sequential clicks across 8 cluster filter chips on /chienluoc?sub=matrix144
  console.log('3A: Fast sequential clicks on cluster filter chips (/chienluoc?sub=matrix144)...');
  await page.goto(`${BASE_URL}/chienluoc?sub=matrix144`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const filterButtons = await page.$$('#cl-matrix-filter-chips button');
  console.log(`Found ${filterButtons.length} filter buttons (All + 8 clusters).`);

  // Burst 1: rapid sequential clicks
  console.log('Running Burst 1: Sequential rapid clicking across all chips (50ms interval)...');
  for (let i = 0; i < filterButtons.length; i++) {
    await filterButtons[i].click();
    await page.waitForTimeout(50);
  }

  // Burst 2: reverse rapid clicking
  console.log('Running Burst 2: Reverse clicking (30ms interval)...');
  for (let i = filterButtons.length - 1; i >= 0; i--) {
    await filterButtons[i].click();
    await page.waitForTimeout(30);
  }

  // Burst 3: Rapid repeated toggles
  console.log('Running Burst 3: Rapid switching between cluster 1 and cluster 8 (20ms interval)...');
  for (let cycle = 0; cycle < 5; cycle++) {
    if (filterButtons[1]) await filterButtons[1].click();
    await page.waitForTimeout(20);
    if (filterButtons[filterButtons.length - 1]) await filterButtons[filterButtons.length - 1].click();
    await page.waitForTimeout(20);
  }

  // Click 'All' and verify DOM state
  await filterButtons[0].click();
  await page.waitForTimeout(300);

  const gridHealth = await page.evaluate(() => {
    const grid = document.getElementById('cl-matrix-grid');
    if (!grid) return { exists: false };
    const articles = grid.querySelectorAll('article');
    let visibleCount = 0;
    let corruptedCards = 0;
    articles.forEach(a => {
      if (window.getComputedStyle(a).display !== 'none') visibleCount++;
      const text = a.textContent || '';
      if (text.includes('NaN') || text.includes('undefined') || text.includes('[object Object]')) {
        corruptedCards++;
      }
    });
    return {
      exists: true,
      totalCards: articles.length,
      visibleCount,
      corruptedCards
    };
  });

  console.log('Grid health after rapid clicks:', gridHealth);
  const clusterFilterPass = gridHealth.exists && gridHealth.totalCards === 144 && gridHealth.visibleCount === 144 && gridHealth.corruptedCards === 0;

  summary.stress_results.cluster_filter_stress = {
    burst_clicks_completed: filterButtons.length * 2 + 10 + 1,
    gridHealth,
    status: clusterFilterPass ? 'PASS' : 'FAIL'
  };

  // 3B: SKU link navigation to /player.html?sku=VIDEO-DD983D
  console.log('\n3B: SKU link navigation to /player.html?sku=VIDEO-DD983D ...');
  const skuLink = await page.$('article[data-matrix-cluster] a[href*="VIDEO-DD983D"], a[href*="player.html?sku=VIDEO-DD983D"]');
  let navSuccess = false;
  let destTitle = '';
  if (skuLink) {
    const href = await skuLink.getAttribute('href');
    console.log('Found SKU link in matrix article:', href);
    await page.goto(`${BASE_URL}${href.startsWith('/') ? href : '/' + href}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    destTitle = await page.$eval('#ptitle', el => el.textContent.trim()).catch(() => '');
    const currentUrl = page.url();
    navSuccess = currentUrl.includes('sku=VIDEO-DD983D') && destTitle.length > 0;
    console.log(`Navigated to player. URL: ${currentUrl}, Title: "${destTitle}" [${navSuccess ? 'PASS' : 'FAIL'}]`);
  } else {
    console.log('Navigating directly to /player.html?sku=VIDEO-DD983D ...');
    await page.goto(`${BASE_URL}/player.html?sku=VIDEO-DD983D`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    destTitle = await page.$eval('#ptitle', el => el.textContent.trim()).catch(() => '');
    navSuccess = destTitle.length > 0;
  }

  summary.stress_results.sku_navigation = {
    destTitle,
    status: navSuccess ? 'PASS' : 'FAIL'
  };

  // 3C: Click transcript lines & verify video.currentTime seeks accurately
  console.log('\n3C: Transcript click-to-seek accuracy verification ...');
  // On mobile 390x844, switch to 'transcript' tab
  const transcriptTabBtn = await page.$('#playerTabSelector button[data-player-tab="transcript"]');
  if (transcriptTabBtn) {
    await transcriptTabBtn.click();
    await page.waitForTimeout(400);
  }

  const transcriptLines = await page.$$('#transcriptList .transcript-line');
  console.log(`Found ${transcriptLines.length} transcript lines.`);

  const seekResults = [];
  if (transcriptLines.length >= 3) {
    const indicesToTest = [0, Math.min(5, transcriptLines.length - 1), Math.min(15, transcriptLines.length - 1)];
    for (const idx of indicesToTest) {
      const lineEl = transcriptLines[idx];
      const targetSeekStr = await lineEl.getAttribute('data-seek');
      const targetSeek = parseFloat(targetSeekStr);

      await lineEl.click();
      await page.waitForTimeout(500);

      const actualCurrentTime = await page.$eval('#pv', v => v.currentTime);
      const diff = Math.abs(actualCurrentTime - targetSeek);
      const seekPass = diff <= 1.5;

      seekResults.push({
        lineIndex: idx,
        targetSeek,
        actualCurrentTime,
        diff,
        pass: seekPass
      });

      console.log(` -> Transcript line ${idx}: seekTarget=${targetSeek}s, actualTime=${actualCurrentTime.toFixed(2)}s, diff=${diff.toFixed(2)}s [${seekPass ? 'PASS' : 'FAIL'}]`);
    }
  }

  const allSeeksPass = seekResults.length > 0 && seekResults.every(s => s.pass);
  summary.stress_results.transcript_seek = {
    totalLines: transcriptLines.length,
    seekResults,
    status: allSeeksPass ? 'PASS' : 'FAIL'
  };

  // 3D: Toggle #btnWatched and verify localStorage / state updates
  console.log('\n3D: Toggle #btnWatched and state persistence verification ...');
  // Switch back to 'overview' tab on mobile
  const overviewTabBtn = await page.$('#playerTabSelector button[data-player-tab="overview"]');
  if (overviewTabBtn) {
    await overviewTabBtn.click();
    await page.waitForTimeout(300);
  }

  const btnWatched = await page.$('#btnWatched');
  let watchedTogglePass = false;
  if (!btnWatched) {
    console.error('FAIL: #btnWatched not found!');
  } else {
    const initialText = (await btnWatched.textContent()).trim();
    console.log(' -> Initial #btnWatched text:', initialText);

    // Click 1: Toggle
    await btnWatched.click();
    await page.waitForTimeout(400);
    const textAfterClick1 = (await btnWatched.textContent()).trim();
    const storageAfterClick1 = await page.evaluate(() => JSON.parse(localStorage.getItem('h2dev-watched') || '{}'));
    const isWatched1 = storageAfterClick1['VIDEO-DD983D']?.watched;

    console.log(' -> After Click 1: text:', textAfterClick1, 'storage.watched:', isWatched1);

    // Click 2: Revert
    await btnWatched.click();
    await page.waitForTimeout(400);
    const textAfterClick2 = (await btnWatched.textContent()).trim();
    const storageAfterClick2 = await page.evaluate(() => JSON.parse(localStorage.getItem('h2dev-watched') || '{}'));
    const isWatched2 = storageAfterClick2['VIDEO-DD983D']?.watched;

    console.log(' -> After Click 2: text:', textAfterClick2, 'storage.watched:', isWatched2);

    watchedTogglePass = (isWatched1 !== isWatched2) && (textAfterClick1 !== initialText) && (textAfterClick2 === initialText);
    console.log(' -> Toggle #btnWatched success:', watchedTogglePass);

    summary.stress_results.btn_watched_toggle = {
      initialText,
      textAfterClick1,
      textAfterClick2,
      isWatched1,
      isWatched2,
      status: watchedTogglePass ? 'PASS' : 'FAIL'
    };
  }

  // -------------------------------------------------------------
  // TEST 4: CONSOLE ERRORS & OVERALL EVALUATION
  // -------------------------------------------------------------
  console.log('\n[TEST 4] GLOBAL CONSOLE & PAGE ERRORS EVALUATION');
  console.log('Total console errors recorded:', summary.console_errors.length);
  console.log('Total page errors recorded:', summary.page_errors.length);
  if (summary.console_errors.length > 0) {
    console.log('Console errors detail:', summary.console_errors);
  }

  const allOverflowPass = Object.values(summary.overflow_results).every(r => r.status === 'PASS');
  const allModalsPass = Object.values(summary.modal_results).every(r => r.status === 'PASS');
  const allStressPass = Object.values(summary.stress_results).every(r => r.status === 'PASS');
  const zeroErrors = summary.console_errors.length === 0 && summary.page_errors.length === 0;

  if (allOverflowPass && allModalsPass && allStressPass && zeroErrors) {
    summary.verdict = 'APPROVE';
  } else {
    summary.verdict = 'REQUEST_CHANGES';
  }

  console.log(`\n========================================`);
  console.log(`FINAL VERDICT: ${summary.verdict}`);
  console.log(` - Overflow Check: ${allOverflowPass ? 'PASS' : 'FAIL'}`);
  console.log(` - Modal Dialogs: ${allModalsPass ? 'PASS' : 'FAIL'}`);
  console.log(` - Stress Interactions: ${allStressPass ? 'PASS' : 'FAIL'}`);
  console.log(` - 0 Console Errors: ${zeroErrors ? 'PASS' : 'FAIL'}`);
  console.log(`========================================\n`);

  const reportJsonPath = path.resolve(__dirname, '..', '_tmp-proof', 'challenger_results.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2), 'utf8');

  await browser.close();
  console.log('Test completed successfully. Output saved to _tmp-proof/challenger_results.json');
})();
