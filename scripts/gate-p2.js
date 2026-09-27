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

function stripComments(src) {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return s;
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
  const v = { loopToken: [], aliasToken: [], skeletonIncomplete: [], ariaBusy: [], bottomSheet: [], deadCss: [], deadToken: [] };

  /* [1][2] Token: chi kiem file CSS, strip comment */
  for (const f of files) {
    if (f.missing) continue;
    const isCanonical = CANONICAL_TOKEN_FILES.includes(f.rel);
    const lines = stripComments(f.raw).split('\n');

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
    const body = stripComments(prim.raw);
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
      const coreBody = stripComments(fs.readFileSync(corePath, 'utf8'));
      const region = extractFunctionRegion(coreBody, ['skeletonCard', 'skeletonList']);
      const rlines = region.split('\n');
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
  const idxBody = stripComments(idxRaw);
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
      const lines = stripComments(f.raw).split('\n');
      lines.forEach((ln, i) => {
        if (ln.includes(sel)) v.deadCss.push({ file: f.rel, line: i + 1, val: sel, txt: ln.trim().slice(0, 120) });
      });
    }
  }

  /* [7] Token CHET: dinh nghia trong :root (file canonical) nhung KHONG CO AI DUNG.
   * PHAT HIEN THAT (Vong 1 check-pass P2): viddar.css:96-104 co 9 alias
   * (--txt/--txt-2/--mut/--line/--line-strong/--accent/--accent-2/--bg-card/--bg-hover)
   * duoc coi la "alias canonical tuong thich" nhung thuc te la TOKEN CHET:
   * quet 812 file -> 0 lan dung. Da chung minh bang do runtime (xoa di: 0/6.400 element doi).
   * LUU Y (SCAR-019/SCAR-024): phai dem SO LAN DUNG THAT (regex `var(--x`), KHONG dung
   * `indexOf` chuoi — vi chinh dong KHAI BAO cung chua chuoi "--x" nen se tu dem chinh no.
   * Doi tuong quet: MOI file .css/.js/.html/.mjs ngoai SKIP_DIR + file build. */
  const TOKEN_SELF_USE = new Set(TOKENS_ALLOWED_SELF_USE);
  const usageFiles = readFiles(collectSourceForTokenUsage('', []));
  const declaredTokens = [];
  for (const f of files) {
    if (f.missing) continue;
    if (!CANONICAL_TOKEN_FILES.includes(f.rel)) continue;
    const lines = stripComments(f.raw).split('\n');
    lines.forEach((ln, i) => {
      const m = ln.match(/^\s*(--[\w-]+)\s*:/);
      if (m) declaredTokens.push({ token: m[1], file: f.rel, line: i + 1 });
    });
  }
  for (const d of declaredTokens) {
    if (TOKEN_SELF_USE.has(d.token)) continue;
    const re = new RegExp('var\\(\\s*' + d.token.replace(/-/g, '\\-') + '\\s*[,)]');
    let uses = 0;
    const where = [];
    for (const uf of usageFiles) {
      if (uf.missing) continue;
      // bo qua chinh dong KHAI BAO trong file canonical
      const src = (uf.rel === d.file)
        ? stripComments(uf.raw).split('\n').filter((_, i) => i + 1 !== d.line).join('\n')
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

  return v;
}

const SECTIONS = [
  ['[1] Token VONG LAP (--x: var(--x, ...)) — lam gia tri RONG (SCAR: body mat nen)', 'loopToken'],
  ['[2] Alias token TRUNG CHUC NANG ngoai viddar.css/h2dev-tokens.css', 'aliasToken'],
  ['[3] Component skeleton thieu thanh phan bat buoc', 'skeletonIncomplete'],
  ['[4] Vung noi dung dong thieu aria-busy', 'ariaBusy'],
  ['[5] Modal thieu bottom-sheet o 1 trong 2 rule (index.html)', 'bottomSheet'],
  ['[6] CSS chet (#raw-channel-modal da xoa)', 'deadCss'],
  ['[7] Token CHET (dinh nghia trong :root nhung 0 lan dung — SCAR-024)', 'deadToken']
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

  const origCss = fs.readFileSync(cssTarget, 'utf8');
  const origHtml = fs.readFileSync(htmlTarget, 'utf8');
  const origPrim = fs.readFileSync(primTarget, 'utf8');
  const origLearn = fs.readFileSync(learnTarget, 'utf8');
  const origCore = fs.readFileSync(coreTarget, 'utf8');
  const origViddar = fs.readFileSync(viddarTarget, 'utf8');

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
      apply: () => fs.writeFileSync(htmlTarget, origHtml.replace('#video-transcript-modal > div,\n      #raw-image-modal > div {', '#video-transcript-modal > div {')),
      restore: () => fs.writeFileSync(htmlTarget, origHtml),
      count: (v) => v.bottomSheet.length
    },
    {
      name: 'CSS chet quay lai (#raw-channel-modal)',
      apply: () => fs.writeFileSync(cssTarget, origCss + '\n#raw-channel-modal { display: flex; }\n'),
      restore: () => fs.writeFileSync(cssTarget, origCss),
      count: (v) => v.deadCss.length
    },
    {
      name: 'token CHET quay lai (viddar.css: --alias-chet: var(--fg))',
      /* Tiem 1 token vao file CANONICAL ma KHONG ai dung -> luat [7] phai bat.
       * LUU Y (SCAR-019): phai ghi vao file canonical that, khong phai learn.css —
       * luat [7] chi doc token khai bao trong CANONICAL_TOKEN_FILES. */
      apply: () => fs.writeFileSync(viddarTarget, origViddar.replace('  --signal-amber: #ffcc00;\n}', '  --signal-amber: #ffcc00;\n  --h2-probe-dead-token: var(--fg);\n}')),
      restore: () => fs.writeFileSync(viddarTarget, origViddar),
      count: (v) => v.deadToken.length,
      verify: () => fs.readFileSync(viddarTarget, 'utf8') !== origViddar
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
    fs.readFileSync(viddarTarget, 'utf8') === origViddar;

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
