/* graph-main.js — H2DEV Nexus Dual-Layer Graph & Real-Time Lineage Explorer
 * Strict compliance with ui-ux-standard (T-1..T-10, H-1..H-3, S-1..S-5, G-2..G-3, C-1, A-1..A-6, St-1..St-5)
 * and 100% deterministic tree lineage via node.parentId & node.projectId.
 */
(function () {
  'use strict';

  const COLORS = {
    workspace: '#fb7185',
    project: '#fb923c',
    domain: '#facc15',
    directory: '#2dd4bf',
    file: '#60a5fa',
    track: '#f87171',
    module: '#fbbf24',
    policy: '#f43f5e',
    checklist: '#fb7185',
    video: '#38bdf8',
    sop: '#818cf8',
    niche: '#34d399',
    tool: '#c084fc',
    channel: '#f472b6'
  };

  const TYPE_LABELS = {
    workspace: 'WORKSPACE',
    project: 'DỰ ÁN',
    domain: 'NHÁNH DATA',
    directory: 'THƯ MỤC',
    file: 'FILE',
    track: 'TRACK',
    module: 'MODULE',
    policy: 'CHÍNH SÁCH YT',
    checklist: 'CHECKLIST',
    video: 'VIDEO SKU',
    sop: 'TÀI LIỆU SOP',
    niche: 'NGÁCH',
    tool: 'CÔNG CỤ',
    channel: 'KÊNH MẪU'
  };

  const RADII = {
    workspace: 18,
    project: 13,
    track: 14,
    domain: 9,
    module: 9,
    policy: 9.5,
    directory: 7,
    niche: 7,
    checklist: 7,
    tool: 6,
    channel: 5.5,
    sop: 5,
    file: 4.8,
    video: 5
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // DOM Elements
  const canvas = document.getElementById('kgCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const flowViewEl = document.getElementById('nxFlowView');
  const graphViewEl = document.getElementById('nxGraphView');
  const matrixViewEl = document.getElementById('nxMatrixView');
  const matrixContentEl = document.getElementById('nxMatrixContent');
  const inspectorSidebarEl = document.getElementById('kgInspector');
  const inspectorEl = document.getElementById('kgInspectorContent');
  const statsBadge = document.getElementById('kgStatsBadge');
  const searchInput = document.getElementById('kgSearch');
  const lineageBarEl = document.getElementById('nxLineageBar');
  const syncTextEl = document.getElementById('nxSyncText');
  const forceSyncBtn = document.getElementById('btnForceSync');
  const mobileSheetToggle = document.getElementById('nxMobileSheetToggle');

  const colBodies = [
    null,
    document.getElementById('colBody1'),
    document.getElementById('colBody2'),
    document.getElementById('colBody3'),
    document.getElementById('colBody4'),
    document.getElementById('colBody5')
  ];
  const colCounts = [
    null,
    document.getElementById('colCount1'),
    document.getElementById('colCount2'),
    document.getElementById('colCount3'),
    document.getElementById('colCount4'),
    document.getElementById('colCount5')
  ];

  // State
  let rawData = null;
  let nodes = [];
  let edges = [];
  let nodeById = new Map();
  let adjMap = new Map();
  let outEdgesBySource = new Map();
  let inEdgesByTarget = new Map();
  let parentByChild = new Map();
  let childrenByParent = new Map();

  let activeMode = 'flow'; // 'flow' | 'graph' | 'matrix'
  let activeTrack = 'all'; // 'all' | 'infra' | 'h2dev' | 'huan' | 'dgmd'
  let searchQuery = '';
  let selectedNode = null;
  let hoveredNode = null;
  let lastSyncVersion = 0;

  let flowRootNode = null;   // Selected Col 1 (project or track)
  let flowCol2Node = null;   // Selected Col 2 (domain or module)
  let flowCol3Node = null;   // Selected Col 3 (directory or niche)

  // Canvas Camera transform
  let camX = 0;
  let camY = 0;
  let camScale = 0.55;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // ALL structural tree relations emitted by build_knowledge_vault_graph.js
  const TREE_RELATIONS = new Set([
    'HAS_PROJECT',
    'HOSTS_TRACK',
    'HAS_DOMAIN',
    'CONTAINS_DIR',
    'CONTAINS_FILE',
    'HAS_MODULE',
    'HAS_VIDEO',
    'HAS_POLICY',
    'HAS_CHECKLIST',
    'HAS_SOP',
    'HAS_NICHE'
  ]);

  function getProjectId(n) {
    if (!n) return '';
    return n.projectId || (n.meta && n.meta.projectId) || (n.type === 'project' ? n.id : '');
  }

  function buildIndices(data) {
    rawData = data;
    nodes = data.nodes || [];
    edges = data.edges || [];
    nodeById = new Map(nodes.map(n => [n.id, n]));
    adjMap = new Map(nodes.map(n => [n.id, new Set()]));
    outEdgesBySource = new Map(nodes.map(n => [n.id, []]));
    inEdgesByTarget = new Map(nodes.map(n => [n.id, []]));
    parentByChild = new Map();
    childrenByParent = new Map(nodes.map(n => [n.id, []]));

    // 1. Primary source of truth: explicit n.parentId from builder
    for (const n of nodes) {
      if (n.parentId && nodeById.has(n.parentId)) {
        parentByChild.set(n.id, n.parentId);
        childrenByParent.get(n.parentId)?.push(n.id);
      }
    }

    // 2. Edge indexing & fallback parent resolution
    for (const e of edges) {
      adjMap.get(e.source)?.add(e.target);
      adjMap.get(e.target)?.add(e.source);
      outEdgesBySource.get(e.source)?.push(e);
      inEdgesByTarget.get(e.target)?.push(e);

      if (TREE_RELATIONS.has(e.relation) && !parentByChild.has(e.target)) {
        parentByChild.set(e.target, e.source);
        childrenByParent.get(e.source)?.push(e.target);
      }
    }
  }

  function getLineageChain(node) {
    if (!node) return [];
    const chain = [];
    const visited = new Set();
    let cur = node;
    while (cur && !visited.has(cur.id)) {
      visited.add(cur.id);
      chain.unshift(cur);
      const pid = parentByChild.get(cur.id);
      cur = pid ? nodeById.get(pid) : null;
    }
    return chain;
  }

  function isDescendantOf(childId, ancestorId) {
    if (!childId || !ancestorId) return false;
    if (childId === ancestorId) return true;
    const visited = new Set();
    let curId = parentByChild.get(childId);
    while (curId && !visited.has(curId)) {
      if (curId === ancestorId) return true;
      visited.add(curId);
      curId = parentByChild.get(curId);
    }
    return false;
  }

  function matchesTrackFilter(n) {
    if (!n) return false;
    if (activeTrack === 'all') return true;
    if (activeTrack === 'infra') {
      return n.layer === 'infra' || ['workspace', 'project', 'domain', 'directory', 'file'].includes(n.type);
    }
    if (activeTrack === 'policy') {
      return ['policy', 'checklist', 'sop'].includes(n.type) || n.id === 'project:h2dev-project';
    }
    const trs = String(n.track || '').split(',');
    return trs.includes(activeTrack) || trs.includes('all');
  }

  function matchesSearch(n) {
    if (!searchQuery) return true;
    const pid = getProjectId(n);
    const hay = `${n.id} ${n.label} ${n.sku || ''} ${n.path || ''} ${pid}`.toLowerCase();
    return hay.includes(searchQuery);
  }

  function isNodeVisible(n) {
    return matchesTrackFilter(n) && matchesSearch(n);
  }

  // ============================================================================
  // LINEAGE BREADCRUMB BAR
  // ============================================================================
  function renderLineageBreadcrumb(node) {
    if (!lineageBarEl) return;
    const chain = getLineageChain(node);
    if (!chain.length) {
      lineageBarEl.innerHTML = `
        <span style="color:#cbd5e1;font-weight:600;">Chuỗi Logic Gốc → Đỉnh:</span>
        <button type="button" class="nx-crumb is-current js-jump-node" data-node-id="workspace:d-ytb" title="D:\\YTB Master Workspace">🌐 D:\\YTB Master Workspace</button>
      `;
      return;
    }

    const html = [
      `<span style="color:#cbd5e1;font-weight:600;">Chuỗi Logic Gốc → Đỉnh:</span>`
    ];
    chain.forEach((item, idx) => {
      const isLast = idx === chain.length - 1;
      const badgeColor = COLORS[item.type] || '#38bdf8';
      html.push(`
        <button type="button" class="nx-crumb ${isLast ? 'is-current' : ''} js-jump-node" data-node-id="${esc(item.id)}" title="${esc(item.label)} (${esc(item.path || item.id)})">
          <span style="width:8px;height:8px;border-radius:999px;background:${badgeColor};display:inline-block;flex-shrink:0;"></span>
          <span>${esc(item.label)}</span>
        </button>
      `);
      if (!isLast) {
        html.push(`<span class="nx-crumb-sep">→</span>`);
      }
    });
    lineageBarEl.innerHTML = html.join('');
  }

  // ============================================================================
  // MODE 1: 5-COLUMN INTERACTIVE LOGIC FLOWCHART
  // ============================================================================
  function syncFlowSelectionFromNode(node) {
    if (!node) return;
    const chain = getLineageChain(node);
    for (const item of chain) {
      if (item.type === 'project' || item.type === 'track') flowRootNode = item;
      else if (item.type === 'domain' || item.type === 'module' || item.type === 'policy') flowCol2Node = item;
      else if (item.type === 'directory' || item.type === 'niche' || item.type === 'checklist') flowCol3Node = item;
    }
    if (node.type === 'workspace') {
      flowRootNode = nodeById.get('project:h2dev-project') || null;
      flowCol2Node = null;
      flowCol3Node = null;
    } else if (node.type === 'project' || node.type === 'track') {
      flowRootNode = node;
      flowCol2Node = null;
      flowCol3Node = null;
    } else if (node.type === 'domain' || node.type === 'module' || node.type === 'policy') {
      flowCol2Node = node;
      flowCol3Node = null;
    } else if (node.type === 'directory' || node.type === 'niche' || node.type === 'checklist') {
      flowCol3Node = node;
    }
  }

  function renderCardHtml(n, lineageIds, extraSubtitle) {
    const isSel = selectedNode && selectedNode.id === n.id;
    const isInLineage = lineageIds.has(n.id) && !isSel;
    const color = COLORS[n.type] || '#38bdf8';
    const typeLabel = TYPE_LABELS[n.type] || n.type;
    const sub = extraSubtitle || n.path || n.sku || '';
    return `
      <button type="button" class="nx-flow-card ${isSel ? 'is-selected' : ''} ${isInLineage ? 'is-in-lineage' : ''} js-flow-card" data-node-id="${esc(n.id)}" title="${esc(n.label)} — ${esc(sub)}">
        <div class="nx-card-top">
          <span class="nx-card-badge" style="background:${color}22;color:${color};border:1px solid ${color}55;">${esc(typeLabel)}</span>
          <span class="num-tab" style="font-size:var(--fs-xs);color:#cbd5e1;font-weight:500;">deg:${n.degree || 0}</span>
        </div>
        <div class="nx-card-title">${esc(n.label)}</div>
        ${sub ? `<div class="nx-card-sub">${esc(sub)}</div>` : ''}
      </button>
    `;
  }

  function renderEmptyBox(title, desc, showReset) {
    return `
      <div style="padding:16px 12px;border:1px dashed rgba(148,163,184,0.28);border-radius:8px;text-align:center;color:#cbd5e1;">
        <div style="font-size:var(--fs-sm);font-weight:600;color:#f8fafc;margin-bottom:4px;">${esc(title)}</div>
        <div style="font-size:var(--fs-xs);color:#cbd5e1;margin-bottom:${showReset ? '10px' : '0'};">${esc(desc)}</div>
        ${showReset ? `<button type="button" class="nx-btn js-reset-filter" style="margin:0 auto;">Xóa bộ lọc tìm kiếm</button>` : ''}
      </div>
    `;
  }

  function renderFlowchart() {
    if (!rawData || !colBodies[1]) return;

    if (!selectedNode && !searchQuery) {
      const defaultProj = nodeById.get('project:h2dev-project') || nodes.find(n => n.type === 'project');
      if (defaultProj) {
        selectedNode = defaultProj;
        flowRootNode = defaultProj;
      }
    } else if (searchQuery && selectedNode && !isNodeVisible(selectedNode)) {
      selectedNode = nodes.find(n => isNodeVisible(n)) || null;
      renderInspector(selectedNode);
    }

    const activeChain = getLineageChain(selectedNode);
    const lineageIds = new Set(activeChain.map(x => x.id));

    // Column 1: All Projects (17) + Video Tracks (3) matching filter (plus ancestors of selectedNode)
    const col1Items = nodes.filter(n =>
      (n.type === 'project' || n.type === 'track') && matchesTrackFilter(n) && (matchesSearch(n) || (!searchQuery && lineageIds.has(n.id)))
    ).sort((a, b) => {
      if (lineageIds.has(a.id) && !lineageIds.has(b.id)) return -1;
      if (!lineageIds.has(a.id) && lineageIds.has(b.id)) return 1;
      if (a.id === 'project:h2dev-project') return -1;
      if (b.id === 'project:h2dev-project') return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    if (!flowRootNode && col1Items.length) {
      flowRootNode = col1Items[0];
    }

    // Column 2: Domains, Modules & Policies belonging to flowRootNode (or matching search / lineage)
    const col2Items = nodes.filter(n => {
      if (n.type !== 'domain' && n.type !== 'module' && n.type !== 'policy') return false;
      if (!matchesTrackFilter(n)) return false;
      if (!searchQuery && lineageIds.has(n.id)) return true;
      if (!matchesSearch(n)) return false;
      if (searchQuery) return true;
      if (!flowRootNode) return true;
      if (flowRootNode.type === 'project') {
        return getProjectId(n) === flowRootNode.id || isDescendantOf(n.id, flowRootNode.id);
      }
      if (flowRootNode.type === 'track') {
        return isDescendantOf(n.id, flowRootNode.id) || n.track === flowRootNode.track || n.type === 'policy';
      }
      return true;
    }).sort((a, b) => {
      if (lineageIds.has(a.id) && !lineageIds.has(b.id)) return -1;
      if (!lineageIds.has(a.id) && lineageIds.has(b.id)) return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    // Column 3: Directories, Niches & Checklists belonging to flowCol2Node / flowRootNode (or in lineage)
    const col3Items = nodes.filter(n => {
      if (n.type !== 'directory' && n.type !== 'niche' && n.type !== 'checklist') return false;
      if (!matchesTrackFilter(n)) return false;
      if (!searchQuery && lineageIds.has(n.id)) return true;
      if (!matchesSearch(n)) return false;
      if (searchQuery) return true;
      if (flowCol2Node) {
        if (flowCol2Node.type === 'domain' || flowCol2Node.type === 'policy') {
          return isDescendantOf(n.id, flowCol2Node.id) || (adjMap.get(flowCol2Node.id) || new Set()).has(n.id);
        }
        if (flowCol2Node.type === 'module') {
          const modChildren = new Set(childrenByParent.get(flowCol2Node.id) || []);
          const nNeighbors = adjMap.get(n.id) || new Set();
          for (const vId of modChildren) {
            if (nNeighbors.has(vId)) return true;
          }
          return false;
        }
      }
      if (flowRootNode) {
        if (flowRootNode.type === 'project') return getProjectId(n) === flowRootNode.id || isDescendantOf(n.id, flowRootNode.id);
        if (flowRootNode.type === 'track') return String(n.track || '').includes(flowRootNode.track) || n.type === 'checklist';
      }
      return true;
    }).sort((a, b) => {
      if (lineageIds.has(a.id) && !lineageIds.has(b.id)) return -1;
      if (!lineageIds.has(a.id) && lineageIds.has(b.id)) return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    // Column 4: Core Files, Video SKUs & SOP Documents
    const col4Items = nodes.filter(n => {
      if (n.type !== 'file' && n.type !== 'video' && n.type !== 'sop') return false;
      if (!matchesTrackFilter(n)) return false;
      if (!searchQuery && lineageIds.has(n.id)) return true;
      if (!matchesSearch(n)) return false;
      if (searchQuery) return true;
      if (flowCol3Node) {
        if (flowCol3Node.type === 'directory') {
          return isDescendantOf(n.id, flowCol3Node.id);
        }
        if (flowCol3Node.type === 'niche' || flowCol3Node.type === 'checklist') {
          return (adjMap.get(flowCol3Node.id) || new Set()).has(n.id);
        }
      }
      if (flowCol2Node) {
        return isDescendantOf(n.id, flowCol2Node.id) || (adjMap.get(flowCol2Node.id) || new Set()).has(n.id);
      }
      if (flowRootNode) {
        if (flowRootNode.type === 'project') return getProjectId(n) === flowRootNode.id || isDescendantOf(n.id, flowRootNode.id);
        if (flowRootNode.type === 'track') return n.track === flowRootNode.track;
      }
      return true;
    }).sort((a, b) => {
      if (lineageIds.has(a.id) && !lineageIds.has(b.id)) return -1;
      if (!lineageIds.has(a.id) && lineageIds.has(b.id)) return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    // Column 5: Outbound Dependencies & Inbound Impact Callers of selectedNode
    const col5Cards = [];
    if (selectedNode && (!searchQuery || isNodeVisible(selectedNode))) {
      const outs = outEdgesBySource.get(selectedNode.id) || [];
      const ins = inEdgesByTarget.get(selectedNode.id) || [];
      for (const e of outs) {
        const tgt = nodeById.get(e.target);
        if (tgt && (!searchQuery || matchesSearch(tgt))) {
          col5Cards.push({
            node: tgt,
            subtitle: `OUTBOUND [${e.relation}] → ${tgt.path || tgt.id}`
          });
        }
      }
      for (const e of ins) {
        const src = nodeById.get(e.source);
        if (src && (!searchQuery || matchesSearch(src))) {
          col5Cards.push({
            node: src,
            subtitle: `INBOUND [${e.relation}] ← ${src.path || src.id}`
          });
        }
      }
    }

    colCounts[1].textContent = String(col1Items.length);
    colBodies[1].innerHTML = col1Items.map(n => renderCardHtml(n, lineageIds)).join('') ||
      renderEmptyBox('Không có Dự án / Track', 'Không tìm thấy mục nào khớp từ khóa.', Boolean(searchQuery));

    colCounts[2].textContent = String(col2Items.length);
    colBodies[2].innerHTML = col2Items.map(n => renderCardHtml(n, lineageIds)).join('') ||
      renderEmptyBox('Chưa có Nhánh Data / Module', 'Chọn một Dự án hoặc Track ở Cấp 1 để mở nhánh.', Boolean(searchQuery));

    colCounts[3].textContent = String(col3Items.length);
    colBodies[3].innerHTML = col3Items.slice(0, 150).map(n => renderCardHtml(n, lineageIds)).join('') ||
      renderEmptyBox('Không có Thư mục con', 'Các file của nhánh này nằm trực tiếp ở Cấp 4.', false);

    colCounts[4].textContent = String(col4Items.length);
    colBodies[4].innerHTML = col4Items.slice(0, 180).map(n => renderCardHtml(n, lineageIds)).join('') ||
      renderEmptyBox('Không có File / Video SKU', 'Không có phần tử thực thi khớp bộ lọc.', Boolean(searchQuery));

    colCounts[5].textContent = String(col5Cards.length);
    colBodies[5].innerHTML = col5Cards.slice(0, 150).map(item =>
      renderCardHtml(item.node, lineageIds, item.subtitle)
    ).join('') || renderEmptyBox(
      searchQuery ? 'Không có liên kết khớp từ khóa' : 'Chưa có liên kết phụ thuộc',
      searchQuery ? 'Không có mạch đọc/ghi nào khớp với bộ lọc tìm kiếm.' : 'Chọn một nút bất kỳ để xem mạch đọc/ghi & phạm vi ảnh hưởng.',
      Boolean(searchQuery)
    );
  }

  // ============================================================================
  // MODE 2: OBSIDIAN NETWORK GRAPH CANVAS (EGO-CONSTELLATION + GALAXY CLUSTERS)
  // ============================================================================
  let graphScope = 'ego'; // 'ego' (Mạch Tâm Điểm Rõ Nét) | 'galaxy' (Toàn Cảnh 2.983 Nút)
  let egoPositions = new Map();
  let egoVisibleSet = new Set();

  function layoutGraph(allNodes) {
    // Multi-Cluster Golden-Angle Phyllotaxis Galaxy Layout
    const ws = allNodes.filter(n => n.type === 'workspace');
    ws.forEach(n => { n.gx = 0; n.gy = 0; n.x = 0; n.y = 0; });

    const hubs = allNodes.filter(n => n.type === 'project' || n.type === 'track');
    const hubCenters = new Map();
    const hubLen = Math.max(1, hubs.length);
    hubs.forEach((h, idx) => {
      const ang = (idx / hubLen) * Math.PI * 2 - Math.PI / 2;
      const rad = h.id === 'project:h2dev-project' ? 210 : (h.type === 'track' ? 340 : 540);
      const cx = Math.cos(ang) * rad;
      const cy = Math.sin(ang) * rad;
      h.gx = cx;
      h.gy = cy;
      h.x = cx;
      h.y = cy;
      hubCenters.set(h.id, { x: cx, y: cy, list: [] });
    });

    const fallbackHub = { x: 0, y: 0, list: [] };
    for (const n of allNodes) {
      if (n.type === 'workspace' || n.type === 'project' || n.type === 'track') continue;
      let clusterId = '';
      if (n.track && ['h2dev', 'huan', 'dgmd'].includes(n.track) && hubCenters.has(`track:${n.track}`)) {
        clusterId = `track:${n.track}`;
      } else {
        const pid = getProjectId(n);
        if (pid && hubCenters.has(pid)) clusterId = pid;
        else if (n.parentId && hubCenters.has(n.parentId)) clusterId = n.parentId;
        else clusterId = 'project:h2dev-project';
      }
      const bucket = hubCenters.get(clusterId) || fallbackHub;
      bucket.list.push(n);
    }

    const GOLDEN_ANGLE = 2.399963229728653;
    for (const [, bucket] of hubCenters.entries()) {
      // Sort so modules/domains/policies are closer to hub center, leaf files/videos/channels further out
      bucket.list.sort((a, b) => (a.level || 3) - (b.level || 3));
      bucket.list.forEach((n, idx) => {
        const r = 28 + 13.5 * Math.sqrt(idx + 1);
        const theta = (idx + 1) * GOLDEN_ANGLE;
        n.gx = bucket.x + Math.cos(theta) * r;
        n.gy = bucket.y + Math.sin(theta) * r;
        n.x = n.gx;
        n.y = n.gy;
      });
    }
  }

  function computeEgoLayout(centerNode) {
    egoPositions.clear();
    egoVisibleSet.clear();
    if (!centerNode) return;

    egoPositions.set(centerNode.id, { x: 0, y: 0, ring: 0 });
    egoVisibleSet.add(centerNode.id);

    // 1. Ancestor Lineage Chain placed along top arc with wide horizontal separation
    const chain = getLineageChain(centerNode).filter(x => x.id !== centerNode.id);
    chain.forEach((anc, idx) => {
      const span = Math.min(Math.PI * 0.76, Math.max(0.96, (chain.length - 1) * 0.96));
      const startAng = -Math.PI / 2 - span / 2;
      const ang = chain.length === 1 ? -Math.PI / 2 : startAng + (idx / (chain.length - 1)) * span;
      const rad = 175;
      egoPositions.set(anc.id, { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, ring: 1 });
      egoVisibleSet.add(anc.id);
    });

    // 2. Direct Neighbors (Inbound + Outbound), sorted by importance (degree)
    const nbIds = [...(adjMap.get(centerNode.id) || [])].filter(id => !egoVisibleSet.has(id));
    const nbNodes = nbIds.map(id => nodeById.get(id)).filter(n => n && matchesTrackFilter(n));
    nbNodes.sort((a, b) => (b.degree || 0) - (a.degree || 0));

    const maxEgoNeighbors = 36;
    const chosen = nbNodes.slice(0, maxEgoNeighbors);
    const ring1 = chosen.slice(0, 10);
    const ring2 = chosen.slice(10, 36);

    ring1.forEach((n, idx) => {
      // Spread around side/bottom arc (avoiding top lineage arc if chain exists)
      const startAng = chain.length ? -Math.PI * 0.14 : -Math.PI / 2;
      const totalSpan = chain.length ? Math.PI * 1.28 : Math.PI * 2;
      const ang = startAng + (ring1.length === 1 ? totalSpan / 2 : (idx / (ring1.length - 1)) * totalSpan);
      egoPositions.set(n.id, { x: Math.cos(ang) * 175, y: Math.sin(ang) * 175, ring: 1 });
      egoVisibleSet.add(n.id);
    });

    ring2.forEach((n, idx) => {
      const ang = ((idx + 0.5) / Math.max(1, ring2.length)) * Math.PI * 2;
      egoPositions.set(n.id, { x: Math.cos(ang) * 305, y: Math.sin(ang) * 305, ring: 2 });
      egoVisibleSet.add(n.id);
    });
  }

  function applyActiveGraphPositions() {
    if (graphScope === 'ego') {
      const focus = selectedNode || nodeById.get('project:h2dev-project') || nodes[0];
      computeEgoLayout(focus);
      for (const n of nodes) {
        const pos = egoPositions.get(n.id);
        if (pos) {
          n.x = pos.x;
          n.y = pos.y;
        }
      }
    } else {
      for (const n of nodes) {
        n.x = n.gx || 0;
        n.y = n.gy || 0;
      }
    }
  }

  function fitCameraToGraph() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    applyActiveGraphPositions();
    const isMob = window.innerWidth <= 900;
    const topPad = isMob ? 52 : 60;
    const bottomPad = isMob ? 98 : 64;
    const usableW = Math.max(160, rect.width - 36);
    const usableH = Math.max(160, rect.height - topPad - bottomPad);

    if (graphScope === 'ego') {
      let maxR = 210;
      for (const pos of egoPositions.values()) {
        const d = Math.hypot(pos.x, pos.y);
        if (d > maxR) maxR = d;
      }
      const worldSpan = (maxR + 75) * 2;
      camScale = Math.min(1.25, Math.max(0.38, Math.min(usableW / worldSpan, usableH / worldSpan)));
      camX = rect.width / 2;
      camY = topPad + usableH / 2;
    } else {
      const worldSpan = 1360;
      camScale = Math.min(0.85, Math.max(0.22, Math.min(usableW / worldSpan, usableH / worldSpan)));
      camX = rect.width / 2;
      camY = topPad + usableH / 2;
    }
  }

  function resizeCanvas(shouldFit = false) {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (shouldFit || (camX === 0 && camY === 0)) {
      fitCameraToGraph();
    }
    drawCanvas();
  }

  function drawCanvas() {
    if (!rawData || !canvas || !ctx || activeMode !== 'graph') return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // 100% Zero-Smear Physical Buffer Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    applyActiveGraphPositions();

    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(camScale, camScale);

    const focusNode = selectedNode || hoveredNode || nodeById.get('project:h2dev-project');

    if (graphScope === 'ego') {
      // Draw subtle radar guide rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1 / Math.max(0.4, camScale);
      [175, 305].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw curved edges for ego network
      for (const e of edges) {
        if (!egoVisibleSet.has(e.source) || !egoVisibleSet.has(e.target)) continue;
        const s = nodeById.get(e.source);
        const t = nodeById.get(e.target);
        if (!s || !t) continue;
        const touchesCenter = focusNode && (e.source === focusNode.id || e.target === focusNode.id);
        ctx.strokeStyle = touchesCenter ? 'rgba(56, 189, 248, 0.72)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = (touchesCenter ? 1.8 : 1) / Math.max(0.45, camScale);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        const mx = (s.x + t.x) * 0.5 - (t.y - s.y) * 0.08;
        const my = (s.y + t.y) * 0.5 + (t.x - s.x) * 0.08;
        ctx.quadraticCurveTo(mx, my, t.x, t.y);
        ctx.stroke();
      }

      const placedLabelBoxes = [];
      for (const id of egoVisibleSet) {
        const n = nodeById.get(id);
        if (!n) continue;
        const isCenter = focusNode && n.id === focusNode.id;
        const isHover = hoveredNode && n.id === hoveredNode.id;
        const baseR = isCenter ? 16 : ((RADII[n.type] || 6) + 2);
        const col = COLORS[n.type] || '#38bdf8';

        if (isCenter) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, baseR * 1.65, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, isHover ? baseR * 1.2 : baseR, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.lineWidth = (isCenter ? 2.5 : 1.5) / Math.max(0.45, camScale);
        ctx.strokeStyle = isCenter ? '#ffffff' : '#0f172a';
        ctx.stroke();

        const maxLen = window.innerWidth <= 900 ? 22 : 30;
        const shortLbl = n.label.length > maxLen ? n.label.slice(0, maxLen - 1) + '…' : n.label;
        const fontSizeWorld = Math.round((isCenter ? 13 : 11) / Math.max(0.48, camScale));
        const labelAbove = !isCenter && n.y < -60;
        let labelWorldY = labelAbove ? (n.y - baseR - 6) : (n.y + baseR + fontSizeWorld + 2);
        const sx = n.x * camScale + camX;
        let sy = labelWorldY * camScale + camY;
        const boxW = shortLbl.length * 5.6;
        const boxH = 16;

        if (!isCenter && !isHover) {
          for (const b of placedLabelBoxes) {
            if (Math.abs(sx - b.x) < (boxW + b.w) * 0.45 && Math.abs(sy - b.y) < (boxH + b.h) * 0.7) {
              labelWorldY += (labelAbove ? -1 : 1) * (fontSizeWorld + 5);
              sy = labelWorldY * camScale + camY;
            }
          }
        }
        placedLabelBoxes.push({ x: sx, y: sy, w: boxW, h: boxH });
        ctx.font = `${isCenter ? '600' : '500'} ${fontSizeWorld}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isCenter ? '#ffffff' : '#e2e8f0';
        ctx.fillText(shortLbl, n.x, labelWorldY);
      }
      ctx.textAlign = 'start';
      ctx.restore();
      return;
    }

    // Galaxy Mode (Full 2,983 Nodes Clustered Constellation)
    const visSet = new Set();
    for (const n of nodes) {
      if (matchesTrackFilter(n)) visSet.add(n.id);
    }

    const egoSet = focusNode ? (adjMap.get(focusNode.id) || new Set()) : null;
    const lineageSet = focusNode ? new Set(getLineageChain(focusNode).map(x => x.id)) : null;

    ctx.lineWidth = 1 / Math.max(0.4, camScale);
    for (const e of edges) {
      if (!visSet.has(e.source) || !visSet.has(e.target)) continue;
      const s = nodeById.get(e.source);
      const t = nodeById.get(e.target);
      if (!s || !t) continue;

      const isEgoEdge = focusNode && (e.source === focusNode.id || e.target === focusNode.id || (lineageSet && lineageSet.has(e.source) && lineageSet.has(e.target)));
      if (focusNode && !isEgoEdge) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.03)';
      } else if (isEgoEdge) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      }
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    const placedLabelBoxes = [];
    for (const n of nodes) {
      if (!visSet.has(n.id)) continue;
      const isFocus = focusNode && n.id === focusNode.id;
      const isNeighbor = (egoSet && egoSet.has(n.id)) || (lineageSet && lineageSet.has(n.id));
      const dimmed = focusNode && !isFocus && !isNeighbor;

      const r = (RADII[n.type] || 5) + Math.min(6, Math.sqrt(n.degree || 0) * 0.4);
      ctx.beginPath();
      ctx.arc(n.x, n.y, isFocus ? r * 1.4 : r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.type] || '#38bdf8';
      ctx.globalAlpha = dimmed ? 0.18 : 0.95;
      ctx.fill();

      if (isFocus || isNeighbor) {
        ctx.lineWidth = 2 / Math.max(0.5, camScale);
        ctx.strokeStyle = isFocus ? '#ffffff' : '#38bdf8';
        ctx.stroke();
      }

      const wantLabel = isFocus || isNeighbor || (n.type === 'workspace' || n.type === 'project' || n.type === 'track');
      if (wantLabel) {
        const shortLbl = n.label.length > 26 ? n.label.slice(0, 25) + '…' : n.label;
        const sx = n.x * camScale + camX + (r + 5) * camScale;
        const sy = n.y * camScale + camY;
        const boxW = shortLbl.length * 6.5;
        const boxH = 18;

        let collides = false;
        if (!isFocus) {
          for (const b of placedLabelBoxes) {
            if (Math.abs(sx - b.x) < (boxW + b.w) * 0.52 && Math.abs(sy - b.y) < (boxH + b.h) * 0.65) {
              collides = true;
              break;
            }
          }
        }
        if (!collides) {
          placedLabelBoxes.push({ x: sx, y: sy, w: boxW, h: boxH });
          const fontSizeWorld = Math.round((isFocus ? 13 : 11) / Math.max(0.45, camScale));
          ctx.font = `${isFocus ? '600' : '500'} ${fontSizeWorld}px Inter, sans-serif`;
          ctx.fillStyle = isFocus ? '#ffffff' : '#e2e8f0';
          ctx.globalAlpha = 0.96;
          ctx.fillText(shortLbl, n.x + r + 5, n.y + 3);
        }
      }
    }

    ctx.restore();
  }

  // ============================================================================
  // MODE 3: MULTI-PROJECT AUDIT MATRIX (17 PROJECTS — REAL PER-PROJECT COUNTS)
  // ============================================================================
  function renderMatrixView() {
    if (!rawData || !matrixContentEl) return;
    const projects = nodes.filter(n => n.type === 'project' && matchesSearch(n)).sort((a, b) => {
      if (a.id === 'project:h2dev-project') return -1;
      if (b.id === 'project:h2dev-project') return 1;
      return (b.degree || 0) - (a.degree || 0);
    });

    const cardsHtml = projects.map(p => {
      const meta = p.meta || {};
      const pDomains = nodes.filter(n => n.type === 'domain' && getProjectId(n) === p.id).length;
      const pDirs = nodes.filter(n => n.type === 'directory' && getProjectId(n) === p.id).length;
      const pFiles = nodes.filter(n => n.type === 'file' && getProjectId(n) === p.id).length;
      return `
        <div style="background:rgba(15,23,42,0.92);border:1px solid rgba(148,163,184,0.2);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;justify-content:space-between;">
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-size:var(--fs-xs);font-weight:600;padding:2px 8px;border-radius:6px;background:rgba(249,115,22,0.18);color:#fb923c;border:1px solid rgba(249,115,22,0.4);text-transform:uppercase;">${esc(meta.category || 'project')}</span>
              <span style="font-size:var(--fs-xs);color:#34d399;font-weight:600;">● ĐÃ ĐỒNG BỘ</span>
            </div>
            <h3 style="font-size:var(--fs-md);font-weight:600;color:#ffffff;margin:0;line-height:1.35;">${esc(p.label)}</h3>
            <div style="font-size:var(--fs-xs);font-family:monospace;color:#38bdf8;word-break:break-all;">Root: D:\\YTB\\${esc(p.path === '.' ? '' : p.path)}</div>
            <div class="num-tab" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px;">
              <div style="background:rgba(30,41,59,0.75);padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:var(--fs-lg);font-weight:600;color:#facc15;">${pDomains}</div>
                <div style="font-size:var(--fs-xs);color:#cbd5e1;">Nhánh Data</div>
              </div>
              <div style="background:rgba(30,41,59,0.75);padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:var(--fs-lg);font-weight:600;color:#2dd4bf;">${pDirs}</div>
                <div style="font-size:var(--fs-xs);color:#cbd5e1;">Thư mục</div>
              </div>
              <div style="background:rgba(30,41,59,0.75);padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:var(--fs-lg);font-weight:600;color:#60a5fa;">${pFiles}</div>
                <div style="font-size:var(--fs-xs);color:#cbd5e1;">File lõi</div>
              </div>
            </div>
          </div>
          <button type="button" class="nx-btn js-open-project-flow" data-node-id="${esc(p.id)}" style="margin-top:8px;justify-content:center;background:rgba(2,132,199,0.24);border-color:#38bdf8;color:#ffffff;width:100%;">
            🔍 Mở Sơ Đồ Nhánh Logic Của Dự Án
          </button>
        </div>
      `;
    }).join('');

    matrixContentEl.innerHTML = `
      <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:var(--fs-lg);font-weight:600;color:#ffffff;margin:0;">Bảng Kiểm Toán Tự Động Toàn Bộ ${projects.length} Dự Án Trong D:\\YTB</h2>
          <p style="font-size:var(--fs-xs);color:#cbd5e1;margin:4px 0 0 0;">Số liệu thực tế từng dự án được bóc tách tự động từ cơ sở dữ liệu đồ thị (Zero-Touch Real-Time Auto-Sync).</p>
        </div>
      </div>
      ${projects.length ? `<div class="nx-matrix-grid">${cardsHtml}</div>` : renderEmptyBox('Không tìm thấy dự án khớp từ khóa', 'Hãy xóa từ khóa tìm kiếm để xem toàn bộ 17 dự án.', true)}
    `;
  }

  // ============================================================================
  // RIGHT INSPECTOR SIDEBAR (DETAILS + LINEAGE + CLI TRACE)
  // ============================================================================
  function renderInspector(node) {
    if (!inspectorEl) return;
    if (!node || (searchQuery && !isNodeVisible(node))) {
      renderLineageBreadcrumb(null);
      inspectorEl.innerHTML = renderEmptyBox(
        searchQuery ? 'Không tìm thấy thực thể khớp bộ lọc' : 'Chưa chọn nút nào',
        searchQuery ? `Không có nút nào khớp với từ khóa "${searchQuery}". Hãy xóa bộ lọc tìm kiếm để khôi phục sơ đồ.` : 'Chọn một nút trên sơ đồ để xem chi tiết phả hệ và phụ thuộc.',
        Boolean(searchQuery)
      );
      const sheetTitleEl = document.getElementById('nxMobileSheetTitle');
      if (sheetTitleEl) {
        sheetTitleEl.textContent = '▲ Chi Tiết: Trống';
      }
      return;
    }
    renderLineageBreadcrumb(node);

    const outs = outEdgesBySource.get(node.id) || [];
    const ins = inEdgesByTarget.get(node.id) || [];
    const chain = getLineageChain(node);

    const webTargetUrl = node.meta?.playerUrl || node.meta?.targetUrl || (node.type === 'video' && node.sku ? `/player.html?sku=${encodeURIComponent(node.sku)}` : '');
    const rawTargetUrl = node.meta?.rawUrl || '';
    const sodoUrl = `/sodo?snode=${encodeURIComponent(node.id)}`;
    const playerBtn = `
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
        ${webTargetUrl ? `<a href="${esc(webTargetUrl)}" class="nx-chip" style="background:#0284c7;border-color:#38bdf8;color:#ffffff;font-weight:600;">↗ Mở Trên Web 97yo-dev</a>` : ''}
        ${rawTargetUrl ? `<a href="${esc(rawTargetUrl)}" class="nx-chip" style="background:rgba(16,185,129,0.22);border-color:#10b981;color:#34d399;font-weight:600;">📊 Hồ Sơ Raw Kênh</a>` : ''}
        <a href="${esc(sodoUrl)}" class="nx-chip" style="background:rgba(168,85,247,0.22);border-color:#a855f7;color:#e9d5ff;font-weight:600;">🧭 Xem ở Tab Sơ đồ DB</a>
        <button type="button" class="nx-chip js-copy-deeplink" data-node-id="${esc(node.id)}" style="background:rgba(30,41,59,0.9);border-color:rgba(148,163,184,0.35);color:#cbd5e1;">🔗 Copy Deep-Link</button>
      </div>
    `;

    const cliCmd = `node scripts/kg_query.js trace "${node.label.replace(/"/g, '')}"`;

    inspectorEl.innerHTML = `
      <div style="border-bottom:1px solid rgba(148,163,184,0.2);padding-bottom:12px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="background:${COLORS[node.type] || '#38bdf8'};color:#06080f;font-size:var(--fs-xs);font-weight:600;padding:2px 8px;border-radius:6px;text-transform:uppercase;">${esc(TYPE_LABELS[node.type] || node.type)}</span>
          <span class="num-tab" style="font-size:var(--fs-xs);color:#38bdf8;font-family:monospace;font-weight:600;">Degree: ${node.degree || 0}</span>
        </div>
        <h2 style="font-size:var(--fs-lg);font-weight:600;color:#ffffff;margin:0 0 6px 0;line-height:1.35;">${esc(node.label)}</h2>
        <div style="font-size:var(--fs-xs);color:#cbd5e1;font-family:monospace;word-break:break-all;margin-bottom:4px;">ID: ${esc(node.id)}</div>
        <div style="font-size:var(--fs-xs);color:#38bdf8;font-family:monospace;word-break:break-all;">Path: ${esc(node.path || '—')}</div>
        ${playerBtn}
      </div>

      <div style="margin-bottom:16px;background:rgba(9,13,22,0.85);border:1px solid rgba(56,189,248,0.28);border-radius:8px;padding:12px;">
        <h3 style="font-size:var(--fs-xs);font-weight:600;color:#38bdf8;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px 0;">Chuỗi Phả Hệ Từ Gốc Tới Đỉnh (${chain.length} cấp)</h3>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${chain.map((c, idx) => `
            <div style="padding-left:${idx * 8}px;display:flex;align-items:center;gap:6px;">
              <span style="color:#94a3b8;font-size:var(--fs-xs);">${idx === 0 ? '●' : '└─'}</span>
              <button type="button" class="nx-chip js-jump-node" data-node-id="${esc(c.id)}" title="${esc(c.label)}" style="background:${c.id === node.id ? 'rgba(56,189,248,0.2)' : 'rgba(30,41,59,0.65)'};border-color:${c.id === node.id ? '#38bdf8' : 'rgba(148,163,184,0.22)'};color:${c.id === node.id ? '#ffffff' : '#e2e8f0'};font-weight:${c.id === node.id ? '600' : '500'};">
                [${esc(TYPE_LABELS[c.type] || c.type)}] ${esc(c.label)}
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="font-size:var(--fs-xs);font-weight:600;color:#cbd5e1;margin:0 0 6px 0;">Lệnh Agent / CLI Truy Vết Tức Thì (&lt;15ms):</h3>
        <code style="display:block;padding:8px 10px;background:#090d16;border:1px solid rgba(148,163,184,0.24);border-radius:6px;font-size:var(--fs-xs);color:#34d399;word-break:break-all;">${esc(cliCmd)}</code>
      </div>

      <div style="margin-bottom:16px;">
        <h3 class="num-tab" style="font-size:var(--fs-xs);font-weight:600;color:#e2e8f0;margin:0 0 8px 0;">Mạch Phụ Thuộc Đi — Outbound (${outs.length})</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${outs.length ? outs.slice(0, 60).map(e => {
            const t = nodeById.get(e.target);
            if (!t) return '';
            return `<button type="button" class="nx-chip js-jump-node" data-node-id="${esc(t.id)}" title="${esc(e.relation)}: ${esc(t.label)}"><span class="kg-dot" style="background:${COLORS[t.type] || '#38bdf8'};"></span><span style="color:#cbd5e1;">${esc(e.relation)}:</span> ${esc(t.label.slice(0, 32))}</button>`;
          }).join('') : '<span style="font-size:var(--fs-xs);color:#cbd5e1;">Không có phụ thuộc đi</span>'}
        </div>
      </div>

      <div>
        <h3 class="num-tab" style="font-size:var(--fs-xs);font-weight:600;color:#e2e8f0;margin:0 0 8px 0;">Phạm Vi Ảnh Hưởng Đến — Inbound (${ins.length})</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${ins.length ? ins.slice(0, 60).map(e => {
            const s = nodeById.get(e.source);
            if (!s) return '';
            return `<button type="button" class="nx-chip js-jump-node" data-node-id="${esc(s.id)}" title="${esc(e.relation)}: ${esc(s.label)}"><span class="kg-dot" style="background:${COLORS[s.type] || '#38bdf8'};"></span><span style="color:#cbd5e1;">${esc(e.relation)}:</span> ${esc(s.label.slice(0, 32))}</button>`;
          }).join('') : '<span style="font-size:var(--fs-xs);color:#cbd5e1;">Không có liên kết đến</span>'}
        </div>
      </div>
    `;
    const sheetTitleEl = document.getElementById('nxMobileSheetTitle');
    if (sheetTitleEl) {
      sheetTitleEl.textContent = `▲ Chi Tiết: ${node.label}`;
    }
  }

  function syncUrlState() {
    try {
      const u = new URL(location.href);
      if (selectedNode && selectedNode.id) u.searchParams.set('node', selectedNode.id);
      if (activeMode && activeMode !== 'flow') u.searchParams.set('mode', activeMode);
      else u.searchParams.delete('mode');
      if (activeTrack && activeTrack !== 'all') u.searchParams.set('track', activeTrack);
      else u.searchParams.delete('track');
      if (searchQuery) u.searchParams.set('q', searchQuery);
      else u.searchParams.delete('q');
      history.replaceState(history.state, '', u.pathname + u.search);
    } catch (_) {}
  }

  function resolveNodeByQuery(rawQ) {
    if (!rawQ) return null;
    const q = String(rawQ).trim();
    if (nodeById.has(q)) return nodeById.get(q);
    const qLower = q.toLowerCase();
    for (const prefix of ['', 'video:', 'channel:', 'niche:', 'policy:', 'checklist:', 'sop:', 'project:', 'file:', 'tool:', 'module:', 'track:']) {
      const cand = prefix + q;
      for (const [id, n] of nodeById.entries()) {
        if (id.toLowerCase() === cand.toLowerCase() || (n.sku && n.sku.toLowerCase() === qLower)) return n;
      }
    }
    return nodes.find(n => n.label.toLowerCase().includes(qLower) || (n.path && n.path.toLowerCase().includes(qLower))) || null;
  }

  function selectAndFocusNode(node, centerCanvas) {
    if (!node) return;
    selectedNode = node;
    syncFlowSelectionFromNode(node);
    renderInspector(node);
    renderFlowchart();
    syncUrlState();
    if (activeMode === 'graph' && canvas) {
      applyActiveGraphPositions();
      if (graphScope === 'ego') {
        fitCameraToGraph();
      } else if (centerCanvas) {
        const rect = canvas.getBoundingClientRect();
        camX = rect.width / 2 - (node.x || 0) * camScale;
        camY = rect.height / 2 - (node.y || 0) * camScale;
      }
      drawCanvas();
    }
  }

  function switchMode(mode) {
    activeMode = mode;
    syncUrlState();
    document.querySelectorAll('.nx-mode-btn').forEach(btn => {
      const active = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (flowViewEl) flowViewEl.style.display = mode === 'flow' ? (window.innerWidth <= 900 ? 'flex' : 'grid') : 'none';
    if (graphViewEl) graphViewEl.style.display = mode === 'graph' ? 'block' : 'none';
    if (matrixViewEl) matrixViewEl.style.display = mode === 'matrix' ? 'block' : 'none';

    if (mode === 'flow') {
      renderFlowchart();
    } else if (mode === 'graph') {
      resizeCanvas(true);
    } else if (mode === 'matrix') {
      if (matrixViewEl) matrixViewEl.scrollTop = 0;
      renderMatrixView();
    }
  }

  // ============================================================================
  // INTERACTION LISTENERS
  // ============================================================================
  document.querySelectorAll('.nx-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.getAttribute('data-mode') || 'flow');
    });
  });

  document.querySelectorAll('[data-graph-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      graphScope = btn.getAttribute('data-graph-scope') || 'ego';
      document.querySelectorAll('[data-graph-scope]').forEach(b => b.classList.toggle('is-active', b === btn));
      fitCameraToGraph();
      drawCanvas();
    });
  });

  document.getElementById('btnZoomIn')?.addEventListener('click', () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const nextScale = Math.min(3.5, camScale * 1.25);
    camX = mx - ((mx - camX) * nextScale) / camScale;
    camY = my - ((my - camY) * nextScale) / camScale;
    camScale = nextScale;
    drawCanvas();
  });

  document.getElementById('btnZoomOut')?.addEventListener('click', () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const nextScale = Math.max(0.18, camScale * 0.8);
    camX = mx - ((mx - camX) * nextScale) / camScale;
    camY = my - ((my - camY) * nextScale) / camScale;
    camScale = nextScale;
    drawCanvas();
  });

  document.getElementById('btnZoomFit')?.addEventListener('click', () => {
    fitCameraToGraph();
    drawCanvas();
  });

  document.addEventListener('click', (e) => {
    const resetBtn = e.target.closest('.js-reset-filter');
    if (resetBtn) {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (!selectedNode) {
        const defaultProj = nodeById.get('project:h2dev-project') || nodes[0];
        if (defaultProj) {
          selectAndFocusNode(defaultProj, false);
          renderMatrixView();
          return;
        }
      }
      renderInspector(selectedNode);
      renderFlowchart();
      renderMatrixView();
      drawCanvas();
      return;
    }

    const flowCard = e.target.closest('.js-flow-card');
    if (flowCard) {
      const id = flowCard.getAttribute('data-node-id');
      const target = nodeById.get(id);
      if (target) selectAndFocusNode(target, false);
      return;
    }

    const jumpBtn = e.target.closest('.js-jump-node');
    if (jumpBtn) {
      const id = jumpBtn.getAttribute('data-node-id');
      const target = nodeById.get(id);
      if (target) selectAndFocusNode(target, true);
      return;
    }

    const openProjBtn = e.target.closest('.js-open-project-flow');
    if (openProjBtn) {
      const id = openProjBtn.getAttribute('data-node-id');
      const target = nodeById.get(id);
      if (target) {
        switchMode('flow');
        selectAndFocusNode(target, false);
      }
      return;
    }

    const copyBtn = e.target.closest('.js-copy-deeplink');
    if (copyBtn) {
      const id = copyBtn.getAttribute('data-node-id') || (selectedNode && selectedNode.id) || '';
      const u = new URL('/graph', location.origin);
      if (id) u.searchParams.set('node', id);
      if (activeMode && activeMode !== 'flow') u.searchParams.set('mode', activeMode);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(u.toString()).catch(() => {});
      }
      copyBtn.textContent = '✅ Đã copy Deep-Link!';
      setTimeout(() => { copyBtn.textContent = '🔗 Copy Deep-Link'; }, 1800);
    }
  });

  if (mobileSheetToggle && inspectorSidebarEl) {
    mobileSheetToggle.addEventListener('click', () => {
      const open = inspectorSidebarEl.classList.toggle('is-open-mobile');
      if (!open) inspectorSidebarEl.scrollTop = 0;
      mobileSheetToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const stEl = document.getElementById('nxMobileSheetStatus');
      if (stEl) stEl.textContent = open ? 'Chạm thu gọn' : 'Chạm mở chi tiết';
    });
  }

  // Canvas interactions
  function screenToWorld(sx, sy) {
    return {
      x: (sx - camX) / camScale,
      y: (sy - camY) / camScale
    };
  }

  function findNodeAt(sx, sy) {
    const pt = screenToWorld(sx, sy);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (graphScope === 'ego') {
        if (!egoVisibleSet.has(n.id)) continue;
      } else if (!isNodeVisible(n)) {
        continue;
      }
      const r = (RADII[n.type] || 6) + Math.min(6, Math.sqrt(n.degree || 0) * 0.4) + 6;
      const dx = pt.x - (n.x || 0);
      const dy = pt.y - (n.y || 0);
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  if (canvas) {
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const hit = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (hit) {
        selectAndFocusNode(hit, false);
        return;
      }
      isDragging = true;
      dragStartX = e.clientX - camX;
      dragStartY = e.clientY - camY;
    });

    window.addEventListener('mousemove', (e) => {
      if (activeMode !== 'graph') return;
      if (isDragging) {
        camX = e.clientX - dragStartX;
        camY = e.clientY - dragStartY;
        drawCanvas();
        return;
      }
      if (e.target === canvas) {
        const rect = canvas.getBoundingClientRect();
        const hit = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        if (hit !== hoveredNode) {
          hoveredNode = hit;
          canvas.style.cursor = hit ? 'pointer' : 'grab';
          drawCanvas();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const nextScale = Math.min(3.5, Math.max(0.18, camScale * factor));
      camX = mx - ((mx - camX) * nextScale) / camScale;
      camY = my - ((my - camY) * nextScale) / camScale;
      camScale = nextScale;
      drawCanvas();
    }, { passive: false });

    // Mobile Touch Pan, Tap-to-Select & Pinch-to-Zoom support
    let touchMoved = false;
    let touchStartPt = { x: 0, y: 0 };
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchMoved = false;
        touchStartPt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragging = true;
        dragStartX = e.touches[0].clientX - camX;
        dragStartY = e.touches[0].clientY - camY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.hypot(dx, dy) || 1;
        pinchStartScale = camScale;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (activeMode !== 'graph') return;
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - touchStartPt.x;
        const dy = e.touches[0].clientY - touchStartPt.y;
        if (Math.hypot(dx, dy) > 6) touchMoved = true;
        camX = e.touches[0].clientX - dragStartX;
        camY = e.touches[0].clientY - dragStartY;
        drawCanvas();
      } else if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        const nextScale = Math.min(3.5, Math.max(0.18, pinchStartScale * (dist / pinchStartDist)));
        camX = mx - ((mx - camX) * nextScale) / camScale;
        camY = my - ((my - camY) * nextScale) / camScale;
        camScale = nextScale;
        drawCanvas();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      isDragging = false;
      pinchStartDist = 0;
      if (!touchMoved && e.changedTouches && e.changedTouches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const hit = findNodeAt(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
        if (hit) {
          selectAndFocusNode(hit, false);
          if (window.innerWidth <= 900 && inspectorSidebarEl) {
            inspectorSidebarEl.classList.add('is-open-mobile');
            mobileSheetToggle?.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });
  }

  document.getElementById('kgTrackFilters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-track]');
    if (!btn) return;
    activeTrack = btn.getAttribute('data-track') || 'all';
    document.querySelectorAll('#kgTrackFilters button').forEach(b => b.classList.toggle('is-active', b === btn));
    if (activeTrack === 'infra') {
      const p = nodeById.get('project:h2dev-project');
      if (p) selectAndFocusNode(p, false);
    } else if (['h2dev', 'huan', 'dgmd'].includes(activeTrack)) {
      const tr = nodeById.get(`track:${activeTrack}`);
      if (tr) selectAndFocusNode(tr, false);
    }
    renderFlowchart();
    drawCanvas();
  });

  document.getElementById('kgResetZoom')?.addEventListener('click', () => {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    const defaultProj = nodeById.get('project:h2dev-project') || nodes[0];
    if (defaultProj) selectAndFocusNode(defaultProj, false);
    fitCameraToGraph();
    drawCanvas();
  });

  searchInput?.addEventListener('input', () => {
    searchQuery = (searchInput.value || '').trim().toLowerCase();
    if (searchQuery) {
      const firstMatch = nodes.find(n => isNodeVisible(n));
      if (firstMatch) {
        selectAndFocusNode(firstMatch, true);
        renderMatrixView();
        return;
      }
      selectedNode = null;
      flowRootNode = null;
      flowCol2Node = null;
      flowCol3Node = null;
      renderInspector(null);
      syncUrlState();
    } else if (!selectedNode) {
      const defaultProj = nodeById.get('project:h2dev-project') || nodes[0];
      if (defaultProj) {
        selectAndFocusNode(defaultProj, false);
        renderMatrixView();
        return;
      }
    }
    renderFlowchart();
    renderMatrixView();
    drawCanvas();
  });

  window.addEventListener('resize', () => {
    if (activeMode === 'flow' && flowViewEl) {
      flowViewEl.style.display = window.innerWidth <= 900 ? 'flex' : 'grid';
    }
    resizeCanvas();
  });

  // ============================================================================
  // DATA LOADING & ZERO-TOUCH REAL-TIME AUTO-SYNC
  // ============================================================================
  function loadGraphData(preserveSelection) {
    return fetch('/data/knowledge_graph.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const prevSelectedId = preserveSelection && selectedNode ? selectedNode.id : null;
        buildIndices(data);
        layoutGraph(nodes);

        if (statsBadge && data.stats) {
          const st = data.stats;
          statsBadge.textContent = `Hệ thống 97yo-dev · ${st.projects || 17} Dự Án · 3 Nhánh (${st.videos || 333} Video) · ${st.policies || 12} Chính Sách · ${st.sops || 300} SOP · ${st.files || 891} File · ${st.totalNodes} Nút · ${st.totalEdges} Liên Kết`;
          const btnMat = document.getElementById('btnModeMatrix');
          if (btnMat) btnMat.textContent = `3. Ma Trận ${st.projects || 17} Dự Án`;
          const fAll = document.querySelector('#kgTrackFilters button[data-track="all"]');
          const fInf = document.querySelector('#kgTrackFilters button[data-track="infra"]');
          const fPol = document.querySelector('#kgTrackFilters button[data-track="policy"]');
          const fH2 = document.querySelector('#kgTrackFilters button[data-track="h2dev"]');
          const fHu = document.querySelector('#kgTrackFilters button[data-track="huan"]');
          const fDg = document.querySelector('#kgTrackFilters button[data-track="dgmd"]');
          if (fAll) fAll.textContent = `Toàn hệ thống 97yo-dev (${st.totalNodes})`;
          if (fInf) fInf.textContent = `Hạ tầng ${st.projects || 17} Dự án (${st.infraNodes || 0})`;
          if (fPol) fPol.textContent = `Chính sách & SOP (${(st.policies || 12) + (st.checklists || 12) + (st.sops || 300)})`;
          if (fH2) fH2.textContent = `Nhánh H2DEV (${st.videosH2dev || 148})`;
          if (fHu) fHu.textContent = `Nhánh Huân (${st.videosHuan || 140})`;
          if (fDg) fDg.textContent = `Nhánh DGMD (${st.videosDgmd || 45})`;
          const legEl = document.getElementById('kgLegend');
          if (legEl) {
            legEl.innerHTML = [
              `<span><i class="kg-dot" style="background:#f97316;"></i>Dự án (${st.projects || 17})</span>`,
              `<span><i class="kg-dot" style="background:#eab308;"></i>Nhánh Data / Module (${(st.domains || 0) + (st.modules || 35)})</span>`,
              `<span><i class="kg-dot" style="background:#f43f5e;"></i>Chính sách &amp; Checklist (${(st.policies || 12) + (st.checklists || 12)})</span>`,
              `<span><i class="kg-dot" style="background:#14b8a6;"></i>Thư mục / Ngách (${(st.directories || 0) + (st.niches || 0)})</span>`,
              `<span><i class="kg-dot" style="background:#60a5fa;"></i>File Thực Thi (${st.files || 0})</span>`,
              `<span><i class="kg-dot" style="background:#38bdf8;"></i>Video SKU (${st.videos || 333})</span>`,
              `<span><i class="kg-dot" style="background:#818cf8;"></i>Tài liệu SOP (${st.sops || 300})</span>`,
              `<span><i class="kg-dot" style="background:#a855f7;"></i>Công cụ (${st.tools || 204})</span>`,
              `<span><i class="kg-dot" style="background:#f472b6;"></i>Kênh Mẫu (${st.channels || 0})</span>`
            ].join('');
          }
        }

        const qp = new URLSearchParams(location.search);
        const urlNode = qp.get('node') || qp.get('snode') || '';
        const urlQ = qp.get('q') || '';
        const urlMode = qp.get('mode') || '';
        const urlTrack = qp.get('track') || '';

        if (!preserveSelection) {
          if (urlTrack && ['all', 'infra', 'policy', 'h2dev', 'huan', 'dgmd'].includes(urlTrack)) {
            activeTrack = urlTrack;
            document.querySelectorAll('#kgTrackFilters button').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-track') === activeTrack));
          }
          if (urlQ && searchInput) {
            searchInput.value = urlQ;
            searchQuery = urlQ.trim().toLowerCase();
          }
          if (urlMode && ['flow', 'graph', 'matrix'].includes(urlMode)) {
            switchMode(urlMode);
          }
        }

        const resolvedFromUrl = (!preserveSelection && (urlNode || urlQ)) ? resolveNodeByQuery(urlNode || urlQ) : null;
        const nextFocus = (prevSelectedId && nodeById.get(prevSelectedId)) ||
          resolvedFromUrl ||
          (searchQuery ? nodes.find(n => isNodeVisible(n)) || null : (nodeById.get('project:h2dev-project') || nodes[0]));

        if (nextFocus) {
          selectAndFocusNode(nextFocus, Boolean(resolvedFromUrl));
        } else {
          selectedNode = null;
          renderInspector(null);
          renderFlowchart();
        }
        renderMatrixView();
        resizeCanvas();
      })
      .catch(err => {
        console.error('Failed to load knowledge_graph.json', err);
      });
  }

  forceSyncBtn?.addEventListener('click', () => {
    if (syncTextEl) syncTextEl.textContent = 'ĐANG QUÉT ĐỒNG BỘ...';
    fetch('/api/kg/sync', { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res && res.syncVersion) lastSyncVersion = res.syncVersion;
        if (syncTextEl) syncTextEl.textContent = 'ĐÃ ĐỒNG BỘ TỨC THÌ';
        return loadGraphData(true);
      })
      .catch(() => {
        if (syncTextEl) syncTextEl.textContent = 'LIVE AUTO-SYNC';
        loadGraphData(true);
      });
  });

  setInterval(() => {
    fetch('/api/kg/status', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(st => {
        if (!st) return;
        if (lastSyncVersion === 0 && st.syncVersion) {
          lastSyncVersion = st.syncVersion;
          return;
        }
        if (st.syncVersion && st.syncVersion > lastSyncVersion) {
          lastSyncVersion = st.syncVersion;
          if (syncTextEl) syncTextEl.textContent = `AUTO-SYNCED (${new Date().toLocaleTimeString()})`;
          loadGraphData(true);
        }
      })
      .catch(() => {});
  }, 4500);

  loadGraphData(false);
})();
