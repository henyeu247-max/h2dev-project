/* Ap ket qua do thuc te (classify-kenh-mau.py) vao data-tabs/kenh-mau.json.
 *
 * Nguyen tac:
 *  - Doc file HIEN TAI luc ghi (giu nguyen thay doi cua viec khac), chi sua cac field da do.
 *  - Chi ap voi state LIVE / DEAD / EMPTY. UNRESOLVED / NOT_MEASURED: khong dong vao.
 *  - Khong xoa du lieu: deadNote/deadKind cu cua kenh chuyen sang LIVE duoc chuyen vao
 *    deadNoteCu / deadKindCu (di chuyen, khong mat).
 *  - Dinh dang file: JSON indent 2, LF, khong newline cuoi (kiem tra round-trip truoc khi ghi).
 *  - Ghi nhat ky thay doi (before/after tung field) vao _audit/<ngay>-kenh-mau-applied.json.
 *
 * Chay: node scripts/apply-kenh-mau-probe.js [--dry] [--in PATH]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const KM = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const tag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const dateIso = new Date().toISOString().slice(0, 10);
const inPath = args.includes('--in') ? args[args.indexOf('--in') + 1]
  : path.join(ROOT, '_audit', `${tag}-kenh-mau-classify.json`);
const evidence = `_audit/${tag}-kenh-mau-probe.jsonl`;

const raw = fs.readFileSync(KM, 'utf8');
const sha0 = crypto.createHash('sha256').update(raw).digest('hex');
const list = JSON.parse(raw);
if (JSON.stringify(list, null, 2) !== raw) {
  console.error('[LOI] round-trip file hien tai KHONG giong han (dinh dang la) — dung, khong ghi.');
  process.exit(2);
}
const cls = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const byHandle = new Map(list.map(c => [c.handle, c]));

const TOUCH = ['dead', 'deadKind', 'deadNote', 'deadNoteCu', 'deadKindCu', 'status', 'ngay_do', 'nguon_do', 'ngay_do_check'];
const pick = c => Object.fromEntries(TOUCH.filter(k => k in c).map(k => [k, c[k]]));
const log = [];
let changed = 0;

for (const it of cls.items) {
  if (!['LIVE', 'DEAD', 'EMPTY'].includes(it.state)) continue;
  const c = byHandle.get(it.handle);
  if (!c) { console.error('[LOI] khong thay handle', it.handle); process.exit(2); }
  const before = pick(c);
  const sig = (it.signals || []).map(s => ({ http: 'HTTP trang kênh', httpById: 'HTTP /channel/ID', dossier: 'channel_dossier', rss: 'RSS', ytdlp: 'yt-dlp' }[s])).join(' + ');
  c.ngay_do = dateIso;
  c.nguon_do = `Đo thực tế ${dateIso}: ${sig} → ${it.state} (bằng chứng ${evidence})`;
  c.ngay_do_check = `Đối soát đa nguồn ${dateIso}: ${it.state}${it.stored.replace('?', '') !== it.state ? ` (trước đó: ${it.stored})` : ''}`;
  if (it.state === 'LIVE') {
    if ('deadNote' in c) { c.deadNoteCu = c.deadNote; delete c.deadNote; }
    if ('deadKind' in c) { c.deadKindCu = c.deadKind; delete c.deadKind; }
    c.dead = false;
    if ('status' in c) c.status = 'LIVE';
  } else if (it.state === 'DEAD') {
    c.dead = true;
    c.deadKind = 'gone';
    if (!c.deadNote || it.stored !== 'DEAD') c.deadNote = `404 - đo thực tế ${dateIso}: trang kênh, channel_dossier và yt-dlp đều 404 (đã xóa hoặc đổi handle). Giữ làm dẫn chứng bài học.`;
    if ('status' in c) c.status = 'DEAD_TERMINATED';
  } else if (it.state === 'EMPTY') {
    c.dead = true;
    c.deadKind = 'empty';
    if (!c.deadNote || it.stored !== 'EMPTY') c.deadNote = `Kênh rỗng - đo thực tế ${dateIso}: kênh tồn tại nhưng 0 video công khai (RSS 0, yt-dlp không có video).`;
  }
  const after = pick(c);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    changed += 1;
    log.push({ handle: it.handle, state: it.state, stored: it.stored, before, after });
  }
}

const out = JSON.stringify(list, null, 2);
console.log(`[apply] ${cls.items.length} muc; ap ${cls.items.filter(i => ['LIVE', 'DEAD', 'EMPTY'].includes(i.state)).length}; record doi: ${changed}; dry=${dry}`);
if (dry) process.exit(0);
// Chong dua: file khong duoc doi giua luc doc va luc ghi
if (crypto.createHash('sha256').update(fs.readFileSync(KM, 'utf8')).digest('hex') !== sha0) {
  console.error('[LOI] kenh-mau.json doi trong luc xu ly — chay lai.'); process.exit(3);
}
fs.writeFileSync(KM, out, 'utf8');
fs.writeFileSync(path.join(ROOT, '_audit', `${tag}-kenh-mau-applied.json`), JSON.stringify(log, null, 1), 'utf8');
console.log('[apply] da ghi', path.relative(ROOT, KM), '+ nhat ky _audit/' + `${tag}-kenh-mau-applied.json`);
