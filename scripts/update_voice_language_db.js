/* Update Bo 11 muc 4: audio_language_code + language_flag + wpm tu voice-stt-report.json.
 * Policy:
 *  - dbCode 'ALL' + langProb >= 0.7  -> cap nhat locale + flag + wpm
 *  - mismatch BASE-language + p>=0.9 -> cap nhat (audio = ground truth; textSample da soi tay)
 *  - dialect-only (en-GB<->en-US, es-MX<->es-ES) -> GIU DB (whisper khong phan biet duoc dialect)
 *  - 0 words / p<0.7 (music) -> GIU nguyen
 * RULE 2026-10-07 (Groq Whisper: langProb = 1 - no_speech_prob, gan nhu luon ~1.0 nen khong loc duoc nhac):
 *  - Moi cap nhat can wordCount >= MIN_WORDS (20) va r.reliable !== false (no_speech <= 0.3, do voice_stt_language.py ghi).
 *  - Doi ngon ngu khi DB da co code khac (baseChanged) can bang chung manh hon: wordCount >= 2*MIN_WORDS.
 *  - --dry-run: chi in ket qua, KHONG ghi DB. --report <file>: doc report khac (mac dinh data/voice-stt-report.json).
 * Qua DAL mutateDatabase (tu export projections).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
try { if (process.stdout.reconfigure) process.stdout.reconfigure({ encoding: 'utf8' }); } catch (e) {}

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const ri = argv.indexOf('--report');
const REPORT = ri >= 0 && argv[ri + 1] ? path.resolve(argv[ri + 1]) : path.join(ROOT, 'data', 'voice-stt-report.json');
const MIN_WORDS = 20;
const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const results = report.results.filter(r => r.status === 'ok');

// dialect pairs: khong doi code, chi ghi nho
const DIALECT_SAME_BASE = (a, b) => a && b && a.split('-')[0] === b.split('-')[0];

const dal = DRY ? null : require(path.join(ROOT, 'scripts', 'master_dal.js'));

let updated = 0, kept = 0, keptReasons = { music: 0, dialect: 0, lowProb: 0 };
const log = [];
for (const r of results) {
  const isAll = r.dbCode === 'ALL';
  const baseChanged = r.dbCode && !DIALECT_SAME_BASE(r.dbCode, r.locale) && r.dbCode.split('-')[0] !== r.locale;
  const dialectOnly = r.dbCode && DIALECT_SAME_BASE(r.dbCode, r.locale) && r.dbCode !== r.locale;
  const noSpeech = (r.wordCount || 0) < MIN_WORDS || r.langProb < 0.7 || r.reliable === false;

  let doLang = false, doWpm = false;
  if (isAll && !noSpeech) doLang = true;
  else if (!isAll && baseChanged && !noSpeech && r.langProb >= 0.9 && r.wordCount >= 2 * MIN_WORDS) doLang = true;
  if (!noSpeech) doWpm = true;

  if (!doLang && !doWpm) {
    if (noSpeech) keptReasons.music++;
    else if (dialectOnly) keptReasons.dialect++;
    else if (r.langProb < 0.7) keptReasons.lowProb++;
    else kept++;
    continue;
  }

  const sets = [], args = [];
  if (doLang) { sets.push('audio_language_code = ?', 'language_flag = ?'); args.push(r.locale, r.flag); }
  if (doWpm) { sets.push('wpm = ?'); args.push(r.wpm); }
  args.push(r.slot_channel_id || null);
  if (DRY) { updated++; log.push(`DRY ${r.slot} ${r.handle}: ${r.dbCode} -> ${doLang ? r.locale : '(code giu)'} wpm=${doWpm ? r.wpm : r.dbWpm} words=${r.wordCount}`); continue; }
  // slot -> channel_id: query truoc
  const row = dal.queryOne ? dal.queryOne('SELECT channel_id FROM competitor_channels WHERE COALESCE(raw_id, channel_id) = ?', [r.slot])
    : null;
  if (!row) { log.push('NO-CHANNEL ' + r.slot); continue; }
  args[args.length - 1] = row.channel_id;
  dal.mutateDatabase(`UPDATE competitor_channels SET ${sets.join(', ')} WHERE channel_id = ?`, args);
  updated++;
  log.push(`UPD ${r.slot} ${r.handle}: ${r.dbCode}(${r.dbWpm || '-'}) -> ${doLang ? r.locale + ' ' + r.flag : '(code giu)'} wpm=${doWpm ? r.wpm : r.dbWpm}`);
}
console.log(`${DRY ? '[DRY-RUN] ' : ''}updated=${updated} kept=${kept} | kept music=${keptReasons.music} dialect=${keptReasons.dialect} lowProb=${keptReasons.lowProb}`);
log.slice(0, 30).forEach(l => console.log(' ', l));
if (log.length > 30) console.log(`  ... +${log.length - 30} nua`);
