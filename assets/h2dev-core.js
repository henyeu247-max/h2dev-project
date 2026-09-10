/* ============================================================
 * H2DEV Core — dùng chung cho learn.html + player.html
 * Bản 2026-08-21 (16) — replicate 1:1 cơ chế site gốc h2dev.vn
 * - Storage: h2dev-watched / h2dev-fav / h2dev-recent (localStorage)
 * - lessonRow: item bài học chuẩn gốc (thumb + seq + time + progress bar + heart + badge)
 * ============================================================ */
(function (global) {
  'use strict';

  var WKEY = 'h2dev-watched';
  var FKEY = 'h2dev-fav';
  var RKEY = 'h2dev-recent';

  /* ---------- SVG icons (chuẩn icon gốc: heart-regular/solid, clock, search...) ---------- */
  var ICONS = {
    heartRegular: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    heartSolid: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    tagImportant: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6z"/></svg>',
    tagFeatured: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    check: '✓',
    eye: '👁'
  };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function normalize(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }

  // duration "mm:ss" hoặc "hh:mm:ss" → giây
  function durToSecs(d) {
    var p = String(d || '').split(':').map(Number);
    if (p.some(isNaN)) return 0;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
  }

  // giây → "hh:mm:ss" (giống site gốc: 01:30:25 / 29:48)
  function fmtTotalDur(secs) {
    secs = Math.max(0, Math.round(secs || 0));
    var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return (h > 0 ? pad2(h) + ':' : '') + pad2(m) + ':' + pad2(s);
  }

  // "2026-08-14" → "14/08/2026" (chuẩn hiển thị gốc "Cập nhật: DD/MM/YYYY")
  function dateVN(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (m[3] + '/' + m[2] + '/' + m[1]) : (iso || '');
  }

  function fmtBytes(b) {
    if (!b) return '';
    if (b >= 1024 * 1024 * 1024) return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(0) + ' MB';
    return Math.round(b / 1024) + ' KB';
  }

  /* ---------- localStorage ---------- */
  function loadWatched() { try { return JSON.parse(localStorage.getItem(WKEY)) || {}; } catch (e) { return {}; } }
  function saveWatchedAll(map) { try { localStorage.setItem(WKEY, JSON.stringify(map)); syncAdmin(); } catch (e) {} }
  function loadFavs() { try { var a = JSON.parse(localStorage.getItem(FKEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveFavs(a) { try { localStorage.setItem(FKEY, JSON.stringify(a)); syncAdmin(); } catch (e) {} }
  function loadRecent() {
    try {
      var r = JSON.parse(localStorage.getItem(RKEY));
      if (r && r.sku) return r;
      var legacy = JSON.parse(localStorage.getItem('recentWatched'));
      return legacy && legacy.item_id ? { sku: legacy.item_id, ts: Date.now(), nextSku: null } : null;
    } catch (e) { return null; }
  }
  function syncAdmin() {
    try {
      var state = { role: 'admin', version: 1, updatedAt: Date.now(), watched: loadWatched(), favorites: loadFavs(), recent: JSON.parse(localStorage.getItem(RKEY) || 'null') };
      localStorage.setItem('h2dev-admin', JSON.stringify(state));
      fetch('/api/admin-state', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(state), keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function hydrateAdmin() {
    return fetch('/api/admin-state', {cache:'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return null;
      localStorage.setItem(WKEY, JSON.stringify(s.watched || {}));
      localStorage.setItem(FKEY, JSON.stringify(Array.isArray(s.favorites) ? s.favorites : []));
      if (s.recent) localStorage.setItem(RKEY, JSON.stringify(s.recent));
      localStorage.setItem('h2dev-admin', JSON.stringify(s));
      return s;
    }).catch(function () { return null; });
  }

  // toggle yêu thích; trả về {fav: bool, favs: array}
  function toggleFav(sku) {
    var favs = loadFavs();
    var i = favs.indexOf(sku);
    if (i >= 0) favs.splice(i, 1); else favs.push(sku);
    saveFavs(favs);
    return { fav: i < 0, favs: favs };
  }

  // tiến độ 1 video: {t, d, ratio, done, inProgress}
  function videoProgress(sku) {
    var w = loadWatched()[sku];
    if (!w) return { t: 0, d: 0, ratio: 0, done: false, inProgress: false };
    var d = +w.d || 0, t = Math.min(+w.t || 0, d);
    var ratio = d > 0 ? t / d : 0;
    if (w.watched) ratio = Math.max(ratio, 1);
    return { t: t, d: d, ratio: ratio, done: !!w.watched || ratio >= 0.95, inProgress: !w.watched && ratio > 0.02 };
  }

  /* ---------- lesson row (item bài học chuẩn site gốc) ----------
   * Layout gốc: [thumb 16:9: seq góc phải-trên, heart góc trái-trên,
   *   progress bar đáy thumb, time chip phải-dưới] + [title + badges]
   * opts: {seq, updatedLine (bool), back, active (bool)} */
  function renderLessonRow(v, opts) {
    opts = opts || {};
    var sku = v.sku;
    var href = 'player.html?sku=' + encodeURIComponent(sku) + (opts.back ? '&back=' + encodeURIComponent(opts.back) : '');
    var favs = loadFavs();
    var isFav = favs.indexOf(sku) >= 0;
    var pr = videoProgress(sku);

    var thumbOverlays = '';
    if (opts.seq != null) thumbOverlays += '<span class="row-seq">' + esc(opts.seq) + '</span>';
    thumbOverlays += '<button class="row-fav' + (isFav ? ' is-fav' : '') + '" data-fav="' + esc(sku) + '" title="' + (isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích') + '">' + (isFav ? ICONS.heartSolid : ICONS.heartRegular) + '</button>';
    thumbOverlays += '<div class="row-watchbar"><i style="width:' + Math.round(pr.ratio * 100) + '%"></i></div>';
    if (v.duration) thumbOverlays += '<span class="row-time">' + ICONS.clock + esc(v.duration) + '</span>';

    var tags = '';
    if (v.badge) {
      var bc = v.badge === 'QUAN TRỌNG' ? 'badge-important' : 'badge-featured';
      tags += '<span class="ltag ' + bc + '">' + (v.badge === 'QUAN TRỌNG' ? ICONS.tagImportant : ICONS.tagFeatured) + esc(v.badge) + '</span>';
    }
    tags += v.free
      ? '<span class="ltag ltag-free">FREE</span>'
      : '<span class="ltag ltag-pro">PRO</span>';
    if (pr.done) tags += '<span class="ltag ltag-done">✓ Đã xem</span>';
    else if (pr.inProgress) tags += '<span class="ltag ltag-progress">⏳ ' + Math.round(pr.ratio * 100) + '%</span>';
    var action = opts.showAction ? '<a class="lesson-watch" href="' + href + '" aria-label="Xem video: ' + esc(v.title) + '">Xem video</a>' : '';

    return '' +
      '<div class="lesson-row' + (opts.active ? ' is-active' : '') + '" data-sku="' + esc(sku) + '">' +
        '<a class="row-thumb" href="' + href + '" title="Xem: ' + esc(v.title) + '">' +
          '<img src="' + esc(v.image || '') + '" alt="' + esc(v.title || '') + '" loading="lazy">' +
          thumbOverlays +
        '</a>' +
        '<div class="row-body">' +
          (opts.updatedLine ? '<div class="row-updated">Cập nhật: ' + dateVN(v.published_at) + '</div>' : '') +
          '<a class="row-title" href="' + href + '">' + esc(v.title) + '</a>' +
          '<div class="row-tags">' + tags + '</div>' +
        '</div>' +
        action +
      '</div>';
  }

  /* ---------- module head (chuẩn gốc: title + Số lượng + Thời lượng + toggle) ---------- */
  function renderSectionHead(title, count, durSecs, extra) {
    return '' +
      '<div class="sec-head">' +
        '<p class="sec-title">' + esc(title) + '</p>' +
        '<div class="sec-stats">' +
          '<span class="sec-stat">Số lượng: <b>' + count + '</b> video</span>' +
          '<span class="sec-stat">Thời lượng: <b>' + fmtTotalDur(durSecs) + '</b></span>' +
          (extra || '') +
        '</div>' +
        '<button class="sec-toggle" type="button" aria-label="Thu gọn / mở rộng"></button>' +
      '</div>';
  }

  /* ---------- empty states (chuẩn gốc: hình minh hoạ + chữ) ---------- */
  var EMPTY_IMG = '' +
    '<svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">' +
      '<ellipse cx="100" cy="122" rx="78" ry="10" fill="#1c2536"/>' +
      '<rect x="52" y="38" width="96" height="70" rx="8" fill="#141c2b" stroke="#2b3550" stroke-width="2"/>' +
      '<rect x="52" y="38" width="96" height="18" rx="8" fill="#1b2740"/>' +
      '<circle cx="63" cy="47" r="3" fill="#ce1211"/>' +
      '<circle cx="73" cy="47" r="3" fill="#f59e0b"/>' +
      '<circle cx="83" cy="47" r="3" fill="#22c55e"/>' +
      '<rect x="62" y="64" width="52" height="5" rx="2.5" fill="#22304a"/>' +
      '<rect x="62" y="76" width="72" height="5" rx="2.5" fill="#22304a"/>' +
      '<rect x="62" y="88" width="40" height="5" rx="2.5" fill="#22304a"/>' +
      '<circle cx="148" cy="86" r="20" fill="#0b1020" stroke="#3b4a6b" stroke-width="4"/>' +
      '<line x1="162" y1="100" x2="176" y2="114" stroke="#3b4a6b" stroke-width="6" stroke-linecap="round"/>' +
      '<text x="148" y="92" text-anchor="middle" font-size="16" fill="#3b4a6b">?</text>' +
    '</svg>';

  function renderEmptyState(kind) {
    if (kind === 'fav') {
      return '<div class="empty-state">' + EMPTY_IMG + '<p>Chưa có bài học nào được yêu thích</p><span class="empty-hint">Bấm nút ❤ trên bài học để lưu vào danh sách yêu thích</span></div>';
    }
    return '<div class="empty-state">' + EMPTY_IMG + '<p>Không tìm thấy bài học nào</p><span class="empty-hint">Thử từ khoá khác (tên bài, SKU, module, kênh…)</span></div>';
  }

  /* ---------- export ---------- */
  global.H2Core = {
    WKEY: WKEY, FKEY: FKEY, RKEY: RKEY,
    ICONS: ICONS,
    esc: esc, pad2: pad2, normalize: normalize,
    durToSecs: durToSecs, fmtTotalDur: fmtTotalDur, dateVN: dateVN, fmtBytes: fmtBytes,
    loadWatched: loadWatched, saveWatchedAll: saveWatchedAll, syncAdmin: syncAdmin, hydrateAdmin: hydrateAdmin,
    loadFavs: loadFavs, saveFavs: saveFavs, toggleFav: toggleFav, loadRecent: loadRecent,
    videoProgress: videoProgress,
    renderLessonRow: renderLessonRow, renderSectionHead: renderSectionHead, renderEmptyState: renderEmptyState
  };
})(window);
