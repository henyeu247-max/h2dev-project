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
const { DatabaseSync } = require('node:sqlite');
const { ensureGraphFresh } = require('./kg_auto_sync');
const masterDal = require('./master_dal');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');

let _cachedKgDb = null;
let _cachedKgMtime = 0;

function foldVi(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
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
    if (_cachedKgDb) {
      try { _cachedKgDb.close(); } catch {}
    }
    _cachedKgDb = new DatabaseSync(DB_PATH, { readOnly: true });
    _cachedKgDb.exec(`PRAGMA mmap_size = 268435456; PRAGMA temp_store = MEMORY;`);
    _cachedKgMtime = stat.mtimeMs;
  }
  return _cachedKgDb;
}

function closeKgDb() {
  if (_cachedKgDb) {
    try { _cachedKgDb.close(); } catch {}
    _cachedKgDb = null;
    _cachedKgMtime = 0;
  }
}

function getGraphStatsFromDb(autoSync = true) {
  const t0 = performance.now();
  const db = openDb(autoSync);
  const byLayer = db.prepare(`SELECT layer, COUNT(*) as count FROM kg_nodes GROUP BY layer ORDER BY count DESC`).all();
  const byType = db.prepare(`SELECT type, layer, COUNT(*) as count, SUM(degree) as sum_deg FROM kg_nodes GROUP BY type, layer ORDER BY count DESC`).all();
  const byTrack = db.prepare(`SELECT track, COUNT(*) as count FROM kg_nodes WHERE type = 'video' GROUP BY track ORDER BY count DESC`).all();
  const edgeCounts = db.prepare(`SELECT relation, COUNT(*) as count FROM kg_edges GROUP BY relation ORDER BY count DESC`).all();
  const topHubs = db.prepare(`SELECT id, type, layer, label, degree, path FROM kg_nodes ORDER BY degree DESC LIMIT 15`).all();
  const ms = Number((performance.now() - t0).toFixed(2));
  return {
    latencyMs: ms,
    nodesByLayer: byLayer,
    nodesByType: byType,
    videosByTrack: byTrack,
    edgesByRelation: edgeCounts,
    topConnectedHubs: topHubs
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

function findNodeFlexible(db, rawQuery) {
  const q = String(rawQuery || '').trim().replace(/\\/g, '/');
  if (!q) return null;
  const cleanHandle = q.replace(/^@/, '');

  // 1. Exact ID or SKU or Path or Policy/Checklist/SOP/Channel match (uses expression indexes)
  let node = db.prepare(`
    SELECT * FROM kg_nodes
    WHERE LOWER(id) = LOWER(?)
       OR LOWER(sku) = LOWER(?)
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
  `).get(
    q,
    q,
    `video:${q}`,
    `file:${q}`,
    `project:${q}`,
    `sop:${q}`,
    `policy:${q}`,
    `checklist:${q}`,
    `channel:${cleanHandle}`,
    `niche:${q}`,
    q,
    `H2DEV-Project/${q}`
  );
  if (node) return node;

  // 1b. Match RAW-xxx ID inside channel metadata_json
  if (/^RAW-\d+$/i.test(q)) {
    node = db.prepare(`
      SELECT * FROM kg_nodes
      WHERE type = 'channel' AND metadata_json LIKE ?
      LIMIT 1
    `).get(`%"${q.toUpperCase()}"%`);
    if (node) return node;
  }

  // 2. Suffix path or label match (e.g. "counts.js", "master_dal.js", "server.js", "build_h2dev_data.js")
  node = db.prepare(`
    SELECT * FROM kg_nodes
    WHERE LOWER(label) = LOWER(?)
       OR LOWER(path) LIKE LOWER(?)
       OR LOWER(id) LIKE LOWER(?)
    ORDER BY CASE WHEN type = 'file' THEN 0 WHEN type = 'project' THEN 1 WHEN type = 'directory' THEN 2 ELSE 3 END, degree DESC
    LIMIT 1
  `).get(q, `%/${q}`, `%:${q}`);
  if (node) return node;

  // 3. Substring match (accented or folded)
  const qFolded = foldVi(q);
  node = db.prepare(`
    SELECT * FROM kg_nodes
    WHERE LOWER(label) LIKE LOWER(?) OR LOWER(path) LIKE LOWER(?) OR LOWER(id) LIKE LOWER(?)
    ORDER BY degree DESC
    LIMIT 1
  `).get(`%${q}%`, `%${q}%`, `%${qFolded}%`);
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
    cur = db.prepare(`SELECT * FROM kg_nodes WHERE id = ?`).get(cur.parent_id);
  }

  // 2. Get Backlinks & Outbound Links
  const bl = db.prepare(`SELECT * FROM kg_backlinks WHERE node_id = ?`).get(node.id);
  const inbound = JSON.parse(bl?.inbound_json || '[]');
  const outbound = JSON.parse(bl?.outbound_json || '[]');

  const neighborIds = [...new Set([...inbound.map(x => x.source), ...outbound.map(x => x.target)])];
  const labelMap = new Map();
  if (neighborIds.length) {
    const placeholders = neighborIds.map(() => '?').join(',');
    const nRows = db.prepare(`SELECT id, type, layer, level, label, path, degree, metadata_json FROM kg_nodes WHERE id IN (${placeholders})`).all(...neighborIds);
    for (const r of nRows) {
      let meta = {};
      try { meta = JSON.parse(r.metadata_json || '{}'); } catch {}
      labelMap.set(r.id, {
        id: r.id,
        type: r.type,
        layer: r.layer,
        level: r.level,
        label: r.label,
        path: r.path,
        degree: r.degree,
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
  return words.map(w => {
    const folded = foldVi(w);
    const wSafe = w.replace(/"/g, '');
    const fSafe = folded.replace(/"/g, '');
    const subParts = fSafe.split(/[-._]+/).filter(Boolean);
    const variants = new Set([`"${wSafe}"*`, `"${fSafe}"*`]);
    if (subParts.length > 1) {
      variants.add(`(${subParts.map(p => `"${p}"*`).join(' AND ')})`);
    }
    return `(${[...variants].join(' OR ')})`;
  });
}

function searchGraphInDb(qRaw, options = {}, autoSync = true) {
  const t0 = performance.now();
  const db = openDb(autoSync);
  const rawTrim = String(qRaw || '').trim();
  const clean = rawTrim.replace(/[^\p{L}\p{N}\s_.\-/]+/gu, ' ').trim();
  if (!clean) return { query: qRaw, latencyMs: 0, count: 0, results: [] };

  const tokenExprs = buildKgFtsTokens(clean);
  if (!tokenExprs.length) return { query: qRaw, latencyMs: 0, count: 0, results: [] };

  const limit = options.limit || 20;
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
          WHEN LOWER(n.sku) = LOWER(?)
            OR LOWER(n.id) = LOWER(?)
            OR LOWER(n.id) = LOWER('video:' || ?)
            OR LOWER(n.id) = LOWER('sop:' || ?)
            OR LOWER(n.id) = LOWER('policy:' || ?)
            OR LOWER(n.id) = LOWER('checklist:' || ?)
            OR LOWER(n.id) = LOWER('niche:' || ?)
            OR LOWER(n.label) = LOWER(?)
            OR n.metadata_json LIKE '%"' || UPPER(?) || '"%'
          THEN -1000.0
          ELSE 0.0
        END
        + bm25(kg_fts, 0.0, 2.0, 5.0, 1.5, 2.0)
        - MIN(1.5, n.degree * 0.008) ASC
      LIMIT ?
    `;
    params.push(rawTrim, rawTrim, rawTrim, rawTrim, rawTrim, rawTrim, rawTrim, rawTrim, rawTrim, limit);
    return db.prepare(sql).all(...params);
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

  const rows = rawRows.map(r => ({
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
    meta: JSON.parse(r.metadata_json || '{}')
  }));
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
    const masterHits = masterDal.searchFts(q, limitPerQuery);
    const graphSearch = searchGraphInDb(q, { limit: limitPerQuery, type: options.type, layer: options.layer }, false);
    const directTrace = traceNodeInDb(q, false);
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
      graphResults: graphSearch.results
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
  getGraphStatsFromDb,
  listProjectsFromDb,
  traceNodeInDb,
  searchGraphInDb,
  tracePathInDb,
  deepSearchAll,
  closeKgDb
};
