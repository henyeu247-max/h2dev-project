'use strict';
/**
 * hot_memory_store.js — H2DEV Hot Memory Store (Netflix Hollow In-Memory Pattern)
 * Quản lý bộ nhớ đệm RAM O(1) cho các dữ liệu tra cứu tần suất cao (Catalog, SKU Set,
 * Kênh Mẫu Handle Set, Tài Liệu Index Map, Niche Radar SAI/PRI/BOI, Overview Summary,
 * và Player Bootstrap ~10-20 KB), tự động kiểm tra mtimeMs nhẹ nhàng hoặc reload tức thì.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TRACKED_REL_PATHS = [
  'data/catalog.json',
  'data/catalog_huan.json',
  'data/catalog_dgmd.json',
  'data-tabs/videos.json',
  'data-tabs/videos_huan.json',
  'data/videos_huan.json',
  'data-tabs/videos_dgmd.json',
  'data/videos_dgmd.json',
  'data/modules.json',
  'data/modules_huan.json',
  'data/modules_dgmd.json',
  'data/video_insights.json',
  'data/video_insights_huan.json',
  'data/video_insights_dgmd.json',
  'data-tabs/kenh-mau.json',
  'data-tabs/tai-lieu-full.json',
  'data-tabs/nguon-reup.json',
  'data-tabs/ngach-xanh.json',
  'data-tabs/kich-ban.json',
  'data-tabs/raw-kenh-mau.json',
  'data/overview_summary.json'
];

let _storeLoaded = false;
let _lastStatCheckMs = 0;
const STAT_CHECK_THROTTLE_MS = 1500;
const _fileMtimes = new Map(); // relPath -> `${mtimeMs}:${size}`
const _lastKnownGoodJson = new Map(); // relPath -> last valid parsed JSON
const MAX_SINGLE_INSIGHT_CACHE = 128;

// O(1) Lookup Structures
let _validSkuSet = new Set();
let _kenhHandleSet = new Set();
let _deadChannelsList = [];
let _taiLieuIndex = { list: [], byNameMap: new Map(), bySkuMap: new Map() };
let _reupBySkuMap = new Map();
let _reupList = [];
let _dgmdBySkuLower = new Map();
let _huanBySkuLower = new Map();
let _h2devBySkuLower = new Map();
let _videoRecordBySkuLower = new Map(); // { track, video }
let _insightsBySkuLower = new Map();
let _singleInsightCache = new Map(); // skuLower -> { stamp, data }
let _singleTranscriptCache = new Map(); // skuLower -> { stamp, data }
let _modulesByTrack = { h2dev: [], huan: [], dgmd: [] };
let _routeByTrack = { h2dev: [], huan: [], dgmd: [] };

// Cached Derived Responses
let _nicheRadarCache = { mtimeMs: -1, data: null };
let _overviewSummaryCache = { mtimeMs: -1, computedAt: 0, data: null };

function getFileMtimeMs(relPath) {
  try {
    const st = fs.statSync(path.join(ROOT, relPath));
    return st.isFile() ? st.mtimeMs : 0;
  } catch (_) {
    return 0;
  }
}

function getFileStamp(relPath) {
  try {
    const st = fs.statSync(path.join(ROOT, relPath));
    return st.isFile() ? `${st.mtimeMs}:${st.size}` : '0:0';
  } catch (_) {
    return '0:0';
  }
}

function readJsonSafe(relPath, fallback = null, trackFile = true) {
  const full = path.join(ROOT, relPath);
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      let stBefore;
      try {
        stBefore = fs.statSync(full);
      } catch (statErr) {
        if (statErr && statErr.code === 'ENOENT') {
          if (trackFile) {
            _fileMtimes.set(relPath, '0:0');
            _lastKnownGoodJson.delete(relPath);
          }
          return fallback;
        }
        throw statErr;
      }
      if (!stBefore.isFile()) {
        if (trackFile) {
          _fileMtimes.set(relPath, '0:0');
          _lastKnownGoodJson.delete(relPath);
        }
        return fallback;
      }
      const raw = fs.readFileSync(full, 'utf8');
      const stAfter = fs.statSync(full);
      if (stAfter.mtimeMs === stBefore.mtimeMs && stAfter.size === stBefore.size) {
        const parsed = JSON.parse(raw);
        const stamp = `${stAfter.mtimeMs}:${stAfter.size}`;
        if (trackFile) {
          _fileMtimes.set(relPath, stamp);
          _lastKnownGoodJson.set(relPath, parsed);
        }
        return parsed;
      }
    }
    throw new Error('Concurrent write unstable after 3 attempts');
  } catch (_) {
    if (trackFile) {
      _fileMtimes.set(relPath, '0:0');
      if (_lastKnownGoodJson.has(relPath)) return _lastKnownGoodJson.get(relPath);
    }
    return fallback;
  }
}

function normalizeArray(val, propName) {
  if (Array.isArray(val)) return val;
  if (val && propName && Array.isArray(val[propName])) return val[propName];
  return [];
}

function isLocalDocFile(f) {
  return typeof f === 'string' && f.length > 0 && !/^https?:\/\//i.test(f);
}

function hasAnyTrackedFileChanged() {
  const now = Date.now();
  if (_storeLoaded && (now - _lastStatCheckMs < STAT_CHECK_THROTTLE_MS)) {
    return false;
  }
  _lastStatCheckMs = now;
  for (const relPath of TRACKED_REL_PATHS) {
    const prevStamp = _fileMtimes.get(relPath) || '0:0';
    const curStamp = getFileStamp(relPath);
    if (curStamp !== prevStamp) {
      return true;
    }
  }
  return false;
}

function ensureFreshStore() {
  if (!_storeLoaded || hasAnyTrackedFileChanged()) {
    reloadHotStore();
  }
}

function reloadHotStore() {
  _lastStatCheckMs = Date.now();
  for (const relPath of TRACKED_REL_PATHS) {
    _fileMtimes.set(relPath, getFileStamp(relPath));
  }

  const catH2dev = normalizeArray(readJsonSafe('data/catalog.json', []), 'videos');
  const catHuan = normalizeArray(readJsonSafe('data/catalog_huan.json', []), 'videos');
  const catDgmd = normalizeArray(readJsonSafe('data/catalog_dgmd.json', []), 'videos');

  const vidH2dev = normalizeArray(readJsonSafe('data-tabs/videos.json', []), 'videos');
  const vidHuanTabs = normalizeArray(readJsonSafe('data-tabs/videos_huan.json', null), 'videos');
  const vidHuanData = normalizeArray(readJsonSafe('data/videos_huan.json', []), 'videos');
  const vidHuan = vidHuanTabs.length ? vidHuanTabs : vidHuanData;

  const vidDgmdTabs = normalizeArray(readJsonSafe('data-tabs/videos_dgmd.json', null), 'videos');
  const vidDgmdData = normalizeArray(readJsonSafe('data/videos_dgmd.json', []), 'videos');
  const vidDgmd = vidDgmdTabs.length ? vidDgmdTabs : vidDgmdData;

  const modH2devRaw = readJsonSafe('data/modules.json', { modules: [] });
  const modHuanRaw = readJsonSafe('data/modules_huan.json', { modules: [] });
  const modDgmdRaw = readJsonSafe('data/modules_dgmd.json', { modules: [] });

  const modH2dev = normalizeArray(modH2devRaw, 'modules');
  const modHuan = normalizeArray(modHuanRaw, 'modules');
  const modDgmd = normalizeArray(modDgmdRaw, 'modules');

  // 1. Build valid SKU Set & per-track Maps
  const nextSkuSet = new Set();
  const nextDgmdMap = new Map();
  const nextHuanMap = new Map();
  const nextH2devMap = new Map();
  const nextVideoRecordMap = new Map();

  function ingestTrackRecords(track, catalogList, videosList, modulesList, targetTrackMap) {
    for (const v of videosList) {
      if (!v || !v.sku) continue;
      const key = String(v.sku).trim().toLowerCase();
      if (!key) continue;
      nextSkuSet.add(key);
      const merged = Object.assign({}, v);
      targetTrackMap.set(key, merged);
      nextVideoRecordMap.set(key, { track, video: merged });
    }
    for (const c of catalogList) {
      if (!c || !c.sku) continue;
      const key = String(c.sku).trim().toLowerCase();
      if (!key) continue;
      nextSkuSet.add(key);
      const prev = targetTrackMap.get(key) || {};
      const merged = Object.assign({}, prev, c, {
        mp4: c.mp4 || prev.mp4 || c.file || prev.file || '',
        file: c.file || prev.file || c.mp4 || prev.mp4 || '',
        image: c.image || prev.image || c.thumb || prev.thumb || '',
        thumb: c.thumb || prev.thumb || c.image || prev.image || '',
        docs: (Array.isArray(c.docs) && c.docs.length) ? c.docs : (prev.docs || []),
        channels: (Array.isArray(c.channels) && c.channels.length) ? c.channels : (prev.channels || [])
      });
      targetTrackMap.set(key, merged);
      nextVideoRecordMap.set(key, { track, video: merged });
    }
    for (const mod of modulesList) {
      const items = Array.isArray(mod && mod.items) ? mod.items : [];
      for (const it of items) {
        if (!it || !it.sku) continue;
        const key = String(it.sku).trim().toLowerCase();
        if (!key) continue;
        nextSkuSet.add(key);
        const prev = targetTrackMap.get(key) || {};
        const merged = Object.assign({}, it, prev, {
          mp4: prev.mp4 || it.mp4 || prev.file || it.file || '',
          file: prev.file || it.file || prev.mp4 || it.mp4 || '',
          image: prev.image || it.image || prev.thumb || it.thumb || '',
          thumb: prev.thumb || it.thumb || prev.image || it.image || '',
          docs: (Array.isArray(prev.docs) && prev.docs.length) ? prev.docs : (it.docs || []),
          channels: (Array.isArray(prev.channels) && prev.channels.length) ? prev.channels : (it.channels || []),
          seq: it.seq || prev.seq || ''
        });
        targetTrackMap.set(key, merged);
        nextVideoRecordMap.set(key, { track, video: merged });
      }
    }
  }

  ingestTrackRecords('dgmd', catDgmd, vidDgmd, modDgmd, nextDgmdMap);
  ingestTrackRecords('huan', catHuan, vidHuan, modHuan, nextHuanMap);
  ingestTrackRecords('h2dev', catH2dev, vidH2dev, modH2dev, nextH2devMap);

  _validSkuSet = nextSkuSet;
  _dgmdBySkuLower = nextDgmdMap;
  _huanBySkuLower = nextHuanMap;
  _h2devBySkuLower = nextH2devMap;
  _videoRecordBySkuLower = nextVideoRecordMap;

  // 2. Build compact modules & flattened route per track
  function buildTrackModulesAndRoute(modulesList, trackMap) {
    const compactModules = [];
    const route = [];
    modulesList.forEach((mod, mIdx) => {
      const rawItems = Array.isArray(mod && mod.items) ? mod.items : [];
      const compactItems = rawItems.map((it, idx) => {
        const key = String(it && it.sku || '').trim().toLowerCase();
        const fullVid = trackMap.get(key) || it || {};
        const mp4Path = fullVid.mp4 || fullVid.file || it.mp4 || it.file || '';
        const sizeBytes = Number(fullVid.size) || (fullVid.size_mb ? Math.round(Number(fullVid.size_mb) * 1024 * 1024) : 0);
        const itemEntry = {
          sku: fullVid.sku || it.sku,
          title: fullVid.title || it.title || '',
          duration: fullVid.duration || it.duration || '',
          duration_sec: Number(fullVid.duration_sec || it.duration_sec) || 0,
          module_id: mod.id || mod.module_id || fullVid.module_id || `M${String(mIdx + 1).padStart(2, '0')}`,
          seq: it.seq || fullVid.seq || (idx + 1),
          file: mp4Path,
          mp4: mp4Path,
          has_video: Boolean(mp4Path || sizeBytes > 0),
          thumb: fullVid.thumb || fullVid.image || it.thumb || it.image || ''
        };
        route.push({
          sku: itemEntry.sku,
          skuLower: key,
          moduleId: mod.id || `M${String(mIdx + 1).padStart(2, '0')}`,
          moduleTitle: mod.title || '',
          moduleIndex: mIdx + 1,
          item: Object.assign({}, itemEntry, { mp4: mp4Path })
        });
        return itemEntry;
      });
      compactModules.push({
        id: mod.id || `M${String(mIdx + 1).padStart(2, '0')}`,
        title: mod.title || '',
        desc: mod.desc || '',
        count: compactItems.length,
        totalDuration: mod.totalDuration || '',
        index: mIdx + 1,
        items: compactItems
      });
    });
    return { compactModules, route };
  }

  const h2Built = buildTrackModulesAndRoute(modH2dev, _h2devBySkuLower);
  const huanBuilt = buildTrackModulesAndRoute(modHuan, _huanBySkuLower);
  const dgmdBuilt = buildTrackModulesAndRoute(modDgmd, _dgmdBySkuLower);

  _modulesByTrack = {
    h2dev: h2Built.compactModules,
    huan: huanBuilt.compactModules,
    dgmd: dgmdBuilt.compactModules
  };
  _routeByTrack = {
    h2dev: h2Built.route,
    huan: huanBuilt.route,
    dgmd: dgmdBuilt.route
  };

  // 3. Build Insights Map in RAM (O(1) by lowercase SKU)
  const nextInsightsMap = new Map();
  const insFiles = [
    'data/video_insights.json',
    'data/video_insights_huan.json',
    'data/video_insights_dgmd.json'
  ];
  for (const rel of insFiles) {
    const obj = readJsonSafe(rel, {});
    if (obj && typeof obj === 'object') {
      for (const [k, val] of Object.entries(obj)) {
        if (!val) continue;
        nextInsightsMap.set(String(k).trim().toLowerCase(), val);
        if (val.sku) {
          nextInsightsMap.set(String(val.sku).trim().toLowerCase(), val);
        }
      }
    }
  }
  _insightsBySkuLower = nextInsightsMap;
  _singleInsightCache.clear();
  _singleTranscriptCache.clear();

  // 4. Build Kenh Handle Set & Dead Channels List
  const kenhRaw = normalizeArray(readJsonSafe('data-tabs/kenh-mau.json', []));
  const nextKenhSet = new Set();
  const nextDeadChannels = [
    { handle: '@nelymallorca', dead: true, deadNote: 'Kênh cổ 2006 mua lại làm ngách tin tức Canada đã bị YouTube gỡ' },
    { handle: '@alanwattsdailywisdom', dead: true, deadNote: 'Kênh mẫu ngách triết lý Alan Watts US đã bị YouTube gỡ' }
  ];
  for (const k of kenhRaw) {
    if (!k) continue;
    const h = String(k.handle || '').trim();
    if (h) {
      nextKenhSet.add(h.toLowerCase());
      if (k.dead) {
        nextDeadChannels.push({
          handle: h,
          dead: true,
          deadNote: k.deadNote || 'Kênh đã dừng hoặc bị YouTube gỡ'
        });
      }
    }
  }
  _kenhHandleSet = nextKenhSet;
  _deadChannelsList = nextDeadChannels;

  // 5. Build Tai Lieu Index Map
  const tlRaw = normalizeArray(readJsonSafe('data-tabs/tai-lieu-full.json', []));
  const byNameMap = new Map();
  const bySkuMap = new Map();
  tlRaw.forEach((doc, idx) => {
    if (!doc) return;
    const nm = String(doc.name || '');
    if (nm && !byNameMap.has(nm)) {
      byNameMap.set(nm, idx);
    }
    if (doc.sku) {
      const sk = String(doc.sku).trim().toLowerCase();
      if (!bySkuMap.has(sk)) bySkuMap.set(sk, []);
      bySkuMap.get(sk).push(doc);
    }
  });
  _taiLieuIndex = { list: tlRaw, byNameMap, bySkuMap };

  // 6. Build Nguon Reup Index Map
  const reupRaw = normalizeArray(readJsonSafe('data-tabs/nguon-reup.json', []));
  const nextReupBySku = new Map();
  for (const r of reupRaw) {
    if (!r || !r.sku) continue;
    const sk = String(r.sku).trim().toLowerCase();
    if (!nextReupBySku.has(sk)) nextReupBySku.set(sk, []);
    nextReupBySku.get(sk).push(r);
  }
  _reupList = reupRaw;
  _reupBySkuMap = nextReupBySku;

  // Reset derived caches so they recompute on next access
  _nicheRadarCache = { mtimeMs: -1, data: null };
  _overviewSummaryCache = { mtimeMs: -1, computedAt: 0, data: null };
  _storeLoaded = true;

  return {
    totalSkus: _validSkuSet.size,
    kenhHandles: _kenhHandleSet.size,
    taiLieuCount: _taiLieuIndex.list.length,
    insightsCount: _insightsBySkuLower.size
  };
}

function isValidSku(sku) {
  if (!sku) return false;
  ensureFreshStore();
  return _validSkuSet.has(String(sku).trim().toLowerCase());
}

function getKenhHandleSet() {
  ensureFreshStore();
  return _kenhHandleSet;
}

function getTaiLieuIndexMap() {
  ensureFreshStore();
  return _taiLieuIndex;
}

function getDgmdItemBySku(sku) {
  if (!sku) return null;
  ensureFreshStore();
  return _dgmdBySkuLower.get(String(sku).trim().toLowerCase()) || null;
}

function getHuanItemBySku(sku) {
  if (!sku) return null;
  ensureFreshStore();
  return _huanBySkuLower.get(String(sku).trim().toLowerCase()) || null;
}

function getNicheRadarResponse() {
  const relPath = 'data-tabs/ngach-xanh.json';
  const curMtime = getFileMtimeMs(relPath);
  if (_nicheRadarCache.data && _nicheRadarCache.mtimeMs === curMtime) {
    return _nicheRadarCache.data;
  }

  const nxRaw = readJsonSafe(relPath, {});
  const list = Array.isArray(nxRaw) ? nxRaw : (nxRaw && nxRaw.ngachXanh || []);
  const auditList = (nxRaw && nxRaw.auditTong2026 && Array.isArray(nxRaw.auditTong2026.xepHang))
    ? nxRaw.auditTong2026.xepHang
    : [];
  const auditByNgach = new Map(auditList.map(r => [r.ngach, r]));
  const auditByRecord = new Map(auditList.map(r => [r.record, r]));

  const items = list.map((n, idx) => {
    const auditEntry = auditByNgach.get(n.ngach) || auditByRecord.get(idx);
    const clean = (n.mauSach || []).length;
    const ban = (n.mauBan || []).length;
    const skus = (n.skus || []).length;
    const rank = Number((auditEntry && (auditEntry.rank || auditEntry.thuTu)) || n.hang) || 99;
    const tier = (auditEntry && (auditEntry.tier || auditEntry.nhom)) || (n.xanh === true ? 'UU_TIEN_SAN_XUAT' : 'WATCHLIST');
    const rpmRaw = String(n.rpm || '');
    const rpmMatch = rpmRaw.match(/median\s*:?\s*\$?\s*(\d+(?:\.\d+)?)/i) || rpmRaw.match(/\$(\d+(?:\.\d+)?)/);
    const rpmNum = rpmMatch ? parseFloat(rpmMatch[1]) : 0;
    // SAI = Search Acquisition Index (demand / discoverability)
    let sai = 20;
    if (rpmNum > 0) sai += Math.min(30, rpmNum * 3);
    if (/\d+[.,]?\d*\s*K|\d+[.,]?\d*\s*M|keyword/i.test(n.evidence || '')) sai += 25;
    if (rank <= 2) sai += 15; else if (rank <= 5) sai += 8;
    if (n.xanh === true) sai += 10;
    sai = Math.max(0, Math.min(100, Math.round(sai)));
    // PRI = Production Readiness Index
    let pri = 10;
    pri += Math.min(30, clean * 8);
    pri += Math.min(20, skus * 10);
    const lamDuocRaw = String(n.lamDuoc || '').trim();
    const lamDuocCoDieuKien = /^C\u00d3\s*\u0110K\b/i.test(lamDuocRaw);
    const lamDuocThuan = !lamDuocCoDieuKien && /^C\u00d3(?!\s*K\u1ef8)/i.test(lamDuocRaw);
    if (lamDuocThuan) pri += 20;
    else if (lamDuocCoDieuKien) pri += 10;
    if (n.mauSach && n.mauSach.length) pri += 10;
    if (ban === 0) pri += 10;
    if (n.xanh === true) pri += 10;
    pri = Math.max(0, Math.min(100, Math.round(pri)));
    const compText = String(n.canhTranh || '');
    const compMatches = [...compText.matchAll(/competition\s*[:=]?\s*(\d+(?:\.\d+)?)/gi)];
    const compNum = compMatches.length ? Number(compMatches[compMatches.length - 1][1]) : NaN;
    const compMeasured = Number.isFinite(compNum);
    const comp = compMeasured ? Math.max(0, Math.min(100, compNum)) : 50;
    // BOI-like: green ocean = high SAI, mid/low competition proxy
    const boi = Math.max(0, Math.min(100, Math.round((sai * 0.55) + (pri * 0.25) + ((100 - comp) * 0.2))));
    return {
      ngach: n.ngach,
      xanh: n.xanh,
      hang: rank,
      legacyHang: n.hang,
      tier: tier,
      rpm: n.rpm,
      thiTruong: n.thiTruong,
      SAI: sai,
      PRI: pri,
      BOI: boi,
      comp: comp,
      compSource: compMeasured ? 'measured' : 'default',
      lamDuocTier: lamDuocThuan ? 'CO' : (lamDuocCoDieuKien ? 'CO_DK' : 'KHAC'),
      cleanSamples: clean,
      banSamples: ban,
      skus: skus,
      nenLam: !!n.nenLam
    };
  }).sort((a, b) => (b.BOI - a.BOI) || (b.SAI - a.SAI));

  const response = {
    schema: 'h2dev.niche-radar.v1',
    metrics: {
      SAI: 'Search Acquisition Index 0-100 ? demand/discoverability (rpm, keyword evidence, hang, xanh)',
      PRI: 'Production Readiness Index 0-100 ? mauSach/skus/lamDuoc/clean samples',
      BOI: 'Blue Ocean composite = 0.55*SAI + 0.25*PRI + 0.20*(100-comp)'
    },
    total: items.length,
    items
  };

  _nicheRadarCache = { mtimeMs: curMtime, data: response };
  return response;
}

function computeOverviewFromRam() {
  ensureFreshStore();
  const h2Videos = [..._h2devBySkuLower.values()];
  const huanVideos = [..._huanBySkuLower.values()];
  const dgmdVideos = [..._dgmdBySkuLower.values()];
  const allVideos = h2Videos.concat(huanVideos, dgmdVideos);

  let totalMb = 0;
  let totalBytes = 0;
  let freeCount = 0;
  const marketCounts = {};
  let emptyMarket = 0;
  const resCounts = { '1080p': 0, '2K': 0, '4K': 0, 'Shorts 1080p': 0 };

  function normMarketRam(m) {
    const s = String(m || '').trim();
    if (!s) return '';
    if (s === '🇻🇳 Việt Nam') return '🇻🇳 Việt';
    if (s === '🇯🇵 Nhật Bản') return '🇯🇵 Nhật';
    if (s === '🇰🇷 Hàn Quốc') return '🇰🇷 Hàn';
    if (s === '🇺🇸 US / Global' || s === '🇺🇸 Mỹ') return '🇺🇸 Mỹ / Global';
    const noFlag = s.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    if (noFlag === 'View Ngoại') return '🌐 Ngoại';
    return s;
  }

  for (const v of allVideos) {
    const mb = Number(v.size_mb) || (v.size ? Number(v.size) / (1024 * 1024) : 0);
    const bytes = Number(v.size) || (v.size_mb ? Math.round(Number(v.size_mb) * 1024 * 1024) : 0);
    totalMb += mb;
    totalBytes += bytes;
    if (v.free ?? v.is_free) freeCount++;
    const w = Number(v.width) || 1920;
    const h = Number(v.height) || 1080;
    const r = (h > w) ? 'Shorts 1080p' : ((w >= 3840 || h >= 2160) ? '4K' : ((w >= 2560 || h >= 1440) ? '2K' : '1080p'));
    v.resolution = r;
    resCounts[r] = (resCounts[r] || 0) + 1;
    const vMarkets = [...new Set((Array.isArray(v.market) ? v.market : []).map(normMarketRam).filter(Boolean))];
    if (!vMarkets.length) {
      emptyMarket++;
    } else {
      for (const m of vMarkets) {
        marketCounts[m] = (marketCounts[m] || 0) + 1;
      }
    }
  }

  const marketRows = Object.entries(marketCounts).sort((a, b) => b[1] - a[1]);
  if (emptyMarket) marketRows.push(['Chưa gắn', emptyMarket]);

  const kenhRaw = normalizeArray(readJsonSafe('data-tabs/kenh-mau.json', []));
  const deadChannelsCount = kenhRaw.filter(k => k && k.dead).length;
  const liveChannelsCount = kenhRaw.length - deadChannelsCount;

  const docsList = _taiLieuIndex.list;
  const liveDocFiles = docsList.filter(x => x && isLocalDocFile(x.file)).length;

  const nxRaw = readJsonSafe('data-tabs/ngach-xanh.json', {}) || {};
  const ngachXanhList = Array.isArray(nxRaw.ngachXanh) ? nxRaw.ngachXanh : [];
  const policiesList = Array.isArray(nxRaw.thongTinChinhSach2026) ? nxRaw.thongTinChinhSach2026 : [];
  const nichesGreenTrue = ngachXanhList.filter(n => n && n.xanh === true).length;
  const subNichesTotal = ngachXanhList.reduce((acc, n) => acc + (Array.isArray(n && n.subNiches120) ? n.subNiches120.length : 0) + (Array.isArray(n && n.subNiches2026) ? n.subNiches2026.length : 0), 0);

  const overviewNiches = ngachXanhList.map(n => {
    const skus = (Array.isArray(n.skus) ? n.skus : []).map(s => (typeof s === 'string' ? s : (s && s.sku))).filter(Boolean);
    const liveVideos = allVideos.filter(v => skus.includes(v.sku) || v.contentNiche === n.ngach).length;
    return {
      code: n.code,
      ngach: n.ngach,
      xanh: n.xanh,
      skus,
      liveVideos
    };
  }).sort((a, b) => b.liveVideos - a.liveVideos).slice(0, 6);

  const modulesH2dev = _modulesByTrack.h2dev.length;
  const modulesHuan = _modulesByTrack.huan.length;
  const modulesDgmd = _modulesByTrack.dgmd.length;
  const totalModules = modulesH2dev + modulesHuan + modulesDgmd;

  const kichBanList = normalizeArray(readJsonSafe('data-tabs/kich-ban.json', []));
  const rawCanonical = readJsonSafe('data-tabs/raw-kenh-mau.json', {});
  const rawRecords = Array.isArray(rawCanonical)
    ? rawCanonical
    : (Array.isArray(rawCanonical && rawCanonical.records) ? rawCanonical.records : []);

  const resSummary = `${resCounts['1080p'] || 247} FHD 1080p · ${resCounts['2K'] || 46} 2K · ${resCounts['4K'] || 39} 4K · ${resCounts['Shorts 1080p'] || 1} Shorts`;

  return {
    schema: 'h2dev.overview-summary.v1',
    generatedAt: new Date().toISOString(),
    counts: {
      totalVideos: allVideos.length,
      videosTotal: allVideos.length,
      videos: h2Videos.length,
      videosH2dev: h2Videos.length,
      videosHuan: huanVideos.length,
      videosDgmd: dgmdVideos.length,
      free: freeCount,
      videoFree: freeCount,
      pro: allVideos.length - freeCount,
      videoPro: allVideos.length - freeCount,
      documents: docsList.length,
      liveDocFiles,
      channels: kenhRaw.length,
      liveChannels: liveChannelsCount,
      deadChannels: deadChannelsCount,
      niches: ngachXanhList.length,
      subNichesTotal,
      nichesGreenTrue,
      policies: policiesList.length,
      modules: totalModules,
      modulesTotal: totalModules,
      modulesH2dev,
      modulesHuan,
      modulesDgmd,
      nguonReup: _reupList.length,
      kichBan: kichBanList.length,
      canonicalRaw: rawRecords.length,
      totalMarkets: marketRows.length
    },
    storage: {
      diskMb: Number(totalMb.toFixed(2)),
      totalMb: Number(totalMb.toFixed(2)),
      totalVideoSizeMb: Number(totalMb.toFixed(2)),
      totalGb: Number((totalMb / 1024).toFixed(2)),
      mediaBytes: totalBytes,
      totalBytes,
      videoFiles: allVideos.length,
      resolution: resSummary,
      resolutionSummary: resSummary,
      resolutions: resCounts
    },
    markets: {
      totalMarkets: marketRows.length,
      emptyMarket,
      marketRows
    },
    topNiches: overviewNiches,
    thongTinChinhSach2026: policiesList
  };
}

function getOverviewSummary() {
  ensureFreshStore();
  const relPath = 'data/overview_summary.json';
  const curMtime = getFileMtimeMs(relPath);
  if (curMtime > 0) {
    if (_overviewSummaryCache.data && _overviewSummaryCache.mtimeMs === curMtime) {
      return _overviewSummaryCache.data;
    }
    const diskData = readJsonSafe(relPath, null);
    if (diskData && typeof diskData === 'object') {
      const fallback = computeOverviewFromRam();
      const merged = Object.assign({}, fallback, diskData, {
        counts: Object.assign({}, diskData.counts || {}, fallback.counts),
        storage: Object.assign({}, fallback.storage, diskData.storage || {})
      });
      _overviewSummaryCache = { mtimeMs: curMtime, computedAt: Date.now(), data: merged };
      return merged;
    }
  }
  if (_overviewSummaryCache.data && _overviewSummaryCache.mtimeMs === 0) {
    return _overviewSummaryCache.data;
  }
  const computed = computeOverviewFromRam();
  _overviewSummaryCache = { mtimeMs: 0, computedAt: Date.now(), data: computed };
  return computed;
}

function getInsightForSku(resolvedSku) {
  if (!resolvedSku) return null;
  const skuKey = String(resolvedSku).trim().toLowerCase();
  const ramIns = _insightsBySkuLower.get(skuKey) || null;
  const relPath = `video/${resolvedSku}/insight.json`;
  const curStamp = getFileStamp(relPath);
  if (curStamp !== '0:0') {
    const cached = _singleInsightCache.get(skuKey);
    if (cached && cached.stamp === curStamp) {
      _singleInsightCache.delete(skuKey);
      _singleInsightCache.set(skuKey, cached);
      return ramIns ? Object.assign({}, cached.data, ramIns) : cached.data;
    }
    const diskIns = readJsonSafe(relPath, null, false);
    if (diskIns) {
      while (_singleInsightCache.size >= MAX_SINGLE_INSIGHT_CACHE) {
        const oldestKey = _singleInsightCache.keys().next().value;
        if (oldestKey === undefined) break;
        _singleInsightCache.delete(oldestKey);
      }
      _singleInsightCache.set(skuKey, { stamp: curStamp, data: diskIns });
      return ramIns ? Object.assign({}, diskIns, ramIns) : diskIns;
    }
  }
  return ramIns;
}

function getTranscriptForSku(resolvedSku) {
  if (!resolvedSku) return null;
  const skuKey = String(resolvedSku).trim().toLowerCase();
  const relPath = `video/${resolvedSku}/transcript.json`;
  const curStamp = getFileStamp(relPath);
  if (curStamp !== '0:0') {
    const cached = _singleTranscriptCache.get(skuKey);
    if (cached && cached.stamp === curStamp) {
      _singleTranscriptCache.delete(skuKey);
      _singleTranscriptCache.set(skuKey, cached);
      return cached.data;
    }
    const diskTr = readJsonSafe(relPath, null, false);
    if (diskTr) {
      while (_singleTranscriptCache.size >= MAX_SINGLE_INSIGHT_CACHE) {
        const oldestKey = _singleTranscriptCache.keys().next().value;
        if (oldestKey === undefined) break;
        _singleTranscriptCache.delete(oldestKey);
      }
      _singleTranscriptCache.set(skuKey, { stamp: curStamp, data: diskTr });
      return diskTr;
    }
  }
  return null;
}

function getPlayerBootstrap(sku) {
  if (!sku) return null;
  ensureFreshStore();
  const skuKey = String(sku).trim().toLowerCase();
  const rec = _videoRecordBySkuLower.get(skuKey);
  if (!rec || !rec.video) return null;

  const track = rec.track;
  const video = rec.video;
  const resolvedSku = video.sku || sku;
  const trackModules = _modulesByTrack[track] || [];
  const route = _routeByTrack[track] || [];

  const routePos = route.findIndex(r => r.skuLower === skuKey);
  const prevEntry = routePos > 0 ? route[routePos - 1] : null;
  const nextEntry = (routePos >= 0 && routePos < route.length - 1) ? route[routePos + 1] : null;

  let currentModule = null;
  let moduleVideos = [];
  for (const mod of trackModules) {
    if (mod.items && mod.items.some(it => String(it.sku || '').toLowerCase() === skuKey)) {
      currentModule = {
        id: mod.id,
        title: mod.title,
        desc: mod.desc || '',
        index: mod.index,
        count: mod.count,
        totalDuration: mod.totalDuration || ''
      };
      moduleVideos = mod.items;
      break;
    }
  }

  const insight = getInsightForSku(resolvedSku);
  const transcript = getTranscriptForSku(resolvedSku);

  // Merge video.docs with any additional docs in tai-lieu-full.json for this SKU
  const videoDocs = Array.isArray(video.docs) ? video.docs : [];
  const extraDocs = _taiLieuIndex.bySkuMap.get(skuKey) || [];
  const seenDocKeys = new Set();
  const mergedDocs = [];
  for (const d of videoDocs.concat(extraDocs)) {
    if (!d) continue;
    const dk = `${d.file || ''}|${d.link || ''}|${d.name || d.title || ''}`;
    if (seenDocKeys.has(dk)) continue;
    seenDocKeys.add(dk);
    mergedDocs.push(d);
  }

  // Reup sources related to SKU or its module videos
  const moduleSkuSet = new Set([skuKey, ...moduleVideos.map(mv => String(mv.sku || '').toLowerCase())]);
  const reup = [];
  for (const mSku of moduleSkuSet) {
    const arr = _reupBySkuMap.get(mSku);
    if (arr && arr.length) {
      reup.push(...arr);
    }
  }

  // Filter deadChannels to only handles referenced in this video
  const vidHandles = new Set(
    (Array.isArray(video.channels) ? video.channels : []).map(c => {
      const h = (typeof c === 'object' && c !== null) ? (c.handle || c.name || '') : String(c || '');
      return h.replace(/^@/, '').trim().toLowerCase();
    }).filter(Boolean)
  );
  const relevantDeadChannels = vidHandles.size
    ? _deadChannelsList.filter(d => vidHandles.has(String(d.handle || '').replace(/^@/, '').trim().toLowerCase()))
    : [];

  return {
    schema: 'h2dev.player-bootstrap.v1',
    track,
    sku: resolvedSku,
    resolvedSku,
    video,
    module: currentModule,
    moduleVideos,
    trackModules,
    routeIndex: routePos,
    routeTotal: route.length,
    prevSku: prevEntry ? prevEntry.sku : null,
    nextSku: nextEntry ? nextEntry.sku : null,
    prevVideo: prevEntry ? prevEntry.item : null,
    nextVideo: nextEntry ? nextEntry.item : null,
    insight,
    transcript,
    docs: mergedDocs,
    reup,
    deadChannels: relevantDeadChannels
  };
}

// Initial warm-up on require
reloadHotStore();

module.exports = {
  reloadHotStore,
  isValidSku,
  getKenhHandleSet,
  getTaiLieuIndexMap,
  getDgmdItemBySku,
  getHuanItemBySku,
  getNicheRadarResponse,
  getOverviewSummary,
  getPlayerBootstrap
};
