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
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// --- File SONG: tự khám phá từ 3 HTML và lần theo tham chiếu JS/CSS (H2DEV-SCAR-026). ---
const ENTRY_HTML = ['index.html', 'player.html', 'learn.html'];
const LIVE_EXCLUDES = new Set([
  'assets/tailwind.css',      // file build; nguồn thật là css/input.css
  'assets/h2dev-tokens.css'  // file định nghĩa token, hợp lệ khi chứa z-index số nền
]);

function localRef(fromRel, rawRef) {
  const clean = String(rawRef).split(/[?#]/)[0].replace(/\\/g, '/');
  if (!clean || /^(?:[a-z]+:|\/\/|data:|#)/i.test(clean)) return null;
  const rel = clean.startsWith('/') ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), clean));
  if (!/\.(?:js|css)$/i.test(rel) || rel.startsWith('../') || LIVE_EXCLUDES.has(rel)) return null;
  return rel;
}

function discoverLiveFiles() {
  const queue = [...ENTRY_HTML];
  const seen = new Set();
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, 'utf8');
    // Chỉ lần theo asset được HTML nạp thật; không quét chuỗi trong JS/comment để tránh false positive.
    const refs = rel.endsWith('.html')
      ? [...raw.matchAll(/<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1])
      : [];
    for (const ref of refs) {
      const child = localRef(rel, ref);
      if (child && !seen.has(child)) queue.push(child);
    }
  }
  return [...seen].sort();
}

// --- [1] Hex nen panel CAM (da xac minh: phai dung var(--surface) / var(--surface-2) / var(--bg)) ---
const BANNED_PANEL_HEX = [
  '#0b0f19', '#0f172a', '#111827', '#070a12',   // 4 ma trong FORBIDDEN-HEX GUARD
  '#131d31', '#182234', '#0b1120', '#090d16',   // 4 ma navy phat hien them o dot 2 (SCAR-024)
  '#0c1220'                                      // tab bar raw
];

// --- [2] z-index dang so trong CSS: cam tru (tru --h2-z-base: 1 trong token file) ---
// Chi kiem file nguon, KHONG kiem h2dev-tokens.css (no dinh nghia token).

// --- [7] line-height / letter-spacing phai thuoc thang token ---
// EXEMPT co chu dich (nguoi dung chot 2026-09-26: "chi sua gia tri lech XA"):
//   Ti le 1.3 / 1.4 tren CHU NHO (11-14px) duoc GIU NGUYEN vi la ti le hop ly cho
//   label/badge/mono metadata, khong phai sai so. Chi sua cac ti le lech xa
//   (1.1 / 1.15 / 1.25 / 1.28 / 1.45 / 1.55 / 1.625 / 1.75 / 2).
const LH_OK = new Set(['1', '1.2', '1.35', '1.5', '1.6']);
const LH_EXEMPT_SMALL = new Set(['1.3', '1.4']);   // chi cho phep tren chu nho
// class duoc phep dung 1.3/1.4 (da do runtime + xac nhan la chu nho)
const LH_SMALL_ALLOW = /\.(channel-chip|nx-card-channel-label|resume-label|sec-stats|row-updated|ltag|stat-sub|niche-name|badge|market-label|nc-name|shortcut-key|studio-input|filter-select|search-input-premium|input-dark)\b/;

const LS_OK = new Set(['0', 'normal', '-0.02em', '0.02em', '0.04em']);
// Chuan hoa truoc khi so: bo so 0 dung truoc dau cham (".04em" == "0.04em" - SCAR-025:
// neu khong chuan hoa se bao GIA 13 vi pham trong khi thuc te da dung chuan).
function normLs(t) {
  let s = String(t).trim().replace(/\s*!important\s*/, '');
  if (/^var\(--h2-ls-/.test(s)) return 'OK';            // da dung token
  s = s.replace(/^([-+]?)\./, '$10.');                   // ".04em" -> "0.04em"
  return s;
}

function stripComments(src) {
  // block comment
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // line comment (chi khi // khong phai trong URL)
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return s;
}

function readLive(overrides) {
  const out = [];
  for (const rel of discoverLiveFiles()) {
    const p = path.join(ROOT, rel);
    if (overrides && overrides.has(rel)) { out.push({ rel, raw: overrides.get(rel) }); continue; }
    if (!fs.existsSync(p)) { out.push({ rel, missing: true }); continue; }
    out.push({ rel, raw: fs.readFileSync(p, 'utf8') });
  }
  return out;
}

function findViolations(files) {
  const v = { missingLive: [], panelHex: [], zIndexNum: [], blur: [], rawBlur: [], arbitrary: [], inlineImp: [], lineHeight: [], letterSpacing: [], purpleCta: [], adHocBtn: [] };

  for (const f of files) {
    if (f.missing) { v.missingLive.push({ file: f.rel, line: 0, txt: 'File duoc web tham chieu nhung khong ton tai' }); continue; }
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

      // [3] blur ngoai chuan. Chuan: 10px (--h2-backdrop-blur) cho modal/header,
      // 4px (--h2-badge-blur) cho badge nho tren anh (SCAR-021: dung ngu canh).
      // SCAR-008/027: BAT BUOC cho phep KHOANG TRANG TUY Y (`blur(12px)` va `blur( 12px )`)
      // va ca dang `blur(var(--token))` — truoc day regex doi co dung 1 khoang trang
      // nen `backdrop-filter:blur(4px)` (inline, khong space) LOT LUOI.
      const bm = ln.match(/backdrop-filter\s*:\s*blur\(\s*(\d+(?:\.\d+)?)px\s*\)/);
      if (bm && bm[1] !== '10' && bm[1] !== '4') v.blur.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120), val: bm[1] });

      // [3b] CAM blur VIET THO khi da co TOKEN tuong ung (SCAR-022: 2 nguon su that).
      // PHAT HIEN THAT (Vong 1 check-pass P2): luat [3] chi ep GIA TRI so (10/4) nen
      // CHAP NHAN CA `blur(10px)` THO lan `blur(var(--h2-backdrop-blur))` -> token
      // --h2-backdrop-blur duoc chot nhung co 0 nguoi dung (20 cho viet tho).
      // Do la "2 nguon su that": doi gia tri token KHONG co tac dung gi -> vo nghia.
      // NAY: blur 10px PHAI dung var(--h2-backdrop-blur); blur 4px PHAI dung var(--h2-badge-blur).
      const rawBlur = ln.match(/backdrop-filter\s*:\s*blur\(\s*(10|4)px/);
      if (rawBlur) {
        v.rawBlur.push({
          file: f.rel, line: L, val: rawBlur[1] + 'px',
          txt: ln.trim().slice(0, 120)
        });
      }

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

      // [7] line-height phai thuoc thang (ca `line-height:` lan shorthand `font: .../X`)
      if (/\.css$/.test(f.rel)) {
        let mm;
        const reLh = /line-height\s*:\s*([0-9.]+)(?:px)?/g;
        while ((mm = reLh.exec(ln)) !== null) {
          const val = mm[1];
          if (LH_OK.has(val)) continue;
          if (val === '20' && /line-height\s*:\s*20px/.test(ln)) continue;   // --h2-lh-body-px
          // Gap G11 (2026-10-14): tieu de hang bai hoc co chu dich 22px: 2 dong x 22px = min-height 44px (vung cham). Chi mien cho dung rule .row-title mo dau dong, phai kem min-height 44px; 22px o selector khac van FAIL.
          if (val === '22' && /^\s*\.row-title\s*\{/.test(ln) && /line-height\s*:\s*22px/.test(ln) && /min-height\s*:\s*44px/.test(ln)) continue;
          if (LH_EXEMPT_SMALL.has(val) && LH_SMALL_ALLOW.test(ln)) continue;  // chu nho, co chu dich
          v.lineHeight.push({ file: f.rel, line: L, val, txt: ln.trim().slice(0, 120) });
        }
        const reFont = /font\s*:[^;{}]*?\/([0-9.]+)\s/g;
        while ((mm = reFont.exec(ln)) !== null) {
          const val = mm[1];
          if (LH_OK.has(val)) continue;
          if (LH_EXEMPT_SMALL.has(val) && LH_SMALL_ALLOW.test(ln)) continue;
          v.lineHeight.push({ file: f.rel, line: L, val: '/' + val, txt: ln.trim().slice(0, 120) });
        }
        // letter-spacing
        const reLs = /letter-spacing\s*:\s*([^;}"']+)/g;
        while ((mm = reLs.exec(ln)) !== null) {
          const raw = mm[1].trim().replace(/\s*!important\s*/, '');
          const val = normLs(raw);
          if (val === 'OK' || LS_OK.has(val)) continue;
          v.letterSpacing.push({ file: f.rel, line: L, val: raw, txt: ln.trim().slice(0, 120) });
        }
      }

      // [8a] P1-E: KHONG dung thu vien mau tim (purple) lam CTA — da thong nhat ve .h2-btn--brand
      if (/bg-purple-(400|500|600|700)\b/.test(ln)) {
        v.purpleCta.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 120) });
      }
      // [8b] P1-E: nut phai dung HE CHUAN (.h2-btn*/.btn-*), khong tu che to hop padding+mau.
      // Bat nut <button> co >=3 class mau rieng MA khong co h2-btn/btn- (dau hieu tu che).
      if (/\bbutton\b/.test(ln) || /<a\s/.test(ln)) {
        const cm = ln.match(/class="([^"]*)"/);
        if (cm) {
          const cls = cm[1];
          const isStd = /\b(h2-btn|btn-[a-z])/.test(cls);
          const rawColor = /\bbg-(gradient-to-|rose|blue|indigo|purple|violet|fuchsia|pink|sky|emerald|amber|lime|teal|cyan|orange|slate|zinc|neutral|stone)-\d{2,3}/.test(cls);
          const hasBoxModel = /\b(py-\d|px-\d|rounded-)/.test(cls);
          if (!isStd && rawColor && hasBoxModel) {
            v.adHocBtn.push({ file: f.rel, line: L, txt: ln.trim().slice(0, 130) });
          }
        }
      }
    });
  }
  return v;
}

function report(v) {
  const sections = [
    ['[0] File web dang tham chieu bi thieu', v.missingLive],
    ['[1] Hex nen panel ngoai chuan (dung var(--surface)/var(--surface-2)/var(--bg))', v.panelHex],
    ['[2] z-index dang SO trong CSS (dung token --h2-z-*)', v.zIndexNum],
    ['[3] backdrop blur khac 10px (dung --h2-backdrop-blur)', v.blur],
    ['[3b] backdrop blur viet THO 10px/4px (phai dung var(--h2-backdrop-blur)/var(--h2-badge-blur)) — SCAR-022', v.rawBlur],
    ['[5] Class Tailwind arbitrary value (Tailwind khong sinh tu dong)', v.arbitrary],
    ['[6] Inline style co !important tren background/z-index (2 nguon su that - SCAR-022)', v.inlineImp],
    ['[7a] line-height ngoai thang 1 / 1.2 / 1.35 / 1.5 / 1.6 (1.3-1.4 tren chu nho duoc mien)', v.lineHeight],
    ['[7b] letter-spacing ngoai thang 0 / -0.02em / 0.02em / 0.04em', v.letterSpacing],
    ['[8a] CTA dung mau TIM (bg-purple-*) — da thong nhat ve .h2-btn--brand', v.purpleCta],
    ['[8b] Nut tu che to hop padding + mau raw (dung .h2-btn*/.btn-*)', v.adHocBtn]
  ];
  let total = 0;
  console.log('[gate-p1] Kiem chuan P1 tren ' + discoverLiveFiles().length + ' file song tu dong phat hien');
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

function sha1File(rel) {
  return crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
}

// --- PROBE: tiêm trên bản sao trong bộ nhớ; source thật không bị ghi trong bất kỳ thời điểm nào. ---
function probe() {
  const targetRel = 'assets/app/g3-inline.css';
  const htmlRel = 'index.html';
  const orig = fs.readFileSync(path.join(ROOT, targetRel), 'utf8');
  const origHtml = fs.readFileSync(path.join(ROOT, htmlRel), 'utf8');
  const beforeSha = { [targetRel]: sha1File(targetRel), [htmlRel]: sha1File(htmlRel) };
  const injections = [
    { name: 'hex nen panel (#0f172a)', css: orig + '\n.probe-x { background: #0f172a; }\n' },
    { name: 'blur 28px', css: orig + '\n.probe-y { backdrop-filter: blur(28px); }\n' },
    // P2-I5 (2026-09-27): luat [3b] — blur 10px/4px viet THO thay vi dung token.
    // Day la lo hong THAT vua phat hien: luat [3] cu chap nhan `blur(10px)` tho nen
    // --h2-backdrop-blur co 0 nguoi dung (20 cho viet tho). Phai probe ca dang co space.
    { name: 'blur 10px viet THO (phai dung token — SCAR-022)', css: orig + '\n.probe-r { backdrop-filter: blur(10px); }\n' },
    // SCAR-027: probe DUNG dang da tung LOT LUOI — inline, KHONG co khoang trang
    { name: 'blur 12px inline khong space (lo hong da tung lot)', css: orig, html: origHtml.replace('</body>', '<span style="backdrop-filter:blur(12px)">probe</span>\n</body>') },
    { name: 'line-height 1.75 (lech xa)', css: orig + '\n.probe-z { line-height: 1.75; }\n' },
    // G11 (2026-10-14): mien 22px chi cho .row-title + min-height 44px; hai dang sau PHAI van FAIL
    { name: 'line-height 22px o selector KHAC (khong duoc mien)', css: orig + '\n.probe-t { line-height: 22px; min-height: 44px; }\n' },
    { name: 'line-height 23px tren .row-title (sai gia tri mien)', css: orig + '\n.row-title { line-height: 23px; min-height: 44px; }\n' },
    { name: 'letter-spacing 0.08em', css: orig + '\n.probe-w { letter-spacing: 0.08em; }\n' },
    { name: 'z-index so', css: orig + '\n.probe-v { z-index: 9999; }\n' },
    // P1-E (SCAR-019: moi luat phai duoc probe)
    { name: 'CTA mau tim', css: orig + '\n.probe-u { }\n', html: origHtml.replace('</body>', '<button class="px-4 py-2 rounded-xl bg-purple-600 text-white">probe</button>\n</body>') },
    { name: 'nut tu che (raw color + padding)', css: orig, html: origHtml.replace('</body>', '<button class="px-4 py-2 rounded-xl bg-rose-900/40 text-white">probe</button>\n</body>') }
  ];
  let caught = 0;
  console.log('\n--- PROBE gate-p1: tiem loi tren ban sao bo nho, source that bat bien ---');
  for (const inj of injections) {
    const overrides = new Map([[targetRel, inj.css], [htmlRel, inj.html || origHtml]]);
    const v = findViolations(readLive(overrides));
    const ok = v.panelHex.length > 0 || v.blur.length > 0 || v.rawBlur.length > 0 || v.lineHeight.length > 0 ||
               v.letterSpacing.length > 0 || v.zIndexNum.length > 0 ||
               v.purpleCta.length > 0 || v.adHocBtn.length > 0;
    console.log('  ' + (ok ? 'BAT DUOC' : 'BO LOT!') + '  -> ' + inj.name +
      '  (hex=' + v.panelHex.length + ', blur=' + v.blur.length + ', rawBlur=' + v.rawBlur.length +
      ', lh=' + v.lineHeight.length +
      ', ls=' + v.letterSpacing.length + ', z=' + v.zIndexNum.length +
      ', purple=' + v.purpleCta.length + ', adhoc=' + v.adHocBtn.length + ')');
    if (ok) caught++;
  }
  const afterSha = { [targetRel]: sha1File(targetRel), [htmlRel]: sha1File(htmlRel) };
  const identical = beforeSha[targetRel] === afterSha[targetRel] && beforeSha[htmlRel] === afterSha[htmlRel];
  console.log('  SHA1 truoc/sau: ' + JSON.stringify(beforeSha) + ' / ' + JSON.stringify(afterSha));
  console.log('  Source byte-identical: ' + (identical ? 'OK' : 'THAT BAI!'));
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
