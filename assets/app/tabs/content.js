/* H2TabContent - G3.1 extract: 8 tab renderers from index.html */
(function (global) {
  'use strict';
  /* FIX 2026-09-30 (UI-01): fallback CHI dung khi search-core.js khong nap duoc; cung hop dong dau/khong dau. */
  const _lnfc = (t) => String(t == null ? '' : t).normalize('NFC').toLowerCase();
  const _fold = (t) => _lnfc(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').normalize('NFC');
  const _marks = (t) => _fold(t) !== _lnfc(t);
  const SC = (typeof window !== 'undefined' && window.H2SearchCore) || {
    tokenize: (t) => _lnfc(t).split(/[^\p{L}\p{N}\p{M}+]+/u).filter(Boolean),
    matchesQuery: (parts, q) => {
      const kw = _lnfc(q).split(/[^\p{L}\p{N}\p{M}+]+/u).filter(Boolean);
      if (!kw.length) return true;
      const hay = _lnfc((parts||[]).map(x => x==null?'':String(x)).join(' ')).replace(/[^\p{L}\p{N}\p{M}+]+/gu,' ');
      const hayF = _fold(hay);
      return kw.every(k => (_marks(k) ? hay : hayF).indexOf(k) >= 0);
    },
    includes: (text, q) => { const qq = _lnfc(q).trim(); if (!qq) return true; const t = _lnfc(text); return (_marks(qq) ? t : _fold(t)).indexOf(qq) >= 0; },
    pad2: (n) => String(n==null?0:n).padStart(2,'0')
  };

  function createTabContent(deps) {
    const state = deps.state;
    const CAT = deps.CAT;
    const ICONS = deps.ICONS;
    const loadJSON = deps.loadJSON;
    const loadMusicStats = deps.loadMusicStats;
    const musicStats = deps.musicStats;
    const esc = deps.esc;
    const safeArray = deps.safeArray;
    /* PHASE 3 (2026-09-23): he icon CSS mask — xem design-system/ICON-MAPPING.md */
    const ico = deps.ico;
    const stripDecorEmoji = deps.stripDecorEmoji;
    /* Icon co MAU (giu ngu nghia den bao YPP): .h2-icon dung background-color:currentColor
     * => doi mau bang `color` cua span boc ngoai. KHONG them CSS moi. */
    const icoColored = (name, color, size) =>
      '<span style="color:' + color + ';display:inline-flex;align-items:center;" aria-hidden="true">' + ico(name, size || 16) + '</span>';
    const nicheKeyFor = deps.nicheKeyFor;
    const xanhBadge = deps.xanhBadge;
    const statCard = deps.statCard;
    const pageBanner = deps.pageBanner;
    const highlightQuery = deps.highlightQuery;
    const fmtMb = deps.fmtMb;
    const fmtBytes = deps.fmtBytes;
    const loadChecks = deps.loadChecks;
    const loadWatched = deps.loadWatched;
    const watchedBadge = deps.watchedBadge;
    const watchedProgress = deps.watchedProgress;
    const watchedResumeLabel = deps.watchedResumeLabel;
    const quickAccessBar = deps.quickAccessBar;
    const openNicheVideos = deps.openNicheVideos;
    const expandNicheMore = deps.expandNicheMore;
    const bindNicheActions = deps.bindNicheActions;
    const RAW_NICHE_GROUPS = deps.RAW_NICHE_GROUPS;
    const RAW_NICHE_TO_GROUP = deps.RAW_NICHE_TO_GROUP;
    const rawNicheGroup = deps.rawNicheGroup;
    const NICHE_MAP = deps.NICHE_MAP;
    const APP_BUILD_VER = deps.APP_BUILD_VER;
    const loadOverviewSummary = deps.loadOverviewSummary;
    const syncVideoUrl = deps.syncVideoUrl;
    const syncNxPageUrl = deps.syncNxPageUrl;

function safeUrl(raw) {
  const u = String(raw == null ? '' : raw).trim();
  if (!u || /[\u0000-\u001F\u007F]/.test(u)) return '';
  if (/^\/\//.test(u) || /^\\\\/.test(u)) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/(?!\/)/.test(u)) return u;
  if (/^#/.test(u)) return u;
  const noCtrl = u.replace(/[\s\u0000-\u001F]+/g, '');
  const head = noCtrl.split(/[/?#]/)[0];
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(head) || head.includes(':')) return '';
  return u;
}

function safeExternalUrl(raw) {
  const u = String(raw == null ? '' : raw).trim();
  if (!u || /[\u0000-\u001F\u007F]/.test(u)) return '';
  return /^https?:\/\//i.test(u) ? u : '';
}

function normMarket(m) {
  const s = String(m || '').trim();
  if (!s) return '';
  const up = s.toUpperCase();
  const plainUp = stripDecorEmoji(s).replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim().toUpperCase();
  if (s === '🇻🇳 Việt Nam' || plainUp === 'VN' || plainUp === 'VIETNAM' || plainUp === 'VIỆT NAM' || plainUp === 'VIỆT') return '🇻🇳 Việt';
  if (s === '🇯🇵 Nhật Bản' || plainUp === 'JP' || plainUp === 'JAPAN' || plainUp === 'NHẬT BẢN' || plainUp === 'NHẬT') return '🇯🇵 Nhật';
  if (s === '🇰🇷 Hàn Quốc' || plainUp === 'KR' || plainUp === 'KOREA' || plainUp === 'HÀN QUỐC' || plainUp === 'HÀN') return '🇰🇷 Hàn';
  if (s === '🇺🇸 US / Global' || s === '🇺🇸 Mỹ' || s === '🇺🇸 Hoa Kỳ' || plainUp === 'US' || plainUp === 'USA' || plainUp === 'GLOBAL' || plainUp === 'US / GLOBAL' || plainUp === 'MỸ' || plainUp === 'MỸ / GLOBAL' || plainUp === 'HOA KỲ' || plainUp === 'HOA KY' || up === 'HOA KỲ' || up === 'HOA KY') return '🇺🇸 Mỹ / Global';
  if (plainUp === 'NGOẠI' || plainUp === 'NGOAI' || plainUp === 'VIEW NGOẠI' || plainUp === 'VIEW NGOAI') return '\uD83C\uDF10 Ngoại';
  if (plainUp === 'CN' || plainUp === 'CHINA' || plainUp === 'TRUNG' || plainUp === 'TRUNG QUỐC') return '🇨🇳 Trung';
  if (plainUp === 'UK' || plainUp === 'GB' || plainUp === 'ANH') return '🇬🇧 Anh';
  if (plainUp === 'CA' || plainUp === 'CANADA') return '🇨🇦 Canada';
  if (plainUp === 'TH' || plainUp === 'THAI' || plainUp === 'THÁI' || plainUp === 'THÁI LAN') return '🇹🇭 Thái';
  if (plainUp === 'RU' || plainUp === 'RUSSIA' || plainUp === 'NGA') return '🇷🇺 Nga';
  if (plainUp === 'PH' || plainUp === 'PHIL' || plainUp === 'PHILIPPINES') return '🇵🇭 Phil';
  if (plainUp === 'HK' || plainUp === 'HONG KONG') return '🇭🇰 HK';
  if (plainUp === 'FB' || plainUp === 'FACEBOOK') return '\uD83D\uDCD8 Facebook';
  if (plainUp === 'SHORTS' || plainUp === 'REELS' || plainUp === 'SHORTS / REELS') return '\uD83D\uDCF1 Shorts / Reels';
  return s;
}

const RECENT_SKUS = new Set([
  'VIDEO-bfabb6', 'VIDEO-9ff392', 'VIDEO-57d8ef', 'VIDEO-448a91', 'VIDEO-2d1a38', 'VIDEO-acef2c',
  'VIDEO-940acb', 'VIDEO-8a7455', 'VIDEO-e17ac0', 'VIDEO-78204f',
  'VIDEO-583a09', 'VIDEO-7e6773', 'VIDEO-e02e02', 'VIDEO-ad6a82', 'VIDEO-fc62eb', 'VIDEO-27e4e0',
  'VIDEO-434f80', 'VIDEO-ca0383', 'VIDEO-fa13f3', 'VIDEO-7112d8', 'VIDEO-0419c4'
]);
function isRecentlyIngestedVideo(v) {
  return Boolean(v && (v.ingested_at || RECENT_SKUS.has(String(v.sku || ''))));
}

/** Extract cited @handles matching a known channel Set, supporting Unicode handles. */
function extractKnownHandles(text, handleSet) {
  return [...new Set((String(text || '').match(/@[^\s,;:)\]]+/g) || [])
    .map(h => h.replace(/[.,;:)\]"'`]+$/, ''))
    .filter(h => handleSet.has(h.toLowerCase())))];
}

async function renderTongQuan() {
  // Fallback an toàn: 1 file JSON lỗi không được làm chết cả tab Tổng quan
  /* FIX 2026-09-30 (UI-11): fallback cu tra ve {} cho kenh/ngach-xanh -> kenh.filter / nx.ngachXanh.slice
     nem TypeError, lo nguyen van "Cannot read properties of undefined (reading 'slice')" ra UI.
     Nay chuan hoa schema rong an toan; loi tai file van duoc ghi qua noteLoadError -> banner. */
  const [videosH2dev, videosHuan, videosDgmd, kenh, kich, nxRaw, ov] = await Promise.all([
    loadJSON('data-tabs/videos.json').catch(() => []),
    loadJSON('data/videos_huan.json').catch(() => []),
    loadJSON('data/videos_dgmd.json').catch(() => []),
    loadJSON('data-tabs/kenh-mau.json').catch(() => []),
    loadJSON('data-tabs/tai-lieu-full.json').catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => null),
    loadOverviewSummary ? loadOverviewSummary().catch(() => null) : Promise.resolve(null),
    loadMusicStats ? loadMusicStats().catch(() => null) : Promise.resolve(null)
  ]);
  const videos = safeArray(videosH2dev);
  const huanList = safeArray(videosHuan);
  const dgmdList = safeArray(videosDgmd);
  const allSystemVideos = videos.concat(huanList, dgmdList);
  const kenhList = safeArray(kenh);
  const kichList = safeArray(kich);
  const nx = Object.assign({}, (nxRaw && typeof nxRaw === 'object') ? nxRaw : {}, {
    ngachXanh: safeArray(nxRaw && nxRaw.ngachXanh),
    thongTinChinhSach2026: safeArray(nxRaw && nxRaw.thongTinChinhSach2026)
  });
  const computedMb = Math.round(allSystemVideos.reduce((a, v) => a + ((v.size_mb != null ? Number(v.size_mb) : (Number(v.size || 0) / (1024 * 1024))) || 0), 0));
  const diskMb = (ov && Number(ov.totalVideoSizeMb) > 0) ? Number(ov.totalVideoSizeMb) : computedMb;
  const free = allSystemVideos.filter(v => (v.free ?? v.is_free)).length;
  const freeH2 = videos.filter(v => (v.free ?? v.is_free)).length;
  const freeHuan = huanList.filter(v => (v.free ?? v.is_free)).length;
  const freeDgmd = dgmdList.filter(v => (v.free ?? v.is_free)).length;
  const res4k = allSystemVideos.filter(v => v.resolution === '4K' || Number(v.width) >= 3840).length;
  const res2k = allSystemVideos.filter(v => v.resolution === '2K' || (Number(v.width) >= 2560 && Number(v.width) < 3840)).length;
  const resFhd = allSystemVideos.length - res4k - res2k;
  const resSubText = (res4k || res2k)
    ? `${SC.pad2(allSystemVideos.length)} video · ${resFhd} FHD · ${res2k} 2K · ${res4k} 4K`
    : `${SC.pad2(allSystemVideos.length)} video · Full HD 1080p`;
  const market = new Map(); let emptyMarket = 0;
  allSystemVideos.forEach(v => {
    const vMarkets = [...new Set(safeArray(v.market).map(normMarket).filter(Boolean))];
    if (!vMarkets.length) emptyMarket++;
    else vMarkets.forEach(m => {
      market.set(m, (market.get(m) || 0) + 1);
    });
  });
  const marketRows = [...market.entries()].sort((a, b) => b[1] - a[1]);
  if (emptyMarket) marketRows.push(['Chưa gắn', emptyMarket]);
  const liveFile = kichList.filter(x => isLocalDocFile(x.file)).length;
  const skuBranchMap = new Map();
  videos.forEach(v => { if (v && v.sku) skuBranchMap.set(v.sku, 'H2DEV'); });
  huanList.forEach(v => { if (v && v.sku) skuBranchMap.set(v.sku, 'HUAN'); });
  dgmdList.forEach(v => { if (v && v.sku) skuBranchMap.set(v.sku, 'DGMD'); });
  let docsH2Count = 0, docsHuanCount = 0, docsDgmdCount = 0;
  kichList.forEach(item => {
    const rawB = String(item && item.branch || '').toUpperCase();
    const vBr = item && item.sku ? skuBranchMap.get(item.sku) : '';
    const f = String(item && (item.file || item.fileLocal) || '');
    const br = (rawB === 'H2DEV' || rawB === 'HUAN' || rawB === 'DGMD' || rawB === 'NOI-BO' || rawB === 'PIPELINE')
      ? rawB
      : (vBr || (f.includes('docs-huan/') ? 'HUAN' : f.includes('docs-dgmd/') ? 'DGMD' : f.startsWith('pipelines/') ? 'PIPELINE' : (f.startsWith('docs/NOI-BO/') || (item && item.source === 'noi-bo')) ? 'NOI-BO' : 'H2DEV'));
    if (br === 'HUAN') docsHuanCount++;
    else if (br === 'DGMD') docsDgmdCount++;
    else if (br === 'H2DEV') docsH2Count++;
  });
  const allNichePairs = nx.ngachXanh.map(n => {
    const sk = safeArray(n.skus).map(s0 => typeof s0 === 'string' ? s0 : (s0 && s0.sku));
    const skSet = new Set(sk.map(x => String(x || '').toLowerCase()).filter(Boolean));
    const nTarget = String(n.ngach || '').trim().toLowerCase();
    const liveVids = allSystemVideos.filter(v => skSet.has(String(v.sku || '').toLowerCase()) || String(v.contentNiche || '').trim().toLowerCase() === nTarget);
    const liveSkus = [...new Set(liveVids.map(v => v.sku).concat(sk).filter(Boolean))];
    return { n, live: liveVids.length, liveSkus };
  }).sort((a, b) => b.live - a.live);
  const showAllMarkets = Boolean(state.tatcaMarketsExpanded);
  const showAllNiches = Boolean(state.tatcaNichesExpanded);
  const overviewNichePairs = showAllNiches ? allNichePairs : allNichePairs.slice(0, 6);
  const overviewNiches = overviewNichePairs.map(p => p.n);
  const nicheLives = overviewNichePairs.map(p => p.live);
  const nicheLiveSkusList = overviewNichePairs.map(p => p.liveSkus);
  const maxNicheLive = Math.max(1, ...allNichePairs.map(p => p.live));
  const sub120Sum = nx.ngachXanh.reduce((acc, n) => acc + safeArray(n.subNiches120).length, 0);
  const sub26Sum = nx.ngachXanh.reduce((acc, n) => acc + safeArray(n.subNiches2026).length, 0);
  const subNichesCount = (sub120Sum + (sub26Sum > 0 ? sub26Sum : safeArray(nxRaw && nxRaw.subNiches2026).length)) || 178;
  const modH2Count = (ov && Number(ov.modulesH2dev) > 0) ? Number(ov.modulesH2dev) : ((ov && ov.counts && Number(ov.counts.modulesH2dev) > 0) ? Number(ov.counts.modulesH2dev) : 12);
  const modHuanCount = (ov && Number(ov.modulesHuan) > 0) ? Number(ov.modulesHuan) : ((ov && ov.counts && Number(ov.counts.modulesHuan) > 0) ? Number(ov.counts.modulesHuan) : 13);
  const modDgmdCount = (ov && Number(ov.modulesDgmd) > 0) ? Number(ov.modulesDgmd) : ((ov && ov.counts && Number(ov.counts.modulesDgmd) > 0) ? Number(ov.counts.modulesDgmd) : 11);
  const moduleCount = (ov && Number(ov.modulesTotal) > 0) ? Number(ov.modulesTotal) : (modH2Count + modHuanCount + modDgmdCount);
  const rawCount = (ov && Number(ov.rawChannels) > 0) ? Number(ov.rawChannels) : 156;
  const rawDeepCount = (ov && Number(ov.rawDeepProfiles) > 0) ? Number(ov.rawDeepProfiles) : 149;
  const reupCount = (ov && Number(ov.nguonReup) > 0) ? Number(ov.nguonReup) : 52;
  const musicCount = (musicStats && Number(musicStats.total) > 0) ? Number(musicStats.total) : ((ov && Number(ov.musicTracks || (ov.counts && ov.counts.musicTracks)) > 0) ? Number(ov.musicTracks || ov.counts.musicTracks) : 49);
  const musicSafeCount = (musicStats && Number(musicStats.safe) > 0) ? Number(musicStats.safe) : ((ov && Number(ov.musicSafe || (ov.counts && ov.counts.musicSafe)) > 0) ? Number(ov.musicSafe || ov.counts.musicSafe) : 36);
  const clStepsCount = (ov && Number(ov.chienLuocSteps || (ov.counts && ov.counts.chienLuocSteps)) > 0) ? Number(ov.chienLuocSteps || ov.counts.chienLuocSteps) : 24;
  const kmHandleSet = new Set(kenhList.map(k => String((k && k.handle) || '').trim().toLowerCase()).filter(Boolean).map(h => h.startsWith('@') ? h : '@' + h));
  return `
  ${pageBanner('Tổng quan Hệ sinh thái 97yo-dev', `${allSystemVideos.length} bài học (3 nhánh) · ${SC.pad2(marketRows.length)} thị trường · ${SC.pad2(nx.ngachXanh.length)} ngách (${subNichesCount} vi ngách) · ${SC.pad2((nx.thongTinChinhSach2026 || []).length)} chính sách 2026`, [
    { icon: ICONS.video, label: 'Video khóa học (3 nhánh)', value: allSystemVideos.length, sub: `${videos.length} H2DEV · ${huanList.length} Huân · ${dgmdList.length} DGMD · ${free} Free`, tab: 'video' },
    { icon: ICONS.doc, label: 'Kịch bản & Tài liệu', value: kichList.length, sub: `${liveFile} file local · catalog SOP`, tab: 'tai-lieu' },
    { icon: ICONS.channel, label: 'Kênh mẫu', value: kenhList.length, sub: `${kenhList.filter(k=>!k.dead).length} sống · ${kenhList.filter(k=>k.dead).length} case study DIE`, tab: 'kenh-mau' },
    { icon: ICONS.disk, label: 'Dung lượng đĩa', value: fmtMb(diskMb), sub: resSubText, tab: 'video' }
  ])}
  <div class="tq-head card p-4 sm:p-5 mb-6 flex flex-col gap-4 border-border-strong bg-surface overflow-visible" style="position:relative; contain:none !important;">
    <div class="flex flex-wrap items-center justify-between gap-3 w-full">
      <div class="flex items-center gap-3 min-w-0">
        <span class="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-brand-tint text-brand-tint-fg border border-brand/30">
          <span class="w-1.5 h-1.5 rounded-full bg-brand h2-ico-pulse-dot"></span>97YO-DEV HUB
        </span>
        <span class="text-xs text-gray-300 font-medium">Trung tâm điều phối 3 nhánh đào tạo (${allSystemVideos.length} bài · ${moduleCount} module), 11 phân hệ dữ liệu &amp; radar đối thủ YouTube</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="filter-btn text-xs flex items-center gap-1.5 px-3 py-1.5" data-open-tab="sodo" data-sodo-node="project:h2dev-project" title="Mở Sơ đồ DB &amp; Liên kết toàn hệ thống">
          <span>Sơ đồ DB &amp; Liên kết</span>
          <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span>
        </button>
        <button type="button" class="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5" data-open-tab="lotrinh" data-lotrinh-track="all" title="Mở Lộ trình học tổng hợp cả 3 nhánh (${moduleCount} module · ${allSystemVideos.length} bài)">
          <span>${moduleCount ? 'Lộ trình học · ' + SC.pad2(moduleCount) + ' module (3 nhánh)' : 'Lộ trình học'}</span>
          <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span>
        </button>
      </div>
    </div>
    <!-- Omni-Search Toàn Hệ Thống (FTS5 BM25) ngay tại Hub Tổng Quan -->
    <div class="w-full pt-3 border-t border-hairline relative">
      <label class="sr-only" for="fq">Tìm kiếm toàn hệ thống 97yo-dev</label>
      <div class="relative w-full" id="tatca-search-wrap">
        <input id="fq" role="combobox" aria-autocomplete="list" aria-controls="tatca-search-suggestions" aria-expanded="false" aria-label="Tìm nhanh bài học, tài liệu SOP, kênh mẫu, ngách xanh, vi ngách toàn hệ thống (Ctrl+K hoặc /)" value="${esc(state.q || '')}" autocomplete="off" placeholder="Tìm nhanh toàn hệ thống (FTS5 BM25): tên bài học, SKU, SOP, @handle kênh mẫu, H01-H40, SUB-01... (nhấn / hoặc Ctrl+K)" class="search-input-premium w-full min-w-0 pr-9">
        <button type="button" id="btn-clear-tatca-q" aria-label="Xóa tìm kiếm" class="${state.q ? '' : 'hidden '}absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>
        <div id="tatca-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-border min-w-full bg-surface" style="z-index:var(--h2-z-modal-top)"></div>
      </div>
    </div>
    <div class="grid sm:grid-cols-3 gap-3 w-full pt-3 border-t border-hairline">
      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-muted">NHÁNH H2DEV</span>
            <span class="text-xs font-mono text-gray-400">${modH2Count} module · ${freeH2} Free</span>
          </div>
          <div class="text-sm font-bold text-white mt-1.5">H2DEV · Faceless (${videos.length} bài)</div>
          <p class="text-xs text-gray-400 mt-0.5">Quy trình xây kênh Faceless, B-roll, AI Film, What-If 2D &amp; Zoom thực chiến</p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <button type="button" class="filter-btn text-xs" data-open-tab="video" data-video-track="h2dev" title="Lọc ${videos.length} video nhánh H2DEV">Video (${videos.length}) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="lotrinh" data-lotrinh-track="h2dev" title="Mở lộ trình ${modH2Count} module nhánh H2DEV">Lộ trình (${modH2Count}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="tai-lieu" data-doc-branch="H2DEV" title="Mở ${docsH2Count} tài liệu nhánh H2DEV">Tài liệu (${docsH2Count}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-amber">NHÁNH HUÂN</span>
            <span class="text-xs font-mono text-gray-400">${modHuanCount} module · ${freeHuan} Free</span>
          </div>
          <div class="text-sm font-bold text-white mt-1.5">Huân Academy · AI (${huanList.length} bài)</div>
          <p class="text-xs text-gray-400 mt-0.5">YouTube Total Success, Bán Content Fair Use, Kling/Veo/Suno &amp; Quản trị hệ thống</p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <button type="button" class="filter-btn text-xs" data-open-tab="video" data-video-track="huan" title="Lọc ${huanList.length} video nhánh Huân Academy">Video (${huanList.length}) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="lotrinh" data-lotrinh-track="huan" title="Mở lộ trình ${modHuanCount} module nhánh Huân Academy">Lộ trình (${modHuanCount}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="tai-lieu" data-doc-branch="HUAN" title="Mở ${docsHuanCount} tài liệu nhánh Huân Academy">Tài liệu (${docsHuanCount}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-blue">NHÁNH DGMD</span>
            <span class="text-xs font-mono text-gray-400">${modDgmdCount} module · ${freeDgmd} Free</span>
          </div>
          <div class="text-sm font-bold text-white mt-1.5">Đại Gia Mang Dép (${dgmdList.length} bài)</div>
          <p class="text-xs text-gray-400 mt-0.5">Thực chiến đa nền tảng YouTube · Facebook Reels · Shorts &amp; Tâm linh / Đạo lý</p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <button type="button" class="filter-btn text-xs" data-open-tab="video" data-video-track="dgmd" title="Lọc ${dgmdList.length} video nhánh Đại Gia Mang Dép">Video (${dgmdList.length}) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="lotrinh" data-lotrinh-track="dgmd" title="Mở lộ trình ${modDgmdCount} module nhánh Đại Gia Mang Dép">Lộ trình (${modDgmdCount}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          <button type="button" class="filter-btn text-xs" data-open-tab="tai-lieu" data-doc-branch="DGMD" title="Mở ${docsDgmdCount} tài liệu nhánh Đại Gia Mang Dép">Tài liệu (${docsDgmdCount}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 w-full pt-2 border-t border-hairline">
      <span class="text-xs font-mono text-gray-400 mr-1">Đi nhanh hệ sinh thái:</span>
      <button type="button" class="filter-btn text-xs" data-open-tab="ngachxanh" title="Khám phá ${nx.ngachXanh.length} ngách trụ cột và ${subNichesCount} vi ngách">Ngách xanh (${nx.ngachXanh.length} ngách · ${subNichesCount} vi ngách) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
      <button type="button" class="filter-btn text-xs" data-open-tab="rawkenh" title="Mở ${rawCount} hồ sơ Raw kênh và ${rawDeepCount} phân tích chuyên sâu Voice DNA">Raw kênh (${rawCount} hồ sơ · ${rawDeepCount} deep) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
      <button type="button" class="filter-btn text-xs" data-open-tab="nhac" title="Mở kho ${musicCount} bản nhạc nền (${musicSafeCount} bài SAFE YPP)">Nhạc nền (${musicSafeCount}/${musicCount} SAFE YPP) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
      <button type="button" class="filter-btn text-xs js-open-music-studio" title="Bật trình phát nhạc nền nổi (Mini Music Studio)">Phát nhạc ngay <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
      <button type="button" class="filter-btn text-xs" data-open-tab="nguonreup" title="Mở ${reupCount} nguồn tư liệu reup, footage và công cụ">Nguồn reup (${reupCount} nguồn) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
      <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="all" title="Mở quy trình ${clStepsCount} bước A-Z, Ma trận ${allSystemVideos.length} bài và 12 cổng YPP">Chiến lược (${clStepsCount} bước · Ma trận ${allSystemVideos.length} bài) <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
    </div>
  </div>
  ${(function () {
      const w = loadWatched();
      let watched = 0, inprog = 0;
      allSystemVideos.forEach(v => {
        const r = w[v.sku];
        if (!r) return;
        const ratio = (r.d && r.t) ? r.t / r.d : 0;
        if (r.watched || ratio >= 0.95) watched++;
        else if (ratio > 0.02) inprog++;
      });
      const pct = Math.round((watched / (allSystemVideos.length || 1)) * 100);
      return `<div class="card p-4 mb-6 border-border-strong bg-surface">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-2.5">
    <div class="flex items-center gap-2 text-sm font-semibold text-fg">
      <span class="text-xs font-mono text-brand-ink font-semibold">Tiến độ học (3 nhánh)</span>
      <span class="text-xs text-gray-500">·</span>
      <span class="badge badge-green">Đã xem ${watched}/${allSystemVideos.length} bài (${pct}%)</span>
      ${inprog ? `<span class="badge badge-amber">${inprog} bài đang dở</span>` : ''}
    </div>
    ${(watched || inprog) ? `<button type="button" class="overview-link gap-1" data-open-tab="video" data-video-track="all" data-watch-filter="started" data-free-only="false"><span>Xem video đã xem / đang dở</span><span class="font-mono">→</span></button>` : ''}
  </div>
  <div class="w-full h-2 bg-surface-2 progress-track overflow-hidden" style="border-radius:2px">
    <div class="h-full bg-brand" style="width:${pct}%;border-radius:2px;transition:width 0.5s ease;"></div>
  </div>
</div>`;
    })()}
  ${(function () {
      const showAllRecent = Boolean(state.tatcaRecentExpanded);
      const taggedRecent = []
        .concat(videos.map((v, idx, arr) => Object.assign({}, v, { _branch: 'H2DEV', _track: 'h2dev', _badge: 'badge-muted', _tail: (idx + 1) / (arr.length || 1) })))
        .concat(huanList.map((v, idx, arr) => Object.assign({}, v, { _branch: 'HUÂN', _track: 'huan', _badge: 'badge-amber', _tail: (idx + 1) / (arr.length || 1) })))
        .concat(dgmdList.map((v, idx, arr) => Object.assign({}, v, { _branch: 'DGMD', _track: 'dgmd', _badge: 'badge-blue', _tail: (idx + 1) / (arr.length || 1) })));
      taggedRecent.sort((a, b) => {
        const dA = String(a.ingested_at || a.published_at || '');
        const dB = String(b.ingested_at || b.published_at || '');
        if (dB !== dA) return dB.localeCompare(dA);
        const pA = String(a.published_at || '');
        const pB = String(b.published_at || '');
        if (pB !== pA) return pB.localeCompare(pA);
        return b._tail - a._tail;
      });
      const recentPool = taggedRecent.slice(0, 12);
      const visibleRecent = showAllRecent ? recentPool : recentPool.slice(0, 6);
      const latestDate = recentPool[0] && (recentPool[0].ingested_at || recentPool[0].published_at) ? String(recentPool[0].ingested_at || recentPool[0].published_at) : '';
      return `<div class="card p-4 sm:p-5 mb-6 border-border-strong bg-surface">
  <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-green">MỚI CẬP NHẬT</span>
      <h2 class="page-h2 mb-0">Bài học mới cập nhật gần nhất</h2>
      ${latestDate ? `<span class="text-xs font-mono text-gray-400">· Cập nhật đến ${esc(latestDate)}</span>` : ''}
    </div>
    <button type="button" class="overview-link flex items-center gap-1 mt-0" data-open-tab="video" data-video-track="all" title="Xem toàn bộ ${allSystemVideos.length} video mới nhất">
      <span>Mở kho ${allSystemVideos.length} video</span>
      <span class="font-mono">→</span>
    </button>
  </div>
  <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
    ${visibleRecent.map(v => {
      const modLabel = v.module_id || v.category_name || v._branch;
      const pubDate = v.ingested_at || v.published_at || '';
      const dur = v.duration || '';
      const vUrl = '/lotrinh/' + encodeURIComponent(v.sku);
      return `<div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between gap-2 min-w-0">
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="badge ${v._badge}">${esc(v._branch)}</span>
              <span class="text-xs font-mono text-gray-400 truncate">${esc(v.sku)}${modLabel ? ' · ' + esc(modLabel) : ''}</span>
            </div>
            ${dur ? `<span class="text-xs font-mono text-gray-400 shrink-0">${esc(dur)}</span>` : ''}
          </div>
          <a href="${vUrl}" class="text-sm font-bold text-white hover:text-brand-300 line-clamp-2 transition-colors" title="${esc(v.title || v.sku)}">${esc(v.title || v.sku)}</a>
        </div>
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-hairline text-xs">
          <span class="font-mono text-gray-400 truncate">${pubDate ? 'Ngày: ' + esc(pubDate) : esc(v.contentNiche || v.niche || '')}</span>
          <a href="${vUrl}" class="text-brand-300 hover:text-white font-semibold shrink-0 inline-flex items-center gap-1 h2-inline-action">Học ngay <span class="font-mono">↗</span></a>
        </div>
      </div>`;
    }).join('')}
  </div>
  ${recentPool.length > 6 ? `<div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-hairline">
    <button type="button" class="overview-link flex items-center gap-1 mt-0" data-toggle-tatca-list="recent" aria-expanded="${showAllRecent ? 'true' : 'false'}"><span>${showAllRecent ? 'Thu gọn danh sách mới cập nhật' : `Xem thêm ${recentPool.length - 6} bài mới cập nhật`}</span><span class="font-mono">${showAllRecent ? '▴' : '▾'}</span></button>
    <button type="button" class="overview-link flex items-center gap-1 mt-0 text-gray-400 hover:text-white" data-open-tab="lotrinh" data-lotrinh-track="all"><span>Mở Lộ trình ${moduleCount} module</span><span class="font-mono">→</span></button>
  </div>` : ''}
</div>`;
    })()}
  <div class="grid md:grid-cols-2 gap-6 overview-grid">
<div class="card p-4 sm:p-5">
  <div class="flex items-center justify-between gap-2 mb-1">
    <h2 class="page-h2 mb-0">Thị trường đã gắn (3 nhánh)</h2>
    <span class="text-xs font-mono text-gray-400">${marketRows.length} thị trường · ${allSystemVideos.length} SKU</span>
  </div>
  <p class="card-note">${emptyMarket ? `Thanh = tỉ lệ trên tổng kho · ${emptyMarket} chưa gắn` : `Tỉ trọng thị trường trên ${allSystemVideos.length} bài (1 bài có thể gắn đa thị trường · bấm để lọc)`}</p>
  <div class="market-list">
    ${(function () {
      const visibleMarkets = showAllMarkets ? marketRows : marketRows.slice(0, 6);
      const maxC = Math.max(1, ...marketRows.map(r => r[1]));
      const rows = visibleMarkets.map(([k, c]) => {
        const cleanK = stripDecorEmoji(k);
        return `
      <button type="button" class="market-row cursor-pointer hover:bg-surface-2/60 px-2 rounded-xl transition-colors w-full text-left" data-open-tab="video" data-video-track="all" data-market-filter="${k === 'Chưa gắn' ? '__EMPTY__' : esc(k)}" title="Xem ${c} video thị trường ${esc(cleanK)}">
        <span class="market-label" title="${esc(cleanK)}">${esc(cleanK)}</span>
        <div class="market-bar" aria-hidden="true"><i style="width:${Math.max(4, Math.round(c / maxC * 100))}%"></i></div>
        <span class="market-n">${SC.pad2(c)}</span>
      </button>`;
      }).join('');
      return rows;
    })()}
  </div>
  ${marketRows.length > 6 ? `<div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-hairline">
    <button type="button" class="overview-link flex items-center gap-1 mt-0" data-toggle-tatca-list="markets" aria-expanded="${showAllMarkets ? 'true' : 'false'}"><span>${showAllMarkets ? 'Thu gọn danh sách thị trường' : `Xem thêm ${marketRows.length - 6} thị trường`}</span><span class="font-mono">${showAllMarkets ? '▴' : '▾'}</span></button>
    <button type="button" class="overview-link flex items-center gap-1 mt-0 text-gray-400 hover:text-white" data-open-tab="video" data-video-track="all"><span>Mở bộ lọc Video</span><span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
  </div>` : ''}
</div>
<div class="card p-4 sm:p-5">
  <div class="flex items-center justify-between gap-2 mb-1">
    <h2 class="page-h2 mb-0">Ngách trong kho</h2>
    <span class="text-xs font-mono text-brand-ink font-semibold">${nx.ngachXanh.length} ngách · ${subNichesCount} vi ngách</span>
  </div>
  <p class="card-note">Xếp hạng theo số video thực tế trong kho 3 nhánh (bấm để lọc bài học)</p>
  <div class="niche-list">
    ${overviewNiches.map((n, ni) => {
      const skuList = (nicheLiveSkusList && Array.isArray(nicheLiveSkusList[ni]) && nicheLiveSkusList[ni].length)
        ? nicheLiveSkusList[ni]
        : safeArray(n.skus).map(s => typeof s === 'string' ? s : (s && s.sku));
      const nLive = nicheLives[ni];
      const isGreen = n.xanh === true;
      const rank = ni + 1;
      const risk = !isGreen ? (n.xanh === 'CÓ ĐIỀU KIỆN' ? 'CÓ ĐK' : n.xanh === 'THẬN TRỌNG' ? 'THẬN TRỌNG' : n.xanh === 'CÓ MẪU TĂNG' ? 'CÓ MẪU' : (n.xanh && n.xanh !== true ? String(n.xanh) : '')) : '';
      const maxLive = maxNicheLive;
      const livePct = nLive ? Math.max(8, Math.round((nLive / maxLive) * 100)) : 0;
      const fullNicheLabel = `${n.code ? n.code + ' · ' : ''}${n.ngach}${risk ? ' (' + risk + ')' : ''}`;
      return `<button type="button" class="niche-row${rank <= 3 ? ' niche-row-top' : ''} cursor-pointer hover:bg-surface-2/60 px-2 rounded-xl transition-colors w-full text-left" data-open-tab="video" data-video-track="all" data-open-niche="${esc(n.ngach)}" data-skus="${esc(skuList.join(','))}" title="Lọc ${nLive} video ngách ${esc(fullNicheLabel)}">
        <span class="niche-name" title="${esc(fullNicheLabel)}">${n.code ? `<span class="font-mono text-xs text-brand-300 mr-1">${esc(n.code)}</span>` : ''}${esc(n.ngach)}${risk ? ` <span class="niche-risk">${esc(risk)}</span>` : ''}</span>
        <div class="market-bar niche-bar" aria-hidden="true"><i style="width:${livePct}%"></i></div>
        <span class="niche-n">${nLive ? SC.pad2(nLive) : '00'}</span>
      </button>`;
    }).join('')}
  </div>
  ${allNichePairs.length > 6 ? `<div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-hairline">
    <button type="button" class="overview-link flex items-center gap-1 mt-0" data-toggle-tatca-list="niches" aria-expanded="${showAllNiches ? 'true' : 'false'}"><span>${showAllNiches ? 'Thu gọn danh sách ngách' : `Xem thêm ${allNichePairs.length - 6} ngách trong kho`}</span><span class="font-mono">${showAllNiches ? '▴' : '▾'}</span></button>
    <button type="button" class="overview-link flex items-center gap-1 mt-0" data-open-tab="ngachxanh"><span>Mở tab ${nx.ngachXanh.length} Ngách xanh</span><span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
  </div>` : ''}
</div>
  </div>
  <div class="card p-4 sm:p-5 mt-6">
<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
  <div class="flex items-center gap-2">
    <span class="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">QUAN TRỌNG</span>
    <h2 class="page-h2 mb-0">Chính sách YouTube phải nhớ</h2>
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <button type="button" class="filter-btn text-xs" data-quick-action="cross-tab" data-quick-target="chienluoc" data-quick-section="cl-checklist-12" data-quick-patch='{"clSubTab":"policy"}'>Mở Checklist 12 Cổng Trước Khi Đăng <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span></button>
    <button type="button" class="filter-btn text-xs" data-open-tab="sodo" data-sodo-node="policy:P01">Sơ đồ Chính sách <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
  </div>
</div>
<ol class="policy-list">
  ${(nx.thongTinChinhSach2026 || []).map((s, i) => {
    const pCode = 'P' + String(i + 1).padStart(2, '0');
    const citedSkus = [...new Set((String(s || '').match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+|HUAN-M\d{2}-L\d{2}|DGMD-M\d{2}-L\d{2})\b/g) || []))];
    const citedHandles = extractKnownHandles(s, kmHandleSet);
    return `<li class="policy-item"><span class="policy-i">${String(i + 1).padStart(2, '0')}</span><div class="min-w-0 flex-1"><button type="button" class="policy-toggle" aria-expanded="false" title="${esc(s)}"><span class="policy-text" title="${esc(s)}">${esc(s)}</span><span class="policy-more" hidden>Xem đầy đủ ▾</span></button><div class="policy-links mt-2 flex flex-wrap items-center gap-1.5" hidden><button type="button" class="filter-btn text-xs" data-sodo-jump="policy:${pCode}">Sơ đồ ${pCode} ↗</button><button type="button" class="filter-btn text-xs" data-quick-action="cross-tab" data-quick-target="chienluoc" data-quick-section="policy-item-${pCode}" data-quick-patch='{"clSubTab":"policy"}'>Chi tiết ${pCode} →</button>${citedSkus.map(sku => `<a href="/lotrinh/${encodeURIComponent(sku)}" class="filter-btn text-xs text-brand-300">${esc(sku)} ▶</a>`).join('')}${citedHandles.map(handle => `<button type="button" class="filter-btn text-xs text-amber-300" data-open-tab="kenh-mau" data-kenh-handle="${esc(handle)}" title="Mở hồ sơ kênh ${esc(handle)}">${esc(handle)} ↗</button>`).join('')}</div></div></li>`;
  }).join('')}
</ol>
  </div>`;
}

/* UI-fix 2026-10-09 (data): `file` cua tai lieu co the la dia chi web (6 muc cong cu, vd https://coverr.co/). Chi tinh la "file local" khi la duong dan tren dia. */
function isLocalDocFile(f) {
  return typeof f === 'string' && f.length > 0 && !/^https?:\/\//i.test(f);
}

function videoCard(v) {
  const markets = [...new Set(safeArray(v.market).map(normMarket).filter(Boolean))];
  const channels = safeArray(v.channels);
  const docs = safeArray(v.docs);
  const isDgmd = Boolean(v.isDgmd);
  const isHuan = Boolean(v.isHuan || v.platform === 'huan.academy');
  const isFree = Boolean(v.free ?? v.is_free);
  const lock = isFree ? '<span class="badge badge-green">FREE</span>' : '<span class="badge badge-red">PRO</span>';
  const newBadge = isRecentlyIngestedVideo(v)
    ? '<span class="badge badge-green" title="' + (v.ingested_at ? 'Bài học mới cập nhật (' + esc(v.ingested_at) + ')' : 'Bài học mới cập nhật') + '">MỚI</span>'
    : '';
  const curBadge = v.badge === 'QUAN TRỌNG'
    ? '<span class="badge badge-red">' + ico('star', 14) + ' QUAN TRỌNG</span>'
    : '';
  const trackBadge = state.videoTrack === 'all'
    ? (isHuan
        ? '<span class="badge badge-amber">HUÂN</span>'
        : (isDgmd
            ? '<span class="badge badge-blue">DGMD</span>'
            : '<span class="badge badge-muted">H2DEV</span>'))
    : '';
  const drm = (isDgmd || isHuan || Boolean(v.mp4) || Boolean(v.local))
    ? '<span class="badge badge-blue">MP4</span>'
    : ((v.drm ?? v.is_drm) ? '<span class="badge badge-amber">DRM</span>' : '<span class="badge badge-blue">HLS</span>');
  const resBadge = (v.resolution === '4K' || Number(v.width) >= 3840)
    ? '<span class="badge badge-amber" title="Độ phân giải Ultra HD 4K">4K</span>'
    : ((v.resolution === '2K' || (Number(v.width) >= 2560 && Number(v.width) < 3840))
        ? '<span class="badge badge-blue" title="Độ phân giải QHD 2K">2K</span>'
        : '');
  const notDownloaded = (!v.size && !v.size_mb) ? '<span class="badge badge-red" title="MP4 0 byte — tải lại từ nguồn gốc">Chưa tải</span>' : '';
  const wb = watchedBadge(v.sku);
  const wp = watchedProgress(v.sku);
  const resume = watchedResumeLabel(v.sku);
  const vUrl = '/lotrinh/' + encodeURIComponent(v.sku);
  const playBtn = resume
    ? `<a href="${vUrl}" class="btn-press flex-1 text-center btn-primary text-xs font-bold py-2.5 min-h-[38px] flex items-center justify-center transition-colors">${resume}</a>`
    : `<a href="${vUrl}" class="btn-press flex-1 text-center btn-primary text-xs font-bold py-2.5 min-h-[38px] flex items-center justify-center transition-colors">Xem bài</a>`;
  const rawNiche = v.contentNiche || v.niche || v.category_name || 'Khác';
  const canonCode = (v.nicheCode && /^H\d{2}$/i.test(String(v.nicheCode).trim()))
    ? String(v.nicheCode).trim().toUpperCase()
    : ((Array.isArray(v.nicheCodes) && v.nicheCodes.find(c => /^H\d{2}$/i.test(String(c || '').trim()))) || '').toUpperCase();
  const shortNiche = (() => {
    const s = String(rawNiche || '').trim();
    if (s.length <= 36) return s;
    const noParen = s.replace(/\s*\([^)]*\)/g, '').trim();
    if (noParen && noParen.length <= 36) return noParen;
    const parts = (noParen || s).split(/\s*(?:\/|&|—|-)\s*/).filter(Boolean);
    if (parts.length >= 2) {
      const two = parts.slice(0, 2).join(' / ');
      if (two.length <= 36) return two;
    }
    if (parts[0] && parts[0].length <= 36) return parts[0];
    return (noParen || s).slice(0, 34).trim() + '…';
  })();
  const nicheChipLabel = canonCode && !shortNiche.toUpperCase().startsWith(canonCode)
    ? `${canonCode} · ${shortNiche}`
    : shortNiche;
  const nicheFilterTarget = canonCode || rawNiche;
  const modFilterTarget = (v.module_title || v.category_name || v.module_id || '').trim();
  const dateLabel = v.ingested_at || v.published_at || '';
  const metaMid = [
    v.module_id ? `<button type="button" data-action="video-card-module" data-mod="${esc(modFilterTarget)}" class="text-gray-400 hover:text-brand-300 font-mono shrink-0 transition-colors cursor-pointer" title="Lọc theo học phần: ${esc(v.module_title || v.category_name || v.module_id)}">${esc(v.module_id)}</button>` : '',
    dateLabel ? '<span class="text-gray-400 font-mono shrink-0" title="' + (v.ingested_at ? 'Ngày cập nhật: ' + esc(v.ingested_at) : 'Ngày đăng: ' + esc(v.published_at)) + '">' + esc(dateLabel) + '</span>' : ''
  ].filter(Boolean).map(seg => '<span class="text-gray-600">·</span>' + seg).join('');
  const safeThumb = safeUrl(v.image || v.thumb) || 'assets/thumbs/placeholder.svg';
  const safeOrigin = safeExternalUrl(v.origin);
  return `<div class="card interactive-card overflow-hidden min-w-0 flex flex-col justify-between group">
<div>
  <a href="${vUrl}" class="relative block aspect-video bg-black overflow-hidden" title="Xem: ${esc(v.title)}">
    <img src="${esc(safeThumb)}" alt="Thumbnail: ${esc(v.title)}" width="320" height="180" data-img-fallback="placeholder" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async">
    <div class="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1 pointer-events-none">${trackBadge}${newBadge}${curBadge}${lock}${drm}${resBadge}${wb}${notDownloaded}</div>
    ${channels.length ? '<div class="absolute bottom-2.5 left-2.5 badge badge-blue pointer-events-none">' + channels.length + ' kênh</div>' : ''}
    ${v.duration ? '<div class="absolute bottom-2.5 right-2.5 badge badge-muted font-mono pointer-events-none">' + esc(v.duration) + '</div>' : ''}
    <span class="h2-play-badge"><span class="rounded-full text-white flex items-center justify-center" style="width:44px;height:44px;background:rgba(226,2,58,0.9);box-shadow:0 8px 24px rgba(0,0,0,0.45);">${ico('play', 20)}</span></span>
    ${wp}
  </a>
  <div class="p-4 min-w-0">
    <a href="${vUrl}" title="${esc(v.title)}" class="block text-base font-bold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere] group-hover:text-brand-300 transition-colors font-heading">${(window.H2Core && H2Core.escTitle ? H2Core.escTitle : esc)(v.title)}</a>
    <div class="flex flex-wrap gap-1.5 mt-2.5 min-w-0 items-center">
      <button type="button" data-action="video-card-niche" data-niche="${esc(nicheFilterTarget)}" class="badge ${v.contentNiche || canonCode ? 'badge-green' : 'badge-muted'} text-xs hover:text-white transition cursor-pointer" title="Lọc theo ngách: ${esc(canonCode ? canonCode + ' — ' + rawNiche : rawNiche)}">${esc(nicheChipLabel)}</button>
      ${markets.map(m => `<button type="button" data-market-chip="${esc(m)}" class="text-xs text-gray-400 hover:text-brand-300 font-medium transition-colors cursor-pointer" title="Lọc theo thị trường ${esc(stripDecorEmoji(m))}">${esc(stripDecorEmoji(m))}</button>`).join('<span class="text-gray-600 text-xs">·</span>')}
    </div>
    <div class="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-gray-400">
      <span class="text-gray-300 font-mono font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title="${esc(v.sku)}">${esc(v.sku)}</span>
      ${metaMid}
      ${docs.length ? `<button type="button" class="ml-auto flex items-center gap-1 text-sky-400 hover:text-white font-medium shrink-0 whitespace-nowrap transition-colors cursor-pointer btn-open-video-sub" data-sku="${esc(v.sku)}" data-vid="${esc(v.sku)}" data-title="${esc(v.title)}" data-channel="${esc(isHuan ? 'Huân Academy' : (isDgmd ? 'Đại Gia Mang Dép' : 'H2DEV Faceless'))}" data-views="${esc(v.duration || '')}" data-init-tab="summary" title="Mở nhanh ${docs.length} Tài liệu & SOP đính kèm bài học ${esc(v.sku)}"><span class="w-1.5 h-1.5 bg-sky-400 rounded-full"></span> ${docs.length} TL</button>` : ''}
    </div>
  </div>
</div>
<div class="px-4 pb-4 pt-1 flex items-center gap-1.5 video-card-actions">
  ${playBtn}
  <button type="button" class="btn-press btn-open-video-sub px-2.5 min-h-[38px] flex items-center justify-center bg-ink-800 hover:bg-ink-700 text-xs text-amber-300 rounded-xl border border-ink-600/80 transition-colors shrink-0" data-sku="${esc(v.sku)}" data-vid="${esc(v.sku)}" data-title="${esc(v.title)}" data-channel="${esc(isHuan ? 'Huân Academy' : (isDgmd ? 'Đại Gia Mang Dép' : 'H2DEV Faceless'))}" data-views="${esc(v.duration || '')}" title="Xem phụ đề & tóm tắt bài học ${esc(v.sku)}">Phụ đề</button>
  <button type="button" class="btn-press px-2.5 min-h-[38px] flex items-center justify-center bg-ink-800 hover:bg-ink-700 text-xs text-sky-300 rounded-xl border border-ink-600/80 transition-colors shrink-0" data-sodo-jump="video:${esc(v.sku)}" title="Xem liên kết bài học ${esc(v.sku)} trên Sơ đồ DB">Sơ đồ</button>
  ${safeOrigin ? `<a href="${esc(safeOrigin)}" target="_blank" rel="noopener noreferrer" class="btn-press w-9 min-h-[38px] flex items-center justify-center bg-ink-800 hover:bg-ink-700 text-xs rounded-xl border border-ink-600/80 transition-colors shrink-0" title="${isDgmd ? 'Trang gốc DGMD' : (isHuan ? 'Trang gốc Huân Academy' : 'Trang gốc H2Dev')}" aria-label="Trang gốc">↗</a>` : ''}
</div>
  </div>`;
}

function trimSearchPhrase(str, maxLen) {
  const s = String(str || '').trim();
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= 16 ? cut.slice(0, lastSpace) : cut).trim();
}

function buildVideoSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const videos = window._allVideos || [];
  const insights = window._videoInsights || {};
  const suggestions = [];
  const seenKeys = new Set();

  for (const v of videos) {
    const sku = v.sku;
    const ins = insights[sku] || {};
    const title = v.title || '';
    const actualTopic = ins.actual_topic || '';
    const niche = v.contentNiche || v.niche || ins.niche_primary || '';
    const modId = String(v.module_id || '').trim();
    const modTitle = String(v.module_title || v.category_name || '').trim();
    const lessonCode = (modId && v.seq != null) ? `${modId}-L${String(v.seq).padStart(2, '0')}` : '';
    const nicheCodeStr = [v.nicheCode || '', ...(Array.isArray(v.nicheCodes) ? v.nicheCodes : [])].filter(Boolean).join(' ');

    // 1. Match Video Title / SKU / Module ID / Lesson Code / Niche Code / Actual Topic
    if (
      SC.includes(title, q) ||
      SC.includes(sku, q) ||
      SC.includes(actualTopic, q) ||
      (modId && SC.includes(modId, q)) ||
      (modTitle && SC.includes(modTitle, q)) ||
      (lessonCode && SC.includes(lessonCode, q)) ||
      (nicheCodeStr && SC.includes(nicheCodeStr, q))
    ) {
      const vKey = 'vid:' + sku;
      if (!seenKeys.has(vKey)) {
        seenKeys.add(vKey);
        const exactCodeMatch = sku.toLowerCase() === q || modId.toLowerCase() === q || lessonCode.toLowerCase() === q || String(v.nicheCode || '').toLowerCase() === q;
        suggestions.push({
          type: 'lesson',
          icon: 'graduation-cap',
          badge: lessonCode || modId || sku,
          badgeColor: 'bg-brand-950/60 text-brand-300 border-brand-800/60',
          title: title,
          sub: `${sku}${modId ? ' · ' + modId : ''} · ${actualTopic || niche} · ${v.duration || ''}`,
          searchTerm: exactCodeMatch ? (modId.toLowerCase() === q ? modId : (lessonCode.toLowerCase() === q ? lessonCode : sku)) : title,
          sku: sku,
          directUrl: `/lotrinh/${encodeURIComponent(sku)}`,
          btnLabel: 'Xem bài ↗',
          priority: exactCodeMatch || title.toLowerCase().startsWith(q) ? 100 : 85
        });
      }
    }

    // 2. Match Timestamps (Mốc tua nhanh)
    const timestamps = ins.key_timestamps || [];
    for (const ts of timestamps) {
      const tsTitle = ts.label || ts.title || '';
      const tsTime = ts.time || '';
      if (SC.includes(tsTitle, q) || tsTime.includes(q)) {
        const tsKey = 'ts:' + sku + ':' + tsTime;
        if (!seenKeys.has(tsKey)) {
          seenKeys.add(tsKey);
          const sec = ts.seconds || 0;
          suggestions.push({
            type: 'timestamp',
            icon: 'timer',
            badge: tsTime,
            badgeColor: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
            title: `${tsTime} — ${tsTitle}`,
            sub: `Bài học: ${title} (${sku})`,
            searchTerm: tsTitle,
            sku: sku,
            directUrl: `/lotrinh/${encodeURIComponent(sku)}?t=${sec}`,
            btnLabel: `▶ Tua đến ${tsTime}`,
            priority: 95
          });
        }
      }
    }

    // 3. Match Key Takeaways & Edit SOP
    const takeaways = ins.key_takeaways || [];
    for (const tk of takeaways) {
      if (SC.includes(tk, q)) {
        const tkKey = 'tk:' + sku + ':' + tk.slice(0, 30);
        if (!seenKeys.has(tkKey)) {
          seenKeys.add(tkKey);
          suggestions.push({
            type: 'takeaway',
            icon: 'pin',
            badge: 'Mấu Chốt',
            badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
            title: tk,
            sub: `Bài học: ${title} (${sku})`,
            searchTerm: trimSearchPhrase(tk, 44),
            sku: sku,
            directUrl: `/lotrinh/${encodeURIComponent(sku)}`,
            btnLabel: 'Xem bài ↗',
            priority: 80
          });
        }
      }
    }

    // 4. Match Avoid Flags
    const avoidFlags = ins.avoid_flags || [];
    for (const af of avoidFlags) {
      if (SC.includes(af, q)) {
        const afKey = 'af:' + sku + ':' + af.slice(0, 30);
        if (!seenKeys.has(afKey)) {
          seenKeys.add(afKey);
          suggestions.push({
            type: 'avoid',
            icon: 'alert-triangle',
            badge: 'Cảnh Báo YPP',
            badgeColor: 'bg-red-950/60 text-red-300 border-red-800/60',
            title: af,
            sub: `Cảnh báo YPP: ${title} (${sku})`,
            searchTerm: trimSearchPhrase(af, 44),
            sku: sku,
            directUrl: `/lotrinh/${encodeURIComponent(sku)}`,
            btnLabel: 'Xem bài ↗',
            priority: 75
          });
        }
      }
    }

    // 5. Match Channels Mentioned
    const chList = v.channels || [];
    for (const rawCh of chList) {
      const chText = typeof rawCh === 'string'
        ? rawCh
        : [rawCh && rawCh.name, rawCh && rawCh.handle].filter(Boolean).join(' — ').trim();
      const chTerm = typeof rawCh === 'string'
        ? rawCh
        : ((rawCh && (rawCh.handle || rawCh.name)) || '');
      if (chText && SC.includes(chText, q)) {
        const chKey = 'ch:' + sku + ':' + chText;
        if (!seenKeys.has(chKey)) {
          seenKeys.add(chKey);
          suggestions.push({
            type: 'channel',
            icon: 'tv',
            badge: 'Kênh Mẫu',
            badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
            title: chText,
            sub: `Được tác giả mổ xẻ trong bài: ${title} (${sku})`,
            searchTerm: chTerm || chText,
            sku: sku,
            directUrl: `/lotrinh/${encodeURIComponent(sku)}`,
            btnLabel: 'Xem bài ↗',
            priority: 70
          });
        }
      }
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 8);
}

window.showVideoSearchSuggestions = function(inputVal, _premerged) {
  const box = document.getElementById('video-search-suggestions');
  if (!box) return;
  const q = (inputVal || '').trim();
  if (!q) {
    box.innerHTML = '';
    box.classList.add('hidden');
    return;
  }

  const localItems = buildVideoSearchSuggestions(q);
  // G3: ch?t /api/search ? merge FTS Master DB v?o g?i ? (kh?ng ?? quy)
  if (window.H2Search && !_premerged) {
    window.H2Search.clearFtsNotices(box);
    window.H2Search.fetchApiSearch(q, 6).then(function (res) {
      const fqNow = document.getElementById('fq');
      if (!fqNow || document.activeElement !== fqNow || (fqNow.value || '').trim() !== q) return;
      const ftsRows = (res && res.rows) || [];
      const ftsItems = window.H2Search.ftsToSuggestions(ftsRows);
      /* FIX (uifix88) F3: server 200 + error (enrich) => canh bao, khong duoc nuot. */
      if (res && res.warning) window.H2Search.showFtsNotice(box, res.warning);
      const merged = window.H2Search.mergeSuggestions(localItems, ftsItems, 12);
      window._lastVideoSugItems = merged;
      window._lastVideoSugQuery = q;
      if (!window._videoSugDismissed) window.showVideoSearchSuggestions(inputVal, merged);
    }).catch(function (err) {
      const fqNow = document.getElementById('fq');
      if (!fqNow || document.activeElement !== fqNow || (fqNow.value || '').trim() !== q) return;
      /* FIX (uifix87) LỖI 3: dich vu FTS loi (HTTP >= 400) KHONG duoc im lang nhu "0 ket qua". */
      if (err && err.h2SearchServiceError) {
        window.H2Search.showFtsError(box, err);
        if (!window._videoSugDismissed) window.showVideoSearchSuggestions(inputVal, localItems);
      }
    });
  }
  const notices = (window.H2Search && window.H2Search.ftsNoticesHtml) ? window.H2Search.ftsNoticesHtml(box.id) : '';
  const items = (Array.isArray(_premerged) ? _premerged : localItems);
  if (items.length === 0) {
    /* FIX (uifix88) F4: KHONG duoc hien dong thoi "dang loi - hien thi goi y cuc bo" va
       "Khong tim thay goi y" (mau thuan). Co banner loi/canh bao thi doi thong diep cho dung su that. */
    const hasNotice = !!notices;
    box.innerHTML = notices + (hasNotice
      ? `<div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-bg" role="status"><span>Không có gợi ý cục bộ cho "<strong>${esc(q)}</strong>". Tìm kiếm toàn văn chưa trả về kết quả dùng được.</span></div>`
      : `<div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-bg" ><span>Không tìm thấy gợi ý bài học khớp với "<strong>${esc(q)}</strong>"</span><span class="text-xs text-gray-500 font-mono">Nhấn Enter để lọc</span></div>`);
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = notices + `
    <div class="px-3.5 py-2 bg-surface text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-border">
      <span class="flex items-center gap-1.5"><span class="text-brand-400">${ico('zap', 14)}</span> Gợi ý bài học, mốc tua & kỹ thuật (${items.length})</span>
      <span class="text-gray-500 font-normal">Nhấp để lọc hoặc tua ngay</span>
    </div>
    ${items.map((item, idx) => `
      <div class="js-v-sug-row px-3.5 py-2.5 hover:bg-surface-2 cursor-pointer flex items-center justify-between gap-3 transition-colors group bg-bg" data-idx="${idx}" data-term="${esc(item.searchTerm)}" data-sku="${esc(item.sku || '')}" data-type="${esc(item.type)}" data-url="${esc(item.directUrl || '')}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-base shrink-0">${ico(item.icon, 16)}</span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">${highlightQuery(item.title, q)}</div>
            <div class="text-xs text-gray-400 truncate">${esc(item.sub)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}">${esc(item.badge)}</span>
          ${item.directUrl ? `<a href="${esc(item.directUrl)}" class="js-v-sug-jump text-xs bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow whitespace-nowrap" title="Mở trực tiếp bài học/mốc tua">${esc(item.btnLabel || 'Xem ↗')}</a>` : ''}
        </div>
      </div>
    `).join('')}
  `;
  box.classList.remove('hidden');
};

window.showTabFtsSuggestions = function(inputVal, boxId, inputId, _premerged) {
  const box = document.getElementById(boxId || 'tab-fts-suggestions');
  if (!box) return;
  const comboboxInput = document.getElementById(inputId || 'fq');
  function syncComboExpanded(expanded) {
    if (comboboxInput && comboboxInput.getAttribute('role') === 'combobox') {
      comboboxInput.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (!expanded) comboboxInput.removeAttribute('aria-activedescendant');
    }
  }
  const q = (inputVal || '').trim();
  if (!q || q.length < 2) {
    box.innerHTML = '';
    box.classList.add('hidden');
    syncComboExpanded(false);
    return;
  }
  const isKenhCtx = (boxId === 'kenh-search-suggestions' || box.id === 'kenh-search-suggestions' || (typeof state !== 'undefined' && state.tab === 'kenh-mau'));
  if (window.H2Search && !_premerged) {
    window.H2Search.clearFtsNotices(box);
    const apiOpts = isKenhCtx ? { scope: 'kenh-mau' } : undefined;
    const sugOpts = isKenhCtx ? { contextTab: 'kenh-mau' } : undefined;
    window.H2Search.fetchApiSearch(q, 8, apiOpts).then(function (res) {
      const inpNow = document.getElementById(inputId || 'fq');
      if (!inpNow || document.activeElement !== inpNow || (inpNow.value || '').trim() !== q) return;
      const ftsRows = (res && res.rows) || [];
      const ftsItems = window.H2Search.ftsToSuggestions(ftsRows, sugOpts).filter(it => !it.noDest);
      if (res && res.warning) window.H2Search.showFtsNotice(box, res.warning);
      window._lastTabSugItems = ftsItems;
      window._lastTabSugQuery = q;
      if (!window._videoSugDismissed) window.showTabFtsSuggestions(inputVal, boxId, inputId, ftsItems);
    }).catch(function (err) {
      const inpNow = document.getElementById(inputId || 'fq');
      if (!inpNow || document.activeElement !== inpNow || (inpNow.value || '').trim() !== q) return;
      if (err && err.h2SearchServiceError) {
        window.H2Search.showFtsError(box, err);
        if (!window._videoSugDismissed) window.showTabFtsSuggestions(inputVal, boxId, inputId, []);
      }
    });
    return;
  }
  const notices = (window.H2Search && window.H2Search.ftsNoticesHtml) ? window.H2Search.ftsNoticesHtml(box.id) : '';
  const items = Array.isArray(_premerged) ? _premerged : [];
  if (items.length === 0) {
    if (notices) {
      box.innerHTML = notices;
      box.classList.remove('hidden');
      syncComboExpanded(true);
    } else if (box.id === 'tatca-search-suggestions' && q && q.length >= 2) {
      /* L4-UX-01: show hint row instead of silent hide when tatca search yields no fast suggestions */
      box.setAttribute('role', 'status');
      box.innerHTML = `<div style="padding:0.75rem 1rem; font-size:13px; color:var(--fg-muted); display:flex; align-items:center; gap:0.5rem;">
        ${ico('search', 16)}
        <span>Không tìm thấy gợi ý nhanh — nhấn <kbd style="padding:0.1rem 0.3rem; border:1px solid var(--border-strong); border-radius:4px; font-size:12px; font-family:monospace;">Enter</kbd> để tìm chi tiết</span>
      </div>`;
      box.classList.remove('hidden');
      syncComboExpanded(true);
    } else {
      box.innerHTML = '';
      box.classList.add('hidden');
      syncComboExpanded(false);
    }
    return;
  }
  box.setAttribute('role', 'listbox');
  if (comboboxInput && comboboxInput.getAttribute('role') === 'combobox') {
    comboboxInput.removeAttribute('aria-activedescendant');
  }
  box.innerHTML = notices + `
    <div class="px-3.5 py-2 bg-surface text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-border">
      <span class="flex items-center gap-1.5"><span class="text-brand-400">${ico('zap', 14)}</span> Gợi ý toàn văn FTS5 BM25 (${items.length})</span>
      <span class="text-gray-500 font-normal">Nhấp để mở trực tiếp hoặc nhấn Esc để đóng</span>
    </div>
    ${items.map((item, idx) => `
      <div id="${esc(box.id)}-opt-${idx}" role="option" aria-selected="false" class="js-tab-fts-row px-3.5 py-2.5 hover:bg-surface-2 cursor-pointer flex items-center justify-between gap-3 transition-colors group bg-bg" data-idx="${idx}" data-url="${esc(item.directUrl || '')}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-base shrink-0">${ico(item.icon, 16)}</span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">${highlightQuery(item.title, q)}</div>
            <div class="text-xs text-gray-400 truncate">${esc(item.sub)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}">${esc(item.badge)}</span>
          ${item.altRawUrl ? `<button type="button" class="js-tab-fts-alt filter-btn text-xs" data-url="${esc(item.altRawUrl)}" title="Mở hồ sơ Raw ${esc(item.rawId || '')}">Raw${item.rawId ? ' ' + esc(item.rawId) : ''} ↗</button>` : ''}
          ${item.directUrl ? `<span class="js-tab-fts-jump text-xs bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow whitespace-nowrap">${esc(item.btnLabel || 'Mở ↗')}</span>` : ''}
        </div>
      </div>
    `).join('')}
  `;
  box.classList.remove('hidden');
  syncComboExpanded(true);
};

async function renderVideo() {
  const urlQp = new URLSearchParams(location.search);
  const explicitTrack = urlQp.get('track') || urlQp.get('vbranch') || '';
  if (!state.nicheFilter && urlQp.get('vmod')) state.nicheFilter = urlQp.get('vmod');
  const modHint = String(urlQp.get('vmod') || state.nicheFilter || '').trim().toUpperCase();
  const inferredTrackFromMod = modHint.startsWith('HUAN-M') ? 'huan' : (modHint.startsWith('DGMD-M') ? 'dgmd' : (/^(H2DEV-)?M\d/i.test(modHint) ? 'h2dev' : ''));
  const hasCrossTrackFilter = Boolean(urlQp.get('vq') || urlQp.get('niche') || urlQp.get('vmod') || urlQp.get('skus') || urlQp.get('market') || urlQp.get('recent') || urlQp.get('watch') || urlQp.get('free'));
  const currentTrack = explicitTrack || inferredTrackFromMod || state.videoTrack || (hasCrossTrackFilter ? 'all' : (sessionStorage.getItem('h2dev-video-track') || 'all'));
  state.videoTrack = (currentTrack === 'dgmd' || currentTrack === 'huan' || currentTrack === 'h2dev' || currentTrack === 'all') ? currentTrack : 'all';
  try { sessionStorage.setItem('h2dev-video-track', state.videoTrack); } catch (err) {}

  const [vidsH2, vidsDgmd, vidsHuan, rawNx, insH2, insDgmd, insHuan, modH2dev, modDgmd, modHuan] = await Promise.all([
    loadJSON('data-tabs/videos.json').catch(() => []),
    loadJSON('data/videos_dgmd.json').catch(() => []),
    loadJSON('data/videos_huan.json').catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => null),
    loadJSON('data/video_insights.json').catch(() => ({})),
    loadJSON('data/video_insights_dgmd.json').catch(() => ({})),
    loadJSON('data/video_insights_huan.json').catch(() => ({})),
    loadJSON('data/modules.json').catch(() => ({ modules: [] })),
    loadJSON('data/modules_dgmd.json').catch(() => ({ modules: [] })),
    loadJSON('data/modules_huan.json').catch(() => ({ modules: [] }))
  ]);
  const arrH2Raw = Array.isArray(vidsH2) ? vidsH2 : safeArray(vidsH2 && vidsH2.videos);
  const arrDgmdRaw = safeArray(vidsDgmd);
  const arrHuanRaw = safeArray(vidsHuan);
  const arrH2 = arrH2Raw.map((v, idx, arr) => Object.assign({}, v, { _track: 'h2dev', _tail: (idx + 1) / (arr.length || 1) }));
  const arrDgmd = arrDgmdRaw.map((v, idx, arr) => Object.assign({}, v, { _track: 'dgmd', isDgmd: true, _tail: (idx + 1) / (arr.length || 1) }));
  const arrHuan = arrHuanRaw.map((v, idx, arr) => Object.assign({}, v, { _track: 'huan', isHuan: true, _tail: (idx + 1) / (arr.length || 1) }));
  const allSystemVideos = arrH2.concat(arrHuan, arrDgmd);
  window._allVideos = allSystemVideos;
  window._videoInsights = Object.assign({}, insH2 || {}, insDgmd || {}, insHuan || {});
  let isDgmd = state.videoTrack === 'dgmd';
  let isHuan = state.videoTrack === 'huan';
  let isAllTracks = state.videoTrack === 'all';
  let videos = isAllTracks ? allSystemVideos : (isHuan ? arrHuan : (isDgmd ? arrDgmd : arrH2));
  const exactNicheToSkus = {};
  const macroToSkus = {};
  const canonicalNiches = [];
  const canonicalByCode = new Map();
  const canonicalByOption = new Map();
  if (rawNx && Array.isArray(rawNx.ngachXanh)) {
    rawNx.ngachXanh.forEach((x, idx) => {
      const code = String(x.code || x.id || ('H' + String(x.legacyHang || x.hang || (idx + 1)).padStart(2, '0'))).trim().toUpperCase();
      const name = String(x.ngach || '').trim();
      const rawKey = name.toLowerCase();
      const optionVal = `${code} — ${name}`;
      const macro = (nicheKeyFor(x.ngach) || x.ngach || '').toLowerCase();
      if (rawKey && !exactNicheToSkus[rawKey]) exactNicheToSkus[rawKey] = new Set();
      if (macro && !macroToSkus[macro]) macroToSkus[macro] = new Set();
      const skuSet = new Set();
      (x.skus || []).forEach(s => {
        const skuVal = (typeof s === 'string' ? s : (s && s.sku) || '').toLowerCase();
        if (!skuVal) return;
        skuSet.add(skuVal);
        if (rawKey) exactNicheToSkus[rawKey].add(skuVal);
        if (macro) macroToSkus[macro].add(skuVal);
      });
      if (name) {
        const item = { code, name, rawKey, optionVal, skus: skuSet };
        canonicalNiches.push(item);
        canonicalByCode.set(code.toLowerCase(), item);
        canonicalByOption.set(optionVal.toLowerCase(), item);
      }
    });
    canonicalNiches.sort((a, b) => a.code.localeCompare(b.code));
  }
  if (rawNx && Array.isArray(rawNx.ngachMetaKho)) {
    rawNx.ngachMetaKho.forEach(x => {
      if (!x) return;
      const name = String(x.ngach || '').trim();
      const rawKey = name.toLowerCase();
      const macro = (nicheKeyFor(x.ngach) || x.ngach || '').toLowerCase();
      if (rawKey && !exactNicheToSkus[rawKey]) exactNicheToSkus[rawKey] = new Set();
      if (macro && !macroToSkus[macro]) macroToSkus[macro] = new Set();
      (x.skus || []).forEach(s => {
        const skuVal = (typeof s === 'string' ? s : (s && s.sku) || '').toLowerCase();
        if (!skuVal) return;
        if (rawKey) exactNicheToSkus[rawKey].add(skuVal);
        if (macro) macroToSkus[macro].add(skuVal);
      });
    });
  }
  const moduleIdByTitle = new Map();
  allSystemVideos.forEach(v => {
    const t = (v.module_title || v.category_name || '').trim();
    const id = (v.module_id || '').trim();
    if (t && id && !moduleIdByTitle.has(t)) moduleIdByTitle.set(t, id);
  });
  let urlNeedsSync = false;
  if (state.nicheFilter) {
    const nfRaw = String(state.nicheFilter).trim().toLowerCase().replace(/^h2dev-/, '');
    const matchedModVid = videos.find(v => String(v.module_id || '').trim().toLowerCase() === nfRaw)
      || allSystemVideos.find(v => String(v.module_id || '').trim().toLowerCase() === nfRaw);
    if (matchedModVid) {
      if (state.videoTrack !== 'all' && matchedModVid._track && matchedModVid._track !== state.videoTrack) {
        state.videoTrack = matchedModVid._track;
        try { sessionStorage.setItem('h2dev-video-track', state.videoTrack); } catch (err) {}
        isDgmd = state.videoTrack === 'dgmd';
        isHuan = state.videoTrack === 'huan';
        isAllTracks = state.videoTrack === 'all';
        videos = isAllTracks ? allSystemVideos : (isHuan ? arrHuan : (isDgmd ? arrDgmd : arrH2));
        urlNeedsSync = true;
      }
      const resolvedModTitle = (matchedModVid.module_title || matchedModVid.category_name || '').trim();
      if (resolvedModTitle && state.nicheFilter !== resolvedModTitle) {
        state.nicheFilter = resolvedModTitle;
        urlNeedsSync = true;
      }
    }
  }
  if (state.marketFilter && state.marketFilter !== '__EMPTY__') {
    const nm = normMarket(state.marketFilter);
    if (nm && state.marketFilter !== nm) {
      state.marketFilter = nm;
      urlNeedsSync = true;
    }
  }
  if (state.sortBy === 'views' || state.sortBy === 'popular') { state.sortBy = 'channels'; urlNeedsSync = true; }
  else if (state.sortBy === 'order' || state.sortBy === 'module') { state.sortBy = 'curriculum'; urlNeedsSync = true; }
  const buildMetadataForPool = (pool) => {
    const mNiches = [...new Set([
      ...pool.map(v => nicheKeyFor(v.contentNiche || v.niche || v.category_name || '')),
      ...(rawNx && Array.isArray(rawNx.ngachXanh) ? rawNx.ngachXanh.map(x => nicheKeyFor(x.ngach)) : [])
    ].filter(Boolean))].sort();
    const mSet = new Set(mNiches.map(x => x.toLowerCase()));
    const modNiches = [...new Set(pool.map(v => (v.module_title || v.category_name || '').trim()).filter(Boolean))];
    const modSet = new Set(modNiches.map(x => x.toLowerCase()));
    const micNiches = [...new Set(pool.flatMap(v => [v.contentNiche, v.niche].map(s => (s || '').trim()).filter(s => s && !mSet.has(s.toLowerCase()) && !modSet.has(s.toLowerCase()))))].sort();
    const mktMap = new Map();
    pool.forEach(v => {
      [...new Set(safeArray(v.market).map(normMarket).filter(Boolean))].forEach(m => {
        mktMap.set(m, (mktMap.get(m) || 0) + 1);
      });
    });
    const mkts = [...mktMap.keys()].sort((a, b) => (mktMap.get(b) || 0) - (mktMap.get(a) || 0));
    return { macroNiches: mNiches, macroSet: mSet, moduleNiches: modNiches, moduleSet: modSet, microNiches: micNiches, marketCountMap: mktMap, markets: mkts };
  };
  let { macroNiches, macroSet, moduleNiches, moduleSet, microNiches, marketCountMap, markets } = buildMetadataForPool(videos);
  const filterPool = (pool, mNiches, mSet) => pool.filter(v => {
    const ins = (window._videoInsights && window._videoInsights[v.sku]) || {};
    const modId = String(v.module_id || '').trim();
    const lessonCode = (modId && v.seq != null) ? `${modId}-L${String(v.seq).padStart(2, '0')}` : '';
    const fullSearchText = [
      v.title || '',
      v.sku || '',
      modId,
      lessonCode,
      v.nicheCode || '',
      ...(Array.isArray(v.nicheCodes) ? v.nicheCodes : []),
      v.niche || '',
      v.contentNiche || '',
      v.module_title || '',
      v.category_name || '',
      ...(v.tags || []),
      ins.actual_topic || '',
      ...(ins.key_takeaways || []),
      ...(ins.avoid_flags || []),
      ...(ins.tools_mentioned || []),
      (Array.isArray(ins.edit_sop) ? ins.edit_sop.join(' ') : (typeof ins.edit_sop === 'string' ? ins.edit_sop : (ins.edit_sop?.primary || '') + ' ' + ((ins.edit_sop?.additional || []).join(' ')))),
      ...((ins.key_timestamps || []).map(t => (t.time || '') + ' ' + (t.label || t.title || ''))),
      ...((v.channels || []).map(c => typeof c === 'string' ? c : [c && c.name, c && c.handle].filter(Boolean).join(' ')))
    ].join(' ').toLowerCase();

    if (state.q && !SC.matchesQuery([fullSearchText], state.q)) return false;
    if (state.skuFilter || state.nicheFilter) {
      const vSku = String(v.sku || '').trim().toLowerCase();
      let skuMatched = false;
      if (state.skuFilter) {
        const allow = new Set(String(state.skuFilter).split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
        skuMatched = allow.size > 0 && allow.has(vSku);
      }
      let nicheMatched = false;
      if (state.nicheFilter) {
        const rawTarget = state.nicheFilter.trim();
        const target = rawTarget.toLowerCase();
        const codeMatch = /^h(\d{2})(?:\b|\s|—|-)/i.exec(rawTarget);
        const matchedCanon = (codeMatch && canonicalByCode.get('h' + codeMatch[1]))
          || canonicalByOption.get(target)
          || (!mNiches.includes(rawTarget) ? canonicalNiches.find(c => c.name === rawTarget || (c.rawKey === target && !mSet.has(target))) : null);
        if (matchedCanon) {
          const vContentLower = String(v.contentNiche || '').trim().toLowerCase();
          const vNicheLower = String(v.niche || '').trim().toLowerCase();
          const vCodeUpper = String(v.nicheCode || '').trim().toUpperCase();
          const vCodesUpper = Array.isArray(v.nicheCodes) ? v.nicheCodes.map(c => String(c || '').trim().toUpperCase()) : [];
          nicheMatched = matchedCanon.skus.has(vSku)
            || vContentLower === matchedCanon.rawKey
            || vNicheLower === matchedCanon.rawKey
            || vCodeUpper === matchedCanon.code
            || vCodesUpper.includes(matchedCanon.code);
        } else {
          const vKey = (nicheKeyFor(v.contentNiche || v.niche || v.category_name || '') || '').trim().toLowerCase();
          const allowedMacroSkus = mSet.has(target) ? (macroToSkus[target] || new Set()) : new Set();
          const exactFields = [
            v.contentNiche,
            v.niche,
            v.category_name,
            v.module_title,
            v.module_id,
            ...(mSet.has(target) ? [vKey] : [])
          ].map(x => (x || '').trim().toLowerCase()).filter(Boolean);
          nicheMatched = exactFields.includes(target) || allowedMacroSkus.has(vSku);
        }
      }
      if (state.skuFilter && state.nicheFilter) {
        const rawTarget = state.nicheFilter.trim();
        const target = rawTarget.toLowerCase();
        const codeMatch = /^h(\d{2})(?:\b|\s|—|-)/i.exec(rawTarget);
        const matchedCanon = (codeMatch && canonicalByCode.get('h' + codeMatch[1]))
          || canonicalByOption.get(target)
          || canonicalNiches.find(c => c.rawKey === target);
        const canonKey = matchedCanon ? matchedCanon.rawKey : target;
        const exactMatch = String(v.contentNiche || '').trim().toLowerCase() === canonKey || (exactNicheToSkus[canonKey] && exactNicheToSkus[canonKey].has(vSku));
        if (!skuMatched && !nicheMatched && !exactMatch) return false;
      } else if (state.skuFilter) {
        if (!skuMatched) return false;
      } else if (state.nicheFilter) {
        if (!nicheMatched) return false;
      }
    }
    const vMarkets = safeArray(v.market).map(normMarket).filter(Boolean);
    const rawMktFilter = String(state.marketFilter || '').trim();
    const isAllMkt = !rawMktFilter || /^all$/i.test(rawMktFilter);
    if (rawMktFilter === '__EMPTY__') {
      if (vMarkets.length > 0) return false;
    } else if (!isAllMkt) {
      const mktTokens = /[,_|]/.test(rawMktFilter)
        ? rawMktFilter.split(/[,_|]+/).map(normMarket).filter(Boolean)
        : [normMarket(rawMktFilter)].filter(Boolean);
      if (mktTokens.length && !mktTokens.some(t => vMarkets.includes(t))) {
        return false;
      }
    }
    if (state.freeOnly && !(v.free ?? v.is_free)) return false;
    if (state.recentOnly && !isRecentlyIngestedVideo(v)) return false;
    if (state.watchFilter) {
      const w = loadWatched()[v.sku];
      const ratio = (w && w.d && w.t) ? w.t / w.d : 0;
      const done = (w && (w.watched || ratio >= 0.95));
      if (state.watchFilter === 'started' && !(done || ratio > 0.02)) return false;
      if (state.watchFilter === 'watched' && !done) return false;
      if (state.watchFilter === 'unwatched' && done) return false;
    }
    return true;
  });
  const hasActiveMarketFilter = Boolean(state.marketFilter && !/^all$/i.test(String(state.marketFilter).trim()));
  let list = filterPool(videos, macroNiches, macroSet);
  if (list.length === 0 && !isAllTracks && (state.q || state.nicheFilter || state.skuFilter || hasActiveMarketFilter)) {
    const sysMeta = buildMetadataForPool(allSystemVideos);
    const sysMatches = filterPool(allSystemVideos, sysMeta.macroNiches, sysMeta.macroSet);
    if (sysMatches.length > 0) {
      state.videoTrack = 'all';
      try { sessionStorage.setItem('h2dev-video-track', 'all'); } catch (err) {}
      isDgmd = false;
      isHuan = false;
      isAllTracks = true;
      videos = allSystemVideos;
      ({ macroNiches, macroSet, moduleNiches, moduleSet, microNiches, marketCountMap, markets } = sysMeta);
      list = sysMatches;
      urlNeedsSync = true;
    }
  }
  const PAGE_SIZE = 24;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, Number(state.videoPage) || 1), totalPages);
  if (state.videoPage !== clampedPage) {
    state.videoPage = clampedPage;
    urlNeedsSync = true;
  }
  if (urlQp.has('vp') && String(clampedPage <= 1 ? '' : clampedPage) !== String(urlQp.get('vp') || '')) {
    urlNeedsSync = true;
  }
  if (urlNeedsSync && typeof syncVideoUrl === 'function') syncVideoUrl();
  // Sắp xếp: mới nhất (mặc định) / theo lộ trình / nhiều tài liệu / nhiều kênh mẫu / theo ngách / theo thị trường
  if (state.sortBy === 'curriculum') {
    const combinedModules = [
      ...safeArray(modH2dev && modH2dev.modules),
      ...safeArray(modHuan && modHuan.modules),
      ...safeArray(modDgmd && modDgmd.modules)
    ];
    const modOrderMap = new Map();
    const skuOrderMap = new Map();
    combinedModules.forEach((m, modIdx) => {
      [m && m.id, m && m.code, m && m.title].filter(Boolean).forEach(k => {
        if (!modOrderMap.has(k)) modOrderMap.set(k, modIdx);
      });
      const mItems = safeArray((m && (m.items || m.videos || m.skus || m.lessons)) || []);
      mItems.forEach((it, skuIdx) => {
        const sku = typeof it === 'string' ? it : (it && it.sku);
        if (sku && !skuOrderMap.has(sku)) skuOrderMap.set(sku, modIdx * 1000 + skuIdx);
      });
    });
    list = list.slice().sort((a, b) => {
      const sa = skuOrderMap.get(a.sku);
      const sb = skuOrderMap.get(b.sku);
      if (sa != null && sb != null && sa !== sb) return sa - sb;
      const ma = a.module_order != null ? Number(a.module_order) : (modOrderMap.get(a.module_id || a.module_title) ?? 999);
      const mb = b.module_order != null ? Number(b.module_order) : (modOrderMap.get(b.module_id || b.module_title) ?? 999);
      if (ma !== mb) return ma - mb;
      const la = a.lesson_order != null ? Number(a.lesson_order) : (a.seq != null ? Number(a.seq) : 999);
      const lb = b.lesson_order != null ? Number(b.lesson_order) : (b.seq != null ? Number(b.seq) : 999);
      if (la !== lb) return la - lb;
      return (b.published_at || '').localeCompare(a.published_at || '');
    });
  } else if (state.sortBy === 'docs') {
    list = list.slice().sort((a, b) => {
      const da = safeArray(a.docs).length;
      const db = safeArray(b.docs).length;
      return (db - da) || (b.published_at || '').localeCompare(a.published_at || '');
    });
  } else if (state.sortBy === 'channels') {
    list = list.slice().sort((a, b) => {
      const ca = safeArray(a.channels).length;
      const cb = safeArray(b.channels).length;
      return (cb - ca) || (b.published_at || '').localeCompare(a.published_at || '');
    });
  } else if (state.sortBy === 'niche') {
    list = list.slice().sort((a, b) => {
      const na = a.contentNiche || a.niche || a.category_name || '';
      const nb = b.contentNiche || b.niche || b.category_name || '';
      return na.localeCompare(nb) || (b.published_at || '').localeCompare(a.published_at || '');
    });
  } else if (state.sortBy === 'market') {
    list = list.slice().sort((a, b) => {
      const ma = safeArray(a.market).map(normMarket).join(',');
      const mb = safeArray(b.market).map(normMarket).join(',');
      return ma.localeCompare(mb) || (b.published_at || '').localeCompare(a.published_at || '');
    });
  } else {
    list = list.slice().sort((a, b) => {
      const dA = String(a.ingested_at || a.published_at || '');
      const dB = String(b.ingested_at || b.published_at || '');
      if (dB !== dA) return dB.localeCompare(dA);
      const pA = String(a.published_at || '');
      const pB = String(b.published_at || '');
      if (pB !== pA) return pB.localeCompare(pA);
      return (b._tail || 0) - (a._tail || 0);
    });
  }
  const free = videos.filter(v => (v.free ?? v.is_free)).length;
  const recentCount = videos.filter(isRecentlyIngestedVideo).length;
  const withDocs = videos.filter(v => v.docs && v.docs.length).length;
  const pvk = (rawNx && rawNx.phamViKho) || {};
  const ovCache = window._overviewSummaryCache || {};
  const cntH2 = arrH2.length || Number(pvk.videoH2dev || pvk.video || ovCache.videosH2dev || 0);
  const cntHuan = arrHuan.length || Number(pvk.videoHuan || ovCache.videosHuan || 0);
  const cntDgmd = arrDgmd.length || Number(pvk.videoDgmd || ovCache.videosDgmd || 0);
  const cntSys = (isAllTracks && videos.length) || Number(pvk.videoSystem || ovCache.totalVideos || (cntH2 + cntHuan + cntDgmd));

  const bannerTitle = isAllTracks ? '97yo-dev · Tất cả 3 Nhánh Đào Tạo' : (isHuan ? '97yo-dev · Nhánh Huân Academy' : (isDgmd ? '97yo-dev · Nhánh Đại Gia Mang Dép' : '97yo-dev · Nhánh H2DEV Faceless'));
  const bannerSub = isAllTracks
    ? SC.pad2(list.length) + '/' + SC.pad2(videos.length) + ` · Tổng hợp 3 nhánh (${cntH2} H2DEV · ${cntHuan} Huân · ${cntDgmd} DGMD)`
    : isHuan
    ? SC.pad2(list.length) + '/' + SC.pad2(videos.length) + ` · Nhánh con Huân Academy YouTube AI (Hệ thống 97yo-dev ${cntSys} Video)`
    : (isDgmd
      ? SC.pad2(list.length) + '/' + SC.pad2(videos.length) + ` · Nhánh con Đại Gia Mang Dép thực chiến (Hệ thống 97yo-dev ${cntSys} Video)`
      : SC.pad2(list.length) + '/' + SC.pad2(videos.length) + ` · Nhánh con H2DEV Faceless (Hệ thống 97yo-dev ${cntSys} Video)`);
  const bannerKpis = isAllTracks ? [
    { icon: ICONS.video, label: 'Tổng 3 nhánh', value: videos.length, sub: `${cntH2} H2DEV · ${cntHuan} Huân · ${cntDgmd} DGMD` },
    { icon: ICONS.doc, label: 'Miễn phí', value: free, sub: (videos.length - free) + ' pro' },
    { icon: ICONS.doc, label: 'Có tài liệu / SOP', value: withDocs, sub: 'Đính kèm bài học' },
    { icon: ICONS.video, label: 'Đang hiện', value: SC.pad2(list.length), live: true, sub: list.length === videos.length ? 'Không lọc' : 'Đang filter' }
  ] : isHuan ? [
    { icon: ICONS.video, label: 'Nhánh Huân Academy', value: videos.length, sub: `Hệ thống 97yo-dev (${cntSys} bài)` },
    { icon: ICONS.doc, label: 'Miễn phí', value: free, sub: (videos.length - free) + ' pro' },
    { icon: ICONS.doc, label: 'Có tài liệu / SOP', value: withDocs, sub: 'Google Docs / VPS Guide' },
    { icon: ICONS.video, label: 'Đang hiện', value: SC.pad2(list.length), live: true, sub: list.length === videos.length ? 'Không lọc' : 'Đang filter' }
  ] : isDgmd ? [
    { icon: ICONS.video, label: 'Nhánh DGMD', value: videos.length, sub: `Hệ thống 97yo-dev (${cntSys} bài)` },
    { icon: ICONS.doc, label: 'Miễn phí', value: free, sub: (videos.length - free) + ' pro' },
    { icon: ICONS.doc, label: 'Có tài liệu / SOP', value: withDocs, sub: 'Google Docs / Drive' },
    { icon: ICONS.video, label: 'Đang hiện', value: SC.pad2(list.length), live: true, sub: list.length === videos.length ? 'Không lọc' : 'Đang filter' }
  ] : [
    { icon: ICONS.video, label: 'Nhánh H2DEV', value: videos.length, sub: `Hệ thống 97yo-dev (${cntSys} bài)` },
    { icon: ICONS.doc, label: 'Free', value: free, sub: (videos.length - free) + ' pro' },
    { icon: ICONS.doc, label: 'Có tài liệu', value: withDocs, sub: 'docs[] catalog' },
    { icon: ICONS.video, label: 'Đang hiện', value: SC.pad2(list.length), live: true, sub: list.length === videos.length ? 'Không lọc' : 'Đang filter' }
  ];

  const nfTrim = String(state.nicheFilter || '').trim();
  const nfUpper = nfTrim.toUpperCase();
  const matchedCanonForUi = canonicalNiches.find(c => c.optionVal === nfTrim || c.code === nfUpper || (!macroNiches.includes(nfTrim) && c.name === nfTrim));
  const hasCustomNiche = nfTrim && !macroNiches.includes(nfTrim) && !moduleNiches.includes(nfTrim) && !microNiches.includes(nfTrim) && !matchedCanonForUi;
  const activeModId = nfTrim ? (moduleIdByTitle.get(nfTrim) || '') : '';
  const skuFilterCount = state.skuFilter ? state.skuFilter.split(',').map(x => x.trim()).filter(Boolean).length : 0;
  const activeNicheBannerLabel = matchedCanonForUi
    ? matchedCanonForUi.optionVal
    : (activeModId && !nfTrim.startsWith(activeModId)
        ? `${activeModId} — ${nfTrim}`
        : (nfTrim || (skuFilterCount ? `${skuFilterCount} SKU bài học` : 'SKU')));
  const rawMktUi = String(state.marketFilter || '').trim();
  const hasMktFilterUi = Boolean(rawMktUi && !/^all$/i.test(rawMktUi));
  const activeMarketLabel = rawMktUi === '__EMPTY__'
    ? 'Chưa gắn'
    : (/[,_|]/.test(rawMktUi)
        ? [...new Set(rawMktUi.split(/[,_|]+/).map(normMarket).filter(Boolean).map(stripDecorEmoji))].join(' · ')
        : stripDecorEmoji(normMarket(rawMktUi)));
  const hasCustomMarket = hasMktFilterUi && rawMktUi !== '__EMPTY__' && !markets.includes(normMarket(rawMktUi));

  return `
  ${pageBanner(bannerTitle, bannerSub, bannerKpis)}

  <!-- TRACK SWITCHER: Phân nhánh tab Video giữa 3 nhánh con thuộc 97yo-dev: H2DEV, DGMD và HUÂN -->
  <div class="track-switcher mb-6" id="videoTrackSwitcher" role="radiogroup" aria-label="Chọn nhánh đào tạo thuộc 97yo-dev">
    <button type="button" class="track-btn ${(!isDgmd && !isHuan && !isAllTracks) ? 'active' : ''}" data-video-track="h2dev" role="radio" aria-checked="${!isDgmd && !isHuan && !isAllTracks}" title="Nhánh H2DEV · Faceless (${cntH2} Video)">
      <span class="track-tag">H2DEV</span>
      <span class="track-label">Nhánh H2DEV · Faceless (${cntH2} Video)</span>
    </button>
    <button type="button" class="track-btn ${isDgmd ? 'active' : ''}" data-video-track="dgmd" role="radio" aria-checked="${isDgmd}" title="Nhánh Đại Gia Mang Dép (${cntDgmd} Video)">
      <span class="track-tag track-tag--dgmd">DGMD</span>
      <span class="track-label">Nhánh Đại Gia Mang Dép (${cntDgmd} Video)</span>
    </button>
    <button type="button" class="track-btn ${isHuan ? 'active' : ''}" data-video-track="huan" role="radio" aria-checked="${isHuan}" title="Nhánh Huân Academy (${cntHuan} Video)">
      <span class="track-tag track-tag--huan">HUÂN</span>
      <span class="track-label">Nhánh Huân Academy (${cntHuan} Video)</span>
    </button>
    <button type="button" class="track-btn ${isAllTracks ? 'active' : ''}" data-video-track="all" role="radio" aria-checked="${isAllTracks}" title="Tất cả 3 nhánh (${cntSys} Video)">
      <span class="track-tag">ALL</span>
      <span class="track-label">Tất cả 3 nhánh (${cntSys} Video)</span>
    </button>
  </div>

  <div class="card p-4 sm:p-5 mb-6 overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<!-- Row 1: Search Bar (Full Width & Spacious) -->
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm video</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="video-search-wrap">
    <input id="fq" aria-label="Tìm video bài học" value="${esc(state.q)}" autocomplete="off" placeholder="${isHuan ? 'Tìm bài học Huân Academy, SKU, quy trình (Kling, Veo, Midjourney, VPS, nuôi kênh, Bật kiếm tiền...)' : isDgmd ? 'Tìm bài học DGMD, SKU, quy trình (Phật pháp, Reels, Shorts, Facebook, hình ảnh AI...)' : 'Tìm tên video, SKU, kỹ thuật (B-roll bàn tay, AI, Thầy Pháp Hòa, xây kênh...)'}" class="search-input-premium w-full min-w-0 pr-9">
    <button type="button" id="btn-clear-video-q" aria-label="Xóa tìm kiếm" class="${state.q ? '' : 'hidden '}absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>
    <div id="video-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-border min-w-full"></div>
  </div>
  <button type="button" id="freset" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>

<!-- Row 2: Dropdowns & Status Badges -->
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap gap-2.5 items-center justify-between">
  <div id="video-filter-selects" class="flex flex-wrap gap-2 items-center flex-1 min-w-0">
    <label class="sr-only" for="fniche">Lọc theo ngách</label>
    <select id="fniche" aria-label="Lọc theo ngách" class="search-input-premium text-xs font-semibold py-2">
      <option value="">Mọi ngách</option>
      ${hasCustomNiche ? `<option value="${esc(state.nicheFilter)}" selected>Đang lọc: ${esc(state.nicheFilter)}</option>` : ''}
      ${macroNiches.length ? `<optgroup label="── Nhóm ngách lớn (${macroNiches.length}) ──">${macroNiches.map(m => `<option value="${esc(m)}" ${state.nicheFilter === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</optgroup>` : ''}
      ${canonicalNiches.length ? `<optgroup label="40 Ngách chuẩn (H01–H40)">${canonicalNiches.map(c => `<option value="${esc(c.optionVal)}" ${matchedCanonForUi && matchedCanonForUi.code === c.code ? 'selected' : ''}>${esc(c.optionVal)}</option>`).join('')}</optgroup>` : ''}
      ${moduleNiches.length ? `<optgroup label="── Học phần / Lộ trình (${moduleNiches.length}) ──">${moduleNiches.map(m => { const mId = moduleIdByTitle.get(m); const fullM = mId && !m.startsWith(mId) ? `${mId} — ${m}` : m; const label = fullM.length > 52 ? fullM.slice(0, 49).trim() + '…' : fullM; return `<option value="${esc(m)}" title="${esc(fullM)}" ${state.nicheFilter === m ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}</optgroup>` : ''}
      ${microNiches.length ? `<optgroup label="── Ngách chi tiết (${microNiches.length}) ──">${microNiches.map(n => `<option value="${esc(n)}" ${state.nicheFilter === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</optgroup>` : ''}
    </select>
    <label class="sr-only" for="fmarket">Lọc theo thị trường</label>
    <select id="fmarket" aria-label="Lọc theo thị trường" class="search-input-premium text-xs font-semibold py-2">
      <option value="">Mọi thị trường</option>${hasCustomMarket ? `<option value="${esc(state.marketFilter)}" selected>Đang lọc: ${esc(activeMarketLabel || rawMktUi)}</option>` : ''}${(videos.some(v => !(v.market || []).length) || state.marketFilter === '__EMPTY__') ? `<option value="__EMPTY__" ${state.marketFilter === '__EMPTY__' ? 'selected' : ''}>Chưa gắn</option>` : ''}${markets.map(m => `<option value="${esc(m)}" ${normMarket(state.marketFilter) === m ? 'selected' : ''}>${esc(stripDecorEmoji(m))}</option>`).join('')}
    </select>
    <label class="sr-only" for="fsort">Sắp xếp</label>
    <select id="fsort" aria-label="Sắp xếp" class="search-input-premium text-xs font-semibold py-2">
      <option value="newest" ${!state.sortBy || state.sortBy === 'newest' ? 'selected' : ''}>Mới nhất</option>
      <option value="curriculum" ${state.sortBy === 'curriculum' ? 'selected' : ''}>Theo lộ trình học</option>
      <option value="docs" ${state.sortBy === 'docs' ? 'selected' : ''}>Nhiều tài liệu nhất</option>
      <option value="channels" ${state.sortBy === 'channels' ? 'selected' : ''}>Nhiều kênh mẫu nhất</option>
      <option value="niche" ${state.sortBy === 'niche' ? 'selected' : ''}>Theo ngách (A–Z)</option>
      <option value="market" ${state.sortBy === 'market' ? 'selected' : ''}>Theo thị trường</option>
    </select>
  </div>
  <div id="video-filter-watch" class="flex flex-wrap items-center gap-1.5 shrink-0">
    ${['unwatched', 'started', 'watched'].map(k => {
      const label = { unwatched: 'Chưa xem', started: 'Đã xem / đang dở', watched: 'Đã xem xong' }[k];
      return `<button type="button" data-watch="${k}" class="filter-btn text-xs font-medium px-3 py-1.5 ${state.watchFilter === k ? 'active' : ''}">${label}</button>`;
    }).join('')}
  </div>
</div>
  </div>
  <div id="video-chip-cloud" class="flex flex-wrap gap-1.5 mb-4 items-center">
<button type="button" class="filter-btn text-xs font-medium px-3 py-1 ${!state.q && !state.freeOnly && !state.recentOnly && !state.marketFilter && !state.nicheFilter && !state.skuFilter && !state.watchFilter ? 'active' : ''}" data-action="video-filter-reset">Tất cả (${videos.length})</button>
${recentCount ? `<button type="button" class="filter-btn text-xs font-medium px-3 py-1 ${state.recentOnly ? 'active' : ''}" data-action="video-filter-recent">Mới cập nhật (${recentCount})</button>` : ''}
<button type="button" class="filter-btn text-xs font-medium px-3 py-1 ${state.freeOnly ? 'active' : ''}" data-action="video-filter-free">Chỉ Free (${free})</button>
${markets.map(m => `<button type="button" data-market-chip="${esc(m)}" class="filter-btn text-xs font-medium px-3 py-1 ${normMarket(state.marketFilter) === m ? 'active' : ''}">${esc(stripDecorEmoji(m))} · ${marketCountMap.get(m) || 0}</button>`).join('')}
  </div>
  ${(state.nicheFilter || state.skuFilter) ? `
  <div class="flex flex-wrap items-center gap-2 mb-4 bg-brand-500/10 border border-brand-500/20 px-3.5 py-2 rounded-xl text-xs text-brand-300">
<span class="inline-flex items-center gap-1.5">${ico('target', 14)} Đang lọc theo ngách: <strong class="text-white">${esc(activeNicheBannerLabel)}</strong> (${list.length} video)</span>
${matchedCanonForUi ? `<button type="button" data-open-tab="kenh-mau" data-kenh-niche="${esc(matchedCanonForUi.code)}" class="filter-btn text-xs">Kênh mẫu (${esc(matchedCanonForUi.code)}) ↗</button>` : ''}
<button type="button" data-action="video-clear-niche" class="ml-auto inline-flex items-center gap-1 text-brand-400 hover:text-white font-semibold underline" title="Chỉ xóa bộ lọc ngách, giữ nguyên từ khóa và bộ lọc khác">${ico('x', 14)} Xóa lọc ngách</button>
  </div>` : ''}
  ${hasMktFilterUi ? `
  <div class="flex flex-wrap items-center gap-2 mb-4 bg-brand-500/10 border border-brand-500/20 px-3.5 py-2 rounded-xl text-xs text-brand-300">
<span class="inline-flex items-center gap-1.5">${ico('globe', 14)} Đang lọc theo thị trường: <strong class="text-white">${esc(activeMarketLabel || rawMktUi)}</strong> (${list.length} video)</span>
<button type="button" data-action="video-clear-market" class="ml-auto inline-flex items-center gap-1 text-brand-400 hover:text-white font-semibold underline" title="Chỉ xóa bộ lọc thị trường, giữ nguyên từ khóa và bộ lọc khác">${ico('x', 14)} Xóa lọc thị trường</button>
  </div>` : ''}
  ${(() => {
    const page = clampedPage;
    const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const vWinStart = Math.max(1, page - 2);
    const vWinEnd = Math.min(totalPages, Math.max(5, page + 2));
    const vNums = [];
    for (let p = Math.max(1, vWinEnd - 4); p <= vWinEnd; p++) vNums.push(p);
    const videoPager = (pos) => totalPages <= 1 ? '' : `<nav aria-label="Phân trang video${pos === 'bottom' ? ' (cuối danh sách)' : ''}" class="flex flex-wrap items-center justify-between gap-2 ${pos === 'bottom' ? 'mt-6' : 'mb-3'} text-xs text-gray-400"><span>Trang ${page}/${totalPages} · ${list.length} bài học</span><span class="h2-page-nav">${page > 1 ? `<button type="button" class="filter-btn" data-action="video-page" data-pos="${pos}" data-page="${page - 1}">← Trước</button>` : ''}${vNums.map(p => `<button type="button" class="filter-btn ${p === page ? 'active' : ''}" ${p === page ? 'aria-current="page"' : ''} data-action="video-page" data-pos="${pos}" data-page="${p}">${p}</button>`).join('')}${page < totalPages ? `<button type="button" class="filter-btn" data-action="video-page" data-pos="${pos}" data-page="${page + 1}">Sau →</button>` : ''}</span></nav>`;
    return videoPager('top') + `
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 video-grid">${paged.map(videoCard).join('') || `<div class="card p-12 text-gray-400 col-span-full text-center py-10"><p class="mb-3">Không tìm thấy video phù hợp với bộ lọc hiện tại.</p><button type="button" id="freset-empty" class="bg-surface-2 hover:bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Xóa bộ lọc</button></div>`}</div>
  ${videoPager('bottom')}`;
  })()}`;
}

async function renderNgachXanh() {
  const radarCacheValid = Boolean(
    window.__nxRadarCache &&
    !/[?&](?:nocache|refresh)=1\b/i.test(location.search) &&
    window.__nxRadarCacheAt &&
    (Date.now() - window.__nxRadarCacheAt) < 60000 &&
    window.__nxRadarCacheVer === (APP_BUILD_VER || '')
  );
  const [radar, rawVideosH2, rawVideosHuan, rawVideosDgmd, nx, kenhRaw, tlRaw] = await Promise.all([
    (radarCacheValid
      ? Promise.resolve(window.__nxRadarCache)
      : fetch('/api/niche-radar', { cache: 'no-store' })
          .then(rr => rr.ok ? rr.json() : { items: [] })
          .then(d => {
            window.__nxRadarCache = d;
            window.__nxRadarCacheAt = Date.now();
            window.__nxRadarCacheVer = APP_BUILD_VER || '';
            return d;
          })
          .catch(() => (window.__nxRadarCache || { items: [] }))),
    loadJSON('data-tabs/videos.json').catch(() => []),
    loadJSON('data/videos_huan.json').catch(() => []),
    loadJSON('data/videos_dgmd.json').catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => ({})),
    loadJSON('data-tabs/kenh-mau.json').catch(() => []),
    loadJSON('data-tabs/tai-lieu-full.json').catch(() => [])
  ]);
  const arrH2 = (Array.isArray(rawVideosH2) ? rawVideosH2 : safeArray(rawVideosH2 && rawVideosH2.videos)).map(v => Object.assign({}, v, { _branch: 'H2DEV' }));
  const arrHuan = safeArray(rawVideosHuan).map(v => Object.assign({}, v, { isHuan: true, _branch: 'HUAN' }));
  const arrDgmd = safeArray(rawVideosDgmd).map(v => Object.assign({}, v, { isDgmd: true, _branch: 'DGMD' }));
  const videos = arrH2.concat(arrHuan, arrDgmd);
  const radarByCode = new Map();
  safeArray(radar && radar.items).forEach(r => {
    if (r && r.code) radarByCode.set(String(r.code).toUpperCase(), r);
  });
  const allKenh = safeArray(kenhRaw);
  const tlList = safeArray(tlRaw);
  const tlByFile = new Map();
  tlList.forEach((item, idx) => {
    if (item && item.file) {
      tlByFile.set(String(item.file).trim(), { item, idx, docNum: idx + 1 });
    }
  });
  function resolveNxDoc(docRef) {
    const s = String(docRef || '').trim();
    const mTl = s.match(/^TL-(\d+)\b/i);
    if (mTl) {
      const docNum = parseInt(mTl[1], 10);
      const item = tlList[docNum - 1];
      return {
        raw: s,
        docNum,
        docDid: 'DOC_' + docNum,
        docIdx: docNum - 1,
        label: s,
        title: (item && item.title) ? (s + ' · ' + item.title) : s
      };
    }
    const cleanPath = s.replace(/^\/?file\//i, '').trim();
    const found = tlByFile.get(cleanPath) || tlByFile.get(s);
    if (found) {
      const codeStr = 'TL-' + String(found.docNum).padStart(3, '0');
      const docTitle = (found.item && found.item.title) ? found.item.title : cleanPath;
      return {
        raw: s,
        docNum: found.docNum,
        docDid: 'DOC_' + found.docNum,
        docIdx: found.idx,
        label: codeStr + ' — ' + docTitle,
        title: codeStr + ' — ' + docTitle + ' (' + cleanPath + ')'
      };
    }
    return { raw: s, docNum: 0, docDid: '', docIdx: -1, label: s, title: s };
  }
  const kenhByHandle = new Map();
  allKenh.forEach(k => {
    if (!k || !k.handle) return;
    const cleanH = String(k.handle).replace(/^@/, '').trim().toLowerCase();
    if (cleanH) kenhByHandle.set(cleanH, k);
  });
  const deadKenhSet = new Set(allKenh.filter(k => k && k.dead).map(k => String(k.handle || '').trim().replace(/^@/, '').trim().toLowerCase()));
  const deadBanSet = new Set([...deadKenhSet, ...safeArray(nx && nx.deadHandles2026).map(h => String(h || '').trim().replace(/^@/, '').trim().toLowerCase())]);
  const bySku = new Map(videos.map(v => [String(v.sku || '').toLowerCase(), v]));

  function renderNxChannelChip(chRaw, n, isExtended) {
    const chStr = String(chRaw || '').trim();
    const h = chStr.replace(/^@/, '').trim().toLowerCase();
    const meta = kenhByHandle.get(h) || null;
    const isDead = deadBanSet.has(h) || Boolean(meta && meta.dead);
    const isBanLive = !isDead && Boolean(n.banSet && n.banSet.has(h));
    const chipClass = isDead ? 'channel-chip-dead' : (isBanLive ? 'channel-chip-ban' : '');
    const initChar = (h[0] || '?').toUpperCase();
    const avatarUrl = safeUrl(meta && meta.avatar);
    const avatarNode = avatarUrl
      ? `<img src="${esc(avatarUrl)}" alt="" width="20" height="20" class="channel-chip-avatar" loading="lazy" decoding="async" data-img-fallback="hide-inline-flex"><span class="channel-chip-initial" style="display:none" aria-hidden="true">${esc(initChar)}</span>`
      : `<span class="channel-chip-initial" aria-hidden="true">${esc(initChar)}</span>`;
    const metaParts = [chStr];
    if (meta && meta.title && meta.title.toLowerCase() !== chStr.toLowerCase() && meta.title.toLowerCase() !== h) {
      metaParts.push(meta.title);
    }
    if (meta && meta.subscribers) {
      metaParts.push(Number(meta.subscribers).toLocaleString('vi-VN') + ' subs');
    }
    if (isDead) {
      metaParts.push((meta && meta.deadNote) ? meta.deadNote : 'Kênh đối chứng đã dừng hoặc bị YouTube gỡ (404/wipe)');
    } else if (isBanLive) {
      metaParts.push('Nhóm mẫu bẩn / không copy (facecam, clip gốc, YMYL rủi ro hoặc ngủ đông)');
    } else if (isExtended) {
      metaParts.push('Kênh mở rộng 2026');
    }
    const chipTitle = esc(metaParts.join(' · '));
    const badgeHtml = isDead
      ? '<span class="channel-chip-dead-badge">DIE</span>'
      : (isBanLive ? '<span class="channel-chip-ban-badge">BẨN</span>' : '');
    const cleanHandleWithAt = chStr.startsWith('@') ? chStr : '@' + chStr;
    if (isDead) {
      const deadLocalHref = `/kenh-mau?handle=${encodeURIComponent(cleanHandleWithAt)}`;
      return `<a href="${esc(deadLocalHref)}" data-open-tab="kenh-mau" data-kenh-handle="${esc(cleanHandleWithAt)}" class="channel-chip ${chipClass}" translate="no" title="${chipTitle}">${avatarNode}<span class="channel-chip-handle">${esc(chStr)}</span>${badgeHtml}<span class="channel-chip-arrow" aria-hidden="true">↗</span></a>`;
    }
    const safeMetaExtUrl = safeExternalUrl(meta && meta.url);
    const hrefUrl = safeMetaExtUrl || `https://www.youtube.com/${encodeURI(cleanHandleWithAt)}`;
    return `<a href="${esc(hrefUrl)}" target="_blank" rel="noopener noreferrer" class="channel-chip ${chipClass}" translate="no" title="${chipTitle}">${avatarNode}<span class="channel-chip-handle">${esc(chStr)}</span>${badgeHtml}<span class="channel-chip-arrow" aria-hidden="true">↗</span></a>`;
  }

  function vidsFor(n) {
    const out = [];
    const seen = new Set();
    function add(v) {
      if (!v || seen.has(v.sku)) return;
      seen.add(v.sku);
      out.push(v);
    }
    for (const ref of (n && n.skus) || []) {
      const sku = typeof ref === 'string' ? ref : (ref && ref.sku);
      add(bySku.get(String(sku || '').toLowerCase()));
    }
    const nTarget = String((n && n.ngach) || '').trim().toLowerCase();
    if (nTarget) {
      for (const v of videos) {
        if (String(v.contentNiche || '').trim().toLowerCase() === nTarget) add(v);
      }
    }
    return out;
  }

  function videoRow(v, extraClass, extraAttr) {
    const docs = safeArray(v.docs);
    const channels = safeArray(v.channels);
    const isRecentV = isRecentlyIngestedVideo(v);
    const branchBadge = v._branch === 'HUAN'
      ? '<span class="badge badge-amber text-xs px-1.5 py-0">Huân</span>'
      : (v._branch === 'DGMD'
        ? '<span class="badge badge-blue text-xs px-1.5 py-0">DGMD</span>'
        : '<span class="badge badge-brand text-xs px-1.5 py-0">H2DEV</span>');
    return `<a href="/lotrinh/${encodeURIComponent(v.sku)}" class="flex gap-2.5 p-2 rounded-xl hover:bg-ink-700/60 border border-transparent hover:border-ink-600 transition-colors group min-w-0 ${extraClass || ''}" ${extraAttr || ''}>
  <img src="${esc(safeUrl(v.image || v.thumb) || 'assets/thumbs/placeholder.svg')}" alt="Thumbnail bài học: ${esc(v.title)}" width="72" height="40" loading="lazy" decoding="async" data-img-fallback="placeholder" class="w-[72px] h-[40px] rounded-xl object-cover shrink-0 bg-black">
  <div class="min-w-0 flex-1">
    <div class="text-xs font-medium text-white leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors break-words">${(window.H2Core && H2Core.escTitle ? H2Core.escTitle : esc)(v.title)}</div>
    <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
      ${branchBadge}
      ${isRecentV ? '<span class="badge badge-green text-xs px-1.5 py-0">MỚI</span>' : ''}
      <span class="text-xs text-gray-500 font-mono truncate">${esc(v.sku)}</span>
      ${v.published_at ? `<span class="text-xs text-gray-400 shrink-0">${esc(v.published_at)}</span>` : ''}
      <span class="text-xs text-gray-400">${fmtBytes(v.size)}</span>
      ${docs.length ? '<span class="text-xs text-brand-400 shrink-0 inline-flex items-center gap-1">' + ico('file-text', 14) + ' ' + docs.length + '</span>' : ''}
      ${channels.length ? '<span class="text-xs text-sky-400 shrink-0 inline-flex items-center gap-1">' + ico('tv', 14) + ' ' + channels.length + '</span>' : ''}
    </div>
  </div>
  <span class="shrink-0 w-7 h-7 rounded-xl bg-brand-600 group-hover:bg-brand-500 text-white flex items-center justify-center text-xs transition-colors">${ico('arrow-right', 14)}</span>
</a>`;
  }
  function nxRpmShort(field) {
    const raw = String(field || '').trim();
    const match = raw.match(/median\s*\$?\s*(\d+(?:\.\d+)?)/i) || raw.match(/\$(\d+(?:\.\d+)?)/);
    return match ? '$' + match[1] : 'Chưa đo';
  }
  function nxCompShort(field) {
    const raw = String(field || '').trim();
    const matches = [...raw.matchAll(/competition\s*[:=]?\s*(\d+(?:\.\d+)?)/gi)];
    return matches.length ? matches[matches.length - 1][1] : 'Chưa đo';
  }


  const audit = nx.auditTong2026 || {};
  const auditRows = safeArray(audit.xepHang);
  const ngachList = safeArray(nx.ngachXanh);

  // Merge ranked items with their rich details (+ fallback nếu audit.xepHang thiếu bản ghi trong nx.ngachXanh)
  const usedRecords = new Set();
  const baseRows = auditRows.map(r => {
    if (r && r.record != null) usedRecords.add(r.record);
    return r;
  });
  ngachList.forEach((detail, idx) => {
    if (!usedRecords.has(idx) && detail && detail.ngach) {
      baseRows.push({
        thuTu: baseRows.length + 1,
        record: idx,
        ngach: detail.ngach,
        nhom: detail.tier || 'KHONG_DU_EVIDENCE',
        lyDo: detail.evidence || '',
        lienKetVideo: ''
      });
    }
  });

  const enrichedNiches = baseRows.map(r => {
    const detail = (r.record != null && r.record < ngachList.length) ? ngachList[r.record] : {};
    const rawMarket = safeArray(detail.thiTruong);
    let mTag = 'GLOBAL';
    const primaryMarketLower = (r.ngach + ' ' + (rawMarket[0] || '')).toLowerCase();
    // Ưu tiên thị trường chính (rawMarket[0]) & tên ngách để không bị thị trường phụ ghi đè
    if (/jp|nhật|japan/.test(primaryMarketLower)) mTag = 'JP';
    else if (/kr|hàn|korea|야담/.test(primaryMarketLower)) mTag = 'KR';
    else if (/\bvn\b|việt|vietnam/.test(primaryMarketLower)) mTag = 'VN';
    else if (/\bus\b|\ben\b|tiếng anh|mỹ|quốc tế/.test(primaryMarketLower)) mTag = 'US';

    function dedupHandlesCaseInsensitive(arr, excludeLowerSet) {
      const out = [];
      const seen = excludeLowerSet ? new Set(excludeLowerSet) : new Set();
      safeArray(arr).forEach(item => {
        const s = String(typeof item === 'string' ? item : (item && item.handle) || '').trim();
        if (!s) return;
        const k = s.replace(/^@/, '').toLowerCase();
        if (!k || seen.has(k)) return;
        seen.add(k);
        out.push(s);
      });
      return { list: out, seen };
    }
    const rawCleanPool = [...safeArray(detail.mauSach), ...safeArray(detail.mauPhu)];
    const banChannels = safeArray(detail.mauBan);
    const banSet = new Set(banChannels.map(x => String(typeof x === 'string' ? x : (x && x.handle) || '').replace(/^@/, '').trim().toLowerCase()).filter(Boolean));
    const excludeCleanSet = new Set([...deadBanSet, ...banSet]);
    const cleanDedup = dedupHandlesCaseInsensitive(rawCleanPool, excludeCleanSet);
    const cleanChannels = cleanDedup.list;
    const allCardDedup = dedupHandlesCaseInsensitive([...rawCleanPool, ...banChannels]);
    const allCardChannels = allCardDedup.list;
    const extDedup = dedupHandlesCaseInsensitive(detail.kenhMoRong2026, allCardDedup.seen);
    const extSet = new Set(extDedup.list.map(x => String(x || '').trim().replace(/^@/, '').trim().toLowerCase()));
    const cleanExtChannels = dedupHandlesCaseInsensitive(extDedup.list, excludeCleanSet).list;
    const cleanAllChannels = [...cleanChannels, ...cleanExtChannels];
    const totalCleanCount = cleanAllChannels.length;
    const PRIMARY_CHANNEL_CAP = 6;
    const primaryVisibleChannels = allCardChannels.slice(0, PRIMARY_CHANNEL_CAP);
    const overflowPrimaryChannels = allCardChannels.slice(PRIMARY_CHANNEL_CAP);
    const drawerChannels = [...overflowPrimaryChannels, ...extDedup.list];
    const drawerLabel = overflowPrimaryChannels.length > 0 && extDedup.list.length > 0
      ? `+${drawerChannels.length} kênh đối thủ & mở rộng 2026 (bấm để xem)`
      : (overflowPrimaryChannels.length > 0
        ? `+${drawerChannels.length} kênh đối thủ tham khảo (bấm để xem)`
        : `+${drawerChannels.length} kênh mở rộng 2026 (bấm để xem)`);
    const nCode = detail.code || ('H' + String(detail.hang || ((r.record || 0) + 1)).padStart(2, '0'));
    const vids = vidsFor(detail);
    const vidSkuSet = new Set(vids.map(v => String(v.sku || '').toUpperCase()));
    const baseDocs = safeArray(detail.docs).map(resolveNxDoc);
    const seenDocNums = new Set(baseDocs.map(d => d.docNum).filter(n => n > 0));
    const seenDocRaw = new Set(baseDocs.map(d => String(d.raw || '').trim()));
    // A2 Runtime Auto-Merge: tự động hợp nhất các tài liệu trong tai-lieu-full.json khớp nicheCode hoặc SKU bài học của ngách (không gán chéo ngách Hxx khác)
    const nCodeUp = nCode.toUpperCase();
    tlList.forEach((item, idx) => {
      if (!item) return;
      const docNum = idx + 1;
      if (seenDocNums.has(docNum)) return;
      const itemNicheCode = String(item.nicheCode || '').trim().toUpperCase();
      const itemNicheCodes = safeArray(item.nicheCodes).map(c => String(c || '').trim().toUpperCase());
      const itemSku = String(item.sku || '').trim().toUpperCase();
      const isDirectCode = itemNicheCode === nCodeUp || itemNicheCodes.includes(nCodeUp);
      const isUnassignedSkuMatch = itemSku && vidSkuSet.has(itemSku) && itemNicheCode !== 'META-OPS' && (!itemNicheCode || !/^H\d{2}$/.test(itemNicheCode));
      if (isDirectCode || isUnassignedSkuMatch) {
        const fClean = String(item.file || '').trim();
        if (fClean && seenDocRaw.has(fClean)) return;
        const codeStr = 'TL-' + String(docNum).padStart(3, '0');
        const docTitle = item.title || item.name || fClean || codeStr;
        baseDocs.push({
          raw: fClean || codeStr,
          docNum,
          docDid: 'DOC_' + docNum,
          docIdx: idx,
          label: `${codeStr} (${item.kind || 'sop'} · ${item.sku || 'NOI-BO'}): ${docTitle}`,
          title: `${codeStr} — ${docTitle}`
        });
        seenDocNums.add(docNum);
        if (fClean) seenDocRaw.add(fClean);
      }
    });
    const resolvedDocs = baseDocs;
    const branchCounts = { H2DEV: 0, HUAN: 0, DGMD: 0 };
    let recentVidsCount = 0;
    vids.forEach(v => {
      const b = v._branch || (v.isHuan ? 'HUAN' : (v.isDgmd ? 'DGMD' : 'H2DEV'));
      if (branchCounts[b] != null) branchCounts[b]++;
      if (isRecentlyIngestedVideo(v)) recentVidsCount++;
    });
    const radarInfo = radarByCode.get(nCode.toUpperCase()) || {};
    const rpmMatchNum = String(detail.rpm || '').match(/median\s*:?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i) || String(detail.rpm || '').match(/\$([0-9]+(?:\.[0-9]+)?)/);
    const rpmMedianVal = rpmMatchNum ? parseFloat(rpmMatchNum[1]) : 0;
    return {
      rank: r.thuTu,
      recordId: r.record,
      code: nCode,
      name: r.ngach,
      tier: r.nhom || 'KHONG_DU_EVIDENCE',
      thesis: r.lyDo || detail.evidence || '',
      videoNote: r.lienKetVideo || '',
      marketTag: mTag,
      markets: rawMarket.length ? rawMarket : [mTag],
      rpm: detail.rpm || '',
      competition: detail.canhTranh || '',
      rpmShort: nxRpmShort(detail.rpm),
      rpmMedianVal: rpmMedianVal,
      competitionShort: nxCompShort(detail.canhTranh),
      boiScore: Number(radarInfo.BOI) || 0,
      saiScore: Number(radarInfo.SAI) || 0,
      priScore: Number(radarInfo.PRI) || 0,
      novelty: detail.doMoi || '',
      safeFormat: detail.formatBrand || detail.lamDuoc || 'Sản xuất kịch bản có thesis/nguồn tài liệu kiểm chứng riêng biệt.',
      avoidTrap: detail.viPham || 'Tránh lặp template, không quote-farm, không mạo danh chuyên gia.',
      cleanChannels: cleanChannels,
      cleanAllChannels: cleanAllChannels,
      totalClean: totalCleanCount,
      deadOrBanCount: Math.max(0, (allCardChannels.length + extDedup.list.length) - totalCleanCount),
      banSet: banSet,
      extSet: extSet,
      drawerLabel: drawerLabel,
      channels: primaryVisibleChannels,
      allChannelsCount: allCardChannels.length + extDedup.list.length,
      docs: safeArray(detail.docs),
      resolvedDocs: resolvedDocs,
      skills: safeArray(detail.skills),
      subNiches120: safeArray(detail.subNiches120),
      subNiches2026: safeArray(detail.subNiches2026),
      kenhMoRong2026: drawerChannels,
      nenLam: detail.nenLam,
      nenLamNote: detail.nenLamNote || '',
      vids: vids,
      branchCounts: branchCounts,
      recentCount: recentVidsCount,
      hasRecent: recentVidsCount > 0,
      rawDetail: detail
    };
  });

  // Filter statistics
  const tierCounts = { ALL: enrichedNiches.length, UU_TIEN_SAN_XUAT: 0, WATCHLIST: 0, TEST_FORMAT: 0, KHONG_DU_EVIDENCE: 0, TACH_KHOI_DE_XUAT: 0 };
  const marketCounts = { ALL: enrichedNiches.length, US: 0, JP: 0, KR: 0, VN: 0, GLOBAL: 0 };
  const branchNicheCounts = { ALL: enrichedNiches.length, H2DEV: 0, HUAN: 0, DGMD: 0, RECENT: 0 };
  enrichedNiches.forEach(n => {
    if (tierCounts[n.tier] != null) tierCounts[n.tier]++;
    if (marketCounts[n.marketTag] != null) marketCounts[n.marketTag]++;
    if (n.branchCounts.H2DEV > 0) branchNicheCounts.H2DEV++;
    if (n.branchCounts.HUAN > 0) branchNicheCounts.HUAN++;
    if (n.branchCounts.DGMD > 0) branchNicheCounts.DGMD++;
    if (n.hasRecent) branchNicheCounts.RECENT++;
  });

  // Dynamic sub-niche lookups (zero hardcoded count ceiling)
  const sub26CodeSet = new Set();
  const sub120IdSet = new Set();
  enrichedNiches.forEach(n => {
    safeArray(n.subNiches2026).forEach(sn => {
      const c = String((sn && sn.subCode) || '').trim().toUpperCase();
      if (c) sub26CodeSet.add(c);
    });
    safeArray(n.subNiches120).forEach(sn => {
      const idPad = String((sn && sn.id) || '').trim().padStart(3, '0');
      if (idPad && /^\d{3}$/.test(idPad)) sub120IdSet.add(idPad);
    });
  });

  // Apply Filters
  const q = (state.nxQ || '').trim().toLowerCase();
  const subParam = String(state.nxSub || '').trim().toUpperCase();
  const qCodeMatch = q.match(/^(h\d{2})(?:\s*|\s*[—-].*)$/i);
  const exactCodeQ = qCodeMatch ? qCodeMatch[1].toLowerCase() : '';
  const metaCodeMatch = q.match(/^(meta-0[1-5])\b/i);
  const exactMetaQ = metaCodeMatch ? metaCodeMatch[1].toUpperCase() : '';
  const subCodeMatch = q.match(/^#?(sn-h\d{2}-\d{3})\b/i) || subParam.match(/^#?(sn-h\d{2}-\d{3})\b/i);
  const rawSubCodeQ = subCodeMatch ? subCodeMatch[1].toUpperCase() : '';
  const sub26Match = (!rawSubCodeQ && (q.match(/^#?(sub-0*[1-9]\d*)\b/i) || subParam.match(/^#?(sub-0*[1-9]\d*)\b/i))) || null;
  const candSub26 = sub26Match
    ? ('SUB-' + String(parseInt(sub26Match[1].replace(/^sub-0*/i, ''), 10)).padStart(2, '0'))
    : '';
  const exactSub26Q = (candSub26 && !/^#?sub-\d{3}\b/i.test(q) && !/^#?sub-\d{3}\b/i.test(subParam) && sub26CodeSet.has(candSub26))
    ? candSub26
    : '';
  const sub120FromQ = (!rawSubCodeQ && !exactSub26Q) ? q.match(/^#?(?:sub-)?0*(\d{1,3})\b/i) : null;
  const sub120FromParam = (!rawSubCodeQ && !exactSub26Q) ? subParam.match(/^#?(?:SUB-)?0*(\d{1,3})\b/i) : null;
  const rawSub120FromQ = (sub120FromQ && /^#?(?:sub-\d{3}|\d{3})\b/i.test(q))
    ? String(parseInt(sub120FromQ[1], 10)).padStart(3, '0')
    : '';
  const rawSub120FromParam = sub120FromParam
    ? String(parseInt(sub120FromParam[1], 10)).padStart(3, '0')
    : '';
  const candSub120 = rawSub120FromParam || rawSub120FromQ;
  const exactSub120Q = (candSub120 && sub120IdSet.has(candSub120)) ? candSub120 : '';
  // Khi có parent niche exactCodeQ (vd ?q=H08&sub=054) hoặc SN-Hxx-yyy, khóa phạm vi về đúng Hxx thay vì va chạm nhiều ngách
  const exactSubCodeQ = rawSubCodeQ || (exactCodeQ && exactSub120Q ? ('SN-' + exactCodeQ.toUpperCase() + '-' + exactSub120Q) : '');
  const sub120ParentCode = exactSubCodeQ ? exactSubCodeQ.slice(3, 6).toUpperCase() : '';
  const activeSubTarget = (exactSubCodeQ || exactSub26Q || (exactSub120Q ? ('SUB-' + exactSub120Q) : '') || subParam).toUpperCase();
  const tlCodeMatch = q.match(/^#?(tl-\d{3})\b/i);
  const exactTlQ = tlCodeMatch ? tlCodeMatch[1].toUpperCase() : '';
  const docNumMatch = q.match(/^#?doc[-_]?0*(\d{1,3})\b/i);
  const exactDocNumQ = docNumMatch ? docNumMatch[1] : '';
  const skuCodeMatch = q.match(/^((?:video|zoom|huan|dgmd)-[a-z0-9_-]+)\b/i);
  const exactSkuQ = skuCodeMatch ? skuCodeMatch[1].toUpperCase() : '';
  const hasExactEntityQ = Boolean(exactCodeQ || exactMetaQ || exactSubCodeQ || exactSub26Q || exactSub120Q || exactTlQ || exactDocNumQ || exactSkuQ);
  const hasExactNameQ = q ? enrichedNiches.some(x => String(x.name || '').trim().toLowerCase() === q) : false;
  const filteredUnsorted = enrichedNiches.filter(n => {
    if (exactMetaQ) return false;
    if (!hasExactEntityQ) {
      if (state.nxTier) {
        if (state.nxTier === 'WATCHLIST_TEST') {
          if (n.tier !== 'WATCHLIST' && n.tier !== 'TEST_FORMAT') return false;
        } else if (n.tier !== state.nxTier) {
          return false;
        }
      }
      if (state.nxMarket && n.marketTag !== state.nxMarket) return false;
      if (state.nxBranch) {
        if (state.nxBranch === 'RECENT') {
          if (!n.hasRecent) return false;
        } else if ((n.branchCounts[state.nxBranch] || 0) <= 0) {
          return false;
        }
      }
    }
    if (!q && !exactSubCodeQ && !exactSub26Q && !exactSub120Q) return true;
    if (exactCodeQ && String(n.code || '').toLowerCase() !== exactCodeQ) return false;
    if (exactSubCodeQ) {
      const targetNicheCode = exactSubCodeQ.slice(3, 6).toUpperCase();
      if (String(n.code || '').toUpperCase() !== targetNicheCode) return false;
      return safeArray(n.subNiches120).some((sn, idx) => {
        const c1 = ('SN-' + n.code + '-' + String(sn.id || '').padStart(3, '0')).toUpperCase();
        const c2 = ('SN-' + n.code + '-' + String(idx + 1).padStart(3, '0')).toUpperCase();
        return c1 === exactSubCodeQ || c2 === exactSubCodeQ;
      });
    }
    if (exactSub26Q) {
      return safeArray(n.subNiches2026).some(sn => String(sn.subCode || '').trim().toUpperCase() === exactSub26Q);
    }
    if (exactSub120Q) {
      return safeArray(n.subNiches120).some(sn => String(sn.id || '').padStart(3, '0') === exactSub120Q);
    }
    if (exactCodeQ) {
      return true;
    }
    if (exactTlQ) {
      return safeArray(n.resolvedDocs).some(rd => String(rd.label || '').toUpperCase().startsWith(exactTlQ));
    }
    if (exactDocNumQ) {
      return safeArray(n.resolvedDocs).some(rd => String(rd.docNum) === exactDocNumQ);
    }
    if (exactSkuQ) {
      return safeArray(n.vids).some(v => String(v.sku || '').toUpperCase() === exactSkuQ);
    }
    if (hasExactNameQ) {
      return String(n.name || '').trim().toLowerCase() === q;
    }
    const hay = [
      n.code || '',
      n.ngach || '',
      n.name || '',
      n.rank != null ? String(n.rank) : '',
      n.hang != null ? String(n.hang) : '',
      n.thesis,
      n.safeFormat,
      n.avoidTrap,
      n.nenLamNote || '',
      n.rpm || '',
      n.competition || '',
      n.marketTag,
      (n.markets || []).join(' '),
      (n.cleanChannels || []).join(' '),
      (n.channels || []).join(' '),
      (n.kenhMoRong2026 || []).join(' '),
      (n.subNiches120 || []).map((sn, idx) => 'SN-' + n.code + '-' + (sn.id || '') + ' SN-' + n.code + '-' + String(idx + 1).padStart(3, '0') + ' SUB-' + (sn.id || '') + ' ' + (sn.id || '') + ' ' + (sn.name || '') + ' ' + (sn.formula || '')).join(' '),
      (n.subNiches2026 || []).map(sn => (sn.subCode || '') + ' ' + (sn.title || '') + ' ' + (sn.formula || '') + ' ' + (sn.productionStack || '') + ' ' + (sn.policyGuardrails || '') + ' ' + (sn.sourceDoc || '') + ' ' + safeArray(sn.sampleChannels).join(' ')).join(' '),
      (n.docs || []).join(' '),
      (n.resolvedDocs || []).map(rd => rd.label + ' ' + rd.title).join(' '),
      (n.skills || []).join(' '),
      safeArray(n.skus).join(' '),
      n.vids.map(v => v.sku + ' ' + v.title).join(' ')
    ].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });
  const nxSortMode = state.nxSort || 'rank';
  const filtered = [...filteredUnsorted].sort((a, b) => {
    if (nxSortMode === 'boi') {
      return (b.boiScore - a.boiScore) || (a.rank - b.rank);
    }
    if (nxSortMode === 'rpm') {
      return (b.rpmMedianVal - a.rpmMedianVal) || (a.rank - b.rank);
    }
    if (nxSortMode === 'videos') {
      return (b.vids.length - a.vids.length) || (b.resolvedDocs.length - a.resolvedDocs.length) || (a.rank - b.rank);
    }
    return (a.rank - b.rank);
  });
  /* NANG CAP 2026-09-30: phan trang Ngach xanh (34 the ~20.000px tren mobile). np vao URL nhu dp/vp/kp. */
  const NX_PAGE_SIZE = (state.nxLimit && state.nxLimit > 0) ? state.nxLimit : 12;
  const nxTotalPages = Math.max(1, Math.ceil(filtered.length / NX_PAGE_SIZE));
  const rawNxPage = state.nxPage || 1;
  const nxPage = Math.min(Math.max(1, rawNxPage), nxTotalPages);
  state.nxPage = nxPage;
  if ((rawNxPage !== nxPage || (nxPage === 1 && /[?&]np=/i.test(location.search))) && typeof syncNxPageUrl === 'function') {
    syncNxPageUrl();
  }
  const nxItems = filtered.slice((nxPage - 1) * NX_PAGE_SIZE, nxPage * NX_PAGE_SIZE);
  const nxWinEnd = Math.min(nxTotalPages, Math.max(5, nxPage + 2));
  const nxNums = [];
  for (let p = Math.max(1, nxWinEnd - 4); p <= nxWinEnd; p++) nxNums.push(p);
  const nxPager = (pos) => nxTotalPages <= 1 ? '' : `<nav class="flex flex-wrap items-center justify-between gap-2 ${pos === 'top' ? 'mb-3' : 'mb-8'} text-xs text-gray-400" aria-label="Phân trang ngách${pos === 'bottom' ? ' (cuối danh sách)' : ''}"><span aria-live="polite">Trang ${nxPage}/${nxTotalPages} · ${filtered.length} ngách</span><span class="h2-page-nav">${nxPage > 1 ? `<button type="button" class="filter-btn" data-action="nx-page" data-page="${nxPage - 1}" data-pos="${pos}">← Trước</button>` : ''}${nxNums.map(p => `<button type="button" class="filter-btn ${p === nxPage ? 'active' : ''}" ${p === nxPage ? 'aria-current="page"' : ''} data-action="nx-page" data-page="${p}" data-pos="${pos}">${p}</button>`).join('')}${nxPage < nxTotalPages ? `<button type="button" class="filter-btn" data-action="nx-page" data-page="${nxPage + 1}" data-pos="${pos}">Sau →</button>` : ''}</span></nav>`;

  const tierLabels = {
    UU_TIEN_SAN_XUAT: 'Ưu tiên sản xuất',
    WATCHLIST: 'Watchlist',
    TEST_FORMAT: 'Test format',
    KHONG_DU_EVIDENCE: 'Chưa đủ evidence',
    TACH_KHOI_DE_XUAT: 'Tách khỏi đề xuất'
  };

  const tierBadges = {
    UU_TIEN_SAN_XUAT: 'badge-green',
    WATCHLIST: 'badge-amber',
    TEST_FORMAT: 'badge-blue',
    KHONG_DU_EVIDENCE: 'badge-muted',
    TACH_KHOI_DE_XUAT: 'badge-red'
  };

  const marketLabels = {
    US: 'US / Tiếng Anh',
    JP: 'Nhật Bản',
    KR: 'Hàn Quốc',
    VN: 'Việt Nam',
    GLOBAL: 'Toàn cầu / Khác'
  };
  // So lieu dong 100% — zero hardcoded counts (Rule AGENTS.md §4.3)
  /* UI-fix 2026-10-09 (data): enrichedNiches luu danh sach kenh o khoa `channels` (= mauSach), khong co `mauSach`
     -> ham cu doc n.mauSach nen luon tra 0 va the "Kenh mau sach" hien "0 kenh". Dem kenh DUY NHAT tren toan bo ngach. */
  function slugifyNicheId(str) {
    return String(str || '').trim().replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  }
  function countMauSach(list, includeExtended) {
    const set = new Set();
    safeArray(list).forEach(n => {
      const pool = includeExtended ? (n.cleanAllChannels || n.cleanChannels) : n.cleanChannels;
      safeArray(pool).forEach(h => {
        const s = String(h || '').trim();
        const k = s.replace(/^@/, '').trim().toLowerCase();
        if (!k || deadBanSet.has(k) || (n.banSet && n.banSet.has(k))) return;
        set.add(k);
      });
    });
    return set.size;
  }
  const totalMauSach = countMauSach(enrichedNiches, false);
  const totalCleanAll = countMauSach(enrichedNiches, true);
  /* UI-fix 2026-10-09 (data): cach cu bo moi ky tu khong phai so khoi chuoi tu do nen doc nham "135.1K" (nhu cau search) va "407K..." thanh RPM
     (5 ngach "co du lieu", 2 trong do la rac). Chi nhan con so dung ngay sau chu "median" (benchmark nganh), khong lay so bat ky. */
  const rpmValues = enrichedNiches
    .map(n => {
      if (typeof n.rpmMedian === 'number') return n.rpmMedian;
      const m = String(n.rpm || '').match(/median\s*:?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i);
      return m ? parseFloat(m[1]) : NaN;
    })
    .filter(v => Number.isFinite(v) && v > 0);
  const rpmMedian = rpmValues.length
    ? (() => { const s = [...rpmValues].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2); })()
    : null;

  const effectiveTier = hasExactEntityQ ? '' : state.nxTier;
  const effectiveMarket = hasExactEntityQ ? '' : state.nxMarket;
  const effectiveBranch = hasExactEntityQ ? '' : state.nxBranch;
  const hasBypassedFacetFilters = Boolean(hasExactEntityQ && (state.nxTier || state.nxMarket || state.nxBranch));

  const enrichedByNgach = new Map(enrichedNiches.map(x => [x.name, x]));
  return `
  ${pageBanner('Nhận định Ngách xanh 2026', 'Bản đồ ' + enrichedNiches.length + ' ngách YouTube, định dạng an toàn (Safe Format), rủi ro chính sách (Policy Flags) và kênh đối thủ đã kiểm chứng 30 ngày.', [
    { icon: ICONS.niche, label: 'Ưu tiên sản xuất', value: tierCounts.UU_TIEN_SAN_XUAT, sub: 'Top ngách ưu tiên sản xuất 2026, demand thực, RPM cao', extraAttrs: 'data-nx-kpi-tier="UU_TIEN_SAN_XUAT"' },
    { icon: ICONS.doc, label: 'Watchlist & Test', value: (tierCounts.WATCHLIST + tierCounts.TEST_FORMAT), sub: 'Kiểm soát format & test nhỏ 5-10 video', extraAttrs: 'data-nx-kpi-tier="WATCHLIST_TEST"' },
    { icon: ICONS.channel, label: 'Kênh mẫu sạch', value: totalMauSach + ' kênh', sub: 'Mẫu chuẩn sạch (bỏ DIE/BẨN) · ' + totalCleanAll + ' kênh sạch gồm mở rộng 2026', tab: 'kenh-mau', extraAttrs: 'data-kenh-status="live"' },
    { icon: ICONS.strategy, label: 'RPM Benchmark', value: rpmMedian != null ? ('$' + rpmMedian.toFixed(2)) : 'N/A', sub: rpmValues.length ? ('Đo thực tế & Benchmark ngành từ ' + rpmValues.length + ' ngách (2026)') : 'Chưa đủ dữ liệu RPM để tính median' }
  ])
    + (() => {
      const items = (radar && radar.items) || [];
      if (!items.length) return '';
      const top = items.slice(0, 8);
      return '<section class="card p-4 sm:p-5 mb-6"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><h3 class="text-sm font-bold text-white">Radar Ngách Xanh 2026 (Top BOI &amp; Sẵn Sàng Sản Xuất)</h3><span class="text-xs font-mono radar-legend"><b>SAI</b><span class="sep"> · </span><b>PRI</b><span class="sep"> · </span><b>BOI</b></span></div><div class="radar-grid">' + top.map(function (n) {
        const matchedN = enrichedByNgach.get(n.ngach);
        const rCode = n.code || (matchedN && matchedN.code) || ('H' + String(n.legacyHang || n.hang || 1).padStart(2, '0'));
        const isActiveRadar = String(state.nxQ || '').trim().toUpperCase() === rCode.toUpperCase();
        const statusTag = n.xanh === true
          ? 'XANH'
          : (n.xanh === 'CÓ MẪU TĂNG'
              ? 'CÓ MẪU TĂNG'
              : (n.xanh === 'CÓ ĐIỀU KIỆN'
                  ? 'CÓ ĐK'
                  : (n.xanh === 'THẬN TRỌNG' ? 'THẬN TRỌNG' : 'CHƯA ĐỦ')));
        const metaParts = [rCode, statusTag, 'Hạng #' + (n.hang || '-'), (n.skus || 0) + ' SKU'];
        const boiPct = Math.min(100, Math.max(8, Math.round(Number(n.BOI || 0))));
        return '<button type="button" data-nx-radar="' + esc(rCode) + '" aria-pressed="' + (isActiveRadar ? 'true' : 'false') + '" title="Lọc và cuộn tới ngách ' + esc(rCode + ' — ' + (n.ngach || '')) + '" class="radar-card text-left w-full cursor-pointer rounded-xl border ' + (isActiveRadar ? 'border-brand bg-brand/10' : 'border-white/10 bg-white/[0.03] hover:border-brand/50') + ' p-3 min-w-0 transition-colors"><div class="title text-xs font-bold text-white mb-1">' + esc(rCode + ' · ' + (n.ngach || '')) + '</div><div class="radar-metrics"><span><span class="k">SAI</span> <span class="v">' + n.SAI + '</span></span><span><span class="k">PRI</span> <span class="v">' + n.PRI + '</span></span><span><span class="k">BOI</span> <span class="v">' + n.BOI + '</span></span></div><div class="nx-score-bar mt-1.5" aria-hidden="true"><div class="nx-score-bar-fill" style="width:' + boiPct + '%"></div></div><div class="text-xs text-gray-400 mt-1 truncate">' + esc(metaParts.join(' · ')) + '</div></button>';
      }).join('') + '</div></section>';
    })()}

  <!-- BỘ LỌC TINH GỌN (COMPACT RADAR FILTER) -->
  <section class="card nx-filter-panel p-4 sm:p-5 mb-6 border-border overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<div class="nx-filter-head flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between mb-2.5">
  <div class="relative flex-1 min-w-0" id="nx-search-wrap">
    <label class="sr-only" for="fq-nx">Tìm kiếm ngách</label>
    <input id="fq-nx" type="search" name="nx-search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="nx-search-suggestions" aria-haspopup="listbox" autocomplete="off" spellcheck="false" value="${esc(state.nxQ)}" placeholder="Tìm mã H01–H40, SUB-01–SUB-32, META-01–META-05, tên ngách, @handle kênh, tài liệu…" class="search-input-premium w-full text-xs py-2.5 min-h-[44px] ${(state.nxQ || state.nxSub) ? 'pr-9' : ''}" aria-label="Tìm kiếm ngách xanh">
    ${(state.nxQ || state.nxSub) ? `<button type="button" id="btn-clear-nx-q" aria-label="Xóa tìm kiếm ngách" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>` : ''}
    <div id="nx-search-suggestions" role="listbox" aria-label="Gợi ý tìm kiếm ngách" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-border" style="z-index:var(--h2-z-modal-top);"></div>
  </div>
  <button type="button" id="freset-nx" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors flex items-center justify-center gap-1.5"><span class="h2-ico-spin-hover inline-flex" aria-hidden="true">${ico('rotate-ccw', 14)}</span> Đặt lại</button>
</div>

<!-- Tier Filter Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none" >
  <span class="text-xs font-mono text-fg-muted shrink-0 mr-1">Tầng:</span>
  <div class="nx-filter-chips">
    <button type="button" data-nx-tier="" class="filter-btn shrink-0 ${!effectiveTier ? 'active' : ''}">Tất cả (${tierCounts.ALL})</button>
    ${effectiveTier === 'WATCHLIST_TEST' ? `<button type="button" data-nx-tier="WATCHLIST_TEST" class="filter-btn shrink-0 active">Watchlist &amp; Test (${(tierCounts.WATCHLIST || 0) + (tierCounts.TEST_FORMAT || 0)})</button>` : ''}
    ${['UU_TIEN_SAN_XUAT', 'WATCHLIST', 'TEST_FORMAT', 'KHONG_DU_EVIDENCE', 'TACH_KHOI_DE_XUAT'].map(t => {
      const active = effectiveTier === t;
      return `<button type="button" data-nx-tier="${t}" class="filter-btn shrink-0 ${active ? 'active' : ''}">${tierLabels[t]} (${tierCounts[t] || 0})</button>`;
    }).join('')}
  </div>
</div>

<!-- Market Filter Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none" >
  <span class="text-xs font-mono text-fg-muted shrink-0 mr-1">Khu vực:</span>
  <div class="nx-filter-chips">
    <button type="button" data-nx-market="" class="filter-btn shrink-0 ${!effectiveMarket ? 'active' : ''}">Tất cả (${marketCounts.ALL})</button>
    ${['US', 'JP', 'KR', 'VN', 'GLOBAL'].map(m => {
      const active = effectiveMarket === m;
      return `<button type="button" data-nx-market="${m}" class="filter-btn shrink-0 ${active ? 'active' : ''}">${marketLabels[m]} (${marketCounts[m] || 0})</button>`;
    }).join('')}
  </div>
</div>

<!-- Branch & Recent Update Filter Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none">
  <span class="text-xs font-mono text-fg-muted shrink-0 mr-1">Nguồn bài:</span>
  <div class="nx-filter-chips">
    <button type="button" data-nx-branch="" class="filter-btn shrink-0 ${!effectiveBranch ? 'active' : ''}">Tất cả (${branchNicheCounts.ALL})</button>
    <button type="button" data-nx-branch="H2DEV" class="filter-btn shrink-0 ${effectiveBranch === 'H2DEV' ? 'active' : ''}">97yo-dev (${branchNicheCounts.H2DEV})</button>
    <button type="button" data-nx-branch="HUAN" class="filter-btn shrink-0 ${effectiveBranch === 'HUAN' ? 'active' : ''}">Huân Academy (${branchNicheCounts.HUAN})</button>
    <button type="button" data-nx-branch="DGMD" class="filter-btn shrink-0 ${effectiveBranch === 'DGMD' ? 'active' : ''}">Đạt GMD (${branchNicheCounts.DGMD})</button>
    <button type="button" data-nx-branch="RECENT" class="filter-btn shrink-0 ${effectiveBranch === 'RECENT' ? 'active' : ''}" title="Các ngách vừa cập nhật bài học hoặc SOP mới">Mới cập nhật (${branchNicheCounts.RECENT})</button>
  </div>
</div>

<!-- Sort Control Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none">
  <span class="text-xs font-mono text-fg-muted shrink-0 mr-1">Sắp xếp:</span>
  <div class="nx-filter-chips">
    ${[
      ['rank', 'Hạng chuẩn #1–#40'],
      ['boi', 'Điểm BOI Radar'],
      ['rpm', 'RPM cao → thấp'],
      ['videos', 'Nhiều bài học nhất']
    ].map(([k, label]) => {
      const active = nxSortMode === k;
      return `<button type="button" data-nx-sort="${k}" class="filter-btn shrink-0 ${active ? 'active' : ''}">${label}</button>`;
    }).join('')}
  </div>
</div>
  </section>

  <!-- 4 CỬA CHÍNH SÁCH YOUTUBE (COLLAPSIBLE ACCESSIBLE BANNER) -->
  <details class="card p-4 sm:p-5 mb-6 border-amber-900/30 bg-amber-950/10 group">
<summary class="flex items-center justify-between cursor-pointer font-semibold text-xs text-amber-300 select-none py-2 min-h-[44px]">
  <div class="flex items-center gap-2">
    <span aria-hidden="true">${ico('shield', 14)}</span>
    <span>4 Cửa ải chính sách kiếm tiền YouTube 2026 (Bấm để xem chi tiết)</span>
  </div>
  <span class="text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono">${ico('chevron-down', 14)}</span>
</summary>
<div class="policy-grid mt-3 pt-3 border-t border-amber-900/30">
  <div class="policy-card">
    <div class="font-bold text-amber-300 mb-1 text-xs inline-flex items-center gap-1.5">${ico('door-open', 14)} Cửa 1: Inauthentic / Spam</div>
    <p class="text-gray-300 leading-relaxed text-xs">Cấm dùng 1 template nhân vật / quote lặp lại hàng loạt. Mỗi video phải có kịch bản và case-study mới.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-rose-300 mb-1 text-xs inline-flex items-center gap-1.5">${ico('door-open', 14)} Cửa 2: Distress / Harmful</div>
    <p class="text-gray-300 leading-relaxed text-xs">Cấm dàn dựng cứu hộ động vật, trẻ em đau khổ, bạo lực hay thumbnail gây sốc lừa dối người xem.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-sky-300 mb-1 text-xs inline-flex items-center gap-1.5">${ico('door-open', 14)} Cửa 3: Fake AI Persona</div>
    <p class="text-gray-300 leading-relaxed text-xs">Cấm AI giả dạng Bác sĩ, Dược sĩ, Luật sư để chẩn đoán bệnh hoặc tư vấn tài chính / cam kết làm giàu.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-emerald-300 mb-1 text-xs inline-flex items-center gap-1.5">${ico('door-open', 14)} Cửa 4: Reused Content</div>
    <p class="text-gray-300 leading-relaxed text-xs">Cấm reup hoạt hình/phim ảnh thô thiển. Phải có lời bình sâu sắc và biến đổi thực chất (Transformative).</p>
  </div>
</div>
${audit.yppPolicyMattHalprin2026 ? `<div class="mt-3 pt-3 border-t border-amber-900/30 text-xs text-gray-300 space-y-1.5">
  <div class="font-bold text-amber-200">${esc(audit.yppPolicyMattHalprin2026.tenChinhSach || '')}</div>
  ${safeArray(audit.yppPolicyMattHalprin2026.baNhomKiemDuyet).map(item => `<div class="leading-relaxed">• ${esc(item)}</div>`).join('')}
  ${audit.ketLuanChotHa ? `<div class="pt-1 text-emerald-300 font-medium">${esc(audit.ketLuanChotHa)}</div>` : ''}
</div>` : ''}
  </details>

  <!-- TIÊU ĐỀ KẾT QUẢ -->
  <div class="mb-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
<div>${exactMetaQ ? `Đang hiển thị nhóm quy trình kỹ thuật: <b class="text-white">${esc(exactMetaQ)}</b> (tách riêng khỏi ${enrichedNiches.length} ngách nội dung)` : `Đang hiển thị: <b class="text-white">${filtered.length}</b> / ${enrichedNiches.length} ngách`}</div>
<div class="flex flex-wrap items-center gap-1.5">
  ${activeSubTarget ? `<button type="button" data-nx-sub-chip="${esc(activeSubTarget)}" aria-pressed="true" class="badge badge-amber border-brand/40 font-semibold cursor-pointer inline-flex items-center gap-1" title="Bấm để bỏ lọc vi ngách ${esc(activeSubTarget)}">Vi ngách: #${esc(activeSubTarget)} <span aria-hidden="true">×</span></button>` : ''}
  ${hasBypassedFacetFilters ? '<span class="badge badge-muted">Đang tra cứu mã chính xác (tạm bỏ lọc tầng/khu vực/nguồn)</span>' : ''}
  ${(effectiveTier || effectiveMarket || effectiveBranch || state.nxQ || state.nxSub || (state.nxSort && state.nxSort !== 'rank')) ? '<span class="text-brand-ink font-medium">Đang áp dụng bộ lọc / sắp xếp</span>' : ''}
</div>
  </div>

  <!-- DANH SÁCH THẺ NGÁCH TINH GỌN (TWO-COLUMN INTEL CARDS) -->
  ${exactMetaQ ? '' : `${nxPager('top')}
  <div class="niche-grid ${nxTotalPages > 1 ? 'mb-4' : 'mb-8'}">
${nxItems.map(n => {
  const isTopTier = n.tier === 'UU_TIEN_SAN_XUAT';
  const isWatchlist = n.tier === 'WATCHLIST';
  const key = nicheKeyFor(n.name);
  const rankBadgeClass = isTopTier ? 'rank-badge-gold' : (isWatchlist ? 'rank-badge-silver' : 'rank-badge-slate');

  const tierClass = n.tier === 'UU_TIEN_SAN_XUAT' ? 'is-tier-uu-tien' : (n.tier === 'WATCHLIST' ? 'is-tier-watchlist' : (n.tier === 'TEST_FORMAT' ? 'is-tier-test' : (n.tier === 'KHONG_DU_EVIDENCE' ? 'is-tier-evidence' : 'is-tier-tach')));
  const branchSummaryParts = [
    n.branchCounts.H2DEV ? `${n.branchCounts.H2DEV} H2` : '',
    n.branchCounts.HUAN ? `${n.branchCounts.HUAN} Huân` : '',
    n.branchCounts.DGMD ? `${n.branchCounts.DGMD} DGMD` : ''
  ].filter(Boolean);
  return `
  <article id="niche-card-${esc(n.code)}" data-niche-code="${esc(n.code)}" class="niche-card p-0 ${tierClass} ${isTopTier ? 'border-brand/40 bg-surface/90' : ''}">
      <div class="nc-header">
        <span class="nc-rank ${rankBadgeClass}">#${n.rank}</span>
        <div class="nc-title">
          <div class="nc-badges">
            <span class="badge ${tierBadges[n.tier] || 'badge-muted'}">${tierLabels[n.tier] || n.tier}</span>
            <span class="badge badge-muted">${esc(n.code)} · ${marketLabels[n.marketTag] || n.marketTag}</span>
            ${n.vids.length ? `<span class="badge badge-muted" title="Phân bổ bài học 3 nhánh: ${n.branchCounts.H2DEV} H2DEV · ${n.branchCounts.HUAN} Huân · ${n.branchCounts.DGMD} Đạt GMD">${n.vids.length} bài (${esc(branchSummaryParts.join(' · '))})</span>` : ''}
            <span class="badge badge-muted" title="${esc((n.resolvedDocs || []).map(d => d.label).join(' | '))}">${(n.resolvedDocs || []).length} tài liệu</span>
            ${n.hasRecent ? `<span class="badge badge-green" title="Ngách vừa có ${n.recentCount} bài học / SOP mới cập nhật">MỚI · +${n.recentCount}</span>` : ''}
            ${(n.skills && n.skills.length) ? `<span class="badge badge-blue" title="Skills: ${esc(n.skills.join(', '))}">${esc(n.skills[0])}${n.skills.length > 1 ? ' +' + (n.skills.length - 1) : ''}</span>` : ''}
          </div>
          <h3 class="nc-name">${esc(n.name)}</h3>
          ${n.nenLamNote ? `<div class="mt-1.5 text-xs text-amber-300 bg-amber-950/10 px-2 py-1 rounded border border-amber-900/30 leading-snug"><span class="font-semibold text-amber-200">Khuyến nghị:</span> ${esc(n.nenLamNote)}</div>` : ''}
        </div>
      </div>
    <div class="nx-card-facts mb-3">
      <div class="nx-card-kpi">
        <span title="${esc(n.rpm || 'Chưa đo')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="glyph-inline"><path d="M3 13h4v8H3zm6-9h4v17H9zm6 4h4v13h-4z"/></svg> <b>RPM</b> ${esc(n.rpmShort)}</span>
        <span title="${esc(n.competition || 'Chưa đo')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="glyph-inline"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg> <b>Cạnh tranh</b> ${esc(n.competitionShort)}</span>
      </div>
      <div class="nx-card-point leading-relaxed"><b class="text-white font-semibold"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="glyph-inline"><path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/></svg> Luận điểm:</b> ${esc(n.thesis)}</div>
      <div class="nx-card-point leading-relaxed"><b class="text-emerald-400 font-semibold"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="glyph-inline"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> Safe Format:</b> ${esc(n.safeFormat)}</div>
      <div class="nx-card-point leading-relaxed"><b class="text-rose-400 font-semibold"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="glyph-inline"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Tránh:</b> ${esc(n.avoidTrap)}</div>
      <button type="button" class="nx-card-point-toggle hidden" data-nx-expand-points aria-expanded="false" hidden>Xem đầy đủ ▾</button>
      ${(n.subNiches2026 && n.subNiches2026.length) ? `<div class="nx-card-subniches leading-relaxed"><b class="text-sky-300 font-semibold">Vi ngách 2026 (${n.subNiches2026.length}):</b> ${n.subNiches2026.map(sn => {
        const rpmVal = sn.benchmarkRPM ? (sn.benchmarkRPM.median ? ('$' + sn.benchmarkRPM.median) : (sn.benchmarkRPM.min ? ('$' + sn.benchmarkRPM.min + '-' + sn.benchmarkRPM.max) : '')) : '';
        const chs = safeArray(sn.sampleChannels);
        const tipParts = [
          sn.title,
          rpmVal ? ('RPM ' + rpmVal) : '',
          sn.formula ? ('Format: ' + sn.formula) : '',
          sn.vphVelocity ? ('VPH: ' + sn.vphVelocity) : '',
          sn.inStreamAdRatio ? ('InStream: ' + sn.inStreamAdRatio) : '',
          chs.length ? ('Kênh: ' + chs.join(', ')) : ''
        ].filter(Boolean);
        const sCode = String(sn.subCode || '').toUpperCase();
        const isSubHit = Boolean(activeSubTarget && activeSubTarget === sCode);
        return `<button type="button" id="subniche-${esc(sCode)}" data-nx-sub-chip="${esc(sCode)}" aria-pressed="${isSubHit ? 'true' : 'false'}" class="badge ${isSubHit ? 'badge-amber border-brand/40 font-bold ring-2 ring-brand-400' : 'badge-blue'} mr-1 mb-1 cursor-pointer" title="${esc(tipParts.join(' · ') + ' (Bấm để lọc vi ngách ' + sCode + ')')}">#${esc(sn.subCode)} ${esc(sn.title)}${rpmVal ? ` · ${esc(rpmVal)}` : ''}</button>`;
      }).join('')}</div>` : ''}
      ${(n.subNiches120 && n.subNiches120.length) ? `<div class="nx-card-subniches leading-relaxed"><b class="text-gray-400 font-semibold">Vi ngách truyền thống (${n.subNiches120.length}):</b> ${n.subNiches120.map((sn, idx) => {
        const snIdPad = String(sn.id || '').padStart(3, '0');
        const nCodeUp = String(n.code || '').toUpperCase();
        const snCode1 = ('SN-' + nCodeUp + '-' + snIdPad).toUpperCase();
        const snCode2 = ('SN-' + nCodeUp + '-' + String(idx + 1).padStart(3, '0')).toUpperCase();
        const allowGlobalSub120 = !sub120ParentCode || sub120ParentCode === nCodeUp;
        const isSub120Hit = Boolean(activeSubTarget && (activeSubTarget === snCode1 || activeSubTarget === snCode2 || (allowGlobalSub120 && activeSubTarget === ('SUB-' + snIdPad))));
        return `<button type="button" id="subniche-${esc(snCode1)}" data-sub-idx-id="subniche-${esc(snCode2)}" data-nx-sub-chip="${esc(snCode1)}" aria-pressed="${isSub120Hit ? 'true' : 'false'}" class="badge ${isSub120Hit ? 'badge-amber border-brand/40 font-bold ring-2 ring-brand-400' : 'badge-muted'} mr-1 mb-1 cursor-pointer" title="${esc((sn.formula || '') + ' · RPM ' + (sn.rpm || '') + ' (Bấm để lọc vi ngách ' + snCode1 + ')')}">#${esc(sn.id)} ${esc(sn.name)}</button>`;
      }).join('')}</div>` : ''}
    </div>
    ${n.channels.length ? `
    <div class="mb-2">
      <div class="nx-card-channel-label">Kênh đối thủ tham khảo (${n.totalClean} sạch${n.deadOrBanCount ? ` / ${n.allChannelsCount} tổng · ${n.deadOrBanCount} DIE/BẨN` : ' kênh'}):</div>
      <div class="nc-channels">
        ${n.channels.map(ch => renderNxChannelChip(ch, n, false)).join('')}
      </div>
      ${(n.kenhMoRong2026 && n.kenhMoRong2026.length) ? `<details class="nx-drawer mt-1 text-xs group min-w-0">
        <summary class="flex items-center justify-between cursor-pointer text-sky-400 hover:text-white font-medium select-none">
          <span class="flex items-center gap-1.5 min-w-0">
            <span class="text-sky-400 shrink-0 inline-flex" aria-hidden="true">${ico('tv', 14)}</span>
            <span class="truncate min-w-0">${esc(n.drawerLabel || ('+' + n.kenhMoRong2026.length + ' kênh mở rộng 2026 (bấm để xem)'))}</span>
          </span>
          <span class="nx-chevron-rot text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono shrink-0">${ico('chevron-down', 14)}</span>
        </summary>
        <div class="nc-channels">
          ${n.kenhMoRong2026.map(ch => {
            const cleanH = String(ch || '').trim().replace(/^@/, '').trim().toLowerCase();
            return renderNxChannelChip(ch, n, Boolean(n.extSet && n.extSet.has(cleanH)));
          }).join('')}
        </div>
      </details>` : ''}
    </div>` : ''}
    ${(n.resolvedDocs && n.resolvedDocs.length) ? `<details class="nx-drawer text-xs group min-w-0">
      <summary class="flex items-center justify-between cursor-pointer text-gray-300 hover:text-white font-medium select-none">
        <span class="flex items-center gap-1.5 min-w-0">
          <span class="text-gray-400 shrink-0 inline-flex" aria-hidden="true">${ico('file-text', 14)}</span>
          <span class="truncate min-w-0">Tài liệu &amp; SOP ngách (${n.resolvedDocs.length})</span>
        </span>
        <span class="nx-chevron-rot text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono shrink-0">${ico('chevron-down', 14)}</span>
      </summary>
      <div class="mt-1.5 space-y-1">
        ${n.resolvedDocs.map(rd => {
          if (rd.docDid && rd.docIdx >= 0) {
            return `<a href="/tai-lieu?did=${esc(rd.docDid)}&di=${rd.docIdx}" data-open-tab="tai-lieu" data-doc-did="${esc(rd.docDid)}" data-doc-idx="${rd.docIdx}" class="text-brand-400 hover:text-brand-300 flex items-center min-h-[44px] py-1.5 min-w-0" title="Mở tài liệu ${esc(rd.title)} trong tab Tài liệu"><span class="truncate min-w-0">↗ ${esc(rd.label)}</span></a>`;
          }
          const rawDocRef = String(rd.raw || '').trim();
          if (/^https?:\/\//i.test(rawDocRef)) {
            const safeExtDoc = safeExternalUrl(rawDocRef);
            if (safeExtDoc) {
              return `<a href="${esc(safeExtDoc)}" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white flex items-center min-h-[44px] py-1.5 min-w-0" title="${esc(rd.title)}"><span class="truncate min-w-0">↗ ${esc(rd.label)}</span></a>`;
            }
          } else if (/^(?:\/|assets\/|docs\/|data-tabs\/|file\/)/i.test(rawDocRef) || /^[a-z0-9_.-]+\/[a-z0-9_.\-\/]+\.[a-z0-9]{2,5}$/i.test(rawDocRef)) {
            const safeRelDoc = safeUrl(rawDocRef);
            if (safeRelDoc) {
              return `<a href="${esc(safeRelDoc)}" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white flex items-center min-h-[44px] py-1.5 min-w-0" title="${esc(rd.title)}"><span class="truncate min-w-0">↗ ${esc(rd.label)}</span></a>`;
            }
          }
          return `<span class="text-gray-300 flex items-center gap-1.5 min-h-[44px] py-1.5 min-w-0" title="${esc(rd.title)}"><span class="badge badge-muted shrink-0">Ghi chú</span><span class="truncate min-w-0">${esc(rd.label)}</span></span>`;
        }).join('')}
      </div>
    </details>` : ''}
    <div class="nx-card-action mt-auto pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2">
      ${n.vids.length ? `<button type="button" data-open-niche="${esc(n.code + ' — ' + n.name)}" data-skus="${esc(n.vids.map(v => v.sku).join(','))}" class="text-xs text-brand-ink hover:text-brand-hover font-semibold min-h-[44px] px-1" title="Mở ${n.vids.length} video bài học ngách ${esc(n.code + ' — ' + n.name)}">Xem ${n.vids.length} video liên quan →</button>` : `<span class="text-xs text-gray-500 flex items-center gap-1.5 min-h-[44px]">${ico('circle', 14)} Chưa có video</span>`}
      <div class="flex flex-wrap items-center gap-1.5 ml-auto">
        ${(n.resolvedDocs && n.resolvedDocs.length) ? `<button type="button" class="filter-btn text-xs" data-open-tab="tai-lieu" data-doc-q="${esc(n.code)}" title="Mở ${n.resolvedDocs.length} tài liệu &amp; SOP thuộc ngách ${esc(n.code + ' — ' + n.name)}">Tài liệu (${n.resolvedDocs.length}) ↗</button>` : ''}
        <button type="button" class="filter-btn text-xs" data-open-tab="kenh-mau" data-kenh-niche="${esc(n.code)}" title="Xem ${n.totalClean} kênh sạch (${n.allChannelsCount} tổng đối chứng) thuộc ngách ${esc(n.code + ' — ' + n.name)}">Kênh mẫu (${n.deadOrBanCount ? `${n.totalClean}/${n.allChannelsCount}` : n.totalClean}) ↗</button>
        <button type="button" class="filter-btn text-xs" data-open-tab="rawkenh" data-raw-q="${esc(n.code)}" title="Xem hồ sơ Raw kênh thuộc ngách ${esc(n.code + ' — ' + n.name)}">Raw kênh ↗</button>
        <button type="button" class="filter-btn text-xs" data-sodo-jump="niche:${esc(slugifyNicheId(n.name))}" title="Xem ngách ${esc(n.name)} trên Sơ đồ DB">Sơ đồ DB ↗</button>
      </div>
    </div>
  </article>`;
}).join('') || `<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2 flex justify-center">${ico('search', 24)}</div><p class="mb-3">Không tìm thấy ngách phù hợp với bộ lọc hiện tại.</p><button type="button" id="freset-nx-empty" class="bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Xóa bộ lọc</button></div>`}
  </div>
  ${nxPager('bottom')}`}


  <!-- META TRONG KHO -->
  ${(() => {
    const rawMeta = safeArray(nx.ngachMetaKho);
    if (!rawMeta.length) return '';
    const isFilterActive = Boolean(q || state.nxTier || state.nxMarket || state.nxBranch || state.nxSub);
    const metaEntries = rawMeta.map((n, idx) => {
      const mCode = String(n.code || ('META-0' + (idx + 1))).toUpperCase();
      const mNicheLower = String(n.ngach || '').trim().toLowerCase();
      const vids = vidsFor(Object.assign({}, n, { skus: (n.skus && n.skus.length) ? n.skus : videos.filter(v => String(v.niche || '').trim().toLowerCase() === mNicheLower).map(v => v.sku) }));
      const mBranches = { H2DEV: 0, HUAN: 0, DGMD: 0 };
      let mRecent = 0;
      vids.forEach(v => {
        const b = v._branch || (v.isHuan ? 'HUAN' : (v.isDgmd ? 'DGMD' : 'H2DEV'));
        mBranches[b] = (mBranches[b] || 0) + 1;
        if (isRecentlyIngestedVideo(v)) mRecent += 1;
      });
      return { n, idx, mCode, vids, mBranches, mRecent };
    }).filter(entry => {
      if (exactMetaQ) return entry.mCode === exactMetaQ;
      if (!isFilterActive) return true;
      if (exactCodeQ || exactSubCodeQ || exactSub26Q || exactSub120Q || exactTlQ || exactDocNumQ) return false;
      if (state.nxBranch) {
        if (state.nxBranch === 'RECENT' && entry.mRecent <= 0) return false;
        if (state.nxBranch !== 'RECENT' && (entry.mBranches[state.nxBranch] || 0) <= 0) return false;
      }
      if (!q) return true;
      if (exactSkuQ) {
        return entry.vids.some(v => String(v.sku || '').toUpperCase() === exactSkuQ);
      }
      const mHay = [
        entry.mCode,
        entry.n.ngach || '',
        entry.n.vaiTro || '',
        entry.n.evidence || '',
        entry.vids.map(v => v.sku + ' ' + v.title).join(' ')
      ].join(' ').toLowerCase();
      return SC.matchesQuery([mHay], q);
    });
    if (!metaEntries.length) return '';
    return `
  <div id="nx-meta-section" class="card p-4 sm:p-5 mb-6">
<h2 class="page-h2 mb-1">Meta &amp; Quy trình kỹ thuật (3 nhánh)</h2>
<p class="card-note">Bài học về nhân bản, share key, chính sách, edit và AI tool từ cả 3 nhánh (97yo-dev, Huân Academy, Đạt GMD). Chỉ dùng để học quy trình, tách riêng khỏi 40 ngách nội dung để tránh loãng thống kê ngách.</p>
<div class="space-y-3">${metaEntries.map(({ n, mCode, vids, mBranches, mRecent }) => {
  const isMetaActive = Boolean(exactMetaQ && exactMetaQ === mCode);
  const autoOpenVids = isMetaActive || Boolean(exactSkuQ);
  const hidden = autoOpenVids ? 0 : Math.max(0, vids.length - 3);
  const mParts = [
    mBranches.H2DEV ? `${mBranches.H2DEV} H2` : '',
    mBranches.HUAN ? `${mBranches.HUAN} Huân` : '',
    mBranches.DGMD ? `${mBranches.DGMD} DGMD` : ''
  ].filter(Boolean);
  return `<div id="meta-card-${esc(mCode)}" class="policy-card${isMetaActive ? ' ring-2 ring-brand-400 bg-brand-950/20' : ''}">
    <div class="flex flex-wrap items-center gap-2 mb-1.5">
      <span class="badge badge-blue font-mono font-bold">${esc(mCode)}</span>
      <span class="badge ${n.xanh === 'THẬN TRỌNG' ? 'badge-amber' : 'badge-muted'} font-bold">${esc(n.xanh)}</span>
      <b class="text-white text-sm">${esc(n.ngach)}</b>
      <span class="text-xs text-gray-400">(${vids.length} video · ${esc(mParts.join(' · '))})</span>
      ${mRecent > 0 ? `<span class="badge badge-green" title="Nhóm Meta vừa cập nhật ${mRecent} bài học mới">MỚI · +${mRecent}</span>` : ''}
      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <button type="button" data-open-tab="tai-lieu" data-doc-q="${esc(mCode)}" class="filter-btn text-xs" title="Mở các tài liệu SOP thuộc nhóm ${esc(mCode)} (${esc(n.ngach)})">Tài liệu ↗</button>
        <button type="button" data-sodo-jump="${esc(mCode)}" class="filter-btn text-xs" title="Xem nhóm ${esc(mCode)} trên Sơ đồ DB">Sơ đồ DB ↗</button>
        ${vids.length ? `<button type="button" data-open-niche="${esc(n.ngach)}" data-skus="${esc(vids.map(v => v.sku).join(','))}" class="text-xs text-brand-400 hover:text-brand-300 font-medium min-h-[44px] px-2 inline-flex items-center">Mở ${vids.length} video →</button>` : ''}
      </div>
    </div>
    <div class="text-xs text-gray-300 leading-relaxed mb-2 [overflow-wrap:anywhere]"><b class="text-gray-200">${esc(n.vaiTro)}:</b> ${esc(n.evidence)}</div>
    ${vids.length ? `<div class="space-y-2" data-niche-list>${vids.map((v, i) => videoRow(v, (!autoOpenVids && i >= 3) ? 'hidden' : '', (!autoOpenVids && i >= 3) ? 'data-more' : '')).join('')}${hidden ? `<div class="text-center mt-2"><button type="button" data-expand-niche data-hidden-count="${hidden}" aria-expanded="false" class="text-xs text-gray-300 hover:text-white bg-ink-700 border border-ink-600 px-3.5 py-2 min-h-[44px] rounded-xl inline-flex items-center justify-center">+ ${hidden} video khác ▾</button></div>` : ''}</div>` : ''}
  </div>`;
}).join('')}</div>
  </div>`;
  })()}

  <!-- NGÁCH ĐỎ CẦN TRÁNH -->
  ${(() => {
    const redList = safeArray(nx.ngachDoCanTranh);
    const isFilterActive = Boolean(q || state.nxTier || state.nxMarket || state.nxBranch || state.nxSub);
    const isRedSearch = Boolean(q && !hasExactEntityQ);
    const matchedRed = isRedSearch
      ? redList.filter(n => SC.matchesQuery([[n.ngach || '', n.lydo || ''].join(' ').toLowerCase()], q))
      : redList;
    const redGridHtml = isRedSearch && !matchedRed.length
      ? `<div class="policy-card text-xs text-gray-300 flex flex-wrap items-center justify-between gap-2"><span>Không có ngách đỏ khớp từ khóa <b class="text-white">"${esc(state.nxQ)}"</b>.</span><button type="button" data-action="nx-reset-filters" class="filter-btn text-xs">Đặt lại bộ lọc</button></div>`
      : `<div class="niche-grid">${matchedRed.map(n => `<div class="policy-card"><span class="badge badge-red mr-2 font-bold">CẤM</span><b class="text-white">${esc(n.ngach)}</b><p class="text-gray-300 mt-1 leading-relaxed">${esc(n.lydo)}</p></div>`).join('')}</div>`;
    if (isFilterActive) {
      const openRed = Boolean(isRedSearch && matchedRed.length > 0);
      return `<details class="card p-4 sm:p-5 mb-6 group"${openRed ? ' open' : ''}><summary class="flex items-center justify-between cursor-pointer font-semibold text-xs text-rose-300 select-none py-1 min-h-[44px]"><span>Ngách ĐỎ tuyệt đối tránh (${redList.length} nhóm cấm — bấm để mở)</span><span class="text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono">${ico('chevron-down', 14)}</span></summary><div class="mt-3 pt-3 border-t border-border">${redGridHtml}</div></details>`;
    }
    return `<div class="card p-4 sm:p-5 mb-6"><h2 class="page-h2 mb-3">Ngách ĐỎ tuyệt đối tránh</h2>${redGridHtml}</div>`;
  })()}

  <!-- THỊ TRƯỜNG & RPM FOOTNOTE -->
  ${(() => {
    const isFilterActive = Boolean(q || state.nxTier || state.nxMarket || state.nxBranch || state.nxSub);
    const mktEntries = Object.entries(nx.thiTruongXanh || {});
    const mktHtml = `<div class="niche-grid mb-4">${mktEntries.map(([k, v]) => `<div class="policy-card"><b class="text-brand-ink block mb-1 text-sm">${esc(k)}</b><span class="text-gray-300 leading-relaxed [overflow-wrap:anywhere]">${esc(v)}</span></div>`).join('')}</div>${nx.rpmNote ? `<div class="policy-card text-xs text-gray-400 leading-relaxed [overflow-wrap:anywhere]">${esc(nx.rpmNote)}</div>` : ''}`;
    if (isFilterActive) {
      return `<details class="card p-4 sm:p-5 group"><summary class="flex items-center justify-between cursor-pointer font-semibold text-xs text-gray-300 select-none py-1 min-h-[44px]"><span>Định vị thị trường &amp; benchmark RPM 2026 (bấm để mở)</span><span class="text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono">${ico('chevron-down', 14)}</span></summary><div class="mt-3 pt-3 border-t border-border">${mktHtml}</div></details>`;
    }
    return `<div class="card p-4 sm:p-5"><h2 class="page-h2">Định vị thị trường &amp; benchmark RPM 2026</h2>${mktHtml}</div>`;
  })()}`;
}


async function renderKichBan() {
  const [kichRaw, nxRaw, vH2, vHuan, vDgmd] = await Promise.all([
    loadJSON('data-tabs/tai-lieu-full.json').catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => ({})),
    loadJSON('data-tabs/videos.json').catch(() => []),
    loadJSON('data/videos_huan.json').catch(() => []),
    loadJSON('data/videos_dgmd.json').catch(() => []),
    loadMusicStats().catch(() => {})
  ]);
  const kich = safeArray(kichRaw);
  const videos = [
    ...safeArray(vH2).map(v => Object.assign({}, v, { _branch: 'H2DEV' })),
    ...safeArray(vHuan).map(v => Object.assign({}, v, { isHuan: true, _branch: 'HUAN' })),
    ...safeArray(vDgmd).map(v => Object.assign({}, v, { isDgmd: true, _branch: 'DGMD' }))
  ];
  const bySku = Object.fromEntries(videos.map(v => [v.sku, v]));
  const KIND_LABEL = { prompt: 'Prompt', list: 'List kênh', tool: 'Tool', drive: 'Drive', form: 'Form', ai: 'AI gen', report: 'Báo cáo', 'internal-doc': 'Tài liệu nội bộ', sop: 'SOP', guide: 'Hướng dẫn', transcript: 'Phụ đề', sheet: 'Bảng tính', other: 'Khác' };
  const KIND_BADGE = { prompt: 'badge-brand', list: 'badge-blue', tool: 'badge-amber', drive: 'badge-green', form: 'badge-red', ai: 'badge-blue', report: 'badge-green', 'internal-doc': 'badge-muted', sop: 'badge-green', guide: 'badge-blue', transcript: 'badge-muted', sheet: 'badge-amber', other: 'badge-muted' };
  const BRANCH_LABEL = { H2DEV: '97yo-dev (H2DEV)', HUAN: 'Huân Academy', DGMD: 'Đạt GMD', 'NOI-BO': 'Nội bộ & SOP', PIPELINE: 'Pipelines' };
  const BRANCH_SHORT = { H2DEV: 'H2DEV', HUAN: 'Huân Academy', DGMD: 'Đạt GMD', 'NOI-BO': 'Nội bộ', PIPELINE: 'Pipeline' };
  const BRANCH_BADGE = { H2DEV: 'badge-brand', HUAN: 'badge-amber', DGMD: 'badge-blue', 'NOI-BO': 'badge-green', PIPELINE: 'badge-muted' };
  const NICHE_ORDER = ['Triết lý / Tâm linh', 'Sức khỏe / Lão hóa', 'Kinh tế / Tài chính', 'Reup / Hoạt hình', 'Drama / Stories', 'Lịch sử / Quân sự', 'Everyday History EN (lịch sử đồ vật thường ngày)', 'Khoa học EN', 'Edit / Thumb', 'Nhân bản / Kênh', 'Share key / Ngách nhỏ', 'Kiếm tiền / Chính sách', 'Hệ thống / Quy trình', 'Nền tảng / Tool', 'Khác'];
  const CANON_DOC_NICHE = {
    'Triết Lý Sống & Đạo Làm Người': 'Triết lý / Tâm linh',
    'Tâm Linh & Thu Hút May Mắn': 'Triết lý / Tâm linh',
    'Triết Lý & Phật Pháp': 'Triết lý / Tâm linh',
    'Lời Chúa & Tâm Linh Ngoại': 'Triết lý / Tâm linh',
    'Sức Khỏe & Dinh Dưỡng': 'Sức khỏe / Lão hóa',
    'Drama Gia Đình & Xã Hội': 'Drama / Stories',
    'Reup & Khai Thác Hoạt Hình': 'Reup / Hoạt hình',
    'Prompt AI & Nhân Bản Kịch Bản': 'Nền tảng / Tool',
    'Bán Content & Phát Triển Kênh': 'Share key / Ngách nhỏ',
    'Khám Kênh & Tối Ưu Tăng Trưởng': 'Share key / Ngách nhỏ',
    'Kháng Bản Quyền & Xử Lý Lỗi GA': 'Kiếm tiền / Chính sách'
  };
  function inferDocBranch(item, video) {
    const rawB = String(item.branch || '').toUpperCase();
    if (rawB && BRANCH_LABEL[rawB]) return rawB;
    if (video && video._branch) return video._branch;
    const f = String(item.file || item.fileLocal || '');
    if (f.includes('docs-huan/')) return 'HUAN';
    if (f.includes('docs-dgmd/')) return 'DGMD';
    if (f.startsWith('pipelines/')) return 'PIPELINE';
    if (f.startsWith('docs/NOI-BO/') || item.source === 'noi-bo') return 'NOI-BO';
    return 'H2DEV';
  }
  function classifyPrompt(item) {
    if (item.kind) return item.kind;
    const name = (item.name || '').toLowerCase();
    const link = item.link || '';
    const file = (item.file || '').toLowerCase();
    const blob = name + ' ' + file + ' ' + link;
    // Gap G5 (2026-10-14): muc khong co `kind` ma la phu de / SOP khong duoc roi vao 'prompt' (.txt) hay 'report' (tu "quet").
    if (/transcript\.txt$/.test(file) || /^bản ghi phụ đề/.test(name)) return 'transcript';
    if (/^sop\b/.test(name)) return 'sop';
    if (/forms\.gle|docs\.google\.com\/forms/.test(link) || /forms|mua kênh/.test(name)) return 'form';
    if (/labs\.google|dreamina|capcut|tạo ảnh|tạo video/.test(blob)) return 'ai';
    if (/vietsubmmo|tool tải|tool quay|tool cắt|\.zip/.test(blob)) return 'tool';
    if (/drive\.google/.test(link)) return 'drive';
    if (/spreadsheets/.test(link) || /\.csv$/.test(file) || /\blist\b|danh sách|kênh key|link kênh|nguồn reup|nguồn video/.test(name)) return 'list';
    if (/báo cáo|nhận định|verify|quét|cross-check|đánh giá|phân tích mcp/.test(name)) return 'report';
    if (/prompt|câu lệnh|train chatgpt|hashtag|seo|skill/.test(name) || /\.txt$/.test(file)) return 'prompt';
    return 'other';
  }
  function inferContentNiche(item, video) {
    if (item.contentNiche) {
      return CANON_DOC_NICHE[item.contentNiche] || NICHE_MAP[item.contentNiche] || nicheKeyFor(item.contentNiche) || item.contentNiche;
    }
    const t = ((item.name || '') + ' ' + (item.file || '')).toLowerCase();
    if (/kinh tế|quy luật kinh tế|tài chính|rpm/.test(t)) return 'Kinh tế / Tài chính';
    if (/sức khỏe|lão hóa|senior/.test(t)) return 'Sức khỏe / Lão hóa';
    if (/triết|tâm linh|phật|khắc kỷ|luật hấp dẫn|đứa trẻ|sinh học|chiến thuật|tâm lý/.test(t)) return 'Triết lý / Tâm linh';
    if (/world war|tiền sử|lịch sử|quân sự|cảnh sát/.test(t)) return 'Lịch sử / Quân sự';
    if (/reup|douyin|bilibili|hoạt hình/.test(t)) return 'Reup / Hoạt hình';
    if (/thumb|edit|nonagon|hashtag|seo/.test(t)) return 'Edit / Thumb';
    if (/tool tải|quay màn hình|cắt ghép|tài khoản giá rẻ|elevenlab|minimax/.test(t)) return 'Nền tảng / Tool';
    if (/train chatgpt|câu lệnh train|prompt train|prompt demo|prompt master|tự tạo prompt|tạo ảnh ai/.test(t)) return 'Nền tảng / Tool';
    if (/nhân bản|thị trường/.test(t) && /prompt/.test(t)) return 'Nhân bản / Kênh';
    if (/kênh key|link kênh|list kênh|đối thủ/.test(t)) return 'Share key / Ngách nhỏ';
    if (video && video.niche && video.niche !== 'Khác') {
      return CANON_DOC_NICHE[video.niche] || NICHE_MAP[video.niche] || nicheKeyFor(video.niche) || video.niche;
    }
    return 'Khác';
  }
  function cleanName(name) {
    let t = String(name || '').trim();
    if (/^https?:\/\//i.test(t)) {
      const m = t.match(/\/d\/([a-zA-Z0-9_-]{6,})/);
      return m ? ('Tài nguyên Drive · ' + m[1].slice(0, 8)) : 'Tài nguyên Drive';
    }
    t = t.replace(/\s*\((bấm vào đây|bấm vào tại đây|bấm vào đây để liên hệ)[^)]*\)/gi, '')
      .replace(/\s*-\s*H2DEV\s*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return t || 'Tài nguyên';
  }
  function hostLabel(link) {
    if (!link) return '';
    if (/docs\.google\.com\/document/.test(link)) return 'Google Docs';
    if (/docs\.google\.com\/spreadsheets/.test(link)) return 'Google Sheet';
    if (/docs\.google\.com\/forms|forms\.gle/.test(link)) return 'Google Form';
    if (/drive\.google/.test(link)) return 'Google Drive';
    if (/labs\.google/.test(link)) return 'Google Labs';
    if (/dreamina|capcut/.test(link)) return 'Dreamina';
    if (/vietsubmmo/.test(link)) return 'Tool ZIP';
    try { return new URL(link).hostname.replace(/^www\./, ''); } catch (e) { return 'Link'; }
  }
  function fileLabel(file) {
    if (!file) return '';
    const n = file.split('/').pop();
    const ext = (n.split('.').pop() || '').toLowerCase();
    return (ext && ext !== n.toLowerCase()) ? ext.toUpperCase() : 'FILE';
  }
  const enriched = kich.map((item, idx) => {
    const kind = classifyPrompt(item);
    const video = bySku[item.sku];
    const contentNiche = inferContentNiche(item, video);
    const branch = inferDocBranch(item, video);
    return Object.assign({}, item, {
      _i: idx,
      kind,
      branch,
      title: cleanName(item.name),
      videoTitle: (video && video.title) || item.videoTitle || '',
      videoNiche: (video && video.niche) || item.videoNiche || '',
      contentNiche,
      host: hostLabel(item.link),
      ext: isLocalDocFile(item.file) ? fileLabel(item.file) : ''
    });
  });
  const kindCounts = enriched.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; a.all = (a.all || 0) + 1; return a; }, {});
  const branchCounts = enriched.reduce((a, x) => { a[x.branch] = (a[x.branch] || 0) + 1; a.all = (a.all || 0) + 1; return a; }, {});
  const nicheCounts = enriched.reduce((a, x) => { a[x.contentNiche] = (a[x.contentNiche] || 0) + 1; return a; }, {});
  const q = (state.promptQ || '').trim().toLowerCase();
  const exactNicheCodeQ = /^(h\d{2})(?:\s*|\s*[—-].*)$/i.test(q) ? RegExp.$1.toUpperCase() : '';
  const exactMetaCodeQ = /^(meta-0[1-5])\b/i.test(q) ? RegExp.$1.toUpperCase() : '';
  const exactDocNumQ = /^#?(?:doc[-_]?|tl-)0*(\d{1,3})\b/i.test(q) ? parseInt(RegExp.$1, 10) : 0;
  const exactSkuQ = /^((?:video|zoom|huan|dgmd)-[a-z0-9_-]+)\b/i.test(q) ? RegExp.$1.toUpperCase() : '';
  const exactPathQ = (/^(?:docs|docs-huan|docs-dgmd|pipelines)\//i.test(q) || (q.includes('/') && !/\s/.test(q))) ? q : '';
  const hasExactEntityQ = Boolean(exactNicheCodeQ || exactMetaCodeQ || exactDocNumQ > 0 || exactSkuQ || exactPathQ);
  let exactNicheDocIdxSet = null;
  if (exactNicheCodeQ && nxRaw && Array.isArray(nxRaw.ngachXanh)) {
    const matchedNx = nxRaw.ngachXanh.find(n => String(n.code || ('H' + String(n.legacyHang || n.hang || 1).padStart(2, '0'))).toUpperCase() === exactNicheCodeQ);
    if (matchedNx) {
      exactNicheDocIdxSet = new Set();
      const seenDocNums = new Set();
      const seenDocRaw = new Set();
      const tlByFile = new Map();
      enriched.forEach((item, idx) => {
        if (item && item.file) tlByFile.set(String(item.file).trim(), { idx, docNum: idx + 1 });
      });
      safeArray(matchedNx.docs).forEach(rawDoc => {
        const s = String(rawDoc || '').trim();
        if (!s) return;
        const tlMatch = s.match(/^TL-(\d+)\b/i);
        if (tlMatch) {
          const docNum = parseInt(tlMatch[1], 10);
          const idx = docNum - 1;
          if (idx >= 0 && idx < enriched.length) {
            exactNicheDocIdxSet.add(idx);
            seenDocNums.add(docNum);
            seenDocRaw.add(s);
            return;
          }
        }
        const cleanPath = s.replace(/^\/?file\//i, '').trim();
        const found = tlByFile.get(cleanPath) || tlByFile.get(s);
        if (found) {
          exactNicheDocIdxSet.add(found.idx);
          seenDocNums.add(found.docNum);
          seenDocRaw.add(s);
        }
      });
      const vidSkus = new Set(safeArray(matchedNx.skus).map(x => String(x || '').toUpperCase()));
      videos.forEach(v => {
        if (v && v.niche && v.niche === matchedNx.nicheKey && v.sku) vidSkus.add(String(v.sku).toUpperCase());
      });
      enriched.forEach((item, idx) => {
        if (!item) return;
        const docNum = idx + 1;
        if (seenDocNums.has(docNum)) return;
        const itemNicheCode = String(item.nicheCode || '').trim().toUpperCase();
        const itemSku = String(item.sku || '').trim().toUpperCase();
        const isDirectCode = itemNicheCode === exactNicheCodeQ;
        const isRecentSkuMatch = docNum >= 581 && itemSku && vidSkus.has(itemSku) && itemNicheCode !== 'META-OPS';
        if (isDirectCode || isRecentSkuMatch) {
          const fClean = String(item.file || '').trim();
          if (fClean && seenDocRaw.has(fClean)) return;
          exactNicheDocIdxSet.add(idx);
          seenDocNums.add(docNum);
          if (fClean) seenDocRaw.add(fClean);
        }
      });
    }
  }
  let exactMetaDocSkuSet = null;
  let exactMetaNicheName = '';
  if (exactMetaCodeQ && nxRaw && Array.isArray(nxRaw.ngachMetaKho)) {
    const mIdx = parseInt(exactMetaCodeQ.replace(/^META-0?/i, ''), 10) - 1;
    const matchedMeta = nxRaw.ngachMetaKho.find((m, i) => String(m.code || `META-0${i + 1}`).toUpperCase() === exactMetaCodeQ) || nxRaw.ngachMetaKho[mIdx];
    if (matchedMeta) {
      exactMetaNicheName = String(matchedMeta.ngach || '').trim();
      exactMetaDocSkuSet = new Set(safeArray(matchedMeta.skus).map(x => String(x || '').toUpperCase()));
    }
  }
  const list = enriched.filter(item => {
    /* FIX (uifix88) F1 + Bug 5: dinh danh DUNG 1 muc tai lieu tu ket qua tim kiem toan van (/tai-lieu?did=DOC_n&di=<idx>).
       Neu co did=DOC_n ma thieu di, tu dong suy ra index = n - 1 hoac khop item.docId de khong bao gio bi trang trang 0 muc. */
    if (state.docIdx >= 0 || state.docDid) {
      if (state.docDid) {
        if (item.docId && item.docId.toLowerCase() === state.docDid.toLowerCase()) return true;
        const m = /^DOC[-_](\d+)$/i.exec(state.docDid);
        if (m && item._i === parseInt(m[1], 10) - 1) return true;
      }
      if (state.docIdx >= 0) return item._i === state.docIdx;
      return false;
    }
    if (!hasExactEntityQ) {
      if (state.docSourceFilter === 'local' && !isLocalDocFile(item.file)) return false;
      if (state.docSourceFilter === 'link' && isLocalDocFile(item.file)) return false;
      if (state.docBranch && String(item.branch || '').toUpperCase() !== String(state.docBranch || '').toUpperCase()) return false;
      if (state.kindFilter && item.kind !== state.kindFilter) return false;
      if (state.promptNiche && item.contentNiche !== state.promptNiche) return false;
    }
    if (!q) return true;
    if (exactDocNumQ > 0) {
      return item._i === exactDocNumQ - 1;
    }
    if (exactSkuQ) {
      return String(item.sku || '').toUpperCase() === exactSkuQ;
    }
    if (exactMetaCodeQ) {
      if (exactMetaDocSkuSet && item.sku && exactMetaDocSkuSet.has(String(item.sku).toUpperCase())) return true;
      if (exactMetaNicheName && (item.contentNiche === exactMetaNicheName || item.videoNiche === exactMetaNicheName)) return true;
      const hayMeta = [item.title, item.name, item.file, item.sku, item.docId, item.nicheCode, item.contentNiche].join(' ').toUpperCase();
      return hayMeta.includes(exactMetaCodeQ);
    }
    if (exactPathQ) {
      const altPathQ = exactPathQ.replace(/^assets\/docs\//, 'docs/');
      return String(item.file || '').toLowerCase().includes(exactPathQ) || String(item.fileLocal || '').toLowerCase().includes(exactPathQ) || String(item.file || '').toLowerCase().includes(altPathQ) || String(item.fileLocal || '').toLowerCase().includes(altPathQ);
    }
    if (exactNicheCodeQ) {
      if (exactNicheDocIdxSet) return exactNicheDocIdxSet.has(item._i);
      return String(item.nicheCode || '').toUpperCase() === exactNicheCodeQ;
    }
    const tlCode = 'tl-' + String(item._i + 1).padStart(3, '0');
    const docDashCode = 'doc-' + String(item._i + 1);
    const hay = [tlCode, docDashCode, item.title, item.name, item.file, item.fileLocal, item.sku, item.docId, item.branch, item.nicheCode, item.kind, item.contentNiche, item.videoNiche, item.videoTitle, item.host, item.ext].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });
  /* Muc duoc dieu huong bang ID phai nam trong trang dau (de nguoi dung thay ngay, khong phai bam trang). */
  if ((state.docIdx >= 0 || state.docDid) && state.docPage !== 1) state.docPage = 1;
  const branchChips = [
    ['', 'Tất cả', branchCounts.all || 0],
    ['H2DEV', BRANCH_LABEL.H2DEV, branchCounts.H2DEV || 0],
    ['HUAN', BRANCH_LABEL.HUAN, branchCounts.HUAN || 0],
    ['DGMD', BRANCH_LABEL.DGMD, branchCounts.DGMD || 0],
    ['NOI-BO', BRANCH_LABEL['NOI-BO'], branchCounts['NOI-BO'] || 0],
    ['PIPELINE', BRANCH_LABEL.PIPELINE, branchCounts.PIPELINE || 0]
  ].filter(x => !x[0] || x[2]);
  const kindChips = [['', 'Tất cả', kindCounts.all || 0], ['prompt', 'Prompt', kindCounts.prompt || 0], ['report', 'Báo cáo', kindCounts.report || 0], ['list', 'List kênh', kindCounts.list || 0], ['tool', 'Tool', kindCounts.tool || 0], ['drive', 'Drive', kindCounts.drive || 0], ['form', 'Form', kindCounts.form || 0], ['ai', 'AI gen', kindCounts.ai || 0], ['internal-doc', 'Tài liệu nội bộ', kindCounts['internal-doc'] || 0], ['sop', 'SOP', kindCounts.sop || 0], ['guide', 'Hướng dẫn', kindCounts.guide || 0], ['transcript', 'Phụ đề', kindCounts.transcript || 0], ['sheet', 'Bảng tính', kindCounts.sheet || 0], ['other', 'Khác', kindCounts.other || 0]].filter(x => !x[0] || x[2]);
  const allNicheKeys = [...NICHE_ORDER.filter(n => nicheCounts[n]), ...Object.keys(nicheCounts).filter(n => !NICHE_ORDER.includes(n))];
  const nicheChips = allNicheKeys.map(n => [n, n, nicheCounts[n]]);
  /* NANG CAP 2026-09-30: Tai lieu truoc day render ca 157 muc 1 lan -> mobile 37.526px (~50 man hinh).
     Phan trang 24 muc/trang giong Video/Kenh mau/Raw: xep theo thu tu nhom ngach, cat trang, roi nhom lai. */
  const foldDoc = (typeof SC.fold === 'function') ? SC.fold : _fold;
  const qFoldPhrase = (q && !hasExactEntityQ && SC.tokenize(q).length >= 2) ? foldDoc(q).trim().replace(/\s+/g, ' ') : '';
  const hasExactDocPhrase = (item) => {
    if (!qFoldPhrase) return false;
    const phraseHay = foldDoc([item.title, item.name, item.file, item.contentNiche, item.videoTitle].map(x => x == null ? '' : String(x)).join(' '))
      .replace(/[^\p{L}\p{N}\p{M}+]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return (' ' + phraseHay + ' ').indexOf(' ' + qFoldPhrase + ' ') >= 0;
  };
  const groupedAll = [];
  allNicheKeys.forEach(n => {
    let items = list.filter(x => x.contentNiche === n);
    if (!items.length) return;
    if (qFoldPhrase) {
      const exact = [];
      const rest = [];
      items.forEach(x => (hasExactDocPhrase(x) ? exact : rest).push(x));
      items = exact.concat(rest);
    }
    groupedAll.push({ niche: n, items, hasExact: qFoldPhrase ? items.some(hasExactDocPhrase) : false });
  });
  if (qFoldPhrase) {
    groupedAll.sort((a, b) => (b.hasExact ? 1 : 0) - (a.hasExact ? 1 : 0));
  }
  const orderedDocs = groupedAll.reduce((acc, g) => acc.concat(g.items), []);
  const DOC_PAGE_SIZE = 24;
  const docTotalPages = Math.max(1, Math.ceil(orderedDocs.length / DOC_PAGE_SIZE));
  const docPage = Math.min(Math.max(1, state.docPage || 1), docTotalPages);
  state.docPage = docPage;
  const docPageSet = new Set(orderedDocs.slice((docPage - 1) * DOC_PAGE_SIZE, docPage * DOC_PAGE_SIZE));
  const grouped = groupedAll
    .map(g => ({
      niche: g.niche,
      total: g.items.length,
      allSkus: [...new Set(g.items.map(x => x.sku).filter(s => s && bySku[s]))],
      items: g.items.filter(x => docPageSet.has(x))
    }))
    .filter(g => g.items.length);
  const docPager = (pos) => docTotalPages <= 1 ? '' : `<nav class="flex items-center justify-between gap-2 ${pos === 'top' ? 'mb-3' : 'mt-6'} text-xs text-gray-400" aria-label="Phân trang tài liệu"><span aria-live="polite">Trang ${docPage}/${docTotalPages} · ${orderedDocs.length} mục</span><span class="flex gap-1">${docPage > 1 ? `<button type="button" class="filter-btn" data-action="doc-page" data-page="${docPage - 1}" data-pos="${pos}">← Trước</button>` : ''}${docPage < docTotalPages ? `<button type="button" class="filter-btn" data-action="doc-page" data-page="${docPage + 1}" data-pos="${pos}">Sau →</button>` : ''}</span></nav>`;
  function videoNicheKey(contentNiche) {
    return nicheKeyFor(contentNiche) || NICHE_MAP[contentNiche] || (Object.values(NICHE_MAP).includes(contentNiche) ? contentNiche : '');
  }
  const groupQuickAccess = grouped.length >= 3 && grouped.length <= 5 ? quickAccessBar({
    id: 'kichban-quick-access', label: 'Đi nhanh đến nhóm đang hiện', mode: 'section',
    items: grouped.map((g, index) => ({ label: g.niche, shortLabel: g.niche, action: { type: 'section', section: 'kichban-group-' + index } }))
  }) : '';
  return `
  ${pageBanner('Kịch bản & Tài liệu', list.length + '/' + enriched.length + ' mục · gắn theo ngách nội dung, không trùng Nguồn reup', [
    { icon: ICONS.doc, label: 'Tổng mục', value: enriched.length, sub: list.length === enriched.length ? 'Hiện tất cả' : 'Đang lọc ' + list.length, extraAttrs: 'data-doc-kpi="all"' },
    { icon: ICONS.disk, label: 'File local', value: enriched.filter(x => isLocalDocFile(x.file)).length, sub: 'trong assets/docs', extraAttrs: 'data-doc-kpi="local"' },
    { icon: ICONS.link, label: 'Link catalog', value: enriched.filter(x => !isLocalDocFile(x.file)).length, sub: 'Drive / web', extraAttrs: 'data-doc-kpi="link"' },
    { icon: ICONS.niche, label: 'Ngách có data', value: Object.keys(nicheCounts).length, sub: 'chip bên dưới', extraAttrs: 'data-doc-kpi="niches"' }
  ])}
  ${(state.docIdx >= 0 || state.docDid) ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex items-center gap-1.5">${ico('target', 14)} Đang mở đúng <b class="text-white">1 mục tài liệu</b> theo mã <b class="text-brand-300 font-mono">${esc(state.docDid || ('#' + (state.docIdx + 1)))}</b> (điều hướng bằng ID từ kết quả tìm kiếm toàn văn).</span>
    <span class="text-xs text-gray-400">Bấm <b class="text-gray-200">Reset</b> để xem cả ${enriched.length} mục.</span>
  </div>` : ''}
  <div class="card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
<div class="flex items-center gap-3">
  <span class="p-2 rounded-xl bg-surface-2 border border-border inline-flex items-center justify-center text-brand-300">${ico('headphones', 24)}</span>
  <div>
    <div class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
      <span>Kho Nhạc Nền ${musicStats.total} Tracks (Đã Thẩm Định Gemini Multimodal & FFprobe)</span>
      <span class="badge badge-green text-xs">${musicStats.safe} SAFE YPP</span>
    </div>
    <p class="text-xs text-gray-300 mt-0.5">Phân loại theo ngách Lịch sử, Tiên tri, Sinh tồn, Ru ngủ · Tích hợp sẵn Trình phát âm thanh nghe thử & tải MP3.</p>
  </div>
</div>
<button type="button" class="shrink-0 h2-btn h2-btn--brand js-open-music-studio"><span class="inline-flex items-center gap-1.5">${ico('headphones', 14)} Mở Trạm Nhạc Nền</span></button>
  </div>
  <div class="card p-4 sm:p-5 mb-6 overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm prompt</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="doc-search-wrap">
    <input id="fq" autocomplete="off" value="${esc(state.promptQ)}" placeholder="Tìm prompt, mã TL-001 / DOC_1 / H01, nội dung SOP, ngách, SKU..." class="search-input-premium w-full min-w-0 pr-9" aria-label="Tìm prompt">
    ${(state.promptQ || state.docDid || state.docIdx >= 0) ? `<button type="button" id="btn-clear-doc-q" aria-label="Xóa từ khóa tìm kiếm" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>` : ''}
    <div id="doc-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-border" style="z-index:var(--h2-z-modal-top);"></div>
  </div>
  <button type="button" id="freset-prompt" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Nhánh / Nguồn</div>
  <div class="flex flex-wrap gap-2">
    ${branchChips.map(([id, label, n]) => `<button type="button" data-doc-branch="${id}" class="filter-btn ${(state.docBranch || '') === id ? 'active' : ''}">${label} · ${n}</button>`).join('')}
  </div>
</div>
<div class="mt-3.5">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Loại data</div>
  <div class="flex flex-wrap gap-2">
    ${kindChips.map(([id, label, n]) => `<button type="button" data-kind="${id}" class="filter-btn ${state.kindFilter === id ? 'active' : ''}">${label} · ${n}</button>`).join('')}
  </div>
</div>
<div class="mt-3.5">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách nội dung</div>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-prompt-niche="" class="filter-btn ${!state.promptNiche ? 'active' : ''}">Mọi ngách · ${kindCounts.all || 0}</button>
    ${(() => {
      const LIMIT = 10;
      const visible = state.promptNicheExpanded ? nicheChips : nicheChips.slice(0, LIMIT);
      const hidden = nicheChips.length - LIMIT;
      const selOut = state.promptNiche && !visible.some(([id]) => id === state.promptNiche)
        ? `<button type="button" data-prompt-niche="${esc(state.promptNiche)}" class="filter-btn active" title="Đang lọc ngách này">${esc(state.promptNiche)} · ${(nicheChips.find(([id]) => id === state.promptNiche) || [0,0,0])[2]}</button>` : '';
      return selOut + visible.map(([id, label, n]) => `<button type="button" data-prompt-niche="${esc(id)}" class="filter-btn ${state.promptNiche === id ? 'active' : ''}" title="${esc(label)}">${esc(label)} · ${n}</button>`).join('')
        + (hidden > 0 ? `<button type="button" data-prompt-niche-toggle class="filter-btn" style="border-style:dashed; color:var(--fg-muted);" title="${state.promptNicheExpanded ? 'Thu gọn' : 'Hiện ' + hidden + ' ngách còn lại'}">${state.promptNicheExpanded ? ico('chevron-up', 14) + ' Thu gọn' : ico('chevron-down', 14) + ' Xem thêm ' + hidden + ' ngách'}</button>` : '');
    })()}
  </div>
</div>
  </div>
  ${groupQuickAccess}
  ${docPager('top')}
  <div class="space-y-6" id="kichban-results">
${grouped.map((g, index) => {
    const isMacroNiche = NICHE_ORDER.includes(g.niche) && g.niche !== 'Everyday History EN (lịch sử đồ vật thường ngày)';
    const vKey = isMacroNiche ? videoNicheKey(g.niche) : (g.allSkus.length ? g.niche : videoNicheKey(g.niche));
    const vSkusAttr = (!isMacroNiche && g.allSkus.length) ? ` data-skus="${esc(g.allSkus.join(','))}"` : '';
    return `
  <section id="kichban-group-${index}" class="quick-target min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h3 class="text-base font-bold text-white font-heading">${esc(g.niche)}</h3>
      <span class="badge badge-muted">${g.items.length === g.total ? g.total + ' data' : g.items.length + '/' + g.total + ' data'}</span>
      ${vKey ? `<button type="button" data-open-niche="${esc(vKey)}"${vSkusAttr} class="text-xs text-brand-400 hover:text-brand-300 font-medium">Xem video ngách →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
      ${g.items.map(k => {
        const tlCode = 'TL-' + String(k._i + 1).padStart(3, '0');
        const sopNodeId = 'sop:' + (k.docId ? String(k.docId).replace(/^DOC_/i, 'DOC-') : ('DOC-' + String(k._i + 1).padStart(3, '0')));
        const previewFile = k.fileLocal || (isLocalDocFile(k.file) ? k.file : '');
        const canPreview = Boolean(previewFile && /\.(?:md|txt)$/i.test(previewFile));
        return `
        <article class="card p-4 min-w-0 overflow-hidden flex flex-col">
          <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
            <span class="badge badge-muted shrink-0 font-mono" title="Mã định danh tài liệu">${tlCode}</span>
            <span class="badge shrink-0 ${KIND_BADGE[k.kind] || 'badge-muted'}">${KIND_LABEL[k.kind] || 'Khác'}</span>
            <span class="badge shrink-0 ${BRANCH_BADGE[k.branch] || 'badge-muted'}">${BRANCH_SHORT[k.branch] || k.branch}</span>
            ${k.nicheCode && k.nicheCode !== 'META-OPS' ? `<span class="badge badge-muted shrink-0 font-mono">${esc(k.nicheCode)}</span>` : ''}
            <span class="badge badge-blue shrink-0 truncate max-w-[140px]" title="${esc(k.contentNiche)}">${esc(k.contentNiche)}</span>
            ${k.ext ? `<span class="ml-auto badge badge-muted shrink-0 font-mono">${esc(k.ext)}</span>` : ''}
          </div>
          <h3 class="text-base font-semibold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere]">${esc(k.title || k.name)}</h3>
          <div class="mt-2 text-xs text-gray-400 font-mono truncate">${esc(k.sku)}</div>
          ${k.videoTitle ? `<div class="mt-1 text-xs text-gray-300 line-clamp-1 break-words">Nguồn video: ${esc(k.videoTitle)}</div>` : ''}
          ${!k.videoTitle && k.source === 'noi-bo' ? `<div class="mt-1 text-xs text-lime-400/80">Đồng bộ từ ngoài → 97yo-dev</div>` : ''}
          ${k.videoNiche && k.videoNiche !== k.contentNiche ? `<div class="mt-1 text-xs text-amber-400/80">Video mẹ thuộc: ${esc(k.videoNiche)}</div>` : ''}
          <div class="mt-auto pt-3 flex flex-wrap gap-2">
            ${k.sku === 'NOI-BO-MUSIC-01' || (k.file && k.file.includes('CATALOG-NHAC-NEN')) ? `<button type="button" class="h2-btn h2-btn--ghost h2-btn--sm js-open-music-studio"><span class="inline-flex items-center gap-1.5">${ico('headphones', 14)} Mở Trạm Nhạc Nền${musicStats.total ? ' (' + musicStats.total + ' Tracks)' : ''}</span></button>` : ''}
            ${canPreview ? `<button type="button" class="btn-primary text-xs inline-flex items-center gap-1" data-doc-preview="${esc(previewFile)}" data-doc-title="${esc(k.title || k.name)}" data-doc-sku="${esc(k.sku || '')}" data-doc-code="${tlCode}">${ico('eye', 14)} Đọc nhanh</button>` : ''}
            ${(() => { const _kl = safeExternalUrl(k.link); return _kl ? `<a href="${esc(_kl)}" target="_blank" rel="noopener noreferrer" class="btn-primary text-xs inline-flex items-center gap-1">${esc(k.host || 'Mở nguồn')} <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></a>` : ''; })()}
            ${(() => { const _kf = safeUrl(k.file); return (isLocalDocFile(k.file) && _kf) ? `<a href="${esc(_kf)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs inline-flex items-center gap-1">${ico('file-text', 14)} File local</a>` : ''; })()}
            ${(() => { const _kfl = safeUrl(k.fileLocal); return _kfl ? `<a href="${esc(_kfl)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs text-lime-200 inline-flex items-center gap-1">${ico('file-edit', 14)} MD gốc</a>` : ''; })()}
            ${k.videoTitle ? `<a href="/lotrinh/${encodeURIComponent(k.sku)}" class="filter-btn text-xs inline-flex items-center gap-1">${ico('play', 14)} Video gốc</a>` : ''}
            <button type="button" class="filter-btn text-xs inline-flex items-center gap-1" data-sodo-jump="${esc(sopNodeId)}" title="Soi mạch liên kết tài liệu này trên Sơ đồ DB">Sơ đồ DB <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          </div>
        </article>`;
      }).join('')}
    </div>
  </section>`;
  }).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2">' + ico('search', 24) + '</div>Không tìm thấy prompt / tài nguyên</div>'}
  </div>
  ${docPager('bottom')}`;
}

  /* UI-05 (2026-09-28): tab /nhac trc day render NHAM renderKichBan (tai lieu).
     Spec TABS (main.js): nhac -> Tram Nhac Nen. View nay la nen dat nút mo modal
     (class js-open-music-studio — music_player_modal.js tu bat click capture). */
  async function renderNhac() {
    await loadMusicStats();
    const t = musicStats;
    const cat = CAT['data/music_catalog.json'] || {};
    const tracks = safeArray(cat.tracks);
    const previewTracks = tracks.filter(tr => tr && (tr.copyrightRisk === 'SAFE' || tr.ypp_status === 'SAFE') && (tr.streamUrl || tr.relativePath || tr.file || tr.path)).slice(0, 6);
    const quickFilters = [
      { id: 'cophong', label: 'Cổ Trang / Tiên Hiệp' },
      { id: 'darkcrime', label: 'Dark Crime / Kịch tính' },
      { id: 'history', label: 'Lịch sử & Khảo cổ' },
      { id: 'animation', label: 'Hoạt hình & Trẻ em' },
      { id: 'philosophy', label: 'Triết lý / Dưỡng sinh' },
      { id: 'wildlife', label: 'Sinh tồn' },
      { id: 'military', label: 'Quân sự' },
      { id: 'ambient', label: 'Ambient dài 15-25p' }
    ];
    return `
  ${pageBanner('Trạm Nhạc Nền', 'Kho nhạc local đã thẩm định ffprobe + phân loại rủi ro bản quyền. Mở trạm phát để nghe, tìm và lọc theo ngách nội dung.', [
    { icon: ICONS.music, label: 'Tổng tracks', value: t.total, sub: t.total ? `${SC.pad2(t.niches)} nhóm ngách nội dung` : 'chưa có catalog' },
    { icon: ICONS.disk, label: 'SAFE YPP', value: t.safe, sub: `${t.review} REVIEW · ${t.copyrighted} COPYRIGHTED` }
  ])}
  <div class="card p-6 mb-6 text-center border-border-strong bg-surface">
    <div class="stat-icon bg-brand-tint text-brand-tint-fg border border-brand/30 mx-auto mb-4" aria-hidden="true">
      ${icoColored('headphones', '#E2023A', 24)}
    </div>
    <h2 class="page-h2 mb-2">Trạm phát nhạc nền</h2>
    <p class="text-sm text-gray-400 mx-auto mb-6" style="max-width:28rem">Phát trực tiếp từ kho nhạc local của hệ thống 97yo-dev. Track SAFE dùng thoải mái cho video monetize; track REVIEW/COPYRIGHTED chỉ để tham khảo.</p>
    <div class="flex flex-wrap items-center justify-center gap-2.5">
      <button type="button" id="btn-open-music-studio" class="h2-btn h2-btn--brand js-open-music-studio" data-music-filter="all"><span class="inline-flex items-center gap-1.5">${ico('headphones', 14)} Mở Trạm Nhạc Nền${t.total ? ' (' + t.total + ' Tracks)' : ''}</span></button>
      <button type="button" class="filter-btn text-xs" data-open-tab="sodo" data-sodo-node="track:h2dev" title="Xem sơ đồ liên kết hệ sinh thái trên Sơ đồ DB">Sơ đồ DB <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
    </div>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-mono nhac-status-row">
      <button type="button" class="badge badge-green cursor-pointer hover:opacity-90 js-open-music-studio" data-music-filter="safe" title="Mở Trạm Nhạc Nền lọc ${t.safe} bản SAFE YPP">${t.safe} SAFE YPP <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
      <button type="button" class="badge badge-amber cursor-pointer hover:opacity-90 js-open-music-studio" data-music-filter="review" title="Mở Trạm Nhạc Nền lọc ${t.review} bản REVIEW">${t.review} REVIEW <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
      <button type="button" class="badge badge-red cursor-pointer hover:opacity-90 js-open-music-studio" data-music-filter="copyrighted" title="Mở Trạm Nhạc Nền lọc ${t.copyrighted} bản COPYRIGHTED">${t.copyrighted} COPYRIGHTED <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
    </div>
    <div class="mt-4 pt-4 border-t border-ink-700/70 flex flex-wrap items-center justify-center gap-1.5 nhac-quick-filters">
      ${quickFilters.map(f => `<button type="button" class="filter-btn text-xs js-open-music-studio" data-music-filter="${esc(f.id)}" title="Mở Trạm Nhạc Nền lọc nhóm ${esc(f.label)}">${esc(f.label)}</button>`).join('')}
    </div>
  </div>
  ${previewTracks.length ? `
  <section class="mb-6">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 class="text-base font-bold text-white">Nghe thử nhanh các bản nhạc SAFE YPP tiêu biểu</h3>
      <button type="button" class="filter-btn text-xs js-open-music-studio" data-music-filter="all">Xem toàn bộ ${t.total} tracks <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
      ${previewTracks.map(tr => {
        const rawNiche = String(tr.categoryNiche || tr.category || tr.niche || 'Đa ngách');
        const cleanNicheQ = rawNiche.split('(')[0].split('/')[0].trim();
        return `
        <div class="card p-4 flex flex-col justify-between gap-2 min-w-0">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1 min-w-0">
              <button type="button" class="badge badge-green text-xs shrink-0 whitespace-nowrap cursor-pointer js-open-music-studio" data-music-filter="safe">SAFE YPP</button>
              <button type="button" class="text-xs text-sky-400 hover:underline font-mono min-w-0 flex-1 text-right truncate cursor-pointer bg-transparent border-0 p-0" data-open-tab="ngachxanh" data-nx-q="${esc(cleanNicheQ)}" title="Đối chiếu ngách ${esc(rawNiche)} trên Tab Ngách Xanh">${esc(rawNiche)}${(tr.durationFormatted || tr.duration) ? ' · ' + esc(tr.durationFormatted || tr.duration) : ''} ↗</button>
            </div>
            <div class="text-sm font-bold text-white truncate" title="${esc(tr.fileName || tr.title || tr.name || '')}">${esc(tr.fileName || tr.title || tr.name || 'Track')}</div>
          </div>
          <audio controls preload="none" class="w-full mt-2" src="${esc(tr.streamUrl || tr.relativePath || tr.file || tr.path || '')}"></audio>
        </div>
      `;
      }).join('')}
    </div>
  </section>` : ''}`;
  }

async function renderNguonReup() {
  const [nguonRaw, videosRaw, huanVideosRaw, dgmdVideosRaw, docsRaw] = await Promise.all([
    loadJSON('data-tabs/nguon-reup.json').catch(() => []),
    loadJSON('data-tabs/videos.json').catch(() => []),
    loadJSON('data/videos_huan.json').catch(() => []),
    loadJSON('data/videos_dgmd.json').catch(() => []),
    loadJSON('data-tabs/tai-lieu-full.json').catch(() => [])
  ]);
  const nguon = safeArray(nguonRaw);
  const videos = [...safeArray(videosRaw), ...safeArray(huanVideosRaw), ...safeArray(dgmdVideosRaw)];
  const bySku = Object.fromEntries(videos.map(v => [v.sku, v]));
  const docCountBySku = {};
  safeArray(docsRaw).forEach(d => {
    const k = d && d.sku ? String(d.sku).trim() : '';
    if (k) docCountBySku[k] = (docCountBySku[k] || 0) + 1;
  });
  const TYPE_LABEL = { bilibili: 'Bilibili', douyin: 'Douyin', stock: 'Stock footage', tool: 'Tool / Web', archive: 'Kho tư liệu / Học thuật', community: 'Cộng đồng', other: 'Khác' };
  const TYPE_BADGE = { bilibili: 'badge-blue', douyin: 'badge-amber', stock: 'badge-green', tool: 'badge-brand', archive: 'badge-green', community: 'badge-muted', other: 'badge-muted' };
  const TYPE_ORDER = ['bilibili', 'douyin', 'stock', 'tool', 'archive', 'community', 'other'];
  function hostOf(link) {
    try { return new URL(link).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function classifySource(item) {
    const host = hostOf(item.link);
    const rawName = String(item.name || '').trim();
    const blob = (rawName + ' ' + host + ' ' + (item.link || '')).toLowerCase();
    if (/h2devtool|youtube-transcript|tikvideo/.test(blob)) return 'tool';
    if (/bilibili/.test(blob)) return 'bilibili';
    if (/douyin/.test(blob)) return 'douyin';
    if (/pexels|vecteezy|coverr|freepik|pixabay/.test(blob)) return 'stock';
    if (/zalo|facebook|group|cộng đồng/.test(blob)) return 'community';
    if (/^\[[^\]]+\]/.test(rawName) || /archive\.org|si\.edu|loc\.gov|archives\.gov|cia\.gov|sec\.gov|ntsb\.gov|usgs\.gov|opentopography\.org|davidrumsey\.com|nasa\.gov|noaa\.gov|wikimedia\.org|csb\.gov|ourworldindata\.org|macaulaylibrary\.org|doc\.govt\.nz|xeno-canto\.org|britishmuseum\.org|theblackvault\.com|courtlistener\.com|patents\.google\.com/.test(host)) return 'archive';
    return 'other';
  }
  function normalizeReupNiche(n) {
    const s = String(n || '').trim();
    if (!s || s === 'Khác') return '';
    if (/^reup\s*\/\s*hoạt hình$/i.test(s) || /^reup\s*&\s*khai thác hoạt hình$/i.test(s)) return 'Reup & Khai Thác Hoạt Hình';
    if (/^sức khỏe\s*\/\s*lão hóa$/i.test(s)) return 'Sức khỏe / Lão hóa';
    return s;
  }
  function inferNiche(item, video) {
    const fromItem = normalizeReupNiche(item && item.videoNiche);
    const fromVideo = normalizeReupNiche(video && video.niche);
    const t = ((item.name || '') + ' ' + (item.link || '')).toLowerCase();
    if (/health|sức khỏe/.test(t)) return 'Sức khỏe / Lão hóa';
    if (/kịch bản|transcript/.test(t)) return 'Nền tảng / Tool';
    if (fromItem) return fromItem;
    if (fromVideo) return fromVideo;
    if (/bilibili|douyin|reup|hoạt hình/.test(t)) return 'Reup & Khai Thác Hoạt Hình';
    return 'Khác';
  }
  function extractSubTag(item) {
    const raw = String(item.name || '').trim();
    const m = /^\[([^\]]+)\]\s*(.+)$/.exec(raw);
    return m ? m[1].trim() : '';
  }
  function cleanTitle(item) {
    const raw = String(item.name || '').trim();
    if (!raw || /^https?:\/\//i.test(raw)) {
      const linkStr = String(item.link || raw || '');
      const host = hostOf(linkStr);
      const type = classifySource(item);
      if (type === 'bilibili') {
        const mBili = /space\.bilibili\.com\/(\d+)/i.exec(linkStr);
        return mBili ? ('Kênh nguồn Bilibili #' + mBili[1]) : 'Kênh nguồn Bilibili';
      }
      if (type === 'douyin') {
        const mDy = /v\.douyin\.com\/([A-Za-z0-9_-]+)/i.exec(linkStr);
        return mDy ? ('Kênh nguồn Douyin · ' + mDy[1]) : 'Kênh nguồn Douyin';
      }
      if (type === 'stock') return host ? ('Stock · ' + host) : 'Stock footage';
      if (type === 'tool') return host ? ('Công cụ · ' + host) : 'Công cụ';
      return host || 'Nguồn reup';
    }
    return raw
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(/\s*\((tặng kèm|mọi người có thể tự tìm thêm[^)]*)\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  const enriched = nguon.map((item, idx) => {
    const video = bySku[item.sku];
    const type = classifySource(item);
    const reupId = item.id || ('REUP-' + String(idx + 1).padStart(3, '0'));
    const track = item.track || (/^HUAN-/i.test(item.sku || '') ? 'huan' : (/^DGMD-/i.test(item.sku || '') ? 'dgmd' : 'h2dev'));
    const rawVideoNiche = (video && video.niche) || item.videoNiche || '';
    const contentNiche = inferNiche(item, video);
    return Object.assign({}, item, {
      _i: idx,
      reupId,
      track,
      type,
      subTag: extractSubTag(item),
      host: hostOf(item.link),
      title: cleanTitle(item),
      videoTitle: (video && video.title) || item.videoTitle || '',
      videoNiche: rawVideoNiche,
      contentNiche,
      docCount: docCountBySku[item.sku] || 0
    });
  });
  const typeCounts = enriched.reduce((a, x) => { a[x.type] = (a[x.type] || 0) + 1; a.all = (a.all || 0) + 1; return a; }, {});
  const nicheCounts = enriched.reduce((a, x) => { a[x.contentNiche] = (a[x.contentNiche] || 0) + 1; return a; }, {});
  const q = (state.reupQ || '').trim().toLowerCase();
  const exactReupId = String(state.reupId || '').trim().toUpperCase().replace(/^REUP_(\d+)$/, (_, n) => 'REUP-' + String(parseInt(n, 10)).padStart(3, '0'));
  const qReupIdMatch = /^REUP[-_](\d{1,3})$/i.exec(q);
  const qExactReupId = qReupIdMatch ? ('REUP-' + String(parseInt(qReupIdMatch[1], 10)).padStart(3, '0')) : '';
  const list = enriched.filter(item => {
    if (exactReupId && item.reupId === exactReupId && !q && !state.reupType && !state.reupNiche) return true;
    if (state.reupType && item.type !== state.reupType) return false;
    if (state.reupNiche && item.contentNiche !== state.reupNiche) return false;
    if (!q) return true;
    if (qExactReupId) return item.reupId === qExactReupId;
    const hay = [item.reupId, item.title, item.name, item.subTag, item.link, item.sku, item.host, item.type, item.nicheCode, item.track, item.contentNiche, item.videoNiche, item.videoTitle].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });
  const targetedItem = exactReupId ? enriched.find(x => x.reupId === exactReupId) : null;
  const typeChips = [['', 'Tất cả', typeCounts.all || 0]].concat(TYPE_ORDER.filter(t => typeCounts[t]).map(t => [t, TYPE_LABEL[t], typeCounts[t]]));
  const nicheChips = Object.keys(nicheCounts).sort((a, b) => nicheCounts[b] - nicheCounts[a]).map(n => [n, n, nicheCounts[n]]);
  const grouped = TYPE_ORDER.map(t => {
    const items = list.filter(x => x.type === t);
    return items.length ? { type: t, items } : null;
  }).filter(Boolean);
  const groupQuickAccess = grouped.length >= 3 && grouped.length <= 6 ? quickAccessBar({
    id: 'reup-quick-access', label: 'Đi nhanh đến nhóm đang hiện', mode: 'section',
    items: grouped.map(g => ({ label: TYPE_LABEL[g.type] || g.type, shortLabel: TYPE_LABEL[g.type] || g.type, action: { type: 'section', section: 'reup-group-' + g.type } }))
  }) : '';
  return `
  ${pageBanner('Nguồn tài nguyên Reup', list.length + '/' + enriched.length + ' nguồn · chỉ tham khảo, phải transform trước khi dùng', [
    { icon: ICONS.link, label: 'Tổng nguồn', value: enriched.length, sub: list.length === enriched.length ? 'Hiện tất cả' : 'Đang lọc ' + list.length, extraAttrs: 'data-reup-kpi="all"' },
    { icon: ICONS.niche, label: 'Loại nguồn', value: Object.keys(typeCounts).filter(k => k && k !== 'all').length, sub: 'Bilibili / Douyin / Kho tư liệu...', extraAttrs: 'data-reup-kpi="types"' },
    { icon: ICONS.video, label: 'Gắn SKU video', value: enriched.filter(x => x.sku).length, sub: 'trỏ về kho Video', extraAttrs: 'data-reup-kpi="skus"' },
    { icon: ICONS.doc, label: 'Lưu ý', value: 'Reused', sub: 'transform + bản quyền', extraAttrs: 'data-reup-kpi="reused"' }
  ])}
  ${targetedItem ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex items-center gap-1.5">${ico('target', 14)} Đang định vị nguồn <b class="text-brand-300 font-mono">${esc(targetedItem.reupId)}</b> · <b class="text-white">${esc(targetedItem.title)}</b> (${esc(targetedItem.sku)}).</span>
    <button type="button" id="btn-clear-reup-target" class="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface border border-border text-xs text-gray-200 cursor-pointer">Bỏ ghim định vị</button>
  </div>` : ''}
  <div class="card p-4 sm:p-5 mb-6 overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm nguồn reup</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="reup-search-wrap">
    <input id="fq" value="${esc(state.reupQ)}" placeholder="Tìm mã REUP-001, tên nguồn, link Douyin/Bilibili, host, SKU, mã ngách H22..." class="search-input-premium w-full min-w-0 pr-11" aria-label="Tìm nguồn reup" autocomplete="off">
    <button type="button" id="btn-clear-reup-q" class="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] rounded-full bg-surface-2 hover:bg-surface border border-border text-fg-2 hover:text-white flex items-center justify-center text-xs transition-colors ${state.reupQ ? '' : 'hidden'}" style="z-index:var(--h2-z-base)" title="Xóa từ khóa tìm kiếm" aria-label="Xóa từ khóa tìm kiếm">${ico('x', 14)}</button>
    <div id="reup-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-border" style="z-index:var(--h2-z-modal-top);"></div>
  </div>
  <button type="button" id="freset-reup" class="shrink-0 min-h-[38px] bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline" id="reup-types-filter-bar">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Loại nguồn</div>
  <div class="flex flex-wrap gap-2">
    ${typeChips.map(([id, label, n]) => `<button type="button" data-reup-type="${id}" class="filter-btn ${state.reupType === id ? 'active' : ''}">${label} · ${n}</button>`).join('')}
  </div>
</div>
<div class="mt-3.5">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách / mục đích</div>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-reup-niche="" class="filter-btn ${!state.reupNiche ? 'active' : ''}">Mọi ngách · ${typeCounts.all || 0}</button>
    ${nicheChips.map(([id, label, n]) => `<button type="button" data-reup-niche="${esc(id)}" class="filter-btn ${state.reupNiche === id ? 'active' : ''}">${esc(label)} · ${n}</button>`).join('')}
  </div>
</div>
  </div>
  ${groupQuickAccess}
  <div class="space-y-6" id="reup-results">
${grouped.map(g => {
    const uniqueSkus = [...new Set(g.items.map(it => it.sku).filter(Boolean))];
    const groupSkus = uniqueSkus.join(',');
    return `
  <section id="reup-group-${esc(g.type)}" class="quick-target min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h3 class="text-base font-bold text-white font-heading">${esc(TYPE_LABEL[g.type] || g.type)}</h3>
      <span class="badge badge-muted">${g.items.length} nguồn</span>
      ${groupSkus ? `<button type="button" data-open-tab="video" data-skus="${esc(groupSkus)}" class="text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer">Xem ${uniqueSkus.length} video nhóm này →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
      ${g.items.map(n => `
        <article id="reup-card-${esc(n.reupId)}" data-reup-id="${esc(n.reupId)}" class="card p-4 min-w-0 overflow-hidden flex flex-col ${exactReupId === n.reupId ? 'ring-2 ring-brand-400' : ''}">
          <div class="flex flex-wrap items-center gap-1.5 mb-2 min-w-0">
            <span class="badge badge-muted shrink-0 font-mono" title="Mã định danh nguồn Reup">${esc(n.reupId)}</span>
            <span class="badge shrink-0 ${TYPE_BADGE[n.type] || 'badge-muted'}">${TYPE_LABEL[n.type] || 'Khác'}</span>
            <span class="badge shrink-0 ${n.track === 'huan' ? 'badge-amber' : 'badge-muted'} font-mono">${n.track === 'huan' ? 'HUÂN' : '97YO-DEV'}</span>
            ${n.nicheCode ? `<button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(n.nicheCode)}" class="badge badge-blue shrink-0 font-mono cursor-pointer hover:opacity-90" title="Mở ngách ${esc(n.nicheCode)} · ${esc(n.contentNiche)} trên Tab Ngách Xanh">${esc(n.nicheCode)} · ${esc(n.contentNiche)}</button>` : `<button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(n.contentNiche)}" class="badge badge-blue shrink-0 truncate max-w-[160px] cursor-pointer hover:opacity-90" title="Mở ngách ${esc(n.contentNiche)} trên Tab Ngách Xanh">${esc(n.contentNiche)}</button>`}
            ${n.subTag ? `<span class="badge badge-muted shrink-0 truncate max-w-[150px]" title="${esc(n.subTag)}">${esc(n.subTag)}</span>` : ''}
          </div>
          <h3 class="text-base font-semibold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere]">${esc(n.title)}</h3>
          <div class="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400 min-w-0">
            <span class="truncate" title="${esc(n.link || n.host || '')}">${esc(n.host || '')}</span>
            <span class="font-mono text-gray-400 shrink-0">${esc(n.sku)}</span>
          </div>
          ${n.videoTitle ? `<div class="mt-1 text-xs text-gray-300 line-clamp-1 break-words" title="${esc(n.videoTitle)}">Nguồn video: ${esc(n.videoTitle)}</div>` : ''}
          ${n.videoNiche && normalizeReupNiche(n.videoNiche) !== n.contentNiche ? `<div class="mt-1 text-xs text-amber-400/80">Video mẹ thuộc: ${esc(n.videoNiche)}</div>` : ''}
          <div class="mt-auto pt-3 flex flex-wrap gap-2">
            ${(() => { const _nl = safeExternalUrl(n.link); return _nl ? `<a href="${esc(_nl)}" target="_blank" rel="noopener noreferrer" class="btn-primary text-xs inline-flex items-center justify-center min-h-[38px] gap-1">Mở nguồn <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></a>` : ''; })()}
            ${(() => { const _nl = safeExternalUrl(n.link); return _nl ? `<button type="button" data-copy-reup-url="${esc(_nl)}" class="filter-btn inline-flex items-center justify-center min-h-[38px] gap-1 text-xs cursor-pointer" title="Sao chép link nguồn ${esc(n.reupId)}">${ico('clipboard-copy', 14)} Copy link</button>` : ''; })()}
            ${(() => { const _nf = safeUrl(n.file); return _nf ? `<a href="${esc(_nf)}" target="_blank" rel="noopener noreferrer" class="filter-btn inline-flex items-center justify-center min-h-[38px] gap-1 text-xs text-lime-200">${ico('file-text', 14)} File local</a>` : ''; })()}
            ${n.videoTitle ? `<a href="/lotrinh/${encodeURIComponent(n.sku)}${n.track && n.track !== 'h2dev' ? '?track=' + encodeURIComponent(n.track) : ''}" class="filter-btn inline-flex items-center justify-center min-h-[38px] gap-1 text-xs">${ico('play', 14)} Video gốc</a>` : ''}
            ${n.docCount > 0 ? `<button type="button" data-open-tab="tai-lieu" data-doc-q="${esc(n.sku)}" class="filter-btn inline-flex items-center justify-center min-h-[38px] gap-1 text-xs text-amber-300 hover:text-white cursor-pointer" title="Xem ${n.docCount} tài liệu gắn với bài học ${esc(n.sku)}">${ico('file-text', 14)} Tài liệu (${n.docCount}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>` : ''}
            ${n.sku ? `<button type="button" data-sodo-jump="reup:${esc(n.reupId)}" class="filter-btn inline-flex items-center justify-center min-h-[38px] gap-1 text-xs text-sky-300 hover:text-white cursor-pointer" title="Xem nguồn ${esc(n.reupId)} (${esc(n.sku)}) trên Sơ đồ DB">${ico('blocks', 14)} Sơ đồ DB <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>` : ''}
          </div>
        </article>`).join('')}
    </div>
  </section>`;
  }).join('') || `<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2">${ico('search', 24)}</div><div>Không tìm thấy nguồn reup phù hợp bộ lọc</div><button type="button" id="freset-reup-empty" class="btn-primary mt-3 min-h-[38px] text-xs cursor-pointer">Xóa bộ lọc &amp; Xem tất cả (${enriched.length} nguồn)</button></div>`}
  </div>`;
}


function buildRawSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const allRecords = window._rawKenhRecords || [];
  const activeFiltered = allRecords.filter(r => {
    const vA = r.vitalityAudit || {};
    const aL = r.audioLanguageInfo || {};
    const _nRaw = r.editorialNiche || r.niche || 'Chưa phân loại';
    const isTerminated = vA.healthStatus === 'DEAD_OR_PURGED' || (r.channelLifecycle && /^(?:TERMINATED|DEAD)/i.test(r.channelLifecycle.state || ''));
    if (state.rawGroup && rawNicheGroup(_nRaw) !== state.rawGroup) return false;
    if (state.rawNiche && _nRaw !== state.rawNiche) return false;
    if (state.rawLang && (aL.language || 'Tiếng Anh (English)') !== state.rawLang) return false;
    if (state.rawVitality === 'active' && vA.healthStatus !== 'ACTIVE') return false;
    if (state.rawVitality === 'slow' && vA.healthStatus !== 'SLOW') return false;
    if (state.rawVitality === 'dormant' && vA.healthStatus !== 'DORMANT_MID') return false;
    if (state.rawVitality === 'dead' && !isTerminated) return false;
    if (state.rawVitality === 'risk' && vA.healthStatus !== 'DORMANT_LONG' && vA.monetizationStatus !== 'MONETIZED_AT_RISK') return false;
    if (state.rawVitality === 'ypp' && vA.monetizationStatus !== 'MONETIZED_ACTIVE' && vA.monetizationStatus !== 'MONETIZED') return false;
    const tvF = r.thumbnailVision || null;
    if (state.rawFaceless === 'faceless' && !(tvF && tvF.isFaceless)) return false;
    if (state.rawFaceless === 'hasface' && !(tvF && !tvF.isFaceless)) return false;
    return true;
  });
  const records = activeFiltered.length ? activeFiltered : allRecords;
  const suggestions = [];
  const seenKeys = new Set();
  const isExactDieQuery = /^(?:die|kênh\s*die|kenh\s*die|dead|404)$/i.test(q);

  for (const r of records) {
    const ch = r.channel || {};
    const ocr = r.ocr || {};
    const vision = r.visionAnalysis || {};
    const vA = r.vitalityAudit || {};
    const aL = r.audioLanguageInfo || {};
    const tv = r.thumbnailVision || null;
    const chTitle = ch.title || vision.channelName || r.id;
    const handle = ch.handle || vision.handle || '';
    const rid = r.id || '';
    const nCode = (r.nicheCode || '').toUpperCase();
    const cid = ch.channelId || ch.id || '';
    const histHandles = safeArray(r.handleHistory).map(x => typeof x === 'string' ? x : (x && x.handle) || '').join(' ');
    const niche = r.editorialNiche || r.niche || '';
    const demoVid = r.featuredDemoVideo || {};
    const isTerminated = vA.healthStatus === 'DEAD_OR_PURGED' || (r.channelLifecycle && /^(?:TERMINATED|DEAD)/i.test(r.channelLifecycle.state || ''));
    const isDormant = vA.healthStatus === 'DORMANT_MID';
    const isRisk = vA.healthStatus === 'DORMANT_LONG' || vA.monetizationStatus === 'MONETIZED_AT_RISK';
    const statusTerms = isTerminated ? 'chết 404 gỡ terminated dead purged' : (isDormant ? 'ngủ đông dormant' : (isRisk ? 'rủi ro ypp nguy cơ tắt ypp dừng đăng lâu' : 'đang hoạt động sống live active'));
    const facelessTerms = tv ? (tv.isFaceless ? 'faceless ẩn mặt không lộ mặt' : 'có mặt người thật hasface') : '';
    const yppTerms = ((vA.monetizationStatus === 'MONETIZED_ACTIVE' || vA.monetizationStatus === 'MONETIZED') ? 'ypp bật kiếm tiền monetized ' : '') + (vA.monetizationBadge || '') + ' ' + (vA.healthBadge || '');
    const langTerms = (aL.language || '') + ' ' + (aL.code || '');
    const mainTopic = vision.mainTopic || '';

    // 1. Check Channel & Handle & RAW ID & NicheCode & ChannelId & Status/Lang/Faceless Match
    const chKey = 'ch:' + rid;
    if (!seenKeys.has(chKey)) {
      const matchedChannel = isExactDieQuery
        ? isTerminated
        : (SC.includes(chTitle, q) || SC.includes(handle, q) || SC.includes(rid, q) || SC.includes(nCode, q) || SC.includes(cid, q) || SC.includes(histHandles, q) || SC.includes(statusTerms, q) || SC.includes(facelessTerms, q) || SC.includes(yppTerms, q) || SC.includes(langTerms, q) || SC.includes(mainTopic, q));
      if (matchedChannel) {
        seenKeys.add(chKey);
        suggestions.push({
          type: 'channel',
          icon: 'tv',
          badge: nCode ? `${rid} · ${nCode}` : rid,
          badgeColor: 'bg-red-950/60 text-red-300 border-red-800/60',
          title: chTitle,
          sub: `${handle ? handle + ' · ' : ''}${niche}${ch.subscribers ? ' · ' + Number(ch.subscribers).toLocaleString() + ' subs' : ''}`,
          searchTerm: chTitle,
          rawId: rid,
          priority: rid.toLowerCase() === q || nCode.toLowerCase() === q || chTitle.toLowerCase().startsWith(q) ? 100 : 80
        });
      }
    }

    // 2. Check Demo Video Match
    if (demoVid.title && SC.includes(demoVid.title, q)) {
      const vidKey = 'vid:' + (demoVid.videoId || demoVid.title);
      if (!seenKeys.has(vidKey)) {
        seenKeys.add(vidKey);
        suggestions.push({
          type: 'video',
          icon: 'clapperboard',
          badge: 'Demo Tuyến',
          badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
          title: demoVid.title,
          sub: `Kênh: ${chTitle} (${rid})${demoVid.views ? ' · ' + Number(demoVid.views).toLocaleString() + ' views' : ''}`,
          searchTerm: demoVid.title,
          rawId: rid,
          priority: 90
        });
      }
    }

    // 3. Check OCR Video Rows & Vision Titles
    const ocrRows = (ocr && Array.isArray(ocr.videoRows)) ? ocr.videoRows : [];
    for (const row of ocrRows) {
      if (row.title && SC.includes(row.title, q)) {
        const vidKey = 'vid:' + row.title;
        if (!seenKeys.has(vidKey)) {
          seenKeys.add(vidKey);
          suggestions.push({
            type: 'video',
            icon: 'clapperboard',
            badge: row.viewsText || 'Video Raw',
            badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
            title: row.title,
            sub: `Kênh: ${chTitle} (${rid}) · ${niche}`,
            searchTerm: row.title,
            rawId: rid,
            priority: 70
          });
        }
      }
    }

    // 4. Check Niche Match
    if ((niche && SC.includes(niche, q)) || (nCode && SC.includes(nCode, q))) {
      const nKey = 'niche:' + niche;
      if (!seenKeys.has(nKey)) {
        seenKeys.add(nKey);
        suggestions.push({
          type: 'niche',
          icon: 'tag',
          badge: nCode || 'Ngách',
          badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
          title: niche,
          sub: `${nCode ? 'Mã chuẩn ' + nCode + ' · ' : ''}Lọc toàn bộ kênh mẫu thuộc ngách này`,
          searchTerm: niche,
          rawId: null,
          priority: nCode.toLowerCase() === q ? 95 : 60
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 7);
}

window.showRawSearchSuggestions = function(inputVal, _premerged) {
  const box = document.getElementById('raw-search-suggestions');
  if (!box) return;
  if (window._videoSugDismissed) {
    box.classList.add('hidden');
    return;
  }
  const q = (inputVal || '').trim();
  const fq = q.toLowerCase();
  if (!q) {
    box.innerHTML = '';
    box.classList.add('hidden');
    return;
  }

  const localItems = buildRawSearchSuggestions(q);
  if (window.H2Search && !_premerged) {
    window.H2Search.clearFtsNotices(box);
    window.H2Search.fetchApiSearch(q, 6).then(function (res) {
      if (window._videoSugDismissed || (state.rawQ || '').trim().toLowerCase() !== fq) return;
      const fqNow = document.getElementById('fq');
      if (!fqNow || document.activeElement !== fqNow || (fqNow.value || '').trim().toLowerCase() !== fq) return;
      const ftsRows = (res && res.rows) || [];
      const ftsItems = window.H2Search.ftsToSuggestions(ftsRows);
      /* FIX (uifix88) F3: server 200 + error (enrich) => hien canh bao ngay trong dropdown. */
      if (res && res.warning) window.H2Search.showFtsNotice(box, res.warning);
      const merged = window.H2Search.mergeSuggestions(localItems, ftsItems, 12);
      window.showRawSearchSuggestions(inputVal, merged);
    }).catch(function (err) {
      if (window._videoSugDismissed || (state.rawQ || '').trim().toLowerCase() !== fq) return;
      const fqNow = document.getElementById('fq');
      if (!fqNow || document.activeElement !== fqNow || (fqNow.value || '').trim().toLowerCase() !== fq) return;
      /* FIX (uifix87) LỖI 3: bao loi dich vu FTS thay vi im lang nhu "0 ket qua". */
      if (err && err.h2SearchServiceError) {
        window.H2Search.showFtsError(box, err);
        window.showRawSearchSuggestions(inputVal, localItems);
      }
    });
  }
  const notices = (window.H2Search && window.H2Search.ftsNoticesHtml) ? window.H2Search.ftsNoticesHtml(box.id) : '';
  let items = (Array.isArray(_premerged) ? _premerged : localItems);
  if (items.length === 0) {
    /* FIX (uifix88) F4: khong duoc vua bao loi vua bao "khong tim thay". */
    const hasNotice = !!notices;
    box.innerHTML = notices + (hasNotice
      ? `<div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-bg" role="status"><span>Không có gợi ý cục bộ cho "<strong>${esc(q)}</strong>". Tìm kiếm toàn văn chưa trả về kết quả dùng được.</span></div>`
      : `<div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-bg" ><span>Không tìm thấy gợi ý khớp với "<strong>${esc(q)}</strong>"</span><span class="text-xs text-gray-500 font-mono">Gõ tiếp hoặc nhấn Reset</span></div>`);
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = notices + `
    <div class="px-3.5 py-2 bg-surface text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-border">
      <span class="flex items-center gap-1.5"><span class="text-brand-400">${ico('zap', 14)}</span> Gợi ý khớp kênh & video raw (${items.length})</span>
      <span class="text-gray-500 font-normal">Nhấp để chọn hoặc xem hồ sơ</span>
    </div>
    ${items.map((item, idx) => `
      <div class="js-sug-row px-3.5 py-2.5 hover:bg-surface-2 cursor-pointer flex items-center justify-between gap-3 transition-colors group bg-bg" data-idx="${idx}" data-term="${esc(item.searchTerm)}" data-raw-id="${esc(item.rawId || '')}" data-type="${esc(item.type)}" data-url="${esc(item.directUrl || '')}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-base shrink-0">${ico(item.icon, 16)}</span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">${highlightQuery(item.title, q)}</div>
            <div class="text-xs text-gray-400 truncate">${esc(item.sub)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}">${esc(item.badge)}</span>
          ${item.rawId ? `<button type="button" class="js-sug-open-modal text-xs bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow" data-raw-id="${esc(item.rawId)}" title="Mở trực tiếp hồ sơ kênh">Mở ↗</button>` : ''}
          ${(!item.rawId && item.directUrl) ? `<a href="${esc(item.directUrl)}" class="js-sug-jump text-xs bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow whitespace-nowrap" title="${esc(item.btnLabel || 'Mở kết quả')}">${esc(item.btnLabel || 'Mở ↗')}</a>` : ''}
          ${(item.noDest || (!item.rawId && !item.directUrl)) ? `<span class="text-xs text-gray-500 font-mono px-1.5 py-0.5 rounded border border-border" title="Dòng này không có đích mở được — bấm vào sẽ không lọc ra kết quả">không có đích</span>` : ''}
        </div>
      </div>
    `).join('')}
  `;
  box.classList.remove('hidden');
};

async function renderRawKenh() {
  let rawData;
  try {
    rawData = await loadJSON('data-tabs/raw-kenh-mau.json');
  } catch (e) {
    rawData = { records: [] };
  }
  const records = Array.isArray(rawData) ? rawData : (rawData && rawData.records ? rawData.records : []);
  /* FULL PASS 2026-09-30: kenh da bi YouTube go (channelLifecycle.state TERMINATED_* hoac DEAD_*) truoc day van hien
     "Dang hoat dong" + tinh vao bo loc/so dem "hoat dong"/"YPP" vi vitalityAudit la anh chup TRUOC khi bi go
     (do: 5/156 — RAW-012/033/143/145/152). Ghi de trang thai HIEU LUC khi hien thi; giu ban goc o _vitalitySnapshot. */
  records.forEach(r => {
    const lc = r && r.channelLifecycle;
    if (!lc || !/^(?:TERMINATED|DEAD)/i.test(lc.state || '') || r._vitalitySnapshot) return;
    const ev = (lc.events || []).find(x => x && /terminated/i.test(x.type || '')) || {};
    const d = ev.date ? String(ev.date).slice(0, 10).split('-').reverse().join('/') : '';
    r._vitalitySnapshot = r.vitalityAudit || null;
    r.vitalityAudit = Object.assign({}, r.vitalityAudit || {}, {
      healthStatus: 'DEAD_OR_PURGED',
      healthBadge: 'Đã bị YouTube gỡ' + (d ? ' (' + d + ')' : ''),
      monetizationStatus: 'TERMINATED',
      monetizationBadge: 'Không còn kiếm tiền (kênh bị gỡ)'
    });
  });
  window._rawKenhRecords = records;
  const qRawTrim = String(state.rawQ || '').trim();
  const q = qRawTrim.toLowerCase();
  const qExactRawMatch = qRawTrim.match(/^#?(RAW-\d{3})$/i);
  const qExactNicheMatch = qRawTrim.match(/^#?(H\d{2})(?:\b|\s|—|-|$)/i);
  const qExactHandleMatch = qRawTrim.match(/^@([^\s]+)$/);
  const qExactChannelIdMatch = qRawTrim.match(/^(UC[A-Za-z0-9_-]{16,})$/i);
  const exactRawIdQ = qExactRawMatch ? qExactRawMatch[1].toUpperCase() : '';
  const exactNicheCodeQ = qExactNicheMatch ? qExactNicheMatch[1].toUpperCase() : '';
  const exactHandleQ = qExactHandleMatch ? qExactHandleMatch[1].toLowerCase() : '';
  const exactChannelIdQ = qExactChannelIdMatch ? qExactChannelIdMatch[1].toLowerCase() : '';
  const hasExactEntityQ = Boolean(exactRawIdQ || exactNicheCodeQ || exactHandleQ || exactChannelIdQ);
  const hasExactRid = Boolean(state.rawRid && records.some(r => String(r.id || '').toUpperCase() === String(state.rawRid).toUpperCase()));
  if (hasExactRid && state.rawPage !== 1) state.rawPage = 1;
  const currentNiche = state.rawNiche || '';
  const currentLang = state.rawLang || '';

  const nicheCounts = records.reduce((acc, r) => {
    const n = r.editorialNiche || r.niche || 'Chưa phân loại';
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const sortedNiches = Object.keys(nicheCounts).sort((a, b) => nicheCounts[b] - nicheCounts[a]);
  const groupCounts = records.reduce((acc, r) => {
    const g = rawNicheGroup(r.editorialNiche || r.niche || 'Chưa phân loại');
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const sortedGroups = Object.keys(RAW_NICHE_GROUPS)
    .filter(g => groupCounts[g])
    .sort((a, b) => groupCounts[b] - groupCounts[a]);

  const langCounts = records.reduce((acc, r) => {
    const l = (r.audioLanguageInfo && r.audioLanguageInfo.language) ? r.audioLanguageInfo.language : 'Tiếng Anh (English)';
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});

  const activeCount = records.filter(r => r.vitalityAudit && r.vitalityAudit.healthStatus === 'ACTIVE').length;
  const slowCount = records.filter(r => r.vitalityAudit && r.vitalityAudit.healthStatus === 'SLOW').length;
  const dormantMidCount = records.filter(r => r.vitalityAudit && r.vitalityAudit.healthStatus === 'DORMANT_MID').length;
  const deadCount = records.filter(r => (r.vitalityAudit && r.vitalityAudit.healthStatus === 'DEAD_OR_PURGED') || (r.channelLifecycle && /^(?:TERMINATED|DEAD)/i.test(r.channelLifecycle.state || ''))).length;
  const riskCount = records.filter(r => r.vitalityAudit && (r.vitalityAudit.healthStatus === 'DORMANT_LONG' || r.vitalityAudit.monetizationStatus === 'MONETIZED_AT_RISK')).length;
  const yppCount = records.filter(r => r.vitalityAudit && (r.vitalityAudit.monetizationStatus === 'MONETIZED_ACTIVE' || r.vitalityAudit.monetizationStatus === 'MONETIZED')).length;
  const uniqueChannelCount = new Set(records.map(r => (r.channel && (r.channel.channelId || r.channel.id || r.channel.handle)) || r.id)).size;

  const isExactDieQuery = /^(?:die|kênh\s*die|kenh\s*die|dead|404)$/i.test(qRawTrim);
  const filtered = records.filter(r => {
    const ch = r.channel || {};
    const ocr = r.ocr || {};
    const vision = r.visionAnalysis || {};
    const vA = r.vitalityAudit || {};
    const aL = r.audioLanguageInfo || {};
    /* FIX (uifix88) F1 — dinh danh DUNG 1 ho so bang id tu ket qua tim kiem toan van
       (link /rawkenh?rid=RAW-nnn). Truoc day FTS CHANNEL/TRANSCRIPT mo bang cach loc theo TEN
       (rq=<ten kenh>) nen ten trung nhau -> ra nhieu ho so. Co rid thi chi giu dung ho so do. */
    if (hasExactRid) return String(r.id || '').toUpperCase() === String(state.rawRid).toUpperCase();
    const _nRaw = r.editorialNiche || r.niche || 'Chưa phân loại';
    const isTerminated = vA.healthStatus === 'DEAD_OR_PURGED' || (r.channelLifecycle && /^(?:TERMINATED|DEAD)/i.test(r.channelLifecycle.state || ''));
    const isDormant = vA.healthStatus === 'DORMANT_MID';
    const isRisk = vA.healthStatus === 'DORMANT_LONG' || vA.monetizationStatus === 'MONETIZED_AT_RISK';

    // Luôn tôn trọng các chip filter đang bật chủ động (kể cả khi tìm theo H01..H40, RAW-xxx, @handle)
    if (state.rawGroup && rawNicheGroup(_nRaw) !== state.rawGroup) return false;
    if (currentNiche && _nRaw !== currentNiche) return false;
    if (currentLang && (aL.language || 'Tiếng Anh (English)') !== currentLang) return false;
    if (state.rawVitality === 'active' && vA.healthStatus !== 'ACTIVE') return false;
    if (state.rawVitality === 'slow' && vA.healthStatus !== 'SLOW') return false;
    if (state.rawVitality === 'dormant' && vA.healthStatus !== 'DORMANT_MID') return false;
    if (state.rawVitality === 'dead' && !isTerminated) return false;
    if (state.rawVitality === 'risk' && vA.healthStatus !== 'DORMANT_LONG' && vA.monetizationStatus !== 'MONETIZED_AT_RISK') return false;
    if (state.rawVitality === 'ypp' && vA.monetizationStatus !== 'MONETIZED_ACTIVE' && vA.monetizationStatus !== 'MONETIZED') return false;
    const tvF = r.thumbnailVision || null;
    if (state.rawFaceless === 'faceless' && !(tvF && tvF.isFaceless)) return false;
    if (state.rawFaceless === 'hasface' && !(tvF && !tvF.isFaceless)) return false;

    if (exactRawIdQ) return String(r.id || '').toUpperCase() === exactRawIdQ;
    if (exactNicheCodeQ) return String(r.nicheCode || '').toUpperCase() === exactNicheCodeQ;
    const cid = String(ch.channelId || ch.id || '').trim().toLowerCase();
    if (exactChannelIdQ) return cid === exactChannelIdQ;
    const histHandles = safeArray(r.handleHistory).map(x => typeof x === 'string' ? x : (x && x.handle) || '').join(' ').toLowerCase();
    const title = ((ch.title || '') + ' ' + (ocr.channelName || '') + ' ' + (vision.channelName || '')).toLowerCase();
    const handle = ((ch.handle || '') + ' ' + (ocr.handle || '') + ' ' + (vision.handle || '') + ' ' + histHandles).toLowerCase();
    if (exactHandleQ) return handle.includes(exactHandleQ);
    if (isExactDieQuery) return isTerminated;

    const fname = (r.fileName || '').toLowerCase();
    const n = _nRaw.toLowerCase();
    const nCode = (r.nicheCode || '').toLowerCase();
    const lName = (aL.language || 'Tiếng Anh (English)').toLowerCase();
    const lCode = (aL.code || '').toLowerCase();
    const rid = (r.id || '').toLowerCase();
    const demoVidTitle = (r.featuredDemoVideo && r.featuredDemoVideo.title ? r.featuredDemoVideo.title : '').toLowerCase();
    const otherVidTitles = [
      ...(vision.videoTitles ? vision.videoTitles : []),
      ...(ocr && Array.isArray(ocr.videoRows) ? ocr.videoRows.map(row => row.title || '') : [])
    ].join(' ').toLowerCase();
    const mainTopic = (vision.mainTopic || '').toLowerCase();
    const deadKeywords = isTerminated ? 'chết 404 gỡ terminated dead purged' : (isDormant ? 'ngủ đông ngudong dormant' : (isRisk ? 'rủi ro ypp nguy cơ tắt ypp dừng đăng lâu' : 'đang hoạt động sống live active'));
    const facelessKeywords = tvF ? (tvF.isFaceless ? 'faceless ẩn mặt không lộ mặt' : 'có mặt người thật hasface') : '';
    const yppKeywords = ((vA.monetizationStatus === 'MONETIZED_ACTIVE' || vA.monetizationStatus === 'MONETIZED') ? 'ypp bật kiếm tiền monetized ' : '') + (vA.monetizationBadge || '') + ' ' + (vA.healthBadge || '');

    if (q && !SC.matchesQuery([title, handle, fname, n, nCode, rid, cid, lName, lCode, demoVidTitle, otherVidTitles, mainTopic, deadKeywords, facelessKeywords, yppKeywords, vA.healthStatus || ''], q)) return false;
    return true;
  });

  const verifiedCount = records.filter(r => r.vidiqVerification && r.vidiqVerification.status === 'VERIFIED').length;
  const visionCount = records.filter(r => r.visionAnalysis).length;
  const withHandle = records.filter(r => (r.channel || {}).handle).length;
  const ocrCount = records.filter(r => r.ocr).length;
  const facelessCount = records.filter(r => r.thumbnailVision && r.thumbnailVision.isFaceless).length;
  const hasFaceCount = records.filter(r => r.thumbnailVision && !r.thumbnailVision.isFaceless).length;
  const showAdvFilters = Boolean(state.rawFiltersExpanded || state.rawVitality || state.rawFaceless || state.rawLang);
  const langFlags = records.reduce((acc, r) => {
    const aL = r.audioLanguageInfo || {};
    if (aL.language && aL.flag && !acc[aL.language]) acc[aL.language] = aL.flag;
    return acc;
  }, {});
  const sortedLangs = Object.keys(langCounts).sort((a, b) => (langCounts[b] || 0) - (langCounts[a] || 0));

  return `
  ${pageBanner('Raw kênh mẫu', SC.pad2(filtered.length) + '/' + SC.pad2(records.length) + ' hồ sơ (' + uniqueChannelCount + ' kênh độc lập) · bóc tách qua Vision AI + OCR + vidIQ', [
    { icon: ICONS.image, label: 'Ảnh raw', value: records.length, sub: `${filtered.length === records.length ? 'Hiện tất cả' : 'Đang lọc ' + filtered.length} · ${uniqueChannelCount} kênh độc lập`, extraAttrs: 'data-raw-kpi="all"' },
    { icon: ICONS.niche, label: 'Nhóm chủ đề', value: sortedGroups.length, sub: `${Object.keys(nicheCounts).length} ngách chi tiết`, extraAttrs: 'data-raw-kpi="groups"' },
    { icon: ICONS.channel, label: 'Sức sống YPP', value: `${activeCount} live`, sub: `${yppCount} YPP Active · ${deadCount} gỡ/die`, extraAttrs: 'data-raw-kpi="active"' },
    { icon: ICONS.doc, label: 'Faceless & Kiểm định AI', value: `${facelessCount} faceless`, sub: `${hasFaceCount} có mặt · ${verifiedCount} vidIQ`, extraAttrs: 'data-raw-kpi="faceless"' }
  ])}
  ${hasExactRid ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex items-center gap-1.5">${ico('target', 14)} Đang mở đúng <b class="text-white">1 hồ sơ</b> theo mã <b class="text-brand-300 font-mono">${esc(state.rawRid)}</b> (điều hướng bằng ID từ kết quả tìm kiếm toàn văn).</span>
    <button type="button" id="btn-clear-raw-rid" class="filter-btn text-xs">Xem tất cả ${records.length} hồ sơ</button>
  </div>` : ''}
  <div class="card p-4 sm:p-5 mb-6 border-brand-500/30 bg-brand-950/20" role="note">
<div class="flex items-start gap-3">
  <span class="text-lg shrink-0 inline-flex items-center">${ico('camera', 20)}</span>
  <div class="min-w-0">
    <h3 class="text-sm font-bold text-white">Kho Ảnh Raw & Dữ Liệu Bóc Tách ${records.length} Hồ Sơ (${uniqueChannelCount} Kênh Độc Lập)</h3>
    <p class="text-xs text-gray-300 mt-1 leading-relaxed">Hiển thị trực quan 100% ảnh chụp màn hình kênh đối thủ thực tế kèm số liệu bóc tách Vision AI, OCR và kiểm định sức sống YPP. Bấm vào ảnh để xem kích thước đầy đủ.</p>
  </div>
</div>
  </div>
  <div class="card p-4 sm:p-5 mb-6 overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm ảnh raw</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="raw-search-wrap">
    <input id="fq" value="${esc(state.rawQ)}" autocomplete="off" placeholder="Tìm theo mã RAW-001, H01..H40, tên kênh, @handle, video bão view..." class="search-input-premium w-full min-w-0 pr-9" aria-label="Tìm ảnh raw kênh mẫu">
    ${(state.rawQ || hasExactRid) ? `<button type="button" id="btn-clear-raw-q" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>` : ''}
    <div id="raw-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-border"></div>
  </div>
  <button type="button" id="freset-raw" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline" id="raw-groups-filter-bar">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách phát hiện · theo nhóm chủ đề</div>
  <p class="text-xs text-gray-500 mb-2.5 leading-relaxed">Các kênh cùng chủ đề được gom về một nhóm. Bấm nhóm để xem ngách chi tiết bên trong.</p>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-raw-group="" class="filter-btn ${!state.rawGroup ? 'active' : ''}">Mọi nhóm · ${records.length}</button>
    ${sortedGroups.map(g => `<button type="button" data-raw-group="${esc(g)}" class="filter-btn ${state.rawGroup === g ? 'active' : ''}" title="${esc(g)} — ${groupCounts[g]} kênh thuộc ${RAW_NICHE_GROUPS[g].filter(n => nicheCounts[n]).length} ngách">${esc(g)} · ${groupCounts[g]}</button>`).join('')}
  </div>
  ${state.rawGroup ? (() => {
    const inGroup = sortedNiches.filter(n => rawNicheGroup(n) === state.rawGroup);
    return `
  <div class="mt-3 pt-2.5 border-t border-hairline">
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="text-xs text-gray-400 font-semibold inline-flex items-center gap-1.5">${ico('corner-down-right', 14)} Ngách trong nhóm <span class="text-brand-300">${esc(state.rawGroup)}</span> (${inGroup.length} ngách · ${groupCounts[state.rawGroup]} kênh)</div>
      <button type="button" data-raw-niche="" class="text-xs font-semibold ${!currentNiche ? 'text-brand-300' : 'text-gray-400 hover:text-gray-200'} transition-colors shrink-0">Xem tất cả nhóm này</button>
    </div>

    <!-- Mobile-friendly Native Dropdown Selector (Chọn ngách chi tiết nhanh, 100% hiển thị đủ chữ) -->
    <div class="subniche-select-wrap">
      <select id="raw-subniche-select" class="subniche-select">
        <option value="">-- Tất cả ${inGroup.length} ngách trong nhóm (${groupCounts[state.rawGroup]} kênh) --</option>
        ${inGroup.map(n => `<option value="${esc(n)}" ${currentNiche === n ? 'selected' : ''}>${esc(n)} (${nicheCounts[n]} kênh)</option>`).join('')}
      </select>
    </div>

    <!-- Subniche Chip List: Co giãn thông minh, text xuống dòng tự nhiên, không bao giờ bị cắt chữ hay tràn màn hình -->
    <div class="subniche-grid">
      ${inGroup.map(n => `
        <button type="button" data-raw-niche="${esc(n)}" class="subniche-chip ${currentNiche === n ? 'active' : ''}" title="${esc(n)} — ${nicheCounts[n]} kênh">
          <span class="subniche-name">${esc(n)}</span>
          <span class="subniche-count">${nicheCounts[n]}</span>
        </button>
      `).join('')}
    </div>
  </div>`;
  })() : ''}
</div>
<button type="button" data-raw-filters-toggle class="mt-3.5 pt-3 border-t border-hairline w-full flex items-center justify-between gap-2 text-left group">
  <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold text-gray-400 transition inline-flex items-center gap-1.5">${ico('settings', 14)} Bộ lọc nâng cao (sức sống · faceless · ngôn ngữ)</span>
  <span class="text-xs font-bold text-brand-300 group-hover:text-brand-200 transition shrink-0 inline-flex items-center gap-1">${showAdvFilters ? ico('chevron-up', 14) + ' Thu gọn' : ico('chevron-down', 14) + ' Mở rộng'}</span>
</button>
<div class="${showAdvFilters ? '' : 'hidden'}">
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">Tình trạng sống & YPP:</div>
  <button type="button" data-raw-vitality="" class="filter-btn ${!state.rawVitality ? 'active' : ''}">Tất cả · ${records.length}</button>
  <button type="button" data-raw-vitality="active" class="filter-btn ${state.rawVitality === 'active' ? 'active' : ''}">${icoColored('shield-check', '#34d399', 14)} Đang hoạt động · ${activeCount}</button>
  <button type="button" data-raw-vitality="slow" class="filter-btn ${state.rawVitality === 'slow' ? 'active' : ''}">${icoColored('alert-circle', '#fde68a', 14)} Ra video chậm · ${slowCount}</button>
  <button type="button" data-raw-vitality="dormant" class="filter-btn ${state.rawVitality === 'dormant' ? 'active' : ''}">${icoColored('alert-circle', '#fb923c', 14)} Ngủ đông · ${dormantMidCount}</button>
  <button type="button" data-raw-vitality="dead" class="filter-btn ${state.rawVitality === 'dead' ? 'active' : ''}">
    <span class="inline-flex items-center gap-1.5"><span class="kenh-dot-dead"></span>Đã bị gỡ / DIE · ${deadCount}</span>
  </button>
  <button type="button" data-raw-vitality="risk" class="filter-btn ${state.rawVitality === 'risk' ? 'active' : ''}">${icoColored('alert-triangle', '#f87171', 14)} Nguy cơ tắt YPP / Dừng lâu · ${riskCount}</button>
  <button type="button" data-raw-vitality="ypp" class="filter-btn ${state.rawVitality === 'ypp' ? 'active' : ''}">${icoColored('coins', '#34d399', 14)} Bật kiếm tiền (YPP Active) · ${yppCount}</button>
</div>
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">Faceless (Vision AI):</div>
  <button type="button" data-raw-faceless="" class="filter-btn ${!state.rawFaceless ? 'active' : ''}">Tất cả · ${records.length}</button>
  <button type="button" data-raw-faceless="faceless" class="filter-btn ${state.rawFaceless === 'faceless' ? 'active' : ''}">${ico('drama', 14)} Faceless · ${facelessCount}</button>
  <button type="button" data-raw-faceless="hasface" class="filter-btn ${state.rawFaceless === 'hasface' ? 'active' : ''}">${ico('user', 14)} Có mặt người thật · ${hasFaceCount}</button>
</div>
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">Ngôn ngữ giọng đọc:</div>
  <button type="button" data-raw-lang="" class="filter-btn ${!currentLang ? 'active' : ''}">Mọi ngôn ngữ · ${records.length}</button>
  ${sortedLangs.map(langKey => {
    const shortLabel = langKey.replace(/\s*\(.*?\)\s*$/, '').trim();
    const flag = langFlags[langKey] || '';
    return `<button type="button" data-raw-lang="${esc(langKey)}" class="filter-btn ${currentLang === langKey ? 'active' : ''}">${flag ? esc(flag) + ' ' : ''}${esc(shortLabel)} · ${langCounts[langKey] || 0}</button>`;
  }).join('\n  ')}
</div>
</div>
  </div>
  <div class="space-y-6">
  ${(() => {
    const PAGE_SIZE = 24;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, state.rawPage || 1), totalPages);
    state.rawPage = page;
    try { const u = new URL(location.href); if (page > 1) u.searchParams.set('page', String(page)); else u.searchParams.delete('page'); history.replaceState(history.state, '', u.pathname + u.search); } catch (e) {}
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    function rawPager(pos) {
      if (totalPages <= 1) return '';
      return `<nav class="flex items-center justify-between gap-2 ${pos === 'top' ? 'mb-3' : 'mt-4'} text-xs text-gray-400" aria-label="Phân trang hồ sơ raw${pos === 'bottom' ? ' (cuối trang)' : ''}"><span>Trang ${page}/${totalPages} · ${filtered.length} hồ sơ</span><span class="flex gap-1">${page > 1 ? `<button type="button" class="filter-btn" data-action="raw-page" data-pos="${pos}" data-page="${page - 1}">← Trước</button>` : ''}${page < totalPages ? `<button type="button" class="filter-btn" data-action="raw-page" data-pos="${pos}" data-page="${page + 1}">Sau →</button>` : ''}</span></nav>`;
    }
    return rawPager('top') + `
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
    ${paged.map(r => {

    const ch = r.channel || {};
    const vision = r.visionAnalysis || {};
    const ocr = r.ocr || null;
    const vA = r.vitalityAudit || {};
    const vG = r.vidiqVerification && r.vidiqVerification.growth30d;
    const rawHandleStr = String(ch.handle || vision.handle || (ocr && ocr.handle) || '').trim();
    const decodedHandle = (() => { try { return decodeURIComponent(rawHandleStr); } catch (_) { return rawHandleStr; } })().replace(/^@+/, '').trim();
    const ytUrl = safeExternalUrl(ch.url) || (decodedHandle ? ('https://www.youtube.com/@' + encodeURIComponent(decodedHandle)) : ('https://www.youtube.com/results?search_query=' + encodeURIComponent(ch.title || r.id || '')));
    const isTerminated = vA.healthStatus === 'DEAD_OR_PURGED' || (r.channelLifecycle && /^TERMINATED/.test(r.channelLifecycle.state || ''));
    const statusBadge = isTerminated
      ? `<span class="badge badge-red font-bold text-xs uppercase tracking-wider shrink-0">Đã bị gỡ · 404</span>`
      : ((r.vidiqVerification && r.vidiqVerification.status === 'VERIFIED')
        ? `<span class="badge badge-green">vidIQ Verified</span>`
        : (r.duplicateOf ? `<span class="badge badge-amber">Trùng (${esc(r.duplicateOf)})</span>` : (r.status === 'OCR_COMPLETE' ? `<span class="badge badge-blue">OCR đủ</span>` : `<span class="badge badge-amber">Manual</span>`)));
    const langInfo = r.audioLanguageInfo || (r.deepIntelligence && r.deepIntelligence.audioLanguage ? { flag: r.deepIntelligence.languageFlag || '', code: r.deepIntelligence.audioLanguage } : null);
    /* Bo 11 muc 4 (29/09): voiceDna = ket qua STT do that (faster-whisper) — uu tien hien neu co (kế thừa từ duplicateOf nếu có) */
    const vd = r.voiceDna || (r.duplicateOf && (records.find(x => x.id === r.duplicateOf) || {}).voiceDna) || null;
    const vdWpm = vd && vd.wpm ? (vd.wpm + (vd.wpmNote ? ' cpm' : ' WPM')) : '';
    const imgSrc = r.fileName ? 'assets/raw-kenh/' + encodeURIComponent(r.fileName) : 'assets/thumbs/placeholder.svg';
    const tv = r.thumbnailVision || null;
    return `
    <article class="card overflow-hidden min-w-0 flex flex-col hover:border-brand-500 transition group ${isTerminated ? 'kenh-card-dead' : ''}" data-raw-card="${esc(r.id)}">
      <div class="js-view-raw-image relative bg-ink-950 aspect-video overflow-hidden border-b border-ink-700 cursor-pointer" role="button" tabindex="0" aria-label="Xem ảnh raw đầy đủ: ${esc((ch.title || r.id).trim())}" data-src="${esc(imgSrc)}" data-title="${esc((ch.title || r.id).trim())}" title="Bấm xem ảnh kích thước đầy đủ">
        <img src="${esc(imgSrc)}" alt="Ảnh kênh: ${esc((ch.title || r.id).trim())}" width="640" height="360" data-img-fallback="placeholder" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async">
        <div class="absolute top-2 left-2 flex items-center gap-1" style="z-index:var(--h2-z-base)">
          <span class="bg-ink-900/80 px-2 py-0.5 rounded-xl text-xs font-mono text-gray-300 border border-white/10 truncate">${esc(r.id)}</span>
          ${langInfo || vd ? `<span class="bg-sky-950/85 text-sky-300 font-bold px-1.5 py-0.5 rounded-md border border-sky-500/40 text-xs shrink-0" title="${vd ? 'Ngôn ngữ + WPM đo từ phôi giọng (STT 29/09)' : esc(langInfo.language || langInfo.code)}">${esc((vd && vd.flag) || langInfo.flag)} ${esc((vd && vd.code ? vd.code.split('-')[0] : (langInfo.code ? langInfo.code.split('-')[0] : '')).toUpperCase())}${vdWpm ? ' · ' + esc(vdWpm) : ''}</span>` : ''}
        </div>
        <span class="absolute top-2 right-2 bg-brand-600/90 text-white text-xs font-medium px-2 py-0.5 rounded-xl truncate max-w-[50%]">${esc(r.editorialNiche || r.niche || 'Chưa rõ')}</span>
        ${isTerminated ? `<span class="kenh-dead-stamp" style="bottom:8px;right:8px">GỠ / DIE</span>` : ''}
        ${tv ? `<span style="z-index:var(--h2-z-base)" class="absolute bottom-2 left-2 ${tv.isFaceless ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : 'bg-red-950/90 text-red-300 border-red-500/50'} text-xs font-bold px-2 py-0.5 rounded-lg border backdrop-blur-sm" title="Vision AI (9Router local) phân loại cấp kênh · ${esc(tv.agreement || '')}">${tv.isFaceless ? ico('drama', 14) + ' Faceless' : ico('user', 14) + ' Có mặt người thật'}</span>` : ''}
        <span class="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-0.5 rounded-lg border border-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">${ico('search', 14)} Xem ảnh</span>
      </div>
      <div class="p-4 sm:p-5 flex-1 flex flex-col gap-2 min-w-0">
        <div class="flex items-start justify-between gap-2 min-w-0">
          <h3 class="text-sm font-bold text-white group-hover:text-brand-300 transition line-clamp-1 min-w-0 ${isTerminated ? 'kenh-dead-title' : ''}">${esc((ch.title || '').trim() || 'Chưa rõ tên')}</h3>
          <div class="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            ${statusBadge}
            ${vA.monetizationStatus === 'MONETIZED_AT_RISK' ? `<span class="badge badge-red text-xs font-bold inline-flex items-center gap-1">${ico('alert-triangle', 14)} Rủi ro YPP</span>` : ''}
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 min-w-0">
          ${(ch.handle || vision.handle || (ocr && ocr.handle)) ? `<div class="text-xs text-brand-400 font-mono truncate">${esc((function(){ try { return decodeURIComponent(ch.handle || vision.handle || (ocr && ocr.handle)); } catch(e) { return ch.handle || vision.handle || (ocr && ocr.handle) || ''; } })())}</div>` : '<span></span>'}
          ${r.nicheCode ? `<button type="button" class="badge badge-blue text-xs font-mono shrink-0" data-open-tab="ngachxanh" data-nx-q="${esc(r.nicheCode)}" title="Xem ngách ${esc(r.nicheCode)} trên Ngách Xanh">${esc(r.nicheCode)} ↗</button>` : ''}
        </div>
        ${ch.subscribers ? `
        <div class="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span class="truncate">${Number(ch.subscribers).toLocaleString()} subs · ${Number(ch.views || 0).toLocaleString()} views</span>
          ${vG && vG.subscribersGained ? `<span class="text-gray-400 font-normal shrink-0">(+${Number(vG.subscribersGained).toLocaleString()}/30d)</span>` : ''}
        </div>` : ''}
        ${vA.healthStatus === 'DORMANT_LONG' ? `
        <div class="text-xs bg-red-950/70 border border-red-800/80 rounded-xl px-2.5 py-1.5 text-red-200 font-medium flex items-center gap-1.5">
          <span class="text-red-400 font-bold animate-pulse inline-flex">${ico('alert-triangle', 14)}</span> Dừng đăng ${vA.daysSinceLatest} ngày — Nguy cơ tắt YPP / Die
        </div>` : (vA.daysSinceLatest != null ? `
        <div class="text-xs text-gray-400 flex items-center justify-between">
          <span class="truncate inline-flex items-center gap-1">${ico('calendar', 14)} Video gần nhất: <b class="text-gray-200">${esc(vA.latestUploadDate || 'N/A')}</b></span>
          <span class="${vA.healthStatus === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'} shrink-0 ml-1">${vA.daysSinceLatest}d trước</span>
        </div>` : '')}
        ${vision.mainTopic ? `<p class="text-xs text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2"><span class="text-amber-400 font-semibold">Chủ đề:</span> ${esc(vision.mainTopic)}</p>` : ''}
        ${vision.videoTitles && vision.videoTitles.length ? `<p class="text-xs text-gray-400 italic line-clamp-1">"${esc(vision.videoTitles[0])}"</p>` : ''}
        ${tv ? `<p class="text-xs text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2"><span class="${tv.isFaceless ? 'text-emerald-400' : 'text-red-400'} font-semibold">Vision:</span> ${tv.isFaceless ? 'Faceless' : 'Có mặt người thật'} · ${esc(tv.facelessType || '')} · Ngách: ${esc(tv.thumbnailNiche || '—')}${tv.needsReview ? ' <span class="text-amber-400 font-semibold">· cần review</span>' : ''}</p>` : ''}
        ${/* FIX 2026-09-30: dong OCR la SNAPSHOT luc chup anh raw (ocr.scannedAt), KHONG phai so hien tai.
             Truoc day hien tran -> nguoi xem thay 2 so subscriber mau thuan (vd 114,000 subs vs 19.6K subscribers).
             Do N/N: 83/83 record co ocr deu co scannedAt; 33/83 lech >20% so voi channel.subscribers. */ ''}
        ${ocr ? `<p class="text-xs text-gray-400 truncate" title="Số liệu đọc từ ảnh raw lúc phát hiện kênh, không phải số hiện tại"><span class="text-gray-500">Lúc chụp raw${ocr.scannedAt ? ' ' + esc(String(ocr.scannedAt).slice(0, 10)) : ''}:</span> ${esc([ocr.subsText, ocr.videoCountText, ocr.videoRows && ocr.videoRows[0] ? ocr.videoRows[0].vph : null].filter(Boolean).join(' · '))}</p>` : ''}
        ${r.deepIntelligence ? `
        <div class="text-xs bg-white/[0.03] border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-gray-300">
          <span class="text-amber-300 font-medium inline-flex items-center gap-1">${ico('zap', 14)} ${r.deepIntelligence.topVideosCount} videos</span>
          <span class="text-sky-300 font-medium inline-flex items-center gap-1">${ico('tag', 14)} ${r.deepIntelligence.tagsCount} tags</span>
          <span class="text-emerald-300 font-medium inline-flex items-center gap-1">${ico('coins', 14)} ${esc(vA.estimatedMonthlyRev || 'N/A')}</span>
          <span class="${vA.healthStatus === 'DEAD_OR_PURGED' ? 'text-red-400' : 'text-emerald-400'} font-medium ml-auto inline-flex items-center gap-1">${ico(vA.healthStatus === 'DEAD_OR_PURGED' ? 'alert-triangle' : 'shield-check', 14)} ${esc(stripDecorEmoji(vA.healthBadge) || (r.deepIntelligence.longevityStatus ? r.deepIntelligence.longevityStatus.replace(/\(.*?\)/g, '').trim() : ''))}</span>
        </div>` : ''}
        ${(r.featuredDemoVideo && r.featuredDemoVideo.videoId) ? `
        <button type="button" class="js-quick-video h2-btn h2-btn--ghost h2-btn--sm w-full mt-1.5" data-vid="${esc(r.featuredDemoVideo.videoId)}" data-title="${esc(r.featuredDemoVideo.title)}" data-channel="${esc((ch.title || r.id).trim())}" data-badge="Demo Tuyến Nội Dung">
          <span class="inline-flex items-center gap-1.5">${ico('clapperboard', 14)} Xem Demo Tuyến Mới Nhất</span> <span class="text-xs font-bold text-rose-400 inline-flex">${ico('play', 14)}</span>
        </button>` : ''}
        <div class="grid grid-cols-2 gap-1.5 mt-1.5">
          <button type="button" class="btn-open-raw-deep h2-btn h2-btn--ghost h2-btn--sm" data-raw-id="${esc(r.id)}" data-jump="mission-control" title="Xem Prompts & Vũ Khí Tác Chiến">
            ${ico('zap', 14)} Prompts <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span>
          </button>
          <button type="button" class="btn-open-raw-deep h2-btn h2-btn--ghost h2-btn--sm" data-raw-id="${esc(r.id)}" title="Xem Hồ Sơ & Top Videos Chi Tiết">
            ${ico('bar-chart-3', 14)} Hồ Sơ Raw <span class="h2-ico-arrow inline-flex">${ico('arrow-right', 14)}</span>
          </button>
        </div>
        <div class="mt-auto pt-2.5 border-t border-ink-700 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div class="flex items-center gap-1.5">
            <button type="button" class="filter-btn text-xs" data-open-tab="kenh-mau" data-kenh-q="${esc(r.id)}" title="Đối chiếu hồ sơ ${esc(r.id)} trong Kênh mẫu">Kênh mẫu <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
            <button type="button" class="filter-btn text-xs" data-sodo-jump="${esc(r.id)}" title="Truy vết kênh ${esc(r.id)} trên Sơ đồ DB">Sơ đồ DB <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          </div>
          <a href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs whitespace-nowrap shrink-0" title="${vA && vA.healthStatus === 'DEAD_OR_PURGED' ? 'Kênh đã chết/gỡ (YT 404)' : 'Mở kênh trên YouTube'}">${vA && vA.healthStatus === 'DEAD_OR_PURGED' ? 'YT 404' : 'Mở YouTube'} <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></a>
        </div>
      </div>
    </article>`;
    }).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2 flex justify-center">' + ico('search', 24) + '</div><p class="mb-3">Không tìm thấy hồ sơ kênh raw phù hợp với bộ lọc hiện tại.</p><button type="button" id="freset-raw-empty" class="bg-surface-2 hover:bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Xóa bộ lọc</button></div>'}
  </div>` + rawPager('bottom');
})()}
</div>
  </div>`;
}

async function renderKenh() {
  const [kenhRaw, nxRaw, rawData] = await Promise.all([
    loadJSON('data-tabs/kenh-mau.json').catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => ({})),
    loadJSON('data-tabs/raw-kenh-mau.json').catch(() => ({ records: [] }))
  ]);
  const kenh = safeArray(kenhRaw);
  function normHandleKey(val) {
    let s = String(val || '').trim();
    try { s = decodeURIComponent(s); } catch (_) {}
    return s.replace(/^@/, '').trim().toLowerCase();
  }
  function pickPositiveNum(...vals) {
    for (const v of vals) {
      if (v === null || v === undefined || v === '' || typeof v === 'boolean') continue;
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  }
  const rawSource = Array.isArray(rawData) ? rawData : (rawData && Array.isArray(rawData.records) ? rawData.records : []);
  const rawVitalityMap = new Map();
  const rawRecords = rawSource.map(r => {
    if (!r || typeof r !== 'object') return r;
    const lc = r.channelLifecycle;
    if (!lc || !/^(?:TERMINATED|DEAD)/i.test(lc.state || '')) {
      if (r.vitalityAudit) rawVitalityMap.set(String(r.id || ''), r.vitalityAudit);
      return r;
    }
    const ev = (lc.events || []).find(x => x && /terminated/i.test(x.type || '')) || {};
    const d = ev.date ? String(ev.date).slice(0, 10).split('-').reverse().join('/') : '';
    const mergedVitality = Object.assign({}, r.vitalityAudit || {}, {
      healthStatus: 'DEAD_OR_PURGED',
      healthBadge: 'Đã bị YouTube gỡ' + (d ? ' (' + d + ')' : ''),
      monetizationStatus: 'TERMINATED',
      monetizationBadge: 'Không còn kiếm tiền (kênh bị gỡ)'
    });
    rawVitalityMap.set(String(r.id || ''), mergedVitality);
    return Object.assign({}, r, {
      vitalityAudit: mergedVitality
    });
  });
  window._rawKenhRecords = rawRecords;
  const rawByHandle = new Map();
  const rawByChannelId = new Map();
  const rawById = new Map();
  rawRecords.forEach(r => {
    if (!r || !r.id) return;
    rawById.set(String(r.id).trim().toUpperCase(), r);
    const rCh = r.channel || {};
    const rCid = rCh.channelId || rCh.id || '';
    if (rCid) rawByChannelId.set(String(rCid).trim().toLowerCase(), r);
    [rCh.handle, r.visionAnalysis && r.visionAnalysis.handle, r.ocr && r.ocr.handle, ...safeArray(r.handleHistory).map(x => typeof x === 'string' ? x : (x && x.handle) || '')].forEach(h => {
      const k = normHandleKey(h);
      if (k && !rawByHandle.has(k)) rawByHandle.set(k, r);
    });
  });
  function getChannelHandleKeys(ch, rawRec) {
    if (!ch) return [];
    const rawCh = (rawRec && rawRec.channel) || {};
    const rawList = [
      ch.handle,
      ch.handle_hien_tai,
      ch.handle_cu,
      ...safeArray(ch.aliasHandles),
      ...safeArray(ch.aliases),
      ...safeArray(ch.handle_history),
      rawCh.handle,
      rawRec && rawRec.visionAnalysis && rawRec.visionAnalysis.handle,
      rawRec && rawRec.ocr && rawRec.ocr.handle,
      ...safeArray(rawRec && rawRec.handleHistory)
    ];
    const seen = new Set();
    const out = [];
    rawList.forEach(item => {
      const s = typeof item === 'string' ? item : (item && item.handle) || '';
      const k = normHandleKey(s);
      if (k && !seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    });
    return out;
  }
  function resolveRawRecord(ch) {
    if (!ch) return null;
    const hKeys = getChannelHandleKeys(ch, null);
    for (const hKey of hKeys) {
      if (rawByHandle.has(hKey)) return rawByHandle.get(hKey);
    }
    if (ch.channelId && rawByChannelId.has(String(ch.channelId).trim().toLowerCase())) {
      return rawByChannelId.get(String(ch.channelId).trim().toLowerCase());
    }
    return null;
  }
  const MARKET_NORM_MAP = [
    { re: /^(?:us|en|usa|my|mỹ|hoa kỳ|hoa ky|us\s*\/\s*en|us\s*\/\s*global)$/i, key: 'US', label: 'US / EN' },
    { re: /^(?:vn|việt|viet|việt nam|vietnam)$/i, key: 'VN', label: 'Việt Nam' },
    { re: /^(?:jp|nhật|nhat|nhật bản|japan)$/i, key: 'JP', label: 'Nhật Bản' },
    { re: /^(?:kr|hàn|han|hàn quốc|korea)$/i, key: 'KR', label: 'Hàn Quốc' },
    { re: /^(?:cn|trung|trung quốc|china)$/i, key: 'CN', label: 'Trung Quốc' },
    { re: /^(?:uk|gb|anh|united kingdom)$/i, key: 'UK', label: 'Anh (UK)' },
    { re: /^(?:ca|canada)$/i, key: 'CA', label: 'Canada' },
    { re: /^(?:de|đức|duc|germany)$/i, key: 'DE', label: 'Đức' },
    { re: /^(?:es|tây ban nha|tay ban nha|spain)$/i, key: 'ES', label: 'Tây Ban Nha' },
    { re: /^(?:ru|nga|russia)$/i, key: 'RU', label: 'Nga' },
    { re: /^(?:ph|phil|philippines)$/i, key: 'PH', label: 'Philippines' },
    { re: /^(?:eu|châu âu|chau au|europe)$/i, key: 'EU', label: 'Châu Âu' },
    { re: /^(?:global|quốc tế|quoc te|toàn cầu|toan cau|đa quốc gia|da quoc gia)$/i, key: 'GLOBAL', label: 'Quốc tế / Global' }
  ];
  function normKenhMarket(raw) {
    const cleaned = stripDecorEmoji(String(raw || '')).replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
    if (!cleaned) return null;
    for (const entry of MARKET_NORM_MAP) {
      if (entry.re.test(cleaned)) return { key: entry.key, label: entry.label };
    }
    return { key: cleaned.toUpperCase(), label: cleaned };
  }
  function getChannelMarkets(ch, rawRec) {
    const rawList = safeArray(ch && ch.markets);
    const fallbackCountry = rawRec && rawRec.channel && rawRec.channel.country ? [rawRec.channel.country] : [];
    const out = [];
    const seen = new Set();
    [...rawList, ...fallbackCountry].forEach(m => {
      const norm = normKenhMarket(m);
      if (norm && !seen.has(norm.key)) {
        seen.add(norm.key);
        out.push(norm);
      }
    });
    return out;
  }
  const LANG_LABEL_MAP = {
    'en-us': 'en-US · Tiếng Anh (US)',
    'en-gb': 'en-GB · Tiếng Anh (UK)',
    'ja-jp': 'ja-JP · Tiếng Nhật',
    'ko-kr': 'ko-KR · Tiếng Hàn',
    'vi-vn': 'vi-VN · Tiếng Việt',
    'zh-cn': 'zh-CN · Tiếng Trung',
    'ru-ru': 'ru-RU · Tiếng Nga',
    'es-mx': 'es-MX · Tây Ban Nha (MX)',
    'es-es': 'es-ES · Tây Ban Nha (ES)',
    'pt-br': 'pt-BR · Bồ Đào Nha (BR)',
    'hi-in': 'hi-IN · Tiếng Hindi',
    'fil-ph': 'fil-PH · Tiếng Philippines',
    'cy-xx': 'cy-XX · Khác / Đa ngữ'
  };
  function getChannelLang(ch, rawRec) {
    const rawCode = String(
      (ch && ch.voiceDna && ch.voiceDna.code)
      || (ch && ch.language)
      || (rawRec && rawRec.voiceDna && rawRec.voiceDna.code)
      || (rawRec && rawRec.audioLanguageInfo && rawRec.audioLanguageInfo.code)
      || ''
    ).trim();
    return rawCode;
  }
  function getChannelLessonCount(ch, rawRec) {
    if (ch && ch.count != null && ch.count !== '' && Number.isFinite(Number(ch.count))) return Number(ch.count);
    const arrLen = (safeArray(ch && ch.videos).length || safeArray(ch && ch.skus).length || safeArray(rawRec && rawRec.relatedVideos).length);
    return arrLen > 0 ? arrLen : null;
  }
  function getChannelCaps(ch, rawRec) {
    const effVoice = (ch && ch.voiceDna) || (rawRec && rawRec.voiceDna) || null;
    const hasVoice = Boolean(effVoice && safeUrl(effVoice.sampleUrl));
    const lCount = getChannelLessonCount(ch, rawRec);
    const hasLessons = Boolean(lCount && lCount > 0);
    const isRevived = Boolean(ch && !ch.dead && (ch.deadNoteCu || ch.deadKindCu || ch.handle_cu || ch.revived || ch.revivedFrom));
    return { hasVoice, hasLessons, isRevived, effVoice };
  }
  const NICHE_ORDER = ['Triết lý / Tâm linh', 'Sức khỏe / Lão hóa', 'Kinh tế / Tài chính', 'Khoa học EN', 'Reup / Hoạt hình', 'Drama / Stories', 'Lịch sử / Quân sự', 'Everyday History EN (lịch sử đồ vật thường ngày)', 'Edit / Thumb', 'Nhân bản / Kênh', 'Share key / Ngách nhỏ', 'Kiếm tiền / Chính sách', 'Hệ thống / Quy trình', 'Nền tảng / Tool', 'Khác'];
  const nxByCode = new Map();
  const channelNxCodesMap = new Map();
  const mauBanSet = new Set();
  safeArray(nxRaw && nxRaw.ngachXanh).forEach((n, idx) => {
    const code = String(n.code || ('H' + String(n.hang || (idx + 1)).padStart(2, '0'))).trim().toUpperCase();
    const handleSet = new Set();
    safeArray(n.mauBan).forEach(item => {
      const s = String(typeof item === 'string' ? item : (item && item.handle) || '').trim();
      const k = normHandleKey(s);
      if (k) mauBanSet.add(k);
    });
    [...safeArray(n.mauSach), ...safeArray(n.mauPhu), ...safeArray(n.mauBan), ...safeArray(n.kenhMoRong2026)].forEach(item => {
      const s = String(typeof item === 'string' ? item : (item && item.handle) || '').trim();
      const k = normHandleKey(s);
      if (k) {
        handleSet.add(k);
        if (!channelNxCodesMap.has(k)) channelNxCodesMap.set(k, []);
        const arr = channelNxCodesMap.get(k);
        if (!arr.includes(code)) arr.push(code);
      }
    });
    nxByCode.set(code, { code, name: n.ngach || code, handleSet });
  });
  function getChannelNxCodes(ch, rawRec) {
    const codes = [];
    const seen = new Set();
    const pushCode = (c) => {
      const up = String(c || '').trim().toUpperCase();
      if (/^H\d{2}$/.test(up) && !seen.has(up)) {
        seen.add(up);
        codes.push(up);
      }
    };
    pushCode(ch && ch.nicheCode);
    pushCode(rawRec && rawRec.nicheCode);
    getChannelHandleKeys(ch, rawRec).forEach(k => {
      (channelNxCodesMap.get(k) || []).forEach(pushCode);
    });
    return codes;
  }
  const knTrim = String(state.kenhNiche || '').trim();
  const knCodeMatch = knTrim.match(/^(H\d{2})(?:\b|\s|—|-|$)/i);
  const qRawTrim = String(state.kenhQ || '').trim();
  const qExactNicheMatch = qRawTrim.match(/^#?(H\d{2})(?:\b|\s|—|-|$)/i);
  const qExactRawMatch = qRawTrim.match(/^#?(RAW-\d{3})$/i);
  const qExactHandleMatch = qRawTrim.match(/^@([^\s]+)$/);
  const qExactChannelIdMatch = qRawTrim.match(/^(UC[A-Za-z0-9_-]{16,})$/i);
  const exactNicheCodeQ = (qExactNicheMatch && nxByCode.has(qExactNicheMatch[1].toUpperCase())) ? qExactNicheMatch[1].toUpperCase() : '';
  const exactRawIdQ = qExactRawMatch ? qExactRawMatch[1].toUpperCase() : '';
  const exactHandleQ = qExactHandleMatch ? normHandleKey(qExactHandleMatch[1]) : '';
  const exactChannelIdQ = qExactChannelIdMatch ? qExactChannelIdMatch[1].toLowerCase() : '';
  const hasExactEntityQ = Boolean(exactNicheCodeQ || exactRawIdQ || exactHandleQ || exactChannelIdQ);
  const activeNxCode = exactNicheCodeQ || (knCodeMatch ? knCodeMatch[1].toUpperCase() : '');
  const activeNxMeta = activeNxCode ? nxByCode.get(activeNxCode) : null;
  function initial(handle) {
    const t = String(handle || '').replace(/^@/, '').trim();
    return (t[0] || '?').toUpperCase();
  }
  function avatarHtml(ch) {
    const safeAv = safeUrl(ch && ch.avatar);
    if (safeAv) {
      return `<img src="${esc(safeAv)}" alt="${esc(ch.handle || ch.title || ch.name || 'Kênh')}" width="44" height="44" class="w-11 h-11 rounded-xl object-cover shrink-0 bg-ink-700" loading="lazy" decoding="async" data-img-fallback="hide-flex"><div class="w-11 h-11 rounded-xl bg-brand-600/25 text-brand-200 font-bold text-sm items-center justify-center shrink-0 hidden">${esc(initial(ch.handle))}</div>`;
    }
    return `<div class="w-11 h-11 rounded-xl bg-brand-600/25 text-brand-200 font-bold text-sm flex items-center justify-center shrink-0">${esc(initial(ch.handle))}</div>`;
  }
  const kenhLive = kenh.filter(ch => ch && !ch.dead);
  const kenhDead = kenh.filter(ch => ch && ch.dead);
  const kenhWithRaw = kenh.filter(ch => Boolean(resolveRawRecord(ch)));
  const kenhMauBan = kenh.filter(ch => getChannelHandleKeys(ch, null).some(k => mauBanSet.has(k)));
  const statusFilter = state.kenhStatus || '';
  const baseForNiche = statusFilter === 'live' ? kenhLive : (statusFilter === 'dead' ? kenhDead : (statusFilter === 'raw' ? kenhWithRaw : (statusFilter === 'mauban' ? kenhMauBan : kenh)));
  const nicheCounts = baseForNiche.reduce((a, x) => { const n = (x && x.niche) || 'Khác'; a[n] = (a[n] || 0) + 1; return a; }, {});
  const nxCounts = new Map();
  const langCounts = new Map();
  const marketCounts = new Map();
  const capCounts = { voice: 0, lessons: 0, revived: 0 };
  baseForNiche.forEach(ch => {
    if (!ch) return;
    const rawRec = resolveRawRecord(ch);
    getChannelNxCodes(ch, rawRec).forEach(code => nxCounts.set(code, (nxCounts.get(code) || 0) + 1));
    const langCode = getChannelLang(ch, rawRec);
    if (langCode) langCounts.set(langCode, (langCounts.get(langCode) || 0) + 1);
    getChannelMarkets(ch, rawRec).forEach(m => {
      const prev = marketCounts.get(m.key) || { key: m.key, label: m.label, count: 0 };
      prev.count += 1;
      marketCounts.set(m.key, prev);
    });
    const caps = getChannelCaps(ch, rawRec);
    if (caps.hasVoice) capCounts.voice += 1;
    if (caps.hasLessons) capCounts.lessons += 1;
    if (caps.isRevived) capCounts.revived += 1;
  });
  const allKenhNiches = [...NICHE_ORDER.filter(n => nicheCounts[n]), ...Object.keys(nicheCounts).filter(n => !NICHE_ORDER.includes(n))];
  const nicheRank = new Map(allKenhNiches.map((n, idx) => [n, idx]));
  const q = qRawTrim.toLowerCase();
  const normHandleTarget = normHandleKey(state.kenhHandle);
  const hasExactOverride = Boolean(normHandleTarget || hasExactEntityQ);
  if (state.kenhHandle && state.kenhPage !== 1) state.kenhPage = 1;
  const activeSort = String(state.kenhSort || '').toLowerCase();
  const activeLang = String(state.kenhLang || '').trim().toLowerCase();
  const activeMarket = String(state.kenhMarket || '').trim().toUpperCase();
  const activeCap = String(state.kenhCap || '').trim().toLowerCase();
  const list = kenh.filter(ch => {
    if (!ch) return false;
    const rawRec = resolveRawRecord(ch);
    const chHandleLower = normHandleKey(ch.handle);
    const chHandleKeys = getChannelHandleKeys(ch, rawRec);
    const rawId = rawRec ? String(rawRec.id || '').toUpperCase() : '';
    if (normHandleTarget) {
      return chHandleKeys.includes(normHandleTarget);
    }
    if (exactNicheCodeQ && activeNxMeta) {
      return activeNxMeta.handleSet.has(chHandleLower) || chHandleKeys.some(k => activeNxMeta.handleSet.has(k)) || getChannelNxCodes(ch, rawRec).includes(activeNxMeta.code);
    }
    if (exactRawIdQ) {
      if (rawId === exactRawIdQ) return true;
      const targetRaw = rawById.get(exactRawIdQ);
      if (targetRaw) {
        const targetRCh = targetRaw.channel || {};
        const targetHandles = [targetRCh.handle, targetRaw.visionAnalysis && targetRaw.visionAnalysis.handle, targetRaw.ocr && targetRaw.ocr.handle, ...safeArray(targetRaw.handleHistory).map(x => typeof x === 'string' ? x : (x && x.handle) || '')]
          .map(normHandleKey).filter(Boolean);
        if (targetHandles.some(th => chHandleKeys.includes(th))) return true;
        const targetCid = String(targetRCh.channelId || targetRCh.id || '').trim().toLowerCase();
        const chCid = String(ch.channelId || (rawRec && rawRec.channel && (rawRec.channel.channelId || rawRec.channel.id)) || '').trim().toLowerCase();
        if (targetCid && chCid && targetCid === chCid) return true;
      }
      return false;
    }
    if (exactHandleQ) {
      return chHandleKeys.some(k => k === exactHandleQ || k.includes(exactHandleQ));
    }
    if (exactChannelIdQ) {
      const cid = String(ch.channelId || (rawRec && rawRec.channel && (rawRec.channel.channelId || rawRec.channel.id)) || '').trim().toLowerCase();
      return cid === exactChannelIdQ;
    }
    const chNxCodes = getChannelNxCodes(ch, rawRec);
    const chLang = getChannelLang(ch, rawRec);
    const chMarkets = getChannelMarkets(ch, rawRec);
    const chCaps = getChannelCaps(ch, rawRec);
    if (!hasExactEntityQ) {
      if (statusFilter === 'live' && ch.dead) return false;
      if (statusFilter === 'dead' && !ch.dead) return false;
      if (statusFilter === 'raw' && !rawRec) return false;
      if (statusFilter === 'mauban' && !chHandleKeys.some(k => mauBanSet.has(k))) return false;
      if (activeNxMeta) {
        if (!chNxCodes.includes(activeNxMeta.code) && !chHandleKeys.some(k => activeNxMeta.handleSet.has(k))) return false;
      } else if (state.kenhNiche && (ch.niche || 'Khác') !== state.kenhNiche) {
        return false;
      }
      if (activeLang && chLang.toLowerCase() !== activeLang) return false;
      if (activeMarket && !chMarkets.some(m => m.key === activeMarket)) return false;
      if (activeCap === 'voice' && !chCaps.hasVoice) return false;
      if (activeCap === 'lessons' && !chCaps.hasLessons) return false;
      if (activeCap === 'revived' && !chCaps.isRevived) return false;
    }
    if (!q) return true;
    const rawTitle = (rawRec && rawRec.channel && rawRec.channel.title) || '';
    const isMauBan = chHandleKeys.some(k => mauBanSet.has(k));
    const topVidTitles = safeArray(rawRec && rawRec.topVideos).map(v => typeof v === 'string' ? v : (v && v.title) || '').filter(Boolean);
    const hay = [
      ch.handle || '',
      chHandleLower,
      chHandleKeys.join(' '),
      ch.handle_hien_tai || '',
      ch.handle_cu || '',
      safeArray(ch.aliasHandles).join(' '),
      safeArray(ch.aliases).join(' '),
      ch.title || '',
      ch.name || '',
      rawTitle,
      rawId,
      ch.channelId || '',
      ch.niche,
      ch.rawNiche || '',
      ch.nicheCode || '',
      chNxCodes.join(' '),
      (ch.niches || []).join(' '),
      (ch.markets || []).join(' '),
      chMarkets.map(m => m.label).join(' '),
      chLang,
      (ch.voiceDna && ch.voiceDna.code) || '',
      ch.url,
      ch.ngay_do || '',
      ch.nguon_do || '',
      topVidTitles.join(' '),
      isMauBan ? 'mẫu bẩn mau ban reup bẩn không copy' : 'mẫu sạch mau sach',
      ch.dead ? (ch.deadKind === 'empty' ? 'die rỗng trống empty 0 video' : 'die chết 404 gỡ') : 'sống live',
      ch.deadNote || '',
      ch.deadNoteCu || ''
    ].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  }).slice().sort((a, b) => {
    const rawA = resolveRawRecord(a);
    const rawB = resolveRawRecord(b);
    const rChA = (rawA && rawA.channel) || {};
    const rChB = (rawB && rawB.channel) || {};
    if (activeSort === 'subs') {
      const sDiff = pickPositiveNum(b.subscribers, b.subs_live, rChB.subscribers, rChB.subscriberCount)
        - pickPositiveNum(a.subscribers, a.subs_live, rChA.subscribers, rChA.subscriberCount);
      if (sDiff !== 0) return sDiff;
    } else if (activeSort === 'views') {
      const vDiff = pickPositiveNum(b.views, b.totalViews, b.views_live, rChB.views, rChB.totalViews, rChB.viewCount)
        - pickPositiveNum(a.views, a.totalViews, a.views_live, rChA.views, rChA.totalViews, rChA.viewCount);
      if (vDiff !== 0) return vDiff;
    } else if (activeSort === 'videos') {
      const vcDiff = pickPositiveNum(b.videoCount, b.videos_live, rChB.videoCount, rChB.videos)
        - pickPositiveNum(a.videoCount, a.videos_live, rChA.videoCount, rChA.videos);
      if (vcDiff !== 0) return vcDiff;
    } else if (activeSort === 'lessons') {
      const lDiff = (getChannelLessonCount(b, rawB) || 0) - (getChannelLessonCount(a, rawA) || 0);
      if (lDiff !== 0) return lDiff;
    } else if (activeSort === 'az') {
      const nameA = String(a.handle || a.title || '').replace(/^@/, '');
      const nameB = String(b.handle || b.title || '').replace(/^@/, '');
      return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
    }
    const rA = nicheRank.has(a.niche || 'Khác') ? nicheRank.get(a.niche || 'Khác') : 999;
    const rB = nicheRank.has(b.niche || 'Khác') ? nicheRank.get(b.niche || 'Khác') : 999;
    if (rA !== rB) return rA - rB;
    if (!statusFilter) {
      if (Boolean(a.dead) !== Boolean(b.dead)) return a.dead ? 1 : -1;
    }
    return (getChannelLessonCount(b, rawB) || 0) - (getChannelLessonCount(a, rawA) || 0);
  });
  if (!list.length && (normHandleTarget || hasExactEntityQ || q)) {
    const kenhHandleSet = new Set();
    kenh.forEach(ch => getChannelHandleKeys(ch, null).forEach(k => kenhHandleSet.add(k)));
    rawRecords.forEach(r => {
      if (!r || !r.id) return;
      const rCh = r.channel || {};
      const rHandle = String(rCh.handle || (r.visionAnalysis && r.visionAnalysis.handle) || (r.ocr && r.ocr.handle) || '').trim();
      const rHandleLower = normHandleKey(rHandle);
      const rAllKeys = [rHandle, r.visionAnalysis && r.visionAnalysis.handle, r.ocr && r.ocr.handle, ...safeArray(r.handleHistory).map(x => typeof x === 'string' ? x : (x && x.handle) || '')].map(normHandleKey).filter(Boolean);
      if (!rHandleLower || rAllKeys.some(k => kenhHandleSet.has(k))) return;
      const rIdUp = String(r.id).trim().toUpperCase();
      const rCid = String(rCh.channelId || rCh.id || '').trim().toLowerCase();
      const rawVita = rawVitalityMap.get(rIdUp) || r.vitalityAudit || {};
      const isDeadRaw = Boolean((r.channelLifecycle && /^(?:TERMINATED|DEAD)/i.test(r.channelLifecycle.state || '')) || (rawVita && rawVita.healthStatus === 'DEAD_OR_PURGED'));
      const rawNicheCode = String(r.nicheCode || '').trim().toUpperCase();
      const nxFromMap = rawNicheCode ? nxByCode.get(rawNicheCode) : null;
      const synthNiche = rawNicheCode === 'H10' ? 'Everyday History EN (lịch sử đồ vật thường ngày)'
        : (rawNicheCode === 'H07' ? 'Sức khỏe / Lão hóa'
        : (rawNicheCode === 'H14' ? 'Reup / Hoạt hình'
        : (rawNicheCode === 'H01' ? 'Triết lý / Tâm linh'
        : (r.nicheName || (nxFromMap && nxFromMap.name) || r.groupName || 'Lịch sử / Quân sự'))));
      if (!hasExactOverride) {
        if (statusFilter === 'live' && isDeadRaw) return;
        if (statusFilter === 'dead' && !isDeadRaw) return;
        if (statusFilter === 'mauban' && !rAllKeys.some(k => mauBanSet.has(k))) return;
        if (activeNxMeta) {
          if (!rAllKeys.some(k => activeNxMeta.handleSet.has(k)) && rawNicheCode !== activeNxMeta.code) return;
        } else if (state.kenhNiche && synthNiche !== state.kenhNiche && rawNicheCode !== knTrim.toUpperCase()) {
          return;
        }
      }
      let matched = false;
      if (normHandleTarget && rAllKeys.includes(normHandleTarget)) matched = true;
      else if (exactRawIdQ && rIdUp === exactRawIdQ) matched = true;
      else if (exactHandleQ && rAllKeys.some(k => k === exactHandleQ || k.includes(exactHandleQ))) matched = true;
      else if (exactChannelIdQ && rCid === exactChannelIdQ) matched = true;
      else if (!hasExactEntityQ && q) {
        const hayRaw = [rIdUp, rHandle, rHandleLower, rCh.title || '', rCid, rawNicheCode, r.nicheName || '', synthNiche].join(' ').toLowerCase();
        if (SC.matchesQuery([hayRaw], q)) matched = true;
      }
      if (matched) {
        const normSubNum = pickPositiveNum(rCh.subscribers, rCh.subscriberCount);
        const normViewNum = pickPositiveNum(rCh.views, rCh.viewCount);
        const normVidNum = pickPositiveNum(rCh.videoCount, rCh.videos);
        const rawSkus = safeArray(r.relatedVideos).map(x => typeof x === 'string' ? x : (x && x.sku)).filter(Boolean);
        const handleNorm = rHandle.startsWith('@') ? rHandle : ('@' + rHandle);
        const safeRawAvatar = safeUrl((r.assets && r.assets.avatarUrl) || rCh.avatar || '');
        const safeRawUrl = safeExternalUrl(rCh.channelUrl || ('https://www.youtube.com/' + handleNorm));
        list.push({
          handle: handleNorm,
          title: rCh.title || r.folderName || handleNorm,
          name: rCh.title || r.folderName || handleNorm,
          channelId: rCh.channelId || rCh.id || '',
          avatar: safeRawAvatar,
          niche: synthNiche,
          nicheCode: rawNicheCode,
          niches: [synthNiche],
          markets: [rCh.country || 'US'],
          url: safeRawUrl,
          subscribers: normSubNum,
          views: normViewNum,
          videoCount: normVidNum,
          subs_live: normSubNum || (r.ocr && r.ocr.subscriberText) || 0,
          videos_live: normVidNum || (r.ocr && r.ocr.videoCountText) || 0,
          views_live: normViewNum || 0,
          dead: isDeadRaw,
          deadNote: isDeadRaw ? (rawVita.healthBadge || 'Kênh đã bị YouTube gỡ') : '',
          count: rawSkus.length > 0 ? rawSkus.length : null,
          skus: rawSkus,
          voiceDna: r.voiceDna || null
        });
      }
    });
  }
  const chips = allKenhNiches.map(n => [n, n, nicheCounts[n]]);
  const PAGE_SIZE = [24, 48, 96].includes(Number(state.kenhPageSize)) ? Number(state.kenhPageSize) : 24;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, state.kenhPage || 1), totalPages);
  state.kenhPage = page;
  const pagedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function buildPageTokens(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const keep = new Set([1, total, cur - 1, cur, cur + 1]);
    if (cur <= 3) { keep.add(2); keep.add(3); keep.add(4); }
    if (cur >= total - 2) { keep.add(total - 1); keep.add(total - 2); keep.add(total - 3); }
    const sorted = [...keep].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
    const tokens = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) tokens.push('...');
      tokens.push(sorted[i]);
    }
    return tokens;
  }
  const pageTokens = buildPageTokens(page, totalPages);
  const kenhPager = (pos) => (totalPages <= 1 && list.length <= 24) ? '' : `
    <nav aria-label="Phân trang kênh mẫu${pos === 'bottom' ? ' (cuối danh sách)' : ''}" class="km-pager ${pos === 'bottom' ? 'mt-6' : 'mb-3'}">
      <span>Trang ${page}/${totalPages} · ${list.length} kênh đối thủ</span>
      ${totalPages > 1 ? `
        <div class="km-pager-pages">
          <button type="button" class="km-pager-btn" data-action="kenh-page" data-pos="${pos}" data-page="${page - 1}" ${page <= 1 ? 'disabled aria-disabled="true"' : ''}>← Trước</button>
          ${pageTokens.map(tok => tok === '...'
            ? '<span class="px-1 text-gray-500 select-none" aria-hidden="true">…</span>'
            : `<button type="button" class="km-pager-btn ${tok === page ? 'active' : ''}" data-action="kenh-page" data-pos="${pos}" data-page="${tok}"${tok === page ? ' aria-current="page"' : ''}>${tok}</button>`
          ).join('')}
          <button type="button" class="km-pager-btn" data-action="kenh-page" data-pos="${pos}" data-page="${page + 1}" ${page >= totalPages ? 'disabled aria-disabled="true"' : ''}>Sau →</button>
        </div>` : ''}
      <div class="flex flex-wrap items-center gap-2">
        ${totalPages > 1 ? `
          <div class="km-page-jump">
            <label class="sr-only" for="km-jump-${pos}">Đi tới trang</label>
            <input id="km-jump-${pos}" type="number" class="js-km-page-jump" min="1" max="${totalPages}" value="${page}" inputmode="numeric" aria-label="Đi tới trang">
            <button type="button" class="km-pager-btn js-km-page-jump-btn" data-pos="${pos}">Đi</button>
          </div>` : ''}
        <label class="sr-only" for="km-size-${pos}">Số kênh mỗi trang</label>
        <select id="km-size-${pos}" class="km-page-size js-km-page-size" aria-label="Số kênh mỗi trang">
          ${[24, 48, 96].map(sz => `<option value="${sz}" ${PAGE_SIZE === sz ? 'selected' : ''}>${sz} / trang</option>`).join('')}
        </select>
      </div>
    </nav>`;
  const SORT_LABELS = {
    subs: 'Subscribers ↓',
    views: 'Lượt xem ↓',
    videos: 'Số video ↓',
    lessons: 'Số bài học ↓',
    az: 'A–Z'
  };
  const grouped = [];
  if (activeSort && SORT_LABELS[activeSort]) {
    if (pagedList.length) grouped.push({ niche: `Sắp xếp theo ${SORT_LABELS[activeSort]}`, items: pagedList, total: list.length, isSortedView: true });
  } else {
    const totalByNicheGroup = list.reduce((acc, x) => {
      const n = x.niche || 'Khác';
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {});
    const renderGroupOrder = [...allKenhNiches, ...Object.keys(totalByNicheGroup).filter(n => !allKenhNiches.includes(n))];
    renderGroupOrder.forEach(n => {
      const items = pagedList.filter(x => (x.niche || 'Khác') === n);
      if (items.length) grouped.push({ niche: n, items, total: totalByNicheGroup[n] || items.length });
    });
  }
  function videoNicheKey(niche) {
    return nicheKeyFor(niche) || NICHE_MAP[niche] || (Object.values(NICHE_MAP).includes(niche) ? niche : (niche && niche !== 'Khác' ? niche : ''));
  }
  function fmtCompactCount(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0) return '';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num);
  }
  const hasBypassedFilters = hasExactOverride && Boolean(statusFilter || state.kenhNiche || activeLang || activeMarket || activeCap);
  const kpiActive = hasExactOverride ? '' : (statusFilter === 'live' ? 'live' : (statusFilter === 'dead' ? 'dead' : (statusFilter === 'raw' ? 'raw' : (!statusFilter && !state.kenhNiche && !activeLang && !activeMarket && !activeCap && !q ? 'all' : ''))));
  const isStatusActive = (val) => !hasExactOverride && statusFilter === val;
  const isCapActive = (val) => !hasExactOverride && activeCap === val;
  const showActiveNx = Boolean(activeNxMeta && (!hasExactOverride || exactNicheCodeQ));
  const isNicheDrawerOpen = Boolean(state.kenhNiche && !hasExactOverride && !activeNxMeta);
  const activeNicheBadgeHtml = showActiveNx
    ? `<span class="badge badge-blue text-xs">${esc(activeNxMeta.code)} · ${esc(activeNxMeta.name)}</span>`
    : (state.kenhNiche && !hasExactOverride
      ? `<span class="badge badge-blue text-xs">${esc(state.kenhNiche)}</span>`
      : (hasBypassedFilters && state.kenhNiche ? `<span class="badge badge-amber text-xs">Tạm bỏ qua: ${esc(state.kenhNiche)}</span>` : ''));
  const sortedNxList = [...nxByCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  const sortedLangList = [...langCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const sortedMarketList = [...marketCounts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'vi'));
  return `
  ${pageBanner('Kênh mẫu / Đối thủ', `${list.length}/${kenh.length} kênh · trực quan hoá kênh sống, hồ sơ Raw (${kenhWithRaw.length}) & case study DIE`, [
    { icon: ICONS.channel, label: 'Tổng kênh mẫu', value: kenh.length, sub: `${kenhLive.length} sống · ${kenhDead.length} case study DIE`, extraAttrs: `data-kenh-kpi="all" data-kenh-kpi-active="${kpiActive === 'all' ? '1' : '0'}" aria-pressed="${kpiActive === 'all' ? 'true' : 'false'}" role="button" tabindex="0"` },
    { icon: ICONS.channel, label: 'Kênh đang sống', value: kenhLive.length + ' live', sub: 'Bấm để lọc kênh có video công khai', extraAttrs: `data-kenh-kpi="live" data-kenh-kpi-active="${kpiActive === 'live' ? '1' : '0'}" aria-pressed="${kpiActive === 'live' ? 'true' : 'false'}" role="button" tabindex="0"` },
    { icon: ICONS.doc, label: 'Case study DIE', value: kenhDead.length + ' kênh', sub: 'Bấm để lọc 404 / bản quyền / gỡ', extraAttrs: `data-kenh-kpi="dead" data-kenh-kpi-active="${kpiActive === 'dead' ? '1' : '0'}" aria-pressed="${kpiActive === 'dead' ? 'true' : 'false'}" role="button" tabindex="0"` },
    { icon: ICONS.link, label: 'Hồ sơ Raw', value: kenhWithRaw.length + ' kênh', sub: `Bấm để lọc · Đang hiển thị ${list.length}/${kenh.length}`, extraAttrs: `data-kenh-kpi="raw" data-kenh-kpi-active="${kpiActive === 'raw' ? '1' : '0'}" aria-pressed="${kpiActive === 'raw' ? 'true' : 'false'}" role="button" tabindex="0"` }
  ])}
  ${state.kenhHandle ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex flex-wrap items-center gap-1.5">${ico('target', 14)} Đang định danh handle khớp tuyệt đối <b class="text-brand-300 font-mono">${esc(state.kenhHandle)}</b> (${list.length} kênh).${hasBypassedFilters ? ` <span class="badge badge-amber text-xs">Tạm bỏ qua bộ lọc phụ</span>` : ''}</span>
    <div class="flex items-center gap-1.5">
      ${hasBypassedFilters ? `<button type="button" id="freset-kenh-bypass" class="filter-btn text-xs">Quay lại bộ lọc</button>` : ''}
      <button type="button" data-kenh-kpi="all" class="filter-btn text-xs">Xem cả ${kenh.length} kênh</button>
    </div>
  </div>` : (hasExactEntityQ && !exactNicheCodeQ ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex flex-wrap items-center gap-1.5">${ico('target', 14)} Đang tra cứu chính xác <b class="text-brand-300 font-mono">${esc(qRawTrim)}</b> (${list.length} kết quả).${hasBypassedFilters ? ` <span class="badge badge-amber text-xs">Tạm bỏ qua bộ lọc phụ</span>` : ''}</span>
    <div class="flex items-center gap-1.5">
      <button type="button" id="freset-kenh-bypass" class="filter-btn text-xs">${hasBypassedFilters ? 'Quay lại bộ lọc' : 'Xóa tra cứu'}</button>
    </div>
  </div>` : '')}
  ${showActiveNx ? `<div class="card p-3.5 mb-6 border-brand-500/40 bg-brand-950/20 flex flex-wrap items-center justify-between gap-2" role="status">
    <span class="text-xs text-gray-200 inline-flex items-center gap-1.5">${ico('target', 14)} Đang lọc theo ngách chuẩn <b class="text-brand-300 font-mono">${esc(activeNxMeta.code)}</b> — <b class="text-white">${esc(activeNxMeta.name)}</b> (${list.length} kênh đối thủ).</span>
    <div class="flex items-center gap-1.5">
      <button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(activeNxMeta.code)}" class="filter-btn text-xs">Ngách xanh (${esc(activeNxMeta.code)}) ↗</button>
      <button type="button" data-kenh-niche="" class="filter-btn text-xs">Xóa lọc ngách</button>
    </div>
  </div>` : ''}
  <div class="card p-4 sm:p-5 mb-6 overflow-visible search-filter-card" style="position:relative; contain:none !important;">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm kênh</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="kenh-search-wrap">
    <input id="fq" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="kenh-search-suggestions" aria-haspopup="listbox" autocomplete="off" spellcheck="false" value="${esc(state.kenhQ)}" placeholder="Tìm theo @handle, alias, tên kênh, mã H01–H40, RAW-001, ngách, ngôn ngữ, die..." class="search-input-premium w-full min-w-0 pr-9" aria-label="Tìm kênh">
    ${(state.kenhQ || state.kenhHandle) ? `<button type="button" id="btn-clear-kenh-q" aria-label="Xóa tìm kiếm" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition" style="z-index:var(--h2-z-base)" title="Xóa tìm kiếm">${ico('x', 14)}</button>` : ''}
    <div id="kenh-search-suggestions" role="listbox" aria-label="Gợi ý kênh mẫu" class="hidden absolute left-0 right-0 top-full mt-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-border" style="z-index:var(--h2-z-dropdown, 40);"></div>
  </div>
  <button type="button" id="freset-kenh" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline km-filter-scroll" role="group" aria-label="Lọc tình trạng kênh">
  <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">Tình trạng:</span>
  <button type="button" data-kenh-status="" class="filter-btn ${isStatusActive('') ? 'active' : ''}" aria-pressed="${isStatusActive('') ? 'true' : 'false'}">Tất cả · ${kenh.length}</button>
  <button type="button" data-kenh-status="live" class="filter-btn ${isStatusActive('live') ? 'active' : ''}" aria-pressed="${isStatusActive('live') ? 'true' : 'false'}">
    <span class="inline-flex items-center gap-1.5"><span class="kenh-dot-live h2-ico-pulse-dot"></span>Đang sống · ${kenhLive.length}</span>
  </button>
  <button type="button" data-kenh-status="dead" class="filter-btn ${isStatusActive('dead') ? 'active' : ''}" aria-pressed="${isStatusActive('dead') ? 'true' : 'false'}">
    <span class="inline-flex items-center gap-1.5"><span class="kenh-dot-dead"></span>Đã dừng / DIE · ${kenhDead.length}</span>
  </button>
  <button type="button" data-kenh-status="raw" class="filter-btn ${isStatusActive('raw') ? 'active' : ''}" aria-pressed="${isStatusActive('raw') ? 'true' : 'false'}">
    <span class="inline-flex items-center gap-1.5">${ico('bar-chart-3', 14)}Có Hồ sơ Raw · ${kenhWithRaw.length}</span>
  </button>
  <button type="button" data-kenh-status="mauban" class="filter-btn ${isStatusActive('mauban') ? 'active' : ''}" aria-pressed="${isStatusActive('mauban') ? 'true' : 'false'}">
    <span class="inline-flex items-center gap-1.5">${ico('alert-triangle', 14)}Mẫu bẩn · ${kenhMauBan.length}</span>
  </button>
</div>
<div class="km-controls-row">
  <label class="sr-only" for="kenh-nx-select">Ngách chuẩn H01–H40</label>
  <select id="kenh-nx-select" class="km-select" aria-label="Lọc theo ngách chuẩn H01 đến H40">
    <option value="">Ngách chuẩn (H01–H40)</option>
    ${sortedNxList.map(nx => `<option value="${esc(nx.code)}" ${activeNxCode === nx.code ? 'selected' : ''}>${esc(nx.code)} — ${esc(nx.name)} (${nxCounts.get(nx.code) || 0})</option>`).join('')}
  </select>
  <label class="sr-only" for="kenh-sort">Sắp xếp</label>
  <select id="kenh-sort" class="km-select" aria-label="Sắp xếp kênh mẫu">
    <option value="" ${!activeSort ? 'selected' : ''}>Sắp xếp: Mặc định</option>
    <option value="subs" ${activeSort === 'subs' ? 'selected' : ''}>Subscribers ↓</option>
    <option value="views" ${activeSort === 'views' ? 'selected' : ''}>Lượt xem ↓</option>
    <option value="videos" ${activeSort === 'videos' ? 'selected' : ''}>Số video ↓</option>
    <option value="lessons" ${activeSort === 'lessons' ? 'selected' : ''}>Số bài học ↓</option>
    <option value="az" ${activeSort === 'az' ? 'selected' : ''}>A–Z</option>
  </select>
  <label class="sr-only" for="kenh-lang">Ngôn ngữ</label>
  <select id="kenh-lang" class="km-select" aria-label="Lọc theo ngôn ngữ">
    <option value="">Ngôn ngữ (${sortedLangList.length})</option>
    ${sortedLangList.map(([code, cnt]) => {
      const label = LANG_LABEL_MAP[code.toLowerCase()] || code;
      return `<option value="${esc(code)}" ${activeLang === code.toLowerCase() ? 'selected' : ''}>${esc(label)} (${cnt})</option>`;
    }).join('')}
  </select>
  <label class="sr-only" for="kenh-market">Thị trường</label>
  <select id="kenh-market" class="km-select" aria-label="Lọc theo thị trường">
    <option value="">Mọi thị trường</option>
    ${sortedMarketList.map(m => `<option value="${esc(m.key)}" ${activeMarket === m.key ? 'selected' : ''}>${esc(m.label)} (${m.count})</option>`).join('')}
  </select>
  <div class="km-filter-scroll" role="group" aria-label="Lọc nhanh dữ liệu kênh">
    <button type="button" data-kenh-cap="voice" class="filter-btn ${isCapActive('voice') ? 'active' : ''}" aria-pressed="${isCapActive('voice') ? 'true' : 'false'}">Có phôi giọng · ${capCounts.voice}</button>
    <button type="button" data-kenh-cap="lessons" class="filter-btn ${isCapActive('lessons') ? 'active' : ''}" aria-pressed="${isCapActive('lessons') ? 'true' : 'false'}">Có bài học · ${capCounts.lessons}</button>
    <button type="button" data-kenh-cap="revived" class="filter-btn ${isCapActive('revived') ? 'active' : ''}" aria-pressed="${isCapActive('revived') ? 'true' : 'false'}">Hồi sinh · ${capCounts.revived}</button>
  </div>
</div>
<details class="km-niche-drawer mt-3.5 pt-3 border-t border-hairline"${isNicheDrawerOpen ? ' open' : ''}>
  <summary class="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none text-xs font-semibold text-gray-300 hover:text-white">
    <span class="inline-flex flex-wrap items-center gap-2">
      <span class="uppercase tracking-wider text-gray-400">Lọc theo ngách (${allKenhNiches.length} ngách)</span>
      ${activeNicheBadgeHtml}
    </span>
    <span class="inline-flex items-center gap-1 text-gray-400">${ico('chevron-down', 14)}</span>
  </summary>
  <div class="flex flex-wrap gap-2 mt-3">
    <button type="button" data-kenh-niche="" class="filter-btn ${(!state.kenhNiche && !showActiveNx && !hasExactOverride) ? 'active' : ''}" aria-pressed="${(!state.kenhNiche && !showActiveNx && !hasExactOverride) ? 'true' : 'false'}">Mọi ngách · ${baseForNiche.length}</button>
    ${showActiveNx ? `<button type="button" data-kenh-niche="${esc(activeNxMeta.code)}" class="filter-btn active" aria-pressed="true">${esc(activeNxMeta.code)} · ${esc(activeNxMeta.name)} (${list.length})</button>` : ''}
    ${chips.map(([id, label, n]) => {
      const isNicheChipActive = !hasExactOverride && !showActiveNx && state.kenhNiche === id;
      return `<button type="button" data-kenh-niche="${esc(id)}" class="filter-btn ${isNicheChipActive ? 'active' : ''}" aria-pressed="${isNicheChipActive ? 'true' : 'false'}">${esc(label)} · ${n}</button>`;
    }).join('')}
  </div>
</details>
  </div>
  ${kenhPager('top')}
  <div id="kenh-grid" class="space-y-6">
${grouped.map(g => {
    const vKey = g.isSortedView ? '' : videoNicheKey(g.niche);
    const countLabel = g.items.length === g.total ? `${g.total} kênh` : `${g.items.length}/${g.total} kênh`;
    return `
  <section class="min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h3 class="text-base font-bold text-white">${esc(g.niche)}</h3>
      <span class="badge badge-muted">${countLabel}</span>
      ${vKey ? `<button type="button" data-open-niche="${esc(vKey)}" class="text-xs text-brand-400 hover:text-brand-300 font-medium">Xem video ngách →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
      ${g.items.map(ch => {
        const cleanH = normHandleKey(ch.handle);
        const rawRec = resolveRawRecord(ch);
        const rawId = rawRec ? String(rawRec.id || '') : '';
        const rawCh = (rawRec && rawRec.channel) || {};
        const displayTitle = String(ch.title || rawCh.title || ch.name || '').trim();
        const showDistinctTitle = Boolean(displayTitle && normHandleKey(displayTitle) !== cleanH);
        const subsVal = pickPositiveNum(ch.subscribers, ch.subs_live, rawCh.subscribers, rawCh.subscriberCount);
        const viewsVal = pickPositiveNum(ch.views, ch.totalViews, ch.views_live, rawCh.views, rawCh.totalViews, rawCh.viewCount);
        const vidVal = pickPositiveNum(ch.videoCount, ch.videos_live, rawCh.videoCount, rawCh.videos);
        const isRefOnlySubs = !subsVal && !viewsVal && (typeof ch.subscribers === 'string' && /tham\s*khảo/i.test(ch.subscribers));
        const subsStr = subsVal ? fmtCompactCount(subsVal) : (isRefOnlySubs ? 'Tham khảo' : '');
        const vidStr = vidVal ? fmtCompactCount(vidVal) : '';
        const lessonCount = getChannelLessonCount(ch, rawRec);
        const lessonMetaSuffix = lessonCount !== null ? ` · ${lessonCount} bài học` : '';
        const lessonBtnSuffix = lessonCount !== null ? ` (${lessonCount})` : '';
        const handleLabel = String(ch.handle || displayTitle || '').trim();
        const fallbackYtUrl = cleanH ? ('https://www.youtube.com/@' + cleanH) : '';
        const safeChannelUrl = safeExternalUrl(ch.url) || safeExternalUrl(fallbackYtUrl);
        const primaryNxCode = ch.nicheCode || (getChannelNxCodes(ch, rawRec)[0] || '');
        const isMauBan = getChannelHandleKeys(ch, rawRec).some(k => mauBanSet.has(k));
        const caps = getChannelCaps(ch, rawRec);
        const effVoice = caps.effVoice;
        const safeVoiceUrl = effVoice && effVoice.sampleUrl ? safeUrl(effVoice.sampleUrl) : '';
        const chMarkets = getChannelMarkets(ch, rawRec);
        const dossierBtnHtml = rawId
          ? `<button type="button" class="btn-open-raw-deep filter-btn text-xs" data-raw-id="${esc(rawId)}" title="Mở Hồ sơ Raw chuyên sâu ${esc(rawId)}">Hồ sơ Raw (${esc(rawId)}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>`
          : `<button type="button" class="btn-open-km-dossier filter-btn text-xs" data-km-handle="${esc(handleLabel)}" title="Mở hồ sơ kênh ${esc(handleLabel)}">Hồ sơ kênh <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>`;
        const voiceHtml = effVoice ? `
          <div class="text-xs text-sky-400 font-medium flex flex-wrap items-center gap-1.5 mt-1" title="Phôi giọng 45s đo tự động">
            <span class="truncate">${esc(effVoice.flag || '')} ${esc(effVoice.code || '')}${effVoice.wpm ? ` · ${effVoice.wpm}${effVoice.wpmNote ? ' cpm' : ' WPM'}` : ''}</span>
            ${safeVoiceUrl ? `<button type="button" class="km-voice-play-btn" data-voice-url="${esc(safeVoiceUrl)}" data-voice-handle="${esc(handleLabel)}" aria-pressed="false" title="Nghe thử phôi giọng 45s">${ico('play', 14)}<span>Nghe phôi giọng</span></button>` : ''}
          </div>` : '';
        return ch.dead ? `
        <div class="card p-3 flex flex-col gap-2 min-w-0 overflow-hidden kenh-card-dead">
          <div class="flex items-start gap-3 min-w-0">
            <div class="relative shrink-0">
              ${avatarHtml(ch)}
              <span class="kenh-dead-stamp">${ch.deadKind === 'empty' ? 'RỖNG' : 'DIE'}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="km-card-head flex flex-wrap items-center justify-between gap-1.5">
                <button type="button" class="${rawId ? 'btn-open-raw-deep' : 'btn-open-km-dossier'} min-w-0 text-sm font-semibold truncate kenh-dead-title text-left hover:text-brand-300 transition-colors" ${rawId ? `data-raw-id="${esc(rawId)}"` : `data-km-handle="${esc(handleLabel)}"`} title="Mở hồ sơ kênh ${esc(handleLabel)}">${esc(handleLabel)}</button>
                <div class="km-card-badges flex flex-wrap items-center gap-1 shrink-0">
                  <span class="badge badge-red font-bold text-xs uppercase tracking-wider shrink-0">${ch.deadKind === 'empty' ? 'RỖNG · 0 VIDEO' : 'DIE · 404'}</span>
                </div>
              </div>
              ${showDistinctTitle ? `<div class="text-xs text-gray-300 font-medium truncate mt-0.5" title="${esc(displayTitle)}">${esc(displayTitle)}</div>` : ''}
              <div class="text-xs kenh-dead-note font-medium mt-0.5 break-words" title="${esc(ch.deadNote || '')}">${esc(ch.deadNote || 'Đã dừng / 404')}</div>
              <div class="text-xs text-gray-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                ${primaryNxCode ? `<button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(primaryNxCode)}" class="badge badge-blue text-xs font-mono" title="Xem ngách ${esc(primaryNxCode)} trên Ngách xanh">${esc(primaryNxCode)} ↗</button>` : ''}
                <span class="truncate">${esc(ch.niche || 'Khác')}${lessonMetaSuffix}</span>
                ${subsVal ? `<span class="text-gray-300 font-medium">· ${esc(subsStr)} subs</span>` : ''}
                ${vidStr ? `<span class="text-gray-400">· ${esc(vidStr)} videos</span>` : ''}
              </div>
              ${voiceHtml}
            </div>
          </div>
          <div class="km-card-actions pt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div class="flex flex-wrap items-center gap-1.5">
              ${(primaryNxCode || vKey) ? `<button type="button" class="filter-btn text-xs" data-open-tab="video" data-open-niche="${esc(primaryNxCode || vKey)}" title="Mở các video bài học thuộc ngách của kênh ${esc(handleLabel)}">Video ngách →</button>` : ''}
              <button type="button" class="filter-btn text-xs" data-sodo-jump="channel:${esc(cleanH)}" title="Xem các bài học phân tích kênh DIE ${esc(handleLabel)} trên Sơ đồ DB">Sơ đồ &amp; Bài học${lessonBtnSuffix} ↗</button>
              ${dossierBtnHtml}
            </div>
            ${safeChannelUrl ? `<a href="${esc(safeChannelUrl)}" target="_blank" rel="noopener noreferrer" class="km-handle-link text-gray-400 hover:text-white inline-flex items-center gap-1" title="Kiểm tra trạng thái 404 trên YouTube">YT 404 ${ico('arrow-up-right', 14)}</a>` : ''}
          </div>
        </div>` : `
        <div class="card p-3 flex flex-col gap-2 min-w-0 overflow-hidden hover:border-brand-500 transition-all">
          <div class="flex items-start gap-3 min-w-0">
            ${avatarHtml(ch)}
            <div class="min-w-0 flex-1">
              <div class="km-card-head flex flex-wrap items-center justify-between gap-1.5">
                ${safeChannelUrl ? `<a href="${esc(safeChannelUrl)}" target="_blank" rel="noopener noreferrer" class="km-handle-link min-w-0 text-sm font-semibold text-white hover:text-brand-300"><span class="truncate">${esc(handleLabel)}</span></a>` : `<span class="min-w-0 text-sm font-semibold text-white truncate">${esc(handleLabel)}</span>`}
                <div class="km-card-badges flex flex-wrap items-center gap-1 shrink-0">
                  ${caps.isRevived ? `<span class="badge badge-blue text-xs" title="Kênh hồi sinh / đổi handle từ dẫn chứng cũ">HỒI SINH</span>` : ''}
                  ${isMauBan ? `<span class="badge badge-amber text-xs" title="Mẫu bẩn / Reup rủi ro trong Ngách xanh">MẪU BẨN</span>` : ''}
                  <span class="badge badge-green text-xs">SỐNG</span>
                </div>
              </div>
              ${showDistinctTitle ? `<div class="text-xs text-gray-200 font-medium truncate mt-0.5" title="${esc(displayTitle)}">${esc(displayTitle)}</div>` : ''}
              <div class="text-xs text-gray-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                ${primaryNxCode ? `<button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(primaryNxCode)}" class="badge badge-blue text-xs font-mono" title="Xem ngách ${esc(primaryNxCode)} trên Ngách xanh">${esc(primaryNxCode)} ↗</button>` : ''}
                <span class="truncate">${esc(ch.niche || 'Khác')}${lessonMetaSuffix}</span>
                ${subsStr ? `<span class="${subsVal ? 'text-emerald-400 font-medium' : 'text-gray-500'}">· ${esc(subsStr)}${subsVal ? ' subs' : ''}</span>` : ''}
                ${vidStr ? `<span class="text-gray-300">· ${esc(vidStr)} videos</span>` : ''}
              </div>
              ${chMarkets.length ? `<div class="text-xs text-gray-500 truncate mt-0.5">${chMarkets.map(m => esc(m.label)).join(' · ')}</div>` : ''}
              ${voiceHtml}
            </div>
          </div>
          <div class="km-card-actions pt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div class="flex flex-wrap items-center gap-1.5">
              ${(primaryNxCode || vKey) ? `<button type="button" class="filter-btn text-xs" data-open-tab="video" data-open-niche="${esc(primaryNxCode || vKey)}" title="Mở các video bài học thuộc ngách của kênh ${esc(handleLabel)}">Video ngách →</button>` : ''}
              <button type="button" class="filter-btn text-xs" data-sodo-jump="channel:${esc(cleanH)}" title="Xem liên kết kênh ${esc(handleLabel)} trên Sơ đồ DB">Sơ đồ &amp; Bài học${lessonBtnSuffix} ↗</button>
              ${dossierBtnHtml}
            </div>
            ${safeChannelUrl ? `<a href="${esc(safeChannelUrl)}" target="_blank" rel="noopener noreferrer" class="km-handle-link text-brand-300 hover:text-white inline-flex items-center gap-1">Mở YouTube ${ico('arrow-up-right', 14)}</a>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;
  }).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2 flex justify-center">' + ico('search', 24) + '</div><p class="mb-3">Không tìm thấy kênh phù hợp với bộ lọc hiện tại.</p><button type="button" id="freset-kenh-empty" class="bg-surface-2 hover:bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Xóa bộ lọc</button></div>'}
  </div>
  ${kenhPager('bottom')}`;
}

async function renderChienLuoc() {
  const [clRaw, videos, videosHuan, videosDgmd, nxRaw, ov, kichRaw, kenhRaw, rawKenhRaw] = await Promise.all([
    loadJSON('data-tabs/chien-luoc.json').catch(() => ({})),
    loadJSON('data-tabs/videos.json').then(safeArray).catch(() => []),
    loadJSON('data/videos_huan.json').then(safeArray).catch(() => []),
    loadJSON('data/videos_dgmd.json').then(safeArray).catch(() => []),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => null),
    loadOverviewSummary ? loadOverviewSummary().catch(() => null) : Promise.resolve(null),
    loadJSON('data-tabs/tai-lieu-full.json').then(safeArray).catch(() => []),
    loadJSON('data-tabs/kenh-mau.json').then(safeArray).catch(() => []),
    loadJSON('data-tabs/raw-kenh-mau.json').catch(() => null)
  ]);
  const cl = clRaw || {};
  const vMap = new Map();
  videos.forEach(v => { if (v && v.sku) vMap.set(String(v.sku).trim(), Object.assign({ _track: 'h2dev', _trackLabel: 'H2DEV' }, v)); });
  videosHuan.forEach(v => { if (v && v.sku) vMap.set(String(v.sku).trim(), Object.assign({ _track: 'huan', _trackLabel: 'HUÂN' }, v)); });
  videosDgmd.forEach(v => { if (v && v.sku) vMap.set(String(v.sku).trim(), Object.assign({ _track: 'dgmd', _trackLabel: 'DGMD' }, v)); });
  const allSysVids = [...videos, ...videosHuan, ...videosDgmd];
  const knownHandles = new Set();
  kenhRaw.forEach(c => { if (c && c.handle) knownHandles.add(String(c.handle).trim().toLowerCase()); });
  const rawRecs = Array.isArray(rawKenhRaw) ? rawKenhRaw : safeArray(rawKenhRaw && rawKenhRaw.records);
  rawRecs.forEach(r => {
    const h = (r && r.channel && r.channel.handle) || (r && r.visionAnalysis && r.visionAnalysis.handle) || (r && r.ocr && r.ocr.handle) || '';
    if (h) knownHandles.add((h.startsWith('@') ? h : ('@' + h)).toLowerCase());
  });
  const docByBasename = new Map();
  kichRaw.forEach(d => {
    if (!d) return;
    const f = String(d.fileLocal || d.file || '').trim();
    if (!f) return;
    const base = f.split('/').pop().toLowerCase();
    if (base && !docByBasename.has(base)) docByBasename.set(base, { path: f, title: d.name || base, sku: d.sku || '' });
  });
  function renderBracketLead(str) {
    const s = String(str || '').trim();
    const m = s.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
    if (!m) return esc(s);
    return `<strong class="text-white font-semibold">[${esc(m[1])}]</strong> ${esc(m[2])}`;
  }
  function renderSampleCompetitorHtml(compStr) {
    const raw = String(compStr || '').trim();
    if (!raw) return '';
    const parts = raw.split(/(@[^\s,;:()[\]]+)/g);
    return parts.map(part => {
      if (part.startsWith('@') && part.length >= 3) {
        const cleanH = part.replace(/[.,;:)\]]+$/, '');
        const suffix = part.slice(cleanH.length);
        return `<button type="button" data-open-tab="kenh-mau" data-kenh-handle="${esc(cleanH)}" class="inline-flex items-center text-emerald-400 hover:text-emerald-300 underline decoration-dotted font-mono cursor-pointer" title="Mở hồ sơ kênh mẫu ${esc(cleanH)}">${esc(cleanH)} ↗</button>${esc(suffix)}`;
      }
      return esc(part);
    }).join('');
  }
  const huanCount = Number((ov && ((ov.videosByTrack && ov.videosByTrack.huan) || ov.videosHuan)) || videosHuan.length || 140);
  const dgmdCount = Number((ov && ((ov.videosByTrack && ov.videosByTrack.dgmd) || ov.videosDgmd)) || videosDgmd.length || 53);
  const totalSysVideos = Number((ov && (ov.totalVideos || ov.lessons)) || (videos.length + huanCount + dgmdCount) || 355);
  const totalDocs = Number((ov && ov.documents) || 761);
  const totalKenh = Number((ov && (ov.channels || ov.totalChannels)) || 1740);
  const kenhLiveCount = Number((ov && ov.liveChannels) || 1444);
  const kenhDeadCount = Number((ov && (ov.deadChannels || ov.deadChannelsCount)) || Math.max(0, totalKenh - kenhLiveCount) || 296);
  const totalNguon = Number((ov && (ov.nguonReup || ov.reupSources)) || 52);
  const nx = Object.assign({}, (nxRaw && typeof nxRaw === 'object') ? nxRaw : {}, {
    ngachXanh: safeArray(nxRaw && nxRaw.ngachXanh),
    thongTinChinhSach2026: safeArray(nxRaw && nxRaw.thongTinChinhSach2026)
  });
  const checks = loadChecks();
  const noteOf = {
    'Hệ thống / Quy trình': 'meta · tư duy hệ thống & vận hành đa kênh',
    'Kiếm tiền / Chính sách': 'meta · kháng lỗi YPP, AdSense & bản quyền',
    'Triết lý / Tâm linh': 'xanh · JP/KR/US AVD cao',
    'Reup / Hoạt hình': 'có điều kiện · reused + copyright + AI 3D',
    'Nhân bản / Kênh': 'meta · học clone, không phải ngách đăng',
    'Edit / Thumb': 'meta · packaging, prompt & hậu kỳ',
    'Sức khỏe / Lão hóa': 'xanh · senior YMYL không-bác-sĩ',
    'Drama / Stories': 'thận trọng · drama đời sống & B-roll thật',
    'Nền tảng / Tool': 'meta · tool / cộng đồng & hạ tầng sạch',
    'Kinh tế / Tài chính': 'xanh · US RPM cao hơn ($18-$38)',
    'Lịch sử / Quân sự': 'thận trọng · khảo cổ, bản đồ & đồ vật',
    'Khoa học EN': 'xanh · tài liệu thiên nhiên, vũ trụ & ESL',
    'Share key / Ngách nhỏ': 'meta · học chọn key, không copy key',
    'Khác': 'không còn — đã gắn hết'
  };
  function getNicheNote(k) {
    if (noteOf[k]) return noteOf[k];
    if (/Reup|Hoạt Hình/i.test(k)) return 'có điều kiện · reused + copyright';
    if (/Sức Khỏe|Dưỡng Sinh/i.test(k)) return 'xanh · senior YMYL';
    if (/Triết Lý|Tâm Linh|Phật Pháp|Lời Chúa/i.test(k)) return 'xanh · JP/KR/US AVD cao';
    if (/Drama|Tâm Sự/i.test(k)) return 'thận trọng · drama đời sống';
    if (/Kinh Tế|Tài Chính/i.test(k)) return 'xanh · US RPM $18-$38';
    if (/Kháng|Bản Quyền|AdSense|Lỗi GA/i.test(k)) return 'meta · bảo vệ kênh YPP';
    if (/Prompt|Kịch Bản/i.test(k)) return 'meta · 3-5 Hồi AI';
    if (/Môi Trường|Setup|Nuôi Kênh|VPS/i.test(k)) return 'meta · hạ tầng sạch';
    if (/Nhân Bản|Đa Thị Trường/i.test(k)) return 'meta · scale JP/KR/US';
    if (/Khám Kênh|Tối Ưu/i.test(k)) return 'thực chiến · audit';
    return 'ngách thực chiến';
  }
  const scoreOrder = ['Hệ thống / Quy trình', 'Kiếm tiền / Chính sách', 'Triết lý / Tâm linh', 'Reup / Hoạt hình', 'Nhân bản / Kênh', 'Edit / Thumb', 'Sức khỏe / Lão hóa', 'Drama / Stories', 'Nền tảng / Tool', 'Kinh tế / Tài chính', 'Lịch sử / Quân sự', 'Khoa học EN', 'Share key / Ngách nhỏ', 'Khác'];
  const histSource = allSysVids.length ? allSysVids : videos;
  const hist = histSource.reduce((a, v) => {
    const n = (typeof nicheKeyFor === 'function' && nicheKeyFor(v.contentNiche || v.niche || v.category_name || '')) || v.niche || 'Khác';
    a[n] = (a[n] || 0) + 1;
    return a;
  }, {});
  const score = scoreOrder.filter(k => hist[k]).map(k => ({ label: k, n: hist[k], note: getNicheNote(k), key: k }));
  Object.keys(hist).sort((a, b) => (hist[b] || 0) - (hist[a] || 0)).forEach(k => { if (!scoreOrder.includes(k)) score.push({ label: k, n: hist[k], note: getNicheNote(k), key: k }); });
  score.sort((a, b) => (b.n || 0) - (a.n || 0));
  const principles = [
    { tag: '01', title: 'Cách làm quyết định', body: cl.nguyenTacCotLoi[0] },
    { tag: '02', title: 'Hai cửa YPP', body: cl.nguyenTacCotLoi[1] },
    { tag: '03', title: '3 việc giữ lại người', body: cl.nguyenTacCotLoi[2] },
    { tag: '04', title: 'Nhất quán = brand', body: cl.nguyenTacCotLoi[3] }
  ];
  const steps = cl.workflow || [];
  const ypp = [
    { when: 'Hiện tại', tone: 'text-brand-300', title: 'Xin ads / Premium', body: cl.loTrinhXinKiemTien.hienTai2026 },
    { when: '01/02/2027', tone: 'text-amber-300', title: 'Kênh mới siết ngưỡng', body: cl.loTrinhXinKiemTien.tu2027 },
    { when: 'Giữ YPP', tone: 'text-emerald-300', title: 'Đừng để kênh chết', body: cl.loTrinhXinKiemTien.duyTriYPP }
  ];
  const scored = score.reduce((a, s) => a + s.n, 0);
  state.clSubTab = state.clSubTab || 'principles';
  const curTab = state.clSubTab;
  const isAll = curTab === 'all';

  const m144Count = (cl.matrix144 && Array.isArray(cl.matrix144.items)) ? cl.matrix144.items.length : totalSysVideos;
  const m144Words = Number((cl.matrix144 && cl.matrix144.totalWords) || (ov && ov.matrix144Words) || 996486).toLocaleString();
  const clStepCount = steps.length || Number((ov && ov.chienLuocSteps) || 24);
  const rawProfileCount = Number((ov && ov.rawChannels) || 156);
  const checklistArr = safeArray(cl.checklistTruocKhiDang);
  const checkedCount = checklistArr.filter((_, i) => Boolean(checks['cl-' + i])).length;
  return `
  ${pageBanner('Chiến lược & Vận hành 97yo-dev', `Quy trình xây kênh A–Z chuẩn toàn diện ${clStepCount} bước thực chiến · Hệ thống ${totalSysVideos} video bài học (${videos.length} H2DEV · ${huanCount} Huân · ${dgmdCount} DGMD), ${totalDocs} tài liệu SOP và ${rawProfileCount} raw kênh.`, [
    { icon: ICONS.video, label: 'Video hệ thống', value: totalSysVideos, sub: `${videos.length} H2DEV · ${huanCount} Huân · ${dgmdCount} DGMD`, tab: 'video' },
    { icon: ICONS.doc, label: 'Kịch bản & Tài liệu', value: totalDocs, sub: `${totalDocs} file · catalog SOP`, tab: 'tai-lieu' },
    { icon: ICONS.channel, label: 'Kênh đối thủ', value: totalKenh, sub: `${kenhLiveCount} sống · ${kenhDeadCount} case study DIE`, tab: 'kenh-mau' },
    { icon: ICONS.link, label: 'Nguồn reup', value: totalNguon, sub: `${totalNguon} nguồn · match`, tab: 'nguonreup' }
  ])}

  <!-- Panel 1: 4 Nguyên Tắc Cốt Lõi -->
  <div id="cl-panel-principles" class="cl-panel flex-col gap-4" style="${(curTab === 'principles' || isAll) ? 'display:flex;' : 'display:none;'}">
<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
  ${principles.map(p => `
    <article class="card p-4 min-w-0">
      <div class="text-xs font-mono text-brand-400 font-bold">${p.tag}</div>
      <h3 class="text-sm font-bold text-white mt-1 font-heading">${esc(p.title)}</h3>
      <p class="text-xs text-gray-400 mt-2 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(p.body)}</p>
    </article>`).join('')}
</div>
${!isAll ? `<div class="card p-3.5 border-border-strong bg-surface flex flex-wrap items-center justify-between gap-2">
  <span class="text-xs text-gray-300 font-semibold">Đi nhanh phân hệ Chiến lược:</span>
  <div class="flex flex-wrap items-center gap-1.5">
    <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="workflow" title="Mở quy trình ${clStepCount} bước xây kênh A–Z">Quy trình ${clStepCount} bước A–Z →</button>
    <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="matrix144" title="Mở Ma trận ${m144Count} bài học 3 nhánh">Ma trận ${m144Count} Bài (3 nhánh) →</button>
    <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="distribution" title="Mở phân bổ ngách &amp; hướng đi nội dung">Phân bổ ngách →</button>
    <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="policy" title="Mở 12 cổng YPP &amp; Checklist trước khi đăng">YPP &amp; Chính sách →</button>
    <button type="button" class="filter-btn text-xs" data-open-tab="chienluoc" data-cl-subtab="all" title="Hiển thị toàn bộ nội dung Chiến lược trên 1 trang">Xem tất cả trên 1 trang →</button>
  </div>
</div>` : ''}
  </div>

  <!-- Panel 2: Quy trình xây kênh A-Z (SOP ${clStepCount} bước chuẩn toàn diện) -->
  <div id="cl-panel-workflow" class="cl-panel" style="${(curTab === 'workflow' || isAll) ? 'display:flex;' : 'display:none;'}">
<section>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
    <div>
      <h2 class="page-h2 mb-1">Quy trình xây kênh A–Z (SOP ${clStepCount} bước chuẩn toàn diện — Phủ 100% ${totalSysVideos} Video 3 Nhánh: ${videos.length} H2DEV · ${huanCount} Huân · ${dgmdCount} DGMD)</h2>
      <p class="card-note">Quy trình vận hành trọn vẹn 9 giai đoạn từ môi trường sạch, chọn key, kịch bản đa hồi, voice DNA, visual 5P, hậu kỳ 5 lớp né quét đến AdSense, YPP, nhân bản toàn cầu &amp; 8 chiến thuật thuật toán 2026.</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <button type="button" data-doc-preview="docs/NOI-BO/zoom/QUY-TRINH-XAY-KENH-A-Z.md" data-doc-title="Đề cương Quy trình xây kênh A–Z" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer">
        <span class="inline-flex items-center gap-1.5">${ico('eye', 14)} Đọc trực tiếp Đề cương A–Z</span>
      </button>
      <button type="button" data-doc-preview="docs/ZOOM-00-Quy-trinh-xay-kenh/README.txt" data-doc-title="Đề cương gốc Quy trình xây kênh (.txt)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-gray-200 text-xs font-medium transition-colors cursor-pointer">
        <span class="inline-flex items-center gap-1.5">${ico('file-text', 14)} File gốc .txt</span>
      </button>
    </div>
  </div>
  <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 min-w-0">
    ${steps.map(s => {
      const stepDocAttr = (s.tab === 'tai-lieu' && s.kind == null && s.promptNiche == null && s.docPath)
        ? ` data-doc-q="${esc(s.docPath)}"`
        : '';
      const stepKenhAttr = (s.tab === 'kenh-mau' && s.n === 4)
        ? ' data-kenh-status="dead"'
        : '';
      const stepVideoAttrs = (s.tab === 'video')
        ? ` data-video-track="all"${Array.isArray(s.skus) && s.skus.length ? ` data-skus="${esc(s.skus.join(','))}"` : ''}`
        : '';
      const tc = s.trackCounts || null;
      const tcLabel = tc
        ? `${s.skus.length} SKU (${tc.h2dev || 0} H2 · ${tc.huan || 0} Huân · ${tc.dgmd || 0} DGMD)`
        : `${(s.skus || []).length} SKU`;
      return `
      <div class="card p-4 text-left min-w-0 hover:border-brand-500 flex flex-col justify-between transition-colors">
        <div>
          <div class="flex gap-3">
            <span class="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-700/40 text-brand-300 font-bold text-sm flex items-center justify-center shrink-0 font-mono">${String(s.n).padStart(2, '0')}</span>
            <div class="min-w-0 flex-1">
              ${s.phase ? `<span class="block text-xs font-mono text-brand-400 font-semibold mb-1">${esc(s.phase)}</span>` : ''}
              <span class="block text-sm font-bold text-white font-heading leading-snug">${esc(s.title)}</span>
              <span class="block text-xs text-gray-300 mt-1.5 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(s.detail)}</span>
              ${s.sampleCompetitor ? `<div class="mt-2 text-xs text-emerald-400 font-medium flex flex-wrap items-center gap-1"><span class="text-gray-500 font-normal">Kênh tham chiếu:</span> <span class="font-mono">${renderSampleCompetitorHtml(s.sampleCompetitor)}</span></div>` : ''}
              ${(s.keywords && s.keywords.length) ? `<div class="mt-2 flex flex-wrap gap-1">${s.keywords.slice(0, 6).map(kw => `<span class="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-xs text-gray-400 font-mono">#${esc(kw)}</span>`).join('')}</div>` : ''}
            </div>
          </div>
          ${(s.skus && s.skus.length) ? `
          <div class="mt-3 pt-2.5 border-t border-hairline">
            <div class="text-xs text-gray-400 mb-1.5 font-mono flex flex-wrap items-center justify-between gap-1">
              <span>Bài học thực chiến:</span>
              <button type="button" data-open-tab="video" data-video-track="all" data-skus="${esc(s.skus.join(','))}" class="text-brand-400 hover:text-brand-300 underline decoration-dotted cursor-pointer" title="Lọc ${s.skus.length} bài học của bước ${s.n} trong Tab Video">${esc(tcLabel)} →</button>
            </div>
            <div class="flex flex-wrap gap-1">
              ${s.skus.map(sku => {
                const vInfo = vMap.get(sku);
                const tPrefix = vInfo && vInfo._trackLabel ? `[${vInfo._trackLabel}] ` : '';
                const tip = vInfo && vInfo.title ? `${tPrefix}${sku} — ${vInfo.title}` : `Mở video bài học ${sku}`;
                return `
                <a href="/lotrinh/${encodeURIComponent(sku)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-700 hover:bg-brand-500/30 border border-ink-600 hover:border-brand-500 text-xs font-mono text-gray-300 hover:text-brand-300 transition-colors" title="${esc(tip)}">
                  <span>${esc(sku)}</span>
                  <span class="font-mono text-xs">↗</span>
                </a>`;
              }).join('')}
            </div>
          </div>` : ''}
        </div>
        <div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
          <button type="button" data-open-tab="${esc(s.tab)}"${s.kind != null ? ` data-kind="${esc(s.kind)}"` : ''}${s.promptNiche != null ? ` data-prompt-niche="${esc(s.promptNiche)}"` : ''}${stepVideoAttrs}${stepDocAttr}${stepKenhAttr} class="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors cursor-pointer">
            <span>${esc(s.tabLabel)}</span>
            <span class="font-mono">→</span>
          </button>
          ${s.docPath ? `
          <button type="button" data-doc-preview="${esc(s.docPath)}" data-doc-title="${esc(s.docTitle || 'Tài liệu SOP')}" class="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-300 transition-colors cursor-pointer" title="${esc(s.docTitle || 'Tài liệu SOP')}">
            <span class="inline-flex items-center gap-1.5">${ico('file-text', 14)} ${esc(s.docTitle || 'Mở SOP')}</span>
          </button>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>
</section>
  </div>

  <!-- Panel 2.5: Ma Trận Bài Học Thực Chiến (Đối Soát Sâu 100% Video & Transcript) -->
  <div id="cl-panel-matrix144" class="cl-panel flex-col" style="${(curTab === 'matrix144' || isAll) ? 'display:flex;' : 'display:none;'}">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="page-h2 mb-1">Ma trận ${m144Count} Bài Học Thực Chiến Toàn Hệ Thống 3 Nhánh (${videos.length} H2DEV · ${huanCount} Huân · ${dgmdCount} DGMD)</h2>
        <p class="card-note">Đối soát trực tiếp ${m144Count}/${totalSysVideos} SKU trên cả 3 lộ trình (${videos.length} H2DEV · ${huanCount} Huân Academy · ${dgmdCount} DGMD), ${m144Words} từ phụ đề transcript gốc, 5 bước SOP né quét AI, công cụ và các lỗi cấm kỵ. Không dùng dữ liệu tượng trưng.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-emerald-400 text-xs font-mono font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>${m144Count}/${m144Count} VIDEO ĐỐI SOÁT THẬT</span>
        </span>
      </div>
    </div>

    <!-- Cluster Chips & Search Filter Bar -->
    ${(function() {
      const m144 = cl.matrix144 || {};
      const clusters = m144.clusters || [];
      const items = m144.items || [];
      const tCounts = m144.trackCounts || { all: items.length, h2dev: videos.length, huan: huanCount, dgmd: dgmdCount };
      const curCluster = state.clMatrixCluster || 'all';
      const curTrack = state.clMatrixTrack || 'all';
      const curMatrixQ = String(state.clMatrixQ || '').trim();
      const curMatrixQLow = curMatrixQ.toLowerCase();
      const curMatrixQFold = SC.fold(curMatrixQ).toLowerCase();
      const activeClusterObj = clusters.find(c => c.id === curCluster) || null;
      const clusterTotals = { all: 0 };
      const trackTotals = { all: 0, h2dev: 0, huan: 0, dgmd: 0 };
      const preparedItems = items.map(it => {
        const itTrack = it.track || 'h2dev';
        const rawHay = [
          it.sku, it.title, it.clusterName, it.clusterId,
          it.trackLabel || itTrack, it.moduleId || '', it.nicheCode || '',
          it.transcriptSample, it.sopSummary,
          ...(it.toolsMentioned || []), ...(it.avoidFlags || []), ...(it.takeaways || [])
        ].join(' ');
        const hay = (rawHay + ' ' + SC.fold(rawHay)).toLowerCase();
        const matchCluster = curCluster === 'all' || it.clusterId === curCluster;
        const matchTrack = curTrack === 'all' || itTrack === curTrack;
        const matchQ = !curMatrixQLow || hay.includes(curMatrixQLow) || (curMatrixQFold && hay.includes(curMatrixQFold));
        if (matchTrack && matchQ) {
          clusterTotals.all++;
          if (it.clusterId) clusterTotals[it.clusterId] = (clusterTotals[it.clusterId] || 0) + 1;
        }
        if (matchCluster && matchQ) {
          trackTotals.all++;
          if (trackTotals[itTrack] !== undefined) trackTotals[itTrack]++;
        }
        return { it, itTrack, hay, isVisible: matchCluster && matchTrack && matchQ };
      });
      const visibleCount = preparedItems.filter(x => x.isVisible).length;
      const trackTabs = [
        { id: 'all', label: 'Tất cả 3 nhánh', count: trackTotals.all },
        { id: 'h2dev', label: 'Nhánh H2DEV', count: trackTotals.h2dev },
        { id: 'huan', label: 'Nhánh Huân Academy', count: trackTotals.huan },
        { id: 'dgmd', label: 'Nhánh DGMD', count: trackTotals.dgmd }
      ];
      return `
      <div class="card p-4 mb-4 border-border-strong bg-surface">
        <div class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span>8 Chuyên đề thực chiến × 3 Nhánh đào tạo (<span id="cl-matrix-count" class="text-emerald-400 font-mono">${visibleCount}/${items.length}</span> bài)</span>
          <span class="text-gray-400 font-mono">${Number(m144.totalWords || 0).toLocaleString()} từ phụ đề</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <div class="relative flex-1 min-w-[220px]">
            <input id="cl-matrix-search" type="search" value="${esc(curMatrixQ)}" placeholder="Tìm nhanh trong ${items.length} bài (mã SKU, nhánh H2DEV/HUÂN/DGMD, ngách H01..H40, công cụ, lời thoại, SOP)..." aria-label="Tìm kiếm trong ma trận ${items.length} bài học" class="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500">
          </div>
          <button type="button" id="cl-matrix-clear" class="filter-btn text-xs ${(curMatrixQ || curCluster !== 'all' || curTrack !== 'all') ? '' : 'hidden'}">Đặt lại bộ lọc</button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-hairline" id="cl-matrix-track-chips">
          <span class="text-xs text-gray-400 font-mono mr-1">Lộ trình:</span>
          ${trackTabs.map(t => {
            const isTAct = curTrack === t.id;
            return `<button type="button" class="filter-btn${isTAct ? ' active' : ''}" data-matrix-track="${esc(t.id)}" aria-pressed="${isTAct ? 'true' : 'false'}"><span>${esc(t.label)}</span><span class="ml-1 text-xs text-gray-400 font-mono" data-chip-count>· ${t.count}</span></button>`;
          }).join('')}
        </div>
        <div class="flex flex-wrap gap-2" id="cl-matrix-filter-chips">
          <button type="button" class="filter-btn${curCluster === 'all' ? ' active' : ''}" data-matrix-filter="all" aria-pressed="${curCluster === 'all' ? 'true' : 'false'}"><span>Tất cả</span><span class="ml-1 text-xs text-gray-400" data-chip-count>· ${clusterTotals.all}</span></button>
          ${clusters.map(c => {
            const isAct = curCluster === c.id;
            return `
            <button type="button" class="filter-btn${isAct ? ' active' : ''}" data-matrix-filter="${esc(c.id)}" aria-pressed="${isAct ? 'true' : 'false'}" title="${esc(c.desc || c.name)}">
              <span>${esc(c.name.split('(')[0].trim())}</span>
              <span class="ml-1 text-xs text-gray-400" data-chip-count>· ${clusterTotals[c.id] || 0}</span>
            </button>`;
          }).join('')}
        </div>
        <div id="cl-matrix-cluster-desc" class="mt-3 pt-2.5 border-t border-hairline text-xs text-gray-300 ${activeClusterObj ? '' : 'hidden'}">
          ${activeClusterObj ? `
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-brand-tint text-brand-tint-fg font-mono font-bold">${esc(activeClusterObj.badge || activeClusterObj.id)}</span>
              <strong class="text-white">${esc(activeClusterObj.name)}:</strong>
              <span>${esc(activeClusterObj.desc || '')}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ${items.length} Video Matrix Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 min-w-0" id="cl-matrix-grid">
        ${preparedItems.map(({ it, itTrack, hay, isVisible }) => `
          <article class="card p-4 flex flex-col justify-between hover:border-brand-500 transition-colors min-w-0" data-matrix-cluster="${esc(it.clusterId)}" data-matrix-track="${esc(itTrack)}" data-matrix-search="${esc(hay)}" style="${isVisible ? '' : 'display:none;'}">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span class="px-2 py-0.5 rounded-lg bg-brand-tint text-brand-tint-fg border border-brand/30 font-mono text-xs font-bold shrink-0">${esc(it.sku)}</span>
                  <span class="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-xs font-mono text-emerald-400 shrink-0">${esc(it.trackLabel || itTrack.toUpperCase())}</span>
                  ${it.nicheCode ? `<button type="button" data-open-tab="ngachxanh" data-nx-q="${esc(it.nicheCode)}" class="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-xs font-mono text-amber-400 hover:text-brand-300 cursor-pointer shrink-0" title="Mở ngách ${esc(it.nicheCode)} trong Tab Ngách Xanh">${esc(it.nicheCode)} ↗</button>` : ''}
                </div>
                <span class="text-xs text-gray-400 font-mono shrink-0">${esc(it.duration || '')}</span>
              </div>
              <h3 class="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 font-heading" title="${esc(it.title)}">${esc(it.title)}</h3>
              
              <div class="mb-2.5 flex flex-wrap items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-surface-2 text-gray-300 border border-border">
                  ${ico('layout-grid', 14)}
                  <span class="truncate">${esc(it.clusterName)}</span>
                </span>
                ${it.moduleId ? `<a href="/lotrinh?track=${encodeURIComponent(itTrack)}&module=${encodeURIComponent(itTrack === 'h2dev' && !/^H2DEV-/i.test(it.moduleId) ? 'H2DEV-' + it.moduleId : it.moduleId)}&sku=${encodeURIComponent(it.sku)}" class="px-1.5 py-0.5 rounded bg-surface-2 hover:bg-ink-700 border border-hairline text-xs font-mono text-gray-300 hover:text-brand-300 transition-colors" title="Mở module ${esc(it.moduleId)} trong Lộ trình học">${esc(it.moduleId)} ↗</a>` : ''}
              </div>

              ${(it.toolsMentioned && it.toolsMentioned.length) ? `
              <div class="mb-2 flex flex-wrap items-center gap-1">
                <span class="text-xs text-gray-500 font-mono">Tool:</span>
                ${it.toolsMentioned.slice(0, 4).map(tl => `<span class="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-xs font-mono text-gray-300">${esc(tl)}</span>`).join('')}
              </div>` : ''}

              ${it.transcriptSample ? `
              <div class="p-2.5 rounded-xl bg-ink-900/60 border border-hairline mb-2.5">
                <div class="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                  ${ico('file-text', 14)}
                  <span>Trích thoại phụ đề (${it.transcriptWords} từ):</span>
                </div>
                <p class="text-xs text-gray-300 italic line-clamp-3 leading-relaxed break-words">"${esc(it.transcriptSample)}"</p>
              </div>` : ''}

              ${it.sopSummary ? `
              <div class="p-2.5 rounded-xl bg-surface-2 border border-hairline mb-2.5">
                <div class="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  ${ico('settings', 14)}
                  <span>SOP né quét AI thực tế:</span>
                </div>
                <p class="text-xs text-gray-300 line-clamp-3 leading-relaxed break-words" title="${esc(it.sopSummary)}">${esc(it.sopSummary)}</p>
              </div>` : ''}

              ${(it.avoidFlags && it.avoidFlags.length) ? `
              <div class="mb-2">
                <div class="text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1">
                  ${ico('alert-triangle', 14)}
                  <span>Cảnh báo lỗi:</span>
                </div>
                <ul class="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  ${it.avoidFlags.map(f => `<li class="line-clamp-2 break-words" title="${esc(f)}">${esc(f)}</li>`).join('')}
                </ul>
              </div>` : ''}
            </div>

            <div class="mt-3 pt-2.5 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" data-open-tab="tai-lieu" data-doc-q="${esc(it.sku)}" class="text-xs text-gray-400 hover:text-brand-300 font-mono underline decoration-dotted cursor-pointer" title="Xem ${it.attachedCount} tài liệu đính kèm của ${esc(it.sku)}">${it.attachedCount} tài liệu ↗</button>
                <button type="button" data-sodo-jump="video:${esc(it.sku)}" class="text-xs text-gray-400 hover:text-brand-300 font-mono underline decoration-dotted cursor-pointer" title="Soi mạch liên kết bài học ${esc(it.sku)} trên Sơ đồ DB">Sơ đồ DB ↗</button>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" class="btn-open-video-sub inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-2 hover:bg-ink-700 border border-border text-gray-200 text-xs font-medium transition-colors cursor-pointer" data-sku="${esc(it.sku)}" data-title="${esc(it.title)}" data-views="${esc(it.duration || '')}" data-channel="${esc(it.trackLabel || 'H2DEV Faceless')}" title="Đọc nhanh phụ đề & SOP bài học ${esc(it.sku)}">
                  ${ico('file-text', 14)}
                  <span>Phụ đề & SOP</span>
                </button>
                <a href="/lotrinh/${encodeURIComponent(it.sku)}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors">
                  <span>Mở Video Học</span>
                  <span class="font-mono text-xs">↗</span>
                </a>
              </div>
            </div>
          </article>
        `).join('')}
      </div>`;
    })()}
  </div>

  <!-- Panel 3: Phân Bổ Ngách, Điểm Số & Hướng Đi Tiêu Biểu -->
  <div id="cl-panel-distribution" class="cl-panel" style="${(curTab === 'distribution' || isAll) ? 'display:flex;' : 'display:none;'}">
<div class="grid lg:grid-cols-2 gap-4">
  <section class="card p-4 sm:p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-1">Phân bổ chủ đề toàn hệ thống 3 nhánh (${scored} Video)</h2>
    <p class="text-xs text-gray-500 mb-3">Đếm live từ 3 lộ trình (${videos.length} H2DEV · ${huanCount} Huân · ${dgmdCount} DGMD) · ${scored}/${totalSysVideos} bài học</p>
    <div class="space-y-1.5">
      ${score.map(s => `
        <button type="button" data-open-tab="video" data-video-track="all" data-open-niche="${esc(s.key)}" class="w-full flex items-center gap-3 min-w-0 text-left rounded-xl px-2 py-1.5 hover:bg-ink-700/60">
          <span class="w-8 text-right text-sm font-bold text-white shrink-0">${s.n}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-gray-200 truncate">${esc(s.label)}</span>
            <span class="block text-xs text-gray-500 truncate">${esc(s.note)}</span>
          </span>
          <span class="text-xs text-brand-400 shrink-0">Xem →</span>
        </button>`).join('')}
    </div>
  </section>
  ${(cl.huongDiNoiDung && cl.huongDiNoiDung.length) ? `
  <section class="card p-4 sm:p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-1">Các nhóm hướng đi nội dung tiêu biểu</h2>
    <p class="text-xs text-gray-400 mb-3">Các nhóm đề tài khảo sát tham chiếu từ dữ liệu kênh đối thủ và kho bài học. Luôn đo lại bằng vidIQ trước khi bấm máy.</p>
    <div class="grid sm:grid-cols-2 gap-2.5">${cl.huongDiNoiDung.map(h => {
      const HUONG_NX_Q = {
        1: 'H30', 2: 'H35', 3: 'H34', 4: 'H18', 5: 'H27', 6: 'H29', 7: 'H01',
        8: 'H37', 9: 'H11', 10: 'H29', 11: 'H17', 12: 'H28', 13: 'H40', 14: 'H31'
      };
      const nxQuery = h.nicheCode || HUONG_NX_Q[h.hang] || h.ngach || '';
      return `
      <div class="rounded-xl border border-ink-600 hover:border-brand-500 p-2.5 min-w-0 bg-ink-800 flex flex-col justify-between transition-colors">
        <button type="button" data-open-tab="${esc(h.tab || 'ngachxanh')}" data-nx-q="${esc(nxQuery)}" class="text-left w-full min-w-0 cursor-pointer">
          <div class="text-xs font-mono text-brand-400 font-bold">#${h.hang} · ${esc(nxQuery)} · ${esc(h.pack)}</div>
          <div class="text-sm font-bold text-white mt-0.5 font-heading">${esc(h.ngach)}</div>
          <div class="text-xs text-gray-400 mt-1.5 leading-relaxed break-words">${esc(h.lyDo)}</div>
        </button>
        <div class="mt-2.5 pt-2 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
          <button type="button" data-open-tab="${esc(h.tab || 'ngachxanh')}" data-nx-q="${esc(nxQuery)}" class="text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer">Ngách ${esc(nxQuery)} →</button>
          ${h.localPath ? `<button type="button" data-doc-preview="${esc(h.localPath)}" data-doc-title="${esc(h.ngach)}" class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer">${ico('file-text', 14)} Đọc SOP/Prompt</button>` : ''}
        </div>
      </div>`;
    }).join('')}</div>
    ${cl.cachNoiTab ? `<ul class="mt-3 space-y-1 text-xs text-gray-400">${cl.cachNoiTab.map(s => '<li>· ' + esc(s) + '</li>').join('')}</ul>` : ''}
  </section>`: ''}
</div>
${(cl.taiSanNoiBo && cl.taiSanNoiBo.length) ? `
<section class="card p-4 sm:p-5 sm:p-6 min-w-0">
  <h2 class="page-h2 mb-1">Tài sản ngoài đã đồng bộ vào 97yo-dev</h2>
  <p class="text-xs text-gray-500 mb-3">Match cái đã có · gôm cái chưa có. Gốc ở Y:\\YTB không xóa. Chi tiết: <button type="button" data-doc-preview="docs/NOI-BO/README.md" data-doc-title="Tài sản nội bộ đã đồng bộ vào 97yo-dev" class="text-brand-400 hover:text-brand-300 underline decoration-dotted font-mono cursor-pointer">docs/NOI-BO/README.md</button></p>
  <div class="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">${cl.taiSanNoiBo.map(t => {
    const isDocTab = !t.tab || t.tab === 'tai-lieu';
    const pLow = isDocTab && t.path ? String(t.path).trim().toLowerCase() : '';
    const liveDocCount = pLow && kichRaw.length
      ? kichRaw.filter(it => it && (String(it.file || '').toLowerCase().includes(pLow) || String(it.fileLocal || '').toLowerCase().includes(pLow))).length
      : 0;
    const displaySo = (isDocTab && liveDocCount > 0) ? liveDocCount : (t.so || '—');
    const docAttrs = (isDocTab && pLow && liveDocCount > 0)
      ? ` data-doc-q="${esc(t.path)}"`
      : (t.kind != null ? ` data-kind="${esc(t.kind)}"` : '');
    return `
    <button type="button" data-open-tab="${esc(t.tab || 'tai-lieu')}"${docAttrs} class="text-left rounded-xl border border-ink-600 hover:border-brand-500 p-3 min-w-0 cursor-pointer">
      <div class="text-2xl font-bold text-white leading-none">${displaySo}</div>
      <div class="text-sm font-bold text-white mt-1">${esc(t.loai)}</div>
      <div class="text-xs text-gray-500 mt-1 font-mono break-all">${esc(t.path || '')}</div>
    </button>`;
  }).join('')}</div>
</section>`: ''}
  </div>

  <!-- Panel 4: Lộ Trình YPP 2026-2027, Checklist & Chính Sách -->
  <div id="cl-panel-policy" class="cl-panel" style="${(curTab === 'policy' || isAll) ? 'display:flex;' : 'display:none;'}">
<div>
  <h2 class="page-h2 mb-1">Lộ trình YPP 2026-2027</h2>
  <p class="card-note mb-3">Đừng để kênh chết — giữ YPP bằng cách làm đúng format, không lạm dụng reused.</p>
  <div class="grid lg:grid-cols-3 gap-3.5 mb-4">
    ${ypp.map(y => {
      const ySkus = [...new Set((String(y.body || '').match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
      const yAnswers = [...new Set((String(y.body || '').match(/answer\/(\d+)/g) || []).map(x => x.replace('answer/', '')))];
      return `
      <article class="card p-4 min-w-0 flex flex-col justify-between">
        <div>
          <div class="text-xs uppercase tracking-wide ${y.tone} font-bold">${esc(y.when)}</div>
          <h3 class="text-white font-bold mt-1 font-heading">${esc(y.title)}</h3>
          <p class="text-sm text-gray-300 mt-2 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(y.body)}</p>
        </div>
        ${(ySkus.length || yAnswers.length) ? `
        <div class="mt-3 pt-2.5 border-t border-hairline flex flex-wrap items-center gap-1.5">
          ${ySkus.map(sku => `<a href="/lotrinh/${encodeURIComponent(sku)}" class="filter-btn text-xs text-brand-300">${esc(sku)} ▶</a>`).join('')}
          ${yAnswers.map(ans => `<a href="https://support.google.com/youtube/answer/${esc(ans)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs text-gray-300">YT Help #${esc(ans)} ↗</a>`).join('')}
        </div>` : ''}
      </article>`;
    }).join('')}
  </div>
</div>
<div class="grid lg:grid-cols-2 gap-4">
  <section id="cl-checklist-12" class="card p-4 sm:p-5 sm:p-6 min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2">
        <h2 class="page-h2 mb-0">Checklist trước khi đăng</h2>
        <span id="cl-checklist-progress" class="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-xs font-mono text-emerald-400">Đã hoàn thành ${checkedCount}/${checklistArr.length}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button type="button" id="cl-checklist-reset" class="filter-btn text-xs" title="Bỏ chọn toàn bộ 12 mục checklist">Đặt lại</button>
        <button type="button" class="filter-btn text-xs" data-sodo-jump="checklist:CL01">Sơ đồ 12 Checklist <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
      </div>
    </div>
    <div class="cl-policy-bar mb-3"><div class="cl-policy-bar-fill" id="cl-policy-bar-fill" style="width:${Math.round((checkedCount / Math.max(1, checklistArr.length)) * 100)}%"></div></div>
    <div class="space-y-2 text-sm text-gray-300">${checklistArr.map((s, i) => {
        const id = 'cl-' + i;
        const clCode = 'CL' + String(i + 1).padStart(2, '0');
        const citedSkus = [...new Set((String(s || '').match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
        const citedDocs = [...new Set((String(s || '').match(/\b[A-Za-z0-9_-]+\.(?:md|txt)\b/g) || []))];
        const citedAnswers = [...new Set((String(s || '').match(/answer\/(\d+)/g) || []).map(x => x.replace('answer/', '')))];
        return `<div id="cl-item-${clCode}" class="p-2.5 rounded-xl bg-surface-2 border border-hairline">
          <label class="flex items-start gap-2 min-h-[44px] py-2 break-words [overflow-wrap:anywhere] min-w-0 cursor-pointer">
            <input type="checkbox" data-check-id="${id}" class="rounded shrink-0 w-6 h-6 cursor-pointer" style="width:24px;height:24px;min-width:24px;min-height:24px;" ${checks[id] ? 'checked' : ''} aria-label="Checklist ${i + 1}" aria-checked="${checks[id] ? 'true' : 'false'}">
            <span class="min-w-0">${renderBracketLead(s)}</span>
          </label>
          <div class="mt-2 pl-5 flex flex-wrap items-center gap-1.5">
            <button type="button" class="filter-btn text-xs" data-sodo-jump="checklist:${clCode}">Sơ đồ ${clCode} ↗</button>
            ${citedSkus.map(sku => `<a href="/lotrinh/${encodeURIComponent(sku)}" class="filter-btn text-xs text-brand-300">${esc(sku)} ▶</a>`).join('')}
            ${citedDocs.map(docName => {
              const info = docByBasename.get(docName.toLowerCase());
              const docPath = (info && info.path) || ('assets/docs/' + docName);
              return `<button type="button" class="filter-btn text-xs text-emerald-300" data-doc-preview="${esc(docPath)}" data-doc-title="${esc((info && info.title) || docName)}">${ico('file-text', 14)} ${esc(docName)}</button>`;
            }).join('')}
            ${citedAnswers.map(ans => `<a href="https://support.google.com/youtube/answer/${esc(ans)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs text-gray-300">YT Help #${esc(ans)} ↗</a>`).join('')}
          </div>
        </div>`;
      }).join('')}</div>
  </section>
  <section class="card p-4 sm:p-5 sm:p-6 min-w-0">
    <div class="flex items-center justify-between gap-2 mb-3">
      <h2 class="page-h2 mb-0">Chính sách YouTube phải nhớ</h2>
      <button type="button" class="filter-btn text-xs" data-sodo-jump="policy:P01">Sơ đồ 12 Chính sách ↗</button>
    </div>
    <ol class="policy-list">
      ${(nx.thongTinChinhSach2026 || []).map((s, i) => {
        const pCode = 'P' + String(i + 1).padStart(2, '0');
        const citedSkus = [...new Set((String(s || '').match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+|HUAN-M\d{2}-L\d{2}|DGMD-M\d{2}-L\d{2})\b/g) || []))];
        const citedRaws = [...new Set((String(s || '').match(/\bRAW-\d{3}\b/g) || []))];
        const citedDocs = [...new Set((String(s || '').match(/\b[A-Za-z0-9_-]+\.(?:md|txt)\b/g) || []))];
        const citedAnswers = [...new Set((String(s || '').match(/answer\/(\d+)/g) || []).map(x => x.replace('answer/', '')))];
        const citedHandles = extractKnownHandles(s, knownHandles);
        return `<li id="policy-item-${pCode}" class="policy-item">
          <span class="policy-i">${String(i + 1).padStart(2, '0')}</span>
          <div class="min-w-0 flex-1">
            <button type="button" class="policy-toggle w-full text-left" aria-expanded="false"><span class="policy-text" title="${esc(s)}">${renderBracketLead(s)}</span><span class="policy-more" hidden>Xem đầy đủ ▾</span></button>
            <div class="policy-links mt-1.5 flex flex-wrap items-center gap-1.5">
              <button type="button" class="filter-btn text-xs" data-sodo-jump="policy:${pCode}">Sơ đồ ${pCode} ↗</button>
              ${citedSkus.map(sku => `<a href="/lotrinh/${encodeURIComponent(sku)}" class="filter-btn text-xs text-brand-300">${esc(sku)} ▶</a>`).join('')}
              ${citedRaws.map(rid => `<button type="button" class="filter-btn text-xs text-sky-300" data-open-tab="rawkenh" data-raw-rid="${esc(rid)}">${esc(rid)} ↗</button>`).join('')}
              ${citedDocs.map(docName => {
                const info = docByBasename.get(docName.toLowerCase());
                const docPath = (info && info.path) || ('docs/NOI-BO/bao-cao/' + docName);
                return `<button type="button" class="filter-btn text-xs text-emerald-300" data-doc-preview="${esc(docPath)}" data-doc-title="${esc((info && info.title) || docName)}">${ico('file-text', 14)} ${esc(docName)}</button>`;
              }).join('')}
              ${citedAnswers.map(ans => `<a href="https://support.google.com/youtube/answer/${esc(ans)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs text-gray-300">YT Help #${esc(ans)} ↗</a>`).join('')}
              ${citedHandles.map(handle => `<button type="button" class="filter-btn text-xs text-amber-300" data-open-tab="kenh-mau" data-kenh-handle="${esc(handle)}" title="Mở hồ sơ kênh ${esc(handle)}">${esc(handle)} ↗</button>`).join('')}
            </div>
          </div>
        </li>`;
      }).join('')}
    </ol>
    ${(cl.nguonChinhSach && cl.nguonChinhSach.length) ? `
    <div class="mt-4 pt-3 border-t border-hairline">
      <div class="text-xs font-semibold text-gray-400 mb-2">Văn bản chính sách gốc YouTube Partner Program (Google Help Center):</div>
      <div class="flex flex-wrap gap-1.5">
        ${cl.nguonChinhSach.map(u => {
          const label = u.includes('blog.youtube') ? 'YouTube Official Blog (YPP 2027)' : ('Help #' + (u.split('/').pop() || 'YPP'));
          return `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="filter-btn text-xs text-gray-300">${esc(label)} ↗</a>`;
        }).join('')}
      </div>
    </div>` : ''}
    <p class="text-xs text-gray-500 mt-3">${esc(cl.nguonDuLieu)}</p>
  </section>
</div>
  </div>`;
}

async function renderSoDoDb() {
  const requestedNodeQuery = String(state.sodoNode || '').trim();
  const defaultNodeQuery = requestedNodeQuery || 'project:h2dev-project';
  const deepQuery = state.sodoQ || '';
  const pathFromInit = String(state.sodoPathFrom || '').trim();
  const pathToInit = String(state.sodoPathTo || '').trim();

  const [kgStats, rawTraceRes, deepRes, initPathRes, ov] = await Promise.all([
    fetch('/api/kg/stats', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/api/kg/trace?q=' + encodeURIComponent(defaultNodeQuery), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    deepQuery
      ? fetch('/api/kg/deep?q=' + encodeURIComponent(deepQuery) + '&limit=8', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null),
    (pathFromInit && pathToInit)
      ? fetch('/api/kg/path?from=' + encodeURIComponent(pathFromInit) + '&to=' + encodeURIComponent(pathToInit), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null),
    loadOverviewSummary ? loadOverviewSummary().catch(() => null) : Promise.resolve(null)
  ]);

  let traceNotFoundQuery = '';
  let traceRes = rawTraceRes;
  if (requestedNodeQuery && (!rawTraceRes || !rawTraceRes.found)) {
    traceNotFoundQuery = requestedNodeQuery;
    traceRes = await fetch('/api/kg/trace?q=project%3Ah2dev-project', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => rawTraceRes);
  }

  const ms = (kgStats && kgStats.masterSummary) || ov || {};
  const msCounts = (ms && ms.counts) || (ov && ov.counts) || {};
  const dbCounts = ms.masterDbCounts || {};
  const sodoDeadCount = Number(ms.deadChannelsCount || msCounts.deadChannels || (ov && ov.deadChannelsCount) || 296);

  const nodesByLayer = safeArray(kgStats && kgStats.nodesByLayer);
  const nodesByType = safeArray(kgStats && kgStats.nodesByType);
  const edgesByRel = safeArray(kgStats && kgStats.edgesByRelation);
  const topHubs = safeArray(kgStats && kgStats.topConnectedHubs).slice(0, 10);
  const totalNodes = nodesByLayer.reduce((a, x) => a + (x.count || 0), 0) || 4851;
  const totalEdges = edgesByRel.reduce((a, x) => a + (x.count || 0), 0) || 9456;
  const knowNodes = (nodesByLayer.find(x => x.layer === 'knowledge') || {}).count || 3446;
  const infraNodes = (nodesByLayer.find(x => x.layer === 'infra') || {}).count || 1405;
  const projCount = (nodesByType.find(x => x.type === 'project') || {}).count || 18;
  const domainCount = (nodesByType.find(x => x.type === 'domain') || {}).count || 95;
  const dirCount = (nodesByType.find(x => x.type === 'directory') || {}).count || 327;
  const fileCount = (nodesByType.find(x => x.type === 'file') || {}).count || 964;
  const intelStats = (kgStats && kgStats.intelligenceStats) || {};
  const intelChannelsFmt = Number(intelStats.channelsCount || 544).toLocaleString('vi-VN');
  const intelBreakoutsFmt = Number(intelStats.breakoutCount || 286).toLocaleString('vi-VN');
  const intelVideosFmt = Number(intelStats.videosCount || 8079).toLocaleString('vi-VN');
  const intelOutliersFmt = Number(intelStats.outliersCount || 1504).toLocaleString('vi-VN');
  const intelEdgesFmt = Number(intelStats.cowatchEdgesCount || 3429).toLocaleString('vi-VN');
  const ftsTotalCount = Number(ms.ftsTotal || msCounts.ftsTotal || dbCounts.ftsTotal || 7165);
  const ftsTotalFmt = ftsTotalCount.toLocaleString('vi-VN');
  const obsidianFilesCount = Number(ms.obsidianFiles || knowNodes || 3446);
  const obsidianFilesFmt = obsidianFilesCount.toLocaleString('vi-VN') + ' nút';
  const masterLessonsCount = Number(dbCounts.lessons || msCounts.totalVideos || ms.totalVideos || ms.lessons || 355);
  const masterTimestampsCount = Number(dbCounts.timestamps || msCounts.timestamps || 2589).toLocaleString('vi-VN');
  const masterDocsCount = Number(dbCounts.documents || msCounts.documents || ms.documents || 761);
  const sodoH2Count = Number(msCounts.videosH2dev || ms.videosH2dev || (ov && ov.videosH2dev) || 162);
  const sodoHuanCount = Number(msCounts.videosHuan || ms.videosHuan || (ov && ov.videosHuan) || 140);
  const sodoDgmdCount = Number(msCounts.videosDgmd || ms.videosDgmd || (ov && ov.videosDgmd) || 53);
  const masterReupCount = Number(dbCounts.reupSources || msCounts.nguonReup || ms.reupSources || 52);
  const masterChannelsCount = Number(msCounts.channels || ms.channels || (ov && ov.channels) || 1740);
  const masterChannelsFmt = masterChannelsCount.toLocaleString('vi-VN');
  const masterTopVideosCount = Number(dbCounts.topVideos || msCounts.topVideos || 1421).toLocaleString('vi-VN');
  const masterNichesCount = Number(dbCounts.niches || msCounts.niches || 40);
  const masterPoliciesCount = Number(dbCounts.policies || msCounts.policies || 12);
  const masterChecklistsCount = Number(dbCounts.checklists || msCounts.checklists || 12);

  const normalizeGraphTargetUrl = (rawU, nodeType, nodeSku) => {
    let u = String(rawU || '').trim();
    if (!u && nodeType === 'video' && nodeSku) u = '/lotrinh/' + encodeURIComponent(nodeSku);
    const mPlayer = u.match(/^\/player\.html\?sku=([^&]+)/i);
    if (mPlayer) u = '/lotrinh/' + mPlayer[1];
    u = u.replace(/([?&])sub=checklist\b/i, '$1sub=policy');
    if (/^\/sodo(?:\?|$)/i.test(u)) return '';
    return u;
  };

  const tNode = (traceRes && traceRes.found && traceRes.targetNode) ? traceRes.targetNode : null;
  const tMeta = (tNode && tNode.meta) || {};
  const tChain = safeArray(traceRes && traceRes.lineageChain);
  const tOut = safeArray(traceRes && traceRes.outboundAll);
  const tIn = safeArray(traceRes && traceRes.inboundAll);
  const tWebUrl = normalizeGraphTargetUrl(tMeta.playerUrl || tMeta.targetUrl, tNode && tNode.type, tNode && tNode.sku);
  const tRawUrl = tMeta.rawUrl || '';
  const tRawId = tMeta.rawId || '';
  const tIsSopPreviewable = Boolean(tNode && tNode.type === 'sop' && tNode.path && !/^https?:/i.test(tNode.path));
  const tSopCode = tNode && tNode.type === 'sop' ? (tNode.id.replace(/^sop:/i, '') || ('DOC-' + String(tMeta.docId || 1).padStart(3, '0'))) : '';
  const tIsVideoSub = Boolean(tNode && tNode.type === 'video' && tNode.sku);

  const TYPE_META = {
    workspace: { vn: 'Không gian gốc', color: '#fb7185', sample: 'workspace:d-ytb' },
    project: { vn: 'Dự án & Pipeline', color: '#fb923c', sample: 'project:h2dev-project' },
    track: { vn: 'Nhánh đào tạo', color: '#f87171', sample: 'track:h2dev' },
    module: { vn: 'Học phần (Module)', color: '#fbbf24', sample: 'module:H2DEV-M01' },
    policy: { vn: 'Chính sách YouTube', color: '#f43f5e', sample: 'policy:P02' },
    checklist: { vn: 'Cổng duyệt trước đăng', color: '#fb7185', sample: 'checklist:CL04' },
    video: { vn: 'Video bài giảng', color: '#38bdf8', sample: 'video:VIDEO-53a547' },
    sop: { vn: 'Tài liệu SOP & Quy trình', color: '#818cf8', sample: 'sop:DOC-063' },
    niche: { vn: 'Ngách nội dung', color: '#34d399', sample: 'niche:everyday-history-en-lich-su-do-vat-thuong-ngay' },
    channel: { vn: 'Kênh mẫu & Case study', color: '#f472b6', sample: 'channel:suckhoedongy99' },
    tool: { vn: 'Công cụ AI & Sản xuất', color: '#c084fc', sample: 'tool:capcut' },
    domain: { vn: 'Nhánh dữ liệu hạ tầng', color: '#facc15', sample: 'project:h2dev-project' },
    directory: { vn: 'Thư mục mã nguồn', color: '#2dd4bf', sample: 'project:h2dev-project' },
    file: { vn: 'File thực thi & DB', color: '#60a5fa', sample: 'file:H2DEV-Project/server.js' }
  };

  const REL_VN = {
    HAS_PROJECT: 'Chứa dự án',
    HOSTS_TRACK: 'Quản lý nhánh',
    HAS_MODULE: 'Gồm học phần',
    HAS_VIDEO: 'Gồm bài giảng',
    BELONGS_TO_TRACK: 'Thuộc nhánh đào tạo',
    HAS_NICHE: 'Chứa ngách nội dung',
    HAS_POLICY: 'Trụ cột chính sách',
    HAS_CHECKLIST: 'Bước kiểm duyệt',
    ENFORCES_POLICY: 'Thực thi chính sách',
    CITES_VIDEO: 'Dẫn chứng bài học',
    CITES_CHANNEL: 'Dẫn chứng kênh',
    BENCHMARKS_CHANNEL: 'Phân tích kênh mẫu',
    ANALYZES_CHANNEL: 'Mổ xẻ kênh đối thủ',
    IN_NICHE: 'Thuộc ngách',
    USES_TOOL: 'Dùng công cụ',
    HAS_SOP: 'Tài liệu SOP',
    HAS_DOMAIN: 'Nhánh dữ liệu',
    CONTAINS_DIR: 'Thư mục con',
    CONTAINS_FILE: 'File thực thi',
    IMPORTS: 'Nạp module (Import)',
    INVOKES_SCRIPT: 'Gọi script thực thi',
    READS_DATA: 'Đọc dữ liệu từ',
    WRITES_DATA: 'Ghi dữ liệu ra',
    READS_WRITES_DATA: 'Đọc & ghi dữ liệu',
    VERIFIES_SCRIPT: 'Kiểm định bởi'
  };

  // Build Interactive SVG Radar Satellites (up to 12 distinct connected nodes around tNode)
  const satMap = new Map();
  tChain.forEach(c => {
    if (tNode && c.id !== tNode.id && !satMap.has(c.id)) {
      satMap.set(c.id, { id: c.id, label: c.label, type: c.type, rel: 'PHẢ HỆ GỐC', dir: '◄──' });
    }
  });
  tOut.forEach(o => {
    if (satMap.size < 12 && !satMap.has(o.target)) {
      satMap.set(o.target, { id: o.target, label: o.label || o.target, type: o.type || 'video', rel: REL_VN[o.relation] || o.relation, dir: '──►' });
    }
  });
  tIn.forEach(i => {
    if (satMap.size < 12 && !satMap.has(i.source)) {
      satMap.set(i.source, { id: i.source, label: i.label || i.source, type: i.type || 'project', rel: REL_VN[i.relation] || i.relation, dir: '◄──' });
    }
  });
  const satellites = [...satMap.values()];
  const cx = 380;
  const cy = 215;
  const centerColor = (tNode && TYPE_META[tNode.type] && TYPE_META[tNode.type].color) || '#38bdf8';
  const centerTypeVn = (tNode && TYPE_META[tNode.type] && TYPE_META[tNode.type].vn) || (tNode ? tNode.type : 'Tâm điểm');
  const centerShort = tNode ? (tNode.label.length > 34 ? tNode.label.slice(0, 32) + '…' : tNode.label) : 'Hệ Thống 97yo-dev';

  const svgEdgesHtml = [];
  const svgNodesHtml = [];
  satellites.forEach((sat, idx) => {
    const count = Math.max(1, satellites.length);
    const angle = -Math.PI / 2 + (idx / count) * Math.PI * 2;
    const rx = idx % 2 === 0 ? 272 : 224;
    const ry = idx % 2 === 0 ? 158 : 132;
    const sx = Math.round(cx + Math.cos(angle) * rx);
    const sy = Math.round(cy + Math.sin(angle) * ry);
    const cpx = Math.round((cx + sx) * 0.5 - (sy - cy) * 0.12);
    const cpy = Math.round((cy + sy) * 0.5 + (sx - cx) * 0.12);
    const mx = Math.round(cx + (sx - cx) * 0.57);
    const my = Math.round(cy + (sy - cy) * 0.57);
    const sCol = (TYPE_META[sat.type] && TYPE_META[sat.type].color) || '#38bdf8';
    const shortLbl = String(sat.label || sat.id).length > 25 ? String(sat.label || sat.id).slice(0, 24) + '…' : String(sat.label || sat.id);
    const pillW = Math.max(108, Math.min(205, shortLbl.length * 6.8 + 20));

    svgEdgesHtml.push(`
      <path class="h2-radar-flow" d="M ${cx} ${cy} Q ${cpx} ${cpy} ${sx} ${sy}" fill="none" stroke="${sCol}" stroke-width="1.8" stroke-opacity="0.55" stroke-dasharray="${sat.dir === '◄──' ? '4,3' : 'none'}" />
      <rect x="${mx - 42}" y="${my - 9}" width="84" height="17" rx="4" fill="#050505" fill-opacity="0.88" stroke="${sCol}" stroke-opacity="0.35" stroke-width="0.8" />
      <text x="${mx}" y="${my + 3}" text-anchor="middle" fill="#cbd5e1" font-size="12" font-family="Inter, system-ui, sans-serif">${esc(String(sat.rel).slice(0, 14))}</text>
    `);

    svgNodesHtml.push(`
      <g class="cursor-pointer" role="button" tabindex="0" aria-label="Đặt ${esc(sat.label)} làm Tâm điểm Sơ đồ (${esc(sat.rel)})" data-sodo-jump="${esc(sat.id)}">
        <title>Bấm để đặt "${esc(sat.label)}" làm Tâm điểm Sơ đồ (${esc(sat.rel)})</title>
        <rect x="${sx - pillW / 2}" y="${sy - 18}" width="${pillW}" height="36" rx="8" fill="#0f0f0f" stroke="${sCol}" stroke-width="1.5" />
        <circle cx="${sx - pillW / 2 + 12}" cy="${sy}" r="4.5" fill="${sCol}" />
        <text x="${sx - pillW / 2 + 22}" y="${sy + 4}" fill="#f8fafc" font-size="12" font-weight="600" font-family="Inter, system-ui, sans-serif">${esc(shortLbl)}</text>
      </g>
    `);
  });

  // Group all connected neighbors into clean semantic categories instead of a raw button dump
  const groupedNeighbors = [
    { key: 'video', title: 'Video Bài Giảng Liên Quan', badge: 'badge-blue', items: [] },
    { key: 'policy', title: 'Chính Sách & Checklist YPP', badge: 'badge-red', items: [] },
    { key: 'channel', title: 'Kênh Mẫu & Case Study Đối Chứng', badge: 'badge-amber', items: [] },
    { key: 'sop', title: 'Tài Liệu SOP & Quy Trình', badge: 'badge-green', items: [] },
    { key: 'niche_tool', title: 'Ngách Nội Dung & Công Cụ AI', badge: 'badge-blue', items: [] },
    { key: 'infra', title: 'Dự Án, Học Phần & File Hạ Tầng', badge: 'badge-muted', items: [] }
  ];
  const seenNb = new Set();
  const pushNeighbor = (nbObj, dir) => {
    const id = nbObj && (nbObj.target || nbObj.source || nbObj.id);
    if (!id || seenNb.has(id)) return;
    seenNb.add(id);
    const t = String(nbObj.type || '').toLowerCase();
    const sku = nbObj.sku || (t === 'video' ? id.replace(/^video:/i, '') : '');
    const item = {
      id,
      label: nbObj.label || id,
      type: t,
      sku,
      path: nbObj.path || '',
      rawId: nbObj.rawId || '',
      docId: nbObj.docId || null,
      targetUrl: normalizeGraphTargetUrl(nbObj.targetUrl, t, sku),
      relVn: REL_VN[nbObj.relation] || nbObj.relation,
      dir
    };
    if (t === 'video') groupedNeighbors[0].items.push(item);
    else if (t === 'policy' || t === 'checklist') groupedNeighbors[1].items.push(item);
    else if (t === 'channel') groupedNeighbors[2].items.push(item);
    else if (t === 'sop') groupedNeighbors[3].items.push(item);
    else if (t === 'niche' || t === 'tool') groupedNeighbors[4].items.push(item);
    else groupedNeighbors[5].items.push(item);
  };
  tOut.forEach(o => pushNeighbor(o, '──►'));
  tIn.forEach(i => pushNeighbor(i, '◄──'));
  const nonEmptyGroups = groupedNeighbors.filter(g => g.items.length > 0);

  const renderNeighborActionButtons = (it) => {
    const btns = [];
    if (it.type === 'sop' && it.path && !/^https?:/i.test(it.path)) {
      const sopCode = it.id.replace(/^sop:/i, '');
      btns.push(`<button type="button" class="filter-btn text-xs shrink-0" data-doc-preview="${esc(it.path)}" data-doc-title="${esc(it.label)}" data-doc-sku="${esc(it.sku || '')}" data-doc-code="${esc(sopCode)}" title="Đọc tài liệu SOP ngay tại chỗ">Đọc SOP</button>`);
    } else if (it.type === 'channel' && it.rawId) {
      btns.push(`<button type="button" class="filter-btn text-xs shrink-0 btn-open-raw-deep" data-raw-id="${esc(it.rawId)}" title="Soi hồ sơ Raw Kênh ngay tại chỗ">Hồ sơ Raw</button>`);
    } else if (it.type === 'video' && it.sku) {
      btns.push(`<button type="button" class="filter-btn text-xs shrink-0 btn-open-video-sub" data-sku="${esc(it.sku)}" data-title="${esc(it.label)}" title="Xem phụ đề &amp; tóm tắt bài học ngay tại chỗ">Xem Sub</button>`);
    }
    if (it.targetUrl) {
      btns.push(`<a href="${esc(it.targetUrl)}" data-sodo-spa-url="${esc(it.targetUrl)}" class="filter-btn text-xs shrink-0" title="Mở trang đích">${it.type === 'video' ? 'Xem bài ↗' : 'Mở ↗'}</a>`);
    }
    btns.push(`<button type="button" class="filter-btn text-xs shrink-0" data-sodo-jump="${esc(it.id)}" title="Đặt thực thể này làm Tâm điểm Sơ đồ">Soi mạch</button>`);
    return btns.join('');
  };

  const renderPathResultHtml = (d) => {
    if (!d) return '';
    if (!d.found) {
      return `<div class="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300" role="alert">${esc(d.error || 'Không tìm thấy đường nối giữa 2 thực thể này.')}</div>`;
    }
    return `
      <div class="p-3 rounded-xl bg-surface-2 border border-border text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span class="font-semibold text-emerald-400">Tìm thấy đường nối ngắn nhất (${d.hops} bước · ${d.latencyMs} ms)</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${safeArray(d.pathNodes).map((n, idx) => {
            const pEdges = safeArray(d.pathEdges);
            const relStr = idx < pEdges.length ? (REL_VN[pEdges[idx].relation] || pEdges[idx].relation) : '';
            return `
              <button type="button" class="filter-btn text-xs" data-sodo-jump="${esc(n.id)}">[${esc(String(n.type || '').toUpperCase())}] ${esc(n.label)}</button>
              ${idx < pEdges.length ? `<span class="text-gray-400 font-mono">${esc(pEdges[idx].dir)} (${esc(relStr)}) ${esc(pEdges[idx].dir)}</span>` : ''}
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  return `
  <!-- SECTION 1: SƠ ĐỒ MẠCH LIÊN KẾT TRỰC QUAN TƯƠNG TÁC NGAY TẠI CHỖ (INTERACTIVE RADAR & LINEAGE DIAGRAM ABOVE THE FOLD) -->
  <section class="card p-4 sm:p-5 mb-6 border-border-strong bg-surface">
    ${traceNotFoundQuery ? `
    <div class="p-3 mb-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs" role="alert">
      <div class="text-amber-200">
        ${ico('alert-triangle', 14)} <strong class="text-white">Không tìm thấy thực thể khớp với mã "${esc(traceNotFoundQuery)}".</strong> Hệ thống đã tự động hiển thị Tâm điểm gốc <code class="font-mono text-amber-300">project:h2dev-project</code> để không làm đứt luồng tra cứu.
      </div>
      <button type="button" class="filter-btn text-xs shrink-0" data-sodo-jump="project:h2dev-project">Khôi phục Tâm điểm gốc</button>
    </div>
    ` : ''}
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
      <div>
        <div class="text-xs font-mono text-brand-300 font-bold uppercase tracking-wider">Sơ đồ DB &amp; Mạch liên kết trực quan (${totalNodes.toLocaleString('vi-VN')} nút · ${totalEdges.toLocaleString('vi-VN')} mạch · 0 mồ côi)</div>
        <h2 class="page-h2 mb-0 mt-0.5">Tâm Điểm: ${esc(tNode ? tNode.label : 'Hệ Thống Lõi 97yo-dev')}</h2>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        ${tIsSopPreviewable ? `<button type="button" class="btn-primary text-xs px-3 py-1.5" data-doc-preview="${esc(tNode.path)}" data-doc-title="${esc(tNode.label)}" data-doc-sku="${esc(tNode.sku || '')}" data-doc-code="${esc(tSopCode)}">${ico('book-open', 14)} Đọc SOP Ngay</button>` : ''}
        ${tRawId ? `<button type="button" class="btn-primary text-xs px-3 py-1.5 btn-open-raw-deep" data-raw-id="${esc(tRawId)}">${ico('bar-chart-3', 14)} Mở Hồ Sơ Raw (${esc(tRawId)})</button>` : ''}
        ${tIsVideoSub ? `<button type="button" class="filter-btn text-xs btn-open-video-sub" data-sku="${esc(tNode.sku)}" data-title="${esc(tNode.label)}">${ico('scroll-text', 14)} Xem Sub &amp; Kịch Bản</button>` : ''}
        ${tWebUrl ? `<a href="${esc(tWebUrl)}" data-sodo-spa-url="${esc(tWebUrl)}" class="btn-primary text-xs px-3 py-1.5">↗ Mở Trang Đích</a>` : ''}
        ${tRawUrl && tRawUrl !== tWebUrl ? `<a href="${esc(tRawUrl)}" data-sodo-spa-url="${esc(tRawUrl)}" class="filter-btn text-xs">${ico('trending-up', 14)} Raw Kênh ↗</a>` : ''}
        <a href="/graph?mode=graph${tNode ? ('&node=' + encodeURIComponent(tNode.id)) : ''}" class="filter-btn text-xs inline-flex items-center gap-1.5">${ico('compass', 14)} Đồ Thị Obsidian <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></a>
        <a href="/graph${tNode ? ('?node=' + encodeURIComponent(tNode.id)) : ''}" class="filter-btn text-xs inline-flex items-center gap-1.5">${ico('layers', 14)} Sơ Đồ 5 Cột &amp; ${projCount} Dự Án <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></a>
      </div>
    </div>

    <!-- Thanh chuyển nhanh Tâm điểm Sơ đồ (1-Click Visual Hub Presets) -->
    <div class="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-hairline">
      <span class="text-xs font-semibold text-gray-400 mr-1">Tâm điểm:</span>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'project:h2dev-project' ? 'active' : ''}" data-sodo-jump="project:h2dev-project">${ico('globe', 14)} 97yo-dev</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'policy:P02' ? 'active' : ''}" data-sodo-jump="policy:P02">${ico('shield', 14)} Chính sách #P02</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'checklist:CL04' ? 'active' : ''}" data-sodo-jump="checklist:CL04">${ico('check', 14)} Checklist #CL04</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'track:h2dev' ? 'active' : ''}" data-sodo-jump="track:h2dev">${ico('graduation-cap', 14)} H2DEV (${sodoH2Count})</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'track:huan' ? 'active' : ''}" data-sodo-jump="track:huan">${ico('star', 14)} Huân AI (${sodoHuanCount})</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'track:dgmd' ? 'active' : ''}" data-sodo-jump="track:dgmd">${ico('zap', 14)} DGMD (${sodoDgmdCount})</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'video:VIDEO-53a547' ? 'active' : ''}" data-sodo-jump="video:VIDEO-53a547">${ico('clapperboard', 14)} VIDEO-53a547</button>
      <button type="button" class="filter-btn text-xs ${tNode && tNode.id === 'niche:everyday-history-en-lich-su-do-vat-thuong-ngay' ? 'active' : ''}" data-sodo-jump="niche:everyday-history-en-lich-su-do-vat-thuong-ngay">${ico('sparkles', 14)} Everyday History</button>
    </div>

    <!-- KHUNG VẼ SƠ ĐỒ RADAR SVG TRỰC QUAN NGAY ĐẦU TRANG (ABOVE THE FOLD PC & MOBILE) -->
    <div class="rounded-xl border border-border overflow-hidden mb-3" style="background:radial-gradient(circle at 50% 50%, #0f0f0f 0%, #050505 85%);">
      <div class="px-3.5 py-2 border-b border-hairline flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>${ico('lightbulb', 14)} <b class="text-white">Sơ đồ Mạch Liên Kết Trực Tiếp:</b> Bấm vào bất kỳ nút vệ tinh nào trên sơ đồ để dịch chuyển tâm điểm.</span>
        <span class="font-mono text-sky-400">${tOut.length} mạch đi (──►) · ${tIn.length} mạch đến (◄──) · ${tNode ? traceRes.latencyMs : 0} ms</span>
      </div>
      <div class="w-full overflow-x-auto">
        <svg viewBox="0 0 760 400" class="w-full block" style="height:auto;max-height:390px;min-width:560px;" role="img" aria-label="Sơ đồ mạng lưới liên kết trực quan của thực thể đang chọn">
          <!-- Vòng radar định vị -->
          <ellipse cx="${cx}" cy="${cy}" rx="195" ry="118" fill="none" stroke="#38bdf8" stroke-opacity="0.12" stroke-dasharray="4,4" />
          <ellipse cx="${cx}" cy="${cy}" rx="255" ry="152" fill="none" stroke="#38bdf8" stroke-opacity="0.16" stroke-dasharray="3,6" />
          <!-- Các đường cong nối (Bezier Edges) -->
          ${svgEdgesHtml.join('')}
          <!-- Các nút vệ tinh (Satellite Nodes) -->
          ${svgNodesHtml.join('')}
          <!-- Nút Tâm Điểm (Center Hub Node) -->
          <g>
            <ellipse cx="${cx}" cy="${cy}" rx="122" ry="38" fill="${centerColor}" fill-opacity="0.18" />
            <rect x="${cx - 114}" y="${cy - 28}" width="228" height="56" rx="12" fill="#0f0f0f" stroke="${centerColor}" stroke-width="2.5" />
            <text x="${cx}" y="${cy - 7}" text-anchor="middle" fill="${centerColor}" font-size="12" font-weight="700" font-family="Inter, system-ui, sans-serif">${esc(centerTypeVn.toUpperCase())} (DEG: ${tNode ? tNode.degree : 0})</text>
            <text x="${cx}" y="${cy + 13}" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="Inter, system-ui, sans-serif">${esc(centerShort)}</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Chuỗi Phả Hệ Từ Gốc Tới Đỉnh (Visual Stepper) -->
    <div class="p-3 rounded-xl bg-surface-2 border border-border mb-4">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span class="text-xs font-semibold text-gray-300">Chuỗi Phả Hệ Từ Gốc Tới Đỉnh (${tChain.length} cấp) — Bấm vào cấp bất kỳ để nhảy:</span>
        ${tNode ? `<span class="text-xs font-mono text-emerald-400 break-all">ID: ${esc(tNode.id)} · Degree: ${tNode.degree}</span>` : ''}
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        ${tChain.map((c, idx) => {
          const cMeta = TYPE_META[c.type] || { vn: c.type, color: '#38bdf8' };
          const isActiveStep = Boolean(tNode && c.id === tNode.id);
          return `
            <button type="button" class="filter-btn text-xs ${isActiveStep ? 'active' : ''}" data-sodo-jump="${esc(c.id)}">
              <span class="font-mono ${isActiveStep ? '' : 'text-sky-300'} mr-1">[${esc(cMeta.vn)}]</span><span>${esc(c.label)}</span>
            </button>
            ${idx < tChain.length - 1 ? '<span class="text-gray-400 font-mono">──►</span>' : ''}
          `;
        }).join('')}
      </div>
    </div>

    <!-- DANH SÁCH MẠCH LIÊN KẾT ĐƯỢC PHÂN NHÓM RÕ RÀNG THEO LOẠI THỰC THỂ -->
    <div>
      <h3 class="text-sm font-bold text-white mb-2.5">Chi Tiết Các Mạch Liên Kết Của "${esc(tNode ? tNode.label : '')}" (Phân nhóm theo vai trò):</h3>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        ${nonEmptyGroups.map(g => `
          <div class="p-3.5 rounded-xl bg-surface-2 border border-border flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-hairline">
                <span class="text-xs font-bold text-white">${esc(g.title)}</span>
                <span class="badge ${g.badge} font-mono">${g.items.length}</span>
              </div>
              <div class="space-y-1.5 overflow-y-auto" style="max-height:240px;">
                ${g.items.slice(0, 25).map(it => `
                  <div class="p-2 rounded-lg bg-surface border border-hairline flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0 flex-1">
                      <span class="text-sky-300 font-mono">${esc(it.dir)} ${esc(it.relVn)}:</span>
                      <div class="text-white font-medium truncate" title="${esc(it.label)}">${esc(it.label)}</div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      ${renderNeighborActionButtons(it)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('') || '<div class="text-xs text-gray-400">Thực thể này hiện chưa có liên kết phụ thuộc.</div>'}
      </div>
    </div>
  </section>

  ${pageBanner('Chỉ Số Kiến Trúc Dual-DB (SQLite FTS5 + Đồ Thị Nexus)', `Đồng bộ tự động Zero-Touch giữa kho chỉ mục văn bản FTS5 BM25 (${ftsTotalFmt} mục) và đồ thị phả hệ đa dự án (${totalNodes.toLocaleString('vi-VN')} nút · ${totalEdges.toLocaleString('vi-VN')} mạch nối)`, [
    { icon: ICONS.grid, label: 'Tổng Nút Đồ Thị (Nodes)', value: totalNodes.toLocaleString('vi-VN'), sub: `${knowNodes.toLocaleString('vi-VN')} Tri thức · ${infraNodes.toLocaleString('vi-VN')} Hạ tầng (${projCount} dự án)` },
    { icon: ICONS.link, label: 'Mạch Liên Kết (Edges)', value: totalEdges.toLocaleString('vi-VN'), sub: `${edgesByRel.length || 24} loại quan hệ · 100% có đường về gốc` },
    { icon: ICONS.search, label: 'Chỉ Mục FTS5 Master DB', value: ftsTotalFmt, sub: `10 bảng chuẩn hóa · tốc độ < 2ms (BM25 + Fold Tiếng Việt)` },
    { icon: ICONS.doc, label: 'Obsidian Vault Tri Thức', value: obsidianFilesFmt, sub: `Đồng bộ tự động Zero-Touch · xem trực tiếp trên /graph` }
  ])}

  <!-- SECTION 2: TRẠM TRUY VẤN SÂU ĐA LUỒNG (q1 | q2 | q3) & DÒ ĐƯỜNG ĐI NGẮN NHẤT (PATH TRACER) -->
  <section class="card p-4 sm:p-5 mb-6 border-border">
    <div class="mb-3">
      <div class="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Công cụ bóc tách dữ liệu tốc độ cao (&lt; 2ms) cho Người dùng &amp; AI Agent</div>
      <h2 class="page-h2 mb-1 mt-0.5">4 Kịch Bản Thao Tác Thực Chiến &amp; Bóc Tách Đa Luồng</h2>
      <p class="text-xs text-gray-400">Chọn nhanh kịch bản bên dưới hoặc nhập nhiều từ khóa cách nhau bởi dấu <code class="text-brand-300 font-mono">|</code> để quét đồng thời cả Master DB FTS5 lẫn Đồ thị Nexus:</p>
    </div>

    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between">
        <div>
          <span class="badge badge-green mb-1.5">1. NGƯỜI MỚI / SOLO CREATOR</span>
          <h3 class="text-sm font-bold text-white">Chọn Ngách Xanh &amp; Xem Bài Học Mẫu</h3>
          <p class="text-xs text-gray-400 mt-1">Từ ngách sạch (Everyday History EN, Đông Y) xem ngay kênh mẫu sống và bài giảng hướng dẫn từng bước.</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button type="button" class="filter-btn text-xs" data-sodo-jump="niche:everyday-history-en-lich-su-do-vat-thuong-ngay" data-sodo-q="US_EverydayHistory | VIDEO-53a547">Everyday History ↗</button>
          <button type="button" class="filter-btn text-xs" data-sodo-jump="channel:suckhoedongy99" data-sodo-q="suc khoe dong y | VIDEO-73c662">Đông Y &amp; Podcast ↗</button>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between">
        <div>
          <span class="badge badge-red mb-1.5">2. PHÒNG TRÁNH KÊNH DIE / 404</span>
          <h3 class="text-sm font-bold text-white">Giải Phẫu ${sodoDeadCount} Case Study Kênh DIE</h3>
          <p class="text-xs text-gray-400 mt-1">Xem rõ lý do kênh bị tắt kiếm tiền / xóa kênh và bài giảng nào đã mổ xẻ lỗi đó.</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button type="button" class="filter-btn text-xs" data-sodo-jump="policy:P02" data-sodo-q="P02 | Inauthentic | Reused">Lý do tắt kiếm tiền P02 ↗</button>
          <button type="button" class="filter-btn text-xs" data-open-tab="kenh-mau" data-kenh-status="dead">Mở ${sodoDeadCount} Kênh DIE →</button>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between">
        <div>
          <span class="badge badge-amber mb-1.5">3. DUYỆT VIDEO TRƯỚC KHI ĐĂNG</span>
          <h3 class="text-sm font-bold text-white">12 Trụ Cột Chính Sách &amp; 12 Checklist</h3>
          <p class="text-xs text-gray-400 mt-1">Kiểm tra Originality &gt;= 3/5, rào chắn YMYL Sức khỏe/Tài chính, nhạc Suno AI và chống trùng lặp template.</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button type="button" class="filter-btn text-xs" data-sodo-jump="checklist:CL04" data-sodo-q="CL04 | P04 | P06">Checklist Hậu kỳ 5 Lớp ↗</button>
          <button type="button" class="filter-btn text-xs" data-quick-action="cross-tab" data-quick-target="chienluoc" data-quick-patch='{"clSubTab":"policy"}'>Mở Bảng Tick 12 Cổng →</button>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-surface-2 border border-hairline flex flex-col justify-between">
        <div>
          <span class="badge badge-blue mb-1.5">4. ĐỘI SẢN XUẤT / AI AGENT</span>
          <h3 class="text-sm font-bold text-white">Truy Vết Đa Luồng SKU · DOC · RAW</h3>
          <p class="text-xs text-gray-400 mt-1">Tra cứu tức thì nhiều mã bài học, tài liệu SOP, hồ sơ Raw và file hạ tầng trong 1 truy vấn kết hợp.</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button type="button" class="filter-btn text-xs" data-sodo-jump="video:VIDEO-53a547" data-sodo-q="VIDEO-53a547 | DOC-063 | RAW-001">Chạy thử 3 luồng ↗</button>
          <button type="button" class="filter-btn text-xs" data-sodo-jump="project:h2dev-project" data-sodo-q="dai gia mang dep | ZOOM-04">Nhánh DGMD &amp; Zoom ↗</button>
        </div>
      </div>
    </div>

    <!-- Thanh Tìm Kiếm Sâu Đa Luồng (Multi-Query Deep Search) -->
    <form id="sodo-deep-form" class="flex flex-col sm:flex-row gap-2.5 sm:items-center pt-3 border-t border-hairline">
      <label class="sr-only" for="sodo-deep-q">Tìm kiếm sâu đa luồng</label>
      <input id="sodo-deep-q" type="search" value="${esc(deepQuery)}" placeholder="Nhập 1 hoặc nhiều truy vấn cách nhau bởi dấu | (VD: suc khoe dong y | VIDEO-53a547 | DOC-063 | P02)..." class="search-input-premium flex-1 min-w-0 text-xs py-2.5">
      <div class="flex items-center gap-2 shrink-0">
        <button type="submit" class="btn-primary text-xs px-4 py-2.5">Bóc tách đa luồng</button>
        ${deepQuery ? `<button type="button" id="sodo-deep-clear" class="filter-btn text-xs px-3 py-2.5">Xóa</button>` : ''}
      </div>
    </form>

    ${deepRes && safeArray(deepRes.batches).length ? `
    <div class="mt-4 pt-3 border-t border-hairline space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>Kết quả bóc tách song song <b class="text-white">${deepRes.totalQueries} luồng truy vấn</b> trên cả 2 DB</span>
        <span class="font-mono text-emerald-400">Tổng thời gian: ${deepRes.totalLatencyMs} ms</span>
      </div>
      <div class="grid lg:grid-cols-2 gap-3">
        ${safeArray(deepRes.batches).map(b => `
          <div class="p-3.5 rounded-xl bg-surface-2 border border-border flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-white font-mono">Luồng: "${esc(b.query)}"</span>
              <span class="text-xs font-mono text-sky-400">${b.latencyMs} ms · ${b.masterFtsCount} FTS · ${b.graphFtsCount} Nút</span>
            </div>
            ${b.exactNodeFound ? `
              <div class="p-2 rounded-lg bg-brand-950/20 border border-brand-500/40 text-xs flex flex-wrap items-center justify-between gap-2">
                <span class="text-gray-200">Khớp chính xác nút: <b class="text-brand-300">${esc(b.exactNodeFound.label)}</b> (${b.outboundCount} đi · ${b.inboundCount} đến)</span>
                <button type="button" class="filter-btn text-xs" data-sodo-jump="${esc(b.exactNodeFound.id)}">Đặt làm tâm điểm ↑</button>
              </div>
            ` : ''}
            <div class="space-y-1.5">
              <div class="text-xs font-semibold text-gray-400">Top kết quả Master DB FTS5 (${b.masterFtsCount}):</div>
              ${safeArray(b.masterResults).slice(0, 4).map(r => {
                const et = String(r.entity_type || '').toLowerCase();
                const dest = (window.H2Search && window.H2Search.ftsDestination) ? window.H2Search.ftsDestination(et, r) : null;
                const cleanTitle = String(r.title || r.entity_id || '').replace(/<\/?mark>/g, '');
                const href = (dest && dest.href) || r.targetUrl || '';
                const isRawHit = Boolean(r.raw_id);
                return `<div class="p-2 rounded-lg bg-surface border border-hairline text-xs flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <span class="badge badge-muted mr-1">${esc(r.entity_type)}</span>
                    <span class="text-white font-medium">${esc(cleanTitle)}</span>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    ${isRawHit ? `<button type="button" class="filter-btn text-xs btn-open-raw-deep" data-raw-id="${esc(r.raw_id)}">Hồ sơ Raw</button>` : ''}
                    ${href ? `<a href="${esc(href)}" data-sodo-spa-url="${esc(href)}" class="text-brand-300 hover:text-white shrink-0 font-mono">Mở ↗</a>` : ''}
                  </div>
                </div>`;
              }).join('') || '<div class="text-xs text-gray-500">Không có kết quả FTS5</div>'}
            </div>
            <div class="space-y-1.5 pt-1">
              <div class="text-xs font-semibold text-gray-400">Top nút Đồ thị Nexus (${b.graphFtsCount}):</div>
              <div class="flex flex-wrap gap-1.5">
                ${safeArray(b.graphResults).slice(0, 5).map(gn => `
                  <button type="button" class="filter-btn text-xs" data-sodo-jump="${esc(gn.id)}" title="${esc(gn.path || gn.id)}">[${esc(gn.type.toUpperCase())}] ${esc(gn.label.slice(0, 38))}</button>
                `).join('') || '<span class="text-xs text-gray-500">Không có nút khớp</span>'}
              </div>
            </div>
            ${safeArray(b.intelResults).length ? `
            <div class="space-y-1.5 pt-1">
              <div class="text-xs font-semibold text-gray-400">Top kết quả Intelligence DB (${b.intelCount || b.intelResults.length}):</div>
              ${safeArray(b.intelResults).slice(0, 3).map(ir => {
                const isChan = String(ir.entity_type || '').toUpperCase().includes('CHANNEL');
                const eid = ir.entity_id || ir.id || '';
                const extHref = isChan
                  ? (ir.handle ? `https://www.youtube.com/${encodeURIComponent(ir.handle).replace(/^%40/, '@')}` : `https://www.youtube.com/channel/${encodeURIComponent(eid)}`)
                  : `https://www.youtube.com/watch?v=${encodeURIComponent(eid)}`;
                return `<div class="p-2 rounded-lg bg-surface border border-hairline text-xs flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <span class="badge badge-muted mr-1">${esc(ir.entity_type)}</span>
                    <span class="text-white font-medium">${esc(String(ir.title || eid))}</span>
                    ${ir.snippet ? `<span class="text-gray-400 ml-1">(${esc(ir.snippet)})</span>` : ''}
                  </div>
                  <a href="${esc(extHref)}" target="_blank" rel="noopener noreferrer" class="text-brand-300 hover:text-white shrink-0 font-mono">YouTube ↗</a>
                </div>`;
              }).join('')}
            </div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- Bộ Truy Vết Đường Đi Ngắn Nhất Giữa 2 Thực Thể Bất Kỳ (BFS Shortest Path) -->
    <div class="mt-4 pt-3 border-t border-hairline">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div class="text-xs font-semibold text-gray-300">Dò đường liên kết ngắn nhất giữa 2 thực thể bất kỳ (BFS Path Tracer):</div>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs text-gray-400">Mẫu nhanh:</span>
          <button type="button" class="filter-btn text-xs" data-sodo-path-from="VIDEO-53a547" data-sodo-path-to="policy:P02">VIDEO-53a547 → P02</button>
          <button type="button" class="filter-btn text-xs" data-sodo-path-from="RAW-001" data-sodo-path-to="track:h2dev">RAW-001 → H2DEV</button>
          <button type="button" class="filter-btn text-xs" data-sodo-path-from="DOC-063" data-sodo-path-to="checklist:CL04">DOC-063 → CL04</button>
          <button type="button" class="filter-btn text-xs" data-sodo-path-from="server.js" data-sodo-path-to="h2dev_master.db">server.js → master.db</button>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input id="sodo-path-from" type="text" value="${esc(pathFromInit || (tNode ? tNode.id : 'VIDEO-53a547'))}" placeholder="Điểm A (VD: VIDEO-53a547, P02, RAW-001)" class="search-input-premium flex-1 text-xs py-2" aria-label="Điểm xuất phát">
        <span class="text-xs text-gray-400 font-mono text-center">──►</span>
        <input id="sodo-path-to" type="text" value="${esc(pathToInit || ((tNode && tNode.id === 'policy:P02') ? 'VIDEO-53a547' : 'policy:P02'))}" placeholder="Điểm B (VD: policy:P02, server.js)" class="search-input-premium flex-1 text-xs py-2" aria-label="Điểm đích">
        <button type="button" id="sodo-path-btn" class="filter-btn text-xs px-3.5 py-2 shrink-0">Dò đường nối</button>
      </div>
      <div id="sodo-path-result" class="mt-2.5">${renderPathResultHtml(initPathRes)}</div>
    </div>
  </section>

  <!-- SECTION 3: BẢN ĐỒ KIẾN TRÚC 14 LOẠI THỰC THỂ ĐỒ THỊ ↔ 10 BẢNG MASTER DB & TOP HUBS -->
  <div class="grid lg:grid-cols-2 gap-4 mb-6">
    <section class="card p-4 sm:p-5 min-w-0">
      <h2 class="page-h2 mb-1">Phân Bổ 14 Loại Thực Thể Trên Đồ Thị (${totalNodes.toLocaleString('vi-VN')} Nút)</h2>
      <p class="text-xs text-gray-400 mb-3">Bấm vào bất kỳ loại thực thể nào để nạp ngay nhánh đại diện lên Sơ đồ Tâm Điểm phía trên:</p>
      <div class="space-y-2">
        ${nodesByType.map(nt => {
          const meta = TYPE_META[nt.type] || { vn: nt.type, color: '#38bdf8', sample: 'project:h2dev-project' };
          const pct = Math.max(3, Math.min(100, Math.round((nt.count / Math.max(1, totalNodes)) * 100)));
          return `
            <div class="p-2 rounded-xl bg-surface-2 border border-hairline flex items-center justify-between gap-3 text-xs">
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-semibold text-white">${esc(meta.vn)} <span class="text-gray-400 font-mono">(${esc(nt.type)})</span></span>
                  <span class="font-mono font-bold text-brand-300">${nt.count} nút</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                  <div class="h-full rounded-full" style="width:${pct}%;background:${meta.color};"></div>
                </div>
              </div>
              <button type="button" class="filter-btn text-xs shrink-0" data-sodo-jump="${esc(meta.sample)}">Soi nhánh <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <section class="card p-4 sm:p-5 min-w-0 flex flex-col justify-between gap-4">
      <div>
        <h2 class="page-h2 mb-1">Kiến Trúc 3 Tầng Cơ Sở Dữ Liệu Liên Hợp</h2>
        <p class="text-xs text-gray-400 mb-3">Mọi thay đổi dữ liệu đều được đồng bộ tự động qua 3 tầng lưu trữ:</p>
        <div class="space-y-3">
          <div class="p-3.5 rounded-xl bg-surface-2 border border-border">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="badge badge-blue">TẦNG 1 · MASTER DB</span>
              <span class="text-xs font-mono text-emerald-400">data/h2dev_master.db (10 Bảng · ${ftsTotalFmt} FTS5)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">Lưu trữ chuẩn hóa ${masterLessonsCount} bài giảng, ${masterTimestampsCount} mốc thời gian, ${masterChannelsFmt} kênh đối thủ, ${masterTopVideosCount} top video + transcript, ${masterDocsCount} tài liệu SOP, ${masterNichesCount} dòng ngách, ${masterReupCount} nguồn reup, ${masterPoliciesCount} chính sách &amp; ${masterChecklistsCount} checklist.</p>
            <div class="mt-2 pt-2 border-t border-hairline flex flex-wrap gap-1.5">
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/scripts/build_master_db.js">build_master_db.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/scripts/master_dal.js">master_dal.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-surface-2 border border-border">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="badge badge-green">TẦNG 2 · NEXUS GRAPH DB</span>
              <span class="text-xs font-mono text-sky-400">data/h2dev_knowledge_graph.db (${totalNodes.toLocaleString('vi-VN')} Nút · ${totalEdges.toLocaleString('vi-VN')} Cạnh)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">Đồ thị thuộc tính 2 lớp: Lớp Tri Thức (${knowNodes.toLocaleString('vi-VN')} nút) nối trực tiếp với Lớp Hạ Tầng (${infraNodes.toLocaleString('vi-VN')} nút: ${projCount} dự án, ${domainCount} nhánh data, ${dirCount} thư mục, ${fileCount} file thực thi).</p>
            <div class="mt-2 pt-2 border-t border-hairline flex flex-wrap gap-1.5">
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/scripts/build_knowledge_vault_graph.js">build_knowledge_vault_graph.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/scripts/kg_query.js">kg_query.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-surface-2 border border-border">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="badge badge-amber">TẦNG 3 · INTELLIGENCE DB &amp; LIVE API</span>
              <span class="text-xs font-mono text-amber-300">data/intelligence.db (${intelChannelsFmt} Kênh · ${intelVideosFmt} Video)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">Kho tình báo đối thủ (${intelBreakoutsFmt} kênh Breakout · ${intelOutliersFmt} video Outlier &ge;3x · ${intelEdgesFmt} cạnh Co-Watch) &amp; API phản hồi &lt; 2ms: <code class="text-gray-200">/api/kg/deep</code>, <code class="text-gray-200">/api/kg/trace</code>, <code class="text-gray-200">/api/kg/path</code>, <code class="text-gray-200">/api/intelligence/breakouts</code>.</p>
            <div class="mt-2 pt-2 border-t border-hairline flex flex-wrap gap-1.5">
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/server.js">server.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
              <button type="button" class="filter-btn text-xs" data-sodo-jump="file:H2DEV-Project/scripts/kg_auto_sync.js">kg_auto_sync.js <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Top Tâm Điểm Kết Nối Cao Nhất (Hubs):</h3>
        <div class="flex flex-wrap gap-1.5">
          ${topHubs.map(h => `
            <button type="button" class="filter-btn text-xs" data-sodo-jump="${esc(h.id)}" title="${esc(h.path || h.id)}">${esc(h.label.slice(0, 28))} (${h.degree}) <span class="h2-ico-arrow inline-flex">${ico('arrow-up-right', 14)}</span></button>
          `).join('')}
        </div>
      </div>
    </section>
  </div>`;
}

    return {
      renderTongQuan: renderTongQuan,
      renderVideo: renderVideo,
      renderNgachXanh: renderNgachXanh,
      renderKichBan: renderKichBan,
      renderNhac: renderNhac,
      renderNguonReup: renderNguonReup,
      renderRawKenh: renderRawKenh,
      renderKenh: renderKenh,
      renderChienLuoc: renderChienLuoc,
      renderSoDoDb: renderSoDoDb
    };
  }

  global.H2TabContent = { createTabContent: createTabContent };
})(typeof window !== 'undefined' ? window : globalThis);
