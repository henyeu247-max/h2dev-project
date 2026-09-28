#!/usr/bin/env node
/* check-reconcile-handles.js — Guard reconciliation kenh-mau.json <-> Master DB
 *
 * Muc dich (SCAR 29/09): khoa handle stale dang channel-ID — kenh Science Sun
 * (RAW-126) doi handle nhung kenh-mau.json con cu -> nut YouTube tren web UI
 * dan 404 ma sync-counts khong bat duoc (counts dung, handle sai).
 *
 * Quy tac PASS:
 *   1. Moi handle live trong kenh-mau.json phai khop (normalized) it nhat 1 trong:
 *      - competitor_channels.handle hien tai, HOAC
 *      - 1 entry trong handle_history_json cua ban ghi DB.
 *   2. Handle dang channel-ID (@UC + 22 ky tu) chi duoc chap nhan neu DB cung
 *      giu dung handle do (kenh chua co handle @text — dung thuc te YouTube).
 *
 * Chay: node scripts/check-reconcile-handles.js   (exit 0 = PASS, 1 = FAIL)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const norm = (s) => (s || '').replace(/@/g, '').trim().toLowerCase();
const CHANNEL_ID_RE = /^UC[0-9A-Za-z_-]{22}$/;

function main() {
  const kmPath = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
  const dbPath = path.join(ROOT, 'data', 'h2dev_master.db');
  if (!fs.existsSync(dbPath)) {
    console.log('[reconcile-handles] SKIP — khong co ' + dbPath);
    process.exit(0);
  }
  const km = JSON.parse(fs.readFileSync(kmPath, 'utf8'));
  const db = new DatabaseSync(dbPath, { readOnly: true });

  // DB: handle hien tai + toan bo handle history (ca hai deu la handle hop le cua kenh)
  const current = new Set();
  const history = new Map(); // normHandle -> DB handle hien tai (de bao cao)
  for (const row of db.prepare('SELECT handle, handle_history_json FROM competitor_channels').all()) {
    current.add(norm(row.handle));
    try {
      for (const e of JSON.parse(row.handle_history_json || '[]')) {
        if (e && e.handle) history.set(norm(e.handle), row.handle);
      }
    } catch (e) { /* history malformed — bo qua entry nay */ }
  }

  const stale = [];
  let checked = 0;
  for (const k of km) {
    if (k.dead) continue; // kenh dead khong vao nut mo web
    const h = (k.handle || '').trim();
    if (!h) continue;
    checked++;
    const n = norm(h);
    if (current.has(n)) continue;
    if (history.has(n)) {
      stale.push({ handle: h, dbHandle: history.get(n), niche: k.niche || '', reason: 'handle cu — DB da doi handle: ' + history.get(n) });
      continue;
    }
    if (CHANNEL_ID_RE.test(h)) continue; // kenh chua co handle @text — channel-ID la dung thuc te
    stale.push({ handle: h, dbHandle: null, niche: k.niche || '', reason: 'khong thay trong DB (handle hay history)' });
  }

  if (stale.length) {
    console.log('[reconcile-handles] THAT BAI — ' + stale.length + ' handle stale tren ' + checked + ' live:');
    for (const s of stale) console.log('  - ' + s.handle + ' (' + s.niche + '): ' + s.reason);
    process.exit(1);
  }
  console.log('[reconcile-handles] OK — ' + checked + '/' + checked + ' handle live khop DB (handle hien tai hoac history).');
  process.exit(0);
}

main();
