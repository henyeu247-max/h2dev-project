// H2DEV Project - SINGLE SOURCE COUNT SYNC (sync-counts.js)
// Thay viec HARDCODE so lieu (136/152/165/156...) rai rac khap du an.
//   1. Nguon chan ly = data-tabs/*.json (live) -> scripts/lib/counts.js
//   2. data/counts-manifest.json = ban CHOT so lieu (commit git)
//   3. Docs (AGENTS/TREE/README) cap nhat TU DONG tu manifest.
// Cach dung:
//   node scripts/sync-counts.js             -> ghi manifest + cap nhat docs
//   node scripts/sync-counts.js --check      -> chi bao drift (exit 1 neu lech)
//   node scripts/sync-counts.js --docs-only  -> chi cap nhat docs
// Nguyen tac: KHONG dung toi so lieu LICH SU (snapshot cu). Moi rule phai neo
// ngu canh du manh de chi sua so hien hanh.
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, buildManifest } = require('./lib/counts');

const MANIFEST_PATH = path.join(ROOT, 'data', 'counts-manifest.json');

// Rule cap nhat docs: {file, pattern (RegExp), build(counts) -> string}
// Moi pattern neo ngu canh du manh; chi khop so HIEN HANH, khong khop snapshot cu.
const DOC_RULES = [
  // ---- AGENTS.md ----
  { file: 'AGENTS.md', pattern: /(\| `videos\.json` \| \*\*)\d+(\*\* \()/g,
    build: c => `$1${c.videos}$2` },
  { file: 'AGENTS.md', pattern: /(\| `kenh-mau\.json` \| \*\*)\d+(\*\* \()\d+( live \+ )\d+( dead\) · `ngay_do` )\d+(\/)\d+( \|)/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4${c.channels}$5${c.channels}$6` },
  { file: 'AGENTS.md', pattern: /(\| `tai-lieu-full\.json` \| \*\*)\d+(\*\* \()/g,
    build: c => `$1${c.documents}$2` },
  { file: 'AGENTS.md', pattern: /(\| `ngach-xanh\.json` \| \*\*)\d+(\*\* ngách — `xanh:true` \*\*)\d+(\*\*)/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}$3` },
  { file: 'AGENTS.md', pattern: /(\| `kich-ban\.json` \| \*\*)\d+(\*\* \()/g,
    build: c => `$1${c.kichBan}$2` },
  { file: 'AGENTS.md', pattern: /(\| `nguon-reup\.json` \| \*\*)\d+(\*\* \|)/g,
    build: c => `$1${c.nguonReup}$2` },
  { file: 'AGENTS.md', pattern: /(\| `raw-kenh-mau\.json` \| \*\*)\d+(\*\* record canonical)/g,
    build: c => `$1${c.canonicalRaw}$2` },
  { file: 'AGENTS.md', pattern: /\d+( hồ sơ kênh mẫu bao quát 34 ngách)/g,
    build: c => `${c.canonicalRaw}$1` },
  { file: 'AGENTS.md', pattern: /(audit live YPP )\d+( kênh, velocity tracker)/g,
    build: c => `$1${c.canonicalRaw}$2` },

  // ---- TREE.md ----
  { file: 'TREE.md', pattern: /(videos\.json            # )\d+( SKU)/g,
    build: c => `$1${c.videos}$2` },
  { file: 'TREE.md', pattern: /(kenh-mau\.json          # )\d+( kênh \()\d+( sống · )\d+( dead ẩn\) · ngay_do )\d+(\/)\d+/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4${c.channels}$5${c.channels}` },
  { file: 'TREE.md', pattern: /(tai-lieu-full\.json     # )\d+( card)/g,
    build: c => `$1${c.documents}$2` },
  { file: 'TREE.md', pattern: /(nguon-reup\.json        # )\d+/g,
    build: c => `$1${c.nguonReup}` },
  { file: 'TREE.md', pattern: /(ngach-xanh\.json        # )\d+( ngách \(xanh:true )\d+/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}` },
  { file: 'TREE.md', pattern: /(kich-ban\.json          # )\d+( — extract)/g,
    build: c => `$1${c.kichBan}$2` },
  { file: 'TREE.md', pattern: /(raw-kenh-mau\.json      # )\d+( record canonical \()\d+( kênh unique)/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3` },
  { file: 'TREE.md', pattern: /(thumbs\\                # )\d+(\/)\d+( khớp videos\.json)/g,
    build: c => `$1${c.videos}$2${c.videos}$3` },
  { file: 'TREE.md', pattern: /(video\\                     # )\d+( thư mục: )\d+( VIDEO-<sku>)/g,
    build: c => `$1${c.videos}$2${c.videoLessons}$3` },

  // ---- 00_README.md ----
  { file: '00_README.md', pattern: /(Video — )\d+( SKU)/g,
    build: c => `$1${c.videos}$2` },
  { file: '00_README.md', pattern: /(Kênh mẫu — )\d+/g,
    build: c => `$1${c.channels}` },
  { file: '00_README.md', pattern: /(Raw kênh — )\d+( record canonical \()\d+( kênh unique)/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3` },
  { file: '00_README.md', pattern: /(\*\*)\d+( bài học\*\* · ~[\d.]+ GB \([^)]+\) · ffprobe )\d+(\/)\d+( có hình\+audio)/g,
    build: c => `$1${c.videos}$2${c.videos}$3${c.videos}$4` },
  { file: '00_README.md', pattern: /(\*\*)\d+( tài liệu\*\*:)/g,
    build: c => `$1${c.documents}$2` },
  { file: '00_README.md', pattern: /(\*\*)\d+( kênh mẫu\*\* \()\d+( sống · )\d+( dead 404 đã ẩn\) · `ngay_do` )\d+(\/)\d+/g,
    build: c => `$1${c.channels}$2${c.liveChannels}$3${c.deadChannels}$4${c.channels}$5${c.channels}` },
  { file: '00_README.md', pattern: /(\*\*)\d+( ngách\*\* \+ 5 khối meta \(tab Ngách xanh\) — `xanh:true` )\d+/g,
    build: c => `$1${c.niches}$2${c.nichesGreenTrue}` },
  { file: '00_README.md', pattern: /(`assets\/thumbs\/` )\d+(\/)\d+( khớp)/g,
    build: c => `$1${c.videos}$2${c.videos}$3` },
  { file: '00_README.md', pattern: /(Raw kênh: )\d+( record canonical \()\d+( kênh unique)/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3` },

  // ---- knowledge-hub/docs/MEMORY.md (CHI dong "learning records" hien hanh,
  //      KHONG dung toi snapshot lich su 21/08 co dang "- 129 video · 161 kenh") ----
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /- \d+ learning records \(\d+ video \+ \d+ Zoom\) · \d+ tài liệu · \d+ kênh \(\d+ live · \d+ dead\) · \d+ ngách · \d+ kịch bản · \d+ nguồn reup\./g,
    build: c => `- ${c.videos} learning records (${c.videoLessons} video + ${c.zoomSessions} Zoom) · ${c.documents} tài liệu · ${c.channels} kênh (${c.liveChannels} live · ${c.deadChannels} dead) · ${c.niches} ngách · ${c.kichBan} kịch bản · ${c.nguonReup} nguồn reup.` },
  { file: 'knowledge-hub/docs/MEMORY.md',
    pattern: /(→ )\d+( record canonical \()\d+( kênh unique · )\d+( bản ghi trùng channel\))/g,
    build: c => `$1${c.canonicalRaw}$2${c.canonicalRawUniqueChannels}$3${c.canonicalRaw - c.canonicalRawUniqueChannels}$4` },

  // ---- index.html ----
  { file: 'index.html', pattern: /(Bản đồ )\d+( ngách YouTube, định dạng an toàn)/g,
    build: c => `$1${c.niches}$2` },
];

function applyDocRules(counts, { write }) {
  const results = [];
  for (const rule of DOC_RULES) {
    const full = path.join(ROOT, rule.file);
    if (!fs.existsSync(full)) continue;
    const before = fs.readFileSync(full, 'utf8');
    const after = before.replace(rule.pattern, rule.build(counts));
    if (after !== before) {
      results.push({ file: rule.file, changed: true });
      if (write) fs.writeFileSync(full, after, 'utf8');
    }
  }
  return results;
}

function diffCounts(live, manifest) {
  const a = (live && live.counts) || {};
  const b = (manifest && manifest.counts) || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of keys) if (a[k] !== b[k]) out.push({ key: k, live: a[k], manifest: b[k] });
  return out;
}

// ---- Memory sync: chi cap nhat trong block danh dau AUTO-COUNTS ----
// Nguyen tac memory: KHONG rewrite log lich su. Chi ghi so chuan vao block
// duoc danh dau ro. Neu block chua co, bo qua (khong tu chen vao file la).
const MEMORY_FILES = [
  path.resolve(ROOT, '..', '.workbuddy', 'memory', 'MEMORY.md'),
];
const AUTO_START = '<!-- AUTO-COUNTS:START -->';
const AUTO_END = '<!-- AUTO-COUNTS:END -->';

function buildAutoBlock(counts) {
  const rows = [
    `| videos.json | ${counts.videos} (${counts.videoLessons} VIDEO + ${counts.zoomSessions} ZOOM) |`,
    `| kenh-mau.json | ${counts.channels} (${counts.liveChannels} live · ${counts.deadChannels} dead) |`,
    `| tai-lieu-full.json | ${counts.documents} |`,
    `| ngach-xanh.json | ${counts.niches} (xanh:true ${counts.nichesGreenTrue}) |`,
    `| kich-ban.json | ${counts.kichBan} |`,
    `| nguon-reup.json | ${counts.nguonReup} |`,
    `| raw-kenh-mau.json | ${counts.canonicalRaw} (${counts.canonicalRawUniqueChannels} kênh unique) |`,
  ];
  return [
    AUTO_START,
    '> Số liệu CHUẨN (tự sinh bởi scripts/sync-counts.js — KHÔNG sửa tay):',
    '>',
    '| File | Số record |',
    '|---|---|',
    ...rows,
    '>',
    '> Nguồn: `data/counts-manifest.json` · đọc trực tiếp `data-tabs/*.json`.',
    AUTO_END,
  ].join('\n');
}

function applyMemorySync(counts, { write }) {
  const results = [];
  for (const full of MEMORY_FILES) {
    if (!fs.existsSync(full)) continue;
    const before = fs.readFileSync(full, 'utf8');
    const s = before.indexOf(AUTO_START);
    const e = before.indexOf(AUTO_END);
    if (s === -1 || e === -1 || e < s) continue; // chua co block -> bo qua
    const block = buildAutoBlock(counts);
    const after = before.slice(0, s) + block + before.slice(e + AUTO_END.length);
    if (after !== before) {
      results.push({ file: path.basename(full) });
      if (write) fs.writeFileSync(full, after, 'utf8');
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const docsOnly = args.includes('--docs-only');

  const live = buildManifest();
  const prev = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : null;

  const drift = prev ? diffCounts(live, prev) : [];
  const docChanges = applyDocRules(live.counts, { write: !check });
  const memChanges = applyMemorySync(live.counts, { write: !check });

  if (check) {
    let bad = false;
    if (!prev) { console.log('[counts] CHUA co manifest — chay: node scripts/sync-counts.js'); bad = true; }
    if (drift.length) {
      bad = true;
      console.log('[counts] LECH giua data live va manifest:');
      drift.forEach(d => console.log(`  - ${d.key}: live=${d.live} manifest=${d.manifest}`));
    }
    if (docChanges.length) {
      bad = true;
      console.log('[counts] DOC lech (can cap nhat):');
      docChanges.forEach(d => console.log(`  - ${d.file}`));
    }
    if (memChanges.length) {
      bad = true;
      console.log('[counts] MEMORY lech (can cap nhat):');
      memChanges.forEach(d => console.log(`  - ${d.file}`));
    }
    if (bad) { process.exitCode = 1; return; }
    console.log('[counts] OK — data live, manifest, docs, memory dong bo 100%.');
    return;
  }

  if (!docsOnly) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(live, null, 2) + '\n', 'utf8');
    console.log(`[counts] Da ghi manifest: ${path.relative(ROOT, MANIFEST_PATH)}`);
  }
  if (docChanges.length) {
    console.log(`[counts] Da cap nhat ${docChanges.length} vi tri trong docs:`);
    docChanges.forEach(d => console.log(`  - ${d.file}`));
  } else {
    console.log('[counts] Docs da dong bo (0 thay doi).');
  }
  if (memChanges.length) {
    console.log(`[counts] Da cap nhat memory: ${memChanges.map(d => d.file).join(', ')}`);
  }
  console.log('[counts] So lieu chuan:', JSON.stringify(live.counts));
}

if (require.main === module) main();

module.exports = { DOC_RULES, applyDocRules, applyMemorySync, diffCounts, MANIFEST_PATH };