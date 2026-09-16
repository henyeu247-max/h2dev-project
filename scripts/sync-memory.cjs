#!/usr/bin/env node
/**
 * sync-memory.cjs — Dong bo 2 KHO BO NHO cua du an YTB (H2DEV).
 *
 *   Kho A (ZCode)     : C:\Users\<user>\.zcode\cli\memories\projects\<proj>\memory\
 *   Kho B (WorkBuddy) : D:\YTB\.workbuddy\memory\
 *
 * NGUYEN TAC TOI THUONG: NO_DELETE.
 *   - Chi COPY file con thieu sang kho kia (hop / union).
 *   - File trung ten KHAC noi dung -> giu CA HAI (ban sao them hau to .from-zcode / .from-workbuddy).
 *   - KHONG BAO GIO xoa / rename / di chuyen file goc.
 *
 * Cach dung:
 *   node scripts/sync-memory.cjs          # dong bo that
 *   node scripts/sync-memory.cjs --dry    # chi xem truoc, khong ghi
 *
 * Tuy chon ghi de duong dan:
 *   SYNC_ZCODE_DIR=... SYNC_WORKBUDDY_DIR=... node scripts/sync-memory.cjs
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const DRY = process.argv.includes('--dry');

// ---- Xac dinh 2 kho ------------------------------------------------------
function findZcodeMemoryDir() {
  if (process.env.SYNC_ZCODE_DIR) return process.env.SYNC_ZCODE_DIR;
  const base = path.join(os.homedir(), '.zcode', 'cli', 'memories', 'projects');
  if (!fs.existsSync(base)) return null;
  // Tim project nao co thu muc memory/ chua file .md (uu tien 'ytb')
  const dirs = fs.readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const pref = dirs.filter((n) => /ytb/i.test(n));
  const ordered = [...pref, ...dirs];
  for (const name of ordered) {
    const memDir = path.join(base, name, 'memory');
    if (fs.existsSync(memDir)) return memDir;
  }
  return null;
}

const WORKBUDDY = process.env.SYNC_WORKBUDDY_DIR || path.join('D:', 'YTB', '.workbuddy', 'memory');
const ZCODE = findZcodeMemoryDir();

if (!ZCODE || !fs.existsSync(ZCODE)) {
  console.error('[ERR] Khong tim thay kho ZCode memory. Dat bien SYNC_ZCODE_DIR.');
  process.exit(1);
}
if (!fs.existsSync(WORKBUDDY)) {
  console.error('[ERR] Khong tim thay kho WorkBuddy memory tai:', WORKBUDDY);
  process.exit(1);
}

// ---- Helpers -------------------------------------------------------------
// File tool-native: moi tool quan ly rieng, KHONG dong bo noi dung, KHONG tao ban conflict.
const TOOL_NATIVE = new Set(['memory.md']);

const isMd = (f) => f.toLowerCase().endsWith('.md');
const listMd = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && isMd(d.name))
    .map((d) => d.name)
    .sort();

const sha = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function copyFile(src, dst) {
  if (DRY) {
    console.log('  [DRY] COPY', path.basename(src), '->', dst);
    return;
  }
  fs.copyFileSync(src, dst);
  console.log('  [COPY]', path.basename(src), '->', dst);
}

// ---- Chay dong bo --------------------------------------------------------
// Loai bo file sao phai sinh (.from-zcode / .from-workbuddy) khoi tap hop dong bo
// -> tranh ban sao phai sinh lan nguoc, dam bao chay lai la idempotent.
const isDerived = (f) => /\.from-(zcode|workbuddy)\.md$/i.test(f);

const aFiles = listMd(ZCODE).filter((f) => !isDerived(f));      // ZCode
const bFiles = listMd(WORKBUDDY).filter((f) => !isDerived(f));  // WorkBuddy
const union = [...new Set([...aFiles, ...bFiles])].sort();

console.log('='.repeat(72));
console.log('DONG BO BO NHO 2 KHO' + (DRY ? '  [DRY-RUN]' : ''));
console.log('  Kho ZCode    :', ZCODE);
console.log('  Kho WorkBuddy:', WORKBUDDY);
console.log('  ZCode files   :', aFiles.length, '| WorkBuddy files:', bFiles.length, '| Union:', union.length);
console.log('='.repeat(72));

let nCopied = 0;
let nSkipped = 0;
let nConflict = 0;

for (const name of union) {
  const inA = aFiles.includes(name);
  const inB = bFiles.includes(name);
  const pa = path.join(ZCODE, name);
  const pb = path.join(WORKBUDDY, name);

  if (inA && !inB) {
    // Chi co o ZCode -> copy sang WorkBuddy
    copyFile(pa, pb);
    nCopied++;
    continue;
  }
  if (inB && !inA) {
    // Chi co o WorkBuddy -> copy sang ZCode
    copyFile(pb, pa);
    nCopied++;
    continue;
  }

  // Co o ca 2 -> so sanh hash
  const ha = sha(pa);
  const hb = sha(pb);
  if (ha === hb) {
    nSkipped++;
    continue;
  }

  // File tool-native (MEMORY.md): giu nguyen ca 2 ban, khong tao ban conflict.
  if (TOOL_NATIVE.has(name.toLowerCase())) {
    console.log('  [TOOL-NATIVE]', name, '-> giu nguyen ca 2 kho (khong dong bo noi dung)');
    nSkipped++;
    continue;
  }

  // CONFLICT: trung ten khac noi dung -> giu CA HAI (khong ghi de)
  nConflict++;
  const base = name.replace(/\.md$/i, '');
  const altInB = path.join(WORKBUDDY, `${base}.from-zcode.md`);       // ban ZCode -> luu vao WorkBuddy
  const altInA = path.join(ZCODE, `${base}.from-workbuddy.md`);       // ban WorkBuddy -> luu vao ZCode
  console.log('  [CONFLICT]', name, '(khac noi dung -> giu ca hai)');

  // Chong du thua: neu noi dung 1 ben da la tap con cua ben kia -> khong tao ban sao vo nghia.
  const norm = (s) => s.replace(/\r\n/g, '\n').trim();
  const ca = norm(fs.readFileSync(pa, 'utf8'));
  const cb = norm(fs.readFileSync(pb, 'utf8'));

  if (ca.length && cb.includes(ca)) {
    console.log('    (ZCode la tap con cua WorkBuddy -> bo qua ban .from-zcode)');
    nSkipped++;
  } else if (!fs.existsSync(altInB)) copyFile(pa, altInB);
  else { console.log('    (da co', path.basename(altInB) + ', bo qua)'); nSkipped++; }

  if (cb.length && ca.includes(cb)) {
    console.log('    (WorkBuddy la tap con cua ZCode -> bo qua ban .from-workbuddy)');
    nSkipped++;
  } else if (!fs.existsSync(altInA)) copyFile(pb, altInA);
  else { console.log('    (da co', path.basename(altInA) + ', bo qua)'); nSkipped++; }
}

console.log('-'.repeat(72));
console.log('KET QUA:', DRY ? '[DRY-RUN] se' : 'da',
  `copy ${nCopied} file | conflict ${nConflict} | bo qua ${nSkipped} (giong het)`);
console.log('NO_DELETE: khong xoa/ghi de bat ky file goc nao.');
console.log('='.repeat(72));
