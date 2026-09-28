#!/usr/bin/env node
/* update_voice_dna_db.js — cap nhat has_voice_sample/voice_sample_path qua DAL chuan
 * Input: data/voice-dna-pilot.json (ket qua scripts/voice_dna_extract.py)
 * Chay: node scripts/update_voice_dna_db.js  [--file data/voice-dna-pilot.json]
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const { mutateDatabase, query, queryOne } = require('./master_dal');

const fileIdx = process.argv.indexOf('--file');
const fromVerify = process.argv.indexOf('--from-verify');
let entries = [];
if (fromVerify > -1) {
  // Nguon: voice-dna-verify json (python ffprobe) — mp3 path suy tu rawId
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, process.argv[fromVerify + 1]), 'utf8'));
  entries = (v.report || []).filter(r => r.status === 'ok')
    .map(r => ({ rawId: r.rawId, mp3: 'assets/voice-samples/' + r.rawId + '.mp3' }));
} else {
  const pilot = JSON.parse(fs.readFileSync(path.join(ROOT, inFile), 'utf8'));
  entries = (pilot.results || []).filter(r => r.status === 'ok' && r.mp3)
    .map(r => ({ rawId: r.rawId, mp3: r.mp3 }));
}

let ok = 0, skip = 0;
for (const r of entries) {
  const mp3Abs = path.join(ROOT, r.mp3);
  if (!fs.existsSync(mp3Abs)) { console.log('MISSING file:', r.mp3); skip++; continue; }
  const row = queryOne('SELECT channel_id, has_voice_sample FROM competitor_channels WHERE raw_id = ?', [r.rawId]);
  if (!row) { console.log('NO CHANNEL for', r.rawId); skip++; continue; }
  if (row.has_voice_sample) { skip++; continue; }
  mutateDatabase(
    'UPDATE competitor_channels SET has_voice_sample = 1, voice_sample_path = ? WHERE channel_id = ?',
    [r.mp3, row.channel_id]);
  ok++;
}
const total = queryOne('SELECT COUNT(*) AS n FROM competitor_channels WHERE has_voice_sample=1').n;
console.log(`updated=${ok} skipped=${skip} | voice samples now: ${total}/296`);
