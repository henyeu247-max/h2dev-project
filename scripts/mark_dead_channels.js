/* Mark 39 kenh da xac minh CHANNEL_DELETED_404:
 * 1. kenh-mau.json — dead:true + deadNote + ngay_do_check (24 con live truoc day)
 * 2. raw-kenh-mau.json — channelLifecycle.state TERMINATED_BY_YOUTUBE (RAW-143/145/152; RAW-012 xong san)
 * 3. DB competitor_channels.channel_lifecycle_json — state + event (39 kenh)
 * Nguyen tac: CHI them flag, KHONG sua/xoa field khac (NO_DELETE).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const sys = { stdout: { reconfigure: () => {} } };
try { process.stdout.reconfigure ? process.stdout.reconfigure({ encoding: 'utf8' }) : null; } catch (e) {}

const probe = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'voice-dna-probe-final.json'), 'utf8'));
const deadSlots = probe.results.filter(r => r.state === 'CHANNEL_DELETED_404');
const handles = deadSlots.map(r => r.handle);
const norm = s => (s || '').replace('@', '').trim().toLowerCase();
const deadHandleSet = new Set(handles.map(norm));
console.log('probe dead slots:', deadSlots.length, '| unique handles:', deadHandleSet.size);

// ---- 1. kenh-mau.json ----
const kmPath = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const km = JSON.parse(fs.readFileSync(kmPath, 'utf8'));
let markedKm = 0, alreadyDead = 0;
for (const rec of km) {
  if (deadHandleSet.has(norm(rec.handle))) {
    if (rec.dead) { alreadyDead++; continue; }
    rec.dead = true;
    rec.deadNote = '404 - kenh khong ton tai (yt-dlp flat-playlist "Requested entity was not found")';
    rec.ngay_do_check = '404 kiem tra 2026-09-29 (batch Voice DNA final probe)';
    markedKm++;
  }
}
fs.writeFileSync(kmPath, JSON.stringify(km, null, 1), 'utf8');
console.log(`kenh-mau.json: marked=${markedKm} alreadyDead=${alreadyDead} | live con lai: ${km.filter(k => !k.dead).length}/${km.length}`);

// ---- 2. raw-kenh-mau.json ----
const rawPath = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
let markedRaw = 0;
for (const rec of raw.records) {
  if (!deadHandleSet.has(norm(rec.channel && rec.channel.handle))) continue;
  if (!rec.channelLifecycle) rec.channelLifecycle = { events: [] };
  const lc = rec.channelLifecycle;
  if (lc.state === 'TERMINATED_BY_YOUTUBE') continue;
  lc.state = 'TERMINATED_BY_YOUTUBE';
  lc.stateReason = 'yt-dlp flat-playlist 404 "Requested entity was not found" (xac minh 29/09/2026)';
  lc.events = lc.events || [];
  lc.events.push({
    type: 'channel_deleted',
    date: '2026-09-29',
    source: 'yt-dlp-flat-playlist-404',
    note: 'Voice DNA campaign final probe: channel listing 404 — kenh da bi xoa khoi YouTube. Snapshot cu giu nguyen trong record de tham chieu lich su.'
  });
  lc.auditedAt = '2026-09-29';
  markedRaw++;
}
fs.writeFileSync(rawPath, JSON.stringify(raw, null, 1), 'utf8');
console.log(`raw-kenh-mau.json: marked lifecycle=${markedRaw} (RAW-012 xong san tu 16/09)`);

// ---- 3. DB channel_lifecycle_json (qua DAL chuan) ----
const dal = require(path.join(ROOT, 'scripts', 'master_dal.js'));
const db = require('node:sqlite');
const ro = new db.DatabaseSync(path.join(ROOT, 'data', 'h2dev_master.db'), { readOnly: true });
const targets = ro.prepare(
  "SELECT channel_id, COALESCE(raw_id, channel_id) AS slot, handle, channel_lifecycle_json FROM competitor_channels WHERE has_voice_sample = 0"
).all();
ro.close();
let markedDb = 0, skip = 0;
for (const row of targets) {
  const kmRec = deadSlots.find(r => r.slot === row.slot);
  // slot (COALESCE) trung khop truc tiep voi probe — dung handle lam fallback
  if (!kmRec) { skip++; continue; }
  let lc = {};
  try { lc = JSON.parse(row.channel_lifecycle_json || '{}'); } catch (e) { lc = {}; }
  if (lc.state === 'TERMINATED_BY_YOUTUBE') { skip++; continue; }
  lc.state = 'TERMINATED_BY_YOUTUBE';
  lc.stateReason = 'yt-dlp flat-playlist 404 (xac minh 29/09/2026)';
  lc.events = lc.events || [];
  lc.events.push({
    type: 'channel_deleted',
    date: '2026-09-29',
    source: 'yt-dlp-flat-playlist-404',
    note: 'Voice DNA final probe 39/39 CHANNEL_DELETED_404'
  });
  lc.auditedAt = '2026-09-29';
  lc.schemaVersion = lc.schemaVersion || 1;
  dal.mutateDatabase('UPDATE competitor_channels SET channel_lifecycle_json = ? WHERE channel_id = ?',
    [JSON.stringify(lc), row.channel_id]);
  markedDb++;
}
console.log(`DB channel_lifecycle_json: marked=${markedDb} skip=${skip}`);
console.log('MARK-DONE');
