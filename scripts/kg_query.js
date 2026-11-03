#!/usr/bin/env node
/**
 * kg_query.js — Công cụ Truy vấn & Truy vết Tức thì (< 2ms) Đồ thị Liên hợp Đa Dự Án H2DEV Nexus
 * Tích hợp Tự động Đồng bộ Tức thì (`ensureGraphFresh()`) + SQLite WAL + FTS5 BM25 + Lineage Tracing.
 *
 * Cách dùng cho AI Agent & Developer:
 *   node scripts/kg_query.js stats
 *   node scripts/kg_query.js projects
 *   node scripts/kg_query.js trace "<tên_file | đường_dẫn | thư_mục | dự_án | mã_SKU>"
 *   node scripts/kg_query.js search "<từ khóa>" [--layer infra|knowledge] [--type file|directory|domain|project|video|niche|tool|channel]
 *   node scripts/kg_query.js node "<node_id | SKU | filename>"
 */

const fs = require('fs');
const path = require('path');
const _origEmitWarningKgq = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
  return _origEmitWarningKgq.call(process, w, ...rest);
};
const { DatabaseSync } = require('node:sqlite');
const { ensureGraphFresh } = require('./kg_auto_sync');
const masterDal = require('./master_dal');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');
const INTEL_DB_PATH = path.join(ROOT, 'data', 'intelligence.db');
const OVERVIEW_SUMMARY_PATH = path.join(ROOT, 'data', 'overview_summary.json');

let _cachedKgDb = null;
let _cachedKgMtime = 0;
let _cachedKgStmt = new Map();
let _cachedIntelDb = null;
let _cachedIntelMtime = 0;
let _cachedIntelStmt = new Map();

function foldVi(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function openIntelDb() {
  if (!fs.existsSync(INTEL_DB_PATH)) return null;
  try {
    const stat = fs.statSync(INTEL_DB_PATH);
    if (!_cachedIntelDb || _cachedIntelMtime !== stat.mtimeMs) {
      _cachedIntelStmt.clear();
      if (_cachedIntelDb) {
        try { _cachedIntelDb.close(); } catch {}
        _cachedIntelDb = null;
        _cachedIntelMtime = 0;
      }
      const nextDb = new DatabaseSync(INTEL_DB_PATH, { readOnly: true });
      try {
        nextDb.exec(`PRAGMA busy_timeout = 5000; PRAGMA mmap_size = 134217728; PRAGMA temp_store = MEMORY;`);
      } catch (pragmaErr) {
        try { nextDb.close(); } catch {}
        throw pragmaErr;
      }
      _cachedIntelDb = nextDb;
      _cachedIntelMtime = stat.mtimeMs;
    }
    return _cachedIntelDb;
  } catch {
    return null;
  }
}

function prepareIntel(sql) {
  const idb = openIntelDb();
  if (!idb) return null;
  let stmt = _cachedIntelStmt.get(sql);
  if (!stmt) {
    stmt = idb.prepare(sql);
    if (_cachedIntelStmt.size > 128) _cachedIntelStmt.clear();
    _cachedIntelStmt.set(sql, stmt);
  }
  return stmt;
}

function openDb(autoSync = true) {
  if (autoSync) {
    ensureGraphFresh();
  }
  if (!fs.existsSync(DB_PATH)) {
    throw new Error('Chưa có DB đồ thị. Hãy chạy: node scripts/build_knowledge_vault_graph.js');
  }
  const stat = fs.statSync(DB_PATH);
  if (!_cachedKgDb || _cachedKgMtime !== stat.mtimeMs) {
    _cachedKgStmt.clear();
    if (_cachedKgDb) {
      try { _cachedKgDb.close(); } catch {}
      _cachedKgDb = null;
      _cachedKgMtime = 0;
    }
    const nextDb = new DatabaseSync(DB_PATH, { readOnly: true });
    try {
      nextDb.exec(`PRAGMA busy_timeout = 5000; PRAGMA mmap_size = 268435456; PRAGMA temp_store = MEMORY;`);
    } catch (pragmaErr) {
      try { nextDb.close(); } catch {}
      throw pragmaErr;
    }
    _cachedKgDb = nextDb;
    _cachedKgMtime = stat.mtimeMs;
  }
  return _cachedKgDb;
}

function prepareKg(sql, autoSync = true) {
  const db = openDb(autoSync);
  let stmt = _cachedKgStmt.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    if (_cachedKgStmt.size > 128) _cachedKgStmt.clear();
    _cachedKgStmt.set(sql, stmt);
  }
  return stmt;
}

function closeKgDb() {
  _cachedKgStmt.clear();
  _cachedIntelStmt.clear();
  if (_cachedKgDb) {
    try { _cachedKgDb.close(); } catch {}
    _cachedKgDb = null;
    _cachedKgMtime = 0;
  }
  if (_cachedIntelDb) {
    try { _cachedIntelDb.close(); } catch {}
    _cachedIntelDb = null;
    _cachedIntelMtime = 0;
  }
  try {
    if (masterDal && typeof masterDal.reloadReadDb === 'function') {
      masterDal.reloadReadDb();
    }
  } catch {}
}

function getGraphStatsFromDb(autoSync = true) {
  const t0 = performance.now();
  let byLayer = [], byType = [], byTrack = [], edgeCounts = [], topHubs = [];
  try {
    const db = openDb(autoSync);
    byLayer = db.prepare(`SELECT layer, COUNT(*) as count FROM kg_nodes GROUP BY layer ORDER BY count DESC`).all();
    byType = db.prepare(`SELECT type, layer, COUNT(*) as count, SUM(degree) as sum_deg FROM kg_nodes GROUP BY type, layer ORDER BY count DESC`).all();
    byTrack = db.prepare(`SELECT track, COUNT(*) as count FROM kg_nodes WHERE type = 'video' GROUP BY track ORDER BY count DESC`).all();
    edgeCounts = db.prepare(`SELECT relation, COUNT(*) as count FROM kg_edges GROUP BY relation ORDER BY count DESC`).all();
    topHubs = db.prepare(`SELECT id, type, layer, label, degree, path FROM kg_nodes ORDER BY degree DESC LIMIT 15`).all();
  } catch {}

  let masterSummary = null;
  try {
    let ov = null;
    if (fs.existsSync(OVERVIEW_SUMMARY_PATH)) {
      ov = JSON.parse(fs.readFileSync(OVERVIEW_SUMMARY_PATH, 'utf8'));
    }
    let masterDbCounts = null;
    try {
      masterDbCounts = {
        lessons: masterDal.queryOne('SELECT COUNT(*) AS c FROM lessons').c,
        timestamps: masterDal.queryOne('SELECT COUNT(*) AS c FROM lesson_timestamps').c,
        niches: masterDal.queryOne('SELECT COUNT(*) AS c FROM niches').c,
        channels: masterDal.queryOne('SELECT COUNT(*) AS c FROM competitor_channels').c,
        topVideos: masterDal.queryOne('SELECT COUNT(*) AS c FROM competitor_top_videos').c,
        documents: masterDal.queryOne('SELECT COUNT(*) AS c FROM documents').c,
        reupSources: masterDal.queryOne('SELECT COUNT(*) AS c FROM reup_sources').c,
        policies: masterDal.queryOne('SELECT COUNT(*) AS c FROM policies').c,
        checklists: masterDal.queryOne('SELECT COUNT(*) AS c FROM checklists').c,
        ftsTotal: masterDal.queryOne('SELECT COUNT(*) AS c FROM search_fts').c
      };
    } catch {}
    const deadChannelsCount = (ov && ov.counts && typeof ov.counts.deadChannels === 'number')
      ? ov.counts.deadChannels
      : (() => {
          try {
            return masterDal.queryOne("SELECT COUNT(*) AS c FROM competitor_channels WHERE is_monetized = 0 OR ypp_status IN ('DEAD_404', 'TERMINATED_BY_YOUTUBE')").c;
          } catch { return 0; }
        })();
    masterSummary = Object.assign({}, ov || {}, {
      deadChannelsCount,
      masterDbCounts
    });
  } catch {}

  let intelligenceStats = {
    channelsCount: 0,
    videosCount: 0,
    cowatchEdgesCount: 0,
    breakoutCount: 0,
    facelessCount: 0,
    outliersCount: 0
  };
  try {
    const idb = openIntelDb();
    if (idb) {
      intelligenceStats = {
        channelsCount: idb.prepare('SELECT COUNT(*) AS c FROM channels').get().c,
        videosCount: idb.prepare('SELECT COUNT(*) AS c FROM videos').get().c,
        cowatchEdgesCount: idb.prepare('SELECT COUNT(*) AS c FROM cowatch_edges').get().c,
        breakoutCount: idb.prepare('SELECT COUNT(*) AS c FROM channels WHERE is_breakout = 1').get().c,
        facelessCount: idb.prepare('SELECT COUNT(*) AS c FROM channels WHERE is_faceless = 1').get().c,
        outliersCount: idb.prepare('SELECT COUNT(*) AS c FROM videos WHERE outlier_score >= 3.0').get().c
      };
    }
  } catch {}

  const ms = Number((performance.now() - t0).toFixed(2));
  return {
    latencyMs: ms,
    nodesByLayer: byLayer,
    nodesByType: byType,
    videosByTrack: byTrack,
    edgesByRelation: edgeCounts,
    topConnectedHubs: topHubs,
    masterSummary,
    intelligenceStats
  };
}

function listProjectsFromDb(autoSync = true) {
  const t0 = performance.now();
  const db = openDb(autoSync);
  const projs = db.prepare(`SELECT id, label, path, degree, metadata_json FROM kg_nodes WHERE type = 'project' ORDER BY degree DESC`).all();
  const result = projs.map(p => {
    const meta = JSON.parse(p.metadata_json || '{}');
    const domCount = db.prepare(`SELECT COUNT(*) as c FROM kg_nodes WHERE type = 'domain' AND parent_id = ?`).get(p.id).c;
    const fileCount = db.prepare(`SELECT COUNT(*) as c FROM kg_nodes WHERE type = 'file' AND metadata_json LIKE ?`).get(`%"projectId":"${p.id}"%`).c;
    return {
      id: p.id,
      name: p.label,
      category: meta.category || 'project',
      rootPath: p.path,
      domainsCount: domCount,
      filesCount: fileCount,
      degree: p.degree
    };
  });
  return {
    latencyMs: Number((performance.now() - t0).toFixed(2)),
    totalProjects: result.length,
    projects: result
  };
}

function escLike(s) {
  return String(s || '').replace(/[\\%_]/g, '\\$&');
}

function findNodeFlexible(db, rawQuery) {
  const q = String(rawQuery || '').trim().replace(/\\/g, '/');
  if (!q) return null;
  const cleanHandle = q.replace(/^(?:channel:|raw:)?@?/i, '');
  const qNoPrefix = q.replace(/^(niche|module|tool|channel|raw|video|lesson|sop|doc|policy|checklist|project|domain|dir|file|track|reup):/i, '').trim();
  const qSlug = foldVi(qNoPrefix).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

  // Normalize DOC_54 / DOC-54 / TL-54 / sop:DOC_54 / sop:TL-54 -> DOC-054
  const mDoc = qNoPrefix.match(/^(?:DOC|TL)[-_]?0*(\d+)$/i);
  const normSopCode = mDoc ? `DOC-${String(parseInt(mDoc[1], 10)).padStart(3, '0')}` : qNoPrefix;

  // Normalize P1 / policy:P1 -> P01
  const mPol = qNoPrefix.match(/^P[-_]?0*(\d+)$/i);
  const normPolCode = mPol ? `P${String(parseInt(mPol[1], 10)).padStart(2, '0')}` : qNoPrefix;

  // Normalize CL1 / checklist:CL1 -> CL01
  const mCl = qNoPrefix.match(/^CL[-_]?0*(\d+)$/i);
  const normClCode = mCl ? `CL${String(parseInt(mCl[1], 10)).padStart(2, '0')}` : qNoPrefix;

  // Normalize M1 / M01 / module:M01 -> H2DEV-M01
  const mMod = qNoPrefix.match(/^(?:(H2DEV|HUAN|DGMD)[-_])?M0*(\d+)$/i);
  const normModCode = mMod ? `${(mMod[1] || 'H2DEV').toUpperCase()}-M${String(parseInt(mMod[2], 10)).padStart(2, '0')}` : qNoPrefix;

  // 1. Exact ID or SKU or Path or Policy/Checklist/SOP/Channel/Niche-Slug match (uses expression indexes)
  let node = prepareKg(`
    SELECT * FROM kg_nodes
    WHERE LOWER(id) = LOWER(?)
       OR LOWER(sku) = LOWER(?)
       OR LOWER(sku) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(id) = LOWER(?)
       OR LOWER(path) = LOWER(?)
       OR LOWER(path) = LOWER(?)
    LIMIT 1
  `, false).get(
    q,
    q,
    qNoPrefix,
    `video:${qNoPrefix}`,
    `file:${qNoPrefix}`,
    `project:${qNoPrefix}`,
    `sop:${normSopCode}`,
    `policy:${normPolCode}`,
    `checklist:${normClCode}`,
    `module:${normModCode}`,
    `channel:${cleanHandle}`,
    `niche:${qNoPrefix}`,
    `niche:${qSlug}`,
    `tool:${qSlug}`,
    q,
    `H2DEV-Project/${qNoPrefix}`
  );
  if (node) return node;

  // 1b. Match H01..H40, SUB-01..SUB-120, SN-Hxx-yyy inside niche metadata_json or body
  if (/^(?:H\d{1,2}|SUB-\d+|SN-H\d+-\d+)$/i.test(qNoPrefix)) {
    const normNicheCode = /^H\d$/i.test(qNoPrefix)
      ? `H0${qNoPrefix.slice(1)}`
      : (/^SUB-\d$/i.test(qNoPrefix) ? `SUB-0${qNoPrefix.slice(4)}` : qNoPrefix.toUpperCase());
    node = prepareKg(`
      SELECT * FROM kg_nodes
      WHERE type = 'niche' AND metadata_json LIKE ?
      LIMIT 1
    `, false).get(`%"${normNicheCode}"%`);
    if (node) return node;
  }

  // 1c. Match META-01..META-05 to track:h2dev
  if (/^META-0?[1-5]$/i.test(qNoPrefix)) {
    node = prepareKg(`SELECT * FROM kg_nodes WHERE id = 'track:h2dev' LIMIT 1`, false).get();
    if (node) return node;
  }

  // 1d. Match RAW-xxx ID inside channel (or fallback niche) metadata_json
  if (/^RAW-\d+$/i.test(qNoPrefix)) {
    const rawNum = qNoPrefix.replace(/^RAW-0*/i, '');
    const normRawCode = `RAW-${String(parseInt(rawNum || '1', 10)).padStart(3, '0')}`;
    node = prepareKg(`
      SELECT * FROM kg_nodes
      WHERE type IN ('channel', 'niche') AND metadata_json LIKE ?
      ORDER BY CASE WHEN type = 'channel' THEN 0 ELSE 1 END
      LIMIT 1
    `, false).get(`%"${normRawCode}"%`);
    if (node) return node;
  }

  // 1e. Match REUP-xxx / REUP_x ID -> resolve to anchored video:<sku> (or niche:<nicheCode>) node
  if (/^REUP[-_]?\d+$/i.test(qNoPrefix)) {
    const reupIdx = parseInt(qNoPrefix.replace(/^REUP[-_]?0*/i, '') || '1', 10) - 1;
    try {
      if (!global._kgReupCache) {
        const reupPath = path.join(ROOT, 'data-tabs', 'nguon-reup.json');
        global._kgReupCache = fs.existsSync(reupPath) ? JSON.parse(fs.readFileSync(reupPath, 'utf8')) : [];
      }
      const reupEntry = global._kgReupCache[reupIdx];
      if (reupEntry && reupEntry.sku) {
        node = prepareKg(`SELECT * FROM kg_nodes WHERE LOWER(id) = LOWER(?) LIMIT 1`, false).get(`video:${reupEntry.sku}`);
        if (node) return node;
      }
      if (reupEntry && reupEntry.nicheCode) {
        node = prepareKg(`SELECT * FROM kg_nodes WHERE type = 'niche' AND metadata_json LIKE ? LIMIT 1`, false).get(`%"${reupEntry.nicheCode}"%`);
        if (node) return node;
      }
    } catch (_) {}
  }

  const qEsc = escLike(qNoPrefix || q);
  const qFoldedEsc = escLike(foldVi(qNoPrefix || q));

  // 2. Suffix path or label match (e.g. "counts.js", "master_dal.js", "server.js", "build_h2dev_data.js")
  node = prepareKg(`
    SELECT * FROM kg_nodes
    WHERE LOWER(label) = LOWER(?)
       OR LOWER(label) = LOWER(?)
       OR LOWER(path) LIKE LOWER(?) ESCAPE '\\'
       OR LOWER(id) LIKE LOWER(?) ESCAPE '\\'
    ORDER BY CASE WHEN type = 'file' THEN 0 WHEN type = 'project' THEN 1 WHEN type = 'directory' THEN 2 ELSE 3 END, degree DESC
    LIMIT 1
  `, false).get(q, qNoPrefix, `%/${qEsc}`, `%:${qEsc}`);
  if (node) return node;

  // 3. Substring match (accented or folded)
  node = prepareKg(`
    SELECT * FROM kg_nodes
    WHERE LOWER(label) LIKE LOWER(?) ESCAPE '\\' OR LOWER(path) LIKE LOWER(?) ESCAPE '\\' OR LOWER(id) LIKE LOWER(?) ESCAPE '\\'
    ORDER BY degree DESC
    LIMIT 1
  `, false).get(`%${qEsc}%`, `%${qEsc}%`, `%${qFoldedEsc}%`);
  return node || null;
}

/**
 * Truy vết toàn diện 1 nút từ Gốc -> Đỉnh (`workspace -> project -> domain -> directory -> file`)
 * kèm toàn bộ Liên kết Đi (Outbound) và Liên kết Đến / Phạm vi ảnh hưởng (Inbound Impact).
 */
function traceNodeInDb(rawQuery, autoSync = true) {
  const t0 = performance.now();
  const db = openDb(autoSync);
  const node = findNodeFlexible(db, rawQuery);
  if (!node) {
    return { found: false, query: rawQuery, error: `Không tìm thấy thực thể khớp với: "${rawQuery}"` };
  }

  // 1. Walk upstream parent chain (Lineage from Root Workspace -> Target)
  const lineageChain = [];
  let cur = node;
  const visitedUp = new Set();
  const stmtGetById = prepareKg(`SELECT * FROM kg_nodes WHERE id = ?`, false);
  while (cur && !visitedUp.has(cur.id)) {
    visitedUp.add(cur.id);
    lineageChain.unshift({
      id: cur.id,
      type: cur.type,
      layer: cur.layer,
      level: cur.level,
      label: cur.label,
      path: cur.path
    });
    if (!cur.parent_id) break;
    cur = stmtGetById.get(cur.parent_id);
  }

  // 2. Get Backlinks & Outbound Links
  const bl = prepareKg(`SELECT * FROM kg_backlinks WHERE node_id = ?`, false).get(node.id);
  const inbound = JSON.parse(bl?.inbound_json || '[]');
  const outbound = JSON.parse(bl?.outbound_json || '[]');

  const neighborIds = [...new Set([...inbound.map(x => x.source), ...outbound.map(x => x.target)])];
  const labelMap = new Map();
  if (neighborIds.length) {
    const placeholders = neighborIds.map(() => '?').join(',');
    const nRows = db.prepare(`SELECT id, type, layer, level, label, sku, path, degree, metadata_json FROM kg_nodes WHERE id IN (${placeholders})`).all(...neighborIds);
    for (const r of nRows) {
      let meta = {};
      try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
      labelMap.set(r.id, {
        id: r.id,
        type: r.type,
        layer: r.layer,
        level: r.level,
        label: r.label,
        sku: r.sku || '',
        path: r.path || '',
        degree: r.degree,
        rawId: meta.rawId || '',
        docId: meta.docId || null,
        targetUrl: meta.targetUrl || ''
      });
    }
  }

  const enrichedOutbound = outbound.map(o => ({
    relation: o.relation,
    target: o.target,
    ...(labelMap.get(o.target) || {})
  }));
  const enrichedInbound = inbound.map(i => ({
    relation: i.relation,
    source: i.source,
    ...(labelMap.get(i.source) || {})
  }));

  // Separate structural children vs functional code/data dependencies
  const childrenNodes = enrichedOutbound.filter(x => ['HAS_PROJECT', 'HAS_DOMAIN', 'CONTAINS_DIR', 'CONTAINS_FILE', 'HAS_MODULE', 'HAS_VIDEO', 'HOSTS_TRACK'].includes(x.relation));
  const codeDataDependencies = enrichedOutbound.filter(x => !['HAS_PROJECT', 'HAS_DOMAIN', 'CONTAINS_DIR', 'CONTAINS_FILE', 'HAS_MODULE', 'HAS_VIDEO', 'HOSTS_TRACK'].includes(x.relation));
  const impactCallers = enrichedInbound.filter(x => !['HAS_PROJECT', 'HAS_DOMAIN', 'CONTAINS_DIR', 'CONTAINS_FILE', 'HAS_MODULE', 'HAS_VIDEO', 'HOSTS_TRACK'].includes(x.relation));

  const ms = Number((performance.now() - t0).toFixed(2));
  return {
    found: true,
    query: rawQuery,
    latencyMs: ms,
    lineageString: lineageChain.map(x => `[${x.type.toUpperCase()}] ${x.label}`).join(' ──► '),
    lineageChain,
    targetNode: {
      id: node.id,
      type: node.type,
      layer: node.layer,
      level: node.level,
      parentId: node.parent_id,
      label: node.label,
      track: node.track,
      sku: node.sku,
      path: node.path,
      degree: node.degree,
      meta: JSON.parse(node.metadata_json || '{}')
    },
    codeAndDataDependencies: codeDataDependencies,
    inboundImpactCallers: impactCallers,
    structuralChildren: childrenNodes.slice(0, 50),
    totalChildrenCount: childrenNodes.length,
    outboundAll: enrichedOutbound,
    inboundAll: enrichedInbound
  };
}

function buildKgFtsTokens(cleanStr) {
  const words = cleanStr
    .split(/[\s/]+/)
    .map(w => w.replace(/^[-._]+|[-._]+$/g, ''))
    .filter(Boolean);
  return words.map((w, idx) => {
    const folded = foldVi(w).toLowerCase();
    const wSafe = w.replace(/"/g, '');
    const fSafe = folded.replace(/"/g, '');
    const dToDbar = fSafe.replace(/d/g, 'đ');
    const subParts = fSafe.split(/[-._]+/).filter(Boolean);
    const usePrefix = wSafe.length >= 3 && (words.length === 1 || idx === words.length - 1) && !/^\d+$/.test(wSafe);
    const sfx = usePrefix ? '*' : '';
    const variants = new Set([`"${wSafe}"${sfx}`, `"${fSafe}"${sfx}`]);
    if (dToDbar !== fSafe) variants.add(`"${dToDbar}"${sfx}`);
    const mDoc = fSafe.match(/^(?:sop:)?(?:doc|tl)[-_]?0*(\d+)$/i);
    if (mDoc) {
      const paddedNum = String(parseInt(mDoc[1], 10)).padStart(3, '0');
      variants.add(`("doc" AND "${paddedNum}")`);
    }
    if (subParts.length > 1) {
      variants.add(`(${subParts.map((p, pIdx) => `"${p}"${p.length >= 3 && pIdx === subParts.length - 1 && !/^\d+$/.test(p) ? '*' : ''}`).join(' AND ')})`);
    }
    return `(${[...variants].join(' OR ')})`;
  });
}

function searchGraphInDb(qRaw, options = {}, autoSync = true) {
  const t0 = performance.now();
  openDb(autoSync);
  const rawTrim = String(qRaw || '').trim();
  const clean = rawTrim.replace(/[^\p{L}\p{N}\s_.\-/]+/gu, ' ').trim();
  if (!clean) return { query: qRaw, latencyMs: 0, count: 0, results: [] };

  const tokenExprs = buildKgFtsTokens(clean);
  if (!tokenExprs.length) return { query: qRaw, latencyMs: 0, count: 0, results: [] };

  const limit = options.limit || 20;
  const foldedTrim = foldVi(rawTrim).toLowerCase();
  const mDoc = rawTrim.match(/^(?:sop:)?(?:DOC|TL)[-_]?0*(\d+)$/i);
  const normSopCode = mDoc ? `DOC-${String(parseInt(mDoc[1], 10)).padStart(3, '0')}` : rawTrim;
  const rawEsc = escLike(rawTrim);
  const foldedEsc = escLike(foldedTrim);

  const runFtsQuery = (joinOp) => {
    const ftsQuery = tokenExprs.join(joinOp);
    let sql = `
      SELECT n.id, n.type, n.layer, n.level, n.parent_id, n.label, n.track, n.sku, n.path, n.degree, n.metadata_json,
             bm25(kg_fts, 0.0, 2.0, 5.0, 1.5, 2.0) AS bm25_score
      FROM kg_fts
      JOIN kg_nodes n ON n.id = kg_fts.id
      WHERE kg_fts MATCH ?
    `;
    const params = [ftsQuery];
    if (options.type) {
      sql += ` AND n.type = ?`;
      params.push(options.type);
    }
    if (options.layer) {
      sql += ` AND n.layer = ?`;
      params.push(options.layer);
    }
    if (options.track) {
      sql += ` AND n.track LIKE ?`;
      params.push(`%${options.track}%`);
    }
    sql += `
      ORDER BY
        CASE
          WHEN LOWER(n.id) = LOWER(?)
            OR LOWER(n.id) = LOWER('video:' || ?)
            OR LOWER(n.id) = LOWER('sop:' || ?)
            OR LOWER(n.id) = LOWER('policy:' || ?)
            OR LOWER(n.id) = LOWER('checklist:' || ?)
            OR LOWER(n.id) = LOWER('niche:' || ?)
            OR LOWER(n.label) = LOWER(?)
            OR (n.type = 'niche' AND n.metadata_json LIKE '%"code":"' || UPPER(?) || '"%')
          THEN -2000.0
          WHEN LOWER(n.sku) = LOWER(?)
          THEN -1200.0
          WHEN n.metadata_json LIKE '%"' || UPPER(?) || '"%'
          THEN -900.0
          WHEN LOWER(n.label) LIKE LOWER(?) ESCAPE '\\' OR LOWER(n.label) LIKE LOWER(?) ESCAPE '\\'
          THEN -80.0
          ELSE 0.0
        END
        + bm25(kg_fts, 0.0, 2.0, 5.0, 1.5, 2.0)
        - MIN(1.5, n.degree * 0.008) ASC
      LIMIT ?
    `;
    params.push(
      rawTrim, rawTrim, normSopCode, rawTrim, rawTrim, rawTrim, rawTrim, rawTrim,
      rawTrim,
      rawTrim,
      `%${rawEsc}%`, `%${foldedEsc}%`,
      limit
    );
    return prepareKg(sql, false).all(...params);
  };

  let rawRows = [];
  try {
    rawRows = runFtsQuery(' AND ');
    if (rawRows.length === 0 && tokenExprs.length > 1) {
      rawRows = runFtsQuery(' OR ');
    }
  } catch {
    rawRows = [];
  }

  const rows = rawRows.map(r => {
    const meta = JSON.parse(r.metadata_json || '{}');
    return {
      id: r.id,
      type: r.type,
      layer: r.layer,
      level: r.level,
      parentId: r.parent_id,
      label: r.label,
      track: r.track,
      sku: r.sku,
      degree: r.degree,
      path: r.path,
      targetUrl: meta.targetUrl || '',
      meta
    };
  });
  const ms = Number((performance.now() - t0).toFixed(2));
  return { query: qRaw, latencyMs: ms, count: rows.length, results: rows };
}

/**
 * Tìm đường đi ngắn nhất (BFS Shortest Path) giữa 2 thực thể bất kỳ trên đồ thị vô hướng/hữu hướng.
 */
function tracePathInDb(fromQuery, toQuery, autoSync = true) {
  const t0 = performance.now();
  const db = openDb(autoSync);
  const startNode = findNodeFlexible(db, fromQuery);
  const endNode = findNodeFlexible(db, toQuery);
  if (!startNode || !endNode) {
    return {
      found: false,
      fromQuery,
      toQuery,
      error: !startNode
        ? `Không tìm thấy điểm xuất phát: "${fromQuery}"`
        : `Không tìm thấy điểm đích: "${toQuery}"`
    };
  }
  if (startNode.id === endNode.id) {
    return {
      found: true,
      hops: 0,
      latencyMs: Number((performance.now() - t0).toFixed(2)),
      fromNode: { id: startNode.id, type: startNode.type, label: startNode.label },
      toNode: { id: endNode.id, type: endNode.type, label: endNode.label },
      pathNodes: [{ id: startNode.id, type: startNode.type, layer: startNode.layer, label: startNode.label, path: startNode.path }],
      pathEdges: []
    };
  }

  const edges = db.prepare(`SELECT source, target, relation FROM kg_edges`).all();
  const adj = new Map();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source).push({ next: e.target, relation: e.relation, dir: '──►' });
    adj.get(e.target).push({ next: e.source, relation: e.relation, dir: '◄──' });
  }

  const queue = [startNode.id];
  const visited = new Set([startNode.id]);
  const parentEdge = new Map();
  let reached = false;

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === endNode.id) {
      reached = true;
      break;
    }
    const neighbors = adj.get(curr) || [];
    for (const nb of neighbors) {
      if (!visited.has(nb.next)) {
        visited.add(nb.next);
        parentEdge.set(nb.next, { prev: curr, relation: nb.relation, dir: nb.dir });
        queue.push(nb.next);
      }
    }
  }

  if (!reached) {
    return {
      found: false,
      fromQuery,
      toQuery,
      latencyMs: Number((performance.now() - t0).toFixed(2)),
      error: `Không có đường nối giữa "${startNode.label}" và "${endNode.label}"`
    };
  }

  const nodeIds = [];
  const pathEdges = [];
  let curId = endNode.id;
  while (curId !== startNode.id) {
    nodeIds.unshift(curId);
    const pe = parentEdge.get(curId);
    pathEdges.unshift({ from: pe.prev, to: curId, relation: pe.relation, dir: pe.dir });
    curId = pe.prev;
  }
  nodeIds.unshift(startNode.id);

  const placeholders = nodeIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT id, type, layer, level, label, path, sku, metadata_json FROM kg_nodes WHERE id IN (${placeholders})`).all(...nodeIds);
  const rowMap = new Map(rows.map(r => [r.id, r]));
  const pathNodes = nodeIds.map(id => {
    const r = rowMap.get(id) || { id, label: id, type: 'unknown', layer: 'knowledge' };
    let meta = {};
    try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
    return {
      id: r.id,
      type: r.type,
      layer: r.layer,
      level: r.level,
      label: r.label,
      path: r.path,
      sku: r.sku,
      targetUrl: meta.targetUrl || ''
    };
  });

  return {
    found: true,
    hops: pathEdges.length,
    latencyMs: Number((performance.now() - t0).toFixed(2)),
    fromNode: pathNodes[0],
    toNode: pathNodes[pathNodes.length - 1],
    pathNodes,
    pathEdges,
    summaryString: pathNodes.map((n, i) => (i === 0 ? `[${n.type.toUpperCase()}] ${n.label}` : `${pathEdges[i - 1].dir}(${pathEdges[i - 1].relation})${pathEdges[i - 1].dir} [${n.type.toUpperCase()}] ${n.label}`)).join(' ')
  };
}

function searchIntelligenceDb(qRaw, limit = 12) {
  const q = String(qRaw || '').trim();
  if (!q) return [];
  const idb = openIntelDb();
  if (!idb) return [];
  const results = [];
  const seenIds = new Set();

  // 1. Primary path: FTS5 BM25 on channels_fts & videos_fts (<0.3ms)
  const cleanTokens = q
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .split(/[\s-]+/)
    .map(w => w.replace(/"/g, '').trim())
    .filter(Boolean);

  if (cleanTokens.length > 0) {
    const ftsClauses = cleanTokens.map((w, idx) => {
      const wLower = w.toLowerCase();
      const f = foldVi(wLower);
      const dBar = f.replace(/d/g, 'đ');
      const usePrefix = wLower.length >= 3 && (cleanTokens.length === 1 || idx === cleanTokens.length - 1) && !/^\d+$/.test(wLower);
      const sfx = usePrefix ? '*' : '';
      const vars = new Set([`"${wLower}"${sfx}`, `"${f}"${sfx}`]);
      if (dBar !== f) vars.add(`"${dBar}"${sfx}`);
      return vars.size > 1 ? `(${[...vars].join(' OR ')})` : [...vars][0];
    });
    const ftsMatchExpr = ftsClauses.join(' AND ');
    try {
      const chFtsStmt = prepareIntel(`
        SELECT c.channel_id, c.handle, c.title, c.primary_niche, c.median_views, c.top_outlier_multiplier, c.is_breakout, c.is_faceless, c.faceless_type
        FROM channels_fts f
        JOIN channels c ON c.channel_id = f.channel_id
        WHERE channels_fts MATCH ?
        ORDER BY bm25(channels_fts, 0.0, 5.0, 8.0, 4.0, 1.0) ASC, c.is_breakout DESC, c.median_views DESC
        LIMIT ?
      `);
      const chRows = chFtsStmt ? chFtsStmt.all(ftsMatchExpr, limit) : [];
      for (const c of chRows) {
        seenIds.add(`CH:${c.channel_id}`);
        const outMult = c.top_outlier_multiplier ? (String(c.top_outlier_multiplier).endsWith('x') ? c.top_outlier_multiplier : `${Number(c.top_outlier_multiplier).toFixed(1)}x`) : '';
        results.push({
          entity_type: 'INTEL_CHANNEL',
          id: c.channel_id,
          entity_id: c.channel_id,
          handle: c.handle,
          title: c.title,
          primary_niche: c.primary_niche,
          median_views: c.median_views,
          top_outlier_multiplier: c.top_outlier_multiplier,
          is_breakout: c.is_breakout,
          is_faceless: c.is_faceless,
          faceless_type: c.faceless_type,
          snippet: [
            c.primary_niche ? `Ngách: ${c.primary_niche}` : '',
            c.median_views ? `Median: ${Number(c.median_views).toLocaleString('vi-VN')} views` : '',
            outMult ? `Outlier: ${outMult}` : '',
            c.faceless_type ? `Format: ${c.faceless_type}` : ''
          ].filter(Boolean).join(' · ')
        });
      }
      if (results.length < limit) {
        const rem = limit - results.length;
        const vFtsStmt = prepareIntel(`
          SELECT v.video_id, v.channel_id, v.title, v.views, v.outlier_score, c.handle, c.primary_niche
          FROM videos_fts f
          JOIN videos v ON v.video_id = f.video_id
          LEFT JOIN channels c ON c.channel_id = v.channel_id
          WHERE videos_fts MATCH ?
          ORDER BY bm25(videos_fts, 0.0, 0.0, 8.0, 2.0) ASC, v.views DESC
          LIMIT ?
        `);
        const vRows = vFtsStmt ? vFtsStmt.all(ftsMatchExpr, rem) : [];
        for (const v of vRows) {
          seenIds.add(`VID:${v.video_id}`);
          const vOut = v.outlier_score ? (String(v.outlier_score).endsWith('x') ? v.outlier_score : `${Number(v.outlier_score).toFixed(1)}x`) : '';
          results.push({
            entity_type: 'INTEL_VIDEO',
            id: v.video_id,
            entity_id: v.video_id,
            channel_id: v.channel_id,
            handle: v.handle || '',
            title: v.title,
            primary_niche: v.primary_niche || '',
            views: v.views,
            outlier_score: v.outlier_score,
            snippet: [
              v.handle ? `Kênh: ${v.handle}` : '',
              v.primary_niche ? `Ngách: ${v.primary_niche}` : '',
              v.views ? `${Number(v.views).toLocaleString('vi-VN')} views` : '',
              vOut ? `Outlier: ${vOut}` : ''
            ].filter(Boolean).join(' · ')
          });
        }
      }
    } catch {}
  }

  // 2. Fallback / supplement for exact channel_id / video_id (UNINDEXED in FTS5)
  if (results.length === 0) {
    const pat = `%${q}%`;
    try {
      const chRows = idb.prepare(`
        SELECT channel_id, handle, title, primary_niche, median_views, top_outlier_multiplier, is_breakout, is_faceless, faceless_type
        FROM channels
        WHERE LOWER(channel_id) = LOWER(?) OR LOWER(handle) LIKE LOWER(?) OR LOWER(title) LIKE LOWER(?) OR LOWER(primary_niche) LIKE LOWER(?)
        ORDER BY is_breakout DESC, median_views DESC
        LIMIT ?
      `).all(q, pat, pat, pat, limit);
      for (const c of chRows) {
        if (seenIds.has(`CH:${c.channel_id}`)) continue;
        const outMult = c.top_outlier_multiplier ? (String(c.top_outlier_multiplier).endsWith('x') ? c.top_outlier_multiplier : `${Number(c.top_outlier_multiplier).toFixed(1)}x`) : '';
        results.push({
          entity_type: 'INTEL_CHANNEL',
          id: c.channel_id,
          entity_id: c.channel_id,
          handle: c.handle,
          title: c.title,
          primary_niche: c.primary_niche,
          median_views: c.median_views,
          top_outlier_multiplier: c.top_outlier_multiplier,
          is_breakout: c.is_breakout,
          is_faceless: c.is_faceless,
          faceless_type: c.faceless_type,
          snippet: [
            c.primary_niche ? `Ngách: ${c.primary_niche}` : '',
            c.median_views ? `Median: ${Number(c.median_views).toLocaleString('vi-VN')} views` : '',
            outMult ? `Outlier: ${outMult}` : '',
            c.faceless_type ? `Format: ${c.faceless_type}` : ''
          ].filter(Boolean).join(' · ')
        });
      }
      if (results.length < limit) {
        const rem = limit - results.length;
        const vRows = idb.prepare(`
          SELECT v.video_id, v.channel_id, v.title, v.views, v.outlier_score, c.handle, c.primary_niche
          FROM videos v
          LEFT JOIN channels c ON c.channel_id = v.channel_id
          WHERE LOWER(v.video_id) = LOWER(?) OR LOWER(v.title) LIKE LOWER(?)
          ORDER BY v.views DESC
          LIMIT ?
        `).all(q, pat, rem);
        for (const v of vRows) {
          if (seenIds.has(`VID:${v.video_id}`)) continue;
          const vOut = v.outlier_score ? (String(v.outlier_score).endsWith('x') ? v.outlier_score : `${Number(v.outlier_score).toFixed(1)}x`) : '';
          results.push({
            entity_type: 'INTEL_VIDEO',
            id: v.video_id,
            entity_id: v.video_id,
            channel_id: v.channel_id,
            handle: v.handle || '',
            title: v.title,
            primary_niche: v.primary_niche || '',
            views: v.views,
            outlier_score: v.outlier_score,
            snippet: [
              v.handle ? `Kênh: ${v.handle}` : '',
              v.primary_niche ? `Ngách: ${v.primary_niche}` : '',
              v.views ? `${Number(v.views).toLocaleString('vi-VN')} views` : '',
              vOut ? `Outlier: ${vOut}` : ''
            ].filter(Boolean).join(' · ')
          });
        }
      }
    } catch {}
  }

  return results.slice(0, limit);
}

function queryIntelligenceBreakouts(limitOrOpts = 30) {
  const idb = openIntelDb();
  const isObj = limitOrOpts && typeof limitOrOpts === 'object';
  const rawLim = isObj ? limitOrOpts.limit : limitOrOpts;
  const safeLim = Number.isFinite(Number(rawLim)) ? Math.max(1, Math.min(200, Number(rawLim))) : 30;
  const view = isObj && limitOrOpts.view ? String(limitOrOpts.view).trim().toLowerCase() : 'breakouts';
  const niche = isObj && limitOrOpts.niche ? String(limitOrOpts.niche).trim().toUpperCase() : '';
  const maxSubs = isObj && Number.isFinite(Number(limitOrOpts.maxSubs)) && Number(limitOrOpts.maxSubs) > 0 ? Number(limitOrOpts.maxSubs) : 0;
  const search = isObj && limitOrOpts.search ? String(limitOrOpts.search).trim() : '';

  if (!idb) return { view, total: 0, totalBreakouts: 0, totalChannels: 0, totalVideos: 0, totalOutliers: 0, totalEdges: 0, channels: [] };
  try {
    const totalChannels = idb.prepare('SELECT COUNT(*) AS c FROM channels').get().c;
    const totalBreakouts = idb.prepare('SELECT COUNT(*) AS c FROM channels WHERE is_breakout = 1').get().c;
    const totalFaceless = idb.prepare('SELECT COUNT(*) AS c FROM channels WHERE is_faceless = 1').get().c;
    const totalVideos = idb.prepare('SELECT COUNT(*) AS c FROM videos').get().c;
    const totalOutliers = idb.prepare('SELECT COUNT(*) AS c FROM videos WHERE outlier_score >= 3.0').get().c;
    const totalEdges = idb.prepare('SELECT COUNT(*) AS c FROM cowatch_edges').get().c;

    if (view === 'stats') {
      const topNiches = idb.prepare('SELECT primary_niche, COUNT(*) AS channel_count, CAST(AVG(median_views) AS INTEGER) AS avg_median_views FROM channels WHERE primary_niche IS NOT NULL GROUP BY primary_niche ORDER BY channel_count DESC LIMIT 12').all();
      return {
        view: 'stats',
        total: topNiches.length,
        totalBreakouts,
        totalChannels,
        totalFaceless,
        totalVideos,
        totalOutliers,
        totalEdges,
        topNiches,
        channels: []
      };
    }

    if (view === 'outliers' || view === 'top_videos') {
      const conds = [view === 'outliers' ? 'v.outlier_score >= 3.0' : '1=1'];
      const params = [];
      if (niche) { conds.push('UPPER(c.primary_niche) = ?'); params.push(niche); }
      if (search) { conds.push('(LOWER(v.title) LIKE LOWER(?) OR LOWER(c.title) LIKE LOWER(?) OR LOWER(c.handle) LIKE LOWER(?))'); const pat = `%${search}%`; params.push(pat, pat, pat); }
      params.push(safeLim);
      const orderClause = view === 'outliers' ? 'v.outlier_score DESC, v.views DESC' : 'v.views DESC';
      const videos = idb.prepare(`
        SELECT v.video_id, v.channel_id, v.title, v.views, v.outlier_score, c.handle, c.title AS channel_title, c.primary_niche, c.median_views
        FROM videos v
        LEFT JOIN channels c ON c.channel_id = v.channel_id
        WHERE ${conds.join(' AND ')}
        ORDER BY ${orderClause}
        LIMIT ?
      `).all(...params);
      return {
        view,
        total: videos.length,
        totalBreakouts,
        totalChannels,
        totalVideos,
        totalOutliers,
        totalEdges,
        channels: [],
        videos
      };
    }

    const conds = [];
    const params = [];
    if (view === 'dream100') {
      conds.push('is_breakout = 1');
      if (maxSubs > 0) { conds.push('(subscriber_count <= ? OR subscriber_count IS NULL OR subscriber_count = 0)'); params.push(maxSubs); }
    } else if (view !== 'all_channels') {
      conds.push('is_breakout = 1');
    }
    if (niche) { conds.push('UPPER(primary_niche) = ?'); params.push(niche); }
    if (search) { conds.push('(LOWER(title) LIKE LOWER(?) OR LOWER(handle) LIKE LOWER(?) OR LOWER(primary_niche) LIKE LOWER(?))'); const pat = `%${search}%`; params.push(pat, pat, pat); }
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(safeLim);
    const rows = idb.prepare(
      `SELECT channel_id, handle, title, subscriber_count, video_count, view_count, channel_age_days, median_views, top_outlier_multiplier, is_faceless, faceless_type, is_breakout, primary_niche, country, last_crawled_at FROM channels ${whereSql} ORDER BY median_views DESC LIMIT ?`
    ).all(...params);
    return {
      view,
      total: rows.length,
      totalBreakouts,
      totalChannels,
      totalFaceless,
      totalVideos,
      totalOutliers,
      totalEdges,
      channels: rows
    };
  } catch (err) {
    return { view, total: 0, totalBreakouts: 0, channels: [], error: err.message };
  }
}

/**
 * Truy vấn Sâu Đa Luồng Liên Hợp (Multi-Query Deep Search & Cross-DB Fusion):
 * Cho phép Agent hoặc Người dùng truyền vào 1 hoặc nhiều truy vấn phân tách bằng dấu `|` (VD: "VIDEO-53a547 | P02 | US_EverydayHistory"),
 * tự động quét song song cả `h2dev_master.db` (FTS5 10 bảng) + `h2dev_knowledge_graph.db` (Đồ thị 2,983 nút + Lineage).
 */
function deepSearchAll(rawQueries, options = {}) {
  const t0 = performance.now();
  ensureGraphFresh();
  const list = Array.isArray(rawQueries)
    ? rawQueries
    : String(rawQueries || '')
        .split('|')
        .map(s => s.trim())
        .filter(Boolean);

  const limitPerQuery = options.limit || 12;
  const batches = list.map(q => {
    const qt0 = performance.now();
    let masterHits = [];
    try { masterHits = masterDal.searchFts(q, limitPerQuery); } catch {}
    let graphSearch = { count: 0, results: [] };
    try { graphSearch = searchGraphInDb(q, { limit: limitPerQuery, type: options.type, layer: options.layer }, false); } catch {}
    let directTrace = { found: false };
    try { directTrace = traceNodeInDb(q, false); } catch {}
    const intelligenceHits = searchIntelligenceDb(q, limitPerQuery);
    return {
      query: q,
      latencyMs: Number((performance.now() - qt0).toFixed(2)),
      exactNodeFound: directTrace.found ? directTrace.targetNode : null,
      lineageString: directTrace.found ? directTrace.lineageString : null,
      outboundCount: directTrace.found ? directTrace.outboundAll.length : 0,
      inboundCount: directTrace.found ? directTrace.inboundAll.length : 0,
      masterFtsCount: masterHits.length,
      masterResults: masterHits,
      graphFtsCount: graphSearch.count,
      graphResults: graphSearch.results,
      intelCount: intelligenceHits.length,
      intelResults: intelligenceHits
    };
  });

  return {
    totalQueries: batches.length,
    totalLatencyMs: Number((performance.now() - t0).toFixed(2)),
    batches
  };
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === 'stats') {
    console.log(JSON.stringify(getGraphStatsFromDb(true), null, 2));
  } else if (cmd === 'projects') {
    console.log(JSON.stringify(listProjectsFromDb(true), null, 2));
  } else if (cmd === 'trace' || cmd === 'node' || cmd === 'impact') {
    const res = traceNodeInDb(rest.join(' '), true);
    if (!res.found) {
      console.error(res.error);
      process.exit(1);
    }
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'path') {
    const [fromQ, toQ] = rest;
    if (!fromQ || !toQ) {
      console.error('Cách dùng: node scripts/kg_query.js path "<node_A>" "<node_B>"');
      process.exit(1);
    }
    console.log(JSON.stringify(tracePathInDb(fromQ, toQ, true), null, 2));
  } else if (cmd === 'deep') {
    console.log(JSON.stringify(deepSearchAll(rest.join(' ')), null, 2));
  } else if (cmd === 'search') {
    let type = '', layer = '', track = '';
    const terms = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--type' && rest[i + 1]) type = rest[++i];
      else if (rest[i] === '--layer' && rest[i + 1]) layer = rest[++i];
      else if (rest[i] === '--track' && rest[i + 1]) track = rest[++i];
      else terms.push(rest[i]);
    }
    console.log(JSON.stringify(searchGraphInDb(terms.join(' '), { type, layer, track }, true), null, 2));
  } else {
    console.error('Lệnh hỗ trợ: stats | projects | trace <query> | path <from> <to> | deep "<q1> | <q2>" | search <query> [--layer infra|knowledge] [--type ...] | node <id>');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  openIntelDb,
  searchIntelligenceDb,
  queryIntelligenceBreakouts,
  getGraphStatsFromDb,
  listProjectsFromDb,
  traceNodeInDb,
  searchGraphInDb,
  tracePathInDb,
  deepSearchAll,
  closeKgDb
};
