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
  'assets/music_player_modal.js'
].filter(f => fs.existsSync(path.join(ROOT, f)));

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

/* ---------- Ket luan ---------- */
console.log('\n================ GATE ICONS: ' + (fail ? fail + ' FAIL' : 'ALL PASS') + ' ================');
process.exit(fail ? 1 : 0);
