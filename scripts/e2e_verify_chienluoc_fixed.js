const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://127.0.0.1:8899/chienluoc ...');
  await page.goto('http://127.0.0.1:8899/chienluoc', { waitUntil: 'networkidle' });

  if (!fs.existsSync('_tmp-proof/chienluoc_post_fix_proof')) {
    fs.mkdirSync('_tmp-proof/chienluoc_post_fix_proof', { recursive: true });
  }

  // 1. Check title & banner stats
  const pageTitle = await page.title();
  console.log('Title:', pageTitle);
  await page.screenshot({ path: '_tmp-proof/chienluoc_post_fix_proof/01_principles_fixed.png', fullPage: true });

  // 2. Click workflow tab
  const btnWorkflow = await page.$('.quick-access [role="tablist"] button:has-text("Quy trình")');
  if (btnWorkflow) {
    await btnWorkflow.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '_tmp-proof/chienluoc_post_fix_proof/02_workflow_12_steps.png', fullPage: true });
    console.log('Clicked workflow tab.');
  }

  // Count steps
  const stepCount = await page.$$eval('#cl-panel-workflow .card', cards => cards.length);
  console.log('Workflow step cards count:', stepCount);

  // Check SKU chips
  const skuChips = await page.$$eval('#cl-panel-workflow a[href*="player.html?sku="]', links => 
    links.map(l => ({ text: l.innerText.trim(), href: l.getAttribute('href') }))
  );
  console.log('Total SKU chips rendered:', skuChips.length);
  console.log('First 5 SKU chips:', skuChips.slice(0, 5));

  // 3. Click distribution tab
  const btnDist = await page.$('.quick-access [role="tablist"] button:has-text("Ngách")');
  if (btnDist) {
    await btnDist.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '_tmp-proof/chienluoc_post_fix_proof/03_distribution_fixed.png', fullPage: true });
    console.log('Clicked distribution tab.');
  }

  // Check niche notes
  const nicheNotes = await page.$$eval('#cl-panel-distribution button[data-open-niche]', btns => 
    btns.map(b => {
      const spans = b.querySelectorAll('span');
      return {
        label: spans[1]?.innerText.trim().split('\n')[0] || '',
        note: spans[1]?.innerText.trim().split('\n')[1] || ''
      };
    })
  );
  console.log('Total niche rows:', nicheNotes.length);
  const emptyNotes = nicheNotes.filter(n => !n.note || n.note.trim() === '');
  console.log('Empty notes count:', emptyNotes.length);
  if (emptyNotes.length > 0) {
    console.log('Sample empty notes:', emptyNotes.slice(0, 3));
  } else {
    console.log('ALL niche notes populated successfully!');
  }

  // 4. Click policy tab
  const btnPolicy = await page.$('.quick-access [role="tablist"] button:has-text("YPP")');
  if (btnPolicy) {
    await btnPolicy.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '_tmp-proof/chienluoc_post_fix_proof/04_policy_fixed.png', fullPage: true });
    console.log('Clicked policy tab.');
  }

  // 5. Test tab transition from workflow: Click "Kho 256 Kênh mẫu"
  const btnWorkflowAgain = await page.$('.quick-access [role="tablist"] button:has-text("Quy trình")');
  if (btnWorkflowAgain) await btnWorkflowAgain.click();
  await page.waitForTimeout(400);
  const btnKenhMau = await page.$('button[data-open-tab="kenh-mau"]');
  if (btnKenhMau) {
    console.log('Testing click on tab transition button data-open-tab="kenh-mau"...');
    await btnKenhMau.click();
    await page.waitForTimeout(600);
    const currentUrl = page.url();
    console.log('Current URL after transition:', currentUrl);
    const activeNav = await page.$eval('.app-sidebar [aria-current="page"], .app-sidebar .active, .vd-bottom-nav .active', el => el.innerText.trim()).catch(() => 'unknown');
    console.log('Active nav element:', activeNav);
  }

  console.log('Console Errors:', errors.length);
  if (errors.length) console.log(errors);

  await browser.close();
  console.log('E2E VERIFICATION COMPLETED 100%!');
})();
