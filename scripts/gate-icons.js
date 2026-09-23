/* H2DEV — Gate icon + emoji (Phase 3, ICON-MAPPING.md muc 2e)
 *
 * Muc dich: chan hoi quy (regression) cho he icon CSS mask. Chay TRUOC moi lan push.
 *
 * Kiem tra:
 *   [1] Ten icon goi qua ico()/icoColored() deu co .svg + rule CSS  <-> khong bao gio render ra o trong
 *   [2] So file .svg == so rule .h2-icon[data-h2i=...]              <-> khong co icon "mo coi"
 *   [3] Khong file SVG 0 byte
 *   [4] Khong con emoji TRANG TRI trong code JS (bo qua comment, bo qua quoc ky)
 *
 * Cach chay:  node scripts/gate-icons.js
 * Exit code:  0 = PASS, 1 = FAIL
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = path.join(ROOT, 'assets', 'h2dev-icons.css');
const ICON_DIR = path.join(ROOT, 'assets', 'icons');

/* Cac file JS sinh DOM nguoi dung. Them file moi vao day khi tach module. */
const JS_TARGETS = [
  'assets/app/icons.js',
  'assets/app/main.js',
  'assets/app/tabs/content.js',
  'assets/app/tabs/nav.js',
  'assets/app/search.js',
  'assets/app/search-core.js',
  'assets/app/ui-core.js',
  'assets/app/taxonomy.js',
  'assets/app/player-main.js',
  'assets/app/modals/raw-deep.js',
  'assets/h2dev-core.js',
  'assets/music_player_modal.js',
  'assets/learn.js'
].filter(f => fs.existsSync(path.join(ROOT, f)));

/* DA XONG Phase 3 — bat buoc 0 emoji (gate se FAIL neu tai xuat hien).
 * Cac file CHUA lam (ui-core.js, h2dev-core.js, player-main.js...) nam ngoai danh sach nay
 * -> chi kiem tra [1][2][3], KHONG kiem tra emoji. Chuyen vao day khi lam xong file do. */
const EMOJI_CLEAN = [
  'assets/app/main.js',
  'assets/app/tabs/content.js',
  'assets/app/search.js',
  'assets/app/icons.js',
  'assets/music_player_modal.js',
  /* 2026-09-24 — dot 2: 5 emoji cuoi cung cua Phase 3 (ui-core 1, h2dev-core 1, player-main 3) */
  'assets/app/ui-core.js',
  'assets/h2dev-core.js',
  'assets/app/player-main.js'
].filter(f => fs.existsSync(path.join(ROOT, f)));

/* 4 muc size DUY NHAT duoc phep (h2dev-icons.css dong 11 ghi ro).
 * Bat loi thuc te da gap 2026-09-24: viet `h2-icon--12` (khong ton tai) => icon render 0x0. */
const ALLOWED_SIZES = new Set(['14', '16', '20', '24']);

/* Emoji TRANG TRI. Co y KHONG liet ke quoc ky (U+1F1E6-U+1F1FF) va khong liet ke
 * ky tu ve duong / mui ten (─ → ↗ ▶ ▼ ▲ ↺ ○) vi day la ky tu VAN BAN hop le trong cau. */
const DECOR_EMOJI = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{23F3}\u{23F1}\u{2B50}\u{2B1B}\u{2B1C}]/gu;

/* Bo comment truoc khi quet (emoji trong comment duoc phep — Quy tac 6).
 * Giu NGUYEN so dong: thay noi dung comment bang ky tu trang cung so dong,
 * de so dong bao loi khop voi file that (khong bi lech). */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

let fail = 0;
function bad(msg) { console.log('  FAIL | ' + msg); fail++; }
function ok(msg) { console.log('  PASS | ' + msg); }
function head(t) { console.log('\n=== ' + t + ' ==='); }

const css = fs.readFileSync(CSS_FILE, 'utf8');
const registered = new Set([...css.matchAll(/\.h2-icon\[data-h2i="([a-z0-9-]+)"\]/g)].map(m => m[1]));
const svgFiles = fs.readdirSync(ICON_DIR).filter(f => f.endsWith('.svg')).map(f => f.slice(0, -4));
const svgSet = new Set(svgFiles);

/* ---------- [1] Ten icon duoc goi deu ton tai ---------- */
head('[1] Ten icon goi qua ico() deu ton tai (svg + rule CSS)');
const used = new Map();
for (const rel of JS_TARGETS) {
  const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  for (const m of src.matchAll(/\bico(?:Colored)?\(\s*'([^']+)'/g)) {
    if (!used.has(m[1])) used.set(m[1], new Set());
    used.get(m[1]).add(rel);
  }
}
for (const n of [...used.keys()].sort()) {
  const noRule = !registered.has(n);
  const noSvg = !svgSet.has(n);
  if (noRule || noSvg) bad('icon "' + n + '"' + (noRule ? ' thieu rule CSS' : '') + (noSvg ? ' thieu file .svg' : '') + '  <- ' + [...used.get(n)].join(', '));
}
if (!fail) ok(used.size + ' ten icon duoc dung, 100% resolve (' + registered.size + ' icon dang ky)');

/* ---------- [2] Parity SVG <-> rule CSS ---------- */
head('[2] Parity SVG <-> rule CSS (1-1)');
const dupRule = [...css.matchAll(/\.h2-icon\[data-h2i="([a-z0-9-]+)"\]/g)].map(m => m[1])
  .filter((x, i, a) => a.indexOf(x) !== i);
if (dupRule.length) bad('rule CSS trung lap: ' + [...new Set(dupRule)].join(', '));
const ruleNoSvg = [...registered].filter(r => !svgSet.has(r));
const svgNoRule = svgFiles.filter(f => !registered.has(f));
if (ruleNoSvg.length) bad('rule CSS khong co file .svg: ' + ruleNoSvg.join(', '));
if (svgNoRule.length) bad('file .svg khong duoc dang ky: ' + svgNoRule.join(', '));
if (registered.size !== svgFiles.length) bad('lech so luong: rule=' + registered.size + ' svg=' + svgFiles.length);
if (!dupRule.length && !ruleNoSvg.length && !svgNoRule.length && registered.size === svgFiles.length) {
  ok('khop 1-1: ' + registered.size + ' rule = ' + svgFiles.length + ' file SVG');
}

/* ---------- [3] SVG 0 byte ---------- */
head('[3] Khong file SVG 0 byte');
const zero = svgFiles.filter(f => fs.statSync(path.join(ICON_DIR, f + '.svg')).size === 0);
if (zero.length) bad('SVG 0 byte: ' + zero.join(', ')); else ok('0 file 0 byte / ' + svgFiles.length + ' file');

/* ---------- [4] Emoji trang tri con sot trong code ---------- */
head('[4] Emoji trang tri trong cac file DA XONG Phase 3 (bo comment, bo quoc ky)');

/* NGOAI LE DUOC PHEP (Quy tac 10): emoji nam trong data-badge = KEY du lieu,
 * giu nguyen trong data-*, chi stripDecorEmoji() khi in ra chu.
 * Moi ngoai le phai co ly do + noi strip ro rang. */
const ALLOWED = [
  { file: 'assets/app/main.js', line: 2160, emoji: '🔥', reason: 'data-badge="🔥 Đang xem Transcript" — KEY, strip tai openQuickVideoModal()' },
  { file: 'assets/app/tabs/content.js', line: 1644, emoji: '🎬', reason: 'data-badge="🎬 Demo Tuyến Nội Dung" — KEY, strip tai openQuickVideoModal()' }
];

let emojiHits = 0;
for (const rel of EMOJI_CLEAN) {
  const lines = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    const m = ln.match(DECOR_EMOJI);
    if (!m) return;
    const lineNo = i + 1;
    const allowed = ALLOWED.some(a => a.file === rel && a.line === lineNo && m.includes(a.emoji));
    if (allowed) {
      console.log('  KEEP | ' + rel + ':' + lineNo + ' [' + [...new Set(m)].join('') + '] — ' + ALLOWED.find(a => a.file === rel && a.line === lineNo).reason);
      return;
    }
    emojiHits++;
    bad(rel + ':' + lineNo + ' co ' + m.length + ' emoji: ' + [...new Set(m)].join('') + '  | ' + ln.trim().slice(0, 80));
  });
}
if (!emojiHits) ok('0 emoji trang tri ngoai du kien trong ' + EMOJI_CLEAN.length + ' file da xong');

/* ---------- [5] Size class phai nam trong 4 muc chuan ---------- */
head('[5] Size class h2-icon--NN chi dung 14/16/20/24 (h2dev-icons.css dong 11)');
let sizeHits = 0;
const sizeTargets = JS_TARGETS.concat(['index.html', 'player.html', 'learn.html'])
  .filter(f => fs.existsSync(path.join(ROOT, f)));
for (const rel of sizeTargets) {
  const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split(/\r?\n/);
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/h2-icon--(\d+)/g)) {
      if (!ALLOWED_SIZES.has(m[1])) {
        sizeHits++;
        bad(rel + ':' + (i + 1) + ' size "' + m[1] + '" KHONG hop le (chi 14/16/20/24)  | ' + ln.trim().slice(0, 80));
      }
    }
  });
}
if (!sizeHits) ok('0 size class sai chuan trong ' + sizeTargets.length + ' file');

/* ---------- [5b] Selector CSS KHONG duoc dat size CUNG cho .h2-icon ngoai 14/16/20/24 ----------
 * LOI THAT 2026-09-24 (SCAR-014): rule `.bento-card .stat-icon .h2-icon { min-width: 15px }`
 *   va `.vd-bottom-nav .tab-btn .h2-icon { width: 18px }` — cay tu rule `svg` cu duoc copy
 *   sang `.h2-icon` ma khong doi gia tri. `svg` co gian duoc nen 15/18px vo hai, nhung
 *   `.h2-icon` dung mask + min-width => bi BOP CUNG, icon lech 1-2px so voi moi noi khac.
 *   Gate [5] cu CHI kiem size class (h2-icon--NN) => BO LOT lop loi nay. Rule nay bit lo hong.
 *
 * CACH KIEM: quet moi file .css, bo comment, tim rule ma selector chua '.h2-icon'
 *   va co khai bao width / height / min / max dang so px cu the (khong qua var hoac %)
 *   khac 14/16/20/24. Gia tri qua `var(--h2-icon-*)`, `em`, `%`, `auto` duoc bo qua.
 */
head('[5b] Selector CSS dat size CUNG cho .h2-icon phai thuoc 14/16/20/24');
const CSS_ALLOWED = new Set([14, 16, 20, 24]);
const cssFiles = [];
(function walkCss(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) {
      if (/node_modules|\.git|\.venv-gpu|_archive|^video$|icons$/.test(e.name)) continue;
      walkCss(full);
    } else if (e.name.endsWith('.css')) cssFiles.push(full);
  }
})(path.join(ROOT, 'assets'));
let s5bHits = 0;
for (const abs of cssFiles) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  /* Bo comment truoc khi kiem (tranh bat ghi chu giai thich) */
  const raw = fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  const lines = raw.split(/\r?\n/);
  /* Gom rule: tu dong co selector -> dong co '}' dong block */
  let sel = '';
  let blockStart = -1;
  let buf = [];
  const flush = () => {
    if (!sel || !buf.length) { sel = ''; buf = []; return; }
    if (!/\.h2-icon/.test(sel)) { sel = ''; buf = []; return; }
    for (const bl of buf) {
      for (const m of bl.matchAll(/(?:^|[\s;{])(min-width|min-height|max-width|max-height|width|height)\s*:\s*([0-9.]+)px/gi)) {
        const val = parseFloat(m[2]);
        if (!CSS_ALLOWED.has(val)) {
          s5bHits++;
          bad(rel + ':' + (bl.__ln || blockStart) + ' "' + sel.trim().slice(0, 60) + '" dat ' + m[1] + ':' + m[2] + 'px (ngoai 14/16/20/24)');
        }
      }
    }
    sel = ''; buf = [];
  };
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (sel && t === '}') { flush(); return; }
    if (!sel && /\{/.test(ln) && !/^\s*@/.test(ln) && !/\{/.test(ln.slice(0, ln.indexOf('{')))) {
      sel = ln.split('{')[0].trim();
      blockStart = i + 1;
      const rest = ln.slice(ln.indexOf('{') + 1);
      if (rest.trim() && rest.trim() !== '}') { const o = { __ln: i + 1 }; buf.push(Object.assign(rest, o)); }
      return;
    }
    if (!sel && /\{$/.test(ln) && !/^\s*@/.test(ln)) { sel = ln.replace(/\{$/, '').trim(); blockStart = i + 1; return; }
    if (sel) { const o = { __ln: i + 1 }; buf.push(Object.assign(String(ln), o)); }
  });
  flush();
}
if (!s5bHits) ok('0 selector dat size cung ngoai chuan cho .h2-icon (' + cssFiles.length + ' file CSS)');

/* ---------- [6] ICONS.<key> duoc goi phai CO trong NAMES ---------- */
/* LOI THAT 2026-09-24: content.js goi ICONS.disk + ICONS.search nhung NAMES khong khai bao
 *   => undefined => the KPI MAT ICON. Gate nay chan vinh vien.
 *
 * PHAM VI CHINH XAC (tranh bao dong gia da gap):
 *   `h2dev-core.js` va `learn.js` co bien `ICONS` RIENG (SVG inline tu dinh nghia trong chinh file)
 *   => KHONG thuoc namespace H2Icons, so vao la SAI.
 *
 * BAY DA GAP KHI PROBE (2026-09-24): ban dau loc file theo chuoi 'H2Icons.NAMES|_h2i.NAMES'
 *   => CHI khop main.js, BO SOT content.js (no nhan ICONS qua deps.ICONS tu main truyen sang).
 *   Probe xoa `disk` trong icons.js -> gate VAN BAO PASS => gate hong ma khong ai biet.
 *   CACH SUA: liet ke TUONG MINH cac file dung namespace H2Icons.NAMES (co kiem chung bang DOM that).
 *   Cach nay "fail loud": them file moi ma quen khai bao -> gate [1] van bat qua ten icon. */
head('[6] Moi ICONS.<key> duoc goi deu co khai bao trong assets/app/icons.js');
const iconsJs = fs.readFileSync(path.join(ROOT, 'assets', 'app', 'icons.js'), 'utf8');
const declared = new Set([...iconsJs.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:\s*'[a-z0-9-]+'/gm)].map(m => m[1]));
/* File nhan bien ICONS tu window.H2Icons.NAMES (truc tiep hoac qua deps.ICONS do main.js truyen). */
const NAMES_USERS = [
  'assets/app/main.js',            /* const ICONS = _h2i.NAMES */
  'assets/app/tabs/content.js'     /* const ICONS = deps.ICONS (nguon: main.js) */
].filter(f => fs.existsSync(path.join(ROOT, f)));
let keyMiss = 0;
for (const rel of NAMES_USERS) {
  const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const keys = new Set([...src.matchAll(/\bICONS\.([a-zA-Z0-9_]+)/g)].map(m => m[1]));
  if (!keys.size) continue;
  const miss = [...keys].filter(k => !declared.has(k));
  if (miss.length) {
    keyMiss += miss.length;
    bad(rel + ' goi ICONS.' + miss.join(', ICONS.') + ' nhung KHONG khai bao trong icons.js NAMES');
  }
}
if (!keyMiss) {
  const allKeys = new Set();
  for (const rel of NAMES_USERS) {
    const src = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    [...src.matchAll(/\bICONS\.([a-zA-Z0-9_]+)/g)].forEach(m => allKeys.add(m[1]));
  }
  ok('0 key thieu — ' + allKeys.size + ' key dung deu co trong NAMES (' + declared.size + ' khai bao)'
    + '  [pham vi: ' + NAMES_USERS.length + ' file dung NAMES]');
}

/* ---------- [7] Ten icon khong duoc IN RA CHU qua stat-glyph ---------- */
/* LOI THAT 2026-09-24: statCard() nhan TEN icon ('video','file-text','tv') nhung roi vao
 *   nhanh else -> <span class="stat-glyph">video</span> -> IN CHU ra the KPI.
 *
 * PHAM VI CHINH XAC (tranh bao dong gia da gap):
 *   CHI soi CHUOI HTML SINH RA (co <span class="stat-glyph">...</span> dong kin trong 1 dong),
 *   KHONG soi dong CODE dinh nghia/ghep chuoi (vd ui-core.js:136 la cau lenh tao span).
 *   Dau hieu la chuoi HTML: bat dau bang < hoac ${ va co the span dong day du. */
head('[7] Khong co the HTML nao render <span class="stat-glyph">TEN-ICON</span> (in chu ra man hinh)');
let glyphBad = 0;
for (const rel of JS_TARGETS) {
  /* BAT BUOC strip comment: chinh ghi chu giai thich loi nay cung chua chuoi
   * `<span class="stat-glyph">video</span>` => khong strip se tu bao dong gia. */
  const lines = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    /* bo qua dong CODE dinh nghia/ghep chuoi (khong phai chuoi HTML tinh) */
    if (/^\s*(const|let|var)\s+\w+\s*=/.test(ln) && !/`/.test(ln)) return;
    /* span phai DONG ngay trong dong nay (co </span>) => chuoi HTML that */
    for (const m of ln.matchAll(/stat-glyph"?>\s*([a-z][a-z0-9-]*)\s*<\/span>/g)) {
      glyphBad++;
      bad(rel + ':' + (i + 1) + ' stat-glyph chua ten icon "' + m[1] + '" => se IN CHU ra man hinh');
    }
  });
}
if (!glyphBad) ok('0 the HTML stat-glyph chua ten icon');

/* ---------- Ket luan ---------- */
console.log('\n================ GATE ICONS: ' + (fail ? fail + ' FAIL' : 'ALL PASS') + ' ================');
process.exit(fail ? 1 : 0);
