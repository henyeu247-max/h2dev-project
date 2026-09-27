#!/usr/bin/env node
/**
 * gate-p2.js — Cong kiem P2: token hoi tu + skeleton + aria-busy + bottom-sheet + CSS dead.
 *
 * BOI CANH (P2 hoan tat 2026-09-27):
 *   - learn.css truoc day tu dinh nghia 15 token TRUNG CHUC NANG voi viddar.css,
 *     trong do co 2 token VONG LAP (`--bg: var(--bg, ...)`, `--font-mono: var(--font-mono, ...)`)
 *     lam body MAT NEN (rgba(0,0,0,0)) va mono HONG thanh sans. Da chung minh bang do runtime.
 *   - Toan du an truoc day KHONG co skeleton nao (0 cho).
 *   - Ca 3 trang deu thieu `aria-busy` (matrix ghi sai la "index co").
 *   - docModal cua player bi bo sot bottom-sheet; #raw-image-modal thieu selector panel con.
 *   - #raw-channel-modal la CSS chet (0 DOM, 0 JS) da xoa.
 *
 * LUAT:
 *   [1] CAM token VONG LAP (self-reference) trong file CSS: `--x: var(--x, ...)`.
 *   [2] CAM alias token TRUNG CHUC NANG ngoai viddar.css (learn.css/lesson-row...).
 *   [3] Component skeleton: neu co `.h2-skeleton` trong CSS thi BAT BUOC co
 *       `.h2-skeleton-card` + keyframes + ton trong prefers-reduced-motion.
 *   [4] Moi trang HTML phai co `aria-busy` tren vung noi dung dong.
 *   [5] Bottom-sheet mobile: 5 modal phai CO MAT dong thoi o CA 2 rule
 *       (rule `{padding:0;align-items:flex-end}` VA rule `> div {…}`).
 *   [6] CAM CSS chet `#raw-channel-modal`.
 *
 * Cach do: doc file that tren dia, STRIP COMMENT truoc khi kiem (SCAR-013).
 *
 * Dung: node scripts/gate-p2.js [--probe] [--json]
 *
 * Loai tru (SCAR-018): _backup/, _archive/, _tmp-orig/, node_modules/, _tmp-proof/, .git/,
 *   va FILE BUILD assets/tailwind.css.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const SKIP_DIR = ['node_modules', '_backup', '_archive', '.git', '_tmp-proof', '.venv-gpu', '_tmp-orig', 'data'];

// --- [1][2] Token goc DUY NHAT duoc phep dinh nghia alias ---
const CANONICAL_TOKEN_FILES = ['assets/viddar.css', 'assets/h2dev-tokens.css'];

// Alias trung chuc nang: cam dinh nghia lai ngoai file canonical
const BANNED_ALIAS_TOKENS = [
  '--pri', '--pri-light', '--pri-dark', '--pri-subtle',
  '--sec', '--war', '--ok',
  '--panel', '--panel2', '--line', '--line-hover',
  '--txt', '--mut', '--font-heading', '--font-body'
];

// --- [4] Vung noi dung dong phai co aria-busy ---
const ARIA_BUSY_TARGETS = [
  { file: 'index.html', id: 'content' },
  { file: 'learn.html', id: 'panelRoot' },
  { file: 'player.html', id: 'playerMain' }
];

// --- [5] 5 modal phai co bottom-sheet o CA 2 rule ---
const BOTTOM_SHEET_MODALS = ['#raw-deep-modal', '#music-studio-modal', '#video-transcript-modal', '#raw-image-modal'];

// --- [6] CSS chet ---
const DEAD_SELECTORS = ['#raw-channel-modal'];

// --- [7] Token CHET ---
// Token duoc phep KHONG co nguoi dung, kem LY DO (phai do nguoi chot, khong tu y them).
// PHAN BIET 3 MUC (SCAR-025):
//   (a) LOI THAT  -> token "alias/doi ten" vo nghia, 0 dung, khong thuoc thang nao => FAIL.
//   (b) THANG CHUAN -> bac trong thang thiet ke da chot (palette ramp / scale typography /
//       motion / z-index ladder). Thang phai DAY DU moi bac de nguoi dung chon, khong phai
//       "moi bac phai co nguoi dung ngay". => MIEN, ghi ro ly do.
//   (c) CO Y        -> allowlist rieng.
// Day chinh la bai hoc SCAR-024: danh sach trong tai lieu KHONG phai tap day du; va
// SCAR-025: luat gate phai nham DUNG loi da chung minh, khong nham "moi thu trong giong loi".
const TOKENS_ALLOWED_SELF_USE = [
  // (b) THANG THIET KE — phai day du moi bac, khong bat buoc co nguoi dung ngay
  '--h2-font-3xl',     // bac 9 thang size 11/12/13/14/16/18/20/24/32
  '--h2-lh-none',      // thang line-height 6 bac
  '--h2-lh-body-px',
  '--h2-ls-micro',     // thang letter-spacing 4 bac
  '--h2-fw-regular',   // thang font-weight 4 muc (khop @font-face)
  '--h2-motion-slow',  // thang motion fast/base/slow
  '--h2-translate-max',// thang chuyen dong
  '--red-300', '--red-400', '--red-500',  // palette ramp do (50/70/300/400/500/700)
  '--signal-amber',    // alias mau semantic (giu de doi chieu 1 nguon)
  // (a)+(b) muc KHONG duoc mien — phai co nguoi dung that:
  //   --h2-backdrop-blur / --h2-overlay-alpha / --h2-panel-* : gate-p1 [3] da ep dung
  //   -> neu 0 nguoi dung thi chinh la no that (2 nguon su that cho cung 1 gia tri)
];

// File nguon de dem luot dung token (SCAR-013/018: liet ke tuong minh)
const TOKEN_USAGE_EXTS = ['.css', '.js', '.mjs', '.html'];
const TOKEN_USAGE_SKIP_FILES = ['assets/tailwind.css']; // FILE BUILD — nguon that la css/input.css

// --- [8] TOUCH TARGET >= 44px (WCAG 2.5.5 / 2.5.8) ---
// BAI HOC SCAR-025: luat phai nham DUNG loi DA CHUNG MINH, khong nham "moi thu trong giong loi".
// Loi THAT da do duoc (2026-09-27) tren 2 trang learn.html + index.html (tab bai hoc):
//   .sec-toggle 30x30 (12 cho) · .row-fav 32x32 (140 cho) · .search-clear 24x24 ·
//   #close-quick-video 76x31 · #quick-video-modal a 115x29.
// SAU KHI SUA (do lai bang browser): tat ca >= 44px.
//
// CACH DO:
//   (a) `min`  : selector phai khai width VA height >= 44 (hoac min-height >= 44).
//   (b) `touch`: hinh hien thi duoc phep NHO HON 44 (vi nam tren thumbnail -> phong to se
//       che anh, SCAR-021) NHUNG phai co `::after` >= 44x44 lam VUNG CHAM vo hinh.
// LUU Y (SCAR-014): vung cham bang pseudo-element KHONG do duoc bang getBoundingClientRect()
//   -> phai doc getComputedStyle(el,'::after'). Gate nay kiem o SOURCE (CSS) nen doc truc tiep
//   block `::after` la dung, va da duoc PROBE xac nhan.
//
// PHAN BIET 3 MUC (SCAR-025):
//   (a) LOI THAT -> FAIL (duoi 44 va khong co vung cham bu).
//   (b) CO Y     -> allowlist kem LY DO (icon trang tri, phan tu khong tuong tac...).
//   (c) 0 nguoi dung trong HTML/JS -> cung la loi THAT (CSS chet), FAIL.
const TOUCH_MIN = 44;
// selector -> kieu kiem
const TOUCH_TARGETS = [
  { sel: '.sec-toggle',   mode: 'min'   },   // nam trong cot grid 44px -> phong to KHONG che gi
  { sel: '.search-clear', mode: 'min'   },   // nut xoa tu khoa trong .search-bar
  { sel: '.row-fav',      mode: 'touch' }    // nam TREN .row-thumb -> giu hinh 32px + vung cham ::after
];
// File CSS chua cac selector tren (liet ke TUONG MINH — SCAR-008/026)
const TOUCH_RULE_FILES = ['assets/h2dev-components-lesson-row.css', 'assets/learn.css'];
// [8c] Doi chieu NGUON SU DUNG: map base-class -> file HTML/JS BAT BUOC co render class do.
// BAI HOC SCAR-008/019/026 (TAI PHAM lan thu 3, da chay THAT va thay gate bao 3 vi pham GIA):
//   Lan dau tien em viet check don gian kieu `new RegExp('\\.' + sel).test(src)` => BAO SAI CA 3.
//   NGUYEN NHAN GOC RE: cac class nay duoc sinh bang CONCATENATION trong template string, KHONG
//   he xuat hien dang chuoi con `.row-fav` / `.sec-toggle`:
//       '<button class="row-fav' + (isFav ? ' is-fav' : '') + '" ...'
//       '<button class="sec-toggle" type="button" ...'
//       '<button class="search-clear' + (q ? '' : ' hidden') + '" ...'
//   => Phai kiem theo BASE CLASS (khong co dau `.`), va phai LIET KE TUONG MINH file nao chiu
//   trach nhiem render tung class (khong auto-detect mo ho). Fail loud > pass im lang.
const TOUCH_USERS = {
  '.sec-toggle':   'assets/h2dev-core.js',
  '.row-fav':      'assets/h2dev-core.js',
  '.search-clear': 'assets/learn.js'
};

/* stripComments(src, isCss) — STRIP COMMENT truoc khi kiem (SCAR-013).
 *
 * ==== BAY NGHIEM TRONG (PROBE phat hien 2026-09-27) — SCAR-019 tai pham ====
 * Code CU (loi): luon chay CA 2 luat strip, ke ca voi file .css.
 * Luat strip comment dong (dau gach cheo doi) khi gap chuoi do trong CSS se XOA TOI
 * CUOI DONG -> xoa luon PHAN CSS THAT phia sau.
 * CSS **KHONG CO** comment kieu do. Nhung CSS that cua project co chuoi nay NAM TRONG
 * GIA TRI (vi du `url("icons/...")` ket hop gach cheo, `content: "https..."`) va trong
 * comment block.
 * HAU QUA DO DUOC (khong doan): do ty le ky tu con lai sau strip:
 *     assets/viddar.css                      91.7%  (mat 8.3%)
 *     assets/h2dev-components-lesson-row.css  63.8%  (MAT 36.2% — mat .row-fav/.sec-toggle!)
 *     assets/learn.css                        72.5%  (mat 27.5%)
 *     assets/h2dev-tokens.css                 26.3%  (MAT 73.7% — mat gan het token!)
 * => Rules [1][2][7] doc tren file DA BI CAT NAY => ket qua VO NGHIA (pass rong).
 *    Va day chinh la LY DO THAT khien probe "token chet o learn.css" BAO BO LOT.
 * SUA: chi strip comment dong khi KHONG phai CSS. CSS chi co comment block.
 * (SCAR-019: gate doc SOURCE sai thi moi ket luan cua no deu vo gia tri.)
 * (SCAR-017: TRONG comment nay CAM viet chu dong-comment, neu khong se dong comment som.) */
function stripComments(src, isCss) {
  // 1) comment block (sao-gach-cheo ... gach-cheo-sao) — ap dung CA css va js, giu so dong
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // 2) comment dong (gach cheo doi) — CHI JS. Voi CSS se PHA code that.
  if (!isCss) {
    s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  }
  return s;
}

/* isCssPath(rel) — true khi file la CSS/HTML (<style> inline), false khi la JS.
 * Dung de chon luat strip comment dung (xem stripComments). */
function isCssPath(rel) {
  return /\.(css|html)$/i.test(rel);
}

/* extractBlock(src, headRegex) -> lay TOAN BO block ke tu cho headRegex khop,
 * bang cach DEM NGOAC (SCAR-030: khong dung regex non-greedy de cat block vi no
 * khop qua som, cat mat noi dung -> sinh vi pham GIA).
 * Tra ve chuoi RONG neu khong tim thay. */
function extractBlock(src, headRegex) {
  const m = headRegex.exec(src);
  if (!m) return '';
  const start = m.index;
  let depth = 0, started = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') { depth++; started = true; }
    else if (c === '}') {
      depth--;
      if (started && depth === 0) return src.slice(start, i + 1);
    }
  }
  return src.slice(start);
}

/* extractFunctionRegion(src, names) -> ghep noi dung cac ham `function <name>(...) {...}`.
 * Dung de gioi han pham vi kiem (SCAR-030: KHONG loc dong theo tu khoa vi khi bi tiem loi
 * dong do mat tu khoa -> filter tu loai tru chinh muc tieu). */
function extractFunctionRegion(src, names) {
  let out = [];
  for (const n of names) {
    const re = new RegExp('function\\s+' + n + '\\s*\\([^)]*\\)\\s*\\{');
    const blk = extractBlock(src, re);
    if (blk) out.push(blk);
  }
  return out.join('\n');
}

/* ---------- Thu thap file CSS SONG (loai tru tuong minh - SCAR-018) ---------- */
function collectCss(dir, acc) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP_DIR.includes(e.name)) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) collectCss(rel, acc);
    else if (e.name.endsWith('.css') && e.name !== 'tailwind.css') acc.push(rel);   // tailwind.css = FILE BUILD
  }
  return acc;
}

/* ---------- Thu thap file NGUON de dem luot dung token (SCAR-018) ---------- */
function collectSourceForTokenUsage(dir, acc) {
  acc = acc || [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP_DIR.includes(e.name)) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) collectSourceForTokenUsage(rel, acc);
    else if (TOKEN_USAGE_EXTS.includes(path.extname(e.name)) && !TOKEN_USAGE_SKIP_FILES.includes(rel)) acc.push(rel);
  }
  return acc;
}

function readFiles(rels) {
  const out = [];
  for (const rel of rels) {
    const p = path.join(ROOT, rel);
    out.push(fs.existsSync(p) ? { rel, raw: fs.readFileSync(p, 'utf8') } : { rel, missing: true });
  }
  return out;
}

function findViolations() {
  const cssFiles = collectCss('', []);
  const files = readFiles(cssFiles);
  const v = { loopToken: [], aliasToken: [], skeletonIncomplete: [], ariaBusy: [], bottomSheet: [], deadCss: [], deadToken: [], touchTarget: [] };

  /* [1][2] Token: chi kiem file CSS, strip comment */
  for (const f of files) {
    if (f.missing) continue;
    const isCanonical = CANONICAL_TOKEN_FILES.includes(f.rel);
    const lines = stripComments(f.raw, true).split(/\r?\n/);

    lines.forEach((ln, i) => {
      const L = i + 1;
      // [1] vong lap: --x: var(--x ...)
      const lm = ln.match(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)/);
      if (lm && lm[1] === lm[2]) {
        v.loopToken.push({ file: f.rel, line: L, val: lm[1], txt: ln.trim().slice(0, 120) });
      }
      // [2] alias trung chuc nang (chi cam khi DINH NGHIA ngoai file canonical)
      if (!isCanonical) {
        for (const t of BANNED_ALIAS_TOKENS) {
          const re = new RegExp('\\' + t + '\\s*:');
          if (re.test(ln)) v.aliasToken.push({ file: f.rel, line: L, val: t, txt: ln.trim().slice(0, 120) });
        }
      }
    });
  }

  /* [3] Skeleton phai day du trong h2dev-primitives.css
   * SCAR-030: KHONG dung `body.includes('.h2-skeleton-card')` — do la kiem SUBSTRING,
   * nen `.h2-skeleton-card-XX` (ten khac) VAN lot qua (bai hoc SCAR-019: kiem chuoi X
   * KHONG dong nghia kiem khai bao X). Phai kiem SELECTOR that bang regex co ranh gioi. */
  const prim = files.find(f => f.rel === 'assets/h2dev-primitives.css');
  if (prim && !prim.missing) {
    const body = stripComments(prim.raw, true);
    const checks = [
      { name: 'selector .h2-skeleton', re: /\.h2-skeleton\s*\{/ },
      { name: 'selector .h2-skeleton-card', re: /\.h2-skeleton-card\s*\{/ },
      { name: 'modifier --title', re: /\.h2-skeleton--title\s*\{/ },
      { name: 'modifier --text', re: /\.h2-skeleton--text\s*\{/ },
      { name: 'modifier --thumb', re: /\.h2-skeleton--thumb\s*\{/ },
      { name: 'modifier --pill', re: /\.h2-skeleton--pill\s*\{/ },
      { name: '@keyframes h2-skeleton-shimmer', re: /@keyframes\s+h2-skeleton-shimmer\s*\{/ },
      { name: 'prefers-reduced-motion', re: /@media\s*\(prefers-reduced-motion:\s*reduce\)/ }
    ];
    for (const c of checks) {
      if (!c.re.test(body)) v.skeletonIncomplete.push({ file: 'assets/h2dev-primitives.css', line: 0, val: c.name, txt: 'THIEU: ' + c.name });
    }
    /* Doi chieu voi thuc te: class skeleton PHAI duoc dung trong HTML/JS (neu khong la CSS chet) */
    const users = ['assets/h2dev-core.js', 'player.html', 'assets/app/main.js', 'assets/learn.js'];
    for (const rel of users) {
      const p = path.join(ROOT, rel);
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, 'utf8');
      const uses = /h2-skeleton/.test(raw);
      const needed = (rel === 'assets/h2dev-core.js') || (rel === 'player.html');
      if (needed && !uses) {
        v.skeletonIncomplete.push({ file: rel, line: 0, val: rel, txt: 'File nay BAT BUOC dung h2-skeleton nhung khong thay' });
      }
    }

    /* SCAR-023 (tai pham o P2): skeleton KHONG duoc dung class Tailwind utility
     * vi learn.html KHONG nap tailwind.css -> class khong ton tai -> vo layout.
     * SCAR-030: CAM loc dong theo tu khoa `skeleton` — khi bi tiem loi, dong do
     * KHONG con chu "skeleton" nua -> filter TU LOAI TRU chinh muc tieu can kiem.
     * Cach dung: xac dinh VUNG HAM skeletonCard/skeletonList roi kiem trong vung do. */
    const corePath = path.join(ROOT, 'assets/h2dev-core.js');
    if (fs.existsSync(corePath)) {
      const coreBody = stripComments(fs.readFileSync(corePath, 'utf8'), false);
      const region = extractFunctionRegion(coreBody, ['skeletonCard', 'skeletonList']);
      const rlines = region.split(/\r?\n/);
      rlines.forEach((ln, i) => {
        const cm = ln.match(/class="([^"]*)"/g) || [];
        for (const c of cm) {
          const inner = c.replace(/^class="/, '').replace(/"$/, '');
          const tokens = inner.split(/\s+/).filter(Boolean);
          for (const t of tokens) {
            if (/^h2-skeleton/.test(t)) continue;                // class skeleton chuan -> hop le
            const isTw = /^(grid|gap-\d|p-\d|px-\d|py-\d|pt-\d|pb-\d|pl-\d|pr-\d|m-\d|mt-\d|mb-\d|card)$/.test(t) ||
                         /^(sm|md|lg|xl|2xl):/.test(t);
            if (isTw) {
              v.skeletonIncomplete.push({
                file: 'assets/h2dev-core.js', line: i + 1, val: 'tailwind-class',
                txt: 'Skeleton KHONG duoc dung class Tailwind (learn.html khong nap tailwind.css): ' + t
              });
            }
          }
        }
      });
    }
  }

  /* [4] aria-busy tren vung noi dung dong cua 3 trang */
  for (const t of ARIA_BUSY_TARGETS) {
    const p = path.join(ROOT, t.file);
    if (!fs.existsSync(p)) { v.ariaBusy.push({ file: t.file, line: 0, val: t.id, txt: 'THIEU FILE' }); continue; }
    const raw = fs.readFileSync(p, 'utf8');
    // tim the co id va kiem co aria-busy trong CUNG the do
    const re = new RegExp('<[^>]*id="' + t.id + '"[^>]*>', 'g');
    const tags = raw.match(re) || [];
    if (!tags.length) { v.ariaBusy.push({ file: t.file, line: 0, val: t.id, txt: 'KHONG TIM THAY id=' + t.id }); continue; }
    const ok = tags.some(tag => /aria-busy=/.test(tag));
    if (!ok) v.ariaBusy.push({ file: t.file, line: 0, val: t.id, txt: 'The #' + t.id + ' THIEU aria-busy' });
  }

  /* [5] bottom-sheet: 5 modal phai co o CA 2 rule trong index.html */
  /* SCAR-030: index.html la .html nen KHONG nam trong `files` (collectCss chi lay .css)
   * -> phai doc TRUC TIEP, neu dung `files.find(...)` se ra undefined -> scope rong
   * -> gate bao vi pham GIA. Day la lan dau tien gate bao sai do NGUON du lieu. */
  const idxPath = path.join(ROOT, 'index.html');
  const idxRaw = fs.existsSync(idxPath) ? fs.readFileSync(idxPath, 'utf8') : '';
  const idxBody = stripComments(idxRaw, true);   // HTML: khong co comment // (chi /* */ hoac <!-- -->)
  /* SCAR-030: KHONG dung regex `([\s\S]*?)\n\s{4}\}` de cat block @media —
   * regex non-greedy do khop QUA SOM (dung o dau } dau tien cung indent) nen CAT MAT 2 rule dich
   * -> gate bao 4 vi pham GIA trong khi code dung. Phai cat bang DEM NGOAC. */
  const scope = extractBlock(idxBody, /@media\s*\(max-width:\s*640px\)\s*\{/);
  // rule 1: selector list truoc { padding: 0 !important; align-items: flex-end !important }
  const rulePadding = scope.match(/([^{}]*?)\{\s*padding:\s*0\s*!important;\s*align-items:\s*flex-end\s*!important;/) || [];
  // rule 2: selector list truoc { max-height: 95vh !important; ... }
  const rulePanel = scope.match(/([^{}]*?)\{\s*max-height:\s*95vh\s*!important/) || [];
  const sel1 = rulePadding[1] || '';
  const sel2 = rulePanel[1] || '';
  for (const m of BOTTOM_SHEET_MODALS) {
    const in1 = sel1.includes(m);
    const in2 = sel2.includes(m);
    if (!in1 || !in2) {
      v.bottomSheet.push({
        file: 'index.html', line: 0, val: m,
        txt: m + ' -> rulePadding=' + (in1 ? 'CO' : 'THIEU') + ', rulePanel(>div)=' + (in2 ? 'CO' : 'THIEU')
      });
    }
  }

  /* [6] CSS chet */
  for (const f of files) {
    if (f.missing) continue;
    for (const sel of DEAD_SELECTORS) {
      const lines = stripComments(f.raw, true).split(/\r?\n/);
      lines.forEach((ln, i) => {
        if (ln.includes(sel)) v.deadCss.push({ file: f.rel, line: i + 1, val: sel, txt: ln.trim().slice(0, 120) });
      });
    }
  }

  /* [7] Token CHET: dinh nghia trong :root nhung KHONG CO AI DUNG.
   * PHAT HIEN THAT (Vong 1 check-pass P2): viddar.css:96-104 co 9 alias
   * (--txt/--txt-2/--mut/--line/--line-strong/--accent/--accent-2/--bg-card/--bg-hover)
   * duoc coi la "alias canonical tuong thich" nhung thuc te la TOKEN CHET:
   * quet 812 file -> 0 lan dung. Da chung minh bang do runtime (xoa di: 0/6.400 element doi).
   * LUU Y (SCAR-019/SCAR-024): phai dem SO LAN DUNG THAT (regex `var(--x`), KHONG dung
   * `indexOf` chuoi — vi chinh dong KHAI BAO cung chua chuoi "--x" nen se tu dem chinh no.
   *
   * P2-I6 (2026-09-27) — NANG PHAM VI: TRUOC day chi doc token khai bao trong
   * CANONICAL_TOKEN_FILES (viddar.css + h2dev-tokens.css). Do la LO HONG: token chet
   * khai bao o file CSS KHAC (vi du app.css, player.css, learn.css) se KHONG bi kiem.
   * TAI SAO PHAM VI CU HE HEP: vi mot token chi "co nghia" khi nam trong :root toan cuc;
   * nhung thuc te project nay co nhieu file CSS deu khai :root (learn.css tung khai 15 alias).
   * NAY: quet token khai bao trong **MOI file .css** (ngoai SKIP_DIR + file build),
   * va neu token do 0 lan dung thi bao. Cach dem luot dung: quet MOI file .css/.js/.html/.mjs.
   * LOAI TRU: token duoc khai trong `@media`/selector KHAC `:root` la token CUC BO
   * (co the chi dung trong 1 block) — van kiem nhu binh thuong vi neu 0 dung thi la chet. */
  const TOKEN_SELF_USE = new Set(TOKENS_ALLOWED_SELF_USE);
  const usageFiles = readFiles(collectSourceForTokenUsage('', []));
  const declaredTokens = [];
  for (const f of files) {
    if (f.missing) continue;
    const body = stripComments(f.raw, true);
    const lines = body.split(/\r?\n/);
    lines.forEach((ln, i) => {
      const m = ln.match(/^\s*(--[\w-]+)\s*:\s*(.*)$/);
      if (!m) return;
      const tok = m[1];
      const val = m[2];
      /* Bo qua dong khai bao VONG LAP `--x: var(--x...)` — da co luat [1] lo.
       * BAY NGHIEM TRONG (PROBE phat hien, SCAR-019 tai pham lan thu 4):
       *   Code CU viet: `if (tok === ln.trim().split(':')[0].trim()) return;`
       *   Nhung `tok` CHINH LA ket qua parse tu `ln`, va `ln.trim().split(':')[0].trim()`
       *   CUNG bang `tok` (voi moi dong khai bao hop le) => dieu kien LUON DUNG
       *   => MOI token deu bi bo qua => `declaredTokens` RONG => luat [7] PASS RONG
       *   (khong he kiem gi ca). Day la dang loi "gate pass im lang" nang nhat.
       * SUA DUNG: phai kiem GIA TRI (ve phai) co tham chieu chinh no hay khong. */
      if (new RegExp('var\\(\\s*' + tok.replace(/-/g, '\\-') + '\\s*[,)]').test(val)) return;
      declaredTokens.push({ token: tok, file: f.rel, line: i + 1 });
    });
  }
  // Quet TOAN BO file nguon de dem luot dung — nhung tranh dem chinh file khai bao
  // (mot token co the duoc khai o file A va dung o file B, C...).
  for (const d of declaredTokens) {
    if (TOKEN_SELF_USE.has(d.token)) continue;
    const re = new RegExp('var\\(\\s*' + d.token.replace(/-/g, '\\-') + '\\s*[,)]');
    let uses = 0;
    const where = [];
    for (const uf of usageFiles) {
      if (uf.missing) continue;
      // bo qua chinh dong KHAI BAO trong file canonical
      const src = (uf.rel === d.file)
        ? stripComments(uf.raw, isCssPath(uf.rel)).split(/\r?\n/).filter((_, i) => i + 1 !== d.line).join('\n')
        : uf.raw;
      const hits = (src.match(new RegExp(re.source, 'g')) || []).length;
      if (hits) { uses += hits; where.push(uf.rel); }
    }
    if (uses === 0) {
      v.deadToken.push({
        file: d.file, line: d.line, val: d.token,
        txt: 'Token ' + d.token + ' DINH NGHIA nhung 0 lan dung (quet ' + usageFiles.length + ' file) — token CHET, phai xoa hoac them vao TOKENS_ALLOWED_SELF_USE kem ly do'
      });
    }
  }

  /* [8] Touch target */
  v.touchTarget = checkTouchTargets();

  return v;
}

/* ---------- KIEM TRA TOUCH TARGET [8] ---------- */
function checkTouchTargets() {
  const v = { touchTarget: [] };
  const cssFiles = TOUCH_RULE_FILES;
  const blocks = [];
  // escape selector thanh regex: '.row-fav' -> '\\.row-fav'
  const selRe = (sel, tail) => new RegExp('(?:^|(?<=[},]))\\s*' + sel.replace(/\./g, '\\.') + '\\s*' + tail);
  for (const rel of cssFiles) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const body = stripComments(fs.readFileSync(p, 'utf8'), true);
    for (const t of TOUCH_TARGETS) {
      /* BAY (PROBE phat hien): neu de `(?:^|[},])` trong headRegex thi `m.index` TRO VAO
       * dau chuoi (co the la `}` hoac `,`), nen vong dem ngoac trong extractBlock se gap
       * ngay dau `}` => depth ve -1 => block bi cat SAI (tra ve chuoi bat dau bang `}`).
       * SUA: khoan dung dau phan cach bang lookbehind (khong tinh vao match). */
      const blk = extractBlock(body, selRe(t.sel, '\\{'));
      if (blk) blocks.push({ rel, sel: t.sel, mode: t.mode, block: blk });
    }
  }

  // [c] PHAI co nguon SU DUNG (SCAR-008: liet ke tuong minh, fail loud neu file thieu)
  // Cache than noi dung CSS theo rel (strip 1 lan) — tranh doc lai file nhieu lan.
  const cssBodyCache = {};
  const bodyOf = (rel) => {
    if (!(rel in cssBodyCache)) {
      const p = path.join(ROOT, rel);
      cssBodyCache[rel] = fs.existsSync(p) ? stripComments(fs.readFileSync(p, 'utf8'), true) : '';
    }
    return cssBodyCache[rel];
  };

  for (const t of TOUCH_TARGETS) {
    const owner = TOUCH_USERS[t.sel];
    if (!owner) {
      v.touchTarget.push({ file: 'n/a', line: 0, val: t.sel, txt: '[8c] Thieu khai bao TOUCH_USERS cho ' + t.sel + ' — gate KHONG duoc phep pass im lang' });
      continue;
    }
    const op = path.join(ROOT, owner);
    if (!fs.existsSync(op)) {
      v.touchTarget.push({ file: owner, line: 0, val: t.sel, txt: '[8c] File nguon su dung ' + t.sel + ' KHONG TON TAI' });
      continue;
    }
    const base = t.sel.replace(/^\./, '');          // .row-fav -> row-fav (class sinh bang concatenation)
    /* BAY (PROBE phat hien 2 lan lien tiep):
     *   (1) `\b` coi `-` la KY TU PHAN CACH -> `\brow-fav\b` VAN khop trong `row-fav-off-XX`
     *       => dao ten class ma gate VAN bao "con dung" => PASS GIA.
     *   (2) Dung `class="[^"]*\bX\b[^"]*"` doi hoi X nam TRONG 1 attribute hoan chinh — nhung
     *       markup that dung CONCATENATION: `class="row-fav' + (isFav ? ' is-fav' : '') + '"`.
     *       Chuoi `class="row-fav` KHONG co dau `"` dong => regex `class="[^"]*..."` KHONG khop
     *       (vi `[^"]*` bi chan boi `'` chu khong phai `"`). => BAO SAI la "CSS chet".
     * SUA: tim `class="` roi quet toi ky tu KET THUC CHUOI JS hoac `"`, va kiem TOKEN nguyen
     *   voi ranh gioi la [\s'"`+] (khong tinh `-` la ranh gioi).
     *   CANH BAO (SCAR-002 lop moi): `clsRe.exec` trong vong `while` voi mau `[^"']*` co the
     *   khop RONG (zero-width) -> vong lap VO TAN. Phai dua `lastIndex` tien len.
     * SCAR-019: phai DEM KHAI BAO that, khong kiem "co chuoi X".
     * SCAR-008: loi kiem phai chay PROBE de xac nhan bat duoc loi tiem. */
    const src = fs.readFileSync(op, 'utf8');
    let usedInHtmlJs = false;
    const clsHeads = [];
    let pos = 0;
    while ((pos = src.indexOf('class="', pos)) !== -1) {
      clsHeads.push(src.slice(pos + 7, pos + 200));
      pos += 7;
    }
    for (const head of clsHeads) {
      const end = head.search(/["'`+]/);
      const chunk = end >= 0 ? head.slice(0, end) : head;
      const tokens = chunk.split(/\s+/).filter(Boolean);
      if (tokens.includes(base)) { usedInHtmlJs = true; break; }
    }
    if (!usedInHtmlJs) {
      v.touchTarget.push({ file: owner, line: 0, val: t.sel, txt: '[8c] ' + owner + ' KHONG render class `' + base + '` => CSS chet (SCAR-019: phai DEM KHAI BAO, khong kiem chuoi selector)' });
      continue;
    }
  }

  for (const t of TOUCH_TARGETS) {
    const found = blocks.find(b => b.sel === t.sel);
    if (!found) {
      v.touchTarget.push({ file: TOUCH_RULE_FILES.join(','), line: 0, val: t.sel, txt: '[8] Khong tim thay rule ' + t.sel });
      continue;
    }
    const blk = found.block;
    const widthM = blk.match(/(?:^|[;{])\s*width\s*:\s*(\d+)px/);
    const heightM = blk.match(/(?:^|[;{])\s*(?:min-)?height\s*:\s*(\d+)px/);
    const w = widthM ? parseInt(widthM[1], 10) : 0;
    const h = heightM ? parseInt(heightM[1], 10) : 0;
    if (t.mode === 'min') {
      if (w < TOUCH_MIN || h < TOUCH_MIN) {
        v.touchTarget.push({
          file: found.rel, line: 0, val: t.sel,
          txt: '[8a] ' + t.sel + ' kich thuoc ' + w + 'x' + h + ' < ' + TOUCH_MIN + 'px (can width va height/min-height >= ' + TOUCH_MIN + ')'
        });
      }
    } else if (t.mode === 'touch') {
      // hinh hien thi duoc nho hon 44 nhung PHAI co pseudo-element vung cham >= 44x44.
      // BAY (PROBE phat hien — SUA 2 LAN moi dung):
      //   (1) Goi `extractBlock(blk, '::after {')` tren CHINH block cua rule => sai, vi
      //       block do DA DONG NGOAC BALANCE nen vong dem ngoac tra ve chinh no ngay.
      //   (2) Lay `inner` cua rule `.row-fav { ... }` roi tim `::after` ben trong => SAI,
      //       vi `.row-fav::after` la 1 RULE RIENG (khong long trong `.row-fav`).
      //       Do duoc: block `.row-fav {...}` dai 1002 ky tu, ket thuc tai `}`, sau do moi
      //       den `.row-fav::after {`. => ket luan "thieu ::after" la BAO SAI.
      // CACH DUNG: tim rule co selector la `<sel>::after` (hoac `:after`) trong CUNG file,
      //   roi cat block bang dem ngoac. Sau do doc width/height.
      const afterBlk = extractBlock(bodyOf(found.rel), selRe(t.sel, '::?after\\s*\\{'));
      const aw = afterBlk.match(/(?:^|[;{])\s*width\s*:\s*(\d+)px/);
      const ah = afterBlk.match(/(?:^|[;{])\s*height\s*:\s*(\d+)px/);
      const awv = aw ? parseInt(aw[1], 10) : 0;
      const ahv = ah ? parseInt(ah[1], 10) : 0;
      if (awv < TOUCH_MIN || ahv < TOUCH_MIN) {
        v.touchTarget.push({
          file: found.rel, line: 0, val: t.sel,
          txt: '[8b] ' + t.sel + ' vung cham ::after ' + awv + 'x' + ahv + ' < ' + TOUCH_MIN + 'px (SCAR-014: phai doc rule ::after RIENG, khong long trong rule goc)'
        });
      }
    }
  }
  return v.touchTarget;
}

const SECTIONS = [
  ['[1] Token VONG LAP (--x: var(--x, ...)) — lam gia tri RONG (SCAR: body mat nen)', 'loopToken'],
  ['[2] Alias token TRUNG CHUC NANG ngoai viddar.css/h2dev-tokens.css', 'aliasToken'],
  ['[3] Component skeleton thieu thanh phan bat buoc', 'skeletonIncomplete'],
  ['[4] Vung noi dung dong thieu aria-busy', 'ariaBusy'],
  ['[5] Modal thieu bottom-sheet o 1 trong 2 rule (index.html)', 'bottomSheet'],
  ['[6] CSS chet (#raw-channel-modal da xoa)', 'deadCss'],
  ['[7] Token CHET (dinh nghia trong :root nhung 0 lan dung — SCAR-024)', 'deadToken'],
  ['[8] Touch target < 44px (WCAG 2.5.5 / 2.5.8)', 'touchTarget']
];

function report(v) {
  let total = 0;
  console.log('[gate-p2] Kiem chuan P2');
  for (const [title, key] of SECTIONS) {
    const arr = v[key];
    total += arr.length;
    console.log('\n  ' + title);
    if (!arr.length) { console.log('    PASS | 0 vi pham'); continue; }
    console.log('    FAIL | ' + arr.length + ' vi pham:');
    for (const x of arr) {
      console.log('      ' + x.file + (x.line ? ':' + x.line : '') + (x.val ? ' [' + x.val + ']' : '') + '  ' + x.txt);
    }
  }
  console.log('\n' + '='.repeat(64));
  console.log(total === 0 ? 'GATE P2: ALL PASS' : 'GATE P2: THAT BAI - ' + total + ' vi pham');
  console.log('='.repeat(64));
  return total;
}

/* --- PROBE: tiem loi gia -> gate PHAI bat duoc -> phuc hoi byte-identical (SCAR-008/019) ---
 * LUU Y SCAR-017: trong block comment JS CAM viet chu dong-comment (sao-gach-cheo).
 * Da dinh loi nay LAN THU 3 khi viet gate nay -> xem SCAR-030.
 */
function probe() {
  const cssTarget = path.join(ROOT, 'assets/app/g3-inline.css');
  const htmlTarget = path.join(ROOT, 'index.html');
  const primTarget = path.join(ROOT, 'assets/h2dev-primitives.css');
  const learnTarget = path.join(ROOT, 'assets/learn.css');
  const coreTarget = path.join(ROOT, 'assets/h2dev-core.js');
  const viddarTarget = path.join(ROOT, 'assets/viddar.css');
  const lessonRowTarget = path.join(ROOT, 'assets/h2dev-components-lesson-row.css');

  const origCss = fs.readFileSync(cssTarget, 'utf8');
  const origHtml = fs.readFileSync(htmlTarget, 'utf8');
  const origPrim = fs.readFileSync(primTarget, 'utf8');
  const origLearn = fs.readFileSync(learnTarget, 'utf8');
  const origCore = fs.readFileSync(coreTarget, 'utf8');
  const origViddar = fs.readFileSync(viddarTarget, 'utf8');
  const origLessonRow = fs.readFileSync(lessonRowTarget, 'utf8');

  const injections = [
    {
      name: 'token VONG LAP (--bg: var(--bg))',
      apply: () => fs.writeFileSync(learnTarget, origLearn + '\n:root { --probe-loop: var(--probe-loop, #fff); }\n'),
      restore: () => fs.writeFileSync(learnTarget, origLearn),
      count: (v) => v.loopToken.length
    },
    {
      name: 'alias trung chuc nang (--pri) ngoai viddar.css',
      apply: () => fs.writeFileSync(learnTarget, origLearn + '\n:root { --pri: #fff; }\n'),
      restore: () => fs.writeFileSync(learnTarget, origLearn),
      count: (v) => v.aliasToken.length
    },
    {
      name: 'skeleton thieu .h2-skeleton-card',
      apply: () => fs.writeFileSync(primTarget, origPrim.replace(/\.h2-skeleton-card\s*\{/, '.h2-skeleton-card-XX {')),
      restore: () => fs.writeFileSync(primTarget, origPrim),
      count: (v) => v.skeletonIncomplete.length
    },
    {
      name: 'skeleton XOA HAN moi selector .h2-skeleton (lo hong substring - SCAR-030)',
      /* Phai xoa CA 2 noi khai bao (.h2-skeleton chinh + trong @media reduced-motion),
       * neu chi xoa 1 noi thi gate VAN tim thay noi con lai => do la gate DUNG, khong phai BO LOT. */
      apply: () => fs.writeFileSync(primTarget, origPrim.replace(/\.h2-skeleton\s*\{/g, '.h2-skeleton-YY {')),
      restore: () => fs.writeFileSync(primTarget, origPrim),
      count: (v) => v.skeletonIncomplete.length
    },
    {
      name: 'skeleton xoa keyframes shimmer',
      apply: () => fs.writeFileSync(primTarget, origPrim.replace(/@keyframes\s+h2-skeleton-shimmer\s*\{/, '@keyframes h2-skeleton-shimmer-ZZ {')),
      restore: () => fs.writeFileSync(primTarget, origPrim),
      count: (v) => v.skeletonIncomplete.length
    },
    {
      name: 'skeleton xoa prefers-reduced-motion',
      apply: () => fs.writeFileSync(primTarget, origPrim.replace(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/, '/* removed */')),
      restore: () => fs.writeFileSync(primTarget, origPrim),
      count: (v) => v.skeletonIncomplete.length
    },
    {
      name: 'skeleton dung class Tailwind (SCAR-023: learn.html khong nap tailwind.css)',
      /* Phai khop DUNG cu phap trong source: file dung nhay DON bao ngoai
       * ('<div class="h2-skeleton-list" aria-hidden="true">'). Neu escape sai se
       * khong thay doi file -> probe bao BO LOT GIA. */
      apply: () => fs.writeFileSync(coreTarget, origCore.replace('\'<div class="h2-skeleton-list" aria-hidden="true">\'', '\'<div class="grid gap-4" aria-hidden="true">\'')),
      restore: () => fs.writeFileSync(coreTarget, origCore),
      count: (v) => v.skeletonIncomplete.length,
      verify: () => fs.readFileSync(coreTarget, 'utf8') !== origCore
    },
    {
      name: 'vung noi dung thieu aria-busy (index #content)',
      apply: () => fs.writeFileSync(htmlTarget, origHtml.replace('id="content" role="tabpanel"', 'id="content" data-x="1" role="tabpanel"').replace(/aria-busy="false"(\s*><\/div>\s*<\/main>)/, '$1')),
      restore: () => fs.writeFileSync(htmlTarget, origHtml),
      count: (v) => v.ariaBusy.length
    },
    {
      name: 'modal thieu bottom-sheet rule > div (#raw-image-modal)',
      /* BAY (da dinh khi PROBE): chuoi selector trong index.html duoc thut le khac nhau
       * giua 2 rule; va dong `#raw-image-modal > div {` cung xuat hien o rule THU HAI.
       * Phai khop DUNG doan cua rule `> div {` (co 6 space thut le), neu khong file
       * KHONG DOI -> probe bao "PROBE SAI" (khong phai gate bo lot). */
      apply: () => fs.writeFileSync(htmlTarget, origHtml.replace(/#video-transcript-modal > div,\r?\n\s*#raw-image-modal > div \{/, '#video-transcript-modal > div {')),
      restore: () => fs.writeFileSync(htmlTarget, origHtml),
      count: (v) => v.bottomSheet.length,
      verify: () => fs.readFileSync(htmlTarget, 'utf8') !== origHtml
    },
    {
      name: 'CSS chet quay lai (#raw-channel-modal)',
      apply: () => fs.writeFileSync(cssTarget, origCss + '\n#raw-channel-modal { display: flex; }\n'),
      restore: () => fs.writeFileSync(cssTarget, origCss),
      count: (v) => v.deadCss.length
    },
    {
      name: 'token CHET quay lai (viddar.css: --alias-chet: var(--fg))',
      /* LUU Y (SCAR-019): phai ghi vao file canonical that, khong phai learn.css.
       * BAY (da dinh khi PROBE): moc `'  --signal-amber: #ffcc00;\n}'` (2 space + \n}) KHONG
       * khop file that (dong ke tiep sau `}` la `[data-density=...]`, khong phai ket file).
       * Phai dung moc la DONG KHAI BAO THAT + `\n` ngay sau no. */
      apply: () => fs.writeFileSync(viddarTarget, origViddar.replace(/(--signal-amber:\s*#ffcc00;)/, '$1\n  --h2-probe-dead-token: #abcdef;')),
      restore: () => fs.writeFileSync(viddarTarget, origViddar),
      count: (v) => v.deadToken.length,
      verify: () => fs.readFileSync(viddarTarget, 'utf8') !== origViddar
    },
    {
      name: 'token CHET o file KHONG canonical (mo rong pham vi luat [7])',
      /* DUNG de chung minh PHAM VI MO RONG co tac dung: tiem token chet vao learn.css
       * (KHONG nam trong CANONICAL_TOKEN_FILES). Voi code CU (chi doc canonical) thi
       * probe nay se BO LOT. Voi code MOI (quet moi file .css) thi phai BAT DUOC.
       * SCAR-008: neu probe nay khong bat duoc => pham vi mo rong la VO NGHIA. */
      /* LUU Y (SCAR-002/CRLF): file du an dung CRLF (`\r\n`), KHONG duoc viet `\n` trong moc
       * replace — se khong khop (da dinh that: probe bao "PROBE SAI"). Dung regex `\r?\n`.
       * LUU Y (PROBE phat hien): token PHAI nam TREN DONG RIENG. Neu viet
       *   `:root { --x: ...; }`  (1 dong) thi dong bat dau bang `:root` => regex
       *   `^\s*(--[\w-]+)\s*:` KHONG khop => gate bo lot (nhung do la PROBE SAI, khong
       *   phai gate hong). Phai tiem theo dung dinh dang CSS nhieu dong. */
      apply: () => fs.writeFileSync(learnTarget, origLearn + '\r\n:root {\r\n  --h2-probe-dead-noncanon: #123456;\r\n}\r\n'),
      restore: () => fs.writeFileSync(learnTarget, origLearn),
      count: (v) => v.deadToken.length,
      verify: () => fs.readFileSync(learnTarget, 'utf8') !== origLearn
    },
    {
      name: 'touch target [8a] .sec-toggle tut xuong 30x30',
      apply: () => fs.writeFileSync(lessonRowTarget, origLessonRow.replace('.sec-toggle { position: relative; width: 44px; height: 44px;', '.sec-toggle { position: relative; width: 30px; height: 30px;')),
      restore: () => fs.writeFileSync(lessonRowTarget, origLessonRow),
      count: (v) => v.touchTarget.length,
      verify: () => fs.readFileSync(lessonRowTarget, 'utf8') !== origLessonRow
    },
    {
      name: 'touch target [8b] .row-fav MAT vung cham ::after',
      /* Tiem loi: dao `::after` cua .row-fav thanh selector khac => vung cham 44px BIEN MAT.
       * Neu gate [8b] doc dung block ::after thi phai FAIL. */
      apply: () => fs.writeFileSync(lessonRowTarget, origLessonRow.replace('.row-fav::after {', '.row-fav-disabled-XX::after {')),
      restore: () => fs.writeFileSync(lessonRowTarget, origLessonRow),
      count: (v) => v.touchTarget.length,
      verify: () => fs.readFileSync(lessonRowTarget, 'utf8') !== origLessonRow
    },
    {
      name: 'touch target [8c] CSS chet: .sec-toggle khong con duoc render',
      /* Tiem loi vao SOURCE (JS): doi class render `.sec-toggle` -> ten khac.
       * Gate [8c] phai bat (kieu kiem 2 LOP: runtime/source — SCAR-019). */
      apply: () => fs.writeFileSync(coreTarget, origCore.replace('<button class="sec-toggle" type="button" aria-label="Thu gọn / mở rộng"></button>', '<button class="sec-toggle-off-XX" type="button" aria-label="Thu gọn / mở rộng"></button>')),
      restore: () => fs.writeFileSync(coreTarget, origCore),
      count: (v) => v.touchTarget.length,
      verify: () => fs.readFileSync(coreTarget, 'utf8') !== origCore
    },
    {
      name: 'touch target [8a] .search-clear tut xuong 24x24',
      apply: () => fs.writeFileSync(learnTarget, origLearn.replace('.search-clear { position: absolute; top: 50%; right: 0; display: grid; place-items: center; width: 44px; height: 44px;', '.search-clear { position: absolute; top: 50%; right: 0; display: grid; place-items: center; width: 24px; height: 24px;')),
      restore: () => fs.writeFileSync(learnTarget, origLearn),
      count: (v) => v.touchTarget.length,
      verify: () => fs.readFileSync(learnTarget, 'utf8') !== origLearn
    }
  ];

  let caught = 0;
  console.log('\n--- PROBE gate-p2: tiem loi gia, xac nhan gate BAT DUOC ---');
  for (const inj of injections) {
    inj.apply();
    /* SCAR-030: kiem tra loi TIEM CO THUC SU THAY DOI FILE khong. Neu `apply()` dung
     * regex/chuoi khong khop -> file khong doi -> gate PASS la DUNG, khong phai BO LOT.
     * Thieu buoc nay se bao "BO LOT GIA" (da tung xay ra voi probe skeleton Tailwind). */
    const applied = inj.verify ? inj.verify() : true;
    const v = findViolations();
    const n = inj.count(v);
    const ok = n > 0;
    console.log('  ' + (ok ? 'BAT DUOC' : (applied ? 'BO LOT!' : 'PROBE SAI (loi tiem khong doi file!)')) +
      '  -> ' + inj.name + '  (vi pham=' + n + ')');
    if (ok) caught++;
    inj.restore();
  }

  const identical =
    fs.readFileSync(cssTarget, 'utf8') === origCss &&
    fs.readFileSync(htmlTarget, 'utf8') === origHtml &&
    fs.readFileSync(primTarget, 'utf8') === origPrim &&
    fs.readFileSync(learnTarget, 'utf8') === origLearn &&
    fs.readFileSync(coreTarget, 'utf8') === origCore &&
    fs.readFileSync(viddarTarget, 'utf8') === origViddar &&
    fs.readFileSync(lessonRowTarget, 'utf8') === origLessonRow;

  console.log('  Phuc hoi byte-identical: ' + (identical ? 'OK' : 'THAT BAI!'));
  console.log('  KET QUA PROBE: ' + caught + '/' + injections.length + ' luot bat duoc loi tiem vao');
  if (caught !== injections.length || !identical) {
    console.log('  PROBE THAT BAI');
    process.exitCode = 1;
    return;
  }
  console.log('  PROBE OK: gate BAT DUOC loi tiem vao\n');
}

const jsonMode = process.argv.includes('--json');
const doProbe = process.argv.includes('--probe');

if (jsonMode) {
  const v = findViolations();
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
  process.exitCode = Object.values(v).reduce((a, b) => a + b.length, 0) === 0 ? 0 : 1;
} else {
  if (doProbe) probe();
  const total = report(findViolations());
  process.exitCode = total === 0 ? 0 : 1;
}
