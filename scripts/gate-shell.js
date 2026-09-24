#!/usr/bin/env node
/**
 * H2DEV — GATE SHELL & A11Y (P0)
 * ==========================================================================
 * Muc dich: chan hoi quy cho tang SHELL (khung trang) + A11Y co ban tren CA 3 trang
 *           (index / learn / player). Day la "1 viec 1 chuan" cho shell.
 *
 * Cach chay:  node scripts/gate-shell.js
 *             node scripts/gate-shell.js --probe     (tu kiem tra gate co that su bat loi)
 *
 * NGUON CHUAN (khong bia):
 *   - design-system/SKILL.md dong 198/266/283/284/338/341
 *   - assets/h2dev-shell.css   (class .h2-shell-*)
 *   - assets/h2dev-tokens.css  (--h2-header-h = 56px, --h2-touch-min = 44px)
 *
 * LUAT KIEM (9 nhom):
 *   [1] Skip-link: co DUNG 1, class .h2-shell-skip, href tro toi phan tu CO THAT
 *   [2] Footer: co DUNG 1, class .h2-shell-footer, border-top = 1px, DUNG chuoi chuan
 *   [3] Back-to-top: co DUNG 1, class .h2-shell-backtotop, >= 44x44
 *   [4] Header: class .h2-shell-header, cao DUNG 56px o MOI viewport
 *   [5] Logo: DUNG 1 cum brand chuan (radar SVG + wordmark), KHONG con o chu .brand-mark
 *   [6] Tablist ARIA: aria-label + moi tab co aria-controls (tro toi dich that) + aria-selected + roving tabindex
 *   [7] Toast: DUNG 1 #toast-box, role=status + aria-live=polite, z-index > auto
 *   [8] A11y status: DUNG 1 #a11y-status, aria-live + aria-atomic
 *   [9] Khong tran ngang + khong console error
 *
 * CHAY TREN BROWSER THAT (Playwright) — khong do bang curl/grep vi:
 *   - noi dung do JS sinh (SCAR-009)
 *   - trang thai an/hien theo breakpoint (mobile vs desktop)
 * ==========================================================================
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.H2_GATE_BASE || 'http://127.0.0.1:8899';
const PROBE = process.argv.indexOf('--probe') >= 0;

const PAGES = [
  { name: 'index', url: BASE + '/', html: 'index.html' },
  { name: 'learn', url: BASE + '/lotrinh', html: 'learn.html' },
  { name: 'player', url: BASE + '/lotrinh/VIDEO-DD983D', html: 'player.html' },
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, headerH: 56, touch: 36 },
  { name: 'mobile', width: 390, height: 844, headerH: 56, touch: 44 },
];
const FOOTER_STD = 'H2DEV \u00b7 kho faceless YouTube \u00b7 kh\u00f4ng c\u1ea7n \u0111\u0103ng nh\u1eadp';

/* --------------------------------------------------------------------------
   DANH SACH NGUON TUONG MINH (khong auto-detect mo ao — bai hoc SCAR-008).
   Moi trang phai liet ke ro: file HTML + cac file JS co the GHI de ARIA/shell.
   gate se doc noi dung THAT tren dia de doi chieu 2 lop DOM tinh <-> DOM dong.
   -------------------------------------------------------------------------- */
const SOURCES = {
  index: { html: 'index.html', js: ['assets/app/main.js', 'assets/app/tabs/nav.js'] },
  learn: { html: 'learn.html', js: ['assets/app/learn-main.js', 'assets/learn.js'] },
  player: { html: 'player.html', js: ['assets/app/player-main.js'] },
};

/* So lan khai bao DUNG cho tung trang — DO THAT tu bang _tmp-measure-names (khong doan).
   Sua code lam doi so nay => phai chu dong cap nhat bang (co y thuc), khong the "pass im lang". */
const EXPECT_NGUON = {
  //                    nAriaControls  nSetAriaControls  nShellSkip  nShellFooter  nRadar  nToastBox  nA11yStatus
  index:  { nAriaControls: 2, nSetAriaControls: 0, nShellSkip: 1, nShellFooter: 1, nRadar: 2, nToastBox: 1, nA11yStatus: 3 },
  learn:  { nAriaControls: 5, nSetAriaControls: 0, nShellSkip: 1, nShellFooter: 1, nRadar: 2, nToastBox: 1, nA11yStatus: 1 },
  player: { nAriaControls: 7, nSetAriaControls: 2, nShellSkip: 1, nShellFooter: 1, nRadar: 2, nToastBox: 2, nA11yStatus: 2 },
};

function loadSources() {
  const out = {};
  for (const k of Object.keys(SOURCES)) {
    const cfg = SOURCES[k];
    const files = [cfg.html].concat(cfg.js);
    let blob = '';
    const missing = [];
    for (const f of files) {
      const p = path.join(ROOT, f);
      if (!fs.existsSync(p)) { missing.push(f); continue; }
      blob += '\n/*FILE:' + f + '*/\n' + fs.readFileSync(p, 'utf8');
    }
    const has = s => blob.indexOf(s) >= 0;
    const count = s => (blob.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    /* DEM SO LAN KHAI BAO THAT (khong phai "co xuat hien chuoi nao do").
       LY DO (bai hoc SCAR-019): player-main.js ghi aria-controls tai 2 noi:
         (1) setPlayerTab() - doi trang thai khi nguoi dung bam tab
         (2) initPlayerTabKeyboard() - chot trang thai ngay khi nap (fix desktop an)
       Neu chi kiem "chuoi aria-controls co ton tai" thi xoa 1 trong 2 van PASS
       -> "pass im lang". Phai DEM dung so lan khai bao. */
    out[k] = {
      files: files, missing: missing,
      nAriaControls: count('aria-controls'),
      nSetAriaControls: count("setAttribute('aria-controls'"),
      nShellSkip: count('h2-shell-skip'),
      nShellFooter: count('h2-shell-footer'),
      nRadar: count('vd-radar'),
      nToastBox: count('toast-box'),
      nA11yStatus: count('a11y-status'),
      hasAriaControls: has('aria-controls'),
      hasTablist: has('role="tablist"') || has("role: 'tablist'") || has('tablist'),
      hasTabRole: has('role="tab"') || has("role: 'tab'"),
      hasShellSkip: has('h2-shell-skip'),
      hasShellFooter: has('h2-shell-footer'),
      hasRadar: has('vd-radar'),
      oldBrandMark: has('brand-mark'),
      hasToastBox: has('toast-box'),
      hasA11yStatus: has('a11y-status'),
    };
  }
  return out;
}

/* Neu --probe: tiem loi gia vao file tam de chung minh gate FAIL duoc */
function injectProbe(relFile, find, replace) {
  const p = path.join(ROOT, relFile);
  if (!fs.existsSync(p)) return null;
  const orig = fs.readFileSync(p, 'utf8');
  if (orig.indexOf(find) < 0) return null;
  fs.writeFileSync(p, orig.replace(find, replace), 'utf8');
  return () => fs.writeFileSync(p, orig, 'utf8');
}

async function collect(page, vp) {
  return page.evaluate((v) => {
    const q = s => document.querySelector(s);
    const qa = s => document.querySelectorAll(s);
    const de = document.documentElement;
    const vis = el => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || cs.position === 'fixed');
    };
    const bt = q('#btn-back-to-top, .h2-shell-backtotop');
    const sk = q('.h2-shell-skip');
    const ft = q('.h2-shell-footer');
    const hd = q('header');
    const tl = q('[role="tablist"]');
    const tabs = Array.from(qa('[role="tab"]'));
    const visTabs = tabs.filter(t => t.getBoundingClientRect().height > 0);
    const box = q('#toast-box');
    const a11y = q('#a11y-status');
    return {
      skip: { n: qa('.h2-shell-skip').length, href: sk ? sk.getAttribute('href') : null,
              targetOK: sk ? !!q(sk.getAttribute('href')) : false },
      footer: { n: qa('.h2-shell-footer').length, cls: ft ? (ft.className || '').includes('h2-shell-footer') : false,
                border: ft ? getComputedStyle(ft).borderTopWidth : null,
                text: ft ? ft.textContent.trim() : null },
      btt: { n: qa('.h2-shell-backtotop').length, cls: bt ? (bt.className || '').includes('h2-shell-backtotop') : false,
             w: bt ? Math.round(bt.getBoundingClientRect().width) : 0,
             h: bt ? Math.round(bt.getBoundingClientRect().height) : 0 },
      header: { cls: hd ? (hd.className || '').includes('h2-shell-header') : false,
                h: hd ? Math.round(hd.getBoundingClientRect().height) : 0 },
      logo: { radar: qa('.vd-radar').length, wordmark: qa('.vd-wordmark').length,
              brand: qa('a.h2-shell-brand, .vd-brand').length, oldMark: qa('.brand-mark').length },
      tablist: { present: !!tl, label: tl ? tl.getAttribute('aria-label') : null,
                 total: tabs.length,
                 ctrl: tabs.filter(t => t.hasAttribute('aria-controls')).length,
                 ctrlOK: tabs.filter(t => t.hasAttribute('aria-controls') && q('#' + t.getAttribute('aria-controls'))).length,
                 selected: tabs.filter(t => t.hasAttribute('aria-selected')).length,
                 roving: tabs.filter(t => t.getAttribute('tabindex') === '0').length,
                 visCount: visTabs.length,
                 visMinH: visTabs.length ? Math.min.apply(null, visTabs.map(t => Math.round(t.getBoundingClientRect().height))) : -1 },
      toast: { n: qa('#toast-box').length, role: box ? box.getAttribute('role') : null,
               live: box ? box.getAttribute('aria-live') : null, z: box ? getComputedStyle(box).zIndex : null,
               pos: box ? getComputedStyle(box).position : null },
      a11y: { n: qa('#a11y-status').length, live: a11y ? a11y.getAttribute('aria-live') : null,
              atomic: a11y ? a11y.getAttribute('aria-atomic') : null },
      hScroll: de.scrollWidth - de.clientWidth,
      minTouch: v.touch,
    };
  }, vp);
}

(async () => {
  let restores = [];
  if (PROBE) {
    /* PROBE phai tiem loi vao DUNG LOP ma gate khang dinh la co kiem.
       1) Lop SOURCE (JS/HTML): xoa aria-controls trong player-main.js -> [6b] phai FAIL.
       2) Lop RUNTIME: xoa aria-controls khoi HTML -> [6] phai FAIL.
       Neu ca 2 deu KHONG lam gate FAIL => gate la "pass im lang" (SCAR-008). */
    const r1 = injectProbe('assets/app/player-main.js',
      "if (!b.hasAttribute('aria-controls')) b.setAttribute('aria-controls', 'playerMain');", '/* PROBE */');
    const r2 = injectProbe('player.html', 'aria-controls="playerMain"', '');
    if (!r1 && !r2) { console.log('[PROBE] KHONG tiem duoc loi -> gate chua duoc kiem chung. DUNG.'); process.exit(2); }
    if (r1) restores.push(r1);
    if (r2) restores.push(r2);
    console.log('[PROBE] Da tiem loi: xoa aria-controls o CA 2 lop (player.html + player-main.js).');
    console.log('[PROBE] Ky vong: gate PHAI bao FAIL ca [6] (runtime) lan [6b] (source).');
  }

  const SRC = loadSources();
  for (const k of Object.keys(SRC)) {
    if (SRC[k].missing.length) console.log('[CANH BAO] ' + k + ': thieu file nguon: ' + SRC[k].missing.join(', '));
  }

  const browser = await chromium.launch();
  let runs = 0, fail = 0;
  const allProblems = [];

  for (const pg of PAGES) {
    for (const vp of VIEWPORTS) {
      runs++;
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
      await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await page.waitForTimeout(1300);
      const d = await collect(page, vp);
      const pr = [];

      // [1] Skip-link
      if (d.skip.n !== 1) pr.push('[1] skip-link=' + d.skip.n + ' (phai dung 1)');
      else if (!d.skip.href || d.skip.href.charAt(0) !== '#') pr.push('[1] skip href="' + d.skip.href + '"');
      else if (!d.skip.targetOK) pr.push('[1] skip href="' + d.skip.href + '" tro toi phan tu KHONG ton tai');
      // [2] Footer
      if (d.footer.n !== 1) pr.push('[2] footer=' + d.footer.n + ' (phai dung 1)');
      else {
        if (!d.footer.cls) pr.push('[2] footer thieu class .h2-shell-footer');
        if (d.footer.border !== '1px') pr.push('[2] footer border-top=' + d.footer.border + ' (chuan 1px)');
        if (d.footer.text !== FOOTER_STD) pr.push('[2] footer text LECH: "' + d.footer.text + '"');
      }
      // [3] Back-to-top
      if (d.btt.n !== 1) pr.push('[3] back-to-top=' + d.btt.n + ' (phai dung 1)');
      else {
        if (!d.btt.cls) pr.push('[3] back-to-top thieu class .h2-shell-backtotop');
        if (d.btt.w < 44 || d.btt.h < 44) pr.push('[3] back-to-top ' + d.btt.w + 'x' + d.btt.h + ' < 44x44');
      }
      // [4] Header
      if (!d.header.cls) pr.push('[4] header thieu class .h2-shell-header');
      if (d.header.h !== vp.headerH) pr.push('[4] header=' + d.header.h + ' (chuan ' + vp.headerH + ' o ' + vp.name + ')');
      // [5] Logo
      if (d.logo.radar !== 1) pr.push('[5] radar=' + d.logo.radar + ' (phai dung 1)');
      if (d.logo.wordmark !== 1) pr.push('[5] wordmark=' + d.logo.wordmark + ' (phai dung 1)');
      if (d.logo.brand !== 1) pr.push('[5] cum brand chuan=' + d.logo.brand + ' (phai dung 1)');
      if (d.logo.oldMark !== 0) pr.push('[5] con o chu .brand-mark cu x' + d.logo.oldMark);
      // [6] Tablist ARIA
      if (d.tablist.present && d.tablist.total > 0) {
        if (!d.tablist.label) pr.push('[6] tablist thieu aria-label');
        if (d.tablist.ctrl !== d.tablist.total) pr.push('[6] aria-controls ' + d.tablist.ctrl + '/' + d.tablist.total);
        if (d.tablist.ctrlOK !== d.tablist.total) pr.push('[6] aria-controls tro sai dich ' + d.tablist.ctrlOK + '/' + d.tablist.total);
        if (d.tablist.selected !== d.tablist.total) pr.push('[6] aria-selected ' + d.tablist.selected + '/' + d.tablist.total);
        if (d.tablist.roving < 1) pr.push('[6] khong co roving tabindex (0 tab co tabindex=0)');
        if (d.tablist.visCount > 0 && d.tablist.visMinH < vp.touch) {
          pr.push('[6] touch target tab=' + d.tablist.visMinH + 'px < ' + vp.touch + 'px (' + vp.name + ')');
        }
      }
      /* [6b] DOI CHIEU 2 LOP: DOM TINH (HTML) <-> DOM DONG (runtime) + DEM SO LAN KHAI BAO.
         -----------------------------------------------------------------------------
         LY DO (bai hoc SCAR-008/019 — da chung minh bang PROBE, khong suy doan):
         Ban dau gate chi do DOM runtime. player.html CO san aria-controls trong HTML
         -> gate PASS. Nhung khi do XOA dong setAttribute('aria-controls') trong
         player-main.js thi DOM runtime VAN dung => gate bao ALL PASS 6/6 (PASS IM LANG).
         Lan sua thu 2 chi doi chieu "chuoi co ton tai" -> VAN FAIL (vi trong file con
         1 lan khai bao khac + 1 dong comment). Phai DEM dung SO LAN KHAI BAO.
         => Luat nay chot: so lan khai bao DUNG BANG so lan doi chieu duoc ghi o
            EXPECT_NGUON ben duoi. Sua so luong khai bao ma khong cap nhat bang = FAIL. */
      if (d.tablist.present) {
        const src = SRC[pg.name];
        if (src) {
          const exp = EXPECT_NGUON[pg.name];
          if (exp) {
            const bad = [];
            for (const key of Object.keys(exp)) {
              if (src[key] !== exp[key]) bad.push(key + '=' + src[key] + ' (phai la ' + exp[key] + ')');
            }
            if (bad.length) pr.push('[6b] SO LAN KHAI BAO NGUON LECH -> ' + bad.join(' ; '));
          } else {
            pr.push('[6b] thieu bang EXPECT_NGUON cho trang "' + pg.name + '"');
          }
        } else {
          pr.push('[6b] khong nap duoc nguon cho trang "' + pg.name + '"');
        }
      }
      // [7] Toast
      if (d.toast.n !== 1) pr.push('[7] #toast-box=' + d.toast.n + ' (phai dung 1)');
      else {
        if (d.toast.role !== 'status') pr.push('[7] #toast-box role=' + d.toast.role + ' (chuan status)');
        if (d.toast.live !== 'polite') pr.push('[7] #toast-box aria-live=' + d.toast.live + ' (chuan polite)');
        if (!d.toast.z || d.toast.z === 'auto') pr.push('[7] #toast-box z-index=' + d.toast.z);
      }
      // [8] A11y status
      if (d.a11y.n !== 1) pr.push('[8] #a11y-status=' + d.a11y.n + ' (phai dung 1)');
      else {
        if (d.a11y.live !== 'polite') pr.push('[8] #a11y-status aria-live=' + d.a11y.live);
        if (d.a11y.atomic !== 'true') pr.push('[8] #a11y-status aria-atomic=' + d.a11y.atomic);
      }
      // [9] Tran ngang + console error
      if (d.hScroll > 0) pr.push('[9] TRAN NGANG ' + d.hScroll + 'px');
      if (errs.length) pr.push('[9] console error x' + errs.length + ': ' + errs[0].slice(0, 80));

      const tag = pg.name + '/' + vp.name;
      if (pr.length) { fail++; allProblems.push(tag + ' :: ' + pr.join(' | ')); console.log('  [FAIL] ' + tag); pr.forEach(x => console.log('         ' + x)); }
      else console.log('  [PASS] ' + tag);
      await ctx.close();
    }
  }
  await browser.close();
  restores.forEach(r => r());

  console.log('\n' + '='.repeat(64));
  if (PROBE) {
    if (fail > 0) console.log('PROBE OK: gate BAT DUOC loi tiem vao (' + fail + '/' + runs + ' luot FAIL).');
    else console.log('PROBE THAT BAI: gate KHONG bat duoc loi tiem vao -> gate KHONG dang tin.');
  } else {
    console.log(fail === 0
      ? 'GATE SHELL & A11Y: ALL PASS ' + runs + '/' + runs
      : 'GATE SHELL & A11Y: THAT BAI ' + fail + '/' + runs + ' luot');
  }
  console.log('='.repeat(64));
  process.exitCode = (PROBE ? (fail > 0 ? 0 : 1) : (fail === 0 ? 0 : 1));
})();
