// H2DEV Project - TOKEN DOC SYNC (sync-tokens.js)
// Tu sinh TAI LIEU TOKEN tu CSS THAT — kieu sync-counts. Chay tay la SAI.
//
// VI SAO CO FILE NAY (bai hoc SCAR-024 — tai pham 3 lan):
//   design-system/tokens.json la TAI LIEU VIET TAY, ghi `tokenSource: assets/viddar.css`
//   nhung gia tri do NGUOI GO. Do duoc (2026-09-27):
//     - CSS that co 98 token khai bao; tokens.json chi ghi 28 => THIEU 70 token.
//     - 4 token ghi SAI gia tri (vi du --topbar-bg ghi #050505, CSS that rgba(5,5,5,0.92)).
//   => "danh sach trong tai lieu KHONG phai tap day du". Tai lieu phai SINH TU MA NGUON.
//
// Cach dung:
//   node scripts/sync-tokens.js            -> ghi manifest + sinh lai tai lieu
//   node scripts/sync-tokens.js --check     -> chi bao drift (exit 1 neu lech), KHONG ghi
//
// Nguon chan ly: MOI file .css SONG. Manifest: design-system/token-manifest.json.
// Tai lieu sinh ra: docs/design-system/TOKEN-REFERENCE.md (kem nguon + so luot dung).
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, buildManifest } = require('./lib/token-manifest');

const MANIFEST_PATH = path.join(ROOT, 'design-system', 'token-manifest.json');
const DOC_PATH = path.join(ROOT, 'docs', 'design-system', 'TOKEN-REFERENCE.md');

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch { return null; }
}

/* Nhom token theo tien to de tai lieu de doc (tat dinh: sort theo ten nhom). */
function groupOf(token) {
  const t = token.replace(/^--/, '');
  const parts = t.split('-');
  if (parts[0] === 'h2') return 'h2-' + (parts[1] || 'khac');
  return parts[0];
}

/* Sinh tai lieu Markdown TU manifest (tat dinh -> so sanh byte duoc). */
function renderDoc(m) {
  const groups = new Map();
  for (const [token, info] of Object.entries(m.tokens)) {
    const g = groupOf(token);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push([token, info]);
  }
  const out = [];
  out.push('# TOKEN REFERENCE (TU SINH — KHONG SUA TAY)');
  out.push('');
  out.push('> **File nay do `scripts/sync-tokens.js` sinh ra tu CSS THAT.** Sua tay se bi ghi de.');
  out.push('> Muon doi: sua CSS roi chay `node scripts/sync-tokens.js`.');
  out.push('> Cong kiem drift: `node scripts/sync-tokens.js --check` (exit 1 neu lech).');
  out.push('');
  out.push('## Nguon du lieu');
  out.push('');
  out.push('- Nguon chan ly: **' + m.generatedFrom + '**');
  out.push('- So file CSS quet: **' + m.cssSources + '**');
  out.push('- So file nguon dem luot dung: **' + m.usageSources + '** (`.css`/`.js`/`.mjs`/`.html`)');
  out.push('- Tong so token khai bao: **' + m.totalTokens + '**');
  out.push('');
  out.push('## Bai hoc SCAR-024');
  out.push('');
  out.push('Danh sach token viet tay trong `design-system/tokens.json` (28 token) **KHONG phai**');
  out.push('tap day du (CSS that co ' + m.totalTokens + '). Tai lieu nay SINH TU MA NGUON nen khong the troi.');
  out.push('');
  out.push('## Bang token');
  out.push('');
  for (const g of [...groups.keys()].sort()) {
    const rows = groups.get(g).sort((a, b) => a[0].localeCompare(b[0]));
    out.push('### `' + g + '` (' + rows.length + ' token)');
    out.push('');
    out.push('| Token | Gia tri | Nguon (file:line) | Luot dung |');
    out.push('|---|---|---|---|');
    for (const [token, info] of rows) {
      const val = info.value.replace(/\|/g, '\\|');
      out.push('| `' + token + '` | `' + val + '` | `' + info.file + ':' + info.line + '` | ' + info.uses + ' |');
    }
    out.push('');
  }
  out.push('## Token CHET (0 luot dung)');
  out.push('');
  const dead = Object.entries(m.tokens).filter(([, i]) => i.uses === 0).map(([t]) => t).sort();
  if (!dead.length) {
    out.push('Khong co. (Cong kiem: `node scripts/gate-p2.js` luat [7].)');
  } else {
    for (const t of dead) out.push('- `' + t + '`');
  }
  out.push('');
  return out.join('\n');
}

function stableJson(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

function main() {
  const check = process.argv.includes('--check');
  const m = buildManifest();
  const nextManifest = stableJson(m);
  const nextDoc = renderDoc(m);

  const prevManifest = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, 'utf8') : null;
  const prevDoc = fs.existsSync(DOC_PATH) ? fs.readFileSync(DOC_PATH, 'utf8') : null;

  const manifestDrift = prevManifest !== nextManifest;
  const docDrift = prevDoc !== nextDoc;

  if (check) {
    let bad = false;
    if (prevManifest === null) { console.log('[tokens] CHUA co manifest — chay: node scripts/sync-tokens.js'); bad = true; }
    if (prevDoc === null) { console.log('[tokens] CHUA co tai lieu — chay: node scripts/sync-tokens.js'); bad = true; }
    if (manifestDrift) { console.log('[tokens] DRIFT: design-system/token-manifest.json KHONG khop CSS that.'); bad = true; }
    if (docDrift) { console.log('[tokens] DRIFT: docs/design-system/TOKEN-REFERENCE.md KHONG khop manifest.'); bad = true; }
    if (bad) {
      console.log('[tokens] -> chay: node scripts/sync-tokens.js   (roi commit lai)');
      process.exitCode = 1;
      return;
    }
    console.log('[tokens] OK — manifest + tai lieu khop CSS that 100%. (' + m.totalTokens + ' token / ' + m.cssSources + ' file CSS)');
    return;
  }

  fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, nextManifest);
  fs.writeFileSync(DOC_PATH, nextDoc);
  console.log('[tokens] Da ghi manifest: design-system/token-manifest.json');
  console.log('[tokens] Da sinh tai lieu: docs/design-system/TOKEN-REFERENCE.md');
  console.log('[tokens] Tong token: ' + m.totalTokens + ' (quet ' + m.cssSources + ' file CSS, ' + m.usageSources + ' file nguon dem luot dung)');
  if (manifestDrift) console.log('[tokens] (manifest co THAY DOI so voi ban cu)');
  if (docDrift) console.log('[tokens] (tai lieu co THAY DOI so voi ban cu)');
}

main();
