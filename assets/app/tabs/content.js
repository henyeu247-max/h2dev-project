/* H2TabContent - G3.1 extract: 8 tab renderers from index.html */
(function (global) {
  'use strict';
  const SC = (typeof window !== 'undefined' && window.H2SearchCore) || {
    tokenize: (t) => String(t||'').toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean),
    matchesQuery: (parts, q) => {
      const kw = String(q||'').toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
      if (!kw.length) return true;
      const hay = (parts||[]).map(x => x==null?'':String(x)).join(' ').toLowerCase().replace(/[^a-z0-9+]+/g,' ');
      return kw.every(k => hay.indexOf(k) >= 0);
    },
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

async function renderTongQuan() {
  const videos = await loadJSON('data-tabs/videos.json');
  const kenh = await loadJSON('data-tabs/kenh-mau.json');
  const kich = await loadJSON('data-tabs/tai-lieu-full.json');
  const slim = await loadJSON('data/catalog.json');
  const nx = await loadJSON('data-tabs/ngach-xanh.json');
  const diskMb = slim.reduce((a, v) => a + (v.size_mb || 0), 0);
  const free = videos.filter(v => v.free).length;
  const market = {}; let emptyMarket = 0;
  videos.forEach(v => {
    if (!v.market || !v.market.length) emptyMarket++;
    else v.market.forEach(m => market[m] = (market[m] || 0) + 1);
  });
  const marketRows = Object.entries(market).sort((a, b) => b[1] - a[1]);
  if (emptyMarket) marketRows.push(['Chưa gắn', emptyMarket]);
  const liveFile = kich.filter(x => x.file).length;
  const overviewNiches = nx.ngachXanh.slice(0, 6); // UI-balance: canh 6 row nhu market
  const modulesData = await loadJSON('data/modules.json').catch(() => ({ modules: [] }));
  const moduleCount = safeArray(modulesData.modules).length || safeArray(modulesData).length;
  return `
  <div class="tq-head mb-6">
<div class="flex items-center gap-3">
  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-brand-tint text-brand-tint-fg border border-brand/30">
    <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>RADAR KHO
  </span>
  <p class="page-lede">${videos.length} video · ${kich.length} tài liệu · ${kenh.filter(k=>!k.dead).length} kênh live · ${fmtMb(diskMb)}</p>
</div>
<button type="button" class="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5" data-open-tab="lotrinh">
  <span>${moduleCount ? 'Lộ trình ' + moduleCount + ' module' : 'Lộ trình học'}</span>
  <span class="text-xs font-mono">→</span>
</button>
  </div>
  <div class="bento-grid mb-6">
${statCard(ICONS.video, 'Video khóa học', videos.length, `${free} bài Free · ${videos.length - free} bài Pro`, 'video')}
${statCard(ICONS.doc, 'Kịch bản & Tài liệu', kich.length, `${liveFile} file local · catalog`, 'kichban')}
${statCard(ICONS.channel, 'Kênh mẫu', kenh.filter(k=>!k.dead).length, `${kenh.length} kênh · ${kenh.filter(k=>k.dead).length} dead ẩn`, 'kenh')}
${statCard(ICONS.disk, 'Dung lượng đĩa', fmtMb(diskMb), `${SC.pad2(videos.length)} video · catalog local`, 'video')}
  </div>
  ${(function () {
      const w = loadWatched();
      let watched = 0, inprog = 0;
      videos.forEach(v => {
        const r = w[v.sku];
        if (!r) return;
        const ratio = (r.d && r.t) ? r.t / r.d : 0;
        if (r.watched || ratio >= 0.95) watched++;
        else if (ratio > 0.02) inprog++;
      });
      const pct = Math.round((watched / (videos.length || 1)) * 100);
      return `<div class="card p-4 mb-6 border-border-strong bg-surface">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-2.5">
    <div class="flex items-center gap-2 text-sm font-semibold text-fg">
      <span class="text-xs font-mono text-brand-ink uppercase tracking-wider">Tiến độ học</span>
      <span class="text-xs text-gray-500">·</span>
      <span class="badge badge-green">Đã xem ${watched}/${videos.length} bài (${pct}%)</span>
      ${inprog ? `<span class="badge badge-amber">${inprog} bài đang dở</span>` : ''}
    </div>
    <button type="button" class="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1" data-open-tab="video" data-watch-filter="watched" data-free-only="false">Xem video đã học <span class="font-mono">→</span></button>
  </div>
  <div class="w-full h-2 bg-surface-2 progress-track overflow-hidden" style="border-radius:2px">
    <div class="h-full bg-brand" style="width:${pct}%;border-radius:2px;transition:width 0.5s ease;"></div>
  </div>
</div>`;
    })()}
  <div class="grid md:grid-cols-2 gap-6 overview-grid">
<div class="card p-5">
  <div class="flex items-center justify-between gap-2 mb-1">
    <h2 class="page-h2 mb-0">Thị trường đã gắn</h2>
    <span class="text-[11px] font-mono text-gray-500">${videos.length} SKU</span>
  </div>
  <p class="card-note">${emptyMarket ? `Thanh = tỉ lệ trên tổng kho · ${emptyMarket} chưa gắn` : `Tỉ trọng 6 thị trường hàng đầu · 1 video có thể gắn nhiều thị trường (click lọc)`}</p>
  <div class="market-list">
    ${(function () {
      const top = marketRows.slice(0, 6); // UI-balance 6=6
      const rest = marketRows.slice(6);
      const restN = rest.reduce((a, r) => a + r[1], 0);
      const maxC = Math.max(1, ...marketRows.map(r => r[1]));
      const rows = top.map(([k, c]) => `
      <button type="button" class="market-row cursor-pointer hover:bg-surface-2/60 px-2 rounded-xl transition-colors w-full text-left" data-open-tab="video" data-market-filter="${k === 'Chưa gắn' ? '' : esc(k)}" title="Xem video thị trường ${esc(k)}">
        <span class="market-label">${k}</span>
        <div class="market-bar" aria-hidden="true"><i style="width:${Math.max(4, Math.round(c / maxC * 100))}%"></i></div>
        <span class="market-n">${SC.pad2(c)}</span>
      </button>`).join('');
      return rows;
    })()}
  </div>
  ${marketRows.length > 6 ? `<button type="button" class="overview-link flex items-center gap-1 mt-3" data-open-tab="video"><span>Xem thêm ${marketRows.length - 6} thị trường</span><span class="font-mono">→</span></button>` : ''}
</div>
<div class="card p-5">
  <div class="flex items-center justify-between gap-2 mb-1">
    <h2 class="page-h2 mb-0">Ngách trong kho</h2>
    <span class="text-[11px] font-mono text-brand-ink font-semibold">${nx.ngachXanh.length} ngách</span>
  </div>
  <p class="card-note">Top ngách trọng điểm kèm số video live trong kho (click để lọc)</p>
  <div class="niche-list">
    ${(function () {
      const lives = overviewNiches.map(n => {
        const sk = safeArray(n.skus).map(s0 => typeof s0 === 'string' ? s0 : (s0 && s0.sku));
        return videos.filter(v => sk.includes(v.sku) || v.contentNiche === n.ngach).length;
      });
      window.__tqMaxLive = Math.max(1, ...lives);
      window.__tqNicheLives = lives;
      return '';
    })()}${overviewNiches.map((n, ni) => {
      const skuList = safeArray(n.skus).map(s => typeof s === 'string' ? s : (s && s.sku));
      const nLive = window.__tqNicheLives[ni];
      const isGreen = n.xanh === true;
      const rank = ni + 1;
      const risk = !isGreen ? (n.xanh === 'CÓ ĐIỀU KIỆN' ? 'CÓ ĐK' : n.xanh === 'THẬN TRỌNG' ? 'THẬN TRỌNG' : n.xanh === 'CÓ MẪU TĂNG' ? 'CÓ MẪU' : (n.xanh && n.xanh !== true ? String(n.xanh) : '')) : '';
      const maxLive = window.__tqMaxLive;
      const livePct = nLive ? Math.max(8, Math.round((nLive / maxLive) * 100)) : 0;
      return `<button type="button" class="niche-row${rank <= 3 ? ' niche-row-top' : ''} cursor-pointer hover:bg-surface-2/60 px-2 rounded-xl transition-colors w-full text-left" data-open-tab="video" data-open-niche="${esc(n.ngach)}" data-skus="${esc(skuList.join(','))}" title="Lọc video ngách ${esc(n.ngach)}">
        <span class="niche-name">${esc(n.ngach)}${risk ? ` <span class="niche-risk">${esc(risk)}</span>` : ''}</span>
        <div class="market-bar niche-bar" aria-hidden="true"><i style="width:${livePct}%"></i></div>
        <span class="niche-n">${nLive ? SC.pad2(nLive) : '00'}</span>
      </button>`;
    }).join('')}
  </div>
  ${nx.ngachXanh.length > overviewNiches.length ? `<button type="button" class="overview-link flex items-center gap-1 mt-3" data-open-tab="ngachxanh"><span>Xem toàn bộ ${nx.ngachXanh.length} ngách trong kho</span><span class="font-mono">→</span></button>` : ''}
</div>
  </div>
  <div class="card p-5 mt-6">
<div class="flex items-center gap-2 mb-2">
  <span class="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">QUAN TRỌNG</span>
  <h2 class="page-h2 mb-0">Chính sách YouTube phải nhớ</h2>
</div>
<ol class="policy-list">
  ${(nx.thongTinChinhSach2026 || []).map((s, i) => `<li class="policy-item"><span class="policy-i">${String(i + 1).padStart(2, '0')}</span><span class="policy-t">${esc(s)}</span></li>`).join('')}
</ol>
  </div>`;
}

function videoCard(v) {
  const markets = safeArray(v.market);
  const channels = safeArray(v.channels);
  const docs = safeArray(v.docs);
  const lock = v.free ? '<span class="badge badge-green">FREE</span>' : '<span class="badge badge-red">PRO</span>';
  const drm = v.drm ? '<span class="badge badge-amber">DRM</span>' : '<span class="badge badge-blue">HLS</span>';
  const notDownloaded = !v.size ? '<span class="badge badge-red" title="MP4 0 byte — tải lại từ nguồn gốc">Chưa tải</span>' : '';
  const wb = watchedBadge(v.sku);
  const wp = watchedProgress(v.sku);
  const resume = watchedResumeLabel(v.sku);
  const vUrl = '/lotrinh/' + encodeURIComponent(v.sku);
  const playBtn = resume
    ? `<a href="${vUrl}" class="btn-press flex-1 text-center btn-primary text-xs font-bold py-2.5 min-h-[38px] flex items-center justify-center transition-colors">${resume}</a>`
    : `<a href="${vUrl}" class="btn-press flex-1 text-center btn-primary text-xs font-bold py-2.5 min-h-[38px] flex items-center justify-center transition-colors">Xem bài</a>`;
  return `<div class="card interactive-card overflow-hidden min-w-0 flex flex-col justify-between group">
<div>
  <a href="${vUrl}" class="relative block aspect-video bg-black overflow-hidden" title="Xem: ${esc(v.title)}">
    <img src="${esc(v.image || 'assets/thumbs/placeholder.svg')}" alt="Thumbnail: ${esc(v.title)}" width="320" height="180" onerror="this.onerror=null;this.src='assets/thumbs/placeholder.svg'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async">
    <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1">${lock}${drm}${wb}${notDownloaded}</div>
    ${channels.length ? '<div class="absolute top-2.5 right-2.5 badge badge-blue">' + channels.length + ' kênh</div>' : ''}
    ${wp}
  </a>
  <div class="p-4 min-w-0">
    <a href="${vUrl}" class="block text-[13.5px] font-bold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere] group-hover:text-brand-300 transition-colors font-heading">${esc(v.title)}</a>
    <div class="flex flex-wrap gap-1.5 mt-2.5 min-w-0 items-center">
      ${v.contentNiche ? `<span class="badge badge-green text-[10px]">${esc(v.contentNiche)}</span>` : `<span class="badge badge-muted text-[10px]">${esc(v.niche || 'Khác')}</span>`}
      ${markets.map(m => `<span class="text-[11px] text-gray-400 font-medium">${esc(m)}</span>`).join('<span class="text-gray-600 text-[10px]">·</span>')}
    </div>
    <div class="flex items-center gap-2 mt-2.5 text-[11px] text-gray-400">
      <span class="text-gray-400 truncate min-w-0 font-mono font-semibold">${esc(v.sku)}</span>
      ${v.published_at ? '<span class="text-gray-600">·</span><span class="text-gray-400 font-mono shrink-0">' + esc(v.published_at) + '</span>' : ''}
      ${docs.length ? `<span class="ml-auto flex items-center gap-1 text-sky-400 font-medium"><span class="w-1.5 h-1.5 bg-sky-400 rounded-full"></span> ${docs.length} TL</span>` : ''}
    </div>
  </div>
</div>
<div class="px-4 pb-4 pt-1 flex gap-2">
  ${playBtn}
  ${v.origin ? `<a href="${esc(v.origin)}" target="_blank" rel="noopener noreferrer" class="btn-press w-9 h-9 flex items-center justify-center bg-ink-800 hover:bg-ink-700 text-xs rounded-xl border border-ink-600/80 transition-colors shrink-0" title="Trang gốc H2Dev" aria-label="Trang gốc">↗</a>` : ''}
</div>
  </div>`;
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

    // 1. Match Video Title / SKU / Actual Topic
    if (title.toLowerCase().includes(q) || sku.toLowerCase().includes(q) || actualTopic.toLowerCase().includes(q)) {
      const vKey = 'vid:' + sku;
      if (!seenKeys.has(vKey)) {
        seenKeys.add(vKey);
        suggestions.push({
          type: 'lesson',
          icon: '🎓',
          badge: sku,
          badgeColor: 'bg-brand-950/60 text-brand-300 border-brand-800/60',
          title: title,
          sub: `${sku} · ${actualTopic || niche} · ${v.duration || ''}`,
          searchTerm: title,
          sku: sku,
          directUrl: `/lotrinh/${encodeURIComponent(sku)}`,
          btnLabel: 'Xem bài ↗',
          priority: sku.toLowerCase() === q || title.toLowerCase().startsWith(q) ? 100 : 85
        });
      }
    }

    // 2. Match Timestamps (Mốc tua nhanh)
    const timestamps = ins.key_timestamps || [];
    for (const ts of timestamps) {
      const tsTitle = ts.label || ts.title || '';
      const tsTime = ts.time || '';
      if (tsTitle.toLowerCase().includes(q) || tsTime.includes(q)) {
        const tsKey = 'ts:' + sku + ':' + tsTime;
        if (!seenKeys.has(tsKey)) {
          seenKeys.add(tsKey);
          const sec = ts.seconds || 0;
          suggestions.push({
            type: 'timestamp',
            icon: '⏱️',
            badge: tsTime,
            badgeColor: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
            title: `${tsTime} — ${tsTitle}`,
            sub: `Bài học: ${title} (${sku})`,
            searchTerm: tsTitle,
            sku: sku,
            directUrl: `/player.html?sku=${encodeURIComponent(sku)}&t=${sec}`,
            btnLabel: `▶ Tua đến ${tsTime}`,
            priority: 95
          });
        }
      }
    }

    // 3. Match Key Takeaways & Edit SOP
    const takeaways = ins.key_takeaways || [];
    for (const tk of takeaways) {
      if (tk.toLowerCase().includes(q)) {
        const tkKey = 'tk:' + sku + ':' + tk.slice(0, 30);
        if (!seenKeys.has(tkKey)) {
          seenKeys.add(tkKey);
          suggestions.push({
            type: 'takeaway',
            icon: '📌',
            badge: 'Mấu Chốt',
            badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
            title: tk,
            sub: `Bài học: ${title} (${sku})`,
            searchTerm: tk.slice(0, 40),
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
      if (af.toLowerCase().includes(q)) {
        const afKey = 'af:' + sku + ':' + af.slice(0, 30);
        if (!seenKeys.has(afKey)) {
          seenKeys.add(afKey);
          suggestions.push({
            type: 'avoid',
            icon: '⚠️',
            badge: 'Cảnh Báo YPP',
            badgeColor: 'bg-red-950/60 text-red-300 border-red-800/60',
            title: af,
            sub: `Cảnh báo YPP: ${title} (${sku})`,
            searchTerm: af.slice(0, 40),
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
    for (const ch of chList) {
      if (ch.toLowerCase().includes(q)) {
        const chKey = 'ch:' + sku + ':' + ch;
        if (!seenKeys.has(chKey)) {
          seenKeys.add(chKey);
          suggestions.push({
            type: 'channel',
            icon: '📺',
            badge: 'Kênh Mẫu',
            badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
            title: ch,
            sub: `Được tác giả mổ xẻ trong bài: ${title} (${sku})`,
            searchTerm: ch,
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
    window.H2Search.fetchApiSearch(q, 6).then(function (ftsRows) {
      const ftsItems = window.H2Search.ftsToSuggestions(ftsRows);
      const merged = window.H2Search.mergeSuggestions(localItems, ftsItems, 12);
      window._lastVideoSugItems = merged;
      window.showVideoSearchSuggestions(inputVal, merged);
    }).catch(function () {});
  }
  const items = (Array.isArray(_premerged) ? _premerged : localItems);
  if (items.length === 0) {
    box.innerHTML = `
      <div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-ink-deep" >
        <span>Không tìm thấy gợi ý bài học khớp với "<strong>${esc(q)}</strong>"</span>
        <span class="text-[10px] text-gray-500 font-mono">Nhấn Enter để lọc</span>
      </div>`;
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = `
    <div class="px-3.5 py-2 bg-[#060910] text-[10.5px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-[#1e293b]">
      <span class="flex items-center gap-1.5"><span class="text-brand-400">⚡</span> Gợi ý bài học, mốc tua & kỹ thuật (${items.length})</span>
      <span class="text-gray-500 font-normal">Nhấp để lọc hoặc tua ngay</span>
    </div>
    ${items.map((item, idx) => `
      <div class="js-v-sug-row px-3.5 py-2.5 hover:bg-[#1e293b] cursor-pointer flex items-center justify-between gap-3 transition-colors group bg-ink-deep" data-idx="${idx}" data-term="${esc(item.searchTerm)}" data-sku="${esc(item.sku || '')}" data-url="${esc(item.directUrl || '')}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-base shrink-0">${item.icon}</span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">${highlightQuery(item.title, q)}</div>
            <div class="text-[11px] text-gray-400 truncate">${esc(item.sub)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}">${esc(item.badge)}</span>
          ${item.directUrl ? `<a href="${esc(item.directUrl)}" class="js-v-sug-jump text-[10px] bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow whitespace-nowrap" title="Mở trực tiếp bài học/mốc tua">${esc(item.btnLabel || 'Xem ↗')}</a>` : ''}
        </div>
      </div>
    `).join('')}
  `;
  box.classList.remove('hidden');
};

async function renderVideo() {
  const [rawVideos, rawNx, rawInsights] = await Promise.all([
    loadJSON('data-tabs/videos.json'),
    loadJSON('data-tabs/ngach-xanh.json').catch(() => null),
    loadJSON('data/video_insights.json').catch(() => ({}))
  ]);
  const videos = Array.isArray(rawVideos) ? rawVideos : safeArray(rawVideos && rawVideos.videos);
  window._allVideos = videos;
  window._videoInsights = rawInsights || {};
  const macroToSkus = {};
  if (rawNx && Array.isArray(rawNx.ngachXanh)) {
    rawNx.ngachXanh.forEach(x => {
      const macro = (nicheKeyFor(x.ngach) || x.ngach || '').toLowerCase();
      if (!macroToSkus[macro]) macroToSkus[macro] = new Set();
      (x.skus || []).forEach(s => macroToSkus[macro].add((typeof s === 'string' ? s : (s && s.sku) || '').toLowerCase()));
    });
  }
  const macroSet = new Set(Object.values(NICHE_MAP).map(x => x.toLowerCase()));
  const microNiches = [...new Set(videos.flatMap(v => [v.contentNiche, v.niche].filter(Boolean)))].sort();
  const macroNiches = [...new Set(Object.values(NICHE_MAP))].sort();
  const markets = [...new Set(videos.flatMap(v => v.market || []))];
  let list = videos.filter(v => {
    const ins = (window._videoInsights && window._videoInsights[v.sku]) || {};
    const fullSearchText = [
      v.title || '',
      v.sku || '',
      v.niche || '',
      v.contentNiche || '',
      ins.actual_topic || '',
      ...(ins.key_takeaways || []),
      ...(ins.avoid_flags || []),
      ...(ins.tools_mentioned || []),
      (Array.isArray(ins.edit_sop) ? ins.edit_sop.join(' ') : (typeof ins.edit_sop === 'string' ? ins.edit_sop : (ins.edit_sop?.primary || '') + ' ' + ((ins.edit_sop?.additional || []).join(' ')))),
      ...((ins.key_timestamps || []).map(t => (t.time || '') + ' ' + (t.title || ''))),
      ...((v.channels || []))
    ].join(' ').toLowerCase();

    if (state.q && !SC.matchesQuery([fullSearchText], state.q)) return false;
    if (state.skuFilter) {
      const allow = new Set(String(state.skuFilter).split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      if (allow.size && !allow.has(String(v.sku || '').toLowerCase())) return false;
    } else if (state.nicheFilter) {
      const target = state.nicheFilter.trim().toLowerCase();
      const isMacro = macroSet.has(target);
      const vNiche = (v.contentNiche || v.niche || '').trim().toLowerCase();
      const vKey = (nicheKeyFor(v.contentNiche || v.niche || '') || '').trim().toLowerCase();
      const vSku = (v.sku || '').trim().toLowerCase();
      const allowedSkus = macroToSkus[target] || new Set();
      if (isMacro) {
        const matched = (vKey === target) || (vNiche === target) || (vNiche.includes(target)) || allowedSkus.has(vSku);
        if (!matched) return false;
      } else {
        const matched = (vNiche === target) || (vNiche.includes(target)) || (target.includes(vNiche)) || allowedSkus.has(vSku);
        if (!matched) return false;
      }
    }
    if (state.marketFilter && !(v.market || []).includes(state.marketFilter)) return false;
    if (state.freeOnly && !v.free) return false;
    if (state.watchFilter) {
      const w = loadWatched()[v.sku];
      const ratio = (w && w.d && w.t) ? w.t / w.d : 0;
      const done = (w && (w.watched || ratio >= 0.95));
      // "Chưa xem" = mọi video chưa đạt đã xem (gồm cả đang xem dở)
      if (state.watchFilter === 'watched' && !done) return false;
      if (state.watchFilter === 'unwatched' && done) return false;
    }
    return true;
  });
  // Sắp xếp: mới nhất (mặc định) / theo ngách / theo thị trường
  if (state.sortBy === 'niche') {
    list = list.slice().sort((a, b) => {
      const na = a.contentNiche || a.niche || '';
      const nb = b.contentNiche || b.niche || '';
      return na.localeCompare(nb) || (a.published_at || '').localeCompare(b.published_at || '');
    });
  } else if (state.sortBy === 'market') {
    list = list.slice().sort((a, b) => {
      const ma = (a.market || []).join(',');
      const mb = (b.market || []).join(',');
      return ma.localeCompare(mb) || (a.published_at || '').localeCompare(b.published_at || '');
    });
  } else {
    list = list.slice().sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
  }
  const free = videos.filter(v => v.free).length;
  const withDocs = videos.filter(v => v.docs && v.docs.length).length;
  const newest = videos[0] && videos[0].published_at;
  return `
  ${pageBanner('Video', SC.pad2(list.length) + '/' + SC.pad2(videos.length) + ' · mới nhất trước', [
    { icon: ICONS.video, label: 'Tổng video', value: videos.length, sub: newest ? 'Mới nhất ' + newest : '' },
    { icon: ICONS.doc, label: 'Free', value: free, sub: (videos.length - free) + ' pro' },
    { icon: ICONS.doc, label: 'Có tài liệu', value: withDocs, sub: 'docs[] catalog' },
    { icon: ICONS.video, label: 'Đang hiện', value: SC.pad2(list.length), live: true, sub: list.length === videos.length ? 'Không lọc' : 'Đang filter' }
  ])}
  <div class="card p-4 sm:p-5 mb-4 overflow-visible search-filter-card" style="position:relative; z-index:60; contain:none !important;">
<!-- Row 1: Search Bar (Full Width & Spacious) -->
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm video</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="video-search-wrap">
    <input id="fq" aria-label="Tìm video bài học" value="${esc(state.q)}" autocomplete="off" placeholder="Tìm tên video, SKU, kỹ thuật (B-roll bàn tay, AI, Thầy Pháp Hòa, xây kênh...)" class="search-input-premium w-full min-w-0 pr-9">
    ${state.q ? `<button type="button" id="btn-clear-video-q" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition z-10" title="Xóa tìm kiếm">✕</button>` : ''}
    <div id="video-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-[#334155] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-[#1e293b]/80 min-w-full" style="background-color:#0b0f19 !important; background:rgba(11,15,25,0.98) !important; backdrop-filter:blur(28px) saturate(180%) !important; -webkit-backdrop-filter:blur(28px) saturate(180%) !important; z-index:9999 !important; box-shadow:0 25px 60px -10px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.1) !important;"></div>
  </div>
  <button type="button" id="freset" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>

<!-- Row 2: Dropdowns & Status Badges -->
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap gap-2.5 items-center justify-between">
  <div class="flex flex-wrap gap-2 items-center flex-1 min-w-0">
    <label class="sr-only" for="fniche">Lọc theo ngách</label>
    <select id="fniche" aria-label="Lọc theo ngách" class="search-input-premium text-xs font-semibold py-2">
      <option value="">Mọi ngách</option>
      <optgroup label="── Nhóm ngách lớn ──">
        ${macroNiches.map(m => `<option value="${esc(m)}" ${state.nicheFilter === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
      </optgroup>
      <optgroup label="── Ngách chi tiết ──">
        ${microNiches.map(n => `<option value="${esc(n)}" ${state.nicheFilter === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}
      </optgroup>
    </select>
    <label class="sr-only" for="fmarket">Lọc theo thị trường</label>
    <select id="fmarket" aria-label="Lọc theo thị trường" class="search-input-premium text-xs font-semibold py-2">
      <option value="">Mọi thị trường</option>${markets.map(m => `<option ${state.marketFilter === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
    </select>
    <label class="sr-only" for="fsort">Sắp xếp</label>
    <select id="fsort" aria-label="Sắp xếp" class="search-input-premium text-xs font-semibold py-2">
      <option value="newest" ${state.sortBy !== 'niche' && state.sortBy !== 'market' ? 'selected' : ''}>Mới nhất</option>
      <option value="niche" ${state.sortBy === 'niche' ? 'selected' : ''}>Theo ngách</option>
      <option value="market" ${state.sortBy === 'market' ? 'selected' : ''}>Theo thị trường</option>
    </select>
  </div>
  <div class="flex items-center gap-1.5 shrink-0">
    ${['unwatched', 'watched'].map(k => {
      const label = { unwatched: 'Chưa xem', watched: 'Đã xem' }[k];
      return `<button type="button" data-watch="${k}" class="filter-btn text-xs font-medium px-3 py-1.5 ${state.watchFilter === k ? 'active' : ''}">${label}</button>`;
    }).join('')}
  </div>
</div>
  </div>
  <div class="flex flex-wrap gap-1.5 mb-4 items-center">
<button type="button" class="filter-btn text-xs font-medium px-3 py-1 ${!state.freeOnly && !state.marketFilter && !state.nicheFilter && !state.skuFilter && !state.watchFilter ? 'active' : ''}" data-action="video-filter-reset">Tất cả (${videos.length})</button>
<button type="button" class="filter-btn text-xs font-medium px-3 py-1 ${state.freeOnly ? 'active' : ''}" data-action="video-filter-free">Chỉ Free (${free})</button>
${markets.map(m => `<button type="button" data-market-chip="${esc(m)}" class="filter-btn text-xs font-medium px-3 py-1 ${state.marketFilter === m ? 'active' : ''}">${esc(m)} · ${videos.filter(v => (v.market || []).includes(m)).length}</button>`).join('')}
  </div>
  ${(state.nicheFilter || state.skuFilter) ? `
  <div class="flex items-center gap-2 mb-4 bg-brand-500/10 border border-brand-500/20 px-3.5 py-2 rounded-xl text-xs text-brand-300">
<span>🎯 Đang lọc theo ngách: <strong class="text-white">${esc(state.nicheFilter || 'SKU')}</strong> (${list.length} video)</span>
<button type="button" data-action="video-filter-reset" class="ml-auto text-brand-400 hover:text-white font-semibold underline">✕ Xóa bộ lọc</button>
  </div>` : ''}
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${list.map(videoCard).join('') || `<div class="card p-12 text-gray-400 col-span-full text-center py-10"><p class="mb-3">Không tìm thấy video phù hợp với bộ lọc hiện tại.</p><button type="button" id="freset-empty" class="bg-surface-2 hover:bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Xóa bộ lọc</button></div>`}</div>`;
}

async function renderNgachXanh() {
  let radar = { items: [] };
  try {
    const rr = await fetch('/api/niche-radar');
    if (rr.ok) radar = await rr.json();
  } catch (e) { radar = { items: [] }; }

  const nx = await loadJSON('data-tabs/ngach-xanh.json');
  const rawVideos = await loadJSON('data-tabs/videos.json');
  const videos = Array.isArray(rawVideos) ? rawVideos : safeArray(rawVideos && rawVideos.videos);

  function vidsFor(n) {
    const bySku = new Map(videos.map(v => [String(v.sku || '').toLowerCase(), v]));
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
    const handles = new Set(((n && n.mauSach) || []).map(h => String(h).toLowerCase()));
    if (handles.size) {
      for (const v of videos) {
        if ((v.channels || []).some(c => handles.has(String(c).toLowerCase()))) add(v);
      }
    }
    return out;
  }

  function videoRow(v, extraClass, extraAttr) {
    const docs = safeArray(v.docs);
    const channels = safeArray(v.channels);
    return `<a href="/lotrinh/${encodeURIComponent(v.sku)}" class="flex gap-2.5 p-2 rounded-xl hover:bg-ink-700/60 border border-transparent hover:border-ink-600 transition-colors group min-w-0 ${extraClass || ''}" ${extraAttr || ''}>
  <img src="${esc(v.image || 'assets/thumbs/placeholder.svg')}" alt="Thumbnail bài học: ${esc(v.title)}" width="72" height="40" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/thumbs/placeholder.svg'" class="w-[72px] h-[40px] rounded-xl object-cover shrink-0 bg-black">
  <div class="min-w-0 flex-1">
    <div class="text-xs font-medium text-white leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors break-words">${esc(v.title)}</div>
    <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
      <span class="text-[10px] text-gray-500 font-mono truncate">${esc(v.sku)}</span>
      ${v.published_at ? `<span class="text-[10px] text-gray-400 shrink-0">${esc(v.published_at)}</span>` : ''}
      <span class="text-[10px] text-gray-400">${fmtBytes(v.size)}</span>
      ${docs.length ? '<span class="text-[10px] text-brand-400 shrink-0"><span aria-hidden="true">📄</span> ' + docs.length + '</span>' : ''}
      ${channels.length ? '<span class="text-[10px] text-sky-400 shrink-0"><span aria-hidden="true">📺</span> ' + channels.length + '</span>' : ''}
    </div>
  </div>
  <span class="shrink-0 w-7 h-7 rounded-xl bg-brand-600 group-hover:bg-brand-500 text-white flex items-center justify-center text-xs transition-colors">→</span>
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

  // Merge ranked items with their rich details
  const enrichedNiches = auditRows.map(r => {
    const detail = (r.record != null && r.record < ngachList.length) ? ngachList[r.record] : {};
    const rawMarket = safeArray(detail.thiTruong);
    let mTag = 'GLOBAL';
    const nameLower = (r.ngach + ' ' + rawMarket.join(' ')).toLowerCase();
    // Fix 16/09: /\ben\b/ + /\bus\b/ (word boundary) — trước đây /en/ khớp chữ "sEnior"
    // làm 3 ngách Nhật/Hàn bị gắn nhầm tag 🇺🇸 US.
    if (/\bus\b|\ben\b|tiếng anh|mỹ|quốc tế/.test(nameLower)) mTag = 'US';
    else if (/jp|nhật|japan/.test(nameLower)) mTag = 'JP';
    else if (/kr|hàn|korea|야담/.test(nameLower)) mTag = 'KR';
    else if (/vn|việt nam|vietnam/.test(nameLower)) mTag = 'VN';

    return {
      rank: r.thuTu,
      recordId: r.record,
      name: r.ngach,
      tier: r.nhom || 'KHONG_DU_EVIDENCE',
      thesis: r.lyDo || detail.evidence || '',
      videoNote: r.lienKetVideo || '',
      marketTag: mTag,
      markets: rawMarket.length ? rawMarket : [mTag],
      rpm: detail.rpm || '',
      competition: detail.canhTranh || '',
      rpmShort: nxRpmShort(detail.rpm),
      competitionShort: nxCompShort(detail.canhTranh),
      novelty: detail.doMoi || '',
      safeFormat: detail.formatBrand || detail.lamDuoc || 'Sản xuất kịch bản có thesis/nguồn tài liệu kiểm chứng riêng biệt.',
      avoidTrap: detail.viPham || 'Tránh lặp template, không quote-farm, không mạo danh chuyên gia.',
      channels: safeArray(detail.mauSach),
      vids: vidsFor(detail),
      rawDetail: detail
    };
  });

  // Filter statistics
  const tierCounts = { ALL: enrichedNiches.length, UU_TIEN_SAN_XUAT: 0, WATCHLIST: 0, TEST_FORMAT: 0, KHONG_DU_EVIDENCE: 0, TACH_KHOI_DE_XUAT: 0 };
  const marketCounts = { ALL: enrichedNiches.length, US: 0, JP: 0, KR: 0, VN: 0, GLOBAL: 0 };
  enrichedNiches.forEach(n => {
    if (tierCounts[n.tier] != null) tierCounts[n.tier]++;
    if (marketCounts[n.marketTag] != null) marketCounts[n.marketTag]++;
  });

  // Apply Filters
  const q = (state.nxQ || '').trim().toLowerCase();
  const filtered = enrichedNiches.filter(n => {
    if (state.nxTier && n.tier !== state.nxTier) return false;
    if (state.nxMarket && n.marketTag !== state.nxMarket) return false;
    if (!q) return true;
    const hay = [n.ngach || '', n.name || '', n.hang != null ? String(n.hang) : '', n.thesis, n.safeFormat, n.avoidTrap, n.marketTag, (n.markets || []).join(' '), (n.channels || []).join(' '), safeArray(n.skus).join(' '), n.vids.map(v=>v.sku+' '+v.title).join(' ')].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });

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
  return `
  ${pageBanner('Nhận định Ngách xanh 2026', 'Bản đồ ' + enrichedNiches.length + ' ngách YouTube, định dạng an toàn (Safe Format), rủi ro chính sách (Policy Flags) và kênh đối thủ đã kiểm chứng 30 ngày.', [
    { icon: ICONS.niche, label: 'Ưu tiên sản xuất', value: tierCounts.UU_TIEN_SAN_XUAT, sub: 'Top 1-8 ngách sạch, demand thực, RPM cao' },
    { icon: ICONS.doc, label: 'Watchlist & Test', value: (tierCounts.WATCHLIST + tierCounts.TEST_FORMAT), sub: 'Kiểm soát format & test nhỏ 5-10 video' },
    { icon: ICONS.channel, label: 'Kênh mẫu sạch', value: '70 / 70', sub: 'Đã check 30 ngày qua vidIQ API' },
    { icon: ICONS.strategy, label: 'RPM Benchmark', value: '$10.22', sub: 'Median danh mục Education & Science (AIR)' }
  ])
    + (() => {
      const items = (radar && radar.items) || [];
      if (!items.length) return '';
      const top = items.slice(0, 8);
      return '<section class="card p-4 sm:p-5 mb-6"><div class="flex items-center justify-between gap-2 mb-3"><h2 class="text-sm font-bold text-white">PH5.3 Radar Ngach Xanh</h2><span class="text-[10px] font-mono radar-legend text-[11px] font-mono"><b>SAI</b><span class="sep"> · </span><b>PRI</b><span class="sep"> · </span><b>BOI</b></span></div><div class="radar-grid">' + top.map(function (n) {
        return '<div class="radar-card rounded-xl border border-white/10 bg-white/[0.03] p-3 min-w-0"><div class="title text-xs font-bold text-white mb-1">' + esc(n.ngach || '') + '</div><div class="radar-metrics"><span><span class="k">SAI</span> <span class="v">' + n.SAI + '</span></span><span><span class="k">PRI</span> <span class="v">' + n.PRI + '</span></span><span><span class="k">BOI</span> <span class="v">' + n.BOI + '</span></span></div><div class="text-[10px] text-gray-500 mt-1 truncate">' + (n.xanh === true ? 'XANH' : '') + ' · hang ' + (n.hang || '-') + ' · sku ' + (n.skus || 0) + '</div></div>';
      }).join('') + '</div></section>';
    })()}

  <!-- BỘ LỌC TINH GỌN (COMPACT RADAR FILTER) -->
  <section class="card nx-filter-panel p-3 sm:p-4 mb-5 border-border">
<div class="nx-filter-head flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between mb-2.5">
  <div class="relative flex-1 min-w-0">
    <label class="sr-only" for="fq-nx">Tìm kiếm ngách</label>
    <input id="fq-nx" type="search" name="nx-search" autocomplete="off" spellcheck="false" value="${esc(state.nxQ)}" placeholder="Tìm tên ngách, từ khóa, @handle kênh…" class="search-input-premium w-full text-xs py-2" aria-label="Tìm kiếm ngách xanh">
  </div>
  <button type="button" id="freset-nx" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-3 py-2 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors flex items-center gap-1.5"><span aria-hidden="true">↺</span> Đặt lại</button>
</div>

<!-- Tier Filter Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none" >
  <span class="text-[11px] font-mono text-fg-muted shrink-0 mr-1">Tầng:</span>
  <div class="nx-filter-chips">
    <button type="button" data-nx-tier="" class="filter-btn shrink-0 ${!state.nxTier ? 'active' : ''}">Tất cả (${tierCounts.ALL})</button>
    ${['UU_TIEN_SAN_XUAT', 'WATCHLIST', 'TEST_FORMAT', 'KHONG_DU_EVIDENCE', 'TACH_KHOI_DE_XUAT'].map(t => {
      const active = state.nxTier === t;
      return `<button type="button" data-nx-tier="${t}" class="filter-btn shrink-0 ${active ? 'active' : ''}">${tierLabels[t]} (${tierCounts[t] || 0})</button>`;
    }).join('')}
  </div>
</div>

<!-- Market Filter Chips -->
<div class="nx-filter-row flex items-center gap-1.5 py-1 border-t border-hairline scroll-none" >
  <span class="text-[11px] font-mono text-fg-muted shrink-0 mr-1">Khu vực:</span>
  <div class="nx-filter-chips">
    <button type="button" data-nx-market="" class="filter-btn shrink-0 ${!state.nxMarket ? 'active' : ''}">Tất cả (${marketCounts.ALL})</button>
    ${['US', 'JP', 'KR', 'VN'].map(m => {
      const active = state.nxMarket === m;
      return `<button type="button" data-nx-market="${m}" class="filter-btn shrink-0 ${active ? 'active' : ''}">${marketLabels[m]} (${marketCounts[m] || 0})</button>`;
    }).join('')}
  </div>
</div>
  </section>

  <!-- 4 CỬA CHÍNH SÁCH YOUTUBE (COLLAPSIBLE ACCESSIBLE BANNER) -->
  <details class="card p-3 sm:p-4 mb-5 border-amber-900/30 bg-amber-950/10 group">
<summary class="flex items-center justify-between cursor-pointer font-semibold text-xs text-amber-300 select-none">
  <div class="flex items-center gap-2">
    <span aria-hidden="true">🛡️</span>
    <span>4 Cửa ải chính sách kiếm tiền YouTube 2026 (Bấm để xem chi tiết)</span>
  </div>
  <span class="text-gray-400 group-open:rotate-180 transition-transform text-xs font-mono">▼</span>
</summary>
<div class="policy-grid mt-3 pt-3 border-t border-amber-900/30">
  <div class="policy-card">
    <div class="font-bold text-amber-300 mb-1 text-xs">🚪 Cửa 1: Inauthentic / Spam</div>
    <p class="text-gray-300 leading-relaxed text-[11.5px]">Cấm dùng 1 template nhân vật / quote lặp lại hàng loạt. Mỗi video phải có kịch bản và case-study mới.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-rose-300 mb-1 text-xs">🚪 Cửa 2: Distress / Harmful</div>
    <p class="text-gray-300 leading-relaxed text-[11.5px]">Cấm dàn dựng cứu hộ động vật, trẻ em đau khổ, bạo lực hay thumbnail gây sốc lừa dối người xem.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-sky-300 mb-1 text-xs">🚪 Cửa 3: Fake AI Persona</div>
    <p class="text-gray-300 leading-relaxed text-[11.5px]">Cấm AI giả dạng Bác sĩ, Dược sĩ, Luật sư để chẩn đoán bệnh hoặc tư vấn tài chính / cam kết làm giàu.</p>
  </div>
  <div class="policy-card">
    <div class="font-bold text-emerald-300 mb-1 text-xs">🚪 Cửa 4: Reused Content</div>
    <p class="text-gray-300 leading-relaxed text-[11.5px]">Cấm reup hoạt hình/phim ảnh thô thiển. Phải có lời bình sâu sắc và biến đổi thực chất (Transformative).</p>
  </div>
</div>
  </details>

  <!-- TIÊU ĐỀ KẾT QUẢ -->
  <div class="mb-3.5 flex items-center justify-between text-xs text-gray-400">
<div>Đang hiển thị: <b class="text-white">${filtered.length}</b> / ${enrichedNiches.length} ngách</div>
${(state.nxTier || state.nxMarket || state.nxQ) ? '<span class="text-brand-ink font-medium">Đang áp dụng bộ lọc</span>' : ''}
  </div>

  <!-- DANH SÁCH THẺ NGÁCH TINH GỌN (TWO-COLUMN INTEL CARDS) -->
  <div class="niche-grid mb-8">
${filtered.map(n => {
  const isTopTier = n.tier === 'UU_TIEN_SAN_XUAT';
  const isWatchlist = n.tier === 'WATCHLIST';
  const key = nicheKeyFor(n.name);
  const rankBadgeClass = isTopTier ? 'rank-badge-gold' : (isWatchlist ? 'rank-badge-silver' : 'rank-badge-slate');

  const tierClass = n.tier === 'UU_TIEN_SAN_XUAT' ? 'is-tier-uu-tien' : (n.tier === 'WATCHLIST' ? 'is-tier-watchlist' : (n.tier === 'TEST_FORMAT' ? 'is-tier-test' : (n.tier === 'KHONG_DU_EVIDENCE' ? 'is-tier-evidence' : 'is-tier-tach')));
  return `
  <article class="niche-card p-0 ${tierClass} ${isTopTier ? 'border-brand/40 bg-surface/90' : ''}">
      <div class="nc-header">
        <span class="nc-rank ${rankBadgeClass}">#${n.rank}</span>
        <div class="nc-title">
          <div class="nc-badges">
            <span class="badge ${tierBadges[n.tier] || 'badge-muted'}">${tierLabels[n.tier] || n.tier}</span>
            <span class="badge badge-muted">${marketLabels[n.marketTag] || n.marketTag}</span>
          </div>
          <h2 class="nc-name">${esc(n.name)}</h2>
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
    </div>
    ${n.channels.length ? `
    <div class="mb-3">
      <div class="nx-card-channel-label">Kênh đối thủ sạch (30 ngày):</div>
      <div class="nc-channels">
        ${n.channels.map(ch => `<a href="https://www.youtube.com/${esc(ch)}" target="_blank" rel="noopener noreferrer" class="channel-chip" translate="no">${esc(ch)} ↗</a>`).join('')}
      </div>
    </div>` : ''}
    ${n.vids.length ? `
    <div class="nx-card-action mt-auto pt-2.5 border-t border-border">
      <button type="button" data-open-niche="${esc(key)}" data-skus="${esc(n.vids.map(v => v.sku).join(','))}" class="text-[11px] text-brand-ink hover:text-brand-hover font-semibold" title="Mở ${n.vids.length} video bài học liên quan">Xem ${n.vids.length} video liên quan →</button>
    </div>` : '<div class="mt-auto pt-2 text-[11px] text-gray-500 flex items-center gap-1.5"><span aria-hidden="true">○</span> Chưa có video</div>'}
  </article>`;
}).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full">Không tìm thấy ngách phù hợp với bộ lọc hiện tại.</div>'}
  </div>


  <!-- NGÁCH ĐỎ CẦN TRÁNH -->
  <div class="card p-5 mb-6">
<h2 class="page-h2 mb-3">Ngách ĐỎ tuyệt đối tránh</h2>
<div class="niche-grid">
  ${nx.ngachDoCanTranh.map(n => `<div class="policy-card"><span class="badge badge-red mr-2 font-bold">CẤM</span><b class="text-white">${esc(n.ngach)}</b><p class="text-gray-300 mt-1 leading-relaxed">${esc(n.lydo)}</p></div>`).join('')}
</div>
  </div>

  <!-- META TRONG KHO -->
  ${(nx.ngachMetaKho && nx.ngachMetaKho.length) ? `
  <div class="card p-5 mb-6">
<h2 class="page-h2 mb-1">Meta &amp; Quy trình kỹ thuật</h2>
<p class="card-note">Bài học về nhân bản, share key, chính sách, edit và AI tool. Chỉ dùng để học quy trình.</p>
<div class="space-y-3">${nx.ngachMetaKho.map(n => {
  const vids = vidsFor(Object.assign({}, n, { skus: (n.skus && n.skus.length) ? n.skus : videos.filter(v => v.niche === n.ngach).map(v => v.sku) }));
  const hidden = Math.max(0, vids.length - 3);
  return `<div class="policy-card">
    <div class="flex flex-wrap items-center gap-2 mb-1.5">
      <span class="badge ${n.xanh === 'THẬN TRỌNG' ? 'badge-amber' : 'badge-muted'} font-bold">${esc(n.xanh)}</span>
      <b class="text-white text-sm">${esc(n.ngach)}</b>
      <span class="text-xs text-gray-400">(${vids.length} video)</span>
      ${vids.length ? `<button type="button" data-open-niche="${esc(n.ngach)}" data-skus="${esc(vids.map(v => v.sku).join(','))}" class="text-xs text-brand-400 hover:text-brand-300 ml-auto font-medium">Mở video →</button>` : ''}
    </div>
    <div class="text-xs text-gray-300 leading-relaxed mb-2 [overflow-wrap:anywhere]"><b class="text-gray-200">${esc(n.vaiTro)}:</b> ${esc(n.evidence)}</div>
    ${vids.length ? `<div class="space-y-2" data-niche-list>${vids.map((v, i) => videoRow(v, i >= 3 ? 'hidden' : '', i >= 3 ? 'data-more' : '')).join('')}${hidden ? `<div class="text-center mt-2"><button type="button" data-expand-niche class="text-xs text-gray-300 hover:text-white bg-ink-700 border border-ink-600 px-3 py-1 rounded-xl">+ ${hidden} video khác</button></div>` : ''}</div>` : ''}
  </div>`;
}).join('')}</div>
  </div>`: ''}

  <!-- THỊ TRƯỜNG & RPM FOOTNOTE -->
  <div class="card p-5">
<h2 class="page-h2">Định vị thị trường &amp; benchmark RPM 2026</h2>
<div class="niche-grid mb-4">
  ${Object.entries(nx.thiTruongXanh).map(([k, v]) => `<div class="policy-card"><b class="text-brand-ink block mb-1 text-sm">${k}</b><span class="text-gray-300 leading-relaxed [overflow-wrap:anywhere]">${esc(v)}</span></div>`).join('')}
</div>
${nx.rpmNote ? `<div class="policy-card text-xs text-gray-400 leading-relaxed [overflow-wrap:anywhere]">${esc(nx.rpmNote)}</div>` : ''}
  </div>`;
}


async function renderKichBan() {
  await loadMusicStats();
  const kich = await loadJSON('data-tabs/tai-lieu-full.json');
  const videos = await loadJSON('data-tabs/videos.json');
  const bySku = Object.fromEntries(videos.map(v => [v.sku, v]));
  const KIND_LABEL = { prompt: 'Prompt', list: 'List kênh', tool: 'Tool', drive: 'Drive', form: 'Form', ai: 'AI gen', report: 'Báo cáo', 'internal-doc': 'Tài liệu nội bộ', other: 'Khác' };
  const KIND_BADGE = { prompt: 'badge-brand', list: 'badge-blue', tool: 'badge-amber', drive: 'badge-green', form: 'badge-red', ai: 'badge-blue', report: 'badge-green', 'internal-doc': 'badge-muted', other: 'badge-muted' };
  const NICHE_ORDER = ['Triết lý / Tâm linh', 'Sức khỏe / Lão hóa', 'Kinh tế / Tài chính', 'Reup / Hoạt hình', 'Drama / Stories', 'Lịch sử / Quân sự', 'Everyday History EN (lịch sử đồ vật thường ngày)', 'Khoa học EN', 'Edit / Thumb', 'Nhân bản / Kênh', 'Share key / Ngách nhỏ', 'Kiếm tiền / Chính sách', 'Hệ thống / Quy trình', 'Nền tảng / Tool', 'Khác'];
  function classifyPrompt(item) {
    if (item.kind) return item.kind;
    const name = (item.name || '').toLowerCase();
    const link = item.link || '';
    const file = (item.file || '').toLowerCase();
    const blob = name + ' ' + file + ' ' + link;
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
    if (item.contentNiche) return item.contentNiche;
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
    if (video && video.niche && video.niche !== 'Khác') return video.niche;
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
    return Object.assign({}, item, {
      _i: idx,
      kind,
      title: cleanName(item.name),
      videoTitle: video ? video.title : '',
      videoNiche: video ? video.niche : '',
      contentNiche,
      host: hostLabel(item.link),
      ext: fileLabel(item.file)
    });
  });
  const kindCounts = enriched.reduce((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; a.all = (a.all || 0) + 1; return a; }, {});
  const nicheCounts = enriched.reduce((a, x) => { a[x.contentNiche] = (a[x.contentNiche] || 0) + 1; return a; }, {});
  const q = (state.promptQ || '').trim().toLowerCase();
  const list = enriched.filter(item => {
    if (state.kindFilter && item.kind !== state.kindFilter) return false;
    if (state.promptNiche && item.contentNiche !== state.promptNiche) return false;
    if (!q) return true;
    const hay = [item.title, item.name, item.sku, item.kind, item.contentNiche, item.videoNiche, item.videoTitle, item.host, item.ext].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });
  const kindChips = [['', 'Tất cả', kindCounts.all || 0], ['prompt', 'Prompt', kindCounts.prompt || 0], ['report', 'Báo cáo', kindCounts.report || 0], ['list', 'List kênh', kindCounts.list || 0], ['tool', 'Tool', kindCounts.tool || 0], ['drive', 'Drive', kindCounts.drive || 0], ['form', 'Form', kindCounts.form || 0], ['ai', 'AI gen', kindCounts.ai || 0], ['internal-doc', 'Tài liệu nội bộ', kindCounts['internal-doc'] || 0], ['other', 'Khác', kindCounts.other || 0]].filter(x => !x[0] || x[2]);
  const allNicheKeys = [...NICHE_ORDER.filter(n => nicheCounts[n]), ...Object.keys(nicheCounts).filter(n => !NICHE_ORDER.includes(n))];
  const nicheChips = allNicheKeys.map(n => [n, n, nicheCounts[n]]);
  const grouped = [];
  allNicheKeys.forEach(n => {
    const items = list.filter(x => x.contentNiche === n);
    if (items.length) grouped.push({ niche: n, items });
  });
  function videoNicheKey(contentNiche) {
    return NICHE_MAP[contentNiche] || (Object.values(NICHE_MAP).includes(contentNiche) ? contentNiche : '');
  }
  const groupQuickAccess = grouped.length >= 3 && grouped.length <= 5 ? quickAccessBar({
    id: 'kichban-quick-access', label: 'Đi nhanh đến nhóm đang hiện', mode: 'section',
    items: grouped.map((g, index) => ({ label: g.niche, shortLabel: g.niche, action: { type: 'section', section: 'kichban-group-' + index } }))
  }) : '';
  return `
  ${pageBanner('Kịch bản & Tài liệu', list.length + '/' + enriched.length + ' mục · gắn theo ngách nội dung, không trùng Nguồn reup', [
    { icon: ICONS.doc, label: 'Tổng mục', value: enriched.length, sub: list.length === enriched.length ? 'Hiện tất cả' : 'Đang lọc ' + list.length },
    { icon: ICONS.disk, label: 'File local', value: enriched.filter(x => x.file).length, sub: 'trong assets/docs' },
    { icon: ICONS.link, label: 'Link catalog', value: enriched.filter(x => !x.file).length, sub: 'Drive / web' },
    { icon: ICONS.niche, label: 'Ngách có data', value: Object.keys(nicheCounts).length, sub: 'chip bên dưới' }
  ])}
  <div class="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-ink-900 border border-purple-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
<div class="flex items-center gap-3">
  <span class="text-3xl p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">🎧</span>
  <div>
    <div class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
      <span>Kho Nhạc Nền ${musicStats.total} Tracks (Đã Thẩm Định Gemini Multimodal & FFprobe)</span>
      <span class="badge badge-green text-[10px]">${musicStats.safe} SAFE YPP</span>
    </div>
    <p class="text-xs text-gray-300 mt-0.5">Phân loại theo ngách Lịch sử, Tiên tri, Sinh tồn, Ru ngủ · Tích hợp sẵn Trình phát âm thanh nghe thử & tải MP3.</p>
  </div>
</div>
<button type="button" class="shrink-0 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 js-open-music-studio">
  <span>▶ Mở Trạm Nhạc Nền</span>
</button>
  </div>
  <div class="card p-4 sm:p-5 mb-5">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
  <label class="sr-only" for="fq">Tìm prompt</label>
  <input id="fq" value="${esc(state.promptQ)}" placeholder="Tìm prompt, ngách, SKU, tên tài liệu..." class="search-input-premium w-full sm:flex-1 min-w-0" aria-label="Tìm prompt">
  <button type="button" id="freset-prompt" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Loại data</div>
  <div class="flex flex-wrap gap-2">
    ${kindChips.map(([id, label, n]) => `<button type="button" data-kind="${id}" class="filter-btn ${state.kindFilter === id ? 'active' : ''}">${label} · ${n}</button>`).join('')}
  </div>
</div>
<div class="mt-3.5">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách nội dung</div>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-prompt-niche="" class="filter-btn ${!state.promptNiche ? 'active' : ''}">Mọi ngách · ${kindCounts.all || 0}</button>
    ${(() => {
      const LIMIT = 10;
      const visible = state.promptNicheExpanded ? nicheChips : nicheChips.slice(0, LIMIT);
      const hidden = nicheChips.length - LIMIT;
      const selOut = state.promptNiche && !visible.some(([id]) => id === state.promptNiche)
        ? `<button type="button" data-prompt-niche="${esc(state.promptNiche)}" class="filter-btn active" title="Đang lọc ngách này">${esc(state.promptNiche)} · ${(nicheChips.find(([id]) => id === state.promptNiche) || [0,0,0])[2]}</button>` : '';
      return selOut + visible.map(([id, label, n]) => `<button type="button" data-prompt-niche="${esc(id)}" class="filter-btn ${state.promptNiche === id ? 'active' : ''}" title="${esc(label)}">${esc(label)} · ${n}</button>`).join('')
        + (hidden > 0 ? `<button type="button" data-prompt-niche-toggle class="filter-btn" style="border-style:dashed; color:var(--fg-muted);" title="${state.promptNicheExpanded ? 'Thu gọn' : 'Hiện ' + hidden + ' ngách còn lại'}">${state.promptNicheExpanded ? '▲ Thu gọn' : '▼ Xem thêm ' + hidden + ' ngách'}</button>` : '');
    })()}
  </div>
</div>
  </div>
  ${groupQuickAccess}
  <div class="space-y-6" id="kichban-results">
${grouped.map((g, index) => {
    const vKey = videoNicheKey(g.niche);
    return `
  <section id="kichban-group-${index}" class="quick-target min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h2 class="text-base font-bold text-white font-heading">${esc(g.niche)}</h2>
      <span class="badge badge-muted">${g.items.length} data</span>
      ${vKey ? `<button type="button" data-open-niche="${esc(vKey)}" class="text-xs text-brand-400 hover:text-brand-300 font-medium">Xem video ngách →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
      ${g.items.map(k => `
        <article class="card p-4 min-w-0 overflow-hidden flex flex-col">
          <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
            <span class="badge shrink-0 ${KIND_BADGE[k.kind] || 'badge-muted'}">${KIND_LABEL[k.kind] || 'Khác'}</span>
            <span class="badge badge-blue shrink-0 truncate max-w-[140px]" title="${esc(k.contentNiche)}">${esc(k.contentNiche)}</span>
            ${k.source === 'noi-bo' ? `<span class="badge badge-green shrink-0">Nội bộ</span>` : ''}
            ${k.ext ? `<span class="ml-auto badge badge-muted shrink-0 font-mono">${esc(k.ext)}</span>` : ''}
          </div>
          <h3 class="text-[13.5px] font-semibold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere]">${esc(k.title || k.name)}</h3>
          <div class="mt-2 text-[11px] text-gray-400 font-mono truncate">${esc(k.sku)}</div>
          ${k.videoTitle ? `<div class="mt-1 text-[11px] text-gray-300 line-clamp-1 break-words">Nguồn video: ${esc(k.videoTitle)}</div>` : ''}
          ${!k.videoTitle && k.source === 'noi-bo' ? `<div class="mt-1 text-[11px] text-lime-400/80">Đồng bộ từ ngoài → H2DEV</div>` : ''}
          ${k.videoNiche && k.videoNiche !== k.contentNiche ? `<div class="mt-1 text-[10px] text-amber-400/80">Video mẹ thuộc: ${esc(k.videoNiche)}</div>` : ''}
          <div class="mt-auto pt-3 flex flex-wrap gap-2">
            ${k.sku === 'NOI-BO-MUSIC-01' || (k.file && k.file.includes('CATALOG-NHAC-NEN')) ? `<button type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-sm transition js-open-music-studio"><span>🎧 Mở Trạm Nhạc Nền${musicStats.total ? ' (' + musicStats.total + ' Tracks)' : ''}</span></button>` : ''}
            ${k.link ? `<a href="${esc(k.link)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold">↗ ${esc(k.host || 'Mở nguồn')}</a>` : ''}
            ${k.file ? `<a href="${esc(k.file)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11px] text-gray-200">📄 File local</a>` : ''}
            ${k.fileLocal ? `<a href="${esc(k.fileLocal)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11px] text-lime-200">📝 MD gốc</a>` : ''}
            ${k.videoTitle ? `<a href="/lotrinh/${encodeURIComponent(k.sku)}" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11px] text-gray-200">▶ Video gốc</a>` : ''}
          </div>
        </article>`).join('')}
    </div>
  </section>`;
  }).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2">🔍</div>Không tìm thấy prompt / tài nguyên</div>'}
  </div>`;
}

async function renderNguonReup() {
  const nguon = await loadJSON('data-tabs/nguon-reup.json');
  const videos = await loadJSON('data-tabs/videos.json');
  const bySku = Object.fromEntries(videos.map(v => [v.sku, v]));
  const TYPE_LABEL = { bilibili: 'Bilibili', douyin: 'Douyin', stock: 'Stock footage', tool: 'Tool / Web', community: 'Cộng đồng', other: 'Khác' };
  const TYPE_BADGE = { bilibili: 'badge-blue', douyin: 'badge-amber', stock: 'badge-green', tool: 'badge-brand', community: 'badge-muted', other: 'badge-muted' };
  const TYPE_ORDER = ['bilibili', 'douyin', 'stock', 'tool', 'community', 'other'];
  function hostOf(link) {
    try { return new URL(link).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function classifySource(item) {
    const host = hostOf(item.link);
    const blob = ((item.name || '') + ' ' + host + ' ' + (item.link || '')).toLowerCase();
    if (/bilibili/.test(blob)) return 'bilibili';
    if (/douyin|tikvideo/.test(blob)) return 'douyin';
    if (/pexels|vecteezy|coverr|freepik|pixabay/.test(blob)) return 'stock';
    if (/h2devtool|youtube-transcript|tikvideo/.test(blob)) return 'tool';
    if (/zalo|facebook|group|cộng đồng/.test(blob)) return 'community';
    return 'other';
  }
  function inferNiche(item, video) {
    const t = ((item.name || '') + ' ' + (item.link || '')).toLowerCase();
    if (/health|sức khỏe/.test(t)) return 'Sức khỏe / Lão hóa';
    if (/bilibili|douyin|reup|hoạt hình/.test(t)) return 'Reup / Hoạt hình';
    if (/kịch bản|transcript/.test(t)) return 'Nền tảng / Tool';
    if (video && video.niche && video.niche !== 'Khác') return video.niche;
    return 'Khác';
  }
  function cleanTitle(item) {
    const raw = String(item.name || '').trim();
    if (!raw || /^https?:\/\//i.test(raw)) {
      const host = hostOf(item.link);
      const type = classifySource(item);
      if (type === 'bilibili') return 'Kênh nguồn Bilibili';
      if (type === 'douyin') return 'Kênh nguồn Douyin';
      if (type === 'stock') return host ? ('Stock · ' + host) : 'Stock footage';
      if (type === 'tool') return host ? ('Công cụ · ' + host) : 'Công cụ';
      return host || 'Nguồn reup';
    }
    return raw.replace(/\s*\((tặng kèm|mọi người có thể tự tìm thêm[^)]*)\)/gi, '').replace(/\s{2,}/g, ' ').trim();
  }
  const enriched = nguon.map((item, idx) => {
    const video = bySku[item.sku];
    const type = classifySource(item);
    return Object.assign({}, item, {
      _i: idx,
      type,
      host: hostOf(item.link),
      title: cleanTitle(item),
      videoTitle: video ? video.title : '',
      videoNiche: video ? video.niche : '',
      contentNiche: inferNiche(item, video)
    });
  });
  const typeCounts = enriched.reduce((a, x) => { a[x.type] = (a[x.type] || 0) + 1; a.all = (a.all || 0) + 1; return a; }, {});
  const nicheCounts = enriched.reduce((a, x) => { a[x.contentNiche] = (a[x.contentNiche] || 0) + 1; return a; }, {});
  const q = (state.reupQ || '').trim().toLowerCase();
  const list = enriched.filter(item => {
    if (state.reupType && item.type !== state.reupType) return false;
    if (state.reupNiche && item.contentNiche !== state.reupNiche) return false;
    if (!q) return true;
    const hay = [item.title, item.name, item.sku, item.host, item.type, item.contentNiche, item.videoNiche, item.videoTitle].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  });
  const typeChips = [['', 'Tất cả', typeCounts.all || 0]].concat(TYPE_ORDER.filter(t => typeCounts[t]).map(t => [t, TYPE_LABEL[t], typeCounts[t]]));
  const nicheChips = Object.keys(nicheCounts).sort((a, b) => nicheCounts[b] - nicheCounts[a]).map(n => [n, n, nicheCounts[n]]);
  const grouped = TYPE_ORDER.map(t => {
    const items = list.filter(x => x.type === t);
    return items.length ? { type: t, items } : null;
  }).filter(Boolean);
  function videoNicheKey(contentNiche) {
    return NICHE_MAP[contentNiche] || (Object.values(NICHE_MAP).includes(contentNiche) ? contentNiche : '');
  }
  const groupQuickAccess = grouped.length >= 3 && grouped.length <= 5 ? quickAccessBar({
    id: 'reup-quick-access', label: 'Đi nhanh đến nhóm đang hiện', mode: 'section',
    items: grouped.map(g => ({ label: TYPE_LABEL[g.type] || g.type, shortLabel: TYPE_LABEL[g.type] || g.type, action: { type: 'section', section: 'reup-group-' + g.type } }))
  }) : '';
  return `
  ${pageBanner('Nguồn tài nguyên Reup', list.length + '/' + enriched.length + ' nguồn · chỉ tham khảo, phải transform trước khi dùng', [
    { icon: ICONS.link, label: 'Tổng nguồn', value: enriched.length, sub: list.length === enriched.length ? 'Hiện tất cả' : 'Đang lọc ' + list.length },
    { icon: ICONS.niche, label: 'Loại nguồn', value: Object.keys(typeCounts).filter(k => k && k !== 'all').length, sub: 'Bilibili / Douyin / Stock...' },
    { icon: ICONS.video, label: 'Gắn SKU video', value: enriched.filter(x => x.sku).length, sub: 'trỏ về kho Video' },
    { icon: ICONS.doc, label: 'Lưu ý', value: 'Reused', sub: 'transform + bản quyền' }
  ])}
  <div class="card p-4 sm:p-5 mb-5">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
  <label class="sr-only" for="fq">Tìm nguồn reup</label>
  <input id="fq" value="${esc(state.reupQ)}" placeholder="Tìm nguồn, host, SKU, ngách..." class="search-input-premium w-full sm:flex-1 min-w-0" aria-label="Tìm nguồn reup">
  <button type="button" id="freset-reup" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Loại nguồn</div>
  <div class="flex flex-wrap gap-2">
    ${typeChips.map(([id, label, n]) => `<button type="button" data-reup-type="${id}" class="filter-btn ${state.reupType === id ? 'active' : ''}">${label} · ${n}</button>`).join('')}
  </div>
</div>
<div class="mt-3.5">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách / mục đích</div>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-reup-niche="" class="filter-btn ${!state.reupNiche ? 'active' : ''}">Mọi ngách · ${typeCounts.all || 0}</button>
    ${nicheChips.map(([id, label, n]) => `<button type="button" data-reup-niche="${esc(id)}" class="filter-btn ${state.reupNiche === id ? 'active' : ''}">${esc(label)} · ${n}</button>`).join('')}
  </div>
</div>
  </div>
  ${groupQuickAccess}
  <div class="space-y-6" id="reup-results">
${grouped.map(g => {
    const vKey = videoNicheKey(g.items[0] && g.items[0].contentNiche);
    return `
  <section id="reup-group-${esc(g.type)}" class="quick-target min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h2 class="text-base font-bold text-white font-heading">${esc(TYPE_LABEL[g.type] || g.type)}</h2>
      <span class="badge badge-muted">${g.items.length} nguồn</span>
      ${vKey ? `<button type="button" data-open-niche="${esc(vKey)}" class="text-xs text-brand-400 hover:text-brand-300 font-medium">Xem video ngách →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
      ${g.items.map(n => `
        <article class="card p-4 min-w-0 overflow-hidden flex flex-col">
          <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
            <span class="badge shrink-0 ${TYPE_BADGE[n.type] || 'badge-muted'}">${TYPE_LABEL[n.type] || 'Khác'}</span>
            <span class="badge badge-blue shrink-0 truncate max-w-[140px]" title="${esc(n.contentNiche)}">${esc(n.contentNiche)}</span>
          </div>
          <h3 class="text-[13.5px] font-semibold text-white leading-snug line-clamp-2 min-h-[38px] break-words [overflow-wrap:anywhere]">${esc(n.title)}</h3>
          <div class="mt-2 text-[11px] text-gray-400 truncate">${esc(n.host || '')}</div>
          <div class="mt-1 text-[11px] text-gray-500 font-mono truncate">${esc(n.sku)}</div>
          ${n.videoTitle ? `<div class="mt-1 text-[11px] text-gray-300 line-clamp-1 break-words">Nguồn video: ${esc(n.videoTitle)}</div>` : ''}
          ${n.videoNiche && n.videoNiche !== n.contentNiche ? `<div class="mt-1 text-[10px] text-amber-400/80">Video mẹ thuộc: ${esc(n.videoNiche)}</div>` : ''}
          <div class="mt-auto pt-3 flex flex-wrap gap-2">
            ${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold">↗ Mở nguồn</a>` : ''}
            ${n.file ? `<a href="${esc(n.file)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11px] text-lime-200">📄 File local</a>` : ''}
            ${n.videoTitle ? `<a href="/lotrinh/${encodeURIComponent(n.sku)}" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-[11px] text-gray-200">▶ Video gốc</a>` : ''}
          </div>
        </article>`).join('')}
    </div>
  </section>`;
  }).join('') || '<div class="card p-12 text-center text-gray-400 col-span-full"><div class="text-2xl mb-2">🔍</div>Không tìm thấy nguồn reup</div>'}
  </div>`;
}


function buildRawSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const records = window._rawKenhRecords || [];
  const suggestions = [];
  const seenKeys = new Set();

  for (const r of records) {
    const ch = r.channel || {};
    const ocr = r.ocr || {};
    const vision = r.visionAnalysis || {};
    const chTitle = ch.title || vision.channelName || r.id;
    const handle = ch.handle || vision.handle || '';
    const rid = r.id || '';
    const niche = r.editorialNiche || r.niche || '';
    const demoVid = r.featuredDemoVideo || {};

    // 1. Check Channel & Handle & RAW ID Match
    const chKey = 'ch:' + rid;
    if (!seenKeys.has(chKey)) {
      if (chTitle.toLowerCase().includes(q) || handle.toLowerCase().includes(q) || rid.toLowerCase().includes(q)) {
        seenKeys.add(chKey);
        suggestions.push({
          type: 'channel',
          icon: '📺',
          badge: rid,
          badgeColor: 'bg-red-950/60 text-red-300 border-red-800/60',
          title: chTitle,
          sub: `${handle ? handle + ' · ' : ''}${niche}${ch.subscribers ? ' · ' + Number(ch.subscribers).toLocaleString() + ' subs' : ''}`,
          searchTerm: chTitle,
          rawId: rid,
          priority: rid.toLowerCase() === q || chTitle.toLowerCase().startsWith(q) ? 100 : 80
        });
      }
    }

    // 2. Check Demo Video Match
    if (demoVid.title && demoVid.title.toLowerCase().includes(q)) {
      const vidKey = 'vid:' + (demoVid.videoId || demoVid.title);
      if (!seenKeys.has(vidKey)) {
        seenKeys.add(vidKey);
        suggestions.push({
          type: 'video',
          icon: '🎬',
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
      if (row.title && row.title.toLowerCase().includes(q)) {
        const vidKey = 'vid:' + row.title;
        if (!seenKeys.has(vidKey)) {
          seenKeys.add(vidKey);
          suggestions.push({
            type: 'video',
            icon: '🎬',
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
    if (niche && niche.toLowerCase().includes(q)) {
      const nKey = 'niche:' + niche;
      if (!seenKeys.has(nKey)) {
        seenKeys.add(nKey);
        suggestions.push({
          type: 'niche',
          icon: '🏷️',
          badge: 'Ngách',
          badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
          title: niche,
          sub: 'Lọc toàn bộ kênh mẫu thuộc ngách này',
          searchTerm: niche,
          rawId: null,
          priority: 60
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 7);
}

window.showRawSearchSuggestions = function(inputVal, _premerged) {
  const box = document.getElementById('raw-search-suggestions');
  if (!box) return;
  const q = (inputVal || '').trim();
  if (!q) {
    box.innerHTML = '';
    box.classList.add('hidden');
    return;
  }

  const localItems = buildRawSearchSuggestions(q);
  if (window.H2Search && !_premerged) {
    window.H2Search.fetchApiSearch(q, 6).then(function (ftsRows) {
      const ftsItems = window.H2Search.ftsToSuggestions(ftsRows);
      const merged = window.H2Search.mergeSuggestions(localItems, ftsItems, 12);
      window.showRawSearchSuggestions(inputVal, merged);
    }).catch(function () {});
  }
  let items = (Array.isArray(_premerged) ? _premerged : localItems);
  if (items.length === 0) {
    box.innerHTML = `
      <div class="p-3 text-xs text-gray-400 flex items-center justify-between bg-ink-deep" >
        <span>Không tìm thấy gợi ý khớp với "<strong>${esc(q)}</strong>"</span>
        <span class="text-[10px] text-gray-500 font-mono">Gõ tiếp hoặc nhấn Reset</span>
      </div>`;
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = `
    <div class="px-3.5 py-2 bg-[#060910] text-[10.5px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-[#1e293b]">
      <span class="flex items-center gap-1.5"><span class="text-brand-400">⚡</span> Gợi ý khớp kênh & video raw (${items.length})</span>
      <span class="text-gray-500 font-normal">Nhấp để chọn hoặc xem hồ sơ</span>
    </div>
    ${items.map((item, idx) => `
      <div class="js-sug-row px-3.5 py-2.5 hover:bg-[#1e293b] cursor-pointer flex items-center justify-between gap-3 transition-colors group bg-ink-deep" data-idx="${idx}" data-term="${esc(item.searchTerm)}" data-raw-id="${esc(item.rawId || '')}" data-type="${esc(item.type)}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-base shrink-0">${item.icon}</span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">${highlightQuery(item.title, q)}</div>
            <div class="text-[11px] text-gray-400 truncate">${esc(item.sub)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}">${esc(item.badge)}</span>
          ${item.rawId ? `<button type="button" class="js-sug-open-modal text-[10px] bg-brand-600/80 hover:bg-brand-500 text-white font-bold px-2 py-0.5 rounded transition shadow" data-raw-id="${esc(item.rawId)}" title="Mở trực tiếp hồ sơ kênh">Mở ↗</button>` : ''}
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
  window._rawKenhRecords = records;
  const q = (state.rawQ || '').trim().toLowerCase();
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
  const riskCount = records.filter(r => r.vitalityAudit && (r.vitalityAudit.healthStatus === 'DORMANT_LONG' || r.vitalityAudit.healthStatus === 'DEAD_OR_PURGED' || r.vitalityAudit.monetizationStatus === 'MONETIZED_AT_RISK')).length;
  const yppCount = records.filter(r => r.vitalityAudit && (r.vitalityAudit.monetizationStatus === 'MONETIZED_ACTIVE' || r.vitalityAudit.monetizationStatus === 'MONETIZED')).length;

  const filtered = records.filter(r => {
    const ch = r.channel || {};
    const ocr = r.ocr || {};
    const vA = r.vitalityAudit || {};
    const aL = r.audioLanguageInfo || {};
    const title = ((ch.title || '') + ' ' + (ocr.channelName || '')).toLowerCase();
    const handle = ((ch.handle || '') + ' ' + (ocr.handle || '')).toLowerCase();
    const fname = (r.fileName || '').toLowerCase();
    const n = (r.editorialNiche || r.niche || 'Chưa phân loại').toLowerCase();
    const lName = (aL.language || 'Tiếng Anh (English)').toLowerCase();
    const lCode = (aL.code || '').toLowerCase();
    const _nRaw = r.editorialNiche || r.niche || 'Chưa phân loại';
    if (state.rawGroup && rawNicheGroup(_nRaw) !== state.rawGroup) return false;
    if (currentNiche && _nRaw !== currentNiche) return false;
    if (currentLang && (aL.language || 'Tiếng Anh (English)') !== currentLang) return false;
    if (state.rawVitality === 'active' && vA.healthStatus !== 'ACTIVE') return false;
    if (state.rawVitality === 'slow' && vA.healthStatus !== 'SLOW') return false;
    if (state.rawVitality === 'dormant' && vA.healthStatus !== 'DORMANT_MID') return false;
    if (state.rawVitality === 'risk' && vA.healthStatus !== 'DORMANT_LONG' && vA.healthStatus !== 'DEAD_OR_PURGED' && vA.monetizationStatus !== 'MONETIZED_AT_RISK') return false;
    if (state.rawVitality === 'ypp' && vA.monetizationStatus !== 'MONETIZED_ACTIVE' && vA.monetizationStatus !== 'MONETIZED') return false;
    const tvF = r.thumbnailVision || null;
    if (state.rawFaceless === 'faceless' && !(tvF && tvF.isFaceless)) return false;
    if (state.rawFaceless === 'hasface' && !(tvF && !tvF.isFaceless)) return false;
    const rid = (r.id || '').toLowerCase();
    const demoVidTitle = (r.featuredDemoVideo && r.featuredDemoVideo.title ? r.featuredDemoVideo.title : '').toLowerCase();
    const otherVidTitles = [
      ...(r.visionAnalysis && r.visionAnalysis.videoTitles ? r.visionAnalysis.videoTitles : []),
      ...(r.ocr && Array.isArray(r.ocr.videoRows) ? r.ocr.videoRows.map(row => row.title || '') : [])
    ].join(' ').toLowerCase();

    if (q && !SC.matchesQuery([title, handle, fname, n, rid, lName, lCode, demoVidTitle, otherVidTitles], q)) return false;
    return true;
  });

  const verifiedCount = records.filter(r => (r.vidiqVerification && r.vidiqVerification.status === 'VERIFIED') || r.status === 'VERIFIED_MATCH' || r.status === 'VERIFIED_UNIQUE').length;
  const visionCount = records.filter(r => r.visionAnalysis).length;
  const withHandle = records.filter(r => (r.channel || {}).handle).length;
  const ocrCount = records.filter(r => r.ocr).length;
  const facelessCount = records.filter(r => r.thumbnailVision && r.thumbnailVision.isFaceless).length;
  const hasFaceCount = records.filter(r => r.thumbnailVision && !r.thumbnailVision.isFaceless).length;

  return `
  ${pageBanner('Raw kênh mẫu', SC.pad2(filtered.length) + '/' + SC.pad2(records.length) + ' hồ sơ · bóc tách qua Vision AI + OCR + vidIQ', [
    { icon: ICONS.image, label: 'Ảnh raw', value: records.length, sub: filtered.length === records.length ? 'Hiện tất cả' : 'Đang lọc ' + filtered.length },
    { icon: ICONS.niche, label: 'Nhóm chủ đề', value: sortedGroups.length, sub: Object.keys(nicheCounts).length + ' ngách chi tiết' },
    { icon: ICONS.search, label: 'Đang hoạt động', value: activeCount, sub: 'ra video gần đây' },
    { icon: ICONS.channel, label: 'Nguy cơ tắt YPP', value: riskCount, sub: 'dừng đăng >6 tháng' },
    { icon: ICONS.doc, label: 'Verified vidIQ', value: verifiedCount, sub: 'khớp vidIQ live' },
    { icon: ICONS.doc, label: 'Faceless (Vision)', value: facelessCount, sub: hasFaceCount ? (hasFaceCount + ' kênh có mặt người thật') : 'phân loại bằng AI' },
    { icon: ICONS.search, label: 'Có OCR', value: ocrCount, sub: 'quét từ ảnh' }
  ])}
  <div class="card p-4 sm:p-5 mb-5 border-brand-500/30 bg-brand-950/20" role="note">
<div class="flex items-start gap-3">
  <span class="text-lg shrink-0">📸</span>
  <div class="min-w-0">
    <h2 class="text-sm font-bold text-white">Kho Ảnh Raw & Dữ Liệu Bóc Tách ${records.length} Kênh Mẫu Thực Chiến</h2>
    <p class="text-xs text-gray-300 mt-1 leading-relaxed">Hiển thị trực quan 100% ảnh chụp màn hình kênh đối thủ thực tế kèm số liệu bóc tách Vision AI, OCR và kiểm định sức sống YPP. Bấm vào ảnh để xem kích thước đầy đủ.</p>
  </div>
</div>
  </div>
  <div class="card p-4 sm:p-5 mb-5 overflow-visible search-filter-card" style="position:relative; z-index:60; contain:none !important;">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center relative">
  <label class="sr-only" for="fq">Tìm ảnh raw</label>
  <div class="relative w-full sm:flex-1 min-w-0" id="raw-search-wrap">
    <input id="fq" value="${esc(state.rawQ)}" autocomplete="off" placeholder="Tìm theo tên kênh, handle, ngách, video bão view, tên file..." class="search-input-premium w-full min-w-0 pr-9" aria-label="Tìm ảnh raw kênh mẫu">
    ${state.rawQ ? `<button type="button" id="btn-clear-raw-q" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-gray-400 hover:text-white text-xs transition z-10" title="Xóa tìm kiếm">✕</button>` : ''}
    <div id="raw-search-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 border border-[#334155] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-[#1e293b]/80" style="background-color:#0b0f19 !important; background:rgba(11,15,25,0.98) !important; backdrop-filter:blur(28px) saturate(180%) !important; -webkit-backdrop-filter:blur(28px) saturate(180%) !important; z-index:9999 !important; box-shadow:0 25px 60px -10px rgba(0,0,0,0.98), 0 0 0 1px rgba(255,255,255,0.1) !important;"></div>
  </div>
  <button type="button" id="freset-raw" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách phát hiện · theo nhóm chủ đề</div>
  <p class="text-[11px] text-gray-500 mb-2.5 leading-relaxed">Các kênh cùng chủ đề được gom về một nhóm. Bấm nhóm để xem ngách chi tiết bên trong.</p>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-raw-group="" class="filter-btn ${!state.rawGroup ? 'active' : ''}">Mọi nhóm · ${records.length}</button>
    ${sortedGroups.map(g => `<button type="button" data-raw-group="${esc(g)}" class="filter-btn ${state.rawGroup === g ? 'active' : ''}" title="${esc(g)} — ${groupCounts[g]} kênh thuộc ${RAW_NICHE_GROUPS[g].filter(n => nicheCounts[n]).length} ngách">${esc(g)} · ${groupCounts[g]}</button>`).join('')}
  </div>
  ${state.rawGroup ? (() => {
    const inGroup = sortedNiches.filter(n => rawNicheGroup(n) === state.rawGroup);
    return `
  <div class="mt-3 pt-2.5 border-t border-hairline">
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="text-[11px] text-gray-400 font-semibold">↳ Ngách trong nhóm <span class="text-brand-300">${esc(state.rawGroup)}</span> (${inGroup.length} ngách · ${groupCounts[state.rawGroup]} kênh)</div>
      <button type="button" data-raw-niche="" class="text-[11px] font-semibold ${!currentNiche ? 'text-brand-300' : 'text-gray-400 hover:text-gray-200'} transition-colors shrink-0">Xem tất cả nhóm này</button>
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
  <span class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-gray-400 transition">⚙️ Bộ lọc nâng cao (sức sống · faceless · ngôn ngữ)</span>
  <span class="text-[11px] font-bold text-brand-300 group-hover:text-brand-200 transition shrink-0">${state.rawFiltersExpanded ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
</button>
<div class="${state.rawFiltersExpanded ? '' : 'hidden'}">
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mr-1">Tình trạng sống & YPP:</div>
  <button type="button" data-raw-vitality="" class="filter-btn ${!state.rawVitality ? 'active' : ''}">Tất cả · ${records.length}</button>
  <button type="button" data-raw-vitality="active" class="filter-btn ${state.rawVitality === 'active' ? 'active' : ''}">🟢 Đang hoạt động · ${activeCount}</button>
  <button type="button" data-raw-vitality="slow" class="filter-btn ${state.rawVitality === 'slow' ? 'active' : ''}">🟡 Ra video chậm · ${slowCount}</button>
  <button type="button" data-raw-vitality="dormant" class="filter-btn ${state.rawVitality === 'dormant' ? 'active' : ''}">🟠 Ngủ đông · ${dormantMidCount}</button>
  <button type="button" data-raw-vitality="risk" class="filter-btn ${state.rawVitality === 'risk' ? 'active' : ''}">🔴 Nguy cơ tắt YPP / Dừng lâu · ${riskCount}</button>
  <button type="button" data-raw-vitality="ypp" class="filter-btn ${state.rawVitality === 'ypp' ? 'active' : ''}">💰 Bật kiếm tiền (YPP Active) · ${yppCount}</button>
</div>
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mr-1">Faceless (Vision AI):</div>
  <button type="button" data-raw-faceless="" class="filter-btn ${!state.rawFaceless ? 'active' : ''}">Tất cả · ${records.length}</button>
  <button type="button" data-raw-faceless="faceless" class="filter-btn ${state.rawFaceless === 'faceless' ? 'active' : ''}">🎭 Faceless · ${facelessCount}</button>
  <button type="button" data-raw-faceless="hasface" class="filter-btn ${state.rawFaceless === 'hasface' ? 'active' : ''}">👤 Có mặt người thật · ${hasFaceCount}</button>
</div>
<div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mr-1">Ngôn ngữ giọng đọc:</div>
  <button type="button" data-raw-lang="" class="filter-btn ${!currentLang ? 'active' : ''}">Mọi ngôn ngữ · ${records.length}</button>
  <button type="button" data-raw-lang="Tiếng Anh (English)" class="filter-btn ${currentLang === 'Tiếng Anh (English)' ? 'active' : ''}">🇺🇸 Tiếng Anh · ${langCounts['Tiếng Anh (English)'] || 0}</button>
  <button type="button" data-raw-lang="Tiếng Nhật (Japanese)" class="filter-btn ${currentLang === 'Tiếng Nhật (Japanese)' ? 'active' : ''}">🇯🇵 Tiếng Nhật · ${langCounts['Tiếng Nhật (Japanese)'] || 0}</button>
  <button type="button" data-raw-lang="Tiếng Nga (Russian)" class="filter-btn ${currentLang === 'Tiếng Nga (Russian)' ? 'active' : ''}">🇷🇺 Tiếng Nga · ${langCounts['Tiếng Nga (Russian)'] || 0}</button>
  <button type="button" data-raw-lang="Tiếng Tây Ban Nha (Spanish)" class="filter-btn ${currentLang === 'Tiếng Tây Ban Nha (Spanish)' ? 'active' : ''}">🇪🇸 Tiếng Tây Ban Nha · ${langCounts['Tiếng Tây Ban Nha (Spanish)'] || 0}</button>
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
    const pager = totalPages <= 1 ? '' : `<div class="flex items-center justify-between gap-2 mb-3 text-xs text-gray-400"><span>Trang ${page}/${totalPages} ? ${filtered.length} h? s?</span><span class="flex gap-1">${page > 1 ? `<button type="button" class="filter-btn" data-action="raw-page" data-page="${page - 1}">? Tr??c</button>` : ''}${page < totalPages ? `<button type="button" class="filter-btn" data-action="raw-page" data-page="${page + 1}">Sau ?</button>` : ''}</span></div>`;
    return pager + `
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
    ${paged.map(r => {

    const ch = r.channel || {};
    const vision = r.visionAnalysis || {};
    const ocr = r.ocr || null;
    const vA = r.vitalityAudit || {};
    const vG = r.vidiqVerification && r.vidiqVerification.growth30d;
    const ytUrl = ch.url || ('https://www.youtube.com/results?search_query=' + encodeURIComponent(ch.title || ch.handle || ''));
    const statusBadge = (r.vidiqVerification && r.vidiqVerification.status === 'VERIFIED')
      ? `<span class="badge badge-green">vidIQ Verified</span>`
      : (r.duplicateOf ? `<span class="badge badge-amber">Trùng (${esc(r.duplicateOf)})</span>` : (r.status === 'OCR_COMPLETE' ? `<span class="badge badge-blue">OCR đủ</span>` : `<span class="badge badge-amber">Manual</span>`));
    const langInfo = r.audioLanguageInfo || (r.deepIntelligence && r.deepIntelligence.audioLanguage ? { flag: r.deepIntelligence.languageFlag || '🌐', code: r.deepIntelligence.audioLanguage } : null);
    const imgSrc = r.fileName ? 'assets/raw-kenh/' + encodeURIComponent(r.fileName) : 'assets/thumbs/placeholder.svg';
    const tv = r.thumbnailVision || null;
    return `
    <article class="card overflow-hidden min-w-0 flex flex-col hover:border-brand-500 transition group" data-raw-card="${esc(r.id)}">
      <div class="js-view-raw-image relative bg-ink-950 aspect-video overflow-hidden border-b border-ink-700 cursor-pointer" data-src="${esc(imgSrc)}" data-title="${esc((ch.title || r.id).trim())}" title="Bấm xem ảnh kích thước đầy đủ">
        <img src="${esc(imgSrc)}" alt="Ảnh kênh: ${esc((ch.title || r.id).trim())}" width="640" height="360" onerror="this.onerror=null;this.src='assets/thumbs/placeholder.svg'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async">
        <div class="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span class="bg-ink-900/80 px-2 py-0.5 rounded-xl text-[10px] font-mono text-gray-300 border border-white/10 truncate">${esc(r.id)}</span>
          ${langInfo ? `<span class="bg-sky-950/85 text-sky-300 font-bold px-1.5 py-0.5 rounded-md border border-sky-500/40 text-[9.5px] shrink-0" title="${esc(langInfo.language || langInfo.code)}">${esc(langInfo.flag)} ${esc(langInfo.code ? langInfo.code.split('-')[0].toUpperCase() : '')}</span>` : ''}
        </div>
        <span class="absolute top-2 right-2 bg-brand-600/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-xl truncate max-w-[50%]">${esc(r.editorialNiche || r.niche || 'Chưa rõ')}</span>
        ${tv ? `<span class="absolute bottom-2 left-2 ${tv.isFaceless ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : 'bg-red-950/90 text-red-300 border-red-500/50'} text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-sm z-10" title="Vision AI (9Router local) phân loại cấp kênh · ${esc(tv.agreement || '')}">${tv.isFaceless ? '🎭 Faceless' : '👤 Có mặt người thật'}</span>` : ''}
        <span class="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white text-[10px] px-2 py-0.5 rounded-lg border border-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">🔍 Xem ảnh</span>
      </div>
      <div class="p-3.5 flex-1 flex flex-col gap-2 min-w-0">
        <div class="flex items-start justify-between gap-2 min-w-0">
          <h3 class="text-sm font-bold text-white group-hover:text-brand-300 transition line-clamp-1 min-w-0">${esc((ch.title || '').trim() || 'Chưa rõ tên')}</h3>
          <div class="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            ${statusBadge}
            ${vA.monetizationStatus === 'MONETIZED_AT_RISK' ? `<span class="badge badge-red text-[10px] font-bold">⚠️ Rủi ro YPP</span>` : ''}
          </div>
        </div>
        ${(ch.handle || vision.handle || (ocr && ocr.handle)) ? `<div class="text-[11px] text-brand-400 font-mono truncate">${esc(decodeURIComponent(ch.handle || vision.handle || (ocr && ocr.handle)))}</div>` : ''}
        ${ch.subscribers ? `
        <div class="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span class="truncate">${Number(ch.subscribers).toLocaleString()} subs · ${Number(ch.views || 0).toLocaleString()} views</span>
          ${vG && vG.subscribersGained ? `<span class="text-gray-400 font-normal shrink-0">(+${Number(vG.subscribersGained).toLocaleString()}/30d)</span>` : ''}
        </div>` : ''}
        ${vA.healthStatus === 'DORMANT_LONG' ? `
        <div class="text-[10.5px] bg-red-950/70 border border-red-800/80 rounded-xl px-2.5 py-1.5 text-red-200 font-medium flex items-center gap-1.5">
          <span class="text-red-400 font-bold animate-pulse">🔴</span> Dừng đăng ${vA.daysSinceLatest} ngày — Nguy cơ tắt YPP / Die
        </div>` : (vA.daysSinceLatest != null ? `
        <div class="text-[11px] text-gray-400 flex items-center justify-between">
          <span class="truncate">📅 Video gần nhất: <b class="text-gray-200">${esc(vA.latestUploadDate || 'N/A')}</b></span>
          <span class="${vA.healthStatus === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'} shrink-0 ml-1">${vA.daysSinceLatest}d trước</span>
        </div>` : '')}
        ${vision.mainTopic ? `<p class="text-[11px] text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2"><span class="text-amber-400 font-semibold">Chủ đề:</span> ${esc(vision.mainTopic)}</p>` : ''}
        ${vision.videoTitles && vision.videoTitles.length ? `<p class="text-[11px] text-gray-400 italic line-clamp-1">"${esc(vision.videoTitles[0])}"</p>` : ''}
        ${tv ? `<p class="text-[11px] text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2"><span class="${tv.isFaceless ? 'text-emerald-400' : 'text-red-400'} font-semibold">Vision:</span> ${tv.isFaceless ? 'Faceless' : 'Có mặt người thật'} · ${esc(tv.facelessType || '')} · Ngách: ${esc(tv.thumbnailNiche || '—')}${tv.needsReview ? ' <span class="text-amber-400 font-semibold">· cần review</span>' : ''}</p>` : ''}
        ${ocr ? `<p class="text-[11px] text-gray-400 truncate">${esc([ocr.subsText, ocr.videoCountText, ocr.videoRows && ocr.videoRows[0] ? ocr.videoRows[0].vph : null].filter(Boolean).join(' · '))}</p>` : ''}
        ${r.deepIntelligence ? `
        <div class="text-[10px] bg-white/[0.03] border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-gray-300">
          <span class="text-amber-300 font-medium">⚡ ${r.deepIntelligence.topVideosCount} videos</span>
          <span class="text-sky-300 font-medium">🏷️ ${r.deepIntelligence.tagsCount} tags</span>
          <span class="text-emerald-300 font-medium">💰 ${esc(vA.estimatedMonthlyRev || 'N/A')}</span>
          <span class="text-emerald-400 font-medium ml-auto">🛡️ ${esc(vA.healthBadge || (r.deepIntelligence.longevityStatus ? r.deepIntelligence.longevityStatus.replace(/\(.*?\)/g, '').trim() : ''))}</span>
        </div>` : ''}
        ${(r.featuredDemoVideo && r.featuredDemoVideo.videoId) ? `
        <button type="button" class="js-quick-video btn-quick-demo w-full mt-1.5 py-2 px-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-400 text-rose-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[38px]" data-vid="${esc(r.featuredDemoVideo.videoId)}" data-title="${esc(r.featuredDemoVideo.title)}" data-channel="${esc((ch.title || r.id).trim())}" data-badge="🎬 Demo Tuyến Nội Dung">
          <span>🎬 Xem Demo Tuyến Mới Nhất</span> <span class="text-xs font-bold text-rose-400">▶</span>
        </button>` : ''}
        <button type="button" class="btn-open-raw-deep w-full mt-1.5 py-2 px-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 border border-blue-500/50 hover:border-blue-400 text-blue-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-blue-950/50 min-h-[38px]" data-raw-id="${esc(r.id)}" data-jump="mission-control">
          <span>⚡ Xem Prompts & Vũ Khí Tác Chiến</span> →
        </button>
        <button type="button" class="btn-open-raw-deep w-full mt-1.5 py-2 px-2.5 bg-brand-900/30 hover:bg-brand-800/50 border border-brand-500/30 hover:border-brand-400 text-brand-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[38px]" data-raw-id="${esc(r.id)}">
          <span>📊 Xem Hồ Sơ & Top Videos Chi Tiết</span> →
        </button>
        <div class="mt-auto pt-2.5 border-t border-ink-700 flex items-center justify-between gap-2 text-[11px]">
          <span class="text-emerald-400 font-medium truncate min-w-0 flex items-center gap-1"><span>📸</span> Ảnh chụp thực tế</span>
          <a href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-brand-300 hover:text-white bg-brand-500/20 hover:bg-brand-500 px-2.5 py-1.5 rounded-xl transition font-medium whitespace-nowrap shrink-0">Mở YouTube ↗</a>
        </div>
      </div>
    </article>`;
    }).join('')}
  </div>`;
})()}
</div>
  </div>`;
}

async function renderKenh() {
  const kenh = await loadJSON('data-tabs/kenh-mau.json');
  const NICHE_ORDER = ['Triết lý / Tâm linh', 'Sức khỏe / Lão hóa', 'Kinh tế / Tài chính', 'Khoa học EN', 'Reup / Hoạt hình', 'Drama / Stories', 'Lịch sử / Quân sự', 'Everyday History EN (lịch sử đồ vật thường ngày)', 'Edit / Thumb', 'Nhân bản / Kênh', 'Share key / Ngách nhỏ', 'Kiếm tiền / Chính sách', 'Hệ thống / Quy trình', 'Nền tảng / Tool', 'Khác'];
  function initial(handle) {
    const t = String(handle || '').replace(/^@/, '').trim();
    return (t[0] || '?').toUpperCase();
  }
  function avatarHtml(ch) {
    if (ch.avatar) {
      return `<img src="${esc(ch.avatar)}" alt="${esc(ch.handle || ch.name || 'Kênh')}" width="44" height="44" class="w-11 h-11 rounded-xl object-cover shrink-0 bg-ink-700" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="w-11 h-11 rounded-xl bg-brand-600/25 text-brand-200 font-bold text-sm items-center justify-center shrink-0 hidden">${esc(initial(ch.handle))}</div>`;
    }
    return `<div class="w-11 h-11 rounded-xl bg-brand-600/25 text-brand-200 font-bold text-sm flex items-center justify-center shrink-0">${esc(initial(ch.handle))}</div>`;
  }
  const nicheCounts = kenh.reduce((a, x) => { const n = x.niche || 'Khác'; a[n] = (a[n] || 0) + 1; return a; }, {});
  const q = (state.kenhQ || '').trim().toLowerCase();
  const list = kenh.filter(ch => {
    if (ch.dead) return false;
    if (state.kenhNiche && (ch.niche || 'Khác') !== state.kenhNiche) return false;
    if (!q) return true;
    const hay = [ch.handle || '', (ch.handle || '').replace(/^@/, ''), ch.niche, (ch.niches || []).join(' '), (ch.markets || []).join(' '), ch.url, ch.ngay_do || ''].join(' ').toLowerCase();
    return SC.matchesQuery([hay], q);
  }).slice().sort((a, b) => (b.count || 0) - (a.count || 0));
  const allKenhNiches = [...NICHE_ORDER.filter(n => nicheCounts[n]), ...Object.keys(nicheCounts).filter(n => !NICHE_ORDER.includes(n))];
  const chips = allKenhNiches.map(n => [n, n, nicheCounts[n]]);
  const grouped = [];
  allKenhNiches.forEach(n => {
    const items = list.filter(x => (x.niche || 'Khác') === n);
    if (items.length) grouped.push({ niche: n, items });
  });
  function videoNicheKey(niche) {
    return NICHE_MAP[niche] || (Object.values(NICHE_MAP).includes(niche) ? niche : (niche && niche !== 'Khác' ? niche : ''));
  }
  return `
  ${pageBanner('Kênh mẫu / Đối thủ', list.length + '/' + kenh.length + ' kênh · nhóm theo ngách từ video H2DEV', [
    { icon: ICONS.channel, label: 'Kênh mẫu', value: kenh.length, sub: list.length === kenh.length ? 'Hiện tất cả' : 'Đang lọc ' + list.length },
    { icon: ICONS.niche, label: 'Ngách có kênh', value: Object.keys(nicheCounts).length, sub: 'chip bên dưới' },
    { icon: ICONS.home, label: 'Có avatar', value: kenh.filter(k => k.avatar).length, sub: 'thumb local' },
    { icon: ICONS.link, label: 'Đang hiện', value: list.length, sub: 'sau filter' },
    { icon: ICONS.doc, label: 'Dead 404', value: kenh.filter(k => k.dead).length, sub: 'đã ẩn' }
  ])}
  <div class="card p-4 sm:p-5 mb-5">
<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
  <label class="sr-only" for="fq">Tìm kênh</label>
  <input id="fq" value="${esc(state.kenhQ)}" placeholder="Tìm theo handle, tên kênh, ngách, thị trường..." class="search-input-premium w-full sm:flex-1 min-w-0" aria-label="Tìm kênh">
  <button type="button" id="freset-kenh" class="shrink-0 bg-surface-2 hover:bg-surface border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-fg-2 hover:text-fg transition-colors">Reset</button>
</div>
<div class="mt-4 pt-3 border-t border-hairline">
  <div class="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Ngách đối thủ</div>
  <div class="flex flex-wrap gap-2">
    <button type="button" data-kenh-niche="" class="filter-btn ${!state.kenhNiche ? 'active' : ''}">Mọi ngách · ${kenh.length}</button>
    ${chips.map(([id, label, n]) => `<button type="button" data-kenh-niche="${esc(id)}" class="filter-btn ${state.kenhNiche === id ? 'active' : ''}">${esc(label)} · ${n}</button>`).join('')}
  </div>
</div>
  </div>
  <div class="space-y-6">
${grouped.map(g => {
    const vKey = videoNicheKey(g.niche);
    return `
  <section class="min-w-0">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <h2 class="text-base font-bold text-white">${esc(g.niche)}</h2>
      <span class="badge badge-muted">${g.items.length} kênh</span>
      ${vKey ? `<button type="button" data-open-niche="${esc(vKey)}" class="text-xs text-brand-400 hover:text-brand-300 font-medium">Xem video ngách →</button>` : ''}
    </div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
      ${g.items.map(ch => `
        <a href="${esc(ch.url)}" target="_blank" rel="noopener noreferrer" class="card p-3 flex items-center gap-3 min-w-0 overflow-hidden hover:border-brand-500">
          ${avatarHtml(ch)}
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-white truncate">${esc(ch.handle)}</div>
            <div class="text-[11px] text-gray-400 truncate">${esc(ch.niche || 'Khác')} · ${ch.count || 1} video H2DEV</div>
            ${(ch.markets && ch.markets.length) ? `<div class="text-[10px] text-gray-500 truncate mt-0.5">${ch.markets.map(esc).join(' · ')}</div>` : ''}
          </div>
          <span class="text-gray-500 shrink-0 text-sm">↗</span>
        </a>`).join('')}
    </div>
  </section>`;
  }).join('') || '<div class="text-gray-400 text-center py-10">Không tìm thấy kênh</div>'}
  </div>`;
}

async function renderChienLuoc() {
  const cl = await loadJSON('data-tabs/chien-luoc.json');
  const videos = await loadJSON('data-tabs/videos.json');
  const docs = await loadJSON('data-tabs/tai-lieu-full.json');
  const kenh = await loadJSON('data-tabs/kenh-mau.json');
  const nguon = await loadJSON('data-tabs/nguon-reup.json');
  const nx = await loadJSON('data-tabs/ngach-xanh.json');
  const checks = loadChecks();
  const noteOf = {
    'Triết lý / Tâm linh': 'xanh · JP/KR/US',
    'Sức khỏe / Lão hóa': 'xanh · senior',
    'Kinh tế / Tài chính': 'xanh · US RPM cao hơn',
    'Reup / Hoạt hình': 'có điều kiện · reused + copyright',
    'Drama / Stories': 'thận trọng',
    'Nhân bản / Kênh': 'meta · học clone, không phải ngách đăng',
    'Share key / Ngách nhỏ': 'meta · học chọn key, không copy key',
    'Kiếm tiền / Chính sách': 'meta · kháng lỗi YPP',
    'Edit / Thumb': 'meta · packaging',
    'Nền tảng / Tool': 'meta · tool / cộng đồng',
    'Lịch sử / Quân sự': 'thận trọng · 1 key WWII',
    'Khác': 'không còn — đã gắn hết'
  };
  const scoreOrder = ['Triết lý / Tâm linh', 'Sức khỏe / Lão hóa', 'Kinh tế / Tài chính', 'Reup / Hoạt hình', 'Drama / Stories', 'Nhân bản / Kênh', 'Share key / Ngách nhỏ', 'Kiếm tiền / Chính sách', 'Edit / Thumb', 'Nền tảng / Tool', 'Lịch sử / Quân sự', 'Khác'];
  const hist = videos.reduce((a, v) => { const n = v.niche || 'Khác'; a[n] = (a[n] || 0) + 1; return a; }, {});
  const score = scoreOrder.filter(k => hist[k]).map(k => ({ label: k, n: hist[k], note: noteOf[k] || '', key: k }));
  Object.keys(hist).forEach(k => { if (!scoreOrder.includes(k)) score.push({ label: k, n: hist[k], note: '', key: k }); });
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

  return `
  <div class="mb-4">
<p class="page-lede">Ngách không quyết định xanh/đỏ — <b class="text-white">cách làm</b> quyết định. Bảng điểm đếm live ${scored}/${videos.length} video. Chính sách lấy từ YouTube Help, không lấy blog creator làm luật.</p>
  </div>

  <!-- Panel 1: 4 Nguyên Tắc Cốt Lõi & Bento Metrics -->
  <div id="cl-panel-principles" class="cl-panel" style="${(curTab === 'principles' || isAll) ? 'display:flex;' : 'display:none;'}">
<div class="bento-grid">
  ${statCard(ICONS.video, 'Video local', videos.length, `${videos.length} video · ${scored} đã điểm`, 'video')}
  ${statCard(ICONS.doc, 'Kịch bản / tài liệu', docs.length, `${docs.length} file · catalog`, 'kichban')}
  ${statCard(ICONS.channel, 'Kênh đối thủ', kenh.length, `${kenh.length} kênh · đã check 30 ngày`, 'kenh')}
  ${statCard(ICONS.link, 'Nguồn reup', nguon.length, `${nguon.length} nguồn · match`, 'nguonreup')}
</div>
<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
  ${principles.map(p => `
    <article class="card p-4 min-w-0">
      <div class="text-[11px] font-mono text-brand-400 font-bold">${p.tag}</div>
      <h2 class="text-sm font-bold text-white mt-1 font-heading">${esc(p.title)}</h2>
      <p class="text-xs text-gray-400 mt-2 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(p.body)}</p>
    </article>`).join('')}
</div>
  </div>

  <!-- Panel 2: Quy trình xây kênh A-Z (SOP 11 bước) -->
  <div id="cl-panel-workflow" class="cl-panel" style="${(curTab === 'workflow' || isAll) ? 'display:flex;' : 'display:none;'}">
<section>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
    <div>
      <h2 class="page-h2 mb-1">Quy trình xây kênh A–Z (SOP 11 bước thực chiến)</h2>
      <p class="card-note">Quy trình vận hành trọn vẹn từ môi trường, chọn key, kịch bản, tool sản xuất đến AdSense & kháng lỗi.</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <a href="docs/NOI-BO/zoom/QUY-TRINH-XAY-KENH-A-Z.md" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-sm">
        <span>👁️ Đọc trực tiếp Đề cương A–Z</span>
        <span class="font-mono">↗</span>
      </a>
      <a href="docs/ZOOM-00-Quy-trinh-xay-kenh/README.txt" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 text-gray-200 text-xs font-medium transition-colors">
        <span>📄 File gốc .txt</span>
      </a>
    </div>
  </div>
  <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 min-w-0">
    ${steps.map(s => `
      <div class="card p-4 text-left min-w-0 hover:border-brand-500 flex flex-col justify-between transition-colors">
        <div class="flex gap-3">
          <span class="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-700/40 text-brand-300 font-black text-sm flex items-center justify-center shrink-0 font-mono">${String(s.n).padStart(2, '0')}</span>
          <div class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-white font-heading leading-snug">${esc(s.title)}</span>
            <span class="block text-xs text-gray-300 mt-1.5 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(s.detail)}</span>
          </div>
        </div>
        <div class="mt-3.5 pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
          <button type="button" data-open-tab="${esc(s.tab)}"${s.kind != null ? ` data-kind="${esc(s.kind)}"` : ''}${s.promptNiche != null ? ` data-prompt-niche="${esc(s.promptNiche)}"` : ''} class="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            <span>${esc(s.tabLabel)}</span>
            <span class="font-mono">→</span>
          </button>
          ${s.docPath ? `
          <a href="${esc(s.docPath)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-300 transition-colors" title="${esc(s.docTitle || 'Tài liệu SOP')}">
            <span>📄 ${esc(s.docTitle || 'Mở SOP')}</span>
            <span class="font-mono text-[10px]">↗</span>
          </a>` : ''}
        </div>
      </div>`).join('')}
  </div>
</section>
  </div>

  <!-- Panel 3: Phân Bổ Ngách, Điểm Số & Hướng Đi Tiêu Biểu -->
  <div id="cl-panel-distribution" class="cl-panel" style="${(curTab === 'distribution' || isAll) ? 'display:flex;' : 'display:none;'}">
<div class="grid lg:grid-cols-2 gap-4">
  <section class="card p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-1">Điểm số kho H2DEV</h2>
    <p class="text-[11px] text-gray-500 mb-3">Đếm live từ videos.json · ${scored}/${videos.length}</p>
    <div class="space-y-1.5">
      ${score.map(s => `
        <button type="button" data-open-niche="${esc(s.key)}" class="w-full flex items-center gap-3 min-w-0 text-left rounded-xl px-2 py-1.5 hover:bg-ink-700/60">
          <span class="w-8 text-right text-sm font-extrabold text-white shrink-0">${s.n}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-gray-200 truncate">${esc(s.label)}</span>
            <span class="block text-[11px] text-gray-500 truncate">${esc(s.note)}</span>
          </span>
          <span class="text-[11px] text-brand-400 shrink-0">Xem →</span>
        </button>`).join('')}
    </div>
  </section>
  ${(cl.huongDiNoiDung && cl.huongDiNoiDung.length) ? `
  <section class="card p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-1">Các nhóm hướng đi nội dung tiêu biểu</h2>
    <p class="text-xs text-gray-400 mb-3">Các nhóm đề tài khảo sát tham chiếu từ dữ liệu kênh đối thủ và kho bài học. Luôn đo lại bằng vidIQ trước khi bấm máy.</p>
    <div class="grid sm:grid-cols-2 gap-2.5">${cl.huongDiNoiDung.map(h => `
      <button type="button" data-open-tab="${esc(h.tab || 'ngachxanh')}" class="text-left rounded-xl border border-ink-600 hover:border-brand-500 p-2.5 min-w-0 bg-ink-800">
        <div class="text-[11px] font-mono text-brand-400 font-bold">#${h.hang} · ${esc(h.pack)}</div>
        <div class="text-sm font-bold text-white mt-0.5 font-heading">${esc(h.ngach)}</div>
        <div class="text-xs text-gray-400 mt-1.5 leading-relaxed break-words">${esc(h.lyDo)}</div>
      </button>`).join('')}</div>
    ${cl.cachNoiTab ? `<ul class="mt-3 space-y-1 text-[11px] text-gray-400">${cl.cachNoiTab.map(s => '<li>· ' + esc(s) + '</li>').join('')}</ul>` : ''}
  </section>`: ''}
</div>
${(cl.taiSanNoiBo && cl.taiSanNoiBo.length) ? `
<section class="card p-5 sm:p-6 min-w-0">
  <h2 class="page-h2 mb-1">Tài sản ngoài đã đồng bộ vào H2DEV</h2>
  <p class="text-xs text-gray-500 mb-3">Match cái đã có · gôm cái chưa có. Gốc ở Y:\\YTB không xóa. Chi tiết: <a class="text-brand-400 hover:text-brand-300" href="docs/NOI-BO/README.md" target="_blank" rel="noopener">docs/NOI-BO/README.md</a></p>
  <div class="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">${cl.taiSanNoiBo.map(t => `
    <button type="button" data-open-tab="${esc(t.tab || 'kichban')}"${t.kind != null ? ` data-kind="${esc(t.kind)}"` : ''} class="text-left rounded-xl border border-ink-600 hover:border-brand-500 p-3 min-w-0">
      <div class="text-[26px] font-extrabold text-white leading-none">${t.so || '—'}</div>
      <div class="text-sm font-bold text-white mt-1">${esc(t.loai)}</div>
      <div class="text-[11px] text-gray-500 mt-1 font-mono break-all">${esc(t.path || '')}</div>
    </button>`).join('')}</div>
</section>`: ''}
  </div>

  <!-- Panel 4: Lộ Trình YPP 2026-2027, Checklist & Chính Sách -->
  <div id="cl-panel-policy" class="cl-panel" style="${(curTab === 'policy' || isAll) ? 'display:flex;' : 'display:none;'}">
<div>
  <h2 class="page-h2 mb-1">Lộ trình YPP 2026-2027</h2>
  <p class="card-note mb-3">Đừng để kênh chết — giữ YPP bằng cách làm đúng format, không lạm dụng reused.</p>
  <div class="grid lg:grid-cols-3 gap-3.5 mb-4">
    ${ypp.map(y => `
      <article class="card p-4 min-w-0">
        <div class="text-[11px] uppercase tracking-wide ${y.tone} font-bold">${esc(y.when)}</div>
        <h3 class="text-white font-bold mt-1 font-heading">${esc(y.title)}</h3>
        <p class="text-sm text-gray-300 mt-2 leading-relaxed break-words [overflow-wrap:anywhere]">${esc(y.body)}</p>
      </article>`).join('')}
  </div>
</div>
<div class="grid lg:grid-cols-2 gap-4">
  <section class="card p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-3">Checklist trước khi đăng</h2>
    <div class="space-y-2 text-sm text-gray-300">${cl.checklistTruocKhiDang.map((s, i) => {
        const id = 'cl-' + i;
        return `<label class="flex items-start gap-2 break-words [overflow-wrap:anywhere] min-w-0">
          <input type="checkbox" data-check-id="${id}" class="rounded mt-1 shrink-0" ${checks[id] ? 'checked' : ''} aria-label="Checklist ${i + 1}" aria-checked="${checks[id] ? 'true' : 'false'}">
          <span class="min-w-0">${esc(s)}</span>
        </label>`;
      }).join('')}</div>
  </section>
  <section class="card p-5 sm:p-6 min-w-0">
    <h2 class="page-h2 mb-3">Chính sách YouTube phải nhớ</h2>
    <ul class="space-y-2 text-sm text-gray-300">${nx.thongTinChinhSach2026.map(s => `<li class="break-words [overflow-wrap:anywhere]">${esc(s)}</li>`).join('')}</ul>
    <p class="text-xs text-gray-500 mt-4">${esc(cl.nguonDuLieu)}</p>
  </section>
</div>
  </div>`;
}

    return {
      renderTongQuan: renderTongQuan,
      renderVideo: renderVideo,
      renderNgachXanh: renderNgachXanh,
      renderKichBan: renderKichBan,
      renderNguonReup: renderNguonReup,
      renderRawKenh: renderRawKenh,
      renderKenh: renderKenh,
      renderChienLuoc: renderChienLuoc
    };
  }

  global.H2TabContent = { createTabContent: createTabContent };
})(typeof window !== 'undefined' ? window : globalThis);
