/* Ghi ket qua STT (voiceDna) vao data-tabs cho web render:
 *  - raw-kenh-mau.json: records RAW-* co sample -> r.voiceDna {code, flag, wpm, measuredAt, sampleUrl}
 *  - kenh-mau.json: records GEN (kenh-mau-only) co sample -> ch-level voiceDna cung structure
 * Chi THEM field, KHONG sua field khac (NO_DELETE).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
try { if (process.stdout.reconfigure) process.stdout.reconfigure({ encoding: 'utf8' }); } catch (e) {}

const stt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'voice-stt-report.json'), 'utf8'));
const norm = s => (s || '').replace('@', '').trim().toLowerCase();
const bySlot = new Map(stt.results.map(r => [r.slot, r]));
const sttByHandle = new Map(stt.results.map(r => [norm(r.handle), r]));

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(path.join(ROOT, 'data', 'h2dev_master.db'), { readOnly: true });
const samples = db.prepare(
  "SELECT COALESCE(raw_id, channel_id) AS slot, handle, voice_sample_path FROM competitor_channels WHERE has_voice_sample = 1"
).all();
db.close();
const sampleByHandle = new Map(samples.map(s => [norm(s.handle), s]));
const sampleBySlot = new Map(samples.map(s => [s.slot, s]));

function dnaFor(slot, handle) {
  const sttRec = (slot && bySlot.get(slot)) || sttByHandle.get(norm(handle)) || null;
  const samp = (slot && sampleBySlot.get(slot)) || sampleByHandle.get(norm(handle));
  if (!sttRec || sttRec.status !== 'ok' || !samp) return null;
  // code/flag: uu cao do tin; neu qua thap (p<0.7) va dbCode co that -> giu dbCode
  let code = sttRec.locale, flag = sttRec.flag;
  if (sttRec.langProb < 0.7 && sttRec.dbCode && sttRec.dbCode !== 'ALL') {
    code = sttRec.dbCode;
    flag = (sttRec.dbFlag || '').trim() || flag;
  }
  return {
    code, flag,
    wpm: (sttRec.wordCount > 0 && sttRec.wpm != null) ? sttRec.wpm : null,
    wpmNote: ['ja', 'zh'].includes(sttRec.lang) ? 'chars/min' : null,
    measuredAt: '2026-09-29',
    sampleUrl: samp.voice_sample_path
  };
}

// ---- raw-kenh-mau.json ----
const rawPath = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
let nRaw = 0;
for (const rec of raw.records) {
  const dna = dnaFor(rec.id, rec.channel && rec.channel.handle);
  if (dna) { rec.voiceDna = dna; nRaw++; }
}
fs.writeFileSync(rawPath, JSON.stringify(raw, null, 1), 'utf8');
console.log(`raw-kenh-mau.json: voiceDna cho ${nRaw}/${raw.records.length} records`);

// ---- kenh-mau.json ----
const kmPath = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const km = JSON.parse(fs.readFileSync(kmPath, 'utf8'));
let nKm = 0;
for (const rec of km) {
  const dna = dnaFor(null, rec.handle);
  if (dna) { rec.voiceDna = dna; nKm++; }
}
fs.writeFileSync(kmPath, JSON.stringify(km, null, 1), 'utf8');
console.log(`kenh-mau.json: voiceDna cho ${nKm}/${km.length} records`);
console.log('DNA-DONE');
