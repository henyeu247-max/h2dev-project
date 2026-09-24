#!/usr/bin/env node
/**
 * H2DEV - GATE TYPOGRAPHY (P3.7)
 * Tang: CI gate · Phu thuoc: design-system/tokens.json (font.sizeScale, font.weight)
 *
 * MUC DICH: Chan vinh vien viec dung font-size / font-weight NGOAI THANG CHUAN.
 *   Truoc gate nay: 18 gia tri font-size (43 dong vi pham) song sot qua nhieu vong check-pass
 *   vi KHONG co gate nao kiem typography (chi co gate icon).
 *
 * NGUON CHUAN (SSoT, KHONG tu bia):
 *   - design-system/tokens.json -> font.sizeScale.standardized = 9 bac
 *   - design-system/tokens.json -> font.weight.allowed = 400/500/600/700
 *   - design-system/CONVENTIONS.md 7.4
 *
 * PHAM VI:
 *   - File CSS SONG: assets/*.css (TRU tailwind.css vi day la file build cua thu vien,
 *     chua san thang mac dinh; nguon that la css/input.css) + css/input.css
 *   - Loai tru: _backup/ (kho luu tru lich su), node_modules, .venv-gpu
 *
 * CO CHE DO (theo SCAR-013): STRIP COMMENT truoc khi kiem -> khong bat ghi chu giai thich.
 *
 * EXIT: 0 = PASS, 1 = FAIL
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- Nguon chuan ---------- */
let tokens;
try {
  tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'design-system', 'tokens.json'), 'utf8'));
} catch (e) {
  console.error('GATE TYPOGRAPHY: KHONG DOC DUOC design-system/tokens.json -> ' + e.message);
  process.exit(1);
}

const SIZE_SCALE = tokens.font && tokens.font.sizeScale && tokens.font.sizeScale.standardized
  ? Object.values(tokens.font.sizeScale.standardized).map(v => String(v).replace('px', ''))
  : [];
const ALLOWED_SIZES = new Set(SIZE_SCALE);
const ALLOWED_WEIGHTS = new Set(
  (tokens.font && tokens.font.weight && tokens.font.weight.allowed) || ['400', '500', '600', '700']
);
/* Gia tri hop le khong phai so (ke thua / keyword) */
const WEIGHT_KEYWORDS = new Set(['normal', 'bold', 'bolder', 'lighter', 'inherit', 'initial', 'unset', 'revert']);

if (ALLOWED_SIZES.size === 0) {
  console.error('GATE TYPOGRAPHY: tokens.json thieu font.sizeScale.standardized -> khong co chuan de doi chieu.');
  process.exit(1);
}

/* ---------- Thu thap file CSS song ---------- */
const SKIP_DIR = /^(node_modules|\.git|\.venv-gpu|_backup|_archive|icons)$/;
const files = [];
(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.test(e.name)) continue;
      walk(full);
    } else if (e.name.endsWith('.css') && e.name !== 'tailwind.css' && !e.name.startsWith('_tmp')) {
      files.push(full);
    }
  }
})(path.join(ROOT, 'assets'));

const inputCss = path.join(ROOT, 'css', 'input.css');
if (fs.existsSync(inputCss)) files.push(inputCss);

/* ---------- Helper ---------- */
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

let fails = 0;
const fail = msg => { fails++; console.log('  FAIL | ' + msg); };
const head = t => console.log('\n=== ' + t + ' ===');
const ok = t => console.log('  PASS | ' + t);

/* ---------- [1] font-size ---------- */
head('[1] font-size chi dung 9 bac chuan: ' + SIZE_SCALE.join(' / '));
let sizeDecl = 0;
for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const lines = stripComments(fs.readFileSync(abs, 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    /* font-size: Npx */
    for (const m of ln.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) {
      sizeDecl++;
      if (!ALLOWED_SIZES.has(m[1])) {
        fail(rel + ':' + (i + 1) + ' font-size:' + m[1] + 'px KHONG thuoc 9 bac chuan  | ' + ln.trim().slice(0, 80));
      }
    }
    /* shorthand font: ... Npx/... */
    for (const m of ln.matchAll(/\bfont\s*:[^;{}]*?([0-9.]+)px\s*\//g)) {
      sizeDecl++;
      if (!ALLOWED_SIZES.has(m[1])) {
        fail(rel + ':' + (i + 1) + ' font shorthand ' + m[1] + 'px KHONG thuoc 9 bac chuan  | ' + ln.trim().slice(0, 80));
      }
    }
  });
}
if (!fails) ok(sizeDecl + ' khai bao font-size trong ' + files.length + ' file — 100% thuoc thang chuan');

/* ---------- [2] font-weight ---------- */
const beforeWeight = fails;
head('[2] font-weight chi dung: ' + [...ALLOWED_WEIGHTS].join(' / '));
let weightDecl = 0;
for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const lines = stripComments(fs.readFileSync(abs, 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/font-weight\s*:\s*([a-zA-Z0-9]+)/g)) {
      weightDecl++;
      const v = m[1];
      if (WEIGHT_KEYWORDS.has(v)) continue;
      if (v.startsWith('var(') || v === 'var') continue;   /* qua token var(--...) */
      if (!ALLOWED_WEIGHTS.has(v)) {
        fail(rel + ':' + (i + 1) + ' font-weight:' + v + ' KHONG hop le  | ' + ln.trim().slice(0, 80));
      }
    }
  });
}
if (fails === beforeWeight) ok(weightDecl + ' khai bao font-weight — 100% hop le');

/* ---------- [3] Tailwind arbitrary text-[Npx] — QUET CA JS + HTML + server.js ----------
 * LOI THAT 2026-09-24 (P3.7): gate ban dau CHI quet HTML -> BO LOT 48 vi pham `text-[Npx]`
 *   nam trong file .js (content.js 39, player-main.js 3, search.js 1) + inline
 *   `font-size:Npx` trong server.js. Class Tailwind sinh dong trong JS nen phai quet JS.
 * Pham vi: 3 file HTML shell + toan bo .js trong assets + server.js
 */
const beforeArb = fails;
head('[3] text-[Npx] + font-size inline trong JS/HTML/server.js phai thuoc thang chuan');
const codeTargets = ['index.html', 'player.html', 'learn.html', 'server.js']
  .map(f => path.join(ROOT, f)).filter(fs.existsSync);
(function walkJs(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(node_modules|\.git|\.venv-gpu|_backup|_archive|icons|_tmp-proof)$/.test(e.name)) continue;
      walkJs(full);
    } else if (e.name.endsWith('.js') && !e.name.startsWith('_tmp')) {
      codeTargets.push(full);
    }
  }
})(path.join(ROOT, 'assets'));

let codeDecl = 0;
for (const abs of codeTargets) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  /* visual-proof.html la trang nghiem thu tam -> van kiem cho sach */
  const lines = stripComments(fs.readFileSync(abs, 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    /* text-[Npx] — Tailwind arbitrary */
    for (const m of ln.matchAll(/text-\[([0-9.]+)px\]/g)) {
      codeDecl++;
      if (!ALLOWED_SIZES.has(m[1])) {
        fail(rel + ':' + (i + 1) + ' class text-[' + m[1] + 'px] KHONG thuoc thang chuan  | ' + ln.trim().slice(0, 80));
      }
    }
    /* font-size:Npx inline (JS template string / HTML style attr / server.js) */
    for (const m of ln.matchAll(/font-size\s*:\s*([0-9.]+)px/gi)) {
      codeDecl++;
      if (!ALLOWED_SIZES.has(m[1])) {
        fail(rel + ':' + (i + 1) + ' font-size:' + m[1] + 'px KHONG thuoc thang chuan  | ' + ln.trim().slice(0, 80));
      }
    }
    /* Tailwind font-extrabold / font-black (weight ngoai 400/500/600/700) */
    for (const m of ln.matchAll(/\bfont-(extrabold|black)\b/g)) {
      codeDecl++;
      fail(rel + ':' + (i + 1) + ' class font-' + m[1] + ' KHONG hop le (chi 400/500/600/700)  | ' + ln.trim().slice(0, 80));
    }
    /* font-[650] / font-[800] / font-[900] arbitrary */
    for (const m of ln.matchAll(/\bfont-\[(650|800|900)\]/g)) {
      codeDecl++;
      fail(rel + ':' + (i + 1) + ' class font-[' + m[1] + '] KHONG hop le  | ' + ln.trim().slice(0, 80));
    }
  });
}
if (fails === beforeArb) ok(codeDecl + ' khai bao trong ' + codeTargets.length + ' file JS/HTML/server');

/* ---------- [4] font-size qua don vi KHAC px (rem/em) va clamp() ----------
 * LOI THAT 2026-09-24 (P3.7): `.badge { font-size: 0.6rem }` = 9.6px — LOT khoi luat [1]
 *   vi luat [1] chi tim `Npx`. 0.6rem vua NGOAI thang 9 bac, vua GHI DE class text-2xs.
 *   Tuong tu: `clamp(19px, 2.1vw, 26px)` co max 26px — luat [1] khong thay so max.
 * Rule nay bat: font-size dang rem/em (quy doi 1rem=16px) + moi so px trong clamp().
 */
const beforeUnit = fails;
head('[4] font-size rem/em + clamp() phai thuoc thang chuan (CA CSS + HTML/JS)');
let unitDecl = 0;
/* P3.7 bo sung: quet CA html/js. LOI THAT da gap: player.html:192 inline style
 *   `font-size:0.95rem` = 15.2px; index.html co 0.92rem / 0.7rem / 1.15rem —
 *   tat ca NGOAI thang va luat [4] ban dau chi quet file CSS nen BO LOT. */
const unitTargets = files.slice();
['index.html', 'player.html', 'learn.html'].forEach(f => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) unitTargets.push(p);
});
(function walkJs2(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(node_modules|\.git|\.venv-gpu|_backup|_archive|icons|_tmp-proof)$/.test(e.name)) continue;
      walkJs2(full);
    } else if (e.name.endsWith('.js') && !e.name.startsWith('_tmp')) unitTargets.push(full);
  }
})(path.join(ROOT, 'assets'));
const vpHtml = path.join(ROOT, 'design-system', 'visual-proof.html');
if (fs.existsSync(vpHtml)) unitTargets.push(vpHtml);

for (const abs of unitTargets) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const lines = stripComments(fs.readFileSync(abs, 'utf8')).split(/\r?\n/);
  lines.forEach((ln, i) => {
    /* font-size: Nrem   (1rem = 16px) */
    for (const m of ln.matchAll(/font-size\s*:\s*([0-9.]+)rem/gi)) {
      unitDecl++;
      const px = Math.round(parseFloat(m[1]) * 16 * 100) / 100;
      if (!ALLOWED_SIZES.has(String(Math.round(px)))) {
        fail(rel + ':' + (i + 1) + ' font-size:' + m[1] + 'rem = ' + px + 'px KHONG thuoc thang chuan  | ' + ln.trim().slice(0, 80));
      }
    }
    /* clamp(...) chua px — kiem MOI gia tri px trong clamp */
    for (const m of ln.matchAll(/clamp\(([^)]+)\)/g)) {
      for (const pm of m[1].matchAll(/([0-9.]+)px/g)) {
        unitDecl++;
        if (!ALLOWED_SIZES.has(pm[1])) {
          fail(rel + ':' + (i + 1) + ' clamp co ' + pm[1] + 'px KHONG thuoc thang chuan  | ' + ln.trim().slice(0, 80));
        }
      }
    }
  });
}
if (fails === beforeUnit) ok(unitDecl + ' khai bao rem/clamp trong ' + unitTargets.length + ' file — 100% thuoc thang chuan');

/* ---------- Ket luan ---------- */
console.log('\n' + '='.repeat(64));
if (fails) {
  console.log('GATE TYPOGRAPHY: FAIL (' + fails + ' vi pham)');
  console.log('='.repeat(64));
  process.exit(1);
}
console.log('GATE TYPOGRAPHY: ALL PASS');
console.log('  File CSS quet : ' + files.length);
console.log('  Thang size    : ' + SIZE_SCALE.join(' / ') + ' (' + ALLOWED_SIZES.size + ' bac)');
console.log('  Thang weight  : ' + [...ALLOWED_WEIGHTS].join(' / '));
console.log('='.repeat(64));
process.exit(0);
