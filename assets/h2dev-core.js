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
    play: '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
    // PHASE 3 (2026-09-23): da bo check:'✓' va eye:'👁' — dung ico('check')/ico('eye') thay the.
  };

  /* ---------- helpers ---------- */
  // CANONICAL esc — escape đủ & < > " ' cho HTML text/attr. KHÔNG dùng để nhét vào JS string.
  // index.html / player.html / music_player_modal.js phải khớp bản này (hoặc re-export H2Core.esc).
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function normalize(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }

  /* ---------- PHASE 3 (2026-09-23): HE ICON CHUAN (CSS mask) ----------
   * Sua: he icon duy nhat = assets/icons/*.svg + .h2-icon[data-h2i] trong h2dev-icons.css.
   * Cam dung emoji lam icon trong UI. Xem design-system/ICON-MAPPING.md.
   */
  /* ico('search') hoac ico('search', 20) -> the <span class="h2-icon ..."> */
  function ico(name, size) {
    return '<span class="h2-icon h2-icon--' + (size || 16) + '" data-h2i="' + String(name) + '" aria-hidden="true"></span>';
  }

  /* Bo emoji TRANG TRI (🌐 ✨ 📌 ⚠️ ...) nhung GIU QUOC KY (🇻🇳 🇯🇵 = nhan ngon ngu).
   * Dung khi data co emoji lan trong chuoi hien thi (vd "🌐 Ngoại", "📌 Takeaway").
   * KHONG dung cho chuoi lam KEY so sanh — key phai giu nguyen gia tri goc. */
  function stripDecorEmoji(s) {
    return String(s == null ? '' : s)
      .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{23F3}\u{23F1}\u{2B50}\u{2B1B}\u{2B1C}]+/gu, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s/·-]+|[\s/·-]+$/g, '')
      .trim();
  }

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

  /**
   * fmtBytes — dinh dang dung luong file (input: BYTES).
   * N11 FIX (2026-09-23): day la BAN CHUAN DUY NHAT cua toan du he.
   *
   * GHI CHU QUAN TRONG (do luong 2026-09-23):
   * - Truoc day co 3 ban sao KHONG khop nhau:
   *     h2dev-core.js : chia 1024^3 / 1024^2 (binary)  -> "170 MB"
   *     ui-core.js    : chia 1e9 / 1e6      (decimal)  -> "178 MB"
   *     player-main.js: chia 1e9 / 1e6      (decimal)  -> "178 MB"
   *   -> Cung 1 file 178441037 bytes hien 2 con so KHAC nhau (170 vs 178 MB).
   * - Kiem dinh: H2Core.fmtBytes KHONG co consumer nao; con ui-core.fmtBytes
   *   dang hien tren 140 the video (content.js:612). Vi vay CHON BAN DECIMAL
   *   lam chuan de KHONG doi so lieu dang hien thi cho nguoi dung.
   * - Muon doi sang binary phai la mot thay doi CO CHU DICH + thong bao.
   */
  function fmtBytes(b) {
    if (!b) return '';
    if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
    if (b >= 1e6) return (b / 1e6).toFixed(0) + ' MB';
    return (b / 1e3).toFixed(0) + ' KB';
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
  /* Sync state len server.
   *
   * LUU Y (18/09/2026): `server.js:181` CHU DONG chan ghi `PUT /api/admin-state`
   * (tra 405 "Admin state writes are disabled" vi ly do an toan mang LAN).
   * Truoc day ham nay van gui PUT moi lan luu => console day loi 405 (nhieu vo ich)
   * va ton bang thong. Nay:
   *   - Lan dau thu gui -> neu 405/501 thi TU TAT (khong thu lai) va ghi nho co.
   *   - Neu sau nay server bat ghi (200) thi tu BAT LAI binh thuong.
   * Du lieu nguoi dung VAN duoc luu day du o localStorage (local-first).
   */
  var _adminWriteDisabled = null;   // null=chua biet | true=server chan ghi | false=ghi duoc
  function syncAdmin() {
    try {
      var state = { role: 'admin', version: 1, updatedAt: Date.now(), watched: loadWatched(), favorites: loadFavs(), recent: JSON.parse(localStorage.getItem(RKEY) || 'null') };
      localStorage.setItem('h2dev-admin', JSON.stringify(state));
      if (_adminWriteDisabled !== false) return;   // chua biet / biet la chan -> khong gui (tranh 405)
      fetch('/api/admin-state', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(state), keepalive: true })
        .catch(function () { /* loi mang: lan sau thu lai */ });
    } catch (e) {}
  }
  function hydrateAdmin() {
    return fetch('/api/admin-state', {cache:'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return null;
      // Server CONG BO kha nang ghi -> biet truoc, khoi thu PUT (tranh 405)
      _adminWriteDisabled = (s.writable === false);
      var curW = loadWatched();
      var remoteW = (s.watched && typeof s.watched === 'object') ? s.watched : {};
      var mergedW = Object.assign({}, remoteW);
      for (var k in curW) {
        if (!mergedW[k]) {
          mergedW[k] = curW[k];
        } else {
          mergedW[k] = {
            watched: !!(curW[k].watched || mergedW[k].watched),
            t: Math.max(curW[k].t || 0, mergedW[k].t || 0),
            d: Math.max(curW[k].d || 0, mergedW[k].d || 0),
            note: curW[k].note || mergedW[k].note || ''
          };
        }
      }
      localStorage.setItem(WKEY, JSON.stringify(mergedW));

      var curF = loadFavs();
      var remoteF = Array.isArray(s.favorites) ? s.favorites : [];
      var favSet = {};
      remoteF.concat(curF).forEach(function(k) { if (k) favSet[k] = true; });
      localStorage.setItem(FKEY, JSON.stringify(Object.keys(favSet)));

      if (s.recent && !localStorage.getItem(RKEY)) {
        localStorage.setItem(RKEY, JSON.stringify(s.recent));
      }
      localStorage.setItem('h2dev-admin', JSON.stringify(Object.assign({}, s, { watched: mergedW, favorites: Object.keys(favSet) })));
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
  /* ⚠️ CẢNH BÁO CSS (kiểm chứng 2026-09-23) — ĐỌC TRƯỚC KHI GỌI Ở TRANG MỚI:
   * Các class .lesson-row .row-thumb .row-body .row-title .row-tags .row-seq
   * .row-time .row-updated .row-watchbar .watched-badge CHỈ ĐƯỢC ĐỊNH NGHĨA
   * TRONG assets/learn.css (không nằm trong h2dev-tokens/primitives/shell).
   *
   * => Trang nào gọi renderLessonRow() / renderSectionHead() / renderEmptyState()
   *    BẮT BUỘC phải nạp learn.css, nếu không hàng bài học sẽ VỠ LAYOUT
   *    (thumb/tiêu đề/nhãn đè lên nhau) dù KHÔNG có lỗi JS nào.
   *
   * Trạng thái hiện tại (đã đo runtime): cả 3 hàm này CHỈ được gọi từ
   * assets/learn.js -> chỉ chạy trên learn.html -> AN TOÀN.
   * index.html / player.html KHÔNG gọi (đo được 0 phần tử .lesson-row trên cả 2).
   *
   * Cổng scripts/check-ui-classes.js vẫn báo row-* thiếu ở index/player: đây là
   * báo ĐÚNG về mặt kỹ thuật (class có trong JS nạp nhưng không có CSS nạp) —
   * KHÔNG ỉm đi, giữ để nhắc bẫy này. Muốn hết báo: tách .row-* sang CSS dùng
   * chung (h2dev-primitives.css) HOẶC nạp learn.css ở trang gọi.
   */
  function renderLessonRow(v, opts) {
    opts = opts || {};
    var sku = v.sku;
    var href = '/lotrinh/' + encodeURIComponent(sku);
    var favs = loadFavs();
    var isFav = favs.indexOf(sku) >= 0;
    var pr = videoProgress(sku);

    var thumbOverlays = '';
    if (opts.seq != null) thumbOverlays += '<span class="row-seq">' + esc(opts.seq) + '</span>';
    thumbOverlays += '<button class="row-fav' + (isFav ? ' is-fav' : '') + '" data-fav="' + esc(sku) + '" title="' + (isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích') + '">' + (isFav ? ICONS.heartSolid : ICONS.heartRegular) + '</button>';
    // Watched badge on thumbnail (progress bar already rendered by row-watchbar below)
    if (pr.done) {
      thumbOverlays += '<div class="watched-badge" title="Đã xem xong"></div>';
    }
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
    // PHASE 3 (2026-09-23): emoji -> .h2-icon (he icon CSS mask duy nhat).
    if (pr.done) tags += '<span class="ltag ltag-done">' + ico('check', 14) + ' Đã xem</span>';
    else if (pr.inProgress) tags += '<span class="ltag ltag-progress">' + ico('hourglass', 14) + ' ' + Math.round(pr.ratio * 100) + '%</span>';
    var action = opts.showAction ? '<a class="lesson-watch" target="_top" href="' + href + '" aria-label="Xem video: ' + esc(v.title) + '">Xem video</a>' : '';

    return '' +
      '<div class="lesson-row' + (opts.active ? ' is-active' : '') + (pr.done ? ' is-watched' : '') + '" data-sku="' + esc(sku) + '">' +
        '<a class="row-thumb" target="_top" href="' + href + '" title="Xem: ' + esc(v.title) + '">' +
          '<img src="' + esc(v.image || '') + '" alt="' + esc(v.title || '') + '" loading="lazy">' +
          thumbOverlays +
        '</a>' +
        '<div class="row-body">' +
          (opts.updatedLine ? '<div class="row-updated">Cập nhật: ' + dateVN(v.published_at) + '</div>' : '') +
          '<a class="row-title" target="_top" href="' + href + '">' + esc(v.title) + '</a>' +
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
    ico: ico, stripDecorEmoji: stripDecorEmoji,
    durToSecs: durToSecs, fmtTotalDur: fmtTotalDur, dateVN: dateVN, fmtBytes: fmtBytes,
    loadWatched: loadWatched, saveWatchedAll: saveWatchedAll, syncAdmin: syncAdmin, hydrateAdmin: hydrateAdmin,
    loadFavs: loadFavs, saveFavs: saveFavs, toggleFav: toggleFav, loadRecent: loadRecent,
    videoProgress: videoProgress,
    renderLessonRow: renderLessonRow, renderSectionHead: renderSectionHead, renderEmptyState: renderEmptyState,
    trapFocus: function (container, e) {
      if (e.key !== 'Tab' || !container) return;
      if (!container.contains(document.activeElement)) {
        e.preventDefault();
        try { container.focus(); } catch (err) {}
        var f0 = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (f0) try { f0.focus(); } catch (err) {}
        return;
      }
      var focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },
    focusModal: function (modal) {
      if (!modal) return;
      try { modal.focus(); } catch (e) {}
      var f = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (f) try { f.focus(); } catch (e) {}
    }
  };
})(window);
