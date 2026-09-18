#!/usr/bin/env node
/**
 * sync-memory-all.cjs — Sync memory ve DUNG VI TRI + FORMAT tung IDE/CLI.
 * NGUON CHUAN: D:\YTB\.workbuddy\memory\MEMORY.md
 * Nguyen tac: NO_DELETE. --dry de xem truoc.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DRY = process.argv.includes('--dry');
const SRC = 'D:/YTB/.workbuddy/memory';
const HOME = 'C:/Users/SaxukeB';

function loadCounts() {
  const p = 'D:/YTB/H2DEV-Project/data/counts-manifest.json';
  try { return JSON.parse(fs.readFileSync(p, 'utf8')).counts; } catch { return null; }
}
const C = loadCounts();

function blockMd(title) {
  return `# H2DEV Project — ${title}

> Nguồn chuẩn: \`D:\\YTB\\.workbuddy\\memory\\MEMORY.md\` (cập nhật 18/09/2026).

## Số liệu CHUẨN (runtime, chốt 18/09/2026)
- videos.json: ${C.videos} (${C.videoLessons} VIDEO + ${C.zoomSessions} ZOOM)
- kenh-mau.json: ${C.channels} (${C.liveChannels} live · ${C.deadChannels} dead)
- raw-kenh-mau.json: ${C.canonicalRaw} (${C.canonicalRawUniqueChannels} kênh unique)
- tai-lieu-full.json: ${C.documents} · kich-ban.json: ${C.kichBan} · nguon-reup.json: ${C.nguonReup}
- ngach-xanh.json: ${C.niches} ngách (xanh:true ${C.nichesGreenTrue})

## Hạ tầng
- H2DEV_Service :8899 (web) · MCP_Pool_Service :3988 (180+ tools) · 9Router :20128
- Core workspace: \`D:\\YTB\\H2DEV-Project\`. SSoT: \`AGENTS.md\`.

## Boot order 7 bước
AGENTS.md → RULE-LAM-VIEC.md → SOUL.md → HUONG-DAN-MCP-CHUAN.md → CHANGELOG.md → zoom/README.md → data-tabs/*.json

## Nguyên tắc
- Xưng "anh - em". Check N/N 100%, không suy đoán.
- Hệ giá trị: Runtime > Source Code > Test > Docs > Giả định.
- NO_DELETE: không tự ý xóa data. Grounded 100%.

## Persistent memory (MCP)
Dùng \`memory__search_nodes\` khi bắt đầu, \`memory__create_entities\`/\`add_observations\` khi xong.
`;
}


const TARGETS = [
  { tool: 'Cline',     file: `${HOME}/.cline/rules/h2dev-memory.md`,   content: () => blockMd('Memory & Rules (Cline)') },
  { tool: 'Kiro',      file: `${HOME}/.kiro/steering/h2dev-memory.md`, content: () => '---\ninclusion: always\n---\n\n' + blockMd('Global Steering (Kiro)') },
  { tool: 'Gemini',    file: `${HOME}/.gemini/GEMINI.md`,              content: () => blockMd('Global Context (Gemini CLI)') },
  { tool: 'CodeBuddy', file: `${HOME}/.codebuddy/CODEBUDDY.md`,        content: () => blockMd('User Memory (CodeBuddy)') },
  { tool: 'Kimi',      file: `${HOME}/.kimi-code/AGENTS.md`,           content: () => blockMd('Global Agent Instructions (Kimi Code)') },
  { tool: 'ZCode',     file: `${HOME}/.zcode/AGENTS.md`,               content: () => blockMd('Global Agent Instructions (ZCode)') },
  { tool: 'Cline-agents-global', file: `${HOME}/.agents/AGENTS.md`, content: () => blockMd('Global Agent Rules (Cline, ~/.agents/AGENTS.md)') },
  { tool: 'Cline-home-rules', file: `${HOME}/Cline/Rules/h2dev-memory.md`, content: () => blockMd('Global Rules (Cline, ~/Cline/Rules)') },
  { tool: 'Qoder',     file: `${HOME}/.qoder/memory/h2dev-project.md`, content: () => blockMd('Project Memory (Qoder)') },
];
const CLINE_AGENTS = `${HOME}/.cline/data/workspaces/chat/AGENTS.md`;
const CODEX = `${HOME}/.codex/AGENTS.md`;
const MD_DESTS = [
  { name: 'ZCode',        dir: `${HOME}/.zcode/cli/memories/projects/ytb-f37c8123c785e676/memory` },
  { name: 'WorkBuddy-AI', dir: 'D:/YTB/.workbuddy-ai/memory' },
  { name: 'Qoder (proj)', dir: `${HOME}/.qoder/projects/D--YTB/memory` },
];

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

console.log('SYNC MEMORY — dung vi tri + format tung IDE/CLI' + (DRY ? '  [DRY-RUN]' : ''));
console.log('Nguon chuan:', SRC, '| counts:', C ? `${C.videos} videos` : 'N/A');
console.log('='.repeat(72));

for (const t of TARGETS) {
  const body = t.content();
  const exists = fs.existsSync(t.file);
  const same = exists && fs.readFileSync(t.file, 'utf8') === body;
  if (same) { console.log(`  [${t.tool}] khong doi`); continue; }
  if (DRY) { console.log(`  [DRY][${t.tool}] ${exists ? 'REFRESH' : 'WRITE'}`); continue; }
  fs.mkdirSync(path.dirname(t.file), { recursive: true });
  fs.writeFileSync(t.file, body);
  console.log(`  [${t.tool}] ${exists ? 'REFRESH' : 'WRITE'}`);
}

try {
  let cur = fs.existsSync(CODEX) ? fs.readFileSync(CODEX, 'utf8') : '';
  if (!cur.includes('H2DEV Project')) {
    const add = '\n\n---\n\n' + blockMd('Global Memory (Codex)');
    if (DRY) console.log('  [DRY][Codex] APPEND');
    else { fs.writeFileSync(CODEX, cur + add); console.log('  [Codex] APPEND'); }
  } else console.log('  [Codex] da co H2DEV (bo qua)');
} catch (e) { console.log('  [Codex] ERR', e.message); }

const srcFiles = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => f.endsWith('.md') && !/\.from-/.test(f)) : [];
for (const d of MD_DESTS) {
  let copied = 0, refreshed = 0, skipped = 0;
  if (!DRY) fs.mkdirSync(d.dir, { recursive: true });
  for (const name of srcFiles) {
    const s = path.join(SRC, name), t = path.join(d.dir, name);
    const exists = fs.existsSync(t);
    if (exists && sha(s) === sha(t)) { skipped++; continue; }
    if (DRY) { exists ? refreshed++ : copied++; continue; }
    fs.copyFileSync(s, t); exists ? refreshed++ : copied++;
  }
  console.log(`  [${d.name}] copy ${copied} | refresh ${refreshed} | skip ${skipped}`);
}

console.log('='.repeat(72));
console.log('NO_DELETE: khong xoa file goc.');
