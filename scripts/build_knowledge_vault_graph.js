#!/usr/bin/env node
/**
 * build_knowledge_vault_graph.js — Hệ thống hóa Dữ liệu & Hạ tầng Đa Dự Án Vĩnh viễn (Nexus Dual-Layer Graph)
 *
 * Kiến trúc 2 Lớp chuẩn hóa từ gốc tới đỉnh (Zero-Touch Auto-Discovery & Live Sync):
 *   - LỚP 1 (Knowledge Layer): 333 Video (148 H2DEV + 140 Huân + 45 DGMD), 35 Modules, 204 Niches, 204 Tools, 501 Channels.
 *   - LỚP 2 (Infrastructure & Multi-Project Code/Data Lineage):
 *       Workspace (D:\YTB) -> Project (17+ Dự án tự động phát hiện) -> Domain/Data Branch -> Directory -> File -> Code/Data Dependencies
 *       Tự động bóc tách liên kết thực thi: IMPORTS, READS_DATA, WRITES_DATA, INVOKES_SCRIPT, SERVES_UI.
 *   - Xuất đồng bộ 3 định dạng:
 *       1. SQLite WAL + FTS5 BM25 + Property Graph (`data/h2dev_knowledge_graph.db`)
 *       2. Obsidian Markdown Vault (`knowledge-hub/vault/*.md`) + Sơ đồ `00-ARCHITECTURE-MAP.canvas`
 *       3. Web Interactive Dual-Layer Graph JSON (`data/knowledge_graph.json`)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(ROOT, '..'); // D:\YTB
const VAULT_DIR = path.join(ROOT, 'knowledge-hub', 'vault');
const DB_PATH = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');
const JSON_GRAPH_PATH = path.join(ROOT, 'data', 'knowledge_graph.json');
const REGISTRY_PATH = path.join(ROOT, 'data', 'projects-registry.json');

function toPosix(p) {
  return String(p || '').replace(/\\/g, '/');
}

function slugify(str) {
  return String(str || '')
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'unknown';
}

function safeFileSlug(str) {
  const s = String(str || '')
    .trim()
    .replace(/^@/, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return s || 'item';
}

function yamlStr(val) {
  return JSON.stringify(String(val ?? ''));
}

function ensureDirs() {
  for (const sub of ['', '.obsidian', 'tracks', 'modules', 'videos', 'niches', 'channels', 'tools', 'policies', 'checklists', 'sops', 'projects']) {
    fs.mkdirSync(path.join(VAULT_DIR, sub), { recursive: true });
  }
}

function loadRegistry() {
  if (fs.existsSync(REGISTRY_PATH)) {
    try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); } catch (_) {}
  }
  return {
    workspaceRoot: toPosix(WORKSPACE_ROOT),
    sensitiveSegments: ['.git', 'node_modules', '_private', '_backup', '_audit', '_internal', '_drafts', '_archive', '_verify', '_frames', '_tmp_audio', '_tmp-proof', '.cache', '.venv', '.venv-gpu', '.zcode', 'logs', 'inbox', 'raw-kenh-goc'],
    indexedExtensions: ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.py', '.ps1', '.bat', '.cmd', '.vbs', '.sh', '.json', '.md', '.html', '.css', '.sql', '.yaml', '.yml', '.toml']
  };
}

function inferFileRole(relPath, ext, contentSample) {
  const base = path.basename(relPath).toLowerCase();
  if (base === 'server.js' || base.includes('server')) return 'HTTP & API Gateway Server';
  if (base === 'master_dal.js') return 'SQLite WAL Data Access Layer (DAL)';
  if (base === 'counts.js' || base === 'sync-counts.js') return 'Single Source of Count Truth (SSoT Counter)';
  if (base === 'validate-project.js') return 'Project-Wide Gate Validator';
  if (base.startsWith('verify_sku')) return '10-Gate Video & UI Verification Engine';
  if (base.startsWith('build_')) return 'Data & Graph Synchronization Builder';
  if (base.startsWith('check-grounding')) return 'Anti-Hallucination Grounding Auditor';
  if (base.startsWith('retranscribe')) return 'CUDA GPU Whisper ASR & Transcript Patcher';
  if (base === 'kg_query.js') return 'Sub-2ms Knowledge & Infra Graph CLI Query Engine';
  if (base === 'kg_auto_sync.js') return 'Real-Time File Watcher & Zero-Touch Auto-Sync Daemon';
  if (ext === '.html') return 'Web Application View / Entrypoint';
  if (ext === '.css') return 'UI Stylesheet & Design System Tokens';
  if (ext === '.json') return 'Structured Data / SSoT Projection';
  if (ext === '.md') return 'Technical Documentation / SOP Guide';
  if (ext === '.py') return 'Python Automation / AI Pipeline Script';
  if (ext === '.ps1' || ext === '.bat' || ext === '.cmd' || ext === '.vbs') return 'Windows Service & Process Orchestrator';
  if (ext === '.js' || ext === '.ts' || ext === '.mjs' || ext === '.cjs') return 'Application Module / Execution Script';
  return 'Project Resource File';
}

function buildKnowledgeAndInfraGraph(options = {}) {
  const tStart = performance.now();
  if (!options.silent) {
    console.log('=== [97YO-DEV NEXUS GRAPH BUILDER — 333 VIDEOS (3 CHILD TRACKS) + 17 PROJECTS INFRASTRUCTURE] ===');
  }
  ensureDirs();
  const registry = loadRegistry();
  const sensitiveSet = new Set((registry.sensitiveSegments || []).map(s => s.toLowerCase()));
  const allowedExts = new Set((registry.indexedExtensions || []).map(s => s.toLowerCase()));

  // 1. Load all 3 Video Tracks (Layer 1: Knowledge Layer)
  const h2devMods = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules.json'), 'utf8')).modules || [];
  const h2devCat = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_full.json'), 'utf8'));
  const h2devIns = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights.json'), 'utf8'));

  const huanMods = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_huan.json'), 'utf8')).modules || [];
  const huanCat = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_huan.json'), 'utf8'));
  const huanIns = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_huan.json'), 'utf8'));

  const dgmdMods = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_dgmd.json'), 'utf8')).modules || [];
  const dgmdCat = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_dgmd.json'), 'utf8'));
  const dgmdIns = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_dgmd.json'), 'utf8'));

  const kenhMau = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'kenh-mau.json'), 'utf8'));
  const ngachXanhData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'ngach-xanh.json'), 'utf8'));
  const chienLuocData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'chien-luoc.json'), 'utf8'));
  const taiLieuFullData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'tai-lieu-full.json'), 'utf8'));
  const rawKenhData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json'), 'utf8')).records || [];
  const kenhByHandleLower = new Map();
  for (const k of kenhMau) {
    if (k && k.handle) {
      kenhByHandleLower.set(String(k.handle).replace(/^@/, '').toLowerCase(), k);
    }
  }
  const rawById = new Map(rawKenhData.map(r => [r.id, r]));
  const rawByHandleLower = new Map();
  for (const r of rawKenhData) {
    const h = String(r?.channel?.handle || '').replace(/^@/, '').toLowerCase();
    if (h) {
      const list = rawByHandleLower.get(h) || [];
      list.push(r);
      rawByHandleLower.set(h, list);
    }
    for (const oldH of (r.handleHistory || [])) {
      const oh = String(oldH || '').replace(/^@/, '').toLowerCase();
      if (oh) {
        const list = rawByHandleLower.get(oh) || [];
        list.push(r);
        rawByHandleLower.set(oh, list);
      }
    }
  }
  function foldVi(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  // Graph structures
  const nodes = new Map(); // id -> { id, type, layer, label, track, sku, path, parentId, level, meta, body, wikilinks }
  const edges = [];        // { source, target, relation, weight }
  const edgeKeys = new Set();

  function addNode(id, type, label, track, sku, relPath, meta = {}, body = '', wikilinks = [], extra = {}) {
    const layer = extra.layer || (['workspace', 'project', 'domain', 'directory', 'file'].includes(type) ? 'infra' : 'knowledge');
    const level = extra.level ?? ({
      workspace: 0,
      project: 1,
      track: 1,
      domain: 2,
      module: 2,
      policy: 2,
      directory: 3,
      niche: 3,
      checklist: 3,
      file: 4,
      video: 4,
      sop: 4,
      tool: 5,
      channel: 5
    }[type] ?? 4);
    const parentId = extra.parentId || '';
    const projectId = extra.projectId || meta.projectId || (type === 'project' ? id : '');

    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        type,
        layer,
        level,
        parentId,
        projectId,
        label,
        track: track || 'all',
        sku: sku || '',
        path: relPath || '',
        meta,
        body,
        wikilinks
      });
    } else {
      const cur = nodes.get(id);
      cur.meta = { ...cur.meta, ...meta };
      if (body && !cur.body) cur.body = body;
      if (relPath && !cur.path) cur.path = relPath;
      if (parentId && !cur.parentId) cur.parentId = parentId;
      if (projectId && !cur.projectId) cur.projectId = projectId;
      if (wikilinks.length) cur.wikilinks = [...new Set([...cur.wikilinks, ...wikilinks])];
    }
  }

  function addEdge(source, target, relation, weight = 1.0) {
    if (!source || !target || source === target) return;
    const key = `${source}|${target}|${relation}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ source, target, relation, weight });
  }

  // Root Workspace Node (`workspace:d-ytb`)
  const wsId = 'workspace:d-ytb';
  addNode(wsId, 'workspace', 'D:\\YTB — Hệ Thống Trung Tâm 97yo-dev (Master Workspace)', 'infra', '', 'D:/YTB', {
    rootPath: 'D:/YTB',
    domain: 'https://97yo-dev-learn.tonymmo.com',
    role: 'Hệ thống trung tâm 97yo-dev điều phối 17 dự án, dịch vụ và 3 nhánh đào tạo con (H2DEV, Huân Academy, DGMD)'
  }, 'D:/YTB 97yo-dev Master Multi-Project Workspace H2DEV Huân DGMD Pipelines Research Repos', [], { layer: 'infra', level: 0 });

  // Track definitions (3 Child Branches of 97yo-dev)
  const tracks = [
    {
      id: 'track:h2dev',
      code: 'h2dev',
      name: 'Nhánh H2DEV · YouTube Faceless Master (148 Videos)',
      file: 'tracks/TRACK-H2DEV.md',
      modules: h2devMods,
      catalog: h2devCat,
      insights: h2devIns
    },
    {
      id: 'track:huan',
      code: 'huan',
      name: 'Nhánh Huân Academy · YouTube AI & Tự Động Hóa (140 Videos)',
      file: 'tracks/TRACK-HUAN.md',
      modules: huanMods,
      catalog: huanCat,
      insights: huanIns
    },
    {
      id: 'track:dgmd',
      code: 'dgmd',
      name: 'Nhánh Đại Gia Mang Dép (DGMD) · Thực Chiến Đa Kênh (45 Videos)',
      file: 'tracks/TRACK-DGMD.md',
      modules: dgmdMods,
      catalog: dgmdCat,
      insights: dgmdIns
    }
  ];

  const nicheVideos = new Map();
  const toolVideos = new Map();
  const channelVideos = new Map();

  // 2. Process all 3 Tracks -> Modules -> 333 Videos (Layer 1: Knowledge)
  for (const tr of tracks) {
    const catBySku = new Map(tr.catalog.map(v => [v.sku, v]));
    const modLinksForTrack = [];

    addNode(tr.id, 'track', tr.name, tr.code, '', `knowledge-hub/vault/${tr.file}`, {
      videoCount: tr.catalog.length,
      moduleCount: tr.modules.length,
      targetUrl: `/video?vbranch=${encodeURIComponent(tr.code)}`
    }, tr.name, [], { layer: 'knowledge', level: 1, parentId: 'project:h2dev-project' });

    for (let mIdx = 0; mIdx < tr.modules.length; mIdx++) {
      const m = tr.modules[mIdx];
      const rawModId = m.id || `${tr.code.toUpperCase()}-M${String(mIdx + 1).padStart(2, '0')}`;
      const uniqueModId = tr.code === 'h2dev' ? `H2DEV-${rawModId}` : rawModId;
      const modNodeId = `module:${uniqueModId}`;
      const modRelFile = `modules/${uniqueModId}.md`;
      modLinksForTrack.push({ id: uniqueModId, title: m.title, count: (m.items || []).length });

      addEdge(tr.id, modNodeId, 'HAS_MODULE', 2.0);

      const modVideoLinks = [];
      for (let iIdx = 0; iIdx < (m.items || []).length; iIdx++) {
        const it = m.items[iIdx];
        const sku = it.sku;
        const v = catBySku.get(sku) || it;
        const localInsPath = path.join(ROOT, 'video', sku, 'insight.json');
        const ins = fs.existsSync(localInsPath)
          ? JSON.parse(fs.readFileSync(localInsPath, 'utf8'))
          : (tr.insights[sku] || tr.insights[sku.toUpperCase()] || tr.insights[sku.toLowerCase()] || {});

        const vNodeId = `video:${sku}`;
        const vRelFile = `videos/${sku}.md`;
        const seqStr = String(iIdx + 1).padStart(2, '0');
        const title = v.title || ins.title || sku;
        const actualTopic = ins.actual_topic || v.actual_topic || title;
        const nicheName = v.contentNiche || v.niche || ins.niche_primary || m.title;
        const nicheSlug = slugify(nicheName);
        const nicheNodeId = `niche:${nicheSlug}`;
        const markets = Array.isArray(v.market) ? v.market : ['🇻🇳 Việt Nam'];
        const duration = v.duration || '00:00';
        const publishedAt = v.published_at || '2026-08-01';

        modVideoLinks.push({ seq: seqStr, sku, title, duration, nicheName });
        addEdge(modNodeId, vNodeId, 'HAS_VIDEO', 1.5);
        addEdge(vNodeId, tr.id, 'BELONGS_TO_TRACK', 1.0);

        if (!nicheVideos.has(nicheSlug)) {
          nicheVideos.set(nicheSlug, { name: nicheName, slug: nicheSlug, skus: [], channels: new Set(), tracks: new Set() });
        }
        const nEntry = nicheVideos.get(nicheSlug);
        nEntry.skus.push({ sku, title, track: tr.code, duration });
        nEntry.tracks.add(tr.code);
        addEdge(vNodeId, nicheNodeId, 'IN_NICHE', 1.2);

        const tools = Array.isArray(ins.tools_mentioned) ? ins.tools_mentioned : [];
        const toolWikiLinks = [];
        for (const tName of tools) {
          const tSlug = slugify(tName);
          if (!tSlug || tSlug === 'unknown') continue;
          const tNodeId = `tool:${tSlug}`;
          if (!toolVideos.has(tSlug)) {
            toolVideos.set(tSlug, { name: tName, slug: tSlug, skus: [], tracks: new Set() });
          }
          const tEntry = toolVideos.get(tSlug);
          tEntry.skus.push({ sku, title, track: tr.code });
          tEntry.tracks.add(tr.code);
          addEdge(vNodeId, tNodeId, 'USES_TOOL', 1.0);
          toolWikiLinks.push(`[[tools/${tSlug}|${tName}]]`);
        }

        const rawChans = Array.isArray(v.channels) && v.channels.length ? v.channels : (ins.channels_mentioned || []);
        const chanWikiLinks = [];
        for (const c of rawChans) {
          const handleRaw = typeof c === 'object' && c !== null ? (c.handle || c.name || '') : String(c || '');
          const cleanH = handleRaw.replace(/^@/, '').trim();
          if (!cleanH) continue;
          const hKey = cleanH.toLowerCase();
          const fSlug = safeFileSlug(cleanH);
          const cNodeId = `channel:${hKey}`;
          const kInfo = kenhByHandleLower.get(hKey);
          const isDead = Boolean((typeof c === 'object' && c?.dead) || kInfo?.dead);
          const cUrl = (typeof c === 'object' && c?.url) || kInfo?.url || `https://www.youtube.com/@${encodeURIComponent(cleanH)}`;
          const cName = (typeof c === 'object' && c?.name) || kInfo?.title || `@${cleanH}`;

          if (!channelVideos.has(hKey)) {
            channelVideos.set(hKey, {
              handle: `@${cleanH}`,
              fileSlug: fSlug,
              name: cName,
              url: cUrl,
              dead: isDead,
              skus: [],
              tracks: new Set(),
              kInfo
            });
          }
          const cEntry = channelVideos.get(hKey);
          if (!cEntry.skus.some(x => x.sku === sku)) {
            cEntry.skus.push({ sku, title, track: tr.code });
          }
          cEntry.tracks.add(tr.code);
          nEntry.channels.add(`[[channels/${fSlug}|@${cleanH}]]`);
          addEdge(vNodeId, cNodeId, 'ANALYZES_CHANNEL', 1.3);
          chanWikiLinks.push(`[[channels/${fSlug}|@${cleanH}]]${isDead ? ' *(DIE)*' : ''}`);
        }

        const takeaways = Array.isArray(ins.key_takeaways) ? ins.key_takeaways : [];
        const sopSteps = Array.isArray(ins.edit_sop?.additional) ? ins.edit_sop.additional : (Array.isArray(ins.sop_steps) ? ins.sop_steps : []);
        const avoidFlags = Array.isArray(ins.avoid_flags) ? ins.avoid_flags : [];
        const timestamps = Array.isArray(ins.key_timestamps) ? ins.key_timestamps : [];
        const docs = Array.isArray(v.docs) ? v.docs : [];

        const wikilinksList = [
          `[[${tr.file.replace(/\.md$/, '')}|${tr.name}]]`,
          `[[modules/${uniqueModId}|${m.title}]]`,
          `[[niches/${nicheSlug}|${nicheName}]]`,
          ...toolWikiLinks,
          ...chanWikiLinks
        ];

        if (!options.skipVaultMarkdown) {
          const vMd = `---
sku: ${yamlStr(sku)}
title: ${yamlStr(title)}
track: ${yamlStr(tr.code)}
module_id: ${yamlStr(uniqueModId)}
module_title: ${yamlStr(m.title)}
seq: ${yamlStr(seqStr)}
niche: ${yamlStr(nicheName)}
markets: [${markets.map(yamlStr).join(', ')}]
duration: ${yamlStr(duration)}
published_at: ${yamlStr(publishedAt)}
toolsCount: ${tools.length}
channelsCount: ${rawChans.length}
docsCount: ${docs.length}
player_url: "/player.html?sku=${sku}&track=${tr.code}"
---

# ${sku} — ${title}

> **Chuỗi Liên Kết Tri Thức (Knowledge Graph Links):**  
> - **Track:** [[${tr.file.replace(/\.md$/, '')}|${tr.name}]]  
> - **Module:** [[modules/${uniqueModId}|${uniqueModId} — ${m.title}]] (Bài \`#${seqStr}\`)  
> - **Ngách nội dung (Niche):** [[niches/${nicheSlug}|${nicheName}]]  
> - **Thị trường:** ${markets.join(' · ')} | **Thời lượng:** \`${duration}\` | **Ngày đăng:** \`${publishedAt}\`  
> - **Mở trên Player:** [Xem Video & Phụ Đề Tương Tác](/player.html?sku=${sku}&track=${tr.code}) · [Hồ sơ gốc README.md](../../../docs/${sku}/README.md)

---

## 1. Chủ Đề Thực Tế & Giá Trị Cốt Lõi (\`Key Takeaways\`)
- **Chủ đề thực tế:** ${actualTopic}
${takeaways.map(tk => `- ${tk}`).join('\n')}

## 2. Quy Trình Sản Xuất & Dựng Video (\`Edit SOP\`)
- **Trọng tâm:** ${ins.edit_sop?.primary || 'Quy trình thực chiến chuẩn H2DEV'}
${sopSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

## 3. Cảnh Báo Rủi Ro & Lỗi Cần Tránh (\`Avoid Flags\`)
${avoidFlags.map(af => `- ⚠️ ${af}`).join('\n')}

## 4. Liên Kết Công Cụ AI & Phần Mềm (\`Tools Mentioned\`)
${toolWikiLinks.length ? toolWikiLinks.map(tl => `- ${tl}`).join('\n') : '- *(Không sử dụng công cụ bên thứ ba đặc thù)*'}

## 5. Liên Kết Kênh Mẫu & Đối Thủ (\`Competitor Channels\`)
${chanWikiLinks.length ? chanWikiLinks.map(cl => `- ${cl}`).join('\n') : '- *(Bài học tập trung vào tư duy/kỹ thuật nền tảng, không gắn kênh đối thủ cụ thể)*'}

## 6. Tài Liệu Đính Kèm Bài Học (\`Course Docs\`)
${docs.map(d => `- **${d.title || d.name}:** \`${d.file || d.link || ''}\``).join('\n')}

## 7. Mốc Thời Gian Trọng Tâm (\`Key Timestamps\`)
${timestamps.map(ts => `- \`${ts.time}\` (${ts.seconds}s) — ${ts.label}`).join('\n')}
`;
          fs.writeFileSync(path.join(VAULT_DIR, vRelFile), vMd, 'utf8');
        }

        const ftsBody = [
          title,
          actualTopic,
          nicheName,
          markets.join(' '),
          takeaways.join(' '),
          sopSteps.join(' '),
          avoidFlags.join(' '),
          tools.join(' '),
          timestamps.map(t => `${t.time} ${t.label}`).join(' ')
        ].join(' | ');

        addNode(vNodeId, 'video', `${sku}: ${title}`, tr.code, sku, `knowledge-hub/vault/${vRelFile}`, {
          seq: seqStr,
          module_id: uniqueModId,
          niche: nicheName,
          markets,
          duration,
          published_at: publishedAt,
          toolsCount: tools.length,
          channelsCount: rawChans.length,
          docsCount: docs.length,
          playerUrl: `/player.html?sku=${sku}&track=${tr.code}`,
          targetUrl: `/player.html?sku=${sku}&track=${tr.code}`
        }, ftsBody, wikilinksList, { layer: 'knowledge', level: 4, parentId: modNodeId });
      }

      if (!options.skipVaultMarkdown) {
        const modMd = `---
module_id: ${yamlStr(uniqueModId)}
title: ${yamlStr(m.title)}
track: ${yamlStr(tr.code)}
lesson_count: ${modVideoLinks.length}
---

# Module ${uniqueModId} — ${m.title}

- **Thuộc Track:** [[${tr.file.replace(/\.md$/, '')}|${tr.name}]]
- **Tổng số bài giảng:** \`${modVideoLinks.length}\` video
- **Mô tả:** ${m.desc || m.title}

## Danh Sách Bài Học Trong Module
${modVideoLinks.map(v => `- \`#${v.seq}\` [[videos/${v.sku}|${v.sku} — ${v.title}]] (\`${v.duration}\` · ${v.nicheName})`).join('\n')}
`;
        fs.writeFileSync(path.join(VAULT_DIR, modRelFile), modMd, 'utf8');
      }

      addNode(modNodeId, 'module', `${uniqueModId}: ${m.title}`, tr.code, '', `knowledge-hub/vault/${modRelFile}`, {
        lessonCount: modVideoLinks.length,
        track: tr.code,
        targetUrl: `/video?vbranch=${encodeURIComponent(tr.code)}&vmod=${encodeURIComponent(rawModId)}`
      }, `${m.title} ${m.desc || ''} ${modVideoLinks.map(v => v.sku + ' ' + v.title).join(' ')}`, modVideoLinks.map(v => `[[videos/${v.sku}]]`), { layer: 'knowledge', level: 2, parentId: tr.id });
    }

    if (!options.skipVaultMarkdown) {
      const trackMd = `---
track_id: ${yamlStr(tr.code)}
title: ${yamlStr(tr.name)}
modules_count: ${tr.modules.length}
videos_count: ${tr.catalog.length}
---

# ${tr.name}

- **Quay về Trang Chủ Vault:** [[00-MOC-HOME|00-MOC-HOME (Bản Đồ Tri Thức Tổng Thể 333 Videos)]]
- **Số chương (Modules):** \`${tr.modules.length}\`
- **Tổng số video bài giảng:** \`${tr.catalog.length}\`

## Danh Sách Modules
${modLinksForTrack.map(ml => `- [[modules/${ml.id}|${ml.id} — ${ml.title}]] (\`${ml.count}\` bài học)`).join('\n')}
`;
      fs.writeFileSync(path.join(VAULT_DIR, tr.file), trackMd, 'utf8');
    }
  }

  // 3. Write Niche, Tool, Channel Notes
  for (const [nSlug, nData] of nicheVideos.entries()) {
    const nNodeId = `niche:${nSlug}`;
    const nRelFile = `niches/${nSlug}.md`;
    if (!options.skipVaultMarkdown) {
      const nMd = `---
niche_slug: ${yamlStr(nSlug)}
niche_name: ${yamlStr(nData.name)}
videos_count: ${nData.skus.length}
tracks: [${[...nData.tracks].map(yamlStr).join(', ')}]
---

# Ngách Nội Dung: ${nData.name}

- **Quay về Trang Chủ Vault:** [[00-MOC-HOME|00-MOC-HOME]]
- **Tổng số bài giảng thuộc ngách:** \`${nData.skus.length}\` video
- **Hiện diện trên các Track:** ${[...nData.tracks].map(t => `\`${t.toUpperCase()}\``).join(', ')}

## 1. Các Video Bài Giảng Thuộc Ngách (${nData.skus.length})
${nData.skus.map(v => `- [[videos/${v.sku}|${v.sku} — ${v.title}]] (\`${v.track.toUpperCase()}\` · \`${v.duration}\`)`).join('\n')}

## 2. Kênh Đối Thủ / Kênh Mẫu Liên Quan (${nData.channels.size})
${nData.channels.size ? [...nData.channels].map(c => `- ${c}`).join('\n') : '- *(Chưa gắn kênh mẫu riêng)*'}
`;
      fs.writeFileSync(path.join(VAULT_DIR, nRelFile), nMd, 'utf8');
    }
    addNode(nNodeId, 'niche', `Ngách: ${nData.name}`, [...nData.tracks].join(','), '', `knowledge-hub/vault/${nRelFile}`, {
      videoCount: nData.skus.length,
      channelCount: nData.channels.size,
      targetUrl: `/ngachxanh?niche=${encodeURIComponent(nData.name)}`
    }, `${nData.name} ${nData.skus.map(x => x.sku + ' ' + x.title).join(' ')}`, nData.skus.map(x => `[[videos/${x.sku}]]`), { layer: 'knowledge', level: 3 });
  }

  for (const [tSlug, tData] of toolVideos.entries()) {
    const tNodeId = `tool:${tSlug}`;
    const tRelFile = `tools/${tSlug}.md`;
    if (!options.skipVaultMarkdown) {
      const tMd = `---
tool_slug: ${yamlStr(tSlug)}
tool_name: ${yamlStr(tData.name)}
videos_count: ${tData.skus.length}
tracks: [${[...tData.tracks].map(yamlStr).join(', ')}]
---

# Công Cụ Thực Chiến: ${tData.name}

- **Quay về Trang Chủ Vault:** [[00-MOC-HOME|00-MOC-HOME]]
- **Số bài giảng sử dụng công cụ này:** \`${tData.skus.length}\` video
- **Tracks:** ${[...tData.tracks].map(t => `\`${t.toUpperCase()}\``).join(', ')}

## Danh Sách Bài Giảng Ứng Dụng ${tData.name} (${tData.skus.length})
${tData.skus.map(v => `- [[videos/${v.sku}|${v.sku} — ${v.title}]] (\`${v.track.toUpperCase()}\`)`).join('\n')}
`;
      fs.writeFileSync(path.join(VAULT_DIR, tRelFile), tMd, 'utf8');
    }
    addNode(tNodeId, 'tool', `Tool: ${tData.name}`, [...tData.tracks].join(','), '', `knowledge-hub/vault/${tRelFile}`, {
      videoCount: tData.skus.length,
      targetUrl: `/video?vq=${encodeURIComponent(tData.name)}`
    }, `${tData.name} ${tData.skus.map(x => x.sku + ' ' + x.title).join(' ')}`, tData.skus.map(x => `[[videos/${x.sku}]]`), { layer: 'knowledge', level: 5 });
  }

  for (const [hKey, cData] of channelVideos.entries()) {
    const cNodeId = `channel:${hKey}`;
    const cRelFile = `channels/${cData.fileSlug}.md`;
    if (!options.skipVaultMarkdown) {
      const cMd = `---
handle: ${yamlStr(cData.handle)}
name: ${yamlStr(cData.name)}
url: ${yamlStr(cData.url)}
status: ${yamlStr(cData.dead ? 'DEAD' : 'LIVE_HTTP_200')}
videos_count: ${cData.skus.length}
---

# Kênh Đối Thủ / Kênh Mẫu: ${cData.handle} (${cData.name})

- **Quay về Trang Chủ Vault:** [[00-MOC-HOME|00-MOC-HOME]]
- **URL YouTube:** [${cData.url}](${cData.url})
- **Trạng thái kiểm định:** \`${cData.dead ? 'DEAD (Đã dừng / Gỡ)' : 'LIVE (HTTP 200 OK)'}\`
- **Ngách (kenh-mau.json):** \`${cData.kInfo?.niche || 'Đa ngách'}\`
- **Thị trường:** \`${(cData.kInfo?.markets || []).join(', ') || 'Toàn cầu'}\`

## Các Video Bài Giảng Phân Tích Kênh Này (${cData.skus.length})
${cData.skus.map(v => `- [[videos/${v.sku}|${v.sku} — ${v.title}]] (\`${v.track.toUpperCase()}\`)`).join('\n')}
`;
      fs.writeFileSync(path.join(VAULT_DIR, cRelFile), cMd, 'utf8');
    }
    addNode(cNodeId, 'channel', `${cData.handle}`, [...cData.tracks].join(','), '', `knowledge-hub/vault/${cRelFile}`, {
      handle: cData.handle,
      name: cData.name,
      url: cData.url,
      dead: cData.dead,
      videoCount: cData.skus.length,
      targetUrl: `/kenh-mau?kq=${encodeURIComponent(cData.handle.replace(/^@/, ''))}`
    }, `${cData.handle} ${cData.name} ${cData.kInfo?.niche || ''} ${cData.skus.map(x => x.sku + ' ' + x.title).join(' ')}`, cData.skus.map(x => `[[videos/${x.sku}]]`), { layer: 'knowledge', level: 5 });
  }

  // 3.1. Ingest all 34 Canonical Niches + 5 Meta + 5 Red from ngach-xanh.json & link SKUs + Channels
  const allVideoTitleBySku = new Map(
    [...h2devCat, ...huanCat, ...dgmdCat].map(v => [v.sku, v])
  );
  function ensureChannelNode(handleStr) {
    const cleanH = String(handleStr || '').replace(/^@/, '').trim();
    if (!cleanH) return null;
    const hKey = cleanH.toLowerCase();
    const cNodeId = `channel:${hKey}`;
    if (!nodes.has(cNodeId)) {
      const fSlug = safeFileSlug(cleanH);
      const kInfo = kenhByHandleLower.get(hKey);
      const isDead = Boolean(kInfo?.dead);
      const cUrl = kInfo?.url || `https://www.youtube.com/@${encodeURIComponent(cleanH)}`;
      const cName = kInfo?.title || `@${cleanH}`;
      addNode(cNodeId, 'channel', `@${cleanH}`, 'all', '', `knowledge-hub/vault/channels/${fSlug}.md`, {
        handle: `@${cleanH}`,
        name: cName,
        url: cUrl,
        dead: isDead,
        videoCount: 0,
        targetUrl: `/kenh-mau?kq=${encodeURIComponent(cleanH)}`
      }, `@${cleanH} ${cName} ${kInfo?.niche || ''}`, [], { layer: 'knowledge', level: 5 });
    }
    return cNodeId;
  }

  for (const nx of (ngachXanhData.ngachXanh || [])) {
    const nSlug = slugify(nx.ngach);
    const nNodeId = `niche:${nSlug}`;
    const nRelFile = `niches/${nSlug}.md`;
    const nxAlias = /Everyday History EN/i.test(nx.ngach) ? 'US_EverydayHistory US EverydayHistory' : '';
    addNode(nNodeId, 'niche', `Ngách: ${nx.ngach}`, 'h2dev', '', `knowledge-hub/vault/${nRelFile}`, {
      hang: nx.hang || 0,
      xanh: nx.xanh,
      markets: nx.thiTruong || [],
      videoCount: (nx.skus || []).length,
      channelCount: (nx.mauSach || []).length + (nx.mauPhu || []).length + (nx.mauBan || []).length,
      targetUrl: `/ngachxanh?niche=${encodeURIComponent(nx.ngach)}`
    }, `${nx.ngach} ${nxAlias} ${nx.evidence || ''} ${nx.lamDuoc || ''} ${nx.viPham || ''}`, [], { layer: 'knowledge', level: 3, parentId: 'track:h2dev' });
    addEdge('track:h2dev', nNodeId, 'HAS_NICHE', 1.3);

    for (const sku of (nx.skus || [])) {
      const vNodeId = `video:${sku}`;
      if (nodes.has(vNodeId)) {
        addEdge(vNodeId, nNodeId, 'IN_NICHE', 1.2);
      }
    }
    for (const h of [...(nx.mauSach || []), ...(nx.mauPhu || []), ...(nx.mauBan || [])]) {
      const cNodeId = ensureChannelNode(h);
      if (cNodeId) {
        addEdge(nNodeId, cNodeId, 'BENCHMARKS_CHANNEL', 1.2);
      }
    }
  }

  // Enrich existing channel nodes with Raw Dossier metadata (RAW-001..RAW-156) without creating extra unlinked channel nodes
  for (const r of rawKenhData) {
    const cleanH = String(r?.channel?.handle || '').replace(/^@/, '').trim().toLowerCase();
    const cNodeId = `channel:${cleanH}`;
    if (cleanH && nodes.has(cNodeId)) {
      const cn = nodes.get(cNodeId);
      const rawIds = new Set([...(cn.meta.rawIds || []), r.id].filter(Boolean));
      cn.meta.rawId = cn.meta.rawId || r.id;
      cn.meta.rawIds = [...rawIds];
      cn.meta.channelId = cn.meta.channelId || r?.channel?.channelId || '';
      cn.meta.rawUrl = `/rawkenh?rid=${encodeURIComponent(cn.meta.rawId)}`;
      cn.body = `${cn.body || ''} ${[...rawIds].join(' ')} ${r?.channel?.channelId || ''} ${r?.channel?.title || ''} ${r?.niche || ''}`.trim();
    }
  }

  // 3.2. Ingest 300 Catalog SOP Documents (`sop:DOC-001`..`sop:DOC-300`) from tai-lieu-full.json
  let sopCount = 0;
  for (let i = 0; i < taiLieuFullData.length; i++) {
    const d = taiLieuFullData[i];
    const docNum = String(i + 1).padStart(3, '0');
    const sopId = `sop:DOC-${docNum}`;
    const sopRelFile = `sops/DOC-${docNum}.md`;
    const sku = d.sku || '';
    const vObj = allVideoTitleBySku.get(sku);
    const trackCode = vObj ? (huanCat.some(x => x.sku === sku) ? 'huan' : (dgmdCat.some(x => x.sku === sku) ? 'dgmd' : 'h2dev')) : 'h2dev';
    const parentId = (sku && nodes.has(`video:${sku}`)) ? `video:${sku}` : 'project:h2dev-project';
    const docTitle = d.name || d.title || `SOP #${docNum}`;
    const fileOrLink = d.fileLocal || d.file || d.link || '';

    if (!options.skipVaultMarkdown) {
      const sopMd = `---
sop_id: ${yamlStr(`DOC-${docNum}`)}
sku: ${yamlStr(sku)}
title: ${yamlStr(docTitle)}
kind: ${yamlStr(d.kind || 'sop')}
niche: ${yamlStr(d.contentNiche || '')}
path: ${yamlStr(fileOrLink)}
---

# DOC-${docNum} — ${docTitle}

- **Mã SKU liên kết:** ${sku && nodes.has(`video:${sku}`) ? `[[videos/${sku}|${sku}]]` : `\`${sku || 'NOI-BO'}\``}
- **Phân loại:** \`${d.kind || 'guide'}\` | **Ngách:** \`${d.contentNiche || 'Đa ngách'}\`
- **Đường dẫn / Liên kết:** \`${fileOrLink}\`
`;
      fs.writeFileSync(path.join(VAULT_DIR, sopRelFile), sopMd, 'utf8');
    }

    addNode(sopId, 'sop', `DOC-${docNum}: ${docTitle}`, trackCode, sku, fileOrLink || `knowledge-hub/vault/${sopRelFile}`, {
      docId: i + 1,
      docCode: sku || 'NOI-BO',
      kind: d.kind || 'guide',
      contentNiche: d.contentNiche || '',
      targetUrl: `/tai-lieu?did=DOC_${i + 1}&di=${i}`
    }, `DOC-${docNum} ${docTitle} ${sku} ${d.contentNiche || ''} ${fileOrLink}`, sku && nodes.has(`video:${sku}`) ? [`[[videos/${sku}]]`] : [], {
      layer: 'knowledge',
      level: 4,
      parentId
    });
    sopCount++;

    if (sku && nodes.has(`video:${sku}`)) {
      addEdge(`video:${sku}`, sopId, 'HAS_SOP', 1.4);
    } else {
      addEdge('project:h2dev-project', sopId, 'HAS_SOP', 1.2);
    }
    if (d.contentNiche) {
      const nSlug = slugify(d.contentNiche);
      if (nodes.has(`niche:${nSlug}`)) {
        addEdge(sopId, `niche:${nSlug}`, 'IN_NICHE', 1.1);
      }
    }
  }

  // 3.3. Ingest 12 YouTube 2026 Policy Pillars (`policy:P01`..`policy:P12`) & Cross-Link SKUs / Channels
  const policyList = ngachXanhData.thongTinChinhSach2026 || [];
  for (let i = 0; i < policyList.length; i++) {
    const raw = String(policyList[i] || '');
    const pCode = `P${String(i + 1).padStart(2, '0')}`;
    const pNodeId = `policy:${pCode}`;
    const pRelFile = `policies/${pCode}.md`;
    const mTitle = raw.match(/^\[([^\]]+)\]\s*(?:—|-)?\s*([\s\S]*)$/);
    const title = mTitle ? mTitle[1].trim() : `Trụ Cột Chính Sách #${i + 1}`;
    const body = mTitle ? mTitle[2].trim() : raw;

    const citedSkus = [...new Set((raw.match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
    const citedHandles = [...new Set((raw.match(/@[^\s,.;:()\[\]]+/g) || []))];

    const wLinks = [];
    for (const sku of citedSkus) {
      if (nodes.has(`video:${sku}`)) {
        addEdge(pNodeId, `video:${sku}`, 'CITES_VIDEO', 1.6);
        wLinks.push(`[[videos/${sku}|${sku}]]`);
      }
    }
    for (const h of new Set(citedHandles)) {
      const cNodeId = ensureChannelNode(h);
      if (cNodeId) {
        addEdge(pNodeId, cNodeId, 'CITES_CHANNEL', 1.5);
        wLinks.push(`[[channels/${safeFileSlug(h)}|${h}]]`);
      }
    }

    if (!options.skipVaultMarkdown) {
      const pMd = `---
policy_id: ${yamlStr(pCode)}
idx: ${i + 1}
title: ${yamlStr(title)}
cited_videos: ${citedSkus.length}
cited_channels: ${citedHandles.length}
---

# ${pCode} — ${title}

- **Thuộc Hệ Thống:** [[projects/h2dev-project|Hệ Thống Lõi 97yo-dev]]
- **Mở trên Web UI:** [Tab Tất Cả (/tatca)](/tatca) · [Tab Chính Sách & Bản Quyền (/chienluoc?sub=policy)](/chienluoc?sub=policy)

## Nội Dung Quy Chuẩn & Bằng Chứng Thực Chiến
${body}

## Các Bài Học Video Dẫn Chứng (${citedSkus.length})
${citedSkus.map(s => `- [[videos/${s}|${s} — ${allVideoTitleBySku.get(s)?.title || s}]]`).join('\n') || '- *(Quy chuẩn tổng hợp)*'}

## Các Kênh Mẫu / Case Study Dẫn Chứng (${citedHandles.length})
${[...new Set(citedHandles)].map(h => `- [[channels/${safeFileSlug(h)}|${h}]]`).join('\n') || '- *(Không nêu kênh lẻ)*'}
`;
      fs.writeFileSync(path.join(VAULT_DIR, pRelFile), pMd, 'utf8');
    }

    addNode(pNodeId, 'policy', `${pCode}: ${title}`, 'all', pCode, `knowledge-hub/vault/${pRelFile}`, {
      idx: i + 1,
      citedSkus,
      citedChannels: [...new Set(citedHandles)],
      targetUrl: '/chienluoc?sub=policy'
    }, `${pCode} ${title} ${body}`, wLinks, {
      layer: 'knowledge',
      level: 2,
      parentId: 'project:h2dev-project'
    });
    addEdge('project:h2dev-project', pNodeId, 'HAS_POLICY', 2.0);
  }

  // 3.4. Ingest 12 Pre-Publish Checklist Gates (`checklist:CL01`..`checklist:CL12`) & Link to Policies + Videos
  const checklistArr = chienLuocData.checklistTruocKhiDang || [];
  const CL_TO_POLICIES = [
    ['P04'],
    ['P04'],
    ['P02', 'P05'],
    ['P02', 'P05'],
    ['P06'],
    ['P06'],
    ['P03', 'P12'],
    ['P07'],
    ['P07'],
    ['P08'],
    ['P08', 'P09', 'P10'],
    ['P08', 'P11']
  ];
  for (let i = 0; i < checklistArr.length; i++) {
    const raw = String(checklistArr[i] || '');
    const clCode = `CL${String(i + 1).padStart(2, '0')}`;
    const clNodeId = `checklist:${clCode}`;
    const clRelFile = `checklists/${clCode}.md`;
    const mTitle = raw.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
    const title = mTitle ? mTitle[1].trim() : `Checklist #${i + 1}`;
    const body = mTitle ? mTitle[2].trim() : raw;
    const citedSkus = [...new Set((raw.match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
    const linkedPolicies = CL_TO_POLICIES[i] || ['P01'];
    const primaryPolicyId = `policy:${linkedPolicies[0]}`;

    const wLinks = [];
    for (const pCode of linkedPolicies) {
      if (nodes.has(`policy:${pCode}`)) {
        addEdge(`policy:${pCode}`, clNodeId, 'HAS_CHECKLIST', 1.8);
        addEdge(clNodeId, `policy:${pCode}`, 'ENFORCES_POLICY', 1.8);
        wLinks.push(`[[policies/${pCode}|${pCode}]]`);
      }
    }
    for (const sku of citedSkus) {
      if (nodes.has(`video:${sku}`)) {
        addEdge(clNodeId, `video:${sku}`, 'CITES_VIDEO', 1.5);
        wLinks.push(`[[videos/${sku}|${sku}]]`);
      }
    }

    if (!options.skipVaultMarkdown) {
      const clMd = `---
checklist_id: ${yamlStr(clCode)}
idx: ${i + 1}
title: ${yamlStr(title)}
policies: [${linkedPolicies.map(yamlStr).join(', ')}]
cited_videos: [${citedSkus.map(yamlStr).join(', ')}]
---

# ${clCode} — ${title}

- **Thực thi Trụ cột Chính sách:** ${linkedPolicies.map(p => `[[policies/${p}|${p}]]`).join(' · ')}
- **Mở trên Web UI:** [Tab Chính Sách & Checklist (/chienluoc?sub=policy)](/chienluoc?sub=policy)

## Câu Hỏi Kiểm Duyệt Trước Khi Xuất Bản
> ${body}

## Bài Giảng Video Tham Chiếu (${citedSkus.length})
${citedSkus.map(s => `- [[videos/${s}|${s} — ${allVideoTitleBySku.get(s)?.title || s}]]`).join('\n') || '- *(Áp dụng toàn kênh)*'}
`;
      fs.writeFileSync(path.join(VAULT_DIR, clRelFile), clMd, 'utf8');
    }

    addNode(clNodeId, 'checklist', `${clCode}: ${title}`, 'all', clCode, `knowledge-hub/vault/${clRelFile}`, {
      idx: i + 1,
      policies: linkedPolicies,
      citedSkus,
      targetUrl: '/chienluoc?sub=policy'
    }, `${clCode} ${title} ${body}`, wLinks, {
      layer: 'knowledge',
      level: 3,
      parentId: nodes.has(primaryPolicyId) ? primaryPolicyId : 'project:h2dev-project'
    });
  }

  // =========================================================================
  // 4. LAYER 2: AUTO-DISCOVER MULTI-PROJECT INFRASTRUCTURE & CODE/DATA LINEAGE
  //    Workspace (D:\YTB) -> Project -> Domain/Data Branch -> Directory -> File
  // =========================================================================
  const discoveredProjects = [];

  // 4.1. Core 97yo-dev Platform Hub (H2DEV-Project directory)
  discoveredProjects.push({
    id: 'project:h2dev-project',
    slug: 'h2dev-project',
    name: 'Hệ Thống Lõi 97yo-dev (Master Hub & 3 Nhánh Đào Tạo — 333 Video)',
    category: 'core-platform',
    absPath: ROOT,
    relToWs: 'H2DEV-Project',
    customDomains: [
      { id: 'domain:h2dev-project/server-ui', name: 'Server, Giao Diện Web 97yo-dev & Design System', dirs: ['assets/app', 'css', 'design-system'], rootFiles: true },
      { id: 'domain:h2dev-project/data-tabs', name: 'Dữ Liệu Live 9 Tabs (data-tabs SSoT)', dirs: ['data-tabs'] },
      { id: 'domain:h2dev-project/data-core', name: 'Kho Catalog 3 Nhánh (H2DEV/DGMD/Huân), Manifest & SQLite DB (data)', dirs: ['data'], shallowOnly: true },
      { id: 'domain:h2dev-project/scripts', name: 'Hệ Thống Scripts, Builder, Gate & Auto-Sync', dirs: ['scripts'] },
      { id: 'domain:h2dev-project/docs-noibo', name: 'Sổ Tay Nội Bộ, Báo Cáo & Quy Chuẩn (docs/NOI-BO)', dirs: ['docs/NOI-BO', 'knowledge-hub/docs'] }
    ]
  });

  // 4.2. Root D:\YTB Orchestration Project
  discoveredProjects.push({
    id: 'project:ytb-root-infra',
    slug: 'ytb-root-infra',
    name: 'Hạ Tầng Điều Phối Gốc (D:\\YTB Services & NSSM)',
    category: 'workspace-infra',
    absPath: WORKSPACE_ROOT,
    relToWs: '.',
    customDomains: [
      { id: 'domain:ytb-root-infra/services', name: 'NSSM Services, Khởi Động & Quản Trị Server', dirs: ['docs'], rootFiles: true }
    ]
  });

  // 4.3. Auto-discover all Production Pipelines in `H2DEV-Project/pipelines/*`
  const pipelinesBase = path.join(ROOT, 'pipelines');
  if (fs.existsSync(pipelinesBase)) {
    for (const entry of fs.readdirSync(pipelinesBase, { withFileTypes: true })) {
      if (!entry.isDirectory() || sensitiveSet.has(entry.name.toLowerCase())) continue;
      const slug = `pipeline-${slugify(entry.name)}`;
      discoveredProjects.push({
        id: `project:${slug}`,
        slug,
        name: `Pipeline: ${entry.name}`,
        category: 'production-pipeline',
        absPath: path.join(pipelinesBase, entry.name),
        relToWs: `H2DEV-Project/pipelines/${entry.name}`
      });
    }
  }

  // 4.4. Auto-discover all Research & Tooling Repos in `D:\YTB\research-repos/*`
  const researchBase = path.join(WORKSPACE_ROOT, 'research-repos');
  if (fs.existsSync(researchBase)) {
    for (const entry of fs.readdirSync(researchBase, { withFileTypes: true })) {
      if (!entry.isDirectory() || sensitiveSet.has(entry.name.toLowerCase())) continue;
      const slug = `repo-${slugify(entry.name)}`;
      discoveredProjects.push({
        id: `project:${slug}`,
        slug,
        name: `Repo: ${entry.name}`,
        category: 'research-repo',
        absPath: path.join(researchBase, entry.name),
        relToWs: `research-repos/${entry.name}`
      });
    }
  }

  // 4.5. Auto-discover any new top-level project folders in `D:\YTB` (future-proof!)
  const knownRootDirs = new Set([
    'h2dev-project', 'research-repos', 'docs', 'nhạc nền', 'claude outputs', 'zoom'
  ]);
  if (fs.existsSync(WORKSPACE_ROOT)) {
    for (const entry of fs.readdirSync(WORKSPACE_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const lower = entry.name.toLowerCase();
      if (lower.startsWith('.') || lower.startsWith('_') || sensitiveSet.has(lower) || knownRootDirs.has(lower)) continue;
      const slug = `proj-${slugify(entry.name)}`;
      discoveredProjects.push({
        id: `project:${slug}`,
        slug,
        name: `Dự Án: ${entry.name}`,
        category: 'auto-discovered-project',
        absPath: path.join(WORKSPACE_ROOT, entry.name),
        relToWs: entry.name
      });
    }
  }

  // Track all indexed files for dependency & data-flow resolution
  const fileNodeByRelPath = new Map(); // normalized relToWs or relToH2dev -> fileNodeId
  const fileNodeByBasename = new Map(); // basename -> [fileNodeId]
  const fileContentsForDepScan = []; // { fileNodeId, absPath, relToWs, projId, ext, content }
  const syncStateRows = []; // { path, mtimeMs, sizeBytes }

  function registerFileLookup(relToWs, absPath, fileNodeId) {
    const normWs = toPosix(relToWs);
    fileNodeByRelPath.set(normWs, fileNodeId);
    fileNodeByRelPath.set(normWs.toLowerCase(), fileNodeId);
    if (normWs.startsWith('H2DEV-Project/')) {
      const sub = normWs.slice('H2DEV-Project/'.length);
      fileNodeByRelPath.set(sub, fileNodeId);
      fileNodeByRelPath.set(sub.toLowerCase(), fileNodeId);
    }
    const base = path.basename(normWs).toLowerCase();
    if (!fileNodeByBasename.has(base)) fileNodeByBasename.set(base, []);
    fileNodeByBasename.get(base).push(fileNodeId);
  }

  function indexFileEntry(absFile, proj, domainId, parentNodeId) {
    const ext = path.extname(absFile).toLowerCase();
    const base = path.basename(absFile);
    if (base.toLowerCase().startsWith('.env') || base.toLowerCase().startsWith('mcp-keys')) return null;
    if (!allowedExts.has(ext) && !['.db'].includes(ext)) return null;

    let st;
    try { st = fs.statSync(absFile); } catch (_) { return null; }
    const relToWs = toPosix(path.relative(WORKSPACE_ROOT, absFile));
    const relToProj = toPosix(path.relative(proj.absPath, absFile));
    const fileNodeId = `file:${relToWs}`;

    let sample = '';
    if (st.size <= 512 * 1024 && allowedExts.has(ext)) {
      try { sample = fs.readFileSync(absFile, 'utf8'); } catch (_) {}
    }
    const role = inferFileRole(relToWs, ext, sample);

    addNode(fileNodeId, 'file', `${base}`, 'infra', '', relToWs, {
      projectId: proj.id,
      projectName: proj.name,
      domainId,
      relPath: relToWs,
      relToProject: relToProj,
      ext,
      sizeBytes: st.size,
      mtimeMs: Math.round(st.mtimeMs),
      updatedAt: new Date(st.mtimeMs).toISOString(),
      role
    }, `${base} ${relToWs} ${proj.name} ${role}`, [`[[projects/${proj.slug}|${proj.name}]]`], {
      layer: 'infra',
      level: 4,
      parentId: parentNodeId
    });

    addEdge(parentNodeId, fileNodeId, 'CONTAINS_FILE', 1.2);
    registerFileLookup(relToWs, absFile, fileNodeId);
    if (!['h2dev_knowledge_graph.db', 'knowledge_graph.json'].includes(base.toLowerCase())) {
      syncStateRows.push({ path: relToWs, mtimeMs: Math.round(st.mtimeMs), sizeBytes: st.size });
    }

    if (sample && ['.js', '.cjs', '.mjs', '.ts', '.py', '.ps1', '.bat', '.cmd', '.vbs', '.html'].includes(ext)) {
      fileContentsForDepScan.push({
        fileNodeId,
        absPath: absFile,
        relToWs,
        projId: proj.id,
        ext,
        content: sample
      });
    }
    return fileNodeId;
  }

  function walkDirTree(absDir, proj, domainId, parentNodeId, depth = 0, maxDepth = 3, shallowOnly = false) {
    if (depth > maxDepth || !fs.existsSync(absDir)) return;
    let entries = [];
    try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch (_) { return; }

    for (const entry of entries) {
      const lower = entry.name.toLowerCase();
      if (lower.startsWith('.env') || sensitiveSet.has(lower)) continue;
      const full = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        if (shallowOnly) continue;
        // Skip per-video/per-channel bulk folders in Layer 2 because Layer 1 already indexes them as video/channel nodes
        if (proj.id === 'project:h2dev-project' && (/^VIDEO-/i.test(entry.name) || /^HUAN-/i.test(entry.name) || /^DGMD-/i.test(entry.name) || ['thumbs', 'avatars', 'raw-channels-deep', 'research-20260916'].includes(entry.name))) {
          continue;
        }
        const relDirWs = toPosix(path.relative(WORKSPACE_ROOT, full));
        const dirNodeId = `dir:${relDirWs}`;
        addNode(dirNodeId, 'directory', `📁 ${entry.name}`, 'infra', '', relDirWs, {
          projectId: proj.id,
          domainId,
          relPath: relDirWs
        }, `${entry.name} ${relDirWs} ${proj.name}`, [], {
          layer: 'infra',
          level: 3,
          parentId: parentNodeId
        });
        addEdge(parentNodeId, dirNodeId, 'CONTAINS_DIR', 1.3);
        walkDirTree(full, proj, domainId, dirNodeId, depth + 1, maxDepth, false);
      } else if (entry.isFile()) {
        indexFileEntry(full, proj, domainId, parentNodeId);
      }
    }
  }

  // Scan all discovered projects
  for (const proj of discoveredProjects) {
    addNode(proj.id, 'project', proj.name, 'infra', '', proj.relToWs, {
      slug: proj.slug,
      category: proj.category,
      rootPath: proj.relToWs
    }, `${proj.name} ${proj.relToWs} ${proj.category}`, [], {
      layer: 'infra',
      level: 1,
      parentId: wsId
    });
    addEdge(wsId, proj.id, 'HAS_PROJECT', 2.5);

    if (proj.id === 'project:h2dev-project') {
      // Link the 3 Video Tracks directly to H2DEV-Project as well
      addEdge(proj.id, 'track:h2dev', 'HOSTS_TRACK', 2.0);
      addEdge(proj.id, 'track:huan', 'HOSTS_TRACK', 2.0);
      addEdge(proj.id, 'track:dgmd', 'HOSTS_TRACK', 2.0);
    }

    if (Array.isArray(proj.customDomains) && proj.customDomains.length) {
      for (const dom of proj.customDomains) {
        addNode(dom.id, 'domain', dom.name, 'infra', '', proj.relToWs, {
          projectId: proj.id,
          projectName: proj.name
        }, `${dom.name} ${proj.name}`, [], {
          layer: 'infra',
          level: 2,
          parentId: proj.id
        });
        addEdge(proj.id, dom.id, 'HAS_DOMAIN', 2.0);

        if (dom.rootFiles) {
          // Index root files of proj.absPath
          try {
            for (const e of fs.readdirSync(proj.absPath, { withFileTypes: true })) {
              if (e.isFile()) indexFileEntry(path.join(proj.absPath, e.name), proj, dom.id, dom.id);
            }
          } catch (_) {}
        }
        for (const subRel of (dom.dirs || [])) {
          const absSub = path.join(proj.absPath, subRel);
          if (!fs.existsSync(absSub)) continue;
          const relDirWs = toPosix(path.relative(WORKSPACE_ROOT, absSub));
          const dirNodeId = `dir:${relDirWs}`;
          addNode(dirNodeId, 'directory', `📁 ${subRel}`, 'infra', '', relDirWs, {
            projectId: proj.id,
            domainId: dom.id,
            relPath: relDirWs
          }, `${subRel} ${relDirWs} ${dom.name}`, [], {
            layer: 'infra',
            level: 3,
            parentId: dom.id
          });
          addEdge(dom.id, dirNodeId, 'CONTAINS_DIR', 1.5);
          walkDirTree(absSub, proj, dom.id, dirNodeId, 1, 3, Boolean(dom.shallowOnly));
        }
      }
    } else {
      // Generic Auto-Discovered Project Structure: Group by top-level directories + Root Files Domain
      let entries = [];
      try { entries = fs.readdirSync(proj.absPath, { withFileTypes: true }); } catch (_) {}
      const rootDomId = `domain:${proj.slug}/root`;
      let hasRootFiles = false;
      for (const e of entries) {
        const lower = e.name.toLowerCase();
        if (lower.startsWith('.env') || sensitiveSet.has(lower)) continue;
        if (e.isFile() && allowedExts.has(path.extname(e.name).toLowerCase())) {
          if (!hasRootFiles) {
            hasRootFiles = true;
            addNode(rootDomId, 'domain', `${proj.name} — Core Files`, 'infra', '', proj.relToWs, {
              projectId: proj.id,
              projectName: proj.name
            }, `${proj.name} Core Files`, [], {
              layer: 'infra',
              level: 2,
              parentId: proj.id
            });
            addEdge(proj.id, rootDomId, 'HAS_DOMAIN', 1.8);
          }
          indexFileEntry(path.join(proj.absPath, e.name), proj, rootDomId, rootDomId);
        } else if (e.isDirectory()) {
          const domId = `domain:${proj.slug}/${slugify(e.name)}`;
          const absSub = path.join(proj.absPath, e.name);
          const relSubWs = toPosix(path.relative(WORKSPACE_ROOT, absSub));
          addNode(domId, 'domain', `Nhánh: ${e.name}`, 'infra', '', relSubWs, {
            projectId: proj.id,
            projectName: proj.name,
            relPath: relSubWs
          }, `${e.name} ${proj.name} ${relSubWs}`, [], {
            layer: 'infra',
            level: 2,
            parentId: proj.id
          });
          addEdge(proj.id, domId, 'HAS_DOMAIN', 1.8);
          walkDirTree(absSub, proj, domId, domId, 1, 2, false);
        }
      }
    }
  }

  // 4.6. Automatic Code & Data Dependency Extraction (`IMPORTS`, `READS_DATA`, `WRITES_DATA`, `INVOKES_SCRIPT`)
  function resolveTargetFileNode(fromAbsPath, refStr) {
    const cleanRef = String(refStr || '').trim().replace(/^['"`]|['"`]$/g, '').split('?')[0];
    if (!cleanRef || cleanRef.startsWith('http:') || cleanRef.startsWith('https:') || cleanRef.startsWith('node:')) return null;

    const candidates = [];
    if (cleanRef.startsWith('.')) {
      const resolvedAbs = path.resolve(path.dirname(fromAbsPath), cleanRef);
      const relWs = toPosix(path.relative(WORKSPACE_ROOT, resolvedAbs));
      candidates.push(relWs, `${relWs}.js`, `${relWs}.cjs`, `${relWs}.mjs`, `${relWs}.ts`, `${relWs}.json`, `${relWs}/index.js`);
    } else {
      const norm = toPosix(cleanRef).replace(/^\/+/, '');
      candidates.push(
        norm,
        `${norm}.js`,
        `H2DEV-Project/${norm}`,
        `H2DEV-Project/${norm}.js`,
        `H2DEV-Project/scripts/${norm}`,
        `H2DEV-Project/scripts/${norm}.js`
      );
    }
    for (const c of candidates) {
      const hit = fileNodeByRelPath.get(c) || fileNodeByRelPath.get(c.toLowerCase());
      if (hit) return hit;
    }
    return null;
  }

  for (const item of fileContentsForDepScan) {
    const { fileNodeId, absPath, content } = item;

    // 1. JS/TS require(...) and import ... from '...'
    const reqMatches = [
      ...content.matchAll(/\brequire\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g),
      ...content.matchAll(/\bfrom\s+['"`]([^'"`]+)['"`]/g),
      ...content.matchAll(/<script[^>]+src=['"`]([^'"`]+)['"`]/gi),
      ...content.matchAll(/<link[^>]+href=['"`]([^'"`]+\.css)['"`]/gi)
    ];
    for (const m of reqMatches) {
      const targetId = resolveTargetFileNode(absPath, m[1]);
      if (targetId) addEdge(fileNodeId, targetId, 'IMPORTS', 1.6);
    }

    // 2. Data file references (`data-tabs/xxx.json`, `data/xxx.json`, `data/xxx.db`)
    const dataMatches = [
      ...content.matchAll(/['"`]((?:data-tabs|data|assets\/app|scripts|docs\/NOI-BO)[\/\\][a-zA-Z0-9_.\-\/\\]+\.(?:json|db|js|py|md|css|html|vbs|cmd|ps1))['"`]/g)
    ];
    for (const m of dataMatches) {
      const refPath = toPosix(m[1]);
      const targetId = resolveTargetFileNode(absPath, refPath);
      if (targetId) {
        const isWrite = /writeFileSync|DatabaseSync|unlinkSync|copyFileSync/.test(content);
        addEdge(fileNodeId, targetId, isWrite ? 'READS_WRITES_DATA' : 'READS_DATA', 1.5);
      }
    }

    // 3. path.join(..., 'data' | 'data-tabs' | 'scripts', 'filename.ext')
    const joinMatches = [
      ...content.matchAll(/['"`](data-tabs|data|scripts)['"`]\s*,\s*['"`]([a-zA-Z0-9_.\-]+\.(?:json|db|js|py))['"`]/g)
    ];
    for (const m of joinMatches) {
      const joined = `${m[1]}/${m[2]}`;
      const targetId = resolveTargetFileNode(absPath, joined);
      if (targetId) {
        const isWrite = /writeFileSync|INSERT INTO|CREATE TABLE/.test(content);
        addEdge(fileNodeId, targetId, isWrite ? 'READS_WRITES_DATA' : 'READS_DATA', 1.5);
      }
    }

    // 4. Batch / CMD / VBS / PS1 script invocations
    const scriptMatches = [
      ...content.matchAll(/([a-zA-Z0-9_.\-\/\\]+\.(?:vbs|cmd|bat|ps1|js|py))\b/g)
    ];
    for (const m of scriptMatches) {
      const targetId = resolveTargetFileNode(absPath, m[1]);
      if (targetId && targetId !== fileNodeId) {
        addEdge(fileNodeId, targetId, 'INVOKES_SCRIPT', 1.4);
      }
    }
  }

  // Write Project Markdown Notes in `knowledge-hub/vault/projects/<SLUG>.md`
  if (!options.skipVaultMarkdown) {
    for (const proj of discoveredProjects) {
      const projFiles = [...nodes.values()].filter(n => n.type === 'file' && n.meta?.projectId === proj.id);
      const projDomains = [...nodes.values()].filter(n => n.type === 'domain' && n.meta?.projectId === proj.id);
      const pMd = `---
project_id: ${yamlStr(proj.id)}
name: ${yamlStr(proj.name)}
category: ${yamlStr(proj.category)}
root_path: ${yamlStr(proj.relToWs)}
domains_count: ${projDomains.length}
files_count: ${projFiles.length}
---

# ${proj.name}

- **Thuộc Không Gian Gốc:** \`D:\\YTB\` (\`workspace:d-ytb\`)
- **Phân loại:** \`${proj.category}\`
- **Đường dẫn gốc:** \`${proj.relToWs}\`
- **Tổng số phân khu (Domains):** \`${projDomains.length}\`
- **Tổng số file cốt lõi đã lập chỉ mục:** \`${projFiles.length}\`

## 1. Các Phân Khu / Nhánh Dữ Liệu (\`Domains\`)
${projDomains.map(d => `- **${d.label}** (\`${d.id}\`)`).join('\n')}

## 2. Danh Sách File Thực Thi & Dữ Liệu Cốt Lõi (${projFiles.length})
${projFiles.slice(0, 120).map(f => `- \`${f.meta.relToProject || f.label}\` — *${f.meta.role}* (\`${f.meta.sizeBytes} B\`)`).join('\n')}
`;
      fs.writeFileSync(path.join(VAULT_DIR, 'projects', `${proj.slug}.md`), pMd, 'utf8');
    }

    // Write Obsidian JSON Canvas (`knowledge-hub/vault/00-ARCHITECTURE-MAP.canvas`)
    const canvasNodes = [
      { id: wsId, type: 'text', x: 0, y: 300, width: 340, height: 120, color: '1', text: `# 🌐 Hệ Thống Trung Tâm 97yo-dev\nDomain: 97yo-dev-learn.tonymmo.com\n${discoveredProjects.length} Dự án · 3 Nhánh Đào Tạo (333 Video) · Auto-Sync Live` }
    ];
    const canvasEdges = [];
    discoveredProjects.forEach((p, idx) => {
      const yPos = (idx - Math.floor(discoveredProjects.length / 2)) * 130 + 300;
      canvasNodes.push({
        id: p.id,
        type: 'file',
        file: `projects/${p.slug}.md`,
        x: 480,
        y: yPos,
        width: 340,
        height: 100,
        color: p.category === 'core-platform' ? '4' : (p.category === 'production-pipeline' ? '5' : '6')
      });
      canvasEdges.push({
        id: `edge-${idx}`,
        fromNode: wsId,
        fromSide: 'right',
        toNode: p.id,
        toSide: 'left',
        label: p.category
      });
    });
    fs.writeFileSync(path.join(VAULT_DIR, '00-ARCHITECTURE-MAP.canvas'), JSON.stringify({ nodes: canvasNodes, edges: canvasEdges }, null, 2), 'utf8');
  }

  // 5. Compute Backlinks & Degree Centrality for every Node
  const inboundMap = new Map();
  const outboundMap = new Map();
  for (const nId of nodes.keys()) {
    inboundMap.set(nId, []);
    outboundMap.set(nId, []);
  }
  for (const e of edges) {
    if (outboundMap.has(e.source)) outboundMap.get(e.source).push({ target: e.target, relation: e.relation });
    if (inboundMap.has(e.target)) inboundMap.get(e.target).push({ source: e.source, relation: e.relation });
  }

  // 6. Build SQLite WAL + FTS5 + Property Graph (`data/h2dev_knowledge_graph.db`)
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA mmap_size = 268435456;
    PRAGMA cache_size = -64000;

    DROP TABLE IF EXISTS kg_nodes;
    DROP TABLE IF EXISTS kg_edges;
    DROP TABLE IF EXISTS kg_backlinks;
    DROP TABLE IF EXISTS kg_sync_state;
    DROP TABLE IF EXISTS kg_fts;

    CREATE TABLE kg_nodes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      layer TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 4,
      parent_id TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL,
      track TEXT NOT NULL,
      sku TEXT NOT NULL,
      path TEXT NOT NULL,
      degree INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL
    ) STRICT;

    CREATE TABLE kg_edges (
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      relation TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 1.0,
      PRIMARY KEY (source, target, relation)
    ) STRICT;

    CREATE TABLE kg_backlinks (
      node_id TEXT PRIMARY KEY,
      inbound_count INTEGER NOT NULL,
      outbound_count INTEGER NOT NULL,
      inbound_json TEXT NOT NULL,
      outbound_json TEXT NOT NULL
    ) STRICT;

    CREATE TABLE kg_sync_state (
      path TEXT PRIMARY KEY,
      mtime_ms INTEGER NOT NULL,
      size_bytes INTEGER NOT NULL
    ) STRICT;

    CREATE VIRTUAL TABLE kg_fts USING fts5(
      id UNINDEXED,
      type,
      label,
      body,
      wikilinks,
      tokenize = 'unicode61 remove_diacritics 2'
    );

    CREATE INDEX idx_kg_nodes_type ON kg_nodes(type);
    CREATE INDEX idx_kg_nodes_layer ON kg_nodes(layer);
    CREATE INDEX idx_kg_nodes_parent ON kg_nodes(parent_id);
    CREATE INDEX idx_kg_nodes_sku ON kg_nodes(sku);
    CREATE INDEX idx_kg_nodes_id_lower ON kg_nodes(LOWER(id));
    CREATE INDEX idx_kg_nodes_sku_lower ON kg_nodes(LOWER(sku));
    CREATE INDEX idx_kg_nodes_path_lower ON kg_nodes(LOWER(path));
    CREATE INDEX idx_kg_nodes_label_lower ON kg_nodes(LOWER(label));
    CREATE INDEX idx_kg_edges_source ON kg_edges(source);
    CREATE INDEX idx_kg_edges_target ON kg_edges(target);
  `);

  const insNode = db.prepare(`INSERT INTO kg_nodes (id, type, layer, level, parent_id, label, track, sku, path, degree, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insEdge = db.prepare(`INSERT INTO kg_edges (source, target, relation, weight) VALUES (?, ?, ?, ?)`);
  const insBacklink = db.prepare(`INSERT INTO kg_backlinks (node_id, inbound_count, outbound_count, inbound_json, outbound_json) VALUES (?, ?, ?, ?, ?)`);
  const insSync = db.prepare(`INSERT OR REPLACE INTO kg_sync_state (path, mtime_ms, size_bytes) VALUES (?, ?, ?)`);
  const insFts = db.prepare(`INSERT INTO kg_fts (id, type, label, body, wikilinks) VALUES (?, ?, ?, ?, ?)`);

  db.exec('BEGIN IMMEDIATE');
  for (const [nId, n] of nodes.entries()) {
    const inb = inboundMap.get(nId) || [];
    const outb = outboundMap.get(nId) || [];
    const deg = inb.length + outb.length;
    n.degree = deg;
    n.meta = n.meta || {};
    if (!n.meta.targetUrl) {
      if (n.type === 'video') {
        n.meta.targetUrl = n.meta.playerUrl || `/lotrinh/${encodeURIComponent(n.sku || n.id.replace(/^video:/, ''))}${n.track && n.track !== 'h2dev' ? '?track=' + encodeURIComponent(n.track) : ''}`;
      } else if (n.type === 'track') {
        n.meta.targetUrl = `/lotrinh?track=${encodeURIComponent(n.track || 'h2dev')}`;
      } else if (n.type === 'module') {
        n.meta.targetUrl = `/lotrinh?track=${encodeURIComponent(n.track || 'h2dev')}`;
      } else if (n.type === 'niche') {
        const cleanNiche = String(n.label || '').replace(/^Ngách:\s*/i, '').trim();
        n.meta.targetUrl = `/ngachxanh?niche=${encodeURIComponent(cleanNiche)}`;
      } else if (n.type === 'channel') {
        const hKey = n.id.replace(/^channel:/, '').toLowerCase();
        const rList = rawByHandleLower.get(hKey) || [];
        if (rList.length && !n.meta.rawId) {
          n.meta.rawId = rList[0].id;
          n.meta.rawIds = rList.map(x => x.id);
          n.meta.rawUrl = `/rawkenh?rid=${encodeURIComponent(rList[0].id)}`;
        }
        const hStr = n.meta.handle || n.label;
        if (kenhByHandleLower.has(hKey)) {
          n.meta.targetUrl = `/kenh-mau?handle=${encodeURIComponent(hStr)}`;
        } else if (n.meta.rawUrl) {
          n.meta.targetUrl = n.meta.rawUrl;
        } else {
          n.meta.targetUrl = `/kenh-mau?kq=${encodeURIComponent(hStr)}`;
        }
      } else if (n.type === 'tool') {
        const cleanTool = String(n.label || '').replace(/^Tool:\s*/i, '').trim();
        n.meta.targetUrl = `/sodo?sq=${encodeURIComponent(cleanTool)}`;
      } else if (n.type === 'policy' || n.type === 'checklist') {
        n.meta.targetUrl = `/chienluoc?sub=policy`;
      } else if (n.type === 'sop') {
        const mSop = n.id.match(/^sop:DOC-0*(\d+)$/i);
        const dNum = mSop ? parseInt(mSop[1], 10) : 1;
        n.meta.targetUrl = `/tai-lieu?did=DOC_${dNum}&di=${dNum - 1}`;
      } else {
        n.meta.targetUrl = `/sodo?snode=${encodeURIComponent(n.id)}`;
      }
    }
    const rawIdsStr = (n.meta.rawIds || (n.meta.rawId ? [n.meta.rawId] : [])).join(' ');
    const fullBody = `${n.id} ${n.sku || ''} ${rawIdsStr} ${n.body || n.label} ${foldVi((n.label || '') + ' ' + (n.body || '') + ' ' + rawIdsStr)}`.trim();
    insNode.run(n.id, n.type, n.layer, n.level, n.parentId || '', n.label, n.track, n.sku, n.path, deg, JSON.stringify(n.meta));
    insBacklink.run(n.id, inb.length, outb.length, JSON.stringify(inb), JSON.stringify(outb));
    insFts.run(n.id, n.type, n.label, fullBody, (n.wikilinks || []).join(' '));
  }
  for (const e of edges) {
    insEdge.run(e.source, e.target, e.relation, e.weight);
  }
  for (const s of syncStateRows) {
    insSync.run(s.path, s.mtimeMs, s.sizeBytes);
  }
  db.exec(`INSERT INTO kg_fts(kg_fts) VALUES('optimize')`);
  db.exec('COMMIT');
  db.close();

  // 7. Export JSON Graph (`data/knowledge_graph.json`) for Web Interactive Dual-Layer Explorer
  const countByType = (t) => [...nodes.values()].filter(n => n.type === t).length;
  const elapsedMs = Math.round(performance.now() - tStart);
  const jsonGraph = {
    schema: 'h2dev.nexus-graph.v2',
    generatedAt: new Date().toISOString(),
    buildTimeMs: elapsedMs,
    stats: {
      totalNodes: nodes.size,
      totalEdges: edges.length,
      knowledgeNodes: [...nodes.values()].filter(n => n.layer === 'knowledge').length,
      infraNodes: [...nodes.values()].filter(n => n.layer === 'infra').length,
      projects: discoveredProjects.length,
      domains: countByType('domain'),
      directories: countByType('directory'),
      files: countByType('file'),
      tracks: 3,
      modules: countByType('module'),
      videos: countByType('video'),
      videosH2dev: h2devCat.length,
      videosHuan: huanCat.length,
      videosDgmd: dgmdCat.length,
      policies: countByType('policy'),
      checklists: countByType('checklist'),
      sops: countByType('sop'),
      niches: countByType('niche'),
      tools: countByType('tool'),
      channels: countByType('channel')
    },
    projects: discoveredProjects.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      relPath: p.relToWs
    })),
    nodes: [...nodes.values()].map(n => ({
      id: n.id,
      type: n.type,
      layer: n.layer,
      level: n.level,
      parentId: n.parentId || '',
      projectId: n.projectId || n.meta?.projectId || (n.type === 'project' ? n.id : ''),
      label: n.label,
      track: n.track,
      sku: n.sku,
      path: n.path,
      degree: n.degree || 0,
      meta: n.meta
    })),
    edges
  };
  fs.writeFileSync(JSON_GRAPH_PATH, JSON.stringify(jsonGraph, null, 2), 'utf8');

  if (!options.silent) {
    console.log(`✅ H2DEV NEXUS GRAPH BUILT IN ${elapsedMs}ms:`);
    console.log(`   - Stats : ${JSON.stringify(jsonGraph.stats)}`);
  }
  return jsonGraph.stats;
}

if (require.main === module) {
  buildKnowledgeAndInfraGraph({ skipVaultMarkdown: process.argv.includes('--fast') });
}

module.exports = { buildKnowledgeAndInfraGraph };
