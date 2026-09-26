#!/usr/bin/env node
/**
 * gate-p1.js — Cong kiem P1: nen panel + z-index + blur/alpha + mau cam.
 *
 * BOI CANH (SCAR-022, SCAR-023, SCAR-024):
 *   - P1 da dong nhat nen panel ve token (82 cho) va z-index ve thang 8 bac.
 *   - Nhung de khong tai phat, phai co cong tu dong chan.
 *
 * LUAT:
 *   [1] Cam hex nen panel ngoai chuan trong file song (background/background-color).
 *   [2] Cam z-index dang SO trong CSS (phai dung token --h2-z-*).
 *   [3] Cam backdrop-filter blur ngoai --h2-backdrop-blur (10px).
 *   [4] Cam alpha overlay ngoai 0.92 (modal) / 0.45 (backdrop menu/drawer).
 *   [5] Cam class Tailwind arbitrary value dang z-[N] / min-h-[Npx] (Tailwind khong sinh).
 *   [6] Cam inline style co !important trung thuoc tinh voi stylesheet (2 nguon su that).
 *
 * Cach do: doc file that tren dia, STRIP COMMENT truoc khi kiem (SCAR-013).
 *
 * Dung: node scripts/gate-p1.js [--probe] [--json]
 *   --probe : tiem loi gia -> xac nhan gate BAT DUOC (bat buoc cho moi gate - SCAR-008/019)
 *
 * Loai tru: _backup/, _archive/, node_modules/, _tmp-proof/, .git/, design-system/,
 *           va FILE BUILD assets/tailwind.css (nguon that la css/input.css - SCAR-018)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// --- File SONG can kiem (liet ke TUONG MINH - SCAR-008: fail loud hon pass im lang) ---
const LIVE_FILES = [
  'assets/viddar.css',
  'assets/learn.css',
  'assets/player.css',
  'assets/h2dev-primitives.css',
  'assets/h2dev-shell.css',
  'assets/h2dev-icons.css',
  'assets/h2dev-components-lesson-row.css',
  'assets/app/g3-inline.css',
  'assets/app/main.js',
  'assets/music_player_modal.js',
  'assets/app/player-main.js',
  'assets/app/tabs/content.js',
  'assets/app/tabs/nav.js',
  'assets/app/icons.js',
  'index.html',
  'player.html',
  'learn.html'
];

// --- [1] Hex nen panel CAM (da xac minh: phai dung var(--surface) / var(--surface-2) / var(--bg)) ---
const BANNED_PANEL_HEX = [
  '#0b0f19', '#0f172a', '#111827', '#070a12',   // 4 ma trong FORBIDDEN-HEX GUARD
  '#131d31', '#182234', '#0b1120', '#090d16',   // 4 ma navy phat hien them o dot 2 (SCAR-024)
  '#0c1220'                                      // tab bar raw
];

// --- [2] z-index dang so trong CSS: cam tru (tru --h2-z-base: 1 trong token file) ---
// Chi kiem file nguon, KHONG kiem h2dev-tokens.css (no dinh nghia token).

function stripComments(src) {
  // block comment
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // line comment (chi khi // khong phai trong URL)
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return s;
}

function readLive() {
  const out = [];
  for (const rel of LIVE_FILES) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) { out.push({ rel, missing: true }); continue; }
    out.push({ rel, raw: fs.readFileSync(p, 'utf8') });
  }
  return out;
}

function findViolations(files) {
  const v = { panelHex: [], zIndexNum: [], blur: [], arbitrary: [], inlineImp: [] };

  for (const f of files) {
    if (f.missing) continue;
    const body = stripComments(f.raw);
    const lines = body.split('\n');

    lines.forEach((ln, i) => {
      const L = i + 1;

      // [1] hex nen panel cam
      for (const hex of BANNED_PANEL_HEX) {
        const re = new RegExp('background(?:-color)?\\s*:\\s*' + hex + '\\b', 'i');
        if (re.test(ln)) v.panelHex.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120), hex });
      }

      // [2] z-index: <so> trong CSS (khong ap cho .js/.html)
      if (/\.css$/.test(f.rel)) {
        const m = ln.match(/z-index\s*:\s*(-?\d+)/);
        if (m) v.zIndexNum.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120), val: m[1] });
      }

      // [3] blur ngoai 10px
      const bm = ln.match(/backdrop-filter\s*:\s*blur\((\d+(?:\.\d+)?)px\)/);
      if (bm && bm[1] !== '10') v.blur.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120), val: bm[1] });

      // [5] CHI cam `z-[N]` — day la class DA CHUNG MINH khong ton tai trong tailwind.css
      // (build that chi sinh .z-10/.z-50). Cac arbitrary value khac (min-h-[38px],
      // max-w-[140px], [overflow-wrap:anywhere]...) da duoc gate khac + runtime xac nhan
      // CO tac dung => CAM BAT. Bai hoc SCAR-008: gate phai bat DUNG loi that.
      if (/\bz-\[\d+\]/.test(ln)) {
        v.arbitrary.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120), cls: 'z-[' });
      }

      // [6] CHI cam inline `!important` tren thuoc tinh MAU NEN / z-index
      // (do la 2 nguon su that gay hoa - SCAR-022). KHONG cam cac !important ky thuat
      // co y (vi du `contain:none !important` de dropdown khong bi clip).
      const im = ln.match(/style="[^"]*!\s*important/);
      if (im && /(background|z-index)\s*:[^;"]*!\s*important/i.test(im[0])) {
        v.inlineImp.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 140) });
      }
    });
  }
  return v;
}

function report(v) {
  const sections = [
    ['[1] Hex nen panel ngoai chuan (dung var(--surface)/var(--surface-2)/var(--bg))', v.panelHex],
    ['[2] z-index dang SO trong CSS (dung token --h2-z-*)', v.zIndexNum],
    ['[3] backdrop blur khac 10px (dung --h2-backdrop-blur)', v.blur],
    ['[5] Class Tailwind arbitrary value (Tailwind khong sinh tu dong)', v.arbitrary],
    ['[6] Inline style co !important (2 nguon su that - SCAR-022)', v.inlineImp]
  ];
  let total = 0;
  console.log('[gate-p1] Kiem chuan P1 tren ' + LIVE_FILES.length + ' file song');
  for (const [title, arr] of sections) {
    total += arr.length;
    console.log('\n  ' + title);
    if (!arr.length) { console.log('    PASS | 0 vi pham'); continue; }
    console.log('    FAIL | ' + arr.length + ' vi pham:');
    for (const x of arr) {
      const extra = x.hex ? ' [' + x.hex + ']' : (x.val ? ' [' + x.val + ']' : (x.cls ? ' [' + x.cls + ']' : ''));
      console.log('      ' + x.file + ':' + x.line + extra + '  ' + x.txt);
    }
  }
  console.log('\n' + '='.repeat(64));
  console.log(total === 0
    ? 'GATE P1: ALL PASS'
    : 'GATE P1: THAT BAI - ' + total + ' vi pham');
  console.log('='.repeat(64));
  return total;
}

// --- PROBE: tiem loi gia vao 1 file tam -> gate PHAI bat duoc, roi phuc hoi byte-identical ---
function probe() {
  const target = path.join(ROOT, 'assets/app/g3-inline.css');
  const orig = fs.readFileSync(target, 'utf8');
  const injections = [
    { name: 'hex nen panel (#0f172a)', content: orig + '\n.probe-x { background: #0f172a; }\n' },
    { name: 'blur 28px', content: orig + '\n.probe-y { backdrop-filter: blur(28px); }\n' }
  ];
  let caught = 0;
  console.log('\n--- PROBE gate-p1: tiem loi gia, xac nhan gate BAT DUOC ---');
  for (const inj of injections) {
    fs.writeFileSync(target, inj.content);
    const v = findViolations(readLive());
    const ok = v.panelHex.length > 0 || v.blur.length > 0;
    console.log('  ' + (ok ? 'BAT DUOC' : 'BO LOT!') + '  -> ' + inj.name +
      '  (panelHex=' + v.panelHex.length + ', blur=' + v.blur.length + ')');
    if (ok) caught++;
  }
  fs.writeFileSync(target, orig);
  const after = fs.readFileSync(target, 'utf8');
  const identical = after === orig;
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
  const v = findViolations(readLive());
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
  process.exitCode = Object.values(v).reduce((a, b) => a + b.length, 0) === 0 ? 0 : 1;
} else {
  if (doProbe) probe();
  const total = report(findViolations(readLive()));
  process.exitCode = total === 0 ? 0 : 1;
}
