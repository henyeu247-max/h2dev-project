/* ============================================================
 * learn.js — H2DEV Lộ trình học (clone chuẩn h2dev.vn/learn)
 * Bản 2026-08-21 (16) — giao diện 1:1 theo bản gốc:
 *   - Danh mục: các module xếp dọc, collapsible, header "Số lượng/Thời lượng"
 *   - Mới cập nhật: nhóm theo tháng "Tháng MM/YYYY" + "Cập nhật: DD/MM/YYYY"
 *   - Yêu thích: nhóm theo module + empty state minh hoạ
 *   - Tìm kiếm: ô search có icon kính lúp + nút xoá + card compact + empty state
 * ============================================================ */
(function () {
  'use strict';
  var C = window.H2Core;

  var DATA_URL = '/data/modules.json';
  var state = { tab: 'danhmuc', q: '' };
  var COLLAPSE_KEY = 'h2dev-collapsed';

  var els = {
    progressText: document.getElementById('progressText'),
    progressRingWrap: document.getElementById('progressRingWrap'),
    resumeBanner: document.getElementById('resumeBanner'),
    tabbar: document.getElementById('tabbar'),
    panelRoot: document.getElementById('panelRoot')
  };

  /* ---------- utils ---------- */
  function loadJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }

  function loadCollapsed() {
    try { var a = JSON.parse(sessionStorage.getItem(COLLAPSE_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveCollapsed(a) { try { sessionStorage.setItem(COLLAPSE_KEY, JSON.stringify(a)); } catch (e) {} }

  /* ---------- data phụ ---------- */
  function allItems(data) {
    var out = [];
    data.modules.forEach(function (m) { m.items.forEach(function (v) { out.push(v); }); });
    return out;
  }
  function allItemsByModule(data) {
    var out = [];
    data.modules.forEach(function (m) { m.items.forEach(function (v) { out.push({ v: v, mod: m }); }); });
    return out;
  }

  function moduleSecs(m) {
    var s = 0; m.items.forEach(function (v) { s += C.durToSecs(v.duration); });
    return s;
  }

  function calcTotalProgress(data) {
    var w = C.loadWatched();
    var total = 0, done = 0;
    data.modules.forEach(function (m) { m.items.forEach(function (v) { total++; if (w[v.sku] && w[v.sku].watched) done++; }); });
    return { total: total, done: done, ratio: total ? done / total : 0 };
  }

  // bài tiếp theo trong LỘ TRÌNH (qua module kế nếu hết module — khớp next_video_url gốc)
  function findNextInRoute(data, sku) {
    var mods = data.modules;
    for (var mi = 0; mi < mods.length; mi++) {
      var idx = mods[mi].items.findIndex(function (x) { return x.sku === sku; });
      if (idx < 0) continue;
      if (idx + 1 < mods[mi].items.length) return { v: mods[mi].items[idx + 1], mod: mods[mi] };
      for (var nj = mi + 1; nj < mods.length; nj++) {
        if (mods[nj].items.length) return { v: mods[nj].items[0], mod: mods[nj] };
      }
      return null;
    }
    return null;
  }

  /* ---------- header: progress ring (số % tổng tiến độ) ---------- */
  function renderHeaderProgress(data) {
    var mods = (data && data.modules) || [];
    var titleEl = document.getElementById('learn-title');
    if (titleEl && mods.length) titleEl.textContent = 'Lộ trình ' + mods.length + ' module';
    var st = calcTotalProgress(data);
    var pct = Math.round(st.ratio * 100);
    els.progressText.innerHTML = '<span>' + pct + '%</span>' + st.done + '/' + st.total + ' bài · đã hoàn thành';
    var countEl = document.getElementById('learnCount');
    if (countEl) countEl.textContent = st.total + ' bài · không cần đăng nhập';
    var R = 15, CIR = 2 * Math.PI * R;
    els.progressRingWrap.innerHTML = '' +
      '<svg class="progress-ring" viewBox="0 0 36 36" aria-hidden="true">' +
        '<circle class="ring-bg" cx="18" cy="18" r="' + R + '" fill="none" stroke-width="3"></circle>' +
        '<circle class="ring-fg" cx="18" cy="18" r="' + R + '" fill="none" stroke-width="3" stroke-linecap="round" ' +
          'stroke-dasharray="' + CIR.toFixed(2) + '" stroke-dashoffset="' + (CIR * (1 - st.ratio)).toFixed(2) + '" ' +
          'transform="rotate(-90 18 18)"></circle>' +
      '</svg>';
  }

  /* ---------- banner "Tiếp tục học" (cơ chế recentWatched của gốc) ---------- */
  function renderResumeBanner(data) {
    var rec = C.loadRecent();
    if (!rec) { els.resumeBanner.classList.add('hidden'); return; }
    var flat = allItemsByModule(data);
    var found = null;
    for (var i = 0; i < flat.length; i++) if (flat[i].v.sku === rec.sku) { found = flat[i]; break; }
    if (!found) { els.resumeBanner.classList.add('hidden'); return; }
    var v = found.v, pr = C.videoProgress(v.sku);

    var target = v, label = 'Xem tiếp →', mod = found.mod;
    if (pr.done) {
      var nx = findNextInRoute(data, v.sku);
      if (!nx) { els.resumeBanner.classList.add('hidden'); return; }
      target = nx.v; mod = nx.mod; label = 'Xem bài tiếp theo →';
    }
    var seq = mod.items.findIndex(function (x) { return x.sku === target.sku; });
    var meta = mod.id + ' · Bài ' + C.pad2(seq + 1) + (target.duration ? ' · ' + target.duration : '');
    var status = pr.done
      ? '<span class="resume-done">✓ Đã hoàn thành</span>'
      : (pr.inProgress
          ? '<span class="resume-status">Đang xem ' + C.fmtTotalDur(pr.t) + '</span><span class="resume-pct">' + Math.round(pr.ratio * 100) + '%</span>'
          : '<span class="resume-status">Chưa xem</span>');

    els.resumeBanner.innerHTML = '' +
      '<div class="resume-inner">' +
        '<img class="resume-thumb" src="' + C.esc(target.image || '') + '" alt="' + C.esc(target.title || '') + '" loading="lazy">' +
        '<div class="resume-info">' +
          '<div class="resume-label">▶ ' + (pr.done ? 'Bài tiếp theo' : 'Tiếp tục học') + '</div>' +
          '<div class="resume-title">' + C.esc(target.title) + '</div>' +
          '<div class="resume-meta">' + C.esc(meta) + '</div>' +
        '</div>' +
        status +
        '<a class="resume-go" target="_top" href="/lotrinh/' + encodeURIComponent(target.sku) + '">' + label + '</a>' +
      '</div>';
    els.resumeBanner.classList.remove('hidden');
  }

  /* ============================================================
   * TAB 1 — DANH MỤC BÀI HỌC (chuẩn gốc: module xếp dọc, collapse)
   * ============================================================ */
  function renderDanhMuc(data) {
    var collapsed = loadCollapsed();
    var recent = C.loadRecent();
    var html = '<div class="sections-col">';
    data.modules.forEach(function (m) {
      var isCol = collapsed.indexOf(m.id) >= 0;
      var rows = m.items.map(function (v) {
        return C.renderLessonRow(v, { seq: v.seq, back: 'learn.html', active: recent && recent.sku === v.sku, showAction: true });
      }).join('');
      html += '' +
        '<section class="mod-sec' + (isCol ? ' collapsed' : '') + '" data-mod="' + C.esc(m.id) + '">' +
          C.renderSectionHead(m.title, m.items.length, moduleSecs(m)) +
          '<div class="sec-body"><div class="row-list">' + rows + '</div></div>' +
        '</section>';
    });
    html += '</div>';
    return html;
  }

  /* ============================================================
   * TAB 2 — MỚI CẬP NHẬT (chuẩn gốc: nhóm tháng + Cập nhật date)
   * Số lượng = tích lũy từ tháng mới nhất; Thời lượng = riêng tháng đó
   * ============================================================ */
  function renderMoi(data) {
    var items = allItems(data).slice().sort(function (a, b) { return (b.published_at || '').localeCompare(a.published_at || ''); });
    var groups = {};
    items.forEach(function (v) {
      var k = (v.published_at || '').slice(0, 7);
      if (!k) return;
      (groups[k] = groups[k] || []).push(v);
    });
    var keys = Object.keys(groups).sort().reverse();
    var recent = C.loadRecent();
    var html = '<div class="sections-col">';
    var cum = 0;
    keys.forEach(function (k) {
      var list = groups[k];
      cum += list.length;
      var secs = 0; list.forEach(function (v) { secs += C.durToSecs(v.duration); });
      var mm = k.slice(5, 7), yyyy = k.slice(0, 4);
      var rows = list.map(function (v, i) {
        return C.renderLessonRow(v, { seq: C.pad2(i + 1), updatedLine: true, back: 'learn.html', active: recent && recent.sku === v.sku, showAction: true });
      }).join('');
      html += '' +
        '<section class="mod-sec month-sec" data-month="' + C.esc(k) + '">' +
          C.renderSectionHead('Tháng ' + mm + '/' + yyyy, cum, secs) +
          '<div class="sec-body"><div class="row-list">' + rows + '</div></div>' +
        '</section>';
    });
    html += '</div>';
    return html;
  }

  /* ============================================================
   * TAB 3 — YÊU THÍCH (chuẩn gốc: nhóm theo module + empty state)
   * ============================================================ */
  function renderYeuThich(data) {
    var favs = C.loadFavs();
    if (!favs.length) return C.renderEmptyState('fav');
    var recent = C.loadRecent();
    var html = '<div class="sections-col">';
    var any = false;
    data.modules.forEach(function (m) {
      var list = m.items.filter(function (v) { return favs.indexOf(v.sku) >= 0; });
      if (!list.length) return;
      any = true;
      var secs = 0; list.forEach(function (v) { secs += C.durToSecs(v.duration); });
      var rows = list.map(function (v) {
        var seq = m.items.findIndex(function (x) { return x.sku === v.sku; });
        return C.renderLessonRow(v, { seq: C.pad2(seq + 1), back: 'learn.html', active: recent && recent.sku === v.sku, showAction: true });
      }).join('');
      html += '' +
        '<section class="mod-sec" data-mod="' + C.esc(m.id) + '">' +
          C.renderSectionHead(m.title, list.length, secs) +
          '<div class="sec-body"><div class="row-list">' + rows + '</div></div>' +
        '</section>';
    });
    html += '</div>';
    if (!any) return C.renderEmptyState('fav');
    return html;
  }

  /* ============================================================
   * TAB 4 — TÌM KIẾM BÀI HỌC (chuẩn gốc: search bar + card compact)
   * ============================================================ */
  function searchCard(v) {
    var href = '/lotrinh/' + encodeURIComponent(v.sku);
    return '' +
      '<a class="s-card" target="_top" href="' + href + '">' +
        '<img src="' + C.esc(v.image || '') + '" alt="' + C.esc(v.title || '') + '" loading="lazy">' +
        '<span class="s-card-body">' +
          '<span class="s-card-title">' + C.esc(v.title) + '</span>' +
          '<span class="s-card-tags">' +
            (v.free ? '<span class="ltag ltag-free">FREE</span>' : '<span class="ltag ltag-pro">PRO</span>') +
            (v.duration ? '<span class="s-card-dur">' + C.ICONS.clock + C.esc(v.duration) + '</span>' : '') +
          '</span>' +
        '</span>' +
      '</a>';
  }

  function renderTimKiem(data) {
    var q = state.q.trim();
    var html = '' +
      '<div class="search-bar">' +
        '<span class="search-ico">' + C.ICONS.search + '</span>' +
        '<input id="searchInput" type="text" placeholder="Tìm kiếm bài học" value="' + C.esc(q) + '" autocomplete="off">' +
        '<button class="search-clear' + (q ? '' : ' hidden') + '" id="searchClear" type="button" title="Xoá từ khoá">' + C.ICONS.close + '</button>' +
      '</div>' +
      '<div id="searchResults"></div>';
    return html;
  }

  function runSearch(data) {
    var box = document.getElementById('searchResults');
    if (!box) return;
    var q = state.q.trim();
    var nq = C.normalize(q);
    var list = allItems(data);
    var res;
    if (!nq) {
      res = list.slice();
    } else {
      res = list.filter(function (v) {
        if (C.normalize(v.title).indexOf(nq) >= 0) return true;
        if (C.normalize(v.sku).indexOf(nq) >= 0) return true;
        if ((v.channels || []).some(function (c) { return C.normalize(c).indexOf(nq) >= 0; })) return true;
        for (var mi = 0; mi < data.modules.length; mi++) {
          var m = data.modules[mi];
          if (m.items.some(function (x) { return x.sku === v.sku; }) && C.normalize(m.title).indexOf(nq) >= 0) return true;
        }
        return false;
      });
    }
    if (!res.length) { box.innerHTML = C.renderEmptyState('search'); return; }
    box.innerHTML = '<div class="s-grid">' + res.map(searchCard).join('') + '</div>';
  }

  /* ---------- render theo tab ---------- */
  function renderTab(data) {
    var html = '';
    if (state.tab === 'danhmuc') html = renderDanhMuc(data);
    else if (state.tab === 'moi') html = renderMoi(data);
    else if (state.tab === 'yeuthich') html = renderYeuThich(data);
    else html = renderTimKiem(data);
    els.panelRoot.innerHTML = html;
    if (state.tab === 'timkiem') runSearch(data);
  }

  function syncAll(data) {
    renderHeaderProgress(data);
    renderResumeBanner(data);
    renderTab(data);
    els.tabbar.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
      btn.setAttribute('aria-selected', btn.dataset.tab === state.tab ? 'true' : 'false');
    });
    if (state.tab === 'timkiem') bindSearchEvents(data);
  }

  /* ---------- events ---------- */
  function bindSearchEvents(data) {
    var input = document.getElementById('searchInput');
    var clearBtn = document.getElementById('searchClear');
    if (!input) return;
    var t = null;
    input.addEventListener('input', function () {
      clearTimeout(t);
      var caret = input.selectionStart;
      var v = input.value;
      t = setTimeout(function () {
        state.q = v;
        runSearch(data);
        var cb = document.getElementById('searchClear');
        if (cb) cb.classList.toggle('hidden', !v);
        // giữ focus + caret khi đang gõ
        var ni = document.getElementById('searchInput');
        if (ni && document.activeElement !== ni) {
          ni.focus();
          try { ni.setSelectionRange(Math.min(caret, ni.value.length), Math.min(caret, ni.value.length)); } catch (e) {}
        }
      }, 200);
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      state.q = '';
      runSearch(data);
      clearBtn.classList.add('hidden');
      var ni = document.getElementById('searchInput');
      if (ni) { ni.value = ''; ni.focus(); }
    });
  }

  function bindEvents(data) {
    els.tabbar.addEventListener('click', function (e) {
      var b = e.target.closest('.tab-btn');
      if (!b) return;
      state.tab = b.dataset.tab;
      syncAll(data);
      var u = new URL(location.href);
      u.searchParams.set('tab', state.tab);
      if (state.tab !== 'timkiem') { u.searchParams.delete('q'); state.q = ''; }
      history.replaceState(null, '', u);
    });

    // Điều hướng toàn bộ cửa sổ cha khi nhúng iframe (đảm bảo thanh URL browser đổi đúng /lotrinh/:sku)
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="/lotrinh/"]');
      if (a && window.self !== window.top) {
        e.preventDefault();
        try {
          window.top.location.href = a.href;
        } catch (err) {
          window.location.href = a.href;
        }
      }
    });

    els.panelRoot.addEventListener('click', function (e) {
      var fbtn = e.target.closest('[data-fav]');
      if (fbtn) {
        e.preventDefault(); e.stopPropagation();
        var sk = fbtn.dataset.fav;
        var r = C.toggleFav(sk);
        // cập nhật mọi nút tim của sku này (có thể xuất hiện nhiều nơi)
        document.querySelectorAll('[data-fav="' + CSS.escape(sk) + '"]').forEach(function (b) {
          b.classList.toggle('is-fav', r.fav);
          b.innerHTML = r.fav ? C.ICONS.heartSolid : C.ICONS.heartRegular;
          b.title = r.fav ? 'Bỏ yêu thích' : 'Thêm yêu thích';
        });
        if (state.tab === 'yeuthich') renderTab(data);
        return;
      }

      var head = e.target.closest('.sec-head');
      if (head) {
        var sec = head.closest('.mod-sec');
        if (!sec) return;
        var id = sec.dataset.mod || ('month:' + sec.dataset.month);
        var collapsed = loadCollapsed();
        var i = collapsed.indexOf(id);
        if (i >= 0) collapsed.splice(i, 1); else collapsed.push(id);
        saveCollapsed(collapsed);
        sec.classList.toggle('collapsed', i < 0);
        return;
      }
    });

    // deep-link ?tab= ?q= (mod param cũ → mở tab danh mục)
    var p = new URLSearchParams(location.search);
    var t = p.get('tab');
    if (t && ['danhmuc', 'moi', 'yeuthich', 'timkiem'].indexOf(t) >= 0) state.tab = t;
    var q = p.get('q');
    if (q) { state.tab = 'timkiem'; state.q = q; }
  }

  /* ---------- boot ---------- */
  loadJSON(DATA_URL).then(function (data) {
    var hydrate = C.hydrateAdmin ? C.hydrateAdmin() : Promise.resolve();
    return hydrate.then(function () {
      if (C.syncAdmin) C.syncAdmin();
      bindEvents(data);
      syncAll(data);
    if (state.tab === 'timkiem') {
      var inp = document.getElementById('searchInput');
      if (inp) { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {} }
    }

    // sync khi quay về từ player (pageshow/focus/visibilitychange)
    var resync = function () {
      renderHeaderProgress(data);
      renderResumeBanner(data);
      renderTab(data);
      if (state.tab === 'timkiem') bindSearchEvents(data);
    };
    window.addEventListener('pageshow', resync);
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) resync(); });
    });
  }).catch(function (err) {
    els.panelRoot.innerHTML = '<div class="load-err">⚠️ Không tải được data/modules.json — ' + C.esc(err.message) + '<br>File này được duy trì thủ công (script build-modules đã archive, KHÔNG chạy lại). Kiểm tra: <code>node scripts/validate-project.js</code></div>';
  });
})();
