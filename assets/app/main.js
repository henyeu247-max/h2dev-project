/* H2Main - G6 extract main app script from index.html */

    const state = { tab: 'tatca', q: '', nicheFilter: '', skuFilter: '', marketFilter: '', sortBy: '', freeOnly: false, watchFilter: '', kindFilter: '', promptQ: '', promptNiche: '', reupQ: '', reupType: '', reupNiche: '', kenhQ: '', kenhNiche: '', nxTier: '', nxMarket: '', nxQ: '', rawQ: '', rawNiche: '', rawGroup: '', rawGroupOpen: '', rawNicheExpanded: false, promptNicheExpanded: false, rawStatus: '', rawVitality: '', rawFaceless: '', rawPage: 1 };
    // G3: taxonomy tach ra assets/app/taxonomy.js (window.H2Taxonomy)
    // G3: helpers tach ra assets/app/ui-core.js (window.H2UICore)
    const {
      safeArray,
      nicheKeyFor,
      xanhBadge,
      esc,
      trapFocus,
      focusModal,
      fmtBytes,
      fmtMb,
      loadChecks,
      saveCheck,
      loadWatched,
      watchedBadge,
      watchedProgress,
      watchedResumeLabel,
      highlightQuery,
      statCard,
      pageBanner
    } = window.H2UICore;
    // G3: tab nav tach ra assets/app/tabs/nav.js (init sau khi c? TABS)
    let _tabNav = null;
    function ensureTabNav() {
      if (_tabNav) return _tabNav;
      _tabNav = window.H2TabsNav.createTabNav({
        state: state,
        TABS: TABS,
        BOTTOM_TABS: BOTTOM_TABS,
        openTab: openTab,
        render: render
      });
      return _tabNav;
    }
    function tabMarkup(t, extraId) { return ensureTabNav().tabMarkup(t, extraId); }
    function bindTabButton(b) { return ensureTabNav().bindTabButton(b); }
    function renderTabs() { return ensureTabNav().renderTabs(); }
    function toggleMoreMenu(overflowTabs) { return ensureTabNav().toggleMoreMenu(overflowTabs); }


    const { RAW_NICHE_GROUPS, RAW_NICHE_TO_GROUP, rawNicheGroup } = window.H2Taxonomy;



    const CAT = {};

    /* ---------- PHASE 3 (2026-09-23): HE ICON CHUAN (CSS mask) ----------
     * Mot he icon duy nhat: assets/icons/*.svg + .h2-icon[data-h2i] (h2dev-icons.css).
     * Cam emoji lam icon UI. Xem design-system/ICON-MAPPING.md.
     * G3.2: dinh nghia o assets/app/icons.js (window.H2Icons) de nav.js/search.js
     * (nap TRUOC main.js) cung doc duoc 1 nguon duy nhat — khong con ICONS.<key> = svg inline. */
    const _h2i = (window.H2Icons) || {};
    const ico = _h2i.ico;
    const icoColored = _h2i.icoColored;
    /* Ten icon chuan cho TABS[] / pageBanner / statCard (khai bao o assets/app/icons.js).
     * LUU Y: gia tri la TEN icon, phai render qua ico(ICONS.x) — KHONG noi chuoi truc tiep. */
    const ICONS = _h2i.NAMES || {};

    /* Bo emoji TRANG TRI nhung GIU QUOC KY (🇻🇳 🇯🇵 = nhan ngon ngu).
     * Chi dung cho CHUOI HIEN THI. Tuyet doi KHONG dung cho chuoi lam KEY so sanh
     * (vd state.marketFilter phai giu nguyen "🌐 Ngoại" de so khop data). */
    const stripDecorEmoji = (s) => String(s == null ? '' : s)
      .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{23F3}\u{23F1}\u{2B50}\u{2B1B}\u{2B1C}]+/gu, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s/·-]+|[\s/·-]+$/g, '')
      .trim();

    /* PHASE 1: TABS slug khop URL chuan (design-system/URL-ROUTING-SPEC.md)
       - tatca     -> /tatca      (tab thu 10, hub & spoke)
       - tai-lieu  -> /tai-lieu   (truoc la kichban)
       - kenh-mau  -> /kenh-mau   (truoc la kenh)
       - nhac      -> /nhac       (mo modal Tram Nhac Nen) */
    const TABS = [
      { id: 'tatca', icon: ICONS.home, name: 'Tất cả', short: 'Tất cả' },
      { id: 'video', icon: ICONS.video, name: 'Video', short: 'Video' },
      { id: 'ngachxanh', icon: ICONS.niche, name: 'Ngách xanh', short: 'Ngách' },
      { id: 'tai-lieu', icon: ICONS.doc, name: 'Tài liệu', short: 'Tài liệu' },
      { id: 'nhac', icon: ICONS.music, name: 'Nhạc nền', short: 'Nhạc' },
      { id: 'nguonreup', icon: ICONS.link, name: 'Nguồn reup', short: 'Nguồn' },
      { id: 'kenh-mau', icon: ICONS.channel, name: 'Kênh mẫu', short: 'Kênh mẫu' },
      { id: 'rawkenh', icon: ICONS.image, name: 'Raw kênh', short: 'Raw kênh' },
      { id: 'chienluoc', icon: ICONS.strategy, name: 'Chiến lược', short: 'Chiến lược' },
      { id: 'lotrinh', icon: ICONS.doc, name: 'Lộ trình', short: 'Lộ trình' }
    ];
    /* PHASE 3: TABS[].icon gio la TEN icon => render 1 lan qua ico() de nav.js
     * (tabMarkup / more-menu) khong phai biet gi ve he icon. */
    TABS.forEach(t => { t.icon = ico(t.icon, 16); });

    const APP_BUILD_VER = '20260922-g2-esc-onclick-a11y-v1';
    // G-std: fallback chain like FckSignups useTools (primary -> no-ver -> fail soft)
    const _loadErrors = [];
    function noteLoadError(path, msg) {
      _loadErrors.push({ path: path, msg: msg });
      try {
        const el = document.getElementById('a11y-status');
        if (el) el.textContent = 'Lỗi tải dữ liệu: ' + path;
      } catch (e) {}
    }
    async function loadJSON(p) {
      if (CAT[p]) return CAT[p];
      const sep = p.includes('?') ? '&' : '?';
      const urls = [p + sep + 'v=' + APP_BUILD_VER, p];
      for (let i = 0; i < urls.length; i++) {
        try {
          const r = await fetch(urls[i], { cache: i === 0 ? 'no-store' : 'default' });
          if (!r.ok) throw new Error(r.status + ' ' + urls[i]);
          CAT[p] = await r.json();
          return CAT[p];
        } catch (e) {
          if (i === urls.length - 1) {
            noteLoadError(p, String(e && e.message || e));
            throw new Error(`Không tải được ${p}`);
          }
        }
      }
    }
    function renderLoadErrorBanner() {
      if (!_loadErrors.length) return '';
      return '<div class="card p-4 mb-4 border-red-800" role="alert"><strong class="text-white">Không tải được một số dữ liệu</strong><ul class="text-xs text-gray-400 mt-2" style="margin:0;padding-left:1rem;list-style:disc">' +
        _loadErrors.map(x => '<li>' + esc(x.path) + ' — ' + esc(x.msg) + '</li>').join('') +
        '</ul></div>';
    }

    // Đếm nhạc động từ music_catalog — cấm hardcode số track
    const musicStats = { total: 0, safe: 0, review: 0, copyrighted: 0, niches: 0, ready: false };
    async function loadMusicStats() {
      if (musicStats.ready) return musicStats;
      try {
        const cat = await loadJSON('data/music_catalog.json');
        const tracks = safeArray(cat.tracks);
        musicStats.total = cat.totalTracks || tracks.length;
        musicStats.safe = tracks.filter(t => t.copyrightRisk === 'SAFE').length;
        musicStats.review = tracks.filter(t => t.copyrightRisk === 'REVIEW').length;
        musicStats.copyrighted = tracks.filter(t => t.copyrightRisk === 'COPYRIGHTED').length;
        musicStats.niches = new Set(tracks.map(t => t.categoryNiche || 'Khác')).size;
        musicStats.ready = true;
        const btn = document.getElementById('btn-music-studio');
        if (btn) btn.title = `Mở trạm phát nhạc nền ${musicStats.total} tracks · ${musicStats.safe} SAFE YPP`;
      } catch (e) { /* offline / chưa có catalog — giữ 0, không bịa số */ }
      return musicStats;
    }

    // G3: NICHE_MAP tach ra assets/app/taxonomy.js
    const NICHE_MAP = window.H2Taxonomy.NICHE_MAP;

    function resetScrollToTop() {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
      const pr = document.getElementById('panel-root');
      if (pr) pr.scrollTop = 0;
      const cnt = document.getElementById('content');
      if (cnt) cnt.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function openTab(id, extra, pushHistory = true) {
      state.tab = id || 'tatca';
      resetScrollToTop();
      // Nếu mở tab Video mà không kèm danh sách SKU cụ thể, xóa sạch mọi bộ lọc ẩn
      // còn sót từ tab trước (ví dụ skuFilter từ Ngách xanh) để không rơi vào trạng thái 0/tổng.
      if (state.tab === 'video' && !(extra && extra.skuFilter)) {
        state.skuFilter = '';
        state.nicheFilter = '';
        state.marketFilter = '';
        state.q = '';
        state.freeOnly = false;
        state.watchFilter = '';
      }
      if (extra) Object.assign(state, extra);
      if (pushHistory) {
        try {
          /* PHASE 1: /tatca la canonical (tatca = trang mac dinh, khong con /tongquan) */
          const cleanPath = (state.tab === 'tatca') ? '/tatca' : ('/' + state.tab);
          const url = new URL(cleanPath, location.origin);
          /* PHASE 1: build URL du 9 tham so + bo tham so o gia tri mac dinh */
          if (state.marketFilter) url.searchParams.set('market', state.marketFilter);
          if (state.nicheFilter) url.searchParams.set('niche', state.nicheFilter);
          if (state.rawPage && state.rawPage > 1) url.searchParams.set('page', String(state.rawPage));
          if (state.rawNiche) url.searchParams.set('rn', state.rawNiche);
          if (state.rawGroup) url.searchParams.set('rg', state.rawGroup);
          if (state.rawQ) url.searchParams.set('rq', state.rawQ);
          if (state.watchFilter) url.searchParams.set('watch', state.watchFilter);
          if (state.freeOnly) url.searchParams.set('free', '1');
          if (state.tab === 'chienluoc' && state.clSubTab && state.clSubTab !== 'principles') url.searchParams.set('sub', state.clSubTab);
          history.pushState({ tab: state.tab, market: state.marketFilter, niche: state.nicheFilter }, '', url.pathname + url.search);
        } catch (e) {}
      }
      renderTabs();
      render();
    }
    function openNicheVideos(key, skus) {
      openTab('video', { nicheFilter: key || '', skuFilter: skus || '', q: '', marketFilter: '', freeOnly: false });
    }
    function expandNicheMore(btn) {
      const wrap = btn.closest('[data-niche-list]');
      if (!wrap) return;
      wrap.querySelectorAll('[data-more]').forEach(el => el.classList.remove('hidden'));
      btn.remove();
    }
    function quickAccessBar(options) {
      const items = (options && Array.isArray(options.items)) ? options.items.filter(Boolean) : [];
      if (!items.length) return '';
      const isTablist = options.mode === 'tab';
      return `<nav id="${esc(options.id || 'quick-access')}" class="quick-access ${esc(options.className || '')}" aria-label="${esc(options.label || 'Đi nhanh')}">
        <span class="quick-access__label">${esc(options.label || 'Đi nhanh')}</span>
        <div class="quick-access__list"${isTablist ? ' role="tablist"' : ''}>
          ${items.map(item => {
            const active = Boolean(item.active);
            const action = item.action || {};
            const mode = action.type || 'state';
            const patch = action.patch ? esc(JSON.stringify(action.patch)) : '';
            const role = isTablist ? ' role="tab"' : '';
            const selected = isTablist ? ` aria-selected="${active ? 'true' : 'false'}"` : ` aria-pressed="${active ? 'true' : 'false'}"`;
            return `<button type="button" class="quick-access__button${active ? ' active' : ''}"${role}${selected} data-quick-action="${esc(mode)}" data-quick-patch="${patch}" data-quick-target="${esc(action.target || '')}" data-quick-section="${esc(action.section || '')}" aria-label="${esc(item.label)}" title="${esc(item.label)}"><span class="quick-access__long">${esc(item.label)}</span><span class="quick-access__short">${esc(item.shortLabel || item.label)}</span></button>`;
          }).join('')}
        </div>
      </nav>`;
    }
    function quickScrollTo(sectionId, expectedTab) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (expectedTab && state.tab !== expectedTab) return;
        const target = document.getElementById(sectionId);
        if (!target) return;
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }));
    }
    function parseQuickPatch(raw) {
      if (!raw) return {};
      try { const patch = JSON.parse(raw); return patch && typeof patch === 'object' ? patch : {}; } catch (e) { return {}; }
    }
    function bindNicheActions() {
      document.querySelectorAll('[data-kpi-card]').forEach(card => {
        card.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        };
      });
      document.querySelectorAll('[data-open-niche]').forEach(btn => {
        btn.addEventListener('click', e => {
          if (btn.hasAttribute('data-open-tab')) return;
          e.preventDefault();
          openNicheVideos(btn.getAttribute('data-open-niche'), btn.getAttribute('data-skus') || '');
        });
      });
      document.querySelectorAll('[data-expand-niche]').forEach(btn => {
        btn.addEventListener('click', e => { e.preventDefault(); expandNicheMore(btn); });
      });
      document.querySelectorAll('[data-open-tab]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const tab = btn.getAttribute('data-open-tab');
          const extra = {};
          if (tab === 'tai-lieu') { extra.kindFilter = btn.getAttribute('data-kind') || ''; extra.promptNiche = btn.getAttribute('data-prompt-niche') || ''; extra.promptQ = ''; }
          if (tab === 'video') { extra.nicheFilter = btn.getAttribute('data-open-niche') || ''; extra.skuFilter = btn.getAttribute('data-skus') || ''; extra.marketFilter = btn.getAttribute('data-market-filter') || ''; extra.q = ''; extra.freeOnly = btn.getAttribute('data-free-only') === 'true'; extra.watchFilter = btn.getAttribute('data-watch-filter') || ''; }
          if (tab === 'kenh-mau') { extra.kenhNiche = btn.getAttribute('data-kenh-niche') || ''; extra.kenhQ = ''; }
          openTab(tab, extra);
        });
      });
      document.querySelectorAll('[data-cl-tab]').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          state.clSubTab = btn.getAttribute('data-cl-tab') || 'principles';
          render();
          resetScrollToTop();
        };
      });
    }
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick-action]');
      if (!btn) return;
      e.preventDefault();
      const type = btn.getAttribute('data-quick-action');
      const patch = parseQuickPatch(btn.getAttribute('data-quick-patch'));
      if (type === 'state') {
        Object.assign(state, patch);
        render();
        if (btn.getAttribute('data-quick-section')) quickScrollTo(btn.getAttribute('data-quick-section'), state.tab);
      } else if (type === 'section') {
        quickScrollTo(btn.getAttribute('data-quick-section'), state.tab);
      } else if (type === 'cross-tab') {
        const target = btn.getAttribute('data-quick-target');
        if (target) openTab(target, patch);
      } else if (type === 'strategy-tab') {
        state.clSubTab = patch.clSubTab || 'principles';
        const restoreFocus = btn.dataset.quickRestoreFocus === 'true';
        delete btn.dataset.quickRestoreFocus;
        render().then(() => {
          resetScrollToTop();
          if (!restoreFocus) return;
          const restored = [...document.querySelectorAll('.quick-access [role="tablist"] [data-quick-action]')]
            .find(tab => tab.getAttribute('data-quick-patch') === JSON.stringify({ clSubTab: state.clSubTab }));
          if (restored) restored.focus();
        });
      }
    });
    document.addEventListener('keydown', (e) => {
      const btn = e.target.closest('.quick-access [role="tablist"] [data-quick-action]');
      if (!btn || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = [...btn.closest('[role="tablist"]').querySelectorAll('[data-quick-action]')];
      const index = tabs.indexOf(btn);
      if (index < 0) return;
      e.preventDefault();
      const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.dataset.quickRestoreFocus = 'true';
      next.click();
    });


    async function hydrateAdminState() {
      try {
        const r = await fetch('/api/admin-state', { cache: 'no-store' });
        if (!r.ok) return;
        const s = await r.json();
        const curW = loadWatched();
        const remoteW = (s.watched && typeof s.watched === 'object') ? s.watched : {};
        const mergedW = Object.assign({}, remoteW);
        for (const k in curW) {
          if (!mergedW[k]) {
            mergedW[k] = curW[k];
          } else {
            mergedW[k] = {
              watched: Boolean(curW[k].watched || mergedW[k].watched),
              t: Math.max(curW[k].t || 0, mergedW[k].t || 0),
              d: Math.max(curW[k].d || 0, mergedW[k].d || 0),
              note: curW[k].note || mergedW[k].note || ''
            };
          }
        }
        localStorage.setItem('h2dev-watched', JSON.stringify(mergedW));

        const curF = JSON.parse(localStorage.getItem('h2dev-fav') || '[]');
        const remoteF = Array.isArray(s.favorites) ? s.favorites : [];
        const favSet = new Set([...remoteF, ...(Array.isArray(curF) ? curF : [])].filter(Boolean));
        localStorage.setItem('h2dev-fav', JSON.stringify([...favSet]));

        if (s.recent && !localStorage.getItem('h2dev-recent')) {
          localStorage.setItem('h2dev-recent', JSON.stringify(s.recent));
        }
        localStorage.setItem('h2dev-admin', JSON.stringify(Object.assign({}, s, { watched: mergedW, favorites: [...favSet] })));
      } catch (e) {}
    }

    const BOTTOM_TABS = ['tatca', 'video', 'ngachxanh', 'rawkenh', 'kenh-mau']; // PHASE 1: bottom-nav toi da 5 muc



    // G3.1: 8 tab renderers tach ra assets/app/tabs/content.js
    const _tabContent = window.H2TabContent.createTabContent({
      state, CAT, ICONS, loadJSON, loadMusicStats, musicStats,
      esc, safeArray, nicheKeyFor, xanhBadge, statCard, pageBanner,
      ico, stripDecorEmoji,
      highlightQuery, fmtMb, fmtBytes, loadChecks, loadWatched,
      watchedBadge, watchedProgress, watchedResumeLabel,
      quickAccessBar, openNicheVideos, expandNicheMore, bindNicheActions,
      RAW_NICHE_GROUPS, RAW_NICHE_TO_GROUP, rawNicheGroup, NICHE_MAP,
      APP_BUILD_VER: (typeof APP_BUILD_VER !== 'undefined' ? APP_BUILD_VER : '')
    });
    const renderTongQuan = _tabContent.renderTongQuan;
    const renderVideo = _tabContent.renderVideo;
    const renderNgachXanh = _tabContent.renderNgachXanh;
    const renderKichBan = _tabContent.renderKichBan;
    const renderNguonReup = _tabContent.renderNguonReup;
    const renderRawKenh = _tabContent.renderRawKenh;
    const renderKenh = _tabContent.renderKenh;
    const renderChienLuoc = _tabContent.renderChienLuoc;


    let searchDebounceTimer = null;
    let isRawSearchNavigating = false;

    function bindSearch() {
      const fq = document.getElementById('fq');
      if (fq) {
        fq.oninput = () => {
          const val = fq.value;
          if (state.tab === 'tai-lieu' || state.tab === 'nhac') state.promptQ = val;
          else if (state.tab === 'nguonreup') state.reupQ = val;
          else if (state.tab === 'kenh-mau') state.kenhQ = val;
          else if (state.tab === 'rawkenh') state.rawQ = val;
          else state.q = val;

          // Real-time live suggestions for rawkenh tab
          if (state.tab === 'rawkenh' && window.showRawSearchSuggestions) {
            window.showRawSearchSuggestions(val);
          }
          // Real-time live suggestions for video tab
          if (state.tab === 'video' && window.showVideoSearchSuggestions) {
            window.showVideoSearchSuggestions(val);
          }

          clearTimeout(searchDebounceTimer);
          searchDebounceTimer = setTimeout(() => {
            render();
          }, 200);
        };

        fq.onfocus = () => {
          if (state.tab === 'rawkenh' && fq.value.trim() && window.showRawSearchSuggestions) {
            window.showRawSearchSuggestions(fq.value);
          }
          if (state.tab === 'video' && fq.value.trim() && window.showVideoSearchSuggestions) {
            window.showVideoSearchSuggestions(fq.value);
          }
        };

        let activeSugIdx = -1;
        fq.onkeydown = (e) => {
          const isVideoTab = (state.tab === 'video');
          const boxId = isVideoTab ? 'video-search-suggestions' : 'raw-search-suggestions';
          const rowClass = isVideoTab ? '.js-v-sug-row' : '.js-sug-row';
          const box = document.getElementById(boxId);
          if (!box || box.classList.contains('hidden')) return;
          const rows = box.querySelectorAll(rowClass);
          if (!rows.length) return;

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSugIdx = (activeSugIdx + 1) % rows.length;
            rows.forEach((r, i) => r.classList.toggle('bg-[#1e293b]', i === activeSugIdx));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSugIdx = (activeSugIdx - 1 + rows.length) % rows.length;
            rows.forEach((r, i) => r.classList.toggle('bg-[#1e293b]', i === activeSugIdx));
          } else if (e.key === 'Enter') {
            if (activeSugIdx >= 0 && activeSugIdx < rows.length) {
              e.preventDefault();
              rows[activeSugIdx].click();
            } else {
              box.classList.add('hidden');
            }
          } else if (e.key === 'Escape') {
            box.classList.add('hidden');
          }
        };
      }

      const btnClearRawQ = document.getElementById('btn-clear-raw-q');
      if (btnClearRawQ) {
        btnClearRawQ.onclick = (e) => {
          e.stopPropagation();
          state.rawQ = '';
          const fqEl = document.getElementById('fq');
          if (fqEl) { fqEl.value = ''; fqEl.focus(); }
          const box = document.getElementById('raw-search-suggestions');
          if (box) box.classList.add('hidden');
          render();
        };
      }

      const btnClearVideoQ = document.getElementById('btn-clear-video-q');
      if (btnClearVideoQ) {
        btnClearVideoQ.onclick = (e) => {
          e.stopPropagation();
          state.q = '';
          const fqEl = document.getElementById('fq');
          if (fqEl) { fqEl.value = ''; fqEl.focus(); }
          const box = document.getElementById('video-search-suggestions');
          if (box) box.classList.add('hidden');
          render();
        };
      }

      const vSugBox = document.getElementById('video-search-suggestions');
      if (vSugBox) {
        vSugBox.onclick = (e) => {
          const jumpBtn = e.target.closest('.js-v-sug-jump');
          if (jumpBtn) {
            // Let the direct link navigate normally
            return;
          }

          const row = e.target.closest('.js-v-sug-row');
          if (row) {
            e.stopPropagation();
            const term = row.getAttribute('data-term');
            vSugBox.classList.add('hidden');
            state.q = term;
            render();
          }
        };
      }

      const sugBox = document.getElementById('raw-search-suggestions');
      if (sugBox) {
        sugBox.onclick = (e) => {
          const openModalBtn = e.target.closest('.js-sug-open-modal');
          if (openModalBtn) {
            e.stopPropagation();
            const rid = openModalBtn.getAttribute('data-raw-id');
            sugBox.classList.add('hidden');
            if (window.openRawDeepModal && rid) window.openRawDeepModal(rid);
            return;
          }

          const row = e.target.closest('.js-sug-row');
          if (row) {
            e.stopPropagation();
            const term = row.getAttribute('data-term');
            const type = row.getAttribute('data-type');
            sugBox.classList.add('hidden');
            if (type === 'niche') {
              state.rawNiche = term;
              state.rawQ = '';
            } else {
              state.rawQ = term;
            }
            render();
          }
        };
      }

      // Outside click listener to dismiss suggestion dropdowns
      if (!window._searchOutsideBound) {
        window._searchOutsideBound = true;
        document.addEventListener('click', (e) => {
          const rawBox = document.getElementById('raw-search-suggestions');
          const vidBox = document.getElementById('video-search-suggestions');
          const fqEl = document.getElementById('fq');
          if (rawBox && !rawBox.contains(e.target) && e.target !== fqEl) {
            rawBox.classList.add('hidden');
          }
          if (vidBox && !vidBox.contains(e.target) && e.target !== fqEl) {
            vidBox.classList.add('hidden');
          }
        });
      }

      document.querySelectorAll('[data-kind]').forEach(btn => {
        if (btn.hasAttribute('data-open-tab')) return;
        btn.onclick = () => { state.kindFilter = btn.getAttribute('data-kind') || ''; render(); };
      });
      const rp = document.getElementById('freset-prompt');
      if (rp) { rp.onclick = () => { state.promptQ = ''; state.kindFilter = ''; state.promptNiche = ''; render(); }; }
      document.querySelectorAll('[data-prompt-niche]').forEach(btn => {
      const pnToggle = document.querySelector('[data-prompt-niche-toggle]'); if (pnToggle) pnToggle.onclick = () => { state.promptNicheExpanded = !state.promptNicheExpanded; render(); };
        if (btn.hasAttribute('data-open-tab')) return;
        btn.onclick = () => { state.promptNiche = btn.getAttribute('data-prompt-niche') || ''; render(); };
      });
      document.querySelectorAll('[data-reup-type]').forEach(btn => { btn.onclick = () => { state.reupType = btn.getAttribute('data-reup-type') || ''; render(); }; });
      document.querySelectorAll('[data-reup-niche]').forEach(btn => { btn.onclick = () => { state.reupNiche = btn.getAttribute('data-reup-niche') || ''; render(); }; });
      const rr = document.getElementById('freset-reup');
      if (rr) { rr.onclick = () => { state.reupQ = ''; state.reupType = ''; state.reupNiche = ''; render(); }; }
      document.querySelectorAll('[data-kenh-niche]').forEach(btn => { btn.onclick = () => { state.kenhNiche = btn.getAttribute('data-kenh-niche') || ''; render(); }; });
      const rk = document.getElementById('freset-kenh');
      if (rk) { rk.onclick = () => { state.kenhQ = ''; state.kenhNiche = ''; render(); }; }
      document.querySelectorAll('[data-raw-group]').forEach(btn => { btn.onclick = () => { const g = btn.getAttribute('data-raw-group') || ''; state.rawGroup = (state.rawGroup === g) ? '' : g; state.rawNiche = ''; state.rawPage = 1; render(); }; });
      document.querySelectorAll('[data-raw-niche]').forEach(btn => {
        btn.onclick = () => {
          const val = btn.getAttribute('data-raw-niche') || '';
          state.rawNiche = (state.rawNiche === val) ? '' : val;
          state.rawPage = 1;
          render();
        };
      });
      const subSelect = document.getElementById('raw-subniche-select');
      if (subSelect) {
        subSelect.onchange = () => {
          state.rawNiche = subSelect.value;
          state.rawPage = 1;
          render();
        };
      }
      const rfToggle = document.querySelector('[data-raw-filters-toggle]'); if (rfToggle) rfToggle.onclick = () => { state.rawFiltersExpanded = !state.rawFiltersExpanded; render(); };

      document.querySelectorAll('[data-raw-vitality]').forEach(btn => { btn.onclick = () => { state.rawVitality = btn.getAttribute('data-raw-vitality') || ''; render(); }; });
      document.querySelectorAll('[data-raw-faceless]').forEach(btn => { btn.onclick = () => { state.rawFaceless = btn.getAttribute('data-raw-faceless') || ''; render(); }; });
      document.querySelectorAll('[data-raw-lang]').forEach(btn => { btn.onclick = () => { state.rawLang = btn.getAttribute('data-raw-lang') || ''; render(); }; });
      const rr2 = document.getElementById('freset-raw');
      if (rr2) { rr2.onclick = () => { state.rawQ = ''; state.rawNiche = ''; state.rawGroup = ''; state.rawVitality = ''; state.rawFaceless = ''; state.rawLang = ''; state.rawPage = 1; render(); }; }
      document.querySelectorAll('.btn-open-raw-deep').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const rid = btn.getAttribute('data-raw-id');
          const jump = btn.getAttribute('data-jump') || '';
          if (window.openRawDeepModal) window.openRawDeepModal(rid, jump);
        };
      });
      const fn = document.getElementById('fniche');
      if (fn) { fn.onchange = () => { state.nicheFilter = fn.value; state.skuFilter = ''; render(); }; }
      const fm = document.getElementById('fmarket');
      if (fm) { fm.onchange = () => { state.marketFilter = fm.value; render(); }; }
      const fs = document.getElementById('fsort');
      if (fs) { fs.onchange = () => { state.sortBy = fs.value; render(); }; }
      const ff = document.getElementById('ffree');
      if (ff) { ff.onchange = () => { state.freeOnly = ff.checked; render(); }; }
      document.querySelectorAll('[data-watch]').forEach(btn => {
        btn.onclick = () => { state.watchFilter = state.watchFilter === btn.getAttribute('data-watch') ? '' : btn.getAttribute('data-watch'); render(); };
      });
      document.querySelectorAll('[data-market-chip]').forEach(btn => {
        btn.onclick = () => { const m = btn.getAttribute('data-market-chip'); state.marketFilter = state.marketFilter === m ? '' : m; render(); };
      });
      const fq_nx = document.getElementById('fq-nx');
      if (fq_nx) {
        fq_nx.oninput = () => {
          state.nxQ = fq_nx.value;
          clearTimeout(searchDebounceTimer);
          searchDebounceTimer = setTimeout(() => {
            render();
          }, 200);
        };
      }
      document.querySelectorAll('[data-nx-tier]').forEach(btn => {
        btn.onclick = () => { state.nxTier = btn.getAttribute('data-nx-tier') || ''; render(); };
      });
      document.querySelectorAll('[data-nx-market]').forEach(btn => {
        btn.onclick = () => { state.nxMarket = btn.getAttribute('data-nx-market') || ''; render(); };
      });
      const fr = document.getElementById('freset');
      if (fr) { fr.onclick = () => { state.q = ''; state.nicheFilter = ''; state.skuFilter = ''; state.marketFilter = ''; state.sortBy = ''; state.freeOnly = false; state.watchFilter = ''; render(); }; }
      const fre = document.getElementById('freset-empty');
      if (fre) { fre.onclick = () => { state.q = ''; state.nicheFilter = ''; state.skuFilter = ''; state.marketFilter = ''; state.sortBy = ''; state.freeOnly = false; state.watchFilter = ''; render(); }; }
      const fr_nx = document.getElementById('freset-nx');
      if (fr_nx) {
        fr_nx.onclick = () => { state.nxQ = ''; state.nxTier = ''; state.nxMarket = ''; render(); };
      }
    }

    function normalizeFilterChipA11y() {
      document.querySelectorAll('#content button.filter-btn').forEach(btn => {
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
      });
    }
    async function render() {
      const el = document.getElementById('content');
      el.setAttribute('aria-busy', 'true');

      // 1. Capture active input & cursor position before re-render
      const activeEl = document.activeElement;
      const activeId = activeEl ? activeEl.id : null;
      let selStart = null, selEnd = null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        try {
          selStart = activeEl.selectionStart;
          selEnd = activeEl.selectionEnd;
        } catch (e) {}
      }

      try {
        let html = '';
        switch (state.tab) {
          case 'tatca': html = await renderTongQuan(); break;
          case 'lotrinh':
            html = `<iframe class="learn-frame" title="Lộ trình học" src="/learn.html?embed=1"></iframe>`;
            break;
          case 'video': html = await renderVideo(); break;
          case 'ngachxanh': html = await renderNgachXanh(); break;
          case 'tai-lieu': html = await renderKichBan(); break;
          case 'nhac': html = await renderKichBan(); break;
          case 'nguonreup': html = await renderNguonReup(); break;
          case 'kenh-mau': html = await renderKenh(); break;
          case 'rawkenh': html = await renderRawKenh(); break;
          case 'chienluoc': html = await renderChienLuoc(); break;
          default: html = await renderTongQuan(); break;
        }
        el.innerHTML = renderLoadErrorBanner() + html;
        const titleEl = document.getElementById('page-title');
        const tabMeta = TABS.find(t => t.id === state.tab);
        if (titleEl && tabMeta) titleEl.textContent = tabMeta.name;
        /* PHASE 1: document.title dong theo route (truoc day luon 1 title) */
        try {
          const tName = tabMeta ? tabMeta.name : 'H2DEV';
          document.title = (state.tab === 'tatca') ? 'H2DEV — Radar kho YouTube' : (tName + ' — H2DEV');
        } catch (e) {}
        document.getElementById('panel-root').setAttribute('aria-labelledby', `tab-${state.tab}`);

    try {
      const a11yEl = document.getElementById('a11y-status');
      const meta = TABS.find(t => t.id === state.tab);
      if (a11yEl && meta) a11yEl.textContent = 'Da mo tab ' + meta.name;
    } catch (e) {}
        // Update Topbar Sub-Navigation: nằm cùng trong <header class="vd-topbar">
        const topbarEl = document.querySelector('.vd-topbar');
        const topbarSubnav = document.getElementById('topbar-subnav');
        const appShell = document.querySelector('.app-shell');

        if (state.tab === 'chienluoc') {
          state.clSubTab = state.clSubTab || 'principles';
          const curTab = state.clSubTab;
          const isAll = curTab === 'all';
          if (topbarSubnav) {
            topbarSubnav.innerHTML = quickAccessBar({
              id: 'strategy-quick-access', label: 'Nội dung chiến lược', mode: 'tab', className: 'quick-access--topbar',
              items: [
                { label: '4 Nguyên tắc', shortLabel: 'Nguyên tắc', active: curTab === 'principles', action: { type: 'strategy-tab', patch: { clSubTab: 'principles' } } },
                { label: 'Quy trình A–Z', shortLabel: 'Quy trình', active: curTab === 'workflow', action: { type: 'strategy-tab', patch: { clSubTab: 'workflow' } } },
                { label: 'Phân bổ ngách', shortLabel: 'Ngách', active: curTab === 'distribution', action: { type: 'strategy-tab', patch: { clSubTab: 'distribution' } } },
                { label: 'YPP & Chính sách', shortLabel: 'YPP', active: curTab === 'policy', action: { type: 'strategy-tab', patch: { clSubTab: 'policy' } } },
                { label: 'Tất cả nội dung', shortLabel: 'Tất cả', active: isAll, action: { type: 'strategy-tab', patch: { clSubTab: 'all' } } }
              ]
            });
            topbarSubnav.classList.remove('hidden');
          }
          if (topbarEl) topbarEl.classList.add('has-subnav');
          if (appShell) appShell.classList.add('has-topbar-subnav');
        } else {
          if (topbarSubnav) {
            topbarSubnav.innerHTML = '';
            topbarSubnav.classList.add('hidden');
          }
          if (topbarEl) topbarEl.classList.remove('has-subnav');
          if (appShell) appShell.classList.remove('has-topbar-subnav');
        }
        bindSearch();
        bindNicheActions();
        normalizeFilterChipA11y();

        // 2. Restore active input focus and cursor position after re-render
        if (activeId) {
          const restored = document.getElementById(activeId);
          if (restored && (restored.tagName === 'INPUT' || restored.tagName === 'TEXTAREA')) {
            restored.focus();
            if (selStart !== null && selEnd !== null) {
              try { restored.setSelectionRange(selStart, selEnd); } catch (e) {}
            }
          }
        }
        document.querySelectorAll('[data-check-id]').forEach(box => {
          box.onchange = () => { saveCheck(box.getAttribute('data-check-id'), box.checked); box.setAttribute('aria-checked', box.checked ? 'true' : 'false'); };
        });
        if (!window._cachedStatsText) {
          try {
            const [vidsTab, kenh, docs] = await Promise.all([
              loadJSON("data-tabs/videos.json").catch(function(){return [];}),
              loadJSON("data-tabs/kenh-mau.json").catch(function(){return [];}),
              loadJSON("data-tabs/tai-lieu-full.json").catch(function(){return [];})
            ]);
            const videos = Array.isArray(vidsTab) ? vidsTab : (vidsTab && vidsTab.videos) || [];
            window._cachedStatsText = videos.length + " video · " + docs.length + " TL · " + kenh.length + " kênh";
          } catch(e) {}
        }
        const hdEl = document.getElementById("hd-stats");
        if (hdEl && window._cachedStatsText) hdEl.textContent = window._cachedStatsText;
      } catch (error) {
        el.innerHTML = `<div class="card p-6 border-red-800" role="alert"><h2 class="text-xl font-bold text-white mb-2">Không thể tải dữ liệu</h2><p class="text-gray-300">${esc(error.message)}</p><button type="button" class="mt-4 bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-xl text-sm" data-action="retry-render">Thử lại</button></div>`;
      } finally { el.setAttribute("aria-busy", "false"); }
    }

    /* PHASE 1: Nguon su that duy nhat cho state tu URL.
       Dung CHUNG cho init() va popstate() -> Back/Forward khong con mat state.
       Bat buoc khoi phuc DU 9 tham so: tab, market, niche, page, rn, rg, rq, watch, free, sub. */
    const URL_TABS = ['tatca', 'lotrinh', 'video', 'ngachxanh', 'tai-lieu', 'nhac', 'nguonreup', 'kenh-mau', 'rawkenh', 'chienluoc'];
    /* Alias URL cu -> tab id moi (BE da 301, day la lop bao hiem cho link noi bo con sot) */
    const URL_ALIAS = { 'tongquan': 'tatca', 'kichban': 'tai-lieu', 'kenh': 'kenh-mau' };
    function readStateFromURL(validTabs) {
      const tabs = validTabs || URL_TABS;
      const qp = new URLSearchParams(location.search);
      const rawPath = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const norm = URL_ALIAS[rawPath] || rawPath;
      const tabFromPath = tabs.find(t => t.toLowerCase() === norm);
      state.tab = tabFromPath || qp.get('tab') || 'tatca';
      state.marketFilter = qp.get('market') || '';
      state.nicheFilter = qp.get('niche') || '';
      state.watchFilter = qp.get('watch') || '';
      state.freeOnly = qp.get('free') === '1';
      state.rawPage = parseInt(qp.get('page'), 10) || 1;
      state.rawNiche = qp.get('rn') || '';
      state.rawGroup = qp.get('rg') || '';
      state.rawQ = qp.get('rq') || '';
      state.clSubTab = qp.get('sub') || state.clSubTab || 'principles';
      return state;
    }

    (async function init() {
      const validTabs = ['tatca', 'lotrinh', 'video', 'ngachxanh', 'tai-lieu', 'nhac', 'nguonreup', 'kenh-mau', 'rawkenh', 'chienluoc'];
      readStateFromURL(validTabs);
      await hydrateAdminState();
      renderTabs();
      await render();
      resetScrollToTop();

      // Click logo thương hiệu để về trang chủ Tổng quan & cuộn lên đầu trang
      document.querySelectorAll('.vd-brand').forEach(brandEl => {
      brandEl.setAttribute('role', 'link');
      brandEl.setAttribute('tabindex', '0');
      brandEl.setAttribute('aria-label', 'Về trang chủ Tổng quan');
      brandEl.style.cursor = 'pointer';
      brandEl.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); brandEl.click(); } };
        brandEl.style.cursor = 'pointer';
        brandEl.title = 'Về trang chủ Tổng quan';
        brandEl.onclick = (e) => {
          e.preventDefault();
          openTab('tatca');
          resetScrollToTop();
        };
      });

      // Floating Back-to-Top FAB controller
      const btt = document.getElementById('btn-back-to-top');
      if (btt) {
        btt.onclick = (e) => {
          e.preventDefault();
          resetScrollToTop();
        };
        const handleScroll = () => {
          const pr = document.getElementById('panel-root');
          const top = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, (pr && pr.scrollTop) || 0);
          /* PHASE 2: dung class chuan .is-visible dong bo 3 trang (truoc day .visible) */
          if (top > 320) {
            btt.classList.add('is-visible');
          } else {
            btt.classList.remove('is-visible');
          }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        const pr = document.getElementById('panel-root');
        if (pr) pr.addEventListener('scroll', handleScroll, { passive: true });
      }

      let syncTimer = null;
      function syncRender() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          const scY = window.scrollY;             // giữ vị trí cuộn trước khi render lại
          render().then(() => { window.scrollTo(0, scY); });
        }, 60);
      }
      window.addEventListener('popstate', () => {
        /* PHASE 1: dung CHUNG readStateFromURL -> khoi phuc du 9 tham so (truoc day mat 6) */
        readStateFromURL(URL_TABS);
        renderTabs();
        render();
        resetScrollToTop();
      });
      window.addEventListener('pageshow', (e) => { if (e.persisted) syncRender(); });
      window.addEventListener('visibilitychange', () => { if (!document.hidden) syncRender(); });

      // Cử chỉ vuốt trái / phải chuyển tab (Touch Swipe Tabs Navigation)
      // Không nhận swipe bắt đầu từ dải tab cuộn ngang hoặc control tương tác.
      let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0, touchStartedInInteractive = false;
      window.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        touchStartedInInteractive = Boolean(e.target.closest('button, a, input, select, textarea, [role="tab"], .cl-tabbar, .vd-topbar-subnav'));
        touchStartX = e.touches[0].screenX;
        touchStartY = e.touches[0].screenY;
      }, { passive: true });

      window.addEventListener('touchend', (e) => {
        if (touchStartedInInteractive || !e.changedTouches || !e.changedTouches[0]) {
          touchStartedInInteractive = false;
          return;
        }
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        // Chỉ nhận cử chỉ quẹt ngang rõ ràng (nghiêng dưới 30 độ và vuốt > 70px)
        if (Math.abs(dx) > 70 && Math.abs(dy) < 45) {
          const tabOrder = ['tatca', 'video', 'ngachxanh', 'tai-lieu', 'nhac', 'nguonreup', 'kenh-mau', 'rawkenh', 'chienluoc', 'lotrinh'];
          const curIdx = tabOrder.indexOf(state.tab);
          if (curIdx >= 0) {
            if (dx < 0 && curIdx < tabOrder.length - 1) {
              // Vuốt sang trái -> Tiến tab tiếp theo
              openTab(tabOrder[curIdx + 1]);
            } else if (dx > 0 && curIdx > 0) {
              // Vuốt sang phải -> Lùi tab trước đó
              openTab(tabOrder[curIdx - 1]);
            }
          }
        }
      });

      // Mở Modal Hồ Sơ Chuyên Sâu & Top Videos của Kênh Mẫu (Toàn bộ dữ liệu mở 100%)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-open-raw-deep');
        if (btn) {
          const rawId = btn.getAttribute('data-raw-id');
          const jump = btn.getAttribute('data-jump') || '';
          if (window.openRawDeepModal) {
            window.openRawDeepModal(rawId, jump);
          }
        }
      });

      window.openRawDeepModal = async function(rawId, jumpTarget) {
        let modal = document.getElementById('raw-deep-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'raw-deep-modal';
          modal.setAttribute('role', 'dialog');
          modal.setAttribute('aria-modal', 'true');
          modal.setAttribute('aria-label', 'Hồ sơ kênh raw');
          modal.tabIndex = -1;
          modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:99999; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
          document.body.appendChild(modal);
        }

        // G3: bind modal controls ? function scope (kh?ng nh?t trong if (!modal))
        const _rawDeepCtl = window.H2RawDeepModal.makeControls(modal);
        const closeRawDeepModal = _rawDeepCtl.closeRawDeepModal;
        const switchRawTab = _rawDeepCtl.switchRawTab;
        window.closeRawDeepModal = closeRawDeepModal;
        window.switchRawTab = switchRawTab;

        modal.onclick = (e) => {
          if (e.target === modal || e.target.id === 'close-raw-deep' || (e.target.closest && e.target.closest('#close-raw-deep'))) {
            closeRawDeepModal();
          }
        };

        const records = window._rawKenhRecords || [];
        const r = records.find(x => x.id === rawId) || {};
        const ch = r.channel || {};
        const vA = r.vitalityAudit || {};
        const ocr = r.ocr || {};
        const vision = r.visionAnalysis || {};
        const vRec = (r.vidiqVerification && r.vidiqVerification.recentVelocity) ? r.vidiqVerification.recentVelocity : [];
        const dossierPath = (r.deepIntelligence && r.deepIntelligence.dossierPath) ? r.deepIntelligence.dossierPath : ('data/raw-channels-deep/' + (r.deepIntelligence && r.deepIntelligence.folderName ? r.deepIntelligence.folderName : ''));

        // Hiển thị trạng thái đang tải
        modal.innerHTML = `
          <div style="position:relative; width:100%; max-width:980px; max-height:92vh; background:#0f172a; border:1px solid #334155; border-radius:1.25rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.95);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:#1e293b; border-bottom:1px solid #334155; flex-shrink:0;">
              <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
                <span style="font-size: 18px; display:inline-flex;">${ico('bar-chart-3', 20)}</span>
                <div class="min-w-0-g3">
                  <h3 style="font-size: 14px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Hồ Sơ Chuyên Sâu: ${esc(ch.title || r.id)}</h3>
                  <p style="font-size: 12px; color:#94a3b8;">Đang nạp dữ liệu chi tiết...</p>
                </div>
              </div>
              <button type="button" id="close-raw-deep" style="padding:0.4rem 0.85rem; border-radius:0.5rem; background:#334155; border:1px solid #475569; color:#e2e8f0; font-size: 13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;">${ico('x', 14)} Đóng</button>
            </div>
            <div style="padding:3rem 2rem; text-align:center; color:#94a3b8; font-size: 14px;">
              <div style="font-size: 32px; margin-bottom:0.75rem; display:flex; justify-content:center;">${ico('hourglass', 24)}</div>
              Đang đọc toàn bộ hồ sơ kênh, thống kê vidIQ và danh sách top videos từ kho dữ liệu...
            </div>
          </div>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        focusModal(modal);

        // Fetch deep profile, top videos, voice profile and production toolkit
        let profile = null;
        let topVideos = null;
        let voiceProfile = null;
        let productionToolkit = null;
        if (dossierPath) {
          try {
            const pRes = await fetch(dossierPath + '/channel-profile.json');
            if (pRes.ok) profile = await pRes.json();
          } catch(e) {}
          try {
            const tvRes = await fetch(dossierPath + '/top-videos.json');
            if (tvRes.ok) topVideos = await tvRes.json();
          } catch(e) {}
          try {
            const vRes = await fetch(dossierPath + '/voice_profile.json');
            if (vRes.ok) voiceProfile = await vRes.json();
          } catch(e) {}
          try {
            const tkRes = await fetch(dossierPath + '/production_toolkit.json');
            if (tkRes.ok) productionToolkit = await tkRes.json();
          } catch(e) {}
        }

        const pData = profile || {};
        const tvList = (topVideos && topVideos.videos) ? (topVideos.videos.slice().sort((a, b) => (b.views || 0) - (a.views || 0))) : [];
        const demoVid = r.featuredDemoVideo || (r.deepIntelligence && r.deepIntelligence.featuredDemoVideo) || (tvList[0] || null);
        const tags = (pData.channelTags && pData.channelTags.length) ? pData.channelTags : (ocr.tags || []);
        const yppNote = (productionToolkit && productionToolkit.yppRiskNote) || pData.yppRiskNote || {};
        const dataGaps = (productionToolkit && productionToolkit.dataGaps) || pData.dataGaps || {};
        const retentionProxy = (productionToolkit && productionToolkit.retentionAvdProxy) || pData.retentionAvdProxy || null;
        const ytUrl = ch.url || ('https://www.youtube.com/results?search_query=' + encodeURIComponent(ch.title || ch.handle || ''));
        const rawSubs = pData.subscribers != null ? pData.subscribers : ch.subscribers;
        const subsDisplay = (rawSubs != null && rawSubs !== '') ? Number(rawSubs).toLocaleString('vi-VN') : (ocr.subsText || 'N/A');
        const rawViews = pData.views != null ? pData.views : ch.views;
        const viewsDisplay = (rawViews != null && rawViews !== '') ? Number(rawViews).toLocaleString('vi-VN') : (ocr.views ? Number(ocr.views).toLocaleString('vi-VN') : 'N/A');
        const rawVids = pData.videoCount != null ? pData.videoCount : ch.videoCount;
        const videoCountDisplay = rawVids != null ? rawVids : (ocr.videoCountText || 'N/A');
        const countryDisplay = pData.country || 'Toàn cầu';
        const nicheDisplay = r.editorialNiche || r.niche || 'Chưa phân loại';

        const g30 = (pData.longevityAudit && pData.longevityAudit.growth30d) || (r.vidiqVerification && r.vidiqVerification.growth30d) || {};
        const subGained = g30.subscribersGained != null ? (g30.subscribersGained >= 0 ? '+' : '') + Number(g30.subscribersGained).toLocaleString() : 'N/A';
        const viewGained = g30.viewsGained != null ? (g30.viewsGained >= 0 ? '+' : '') + Number(g30.viewsGained).toLocaleString() : 'N/A';
        const vidPublished = g30.videosPublished != null ? g30.videosPublished : '0';
        const vidAnomaly = g30.note || (g30.videosPublished < 0 ? `Đã thanh lọc ${Math.abs(g30.videosPublished)} video cũ` : '');

        function formatNum(n) {
          if (!n && n !== 0) return 'N/A';
          n = Number(n);
          if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
          if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
          return String(n);
        }

        function formatDuration(pt) {
          if (!pt) return '';
          return pt.replace('PT', '').toLowerCase();
        }

        modal.innerHTML = `
          <div class="raw-deep-container" style="position:relative; width:100%; max-width:1040px; max-height:92vh; background:#0b0f19; border:1px solid #1e293b; border-radius:1.25rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.95);">
            <!-- Header -->
            <div class="raw-deep-header" style="padding:1rem 1.25rem; background:#111827; border-bottom:1px solid #1f2937; flex-shrink:0;">
              <div class="raw-deep-header-row1" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:0.75rem;">
                <div class="raw-deep-header-avatar-info" style="display:flex; align-items:center; gap:0.75rem; min-width:0; flex:1;">
                  <img src="${esc(pData.avatar || ch.avatar || 'assets/thumbs/placeholder.svg')}" onerror="this.onerror=null;this.src='assets/thumbs/placeholder.svg'" alt="Avatar" loading="lazy" decoding="async" class="raw-deep-header-avatar" width="48" height="48" style="width:48px; height:48px; border-radius:0.75rem; object-fit:cover; border:1px solid #374151; flex-shrink:0;">
                  <div style="min-width:0; flex:1;">
                    <div class="row-wrap">
                      <h3 class="raw-deep-header-title truncate" style="font-size: 16px; font-weight: 700; color:#fff; margin:0;">${esc(pData.title || ch.title || r.id)}</h3>
                      <span style="font-size: 11px; font-family:monospace; padding:0.12rem 0.45rem; border-radius:0.375rem; background:#1f2937; color:#94a3b8; border:1px solid #374151;">${esc(r.id)}</span>
                      <span style="font-size: 11px; font-weight:600; padding:0.12rem 0.45rem; border-radius:0.375rem; background:rgba(239,68,68,0.2); color:#fca5a5; border:1px solid rgba(239,68,68,0.4);">${esc(nicheDisplay)}</span>
                    </div>
                  </div>
                </div>
                <div class="raw-deep-header-actions" style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0;">
                  <a href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer" style="padding:0.42rem 0.8rem; border-radius:0.55rem; background:rgba(239,68,68,0.85); color:#fff; font-size: 12px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;"><span style="display:inline-flex;">${ico('tv', 14)}</span><span class="raw-deep-mobile-hide"> Mở YouTube ${ico('arrow-up-right', 14)}</span></a>
                  <button type="button" id="close-raw-deep" style="padding:0.42rem 0.8rem; border-radius:0.55rem; background:#374151; border:1px solid #4b5563; color:#e5e7eb; font-size: 12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center;" title="Đóng [Esc]">${ico('x', 14)}</button>
                </div>
              </div>
              <div class="raw-deep-header-meta" style="display:flex; align-items:center; gap:0.5rem; font-size: 12px; color:#94a3b8; margin-top:0.35rem; flex-wrap:wrap;">
                <span style="color:#e2e8f0; font-weight:600;">${esc(decodeURIComponent(pData.handle || ch.handle || ''))}</span>
                <span>•</span>
                <span>Quốc gia: <strong class="c-slate-100">${esc(countryDisplay)}</strong></span>
                ${(voiceProfile && voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageFlag) || (r.audioLanguageInfo && r.audioLanguageInfo.flag) ? `
                <span>•</span>
                <span style="display:inline-flex; align-items:center; gap:0.25rem; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.35); padding:0.08rem 0.45rem; border-radius:0.35rem; color:#38bdf8; font-weight:700;">
                  <span>${esc((voiceProfile && voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageFlag) || (r.audioLanguageInfo && r.audioLanguageInfo.flag))}</span>
                  <span>${esc((voiceProfile && voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.audioLanguage) || (r.audioLanguageInfo && r.audioLanguageInfo.language))}</span>
                </span>` : ''}
                <span>•</span>
                <span style="color:#10b981; font-weight:600;">${esc(stripDecorEmoji(vA.healthBadge) || (pData.longevityAudit ? pData.longevityAudit.sustainabilityStatus : ''))}</span>
              </div>
            </div>

            <!-- Pinned Segmented Tab Bar (4 Tab chia đều 100% màn hình, không bao giờ bị cắt chữ hay tràn lề) -->
            <div class="raw-deep-tabbar">
              <button type="button" class="raw-tab-btn active" data-tab="overview">
                <span>${ico('bar-chart-3', 14)}</span> <span>Tổng quan</span>
              </button>
              <button type="button" class="raw-tab-btn" data-tab="mission">
                <span>${ico('rocket', 14)}</span> <span>Vũ khí</span>
              </button>
              <button type="button" class="raw-tab-btn" data-tab="voice">
                <span>${ico('mic', 14)}</span> <span>Voice DNA</span>
              </button>
              <button type="button" class="raw-tab-btn" data-tab="videos">
                <span>${ico('tv', 14)}</span> <span>Top Videos</span>
              </button>
              <button type="button" class="raw-tab-btn raw-tab-all" data-tab="all">
                <span>${ico('files', 14)}</span> <span>Tất cả</span>
              </button>
            </div>

            <!-- Body (Cuộn độc lập bên dưới tab bar) -->
            <div class="raw-deep-body" style="padding:1.25rem; overflow-y:auto; flex:1; min-height:0; display:flex; flex-direction:column; gap:1.25rem;">
              
              <!-- Tab Panel 1: Tổng Quan & KPI -->
              <div id="raw-panel-overview" class="raw-tab-panel" style="display:flex; flex-direction:column; gap:1.25rem;">
                <!-- 4 KPI Cards -->
                <div class="raw-deep-kpis" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem;">
                <div class="raw-deep-kpi-card" style="background:#131d31; border:1px solid #1e293b; border-radius:0.875rem; padding:0.85rem 1rem;">
                  <div style="font-size: 11px; text-transform:uppercase; color:#94a3b8; font-weight:600;">Lượng người đăng ký (Subs)</div>
                  <div class="kpi-val" style="font-size: 20px; font-weight: 700; color:#38bdf8; margin-top:0.25rem;">${subsDisplay}</div>
                  <div class="kpi-sub" style="font-size: 12px; color:#64748b; margin-top:0.2rem;">30 ngày qua: <span style="color:#38bdf8; font-weight:600;">${subGained} subs</span></div>
                </div>
                <div class="raw-deep-kpi-card" style="background:#131d31; border:1px solid #1e293b; border-radius:0.875rem; padding:0.85rem 1rem;">
                  <div style="font-size: 11px; text-transform:uppercase; color:#94a3b8; font-weight:600;">Tổng lượt xem (Views)</div>
                  <div class="kpi-val" style="font-size: 20px; font-weight: 700; color:#a855f7; margin-top:0.25rem;">${viewsDisplay}</div>
                  <div class="kpi-sub" style="font-size: 12px; color:#64748b; margin-top:0.2rem;">30 ngày qua: <span style="color:#a855f7; font-weight:600;">${viewGained} views</span> ${g30.viewsGained < 0 ? `<span style="font-size: 11px; color:#38bdf8; font-weight:600;">(${vidAnomaly})</span>` : ''}</div>
                </div>
                <div class="raw-deep-kpi-card" style="background:#131d31; border:1px solid #1e293b; border-radius:0.875rem; padding:0.85rem 1rem;">
                  <div style="font-size: 11px; text-transform:uppercase; color:#94a3b8; font-weight:600;">Quy mô video & Doanh thu</div>
                  <div class="kpi-val" style="font-size: 20px; font-weight: 700; color:#10b981; margin-top:0.25rem;">${esc(vA.estimatedMonthlyRev || '$1,000+ / tháng')}</div>
                  <div class="kpi-sub" style="font-size: 12px; color:#64748b; margin-top:0.2rem;">Tổng video: <span style="color:#fff; font-weight:600;">${videoCountDisplay} video</span> ${g30.videosPublished < 0 ? `<span style="font-size: 11px; color:#38bdf8; font-weight:600;">(${esc(vidAnomaly)})</span>` : `(${vidPublished} video mới)`}</div>
                </div>
                <div class="raw-deep-kpi-card" style="background:#131d31; border:1px solid #1e293b; border-radius:0.875rem; padding:0.85rem 1rem;">
                  <div style="font-size: 11px; text-transform:uppercase; color:#94a3b8; font-weight:600;">Tình trạng YPP & Sức khỏe</div>
                  <div class="kpi-val" style="font-size: 14px; font-weight:700; color:#f59e0b; margin-top:0.45rem;">${esc(stripDecorEmoji(vA.monetizationBadge) || (pData.longevityAudit ? pData.longevityAudit.sustainabilityStatus : 'Bình thường'))}</div>
                  <div class="kpi-sub" style="font-size: 12px; color:#94a3b8; margin-top:0.2rem;">${vA.daysSinceLatest != null ? 'Video gần nhất: ' + vA.daysSinceLatest + ' ngày trước' : ''}</div>
                </div>
              </div>

              <!-- Cảnh báo hoặc lời khuyên chuyên gia -->
              ${vA.monetizationAdvisory ? `
              <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:0.875rem; padding:0.85rem 1.1rem;">
                <div style="font-size: 13px; font-weight:700; color:#fcd34d; display:flex; align-items:center; gap:0.4rem;">
                  <span>${ico('lightbulb', 14)}</span> Đánh Giá Sức Khỏe Kênh & Lời Khuyên Khai Thác:
                </div>
                <p style="font-size: 12px; color:#fef3c7; line-height:1.55; margin-top:0.35rem;">${esc(vA.monetizationAdvisory)}</p>
              </div>` : ''}

              ${retentionProxy && retentionProxy.status === 'PROXY_ONLY' ? `
              <div id="raw-retention-proxy" style="background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.38); border-radius:0.875rem; padding:0.9rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;">
                  <div style="font-size: 13px; font-weight: 700; color:#7dd3fc; display:flex; align-items:center; gap:0.45rem;">
                    <span>◌</span> Public retention signal — không phải AVD thật
                  </div>
                  <span style="font-size: 12px; font-weight: 700; color:#fbbf24; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); padding:0.2rem 0.55rem; border-radius:0.4rem;">${esc(retentionProxy.status)}</span>
                </div>
                <div class="raw-proxy-grid" style="display:grid; grid-template-columns:minmax(120px,0.6fr) minmax(260px,2fr); gap:0.8rem; align-items:center; margin-top:0.65rem;">
                  <div style="background:#0f172a; border:1px solid rgba(14,165,233,0.28); border-radius:0.7rem; padding:0.75rem; text-align:center;">
                    <div style="font-size: 24px; font-weight: 700; color:#38bdf8;">${esc(String(retentionProxy.publicRetentionSignalScore ?? 'N/A'))}<span style="font-size: 13px; color:#94a3b8;">/100</span></div>
                    <div style="font-size: 11px; color:#94a3b8; margin-top:0.15rem;">Điểm tín hiệu công khai</div>
                  </div>
                  <div style="font-size: 12px; color:#cbd5e1; line-height:1.55;">
                    <p style="margin:0;"><strong style="color:#e0f2fe;">Ý nghĩa:</strong> ${esc(retentionProxy.interpretation || 'Dùng để ưu tiên video cần mổ xẻ.')}</p>
                    <p style="margin:0.3rem 0 0;"><strong style="color:#e0f2fe;">Độ tin cậy:</strong> ${esc(retentionProxy.confidence || 'N/A')} — ${esc(retentionProxy.confidenceReason || '')}</p>
                    <p style="margin:0.3rem 0 0;"><strong style="color:#e0f2fe;">Phạm vi:</strong> ${esc(String(retentionProxy.coverage?.topVideosAudited ?? 0))}/${esc(String(retentionProxy.coverage?.topVideosDeclared ?? 0))} video; transcript đầy đủ ${esc(String(retentionProxy.coverage?.transcriptRecordsComplete ?? 0))}/${esc(String(retentionProxy.coverage?.transcriptRecordsDeclared ?? 0))}.</p>
                  </div>
                </div>
                <div class="raw-proxy-subgrid" style="margin-top:0.7rem; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0.55rem;">
                  <div style="background:#0f172a; border:1px solid rgba(14,165,233,0.2); border-radius:0.6rem; padding:0.6rem;">
                    <div style="font-size: 11px; color:#38bdf8; font-weight: 700; text-transform:uppercase;">Dùng làm gì</div>
                    <div style="font-size: 11px; color:#cbd5e1; line-height:1.45; margin-top:0.25rem;">So sánh tương đối trong 10 video đã audit; ưu tiên kiểm tra hook, pacing và cấu trúc.</div>
                  </div>
                  <div style="background:#0f172a; border:1px solid rgba(245,158,11,0.22); border-radius:0.6rem; padding:0.6rem;">
                    <div style="font-size: 11px; color:#fbbf24; font-weight: 700; text-transform:uppercase;">Không được gọi là</div>
                    <div style="font-size: 11px; color:#fde68a; line-height:1.45; margin-top:0.25rem;">AVD bao nhiêu phút, retention bao nhiêu %, hay watch time thật.</div>
                  </div>
                </div>
                <div style="margin-top:0.55rem; font-size: 11px; color:#94a3b8; line-height:1.45;">Nguồn: ${esc(retentionProxy.channelEvidence?.source || 'top-videos.json + transcripts/*.json')} · YouTube Analytics thật chưa được cung cấp.</div>
              </div>` : ''}

              ${yppNote && yppNote.status ? `
              <div id="raw-ypp-risk-note" style="background:rgba(251,113,133,0.08); border:1px solid rgba(251,113,133,0.35); border-radius:0.875rem; padding:0.9rem 1.1rem;">
                <div style="font-size: 13px; font-weight: 700; color:#fda4af; display:flex; align-items:center; gap:0.45rem;">
                  <span>${ico('shield', 14)}</span> YPP Risk Note & Phòng Thủ Reused/Inauthentic Content
                </div>
                <p style="font-size: 12px; color:#fecdd3; line-height:1.55; margin-top:0.4rem;">${esc(yppNote.reason || '')}</p>
                ${Array.isArray(yppNote.riskFactors) && yppNote.riskFactors.length ? `
                <div class="raw-proxy-subgrid" style="margin-top:0.55rem; display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:0.55rem;">
                  <div style="background:#0f172a; border:1px solid rgba(251,113,133,0.25); border-radius:0.65rem; padding:0.65rem;">
                    <div style="font-size: 11px; color:#fb7185; font-weight: 700; text-transform:uppercase; margin-bottom:0.35rem;">Risk Factors</div>
                    <ul style="margin:0 0 0 1rem; padding:0; color:#fda4af; font-size: 12px; line-height:1.5;">${yppNote.riskFactors.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
                  </div>
                  <div style="background:#0f172a; border:1px solid rgba(52,211,153,0.25); border-radius:0.65rem; padding:0.65rem;">
                    <div style="font-size: 11px; color:#34d399; font-weight: 700; text-transform:uppercase; margin-bottom:0.35rem;">Required Mitigations</div>
                    <ul style="margin:0 0 0 1rem; padding:0; color:#bbf7d0; font-size: 12px; line-height:1.5;">${(yppNote.requiredMitigations || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
                  </div>
                </div>` : ''}
              </div>` : ''}

              ${dataGaps && (typeof dataGaps === 'object') && (Array.isArray(dataGaps) ? dataGaps.length : Object.keys(dataGaps).length) ? (() => {
                if (Array.isArray(dataGaps)) {
                  return `
              <div id="raw-data-gaps" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.28); border-radius:0.875rem; padding:0.65rem 1rem;">
                <div style="font-size: 12px; font-weight: 700; color:#38bdf8; margin-bottom:0.4rem;">Ghi chú kiểm định (${dataGaps.length} mục):</div>
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                  ${dataGaps.map(g => `<span style="font-size: 11px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:0.12rem 0.5rem; border-radius:0.4rem;">${ico('info', 14)} ${esc(g)}</span>`).join('')}
                </div>
              </div>`;
                }
                const GAP_LABELS = {
                  liveSnapshotRefreshed: 'Live snapshot',
                  thumbnailOcrVisualScoring10of10: 'Thumbnail 10/10',
                  retentionAvdProxy: 'Retention proxy'
                };
                const gapEntries = Object.entries(dataGaps);
                const openGaps = gapEntries.filter(([, g]) => g && g.status && !g.status.startsWith('COMPLETED') && !g.status.startsWith('REFRESHED') && !g.status.startsWith('PROXY_ACCEPTED'));
                const allResolved = openGaps.length === 0;
                const liveEntry = (gapEntries.find(([k]) => k === 'liveSnapshotRefreshed') || [])[1];
                const lastAuditLabel = (liveEntry && liveEntry.status && (liveEntry.status.includes('2026_09_18') ? '18/09/2026' : liveEntry.status.includes('2026_09_15') ? '15/09/2026' : liveEntry.status.includes('2026_09_14') ? '14/09/2026' : 'đã khóa')) || '18/09/2026';
                if (allResolved) {
                  return `
              <div id="raw-data-gaps" style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.28); border-radius:0.875rem; padding:0.65rem 1rem;">
                <div class="row-between">
                  <div class="row-wrap">
                    <span>${ico('check', 14)}</span>
                    <span style="font-size: 12px; font-weight: 700; color:#34d399;">Kiểm định Data Gaps — Hoàn tất (${gapEntries.length}/${gapEntries.length} resolved)</span>
                  </div>
                  <span style="font-size: 11px; color:#64748b;">Audit lần cuối: ${lastAuditLabel}</span>
                </div>
                <div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.4rem;">
                  ${gapEntries.map(([key, gap]) => `<span style="font-size: 11px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#34d399; padding:0.12rem 0.5rem; border-radius:0.4rem; font-weight:600;" title="${esc(gap.currentEvidence || '')}">${ico('check', 14)} ${esc(GAP_LABELS[key] || key)}</span>`).join('')}
                </div>
              </div>`;
                }
                return `
              <div id="raw-data-gaps" style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.32); border-radius:0.875rem; padding:0.9rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.6rem;">
                  <div class="row-wrap">
                    <span>${ico('alert-triangle', 14)}</span>
                    <span style="font-size: 12px; font-weight: 700; color:#fbbf24;">Data Gaps cần bổ sung (${openGaps.length}/${gapEntries.length} chưa khóa)</span>
                  </div>
                  <span style="font-size: 11px; color:#64748b;">Audit lần cuối: ${lastAuditLabel}</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0.5rem;">
                  ${gapEntries.map(([key, gap]) => {
                    const isRes = gap.status && (gap.status.startsWith('COMPLETED') || gap.status.startsWith('REFRESHED') || gap.status.startsWith('PROXY_ACCEPTED'));
                    const cardBorder = isRes ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.4)';
                    const labelColor = isRes ? '#34d399' : '#fbbf24';
                    const badgeBg = isRes ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)';
                    const ev = gap.currentEvidence || '';
                    const evShort = ev.length > 100 ? ev.slice(0, 100) + '...' : ev;
                    return `
                  <div style="background:#0f172a; border:1px solid ${cardBorder}; border-radius:0.65rem; padding:0.65rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.4rem; margin-bottom:0.3rem;">
                      <div style="font-size: 12px; color:${labelColor}; font-weight: 700;">${esc(GAP_LABELS[key] || key)}</div>
                      <span style="font-size: 11px; font-weight:700; padding:0.1rem 0.35rem; border-radius:0.3rem; background:${badgeBg}; color:${labelColor};">${esc(gap.status || '')}</span>
                    </div>
                    <p style="font-size: 11px; color:#94a3b8; line-height:1.45; margin:0;" title="${esc(ev)}">${esc(evShort)}</p>
                  </div>`;
                  }).join('')}
                </div>
              </div>`;
              })() : ''}
              </div> <!-- End Tab Panel 1: Overview -->

              <!-- Tab Panel 2: Vũ Khí Tác Chiến (Mission Control) -->
              <div id="raw-panel-mission" class="raw-tab-panel" style="display:none; flex-direction:column; gap:1.25rem;">
              ${productionToolkit ? (() => {
                const tk = productionToolkit;
                const vd = tk.visualDirective || {};
                const sb = tk.scriptBlueprint || {};
                const pkg = tk.packagingCTR || {};
                const ps = tk.productionStack || {};
                const lp = tk.launchpad5Steps || [];
                const mp = tk.targetMarket || {};

                // Tính toán trạng thái Benchmark động, xóa bỏ hoàn toàn nghiệm thu mù
                const gapsEntries = Object.entries(dataGaps || {});
                const openGaps = gapsEntries.filter(([k, g]) => g && (g.status === 'NEEDS_REFRESH' || g.status === 'MISSING_SCORE'));
                const isBenchmarkCleared = openGaps.length === 0;

                const statusBadgeHtml = isBenchmarkCleared
                  ? `<span style="font-size: 11px; font-weight: 700; padding:0.15rem 0.6rem; border-radius:0.375rem; background:rgba(14,165,233,0.18); border:1px solid rgba(14,165,233,0.5); color:#38bdf8; display:inline-flex; align-items:center; gap:0.25rem;">
                      ${ico('check', 14)} Hồ sơ Benchmark đối thủ đã khóa (Sẵn sàng Pilot)
                    </span>`
                  : `<span style="font-size: 11px; font-weight: 700; padding:0.15rem 0.6rem; border-radius:0.375rem; background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.5); color:#fbbf24; display:inline-flex; align-items:center; gap:0.25rem;">
                      ${ico('alert-triangle', 14)} Đang thẩm định đối thủ (${openGaps.length} gaps chưa khóa)
                    </span>`;

                const refVid = sb.scriptRefVid || (ps.referenceVideo && ps.referenceVideo.videoId) || (topVideos && topVideos.videos && topVideos.videos[0] && topVideos.videos[0].videoId) || '';
                const refTitle = sb.scriptRefTitle || (ps.referenceVideo && ps.referenceVideo.title) || (topVideos && topVideos.videos && topVideos.videos[0] && topVideos.videos[0].title) || '';
                const refViews = (topVideos && topVideos.videos && topVideos.videos[0] && formatNum(topVideos.videos[0].views)) || '1M+';
                const sopPath = ps.sopDocPath || ps.skillDocPath || 'assets/docs/tai-lieu/pipeline-hoat-hinh-ai.md';
                const repoPath = ps.repoPath || ps.skillRepoPath || 'pipelines/hoat-hinh-ai/README.md';

                return `
              <div id="raw-mission-control" style="background:#111827; border:1px solid #3b82f6; border-radius:1rem; padding:1.25rem; display:flex; flex-direction:column; gap:1.1rem; box-shadow:0 10px 35px -5px rgba(0,0,0,0.8); position:relative; flex-shrink:0;">
                <!-- Header Banner -->
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.6rem; border-bottom:1px solid #1f2937; padding-bottom:0.85rem;">
                  <div style="display:flex; align-items:center; gap:0.65rem;">
                    <div style="width:38px; height:38px; border-radius:0.6rem; background:linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(147,51,234,0.3) 100%); border:1px solid #3b82f6; display:flex; align-items:center; justify-content:center; font-size: 18px;">${ico('rocket', 20)}</div>
                    <div>
                      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <h4 style="font-size: 16px; font-weight: 700; color:#fff; margin:0;">Trạm Vũ Khí Tác Chiến & Phân Tích Đối Thủ (Production Mission Control)</h4>
                        ${statusBadgeHtml}
                      </div>
                      <p style="font-size: 12px; color:#94a3b8; margin:0.15rem 0 0 0;">Khuôn đúc kịch bản 3 hồi, visual directive đa thị trường, bao bì CTR & liên kết trực tiếp tài liệu SOP gốc (Nghiệm thu bấm máy kiểm soát tại video_acceptance.json)</p>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.45rem;">
                    <span style="font-size: 12px; color:#cbd5e1; background:#1e293b; border:1px solid #334155; padding:0.25rem 0.65rem; border-radius:0.4rem; font-weight:600;">
                      Thị trường mục tiêu: <strong class="c-sky">${esc(mp.primaryRegion || 'US & Global')}</strong>
                    </span>
                  </div>
                </div>

                <!-- Bento Grid 2 Columns -->
                <div class="raw-mission-bento" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:0.9rem;">
                  
                  <!-- Box 1: Chỉ Thị Phong Cách Thị Giác Biến Thể -->
                  <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.6rem;">
                    <div class="row-between">
                      <div style="font-size: 14px; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                        <span>${ico('palette', 14)}</span> Chỉ Thị Thị Giác (Visual Directive)
                      </div>
                      <div class="row-wrap">
                        <button type="button" class="btn-copy-visual-prompt" style="font-size: 12px; color:#38bdf8; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); padding:0.25rem 0.6rem; border-radius:0.4rem; cursor:pointer; font-weight:700;" class="hover:bg-sky-600 hover:text-white transition">${ico('clipboard-copy', 14)} Copy Master Shot</button>
                        <button type="button" class="btn-copy-visual-kit" style="font-size: 12px; color:#c084fc; background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.4); padding:0.25rem 0.6rem; border-radius:0.4rem; cursor:pointer; font-weight:700;" class="hover:bg-purple-600 hover:text-white transition">${ico('package', 14)} Copy Trọn Bộ Visual Kit</button>
                      </div>
                    </div>

                    <div style="font-size: 12px; color:#cbd5e1; background:#0f172a; padding:0.75rem 0.85rem; border-radius:0.5rem; border:1px solid #1e293b; display:flex; flex-direction:column; gap:0.5rem;">
                      <div><strong class="c-amber">STYLE_SHORT:</strong> <span class="c-ink">${esc(vd.styleShort || '')}</span></div>
                      <div><strong class="c-sky">MASCOT / BRAND:</strong> <span class="c-ink">${esc(vd.mascot || 'None')}</span></div>
                      <div><strong class="c-violet">CAMERA / LIGHT:</strong> <span class="c-slate-100">${esc(vd.cameraLighting || '')}</span></div>
                      <div style="font-size: 12px; color:#94a3b8; line-height:1.45;"><strong class="c-emerald">STYLE DETAILS:</strong> ${esc(vd.style || '')}</div>
                      
                      ${vd.masterVisualPrompt ? `
                      <div style="border-top:1px solid #1e293b; padding-top:0.4rem;">
                        <strong style="color:#38bdf8; font-size: 12px;">MASTER VISUAL PROMPT (SHOT 1 - MACRO RELIC):</strong>
                        <div style="margin-top:0.25rem; font-size: 11px; color:#e2e8f0; font-family:monospace; background:#070a12; border:1px solid #233148; border-radius:0.375rem; padding:0.45rem 0.6rem; line-height:1.45; word-break:break-word;">
                          ${esc(vd.masterVisualPrompt)}
                        </div>
                      </div>` : ''}

                      ${vd.multiAngleArchetypes && vd.multiAngleArchetypes.length ? `
                      <div style="border-top:1px solid #1e293b; padding-top:0.4rem;">
                        <strong style="color:#a855f7; font-size: 12px;">4 CẢNH QUAY CỐT LÕI (MULTI-ANGLE ARCHETYPES):</strong>
                        <div style="margin-top:0.25rem; display:flex; flex-direction:column; gap:0.35rem; max-height:140px; overflow-y:auto; padding-right:0.25rem;">
                          ${vd.multiAngleArchetypes.map(a => `
                          <div style="background:#070a12; border:1px solid #1e293b; border-radius:0.375rem; padding:0.35rem 0.5rem; font-size: 11px;">
                            <span style="color:#fcd34d; font-weight:700;">${esc(a.shotType)}:</span> <span class="c-slate-400">${esc(a.description)}</span>
                          </div>`).join('')}
                        </div>
                      </div>` : ''}

                      ${vd.cameraMotionSOP && vd.cameraMotionSOP.length ? `
                      <div style="border-top:1px solid #1e293b; padding-top:0.4rem; font-size: 11px; color:#94a3b8;">
                        <strong class="c-emerald">CHỈ THỊ MOTION VIDEO AI (KLING / RUNWAY):</strong>
                        <ul style="margin:0.2rem 0 0 1rem; padding:0; line-height:1.4;">
                          ${vd.cameraMotionSOP.map(m => `<li class="c-slate-300">${esc(m)}</li>`).join('')}
                        </ul>
                      </div>` : ''}

                      ${vd.negativePrompt ? `<div style="font-size: 12px; color:#fca5a5; line-height:1.35; background:rgba(239,68,68,0.08); padding:0.35rem 0.5rem; border-radius:0.35rem; border:1px solid rgba(239,68,68,0.2);"><strong style="color:#ef4444;">NEGATIVE PROMPT:</strong> ${esc(vd.negativePrompt)}</div>` : ''}
                    </div>
                  </div>

                  <!-- Box 2: Khuôn Đúc Kịch Bản & Hook 3s-15s (Chuẩn North Effect 70/30) -->
                  <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.65rem;">
                    <div class="row-between">
                      <div style="font-size: 14px; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                        <span>${ico('file-edit', 14)}</span> Khuôn Đúc Kịch Bản (Script Blueprint)
                      </div>
                      <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                        <button type="button" class="btn-open-video-sub" data-dossier="${esc(dossierPath)}" data-vid="${esc(refVid)}" data-title="${esc(refTitle)}" data-channel="${esc(pData.title || ch.title || '')}" data-views="${esc(refViews)}" style="font-size: 11px; color:#38bdf8; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); padding:0.25rem 0.55rem; border-radius:0.4rem; cursor:pointer; font-weight:700;">${ico('scroll-text', 14)} Kịch Bản Gốc (${esc(refVid ? refVid.slice(0,6) : 'Sub')})</button>
                        <a href="${esc(sb.northEffectSopPath || 'docs/NOI-BO/prompt/north-effect.md')}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; padding:0.25rem 0.55rem; border-radius:0.4rem; background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.4); color:#e9d5ff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;" class="hover:bg-purple-600 hover:text-white transition">
                          <span>${ico('file-text', 14)} SOP North Effect</span> ${ico('arrow-up-right', 14)}
                        </a>
                        <button type="button" class="btn-copy-master-prompt" style="font-size: 12px; color:#34d399; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.5); padding:0.25rem 0.6rem; border-radius:0.4rem; cursor:pointer; font-weight:700;" class="hover:bg-emerald-600 hover:text-white transition">${ico('clipboard-copy', 14)} Copy Full Master Prompt</button>
                      </div>
                    </div>

                    <div style="font-size: 12px; color:#cbd5e1; background:#0f172a; padding:0.75rem 0.85rem; border-radius:0.5rem; border:1px solid #1e293b; display:flex; flex-direction:column; gap:0.45rem;">
                      <div><strong class="c-amber">HOOK 0–15s:</strong> <span class="c-ink">${esc(sb.hookArchetype || '')}</span></div>
                      <div style="font-size: 12px; color:#94a3b8; font-style:italic; line-height:1.4;">"${esc(sb.openingFormula || '')}"</div>
                      <div style="font-size: 12px; color:#38bdf8; line-height:1.45;"><strong class="c-sky">NHỊP PACING:</strong> ${esc(sb.pacingStructure || '')}</div>
                      
                      <!-- Chi Tiết Công Thức North Effect 70/30 -->
                      <div style="border-top:1px solid #1e293b; padding-top:0.45rem; display:flex; flex-direction:column; gap:0.35rem;">
                        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.3rem;">
                          <span style="font-size: 12px; font-weight:700; color:#34d399; display:flex; align-items:center; gap:0.3rem;">
                            <span>${ico('zap', 14)}</span> Công Thức North Effect (70/30 Part-by-Part SOP):
                          </span>
                          <span style="font-size: 11px; color:#94a3b8; background:#1e293b; padding:0.1rem 0.4rem; border-radius:0.25rem;">
                            10–15 Parts · 1000–1100 từ/Part · Lệnh "CONTINUE"
                          </span>
                        </div>
                        <div style="font-size: 11px; color:#94a3b8; line-height:1.4;">
                          ${esc(sb.masterScriptPromptShort || 'Giữ 70% mạch kịch bản & dẫn chứng gốc của đối thủ; Bổ sung 30% góc nhìn, bối cảnh lịch sử và phản biện học thuật mới. Chia Part viết nối tiếp để không bị giới hạn token.')}
                        </div>
                        
                        <!-- Box Prompt Đầy Đủ Có Thể Cuộn & Đọc Trực Tiếp -->
                        ${sb.masterScriptPrompt ? `
                        <div style="position:relative; margin-top:0.3rem;">
                          <pre style="margin:0; max-height:140px; overflow-y:auto; background:#070a12; border:1px solid #233148; border-radius:0.375rem; padding:0.6rem 0.75rem; font-size: 11px; color:#e2e8f0; font-family:monospace; white-space:pre-wrap; word-break:break-word; line-height:1.45;">${esc(sb.masterScriptPrompt)}</pre>
                          <div style="position:absolute; top:0.35rem; right:0.5rem; font-size: 11px; color:#64748b; background:rgba(15,23,42,0.85); padding:0.1rem 0.35rem; border-radius:0.25rem; pointer-events:none;">Full Training Prompt</div>
                        </div>` : ''}
                      </div>
                    </div>
                  </div>

                  <!-- Box 3: Chiến Lược Bao Bì CTR (Title + Thumbnail) -->
                  <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.6rem;">
                    <div class="row-between">
                      <div style="font-size: 14px; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                        <span>${ico('target', 14)}</span> Bao Bì CTR (Title & Thumbnail)
                      </div>
                      <div class="row-wrap">
                        <button type="button" class="btn-copy-thumb-prompt" style="font-size: 12px; color:#f59e0b; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.4); padding:0.25rem 0.6rem; border-radius:0.4rem; cursor:pointer; font-weight:700;" class="hover:bg-amber-600 hover:text-white transition">${ico('clipboard-copy', 14)} Copy AI Image Prompt</button>
                        <button type="button" class="btn-copy-full-packaging" style="font-size: 12px; color:#f43f5e; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.4); padding:0.25rem 0.6rem; border-radius:0.4rem; cursor:pointer; font-weight:700;" class="hover:bg-rose-600 hover:text-white transition">${ico('package', 14)} Copy Trọn Bộ Bao Bì CTR</button>
                      </div>
                    </div>

                    <div style="font-size: 12px; color:#cbd5e1; background:#0f172a; padding:0.75rem 0.85rem; border-radius:0.5rem; border:1px solid #1e293b; display:flex; flex-direction:column; gap:0.5rem;">
                      <div><strong class="c-amber">TITLE FORMULA:</strong> <code style="color:#38bdf8; font-family:monospace; background:#1e293b; padding:0.1rem 0.4rem; border-radius:0.25rem;">${esc(pkg.titleFormula || '')}</code></div>
                      <div><strong class="c-violet">THUMB BỐ CỤC:</strong> <span class="c-ink">${esc(pkg.thumbnailComposition || '')}</span></div>
                      ${pkg.thumbnailText ? `<div><strong style="color:#ef4444;">TEXT OVERLAY:</strong> <span style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.35); padding:0.15rem 0.5rem; border-radius:0.35rem; font-weight: 700; color:#fef08a;">${esc(pkg.thumbnailText)}</span></div>` : ''}
                      ${pkg.cleanThumbnailPrompt ? `
                      <div style="border-top:1px solid #1e293b; padding-top:0.4rem;">
                        <strong style="color:#38bdf8; font-size: 12px;">AI THUMBNAIL PROMPT (NANO BANANA PRO / FLUX.2 PRO):</strong>
                        <div style="margin-top:0.25rem; font-size: 11px; color:#e2e8f0; font-family:monospace; background:#070a12; border:1px solid #233148; border-radius:0.375rem; padding:0.45rem 0.6rem; line-height:1.45; word-break:break-word;">
                          ${esc(pkg.cleanThumbnailPrompt)}
                        </div>
                      </div>` : ''}
                      ${pkg.exampleTitles && pkg.exampleTitles.length ? `
                      <div style="border-top:1px solid #1e293b; padding-top:0.35rem; font-size: 12px; color:#94a3b8;">
                        <strong class="c-emerald">Ví dụ Tiêu đề mẫu từ kênh:</strong>
                        <ul style="margin:0.2rem 0 0 1rem; padding:0; line-height:1.4;">
                          ${pkg.exampleTitles.map(t => `<li class="c-slate-300">${esc(t)}</li>`).join('')}
                        </ul>
                      </div>` : ''}
                    </div>
                  </div>

                  <!-- Box 4: Bộ Tool Stack & Matching Skill Dự Án -->
                  <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.6rem;">
                    <div class="row-between">
                      <div style="font-size: 14px; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                        <span>${ico('wrench', 14)}</span> Tech Stack & Matching Skill
                      </div>
                      ${ps.matchingSkill ? `
                      <span style="font-size: 12px; color:#c084fc; background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.5); padding:0.2rem 0.6rem; border-radius:0.4rem; font-weight: 700;">
                        Skill: ${esc(ps.matchingSkill)}
                      </span>` : ''}
                    </div>

                    <div style="font-size: 12px; color:#cbd5e1; background:#0f172a; padding:0.75rem 0.85rem; border-radius:0.5rem; border:1px solid #1e293b; display:flex; flex-direction:column; gap:0.45rem;">
                      <div><strong class="c-sky">Kịch bản:</strong> <span class="c-ink">${esc(ps.scriptTool || 'Gemini 3.8 Flash / Claude Sonnet 4.6')}</span></div>
                      <div><strong class="c-amber">Lồng tiếng:</strong> <span class="c-ink">${esc(ps.voiceTool || 'ElevenLabs v3 / Kokoro-82M')}</span></div>
                      <div><strong class="c-violet">Dựng video:</strong> <span class="c-ink">${esc(ps.videoTool || 'Nano Banana 2/Pro + Veo 3.1 / CapCut PC')}</span></div>
                      <div><strong class="c-emerald">Nhạc nền BGM:</strong> <span class="c-ink">${esc(ps.bgmSoundtrack || 'Ancient Historical Ambient (Ducking -20dB)')}</span></div>
                      <div><strong style="color:#f43f5e;">Hiệu ứng SFX:</strong> <span class="c-ink">${esc(ps.soundEffects || 'Whoosh, Shovel strike, Cavern wind')}</span></div>
                      
                      <!-- Direct Links to Skill and Repo -->
                      <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.4rem; pt-1; border-top:1px solid #1e293b; flex-wrap:wrap;">
                        <a href="${esc(sopPath)}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; padding:0.3rem 0.65rem; border-radius:0.4rem; background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.5); color:#e9d5ff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:0.3rem;" class="hover:bg-purple-600 hover:text-white transition">
                          <span>${ico('file-text', 14)} Xem Toàn Bộ SOP Skill Gốc</span> ${ico('arrow-up-right', 14)}
                        </a>
                        <a href="${esc(repoPath)}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; padding:0.3rem 0.65rem; border-radius:0.4rem; background:#1e293b; border:1px solid #334155; color:#cbd5e1; text-decoration:none; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem;" class="hover:text-white hover:bg-slate-700 transition">
                          <span>${ico('folder-open', 14)} Repo Code</span> ${ico('arrow-up-right', 14)}
                        </a>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- Box 5: Lộ Trình 5 Bước Ra Kênh Thực Chiến Chuẩn Zoom A-Z -->
                ${lp && lp.length ? `
                <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; padding:1rem;">
                  <div style="font-size: 14px; font-weight:700; color:#fff; margin-bottom:0.65rem; display:flex; align-items:center; gap:0.4rem;">
                    <span>${ico('zap', 14)}</span> Lộ Trình 5 Bước Khởi Động Kênh Thực Chiến (Chuẩn Zoom A–Z Masterclass)
                  </div>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.65rem;">
                    ${lp.map(s => `
                    <div style="background:#0f172a; border:1px solid #1e293b; border-radius:0.5rem; padding:0.65rem 0.8rem; display:flex; flex-direction:column; gap:0.3rem;">
                      <div class="row-wrap">
                        <span style="font-size: 11px; font-weight: 700; background:#2563eb; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:monospace; flex-shrink:0;">${s.step}</span>
                        <strong style="font-size: 12px; color:#fcd34d;">${esc(s.title)}</strong>
                      </div>
                      <p style="font-size: 12px; color:#94a3b8; margin:0; line-height:1.45;">${esc(s.detail)}</p>
                    </div>`).join('')}
                  </div>
                </div>` : ''}

              </div>`;
              })() : `
              <div style="background:#0f172a; border:1px solid #1e293b; border-radius:1rem; padding:2.5rem 1.25rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; box-shadow:0 4px 20px rgba(0,0,0,0.4);">
                <div style="width:52px; height:52px; border-radius:1rem; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); display:flex; align-items:center; justify-content:center; font-size: 24px;">${ico('rocket', 24)}</div>
                <div style="max-width:520px;">
                  <h4 style="font-size: 14px; font-weight:700; color:#f8fafc; margin:0 0 0.45rem 0;">Hồ Sơ Vũ Khí Tác Chiến Đang Trong Hàng Đợi Chuẩn Hóa</h4>
                  <p style="font-size: 12px; color:#94a3b8; line-height:1.55; margin:0;">
                    Kênh <strong class="c-slate-100">${esc(pData.title || ch.title || r.id)}</strong> đã hoàn tất bóc tách dữ liệu Reverse-Engineering (Voice DNA, Top Video, Lịch sử tăng trưởng). Kịch bản phân cảnh 3 hồi và bộ Visual Prompt Master đang được tổng hợp tự động qua router trung tâm.
                  </p>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.55rem; justify-content:center; margin-top:0.25rem;">
                  <button type="button" data-action="raw-tab" data-tab="voice" style="padding:0.45rem 0.95rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size: 12px; font-weight:600; cursor:pointer;" class="hover:text-white transition">${ico('mic', 14)} Khai thác Voice DNA Studio →</button>
                  <button type="button" data-action="raw-tab" data-tab="videos" style="padding:0.45rem 0.95rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#a855f7; font-size: 12px; font-weight:600; cursor:pointer;" class="hover:text-white transition">${ico('tv', 14)} Xem Top 7-10 Video Live →</button>
                </div>
              </div>`}
              </div> <!-- End Tab Panel 2: Mission Control -->

              <!-- Tab Panel 3: Voice DNA & Video Demo -->
              <div id="raw-panel-voice" class="raw-tab-panel" style="display:none; flex-direction:column; gap:1.25rem;">
              <!-- Section: Video Demo Mẫu Đại Diện Tuyến Nội Dung Kênh (Featured Showcase) -->
              ${demoVid && demoVid.videoId ? `
              <div id="raw-demo-video" style="background:#0b1120; border:1px solid #1e293b; border-radius:1rem; padding:1.1rem; display:flex; flex-direction:column; gap:0.75rem; box-shadow:0 4px 25px -4px rgba(0,0,0,0.6);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; border-bottom:1px solid #1e293b; padding-bottom:0.6rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-size: 18px; display:inline-flex;">${ico('clapperboard', 20)}</span>
                    <div>
                      <div class="row-wrap">
                        <h4 style="font-size: 14px; font-weight: 700; color:#fff; margin:0;">Video Demo Mẫu Đại Diện Tuyến Nội Dung</h4>
                        <span style="font-size: 11px; font-weight:700; padding:0.12rem 0.5rem; border-radius:0.375rem; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; display:inline-flex; align-items:center; gap:0.25rem;">
                          ${ico('flame', 14)} Tuyến Gần Nhất & Nổi Bật Nhất
                        </span>
                      </div>
                      <p style="font-size: 12px; color:#94a3b8; margin:0.15rem 0 0 0;">Xem trực tiếp tại đây để nắm bắt nhịp dựng, phong cách visual, hook 3s đầu và format kịch bản — không cần chuyển tab sang YouTube</p>
                    </div>
                  </div>
                  <div class="row-wrap">
                    <a href="https://www.youtube.com/watch?v=${demoVid.videoId}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; padding:0.35rem 0.75rem; border-radius:0.5rem; background:#1e293b; color:#38bdf8; text-decoration:none; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem; border:1px solid #334155;">
                      <span>${ico('arrow-up-right', 14)} Mở YouTube</span>
                    </a>
                    <button type="button" class="btn-open-video-sub" data-dossier="${esc(dossierPath)}" data-vid="${esc(demoVid.videoId)}" data-title="${esc(demoVid.title)}" data-channel="${esc(pData.title || ch.title || '')}" data-views="${esc(formatNum(demoVid.views))}" style="font-size: 12px; padding:0.35rem 0.75rem; border-radius:0.5rem; background:rgba(99,102,241,0.2); color:#a5b4fc; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem; border:1px solid rgba(99,102,241,0.4); cursor:pointer;">
                      <span>${ico('scroll-text', 14)} Xem Sub & Kịch Bản AI</span>
                    </button>
                  </div>
                </div>

                <!-- Facade Player Container (Lazy Load YouTube Embed - 0 MB disk, 0ms delay) -->
                <div id="demo-video-player-${rawId}" style="position:relative; width:100%; aspect-ratio:16/9; background:#000; border-radius:0.75rem; overflow:hidden; border:1px solid #1e293b; box-shadow:0 8px 30px rgba(0,0,0,0.7);">
                  <img src="https://i.ytimg.com/vi/${demoVid.videoId}/hqdefault.jpg" alt="${esc(demoVid.title)}" width="480" height="360" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover; filter:brightness(0.85);">
                  <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.5) 100%); display:flex; flex-direction:column; justify-content:space-between; padding:0.85rem 1rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                      <span style="font-size: 12px; font-weight:700; color:#fff; background:rgba(0,0,0,0.75); padding:0.25rem 0.6rem; border-radius:0.375rem; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.15); line-clamp:1;" class="line-clamp-1">
                        ${esc(demoVid.title)}
                      </span>
                      ${demoVid.duration ? `<span style="font-size: 12px; font-weight:700; color:#fff; background:rgba(0,0,0,0.85); padding:0.2rem 0.5rem; border-radius:0.375rem;">${formatDuration(demoVid.duration)}</span>` : ''}
                    </div>

                    <!-- Center Big Play Button -->
                    <button type="button" class="js-play-demo" data-container="demo-video-player-${rawId}" data-vid="${esc(demoVid.videoId)}" style="align-self:center; width:64px; height:64px; border-radius:50%; background:rgba(239,68,68,0.95); border:3px solid #fff; color:#fff; display:flex; align-items:center; justify-content:center; font-size: 24px; cursor:pointer; box-shadow:0 0 30px rgba(239,68,68,0.8); transition:all 0.2s;" title="Bấm để phát video trực tiếp tại đây">
                      <span style="margin-left:4px; display:inline-flex;">${ico('play', 24)}</span>
                    </button>

                    <!-- Bottom Info Strip -->
                    <div style="display:flex; align-items:center; justify-content:space-between; font-size: 12px; color:#e2e8f0; background:rgba(0,0,0,0.65); padding:0.35rem 0.75rem; border-radius:0.5rem; backdrop-filter:blur(4px);">
                      <span class="inline-flex items-center gap-1">${ico('eye', 14)} <strong class="c-sky">${formatNum(demoVid.views)}</strong> views</span>
                      ${demoVid.vph != null ? `<span class="inline-flex items-center gap-1">${ico('zap', 14)} <strong class="c-amber-500">${Math.round(demoVid.vph)}</strong> VPH</span>` : ''}
                      <span class="inline-flex items-center gap-1">${ico('calendar', 14)} Xuất bản: ${demoVid.publishedAt ? demoVid.publishedAt.slice(0, 10) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>` : ''}

              <!-- Section: Mẫu Giọng Chuẩn Của Kênh & Gợi Ý Clone Voice (Voice DNA Studio) -->
              ${voiceProfile ? (() => {
                const rawAudioSrc = (voiceProfile.audioSpecs ? voiceProfile.audioSpecs.publicUrl : ('assets/voice-samples/' + rawId + '.mp3'));
                const cacheBustAudioSrc = rawAudioSrc + '?v=' + encodeURIComponent(rawId + '-45s');
                return `
              <div id="raw-voice-dna" style="background:#0f172a; border:1px solid #1e293b; border-radius:1rem; padding:1.25rem; display:flex; flex-direction:column; gap:0.9rem; box-shadow:0 4px 20px -2px rgba(0,0,0,0.5);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; border-bottom:1px solid #1e293b; padding-bottom:0.75rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-size: 18px; display:inline-flex;">${ico('mic', 20)}</span>
                    <div>
                      <div class="row-wrap">
                        <h4 style="font-size: 14px; font-weight: 700; color:#fff; margin:0;">Mẫu Giọng Chuẩn Của Kênh (Voice DNA Studio)</h4>
                        ${(voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageFlag) ? `
                        <span style="font-size: 11px; font-weight:700; padding:0.12rem 0.5rem; border-radius:0.375rem; background:rgba(14,165,233,0.2); border:1px solid rgba(14,165,233,0.4); color:#38bdf8; display:inline-flex; align-items:center; gap:0.25rem;">
                          ${esc(voiceProfile.voiceCharacteristics.languageFlag)} ${esc(voiceProfile.voiceCharacteristics.audioLanguage || '')}
                        </span>` : ''}
                      </div>
                      <p style="font-size: 12px; color:#94a3b8; margin:0;">${voiceProfile.sourceVideo ? voiceProfile.sourceVideo.timeWindow : '45s'} • MP3 Mono 44.1kHz • Chuẩn hóa EBU R128 (-16 LUFS)</p>
                    </div>
                  </div>
                  <a href="${esc(cacheBustAudioSrc)}" download="${esc(rawId)}_voice_sample.mp3" style="font-size: 12px; padding:0.4rem 0.85rem; border-radius:0.5rem; background:#2563eb; color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:0.35rem; transition:background 0.2s;">${ico('download', 14)} Tải MP3 Clone Voice</a>
                </div>

                <!-- Audio Player -->
                <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.75rem; padding:0.6rem 0.75rem;">
                  <audio controls preload="none" style="width:100%; height:38px; border-radius:0.375rem; outline:none;" src="${esc(cacheBustAudioSrc)}"></audio>
                </div>

                <!-- Voice DNA Characteristics Grid -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.65rem; font-size: 13px;">
                  <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.625rem; padding:0.75rem 0.85rem;">
                    <div style="color:#94a3b8; font-size: 11px; text-transform:uppercase; font-weight:600;">Đặc tính giọng</div>
                    <div style="color:#38bdf8; font-weight:700; margin-top:0.2rem;">${esc(voiceProfile.voiceCharacteristics.genderEstimate)}</div>
                    <div style="color:#94a3b8; font-size: 12px; margin-top:0.15rem;">Độ tuổi: <span class="c-slate-100">${esc(voiceProfile.voiceCharacteristics.ageRange || 'Chưa rõ')}</span></div>
                  </div>
                  <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.625rem; padding:0.75rem 0.85rem;">
                    <div style="color:#94a3b8; font-size: 11px; text-transform:uppercase; font-weight:600;">Ngôn ngữ giọng đọc</div>
                    <div style="color:#38bdf8; font-weight:700; margin-top:0.2rem; display:flex; align-items:center; gap:0.35rem;">
                      <span>${esc((voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageFlag) || '')}${(voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageFlag) ? '' : ico('globe', 14)}</span>
                      <span>${esc((voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.audioLanguage) || 'Tiếng Anh')}</span>
                    </div>
                    <div style="color:#94a3b8; font-size: 12px; margin-top:0.15rem;">Phương ngữ: <span class="c-slate-100">${esc((voiceProfile.voiceCharacteristics && voiceProfile.voiceCharacteristics.languageDialect) || 'Standard')}</span></div>
                  </div>
                  <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.625rem; padding:0.75rem 0.85rem;">
                    <div style="color:#94a3b8; font-size: 11px; text-transform:uppercase; font-weight:600;">Tốc độ nói thực tế (WPM)</div>
                    <div style="color:#f59e0b; font-weight:700; margin-top:0.2rem;">${esc(voiceProfile.voiceCharacteristics.actualPaceWPM || voiceProfile.voiceCharacteristics.estimatedPace)}</div>
                  </div>
                  <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.625rem; padding:0.75rem 0.85rem; grid-column: 1 / -1;">
                    <div style="color:#94a3b8; font-size: 11px; text-transform:uppercase; font-weight:600;">Tông giọng & Cảm xúc</div>
                    <div style="color:#10b981; font-weight:700; margin-top:0.2rem;">${esc(voiceProfile.voiceCharacteristics.toneAndStyle)}</div>
                    ${voiceProfile.voiceCharacteristics.targetAudience ? `<div style="color:#94a3b8; font-size: 12px; margin-top:0.2rem;">Khán giả mục tiêu: <span class="c-slate-300">${esc(voiceProfile.voiceCharacteristics.targetAudience)}</span></div>` : ''}
                  </div>
                </div>

                <!-- Section: Scene & Sample Context (Chuẩn Hóa Cho Google AI Studio / Gemini Speech / ElevenLabs) -->
                ${voiceProfile.promptingStudio ? `
                <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
                  <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                    <div style="font-size: 14px; font-weight: 700; color:#38bdf8; display:flex; align-items:center; gap:0.4rem;">
                      <span>${ico('clapperboard', 14)}</span> Scene & Sample Context (Chuẩn Google AI Studio / Gemini Speech / Aoede):
                    </div>
                    <button type="button" class="btn-copy-combined-prompt" style="font-size: 12px; padding:0.35rem 0.75rem; border-radius:0.375rem; background:#0284c7; hover:background:#0369a1; color:#fff; font-weight:700; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem; transition:background 0.2s;">${ico('clipboard-copy', 14)} Copy Trọn Bộ (Scene + Context + Speech)</button>
                  </div>

                  <!-- Scene Field -->
                  <div class="col-gap-xs">
                    <div class="row-between-tight">
                      <span style="font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.3rem;">
                        <span class="c-sky">Scene</span> <span style="color:#94a3b8; font-weight:400;">(Bối cảnh & Không gian âm học)</span>
                      </span>
                      <button type="button" class="btn-copy-scene" style="font-size: 11px; color:#38bdf8; background:none; border:none; cursor:pointer; text-decoration:underline;">${ico('clipboard-copy', 14)} Copy Scene</button>
                    </div>
                    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:0.5rem; padding:0.55rem 0.75rem; font-size: 12px; color:#f1f5f9; font-family:monospace; line-height:1.45;">${esc(voiceProfile.promptingStudio.scene)}</div>
                  </div>

                  <!-- Sample Context Field -->
                  <div class="col-gap-xs">
                    <div class="row-between-tight">
                      <span style="font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.3rem;">
                        <span class="c-amber-500">Sample Context</span> <span style="color:#94a3b8; font-weight:400;">(Ngữ cảnh biểu cảm & Giọng điệu)</span>
                      </span>
                      <button type="button" class="btn-copy-context" style="font-size: 11px; color:#f59e0b; background:none; border:none; cursor:pointer; text-decoration:underline;">${ico('clipboard-copy', 14)} Copy Context</button>
                    </div>
                    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:0.5rem; padding:0.55rem 0.75rem; font-size: 12px; color:#fef3c7; font-family:monospace; line-height:1.45;">${esc(voiceProfile.promptingStudio.sampleContext)}</div>
                  </div>

                  <!-- Speaker & Sample Speech Block Field -->
                  ${voiceProfile.promptingStudio.sampleSpeechBlock ? `
                  <div class="col-gap-xs">
                    <div class="row-between-tight">
                      <span style="font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.3rem;">
                        <span>${ico('user', 14)}</span> <span class="c-green">${esc(voiceProfile.promptingStudio.speakerTag || 'Speaker 1')}</span> <span style="color:#94a3b8; font-weight:400;">(Đoạn thoại mẫu đối soát)</span>
                      </span>
                      <button type="button" class="btn-copy-speech-block" style="font-size: 11px; color:#10b981; background:none; border:none; cursor:pointer; text-decoration:underline;">${ico('clipboard-copy', 14)} Copy Speech Block</button>
                    </div>
                    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:0.5rem; padding:0.6rem 0.75rem; font-size: 12px; color:#cbd5e1; line-height:1.5; font-style:italic;">"${esc(voiceProfile.promptingStudio.sampleSpeechBlock)}"</div>
                  </div>` : ''}
                </div>` : ''}

                <!-- ElevenLabs Voice Cloning Configuration -->
                ${voiceProfile.elevenlabsCloningConfiguration ? `
                <div style="background:#131d31; border:1px solid rgba(168,85,247,0.3); border-radius:0.75rem; padding:0.85rem 1rem; display:flex; flex-direction:column; gap:0.6rem;">
                  <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                    <div style="font-size: 13px; font-weight:700; color:#c084fc; display:flex; align-items:center; gap:0.35rem;">
                      <span>${ico('zap', 14)}</span> Cấu Hình Clone Voice Trên ElevenLabs:
                    </div>
                    <span style="font-size: 11px; background:rgba(168,85,247,0.15); color:#d8b4fe; padding:0.15rem 0.5rem; border-radius:0.375rem; border:1px solid rgba(168,85,247,0.3);">${esc(voiceProfile.elevenlabsCloningConfiguration.recommendedModel || 'Multilingual v2')}</span>
                  </div>

                  <div style="font-size: 13px; color:#e2e8f0; display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
                    <span>Giọng chuẩn gợi ý:</span>
                    <span style="background:#1e293b; color:#38bdf8; font-weight:700; padding:0.2rem 0.6rem; border-radius:0.375rem; border:1px solid #334155;">${esc(voiceProfile.elevenlabsCloningConfiguration.primaryVoiceMatch || '')}</span>
                    ${voiceProfile.elevenlabsCloningConfiguration.alternativeVoices ? voiceProfile.elevenlabsCloningConfiguration.alternativeVoices.map(av => `<span style="background:#1e293b; color:#94a3b8; font-size: 12px; padding:0.2rem 0.5rem; border-radius:0.375rem;">${esc(av)}</span>`).join('') : ''}
                  </div>

                  <!-- Voice Settings Chips -->
                  ${voiceProfile.elevenlabsCloningConfiguration.voiceSettings ? `
                  <div style="display:flex; flex-wrap:wrap; gap:0.5rem; font-size: 12px; color:#94a3b8; background:#0b0f19; padding:0.5rem 0.75rem; border-radius:0.5rem; border:1px solid #1e293b;">
                    <span>Settings:</span>
                    <span>Stability: <strong class="c-amber">${voiceProfile.elevenlabsCloningConfiguration.voiceSettings.stability}</strong></span>
                    <span>•</span>
                    <span>Similarity: <strong class="c-sky">${voiceProfile.elevenlabsCloningConfiguration.voiceSettings.similarity_boost}</strong></span>
                    <span>•</span>
                    <span>Style: <strong class="c-purple">${voiceProfile.elevenlabsCloningConfiguration.voiceSettings.style}</strong></span>
                    <span>•</span>
                    <span>Speaker Boost: <strong class="c-green">ON</strong></span>
                  </div>` : ''}

                  <!-- Voice Design Prompt -->
                  ${voiceProfile.elevenlabsCloningConfiguration.voiceDesignPrompt ? `
                  <div style="margin-top:0.25rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; font-size: 12px; color:#94a3b8; margin-bottom:0.25rem;">
                      <span>Voice Design Prompt (Dùng tạo giọng AI không cần clone):</span>
                      <button type="button" class="btn-copy-voice-design" style="font-size: 11px; color:#38bdf8; background:none; border:none; cursor:pointer; text-decoration:underline;">${ico('clipboard-copy', 14)} Copy Prompt</button>
                    </div>
                    <div style="background:#0b0f19; border:1px solid #1e293b; border-radius:0.5rem; padding:0.5rem 0.75rem; font-size: 12px; color:#cbd5e1; font-style:italic;">"${esc(voiceProfile.elevenlabsCloningConfiguration.voiceDesignPrompt)}"</div>
                  </div>` : ''}

                  <!-- Dubbing SOP -->
                  ${voiceProfile.elevenlabsCloningConfiguration.dubbingProductionSOP ? `
                  <div style="font-size: 12px; color:#fef3c7; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:0.5rem; padding:0.5rem 0.75rem;">
                    <strong class="c-amber">SOP Lồng tiếng chuẩn:</strong> ${esc(voiceProfile.elevenlabsCloningConfiguration.dubbingProductionSOP)}
                  </div>` : ''}
                </div>` : ''}

              </div>`;
              })() : ''}

              <!-- Section: Bộ Tags Kênh (Channel Tags) -->
              ${tags && tags.length ? `
              <div style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-size: 14px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.4rem;">
                    <span>${ico('tag', 14)}</span> Bộ Tags Kênh Đắt Giá (${tags.length} tags):
                  </div>
                  <button type="button" id="btn-copy-raw-tags" style="font-size: 12px; padding:0.3rem 0.75rem; border-radius:0.5rem; background:#374151; border:1px solid #4b5563; color:#e5e7eb; cursor:pointer; font-weight:600;">${ico('clipboard-copy', 14)} Sao chép tất cả Tags</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; max-height:160px; overflow-y:auto; padding-right:0.25rem;">
                  ${tags.map(t => `<span style="font-size: 12px; padding:0.25rem 0.6rem; border-radius:0.5rem; background:#1e293b; color:#cbd5e1; border:1px solid #334155;">#${esc(t)}</span>`).join('')}
                </div>
              </div>` : ''}
              </div> <!-- End Tab Panel 3: Voice DNA & Demo -->

              <!-- Tab Panel 4: Top Videos Live & Tiến Hóa Kênh -->
              <div id="raw-panel-videos" class="raw-tab-panel" style="display:none; flex-direction:column; gap:1.25rem;">
              <!-- Section: Top Videos Đột Phá Triệu View -->
              <div id="raw-top-videos" style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-size: 14px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.4rem;">
                    <span>${ico('flame', 14)}</span> Top Video Đang Phát Trên YouTube (YouTube Live - ${tvList.length} video):
                  </div>
                  <span style="font-size: 11px; color:#38bdf8; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:0.15rem 0.5rem; border-radius:0.375rem; font-weight:600;">Sắp xếp: Cao nhất đến thấp nhất (Most Viewed)</span>
                </div>
                <p style="font-size: 12px; color:#94a3b8; margin:0 0 0.85rem 0;">100% video dưới đây đang hoạt động thực tế trên YouTube, có đầy đủ Sub song ngữ 1:1, timestamps và phân tích kịch bản Voice AI.</p>
                ${tvList.length ? `
                <div class="raw-top-videos-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.85rem;">
                  ${tvList.map((v, i) => {
                    const displayRank = v.displayRank || (i + 1);
                    const sourceRank = v.sourceRank || v.rank || '';
                    return `
                    <div style="background:#182234; border:1px solid #233148; border-radius:0.75rem; overflow:hidden; display:flex; flex-direction:column; transition:all 0.2s;" class="hover:border-slate-500">
                      <!-- Compact Thumbnail Container with Play Trigger -->
                      <div class="js-quick-video group relative block bg-black overflow-hidden cursor-pointer" data-vid="${esc(v.videoId)}" data-title="${esc(v.title)}" data-channel="${esc(pData.title || ch.title || '')}" data-badge="#${displayRank} Top Video" style="aspect-ratio:16/9;" title="Bấm để phát video trực tiếp (${esc(v.title)})">
                        <img src="${esc(v.thumbnail || ('https://i.ytimg.com/vi/' + v.videoId + '/mqdefault.jpg'))}" alt="${esc(v.title)}" width="320" height="180" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s;" class="group-hover:scale-105">
                        
                        <!-- Rank Badge -->
                        <span style="position:absolute; top:0.35rem; left:0.35rem; background:rgba(0,0,0,0.8); color:#fff; font-size: 11px; font-weight:700; padding:0.15rem 0.4rem; border-radius:0.25rem; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.15); z-index:2;" title="Display Rank theo views giảm dần${sourceRank ? ' · Source Rank gốc: #' + sourceRank : ''}">#${displayRank}</span>
                        
                        <!-- Mini Open YouTube Icon Link -->
                        <a href="${esc(v.url || ('https://www.youtube.com/watch?v=' + v.videoId))}" target="_blank" rel="noopener noreferrer" class="js-stop-prop hover:text-white hover:bg-red-600 transition-colors" style="position:absolute; top:0.35rem; right:0.35rem; background:rgba(0,0,0,0.75); color:#94a3b8; font-size: 11px; font-weight:600; padding:0.15rem 0.4rem; border-radius:0.25rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.2rem; border:1px solid rgba(255,255,255,0.1); z-index:2;" title="Mở tab YouTube ngoài">
                          <span>${ico('arrow-up-right', 14)} YT</span>
                        </a>

                        <!-- Center Play Button (Sleek, Compact, Fast) -->
                        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.25); transition:background 0.2s;" class="group-hover:bg-black/40">
                          <div style="width:42px; height:42px; border-radius:50%; background:rgba(239,68,68,0.92); border:2px solid #fff; color:#fff; display:flex; align-items:center; justify-content:center; font-size: 18px; box-shadow:0 0 16px rgba(239,68,68,0.7); transition:all 0.2s;" class="group-hover:scale-110 group-hover:bg-red-600">
                            <span style="margin-left:3px; line-height:1; display:inline-flex;">${ico('play', 20)}</span>
                          </div>
                        </div>

                        <!-- Duration Badge -->
                        ${v.duration ? `<span style="position:absolute; bottom:0.35rem; right:0.35rem; background:rgba(0,0,0,0.85); color:#fff; font-size: 11px; font-weight:600; padding:0.15rem 0.4rem; border-radius:0.25rem; z-index:2;">${formatDuration(v.duration)}</span>` : ''}
                      </div>

                      <!-- Card Content -->
                      <div style="padding:0.75rem; display:flex; flex-direction:column; flex:1; gap:0.4rem;">
                        <div class="js-quick-video" style="cursor:pointer;" data-vid="${esc(v.videoId)}" data-title="${esc(v.title)}" data-channel="${esc(pData.title || ch.title || '')}" data-badge="#${displayRank} Top Video" title="Bấm để xem video">
                          <span style="font-size: 13px; font-weight:700; color:#fff; line-height:1.35;" class="line-clamp-2 hover:text-brand-300 transition-colors">${esc(v.title)}</span>
                        </div>

                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: 12px; color:#94a3b8; margin-top:auto; padding-top:0.2rem;">
                          <span class="inline-flex items-center gap-1">${ico('eye', 14)} <strong class="c-sky">${formatNum(v.views)}</strong> views</span>
                          ${v.vph != null ? `<span class="inline-flex items-center gap-1">${ico('zap', 14)} <strong class="c-amber-500">${Math.round(v.vph)}</strong> VPH</span>` : ''}
                          <span class="inline-flex items-center gap-1">${ico('calendar', 14)} ${v.publishedAt ? v.publishedAt.slice(0, 10) : ''}</span>
                        </div>
                        ${sourceRank ? `<div style="font-size: 11px; color:#64748b; background:#0f172a; border:1px solid #1e293b; border-radius:0.4rem; padding:0.2rem 0.35rem;">Display Rank: <b class="c-slate-100">#${displayRank}</b> · Source Rank gốc: <b style="color:#fbbf24;">#${sourceRank}</b></div>` : ''}

                        <!-- Unified Action Buttons: Xem Video (Cinema) + Mở YT + Xem Sub -->
                        <div style="display:grid; grid-template-columns:1fr auto; gap:0.35rem; margin-top:0.25rem;">
                          <button type="button" class="js-quick-video py-1.5 px-2.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/80 border border-rose-500/40 hover:border-rose-400 text-rose-200 hover:text-white font-semibold text-2xs flex items-center justify-center gap-1.5 transition cursor-pointer" data-vid="${esc(v.videoId)}" data-title="${esc(v.title)}" data-channel="${esc(pData.title || ch.title || '')}" data-badge="#${displayRank} Top Video" title="Phát video trực tiếp tại chỗ">
                            <span style="font-size: 12px; display:inline-flex;">${ico('play', 14)}</span> Xem Video
                          </button>
                          <a href="${esc(v.url || ('https://www.youtube.com/watch?v=' + v.videoId))}" target="_blank" rel="noopener noreferrer" style="padding:0.35rem 0.65rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#94a3b8; font-size:11px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:0.2rem;" class="hover:text-white hover:bg-slate-700 transition" title="Mở trên YouTube tab mới">
                            ${ico('arrow-up-right', 14)} YT
                          </a>
                        </div>

                        <button type="button" class="btn-open-video-sub w-full py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/70 border border-indigo-500/40 text-indigo-200 hover:text-white font-semibold text-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-dossier="${esc(dossierPath)}" data-vid="${esc(v.videoId)}" data-title="${esc(v.title)}" data-channel="${esc(pData.title || ch.title || '')}" data-views="${esc(formatNum(v.views))}">
                          <span>${ico('scroll-text', 14)} Xem Sub, Lời Thoại & Kịch Bản AI</span> →
                        </button>
                      </div>
                    </div>
                  `}).join('')}
                </div>` : `
                <div style="padding:1.5rem; text-align:center; color:#64748b; font-size: 14px;">
                  Đang đồng bộ danh sách Top Video của kênh này.
                </div>`}
              </div>

              <!-- Section: Tốc Độ Tăng Trưởng Thực Tế 7 Ngày Qua (vidIQ Live Velocity) -->
              ${vRec && vRec.length ? `
              <div style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-size: 14px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.4rem;">
                    <span>${ico('trending-up', 14)}</span> Tốc Độ Tăng Trưởng Thực Tế 7 Ngày Qua (vidIQ Live Velocity):
                  </div>
                  <span style="font-size: 11px; color:#10b981; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:0.15rem 0.5rem; border-radius:0.375rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">${ico('check', 14)} Live Verified API (${vRec[vRec.length - 1] ? (vRec[vRec.length - 1].videos + ' video hiện hành') : ''})</span>
                </div>
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; font-size: 12px; text-align:left;">
                    <thead>
                      <tr style="border-bottom:1px solid #334155; color:#94a3b8; text-transform:uppercase; font-size: 11px;">
                        <th style="padding:0.4rem 0.6rem;">Ngày theo dõi</th>
                        <th style="padding:0.4rem 0.6rem;">Lượng Subs</th>
                        <th style="padding:0.4rem 0.6rem;">Tổng Views</th>
                        <th style="padding:0.4rem 0.6rem;">Tăng trưởng Views/Ngày</th>
                        <th style="padding:0.4rem 0.6rem;">Số Video</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${vRec.map((row, idx) => {
                        const prevViews = idx > 0 ? vRec[idx - 1].views : null;
                        const diffViews = prevViews != null ? (row.views - prevViews) : null;
                        return `
                        <tr style="border-bottom:1px solid #1e293b; color:#cbd5e1;">
                          <td style="padding:0.45rem 0.6rem; font-family:monospace; color:#38bdf8;">${row.date}</td>
                          <td style="padding:0.45rem 0.6rem; font-weight:600;">${Number(row.subscribers).toLocaleString('vi-VN')}</td>
                          <td style="padding:0.45rem 0.6rem; font-weight:600; color:#a855f7;">${Number(row.views).toLocaleString('vi-VN')}</td>
                          <td style="padding:0.45rem 0.6rem;">
                            ${diffViews != null ? `<span style="color:#10b981; font-weight:700;">+${Number(diffViews).toLocaleString('vi-VN')}</span>` : `<span style="color:#64748b;">Mốc đầu</span>`}
                          </td>
                          <td style="padding:0.45rem 0.6rem; color:#94a3b8;">${row.videos}</td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>` : ''}

              <!-- Section: Chỉ Số Outlier Bóc Tách Từ Ảnh Chụp Gốc (OCR Vision Benchmark) -->
              ${ocr && ocr.videoRows && ocr.videoRows.length ? `
              <div style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1rem 1.1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-size: 14px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.4rem;">
                    <span>${ico('target', 14)}</span> Bóc Tách Đột Phá Outlier Từ Ảnh Chụp Màn Hình Gốc (OCR Vision Snapshot):
                  </div>
                  <span style="font-size: 11px; color:#f59e0b; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:0.15rem 0.5rem; border-radius:0.375rem; font-weight:600;">Snapshot Lúc Phát Hiện (${esc(ocr.scannedAt || '2026-09-05')})</span>
                </div>
                <div style="font-size: 12px; color:#94a3b8; margin-bottom:0.75rem; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:0.5rem; padding:0.5rem 0.75rem; line-height:1.45;">
                  ${ico('camera', 14)} <strong class="c-amber">Ngữ cảnh thời gian:</strong> Danh sách dưới đây được bóc tách từ ảnh raw gốc (<em>${esc(r.fileName || '')}</em>) lúc kênh mới bứt phá (${ocr.subsText ? ('Quy mô lúc chụp: ' + esc(ocr.subsText) + ' • ' + esc(ocr.videoCountText || '')) : 'Ảnh raw'}). Người chụp lúc đó dùng vidIQ Extension sắp xếp theo độ nổi tiếng (Sort by Popularity). Các video có thể đã được chủ kênh chuyển về Riêng tư hoặc đổi tiêu đề sau này.
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.6rem;">
                  ${ocr.videoRows.map(vr => `
                    <div style="background:#182234; border:1px solid #233148; border-radius:0.625rem; padding:0.65rem 0.8rem; display:flex; flex-direction:column; gap:0.35rem;">
                      <div style="font-size: 12px; font-weight:700; color:#fff; line-height:1.35;" class="line-clamp-2">${esc(vr.title)}</div>
                      <div style="display:flex; align-items:center; justify-content:space-between; font-size: 12px; color:#94a3b8; margin-top:auto; pt-1;">
                        <span class="inline-flex items-center gap-1">${ico('timer', 14)} ${esc(vr.duration || 'N/A')}</span>
                        <span class="inline-flex items-center gap-1">${ico('eye', 14)} <strong class="c-sky">${esc(vr.viewsText || '')}</strong></span>
                        <span style="background:rgba(239,68,68,0.2); color:#fca5a5; border:1px solid rgba(239,68,68,0.4); padding:0.1rem 0.4rem; border-radius:0.25rem; font-weight:700;">${esc(vr.outlier || '')}</span>
                      </div>
                      <div style="display:flex; align-items:center; justify-content:space-between; font-size: 11px; color:#64748b;">
                        <span class="inline-flex items-center gap-1">${ico('zap', 14)} ${esc(vr.vph || '')}</span>
                        <span class="inline-flex items-center gap-1">${ico('clock', 14)} ${esc(vr.age || '')}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Box: Đối Soát Tiến Hóa Kênh -->
                <div style="margin-top:0.85rem; background:#0f172a; border:1px solid #1e293b; border-radius:0.625rem; padding:0.75rem 0.9rem; font-size: 12px; color:#cbd5e1; line-height:1.5;">
                  <div style="font-weight:700; color:#38bdf8; display:flex; align-items:center; gap:0.35rem; margin-bottom:0.3rem;">
                    <span>${ico('lightbulb', 14)}</span> Đối Soát Tiến Hóa Kênh Giữa 2 Mốc Dữ Liệu (Timeline Evolution):
                  </div>
                  <div>
                    • <strong>Thời điểm Ảnh chụp raw (Lịch sử):</strong> Ghi nhận lúc kênh có <strong>${esc(ocr.subsText || 'N/A')}</strong> và <strong>${esc(ocr.videoCountText || 'N/A')}</strong> (chụp lúc video đạt chỉ số bứt phá >100x).<br>
                    • <strong>Thời điểm Hiện tại (YouTube Live):</strong> Kênh đạt <strong>${esc(subsDisplay)} subs</strong> và <strong>${esc(viewsDisplay)} views</strong> với <strong>${tvList.length} video</strong> đang hoạt động công khai.<br>
                    • <strong>Bài học chiến lược:</strong> Chủ kênh có xu hướng ẩn/xóa các video kém hiệu quả hoặc dính cờ bản quyền, dồn toàn bộ lượt xem vào các video lõi bùng nổ (như video Top #1 đạt ${tvList[0] ? formatNum(tvList[0].views) : 'triệu'} views).
                  </div>
                </div>

              </div>` : ''}

              <!-- Section: Phân Tích Nội Dung & Kỹ Thuật (Vision AI) -->
              ${vision.mainTopic || vision.contentStyle ? `
              <div style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1rem 1.1rem; font-size: 13px; color:#cbd5e1; display:flex; flex-direction:column; gap:0.5rem;">
                <div style="font-size: 14px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:0.4rem;">
                  <span>${ico('brain', 14)}</span> Bóc Tách Nội Dung & Phong Cách Sản Xuất (Vision AI):
                </div>
                ${vision.mainTopic ? `<div><strong class="c-amber">Chủ đề chính:</strong> ${esc(vision.mainTopic)}</div>` : ''}
                ${vision.contentStyle ? `<div><strong class="c-sky">Phong cách thể hiện:</strong> ${esc(vision.contentStyle)}</div>` : ''}
                ${vision.productionFormat ? `<div><strong class="c-purple">Định dạng sản xuất:</strong> ${esc(vision.productionFormat)}</div>` : ''}
                ${vision.audienceAge ? `<div><strong class="c-green">Tệp khán giả nhắm tới:</strong> ${esc(vision.audienceAge)}</div>` : ''}
              </div>` : ''}
              </div> <!-- End Tab Panel 4: Top Videos -->

            </div>
          </div>
        `;

        function copyWithFallback(text, btn, successLabel, defaultLabel) {
          function markSuccess() {
            if (btn) {
              /* PHASE 3: textContent KHONG nhan HTML => nhan trang thai phai la CHU THUAN, khong emoji. */
              btn.textContent = successLabel || 'Đã sao chép!';
              setTimeout(() => { btn.textContent = defaultLabel || 'Sao chép'; }, 2000);
            }
          }
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(markSuccess).catch(() => fallback());
          } else {
            fallback();
          }
          function fallback() {
            try {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.left = '-9999px';
              ta.style.top = '-9999px';
              ta.setAttribute('readonly', '');
              document.body.appendChild(ta);
              ta.focus();
              ta.select();
              const ok = document.execCommand('copy');
              document.body.removeChild(ta);
              if (ok) markSuccess();
              else alert('Không thể tự động sao chép. Vui lòng chọn và sao chép thủ công!');
            } catch(e) {
              console.error('Fallback copy error:', e);
            }
          }
        }

        // Bind copy buttons for Production Mission Control
        if (productionToolkit) {
          const tk = productionToolkit;
          const vd = tk.visualDirective || {};
          const sb = tk.scriptBlueprint || {};
          const pkg = tk.packagingCTR || {};

          const btnCopyMaster = modal.querySelector('.btn-copy-master-prompt');
          if (btnCopyMaster) {
            btnCopyMaster.onclick = (e) => {
              e.stopPropagation();
              copyWithFallback(sb.masterScriptPrompt || '', btnCopyMaster, 'Đã copy Full Master Prompt!', 'Copy Full Master Prompt');
            };
          }

          const btnCopyVisual = modal.querySelector('.btn-copy-visual-prompt');
          if (btnCopyVisual) {
            btnCopyVisual.onclick = (e) => {
              e.stopPropagation();
              copyWithFallback(vd.masterVisualPrompt || vd.style || '', btnCopyVisual, 'Đã copy Master Shot!', 'Copy Master Shot');
            };
          }

          const btnCopyVisualKit = modal.querySelector('.btn-copy-visual-kit');
          if (btnCopyVisualKit) {
            btnCopyVisualKit.onclick = (e) => {
              e.stopPropagation();
              const channelTitle = (profile && profile.channelTitle) || ch.title || rawId;
              /* PHASE 3: CHUOI COPY luon la VAN BAN THUAN (dan sang Notion/Docs/AI) => KHONG emoji. */
              let kitText = `HE THONG CHI THI THI GIAC (VISUAL DIRECTIVE PRODUCTION KIT) - ${channelTitle} (${rawId})\n` +
                `================================================================================\n\n` +
                `1. ĐỊNH HƯỚNG PHONG CÁCH CỐT LÕI (CORE STYLE):\n` +
                `   - Định nghĩa ngắn: ${vd.styleShort || ''}\n` +
                `   - Nhân vật/Mascot: ${vd.mascot || 'None'}\n` +
                `   - Ống kính & Ánh sáng: ${vd.cameraLighting || ''}\n` +
                `   - Chi tiết phong cách: ${vd.style || ''}\n\n` +
                `2. MASTER SHOT 1 (CẬN CẢNH HIỆN VẬT - MIDJOURNEY / FLUX):\n` +
                `   ${vd.masterVisualPrompt || ''}\n\n`;

              if (vd.multiAngleArchetypes && vd.multiAngleArchetypes.length) {
                kitText += `3. BỘ 4 CẢNH QUAY CỐT LÕI (MULTI-ANGLE SHOTS CHO TRỌN BỘ VIDEO):\n`;
                vd.multiAngleArchetypes.forEach(a => {
                  kitText += `   [${a.shotType}]\n   - Mô tả: ${a.description}\n   - Prompt AI: ${a.prompt}\n\n`;
                });
              }

              if (vd.cameraMotionSOP && vd.cameraMotionSOP.length) {
                kitText += `4. CHỈ THỊ CHUYỂN ĐỘNG VIDEO AI (KLING 1.5 / RUNWAY GEN-3 MOTION):\n`;
                vd.cameraMotionSOP.forEach(m => {
                  kitText += `   - ${m}\n`;
                });
                kitText += `\n`;
              }

              if (vd.negativePrompt) {
                kitText += `5. ÂM BẢN KHỬ RÁC AI (NEGATIVE PROMPT):\n   ${vd.negativePrompt}\n`;
              }

              copyWithFallback(kitText, btnCopyVisualKit, 'Đã copy Trọn Bộ Visual!', 'Copy Trọn Bộ Visual Kit');
            };
          }

          const btnCopyThumb = modal.querySelector('.btn-copy-thumb-prompt');
          if (btnCopyThumb) {
            btnCopyThumb.onclick = (e) => {
              e.stopPropagation();
              copyWithFallback(pkg.cleanThumbnailPrompt || '', btnCopyThumb, 'Đã copy AI Prompt!', 'Copy AI Image Prompt');
            };
          }

          const btnCopyFullPackaging = modal.querySelector('.btn-copy-full-packaging');
          if (btnCopyFullPackaging) {
            btnCopyFullPackaging.onclick = (e) => {
              e.stopPropagation();
              const channelTitle = (profile && profile.channelTitle) || ch.title || rawId;
              const fullKit = `CHIEN LUOC BAO BI CTR (TITLE & THUMBNAIL) - ${channelTitle} (${rawId})\n` +
                `================================================================================\n\n` +
                `1. CÔNG THỨC TIÊU ĐỀ (TITLE FORMULA):\n` +
                `   ${pkg.titleFormula || ''}\n\n` +
                `2. CÁC TIÊU ĐỀ MẪU ĐÃ BÃO VIEW TỪ KÊNH ĐỐI THỦ:\n` +
                (pkg.exampleTitles && pkg.exampleTitles.length ? pkg.exampleTitles.map(t => `   - ${t}`).join('\n') : '   - (Chưa có mẫu)') + `\n\n` +
                `3. BỐ CỤC THUMBNAIL 3 ĐIỂM VÀNG (65/35 RULE):\n` +
                `   ${pkg.thumbnailComposition || ''}\n\n` +
                `4. CHỈ DẪN CHỮ GHÉP (TEXT OVERLAY):\n` +
                `   ${pkg.thumbnailText || ''}\n` +
                `   * Quy tắc typography: Font Bebas Neue/Montserrat Extra Bold in hoa, màu Vàng chanh (#FACC15) hoặc Đỏ cảnh báo (#EF4444), viền đen dày Stroke 8-10px, Drop Shadow sâu.\n\n` +
                `5. MASTER AI PROMPT SINH ẢNH NỀN SẠCH (MIDJOURNEY V6 / FLUX.1 PRO):\n` +
                `   ${pkg.cleanThumbnailPrompt || ''}\n`;
              copyWithFallback(fullKit, btnCopyFullPackaging, 'Đã copy Trọn Bộ CTR!', 'Copy Trọn Bộ Bao Bì CTR');
            };
          }
        }

        // Bind copy tags button
        const copyBtn = document.getElementById('btn-copy-raw-tags');
        if (copyBtn) {
          copyBtn.onclick = () => {
            const allTags = tags.map(t => '#' + t).join(' ');
            copyWithFallback(allTags, copyBtn, 'Đã sao chép tất cả Tags!', 'Sao chép tất cả Tags');
          };
        }

        // Bind copy buttons for Scene, Sample Context, and Prompting Studio
        if (voiceProfile && voiceProfile.promptingStudio) {
          const btnCopyScene = modal.querySelector('.btn-copy-scene');
          if (btnCopyScene) {
            btnCopyScene.onclick = () => {
              copyWithFallback(voiceProfile.promptingStudio.scene || '', btnCopyScene, 'Đã copy Scene!', 'Copy Scene');
            };
          }

          const btnCopyContext = modal.querySelector('.btn-copy-context');
          if (btnCopyContext) {
            btnCopyContext.onclick = () => {
              copyWithFallback(voiceProfile.promptingStudio.sampleContext || '', btnCopyContext, 'Đã copy Context!', 'Copy Context');
            };
          }

          const btnCopySpeech = modal.querySelector('.btn-copy-speech-block');
          if (btnCopySpeech) {
            btnCopySpeech.onclick = () => {
              copyWithFallback(voiceProfile.promptingStudio.sampleSpeechBlock || '', btnCopySpeech, 'Đã copy Speech Block!', 'Copy Speech Block');
            };
          }

          const btnCopyCombined = modal.querySelector('.btn-copy-combined-prompt');
          if (btnCopyCombined) {
            btnCopyCombined.onclick = () => {
              const combined = voiceProfile.promptingStudio.combinedPromptTemplate || 
                `Scene: ${voiceProfile.promptingStudio.scene}\nSample Context: ${voiceProfile.promptingStudio.sampleContext}\n\n${voiceProfile.promptingStudio.speakerTag || 'Speaker 1'}:\n${voiceProfile.promptingStudio.sampleSpeechBlock}`;
              copyWithFallback(combined, btnCopyCombined, 'Đã copy trọn bộ Prompt!', 'Copy Trọn Bộ (Scene + Context + Speech)');
            };
          }
        }

        // Bind ElevenLabs Voice Design Prompt
        if (voiceProfile && voiceProfile.elevenlabsCloningConfiguration) {
          const btnCopyVoiceDesign = modal.querySelector('.btn-copy-voice-design');
          if (btnCopyVoiceDesign) {
            btnCopyVoiceDesign.onclick = () => {
              copyWithFallback(voiceProfile.elevenlabsCloningConfiguration.voiceDesignPrompt || '', btnCopyVoiceDesign, 'Đã copy Voice Prompt!', 'Copy Prompt');
            };
          }
        }

        // Tab switching logic for Raw Deep Modal (Chuyển tab mượt mà, cố định đỉnh, 100% hiển thị trên mobile)

        modal.querySelectorAll('.raw-tab-btn').forEach(btn => {
          btn.onclick = () => switchRawTab(btn.getAttribute('data-tab'));
        });

        if (jumpTarget === 'mission-control') {
          switchRawTab('mission');
        } else if (jumpTarget === 'voice-dna' || jumpTarget === 'demo-video') {
          switchRawTab('voice');
        } else if (jumpTarget === 'top-videos') {
          switchRawTab('videos');
        } else {
          switchRawTab('overview');
        }
      };

      // Event listener cho nút Xem Sub & Kịch Bản của từng Video
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-open-video-sub');
        if (btn) {
          e.stopPropagation();
          const dossier = btn.getAttribute('data-dossier');
          const vid = btn.getAttribute('data-vid');
          const title = btn.getAttribute('data-title');
          const channel = btn.getAttribute('data-channel');
          const views = btn.getAttribute('data-views');
          if (window.openVideoTranscriptModal) {
            window.openVideoTranscriptModal(dossier, vid, title, channel, views);
          }
        }
      });

      function inlineMdFull(md) {
        if (!md) return '';
        return md
          .replace(/^### (.*$)/gim, '<h3 style="color:#fcd34d; font-size: 16px; font-weight:700; margin:1rem 0 0.5rem 0;">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 style="color:#38bdf8; font-size: 18px; font-weight: 700; border-bottom:1px solid #334155; padding-bottom:0.35rem; margin:1.25rem 0 0.65rem 0;">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 style="color:#fff; font-size: 20px; font-weight: 700; margin:0 0 1rem 0;">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff; font-weight:700;">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="c-slate-300">$1</em>')
          .replace(/`([^`]+)`/g, '<code style="background:#1e293b; color:#f59e0b; padding:0.15rem 0.35rem; border-radius:0.25rem; font-family:monospace; font-size: 13px;">$1</code>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/^- (.*$)/gim, '<li style="margin-left:1.25rem; color:#cbd5e1;">$1</li>');
      }

      window.openVideoTranscriptModal = async function(dossierPath, videoId, videoTitle, channelName, views) {
        let modal = document.getElementById('video-transcript-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'video-transcript-modal';
          modal.setAttribute('role', 'dialog');
          modal.setAttribute('aria-modal', 'true');
          modal.setAttribute('aria-label', 'Phụ đề & kịch bản video');
          modal.tabIndex = -1;
          modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:100000; background:rgba(0,0,0,0.92); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
          modal.onclick = (e) => {
            if (e.target === modal || e.target.id === 'close-video-sub' || (e.target.closest && e.target.closest('#close-video-sub'))) {
              modal.style.display = 'none';
            }
          };
          document.body.appendChild(modal);
        }

        // Loading state
        modal.innerHTML = `
          <div style="position:relative; width:100%; max-width:980px; max-height:92vh; background:#0f172a; border:1px solid #334155; border-radius:1.25rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.95);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:#1e293b; border-bottom:1px solid #334155; flex-shrink:0;">
              <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
                <span style="font-size: 18px; display:inline-flex;">${ico('scroll-text', 20)}</span>
                <h3 style="font-size: 14px; font-weight:700; color:#fff;" class="truncate">Đang nạp Sub & Kịch bản: ${esc(videoTitle)}</h3>
              </div>
              <button type="button" id="close-video-sub" style="padding:0.4rem 0.85rem; border-radius:0.5rem; background:#334155; border:1px solid #475569; color:#e2e8f0; font-size: 13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;">${ico('x', 14)} Đóng</button>
            </div>
            <div style="padding:3rem; text-align:center; color:#94a3b8;">
              <div style="font-size: 32px; margin-bottom:0.5rem; display:flex; justify-content:center;">${ico('hourglass', 24)}</div>
              Đang tải phụ đề song ngữ và kịch bản lồng tiếng...
            </div>
          </div>
        `;
        modal.style.display = 'flex';
        focusModal(modal);

        // Fetch transcript & summary
        let trData = null;
        let summaryMd = '';
        try {
          const res = await fetch(dossierPath + '/transcripts/' + videoId + '_transcript.json');
          if (res.ok) trData = await res.json();
        } catch(e) {}
        try {
          const sRes = await fetch(dossierPath + '/transcripts/' + videoId + '_summary_vi.md');
          if (sRes.ok) summaryMd = await sRes.text();
        } catch(e) {}

        const segments = (trData && trData.segments) ? trData.segments : [];
        const fullEn = (trData && trData.fullText) ? trData.fullText : segments.map(s => s.text).join(' ');
        const fullVi = (trData && trData.fullTextVi) ? trData.fullTextVi : segments.map(s => s.viText || '').filter(Boolean).join(' ');
        const fullBilingual = segments.map(s => `[${formatSec(s.start)}] ${s.text}\n-> ${s.viText || ''}`).join('\n\n');

        function formatSec(sec) {
          if (sec == null) return '00:00';
          sec = Math.floor(Number(sec));
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }

        modal.innerHTML = `
          <div style="position:relative; width:100%; max-width:1040px; max-height:92vh; background:#0b0f19; border:1px solid #1e293b; border-radius:1.25rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.95);">
            <!-- Header -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.9rem 1.25rem; background:#111827; border-bottom:1px solid #1f2937; flex-shrink:0; gap:1rem;">
              <div class="min-w-0-g3">
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                  <span style="font-size: 16px; display:inline-flex;">${ico('scroll-text', 20)}</span>
                  <h3 style="font-size: 14px; font-weight: 700; color:#fff; margin:0;" class="truncate">${esc((trData && trData.titleVi) ? trData.titleVi : videoTitle)}</h3>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem; font-size: 12px; color:#94a3b8; margin-top:0.25rem; flex-wrap:wrap;">
                  <span>Gốc: <em class="c-slate-300">"${esc(videoTitle)}"</em></span>
                  <span>•</span>
                  <span>Kênh: <strong class="c-sky">${esc(channelName)}</strong></span>
                  <span>•</span>
                  <span>Lượt xem: <strong class="c-purple">${views} views</strong></span>
                  <span>•</span>
                  <span>Số câu thoại: <strong class="c-green">${segments.length} câu</strong></span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
                <button type="button" class="js-quick-video" data-vid="${esc(videoId)}" data-title="${esc(videoTitle)}" data-channel="${esc(channelName)}" data-badge="🔥 Đang xem Transcript" style="padding:0.4rem 0.8rem; border-radius:0.5rem; background:rgba(225,29,72,0.9); border:1px solid #f43f5e; color:#fff; font-size: 12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem;" title="Mở video xem trực tiếp đồng bộ với phụ đề">${ico('clapperboard', 14)} Xem Video Nhanh</button>
                <a href="https://www.youtube.com/watch?v=${esc(videoId)}" target="_blank" rel="noopener noreferrer" style="padding:0.4rem 0.8rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size: 12px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">${ico('tv', 14)} YouTube ${ico('arrow-up-right', 14)}</a>
                <button type="button" id="close-video-sub" style="padding:0.4rem 0.8rem; border-radius:0.5rem; background:#374151; border:1px solid #4b5563; color:#e5e7eb; font-size: 12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;">${ico('x', 14)} Đóng</button>
              </div>
            </div>

            <!-- Toolbar Tabs & Copy -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 1.25rem; background:#182234; border-bottom:1px solid #233148; flex-shrink:0; flex-wrap:wrap; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;" id="sub-tabs-container">
                <button type="button" class="sub-tab-btn" data-tab="bilingual" style="padding:0.35rem 0.75rem; border-radius:0.5rem; font-size: 12px; font-weight:700; background:#2563eb; color:#fff; border:1px solid #3b82f6; cursor:pointer;">${ico('globe', 14)} Song ngữ 1:1</button>
                <button type="button" class="sub-tab-btn" data-tab="vietnamese" style="padding:0.35rem 0.75rem; border-radius:0.5rem; font-size: 12px; font-weight:600; background:#1e293b; color:#cbd5e1; border:1px solid #334155; cursor:pointer;">🇻🇳 Tiếng Việt</button>
                <button type="button" class="sub-tab-btn" data-tab="original" style="padding:0.35rem 0.75rem; border-radius:0.5rem; font-size: 12px; font-weight:600; background:#1e293b; color:#cbd5e1; border:1px solid #334155; cursor:pointer;">🇺🇸 Tiếng Gốc</button>
                ${summaryMd ? `<button type="button" class="sub-tab-btn" data-tab="summary" style="padding:0.35rem 0.75rem; border-radius:0.5rem; font-size: 12px; font-weight:600; background:#1e293b; color:#fcd34d; border:1px solid rgba(245,158,11,0.4); cursor:pointer;">${ico('mic', 14)} Kịch bản AI</button>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:0.35rem;">
                <button type="button" id="btn-copy-sub-active" style="padding:0.35rem 0.8rem; border-radius:0.5rem; font-size: 12px; font-weight:700; background:#10b981; color:#fff; border:1px solid #059669; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;">${ico('clipboard-copy', 14)} Sao Chép Bản Này</button>
              </div>
            </div>

            <!-- Content Area -->
            <div id="sub-content-body" style="padding:1.25rem; overflow-y:auto; max-height:calc(92vh - 125px); font-size: 14px; line-height:1.6; color:#e2e8f0;">
            </div>
          </div>
        `;

        let currentTab = 'bilingual';
        const contentEl = document.getElementById('sub-content-body');
        const copyBtn = document.getElementById('btn-copy-sub-active');

        function renderTabContent(tab) {
          currentTab = tab;
          // Update tab buttons style
          modal.querySelectorAll('.sub-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tab) {
              btn.style.background = '#2563eb';
              btn.style.color = '#fff';
              btn.style.fontWeight = '700';
              btn.style.borderColor = '#3b82f6';
            } else {
              btn.style.background = '#1e293b';
              btn.style.color = btn.getAttribute('data-tab') === 'summary' ? '#fcd34d' : '#cbd5e1';
              btn.style.fontWeight = '600';
              btn.style.borderColor = '#334155';
            }
          });

          if (tab === 'bilingual') {
            if (!segments.length) {
              contentEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:2rem;">Chưa có phân đoạn phụ đề song ngữ cho video này.</div>`;
              return;
            }
            contentEl.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:0.6rem;">
                ${segments.map((seg) => `
                  <div style="display:flex; align-items:flex-start; gap:0.75rem; padding:0.65rem 0.85rem; background:#131d31; border:1px solid #1e293b; border-radius:0.625rem;">
                    <span style="font-family:monospace; font-size: 12px; color:#38bdf8; background:#0f172a; padding:0.15rem 0.45rem; border-radius:0.35rem; border:1px solid #1e293b; flex-shrink:0; font-weight:700;">[${formatSec(seg.start)}]</span>
                    <div style="flex:1; min-width:0;">
                      <div style="font-size: 14px; font-weight:600; color:#fff; line-height:1.4;">${esc(seg.text)}</div>
                      <div style="font-size: 13px; color:#fcd34d; margin-top:0.25rem; line-height:1.4;">${esc(seg.viText || '')}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          } else if (tab === 'vietnamese') {
            contentEl.innerHTML = `
              <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.75rem; padding:1.25rem; white-space:pre-wrap; font-size: 14px; line-height:1.75; color:#fef3c7;">
                ${esc(fullVi || segments.map(s => s.viText).join('\n'))}
              </div>
            `;
          } else if (tab === 'original') {
            contentEl.innerHTML = `
              <div style="background:#131d31; border:1px solid #1e293b; border-radius:0.75rem; padding:1.25rem; white-space:pre-wrap; font-size: 14px; line-height:1.75; color:#e2e8f0; font-family:monospace;">
                ${esc(fullEn || segments.map(s => s.text).join('\n'))}
              </div>
            `;
          } else if (tab === 'summary') {
            contentEl.innerHTML = `
              <div class="max-w-none" style="background:#111827; border:1px solid #1f2937; border-radius:0.875rem; padding:1.5rem; color:#e2e8f0; font-size: 14px; line-height:1.65;">
                ${inlineMdFull(summaryMd)}
              </div>
            `;
          }
        }

        // Switch tab click
        modal.querySelectorAll('.sub-tab-btn').forEach(btn => {
          btn.onclick = () => {
            renderTabContent(btn.getAttribute('data-tab'));
          };
        });

        // Copy button action
        copyBtn.onclick = () => {
          let textToCopy = '';
          if (currentTab === 'bilingual') textToCopy = fullBilingual;
          else if (currentTab === 'vietnamese') textToCopy = fullVi;
          else if (currentTab === 'original') textToCopy = fullEn;
          else if (currentTab === 'summary') textToCopy = summaryMd;

          const copyDone = () => {
            /* PHASE 3: textContent => chu thuan, khong emoji. */
            copyBtn.textContent = 'Đã sao chép!';
            setTimeout(() => { copyBtn.textContent = 'Sao Chép Bản Này'; }, 2000);
          };
          const fallbackCopy = () => {
            const ta = document.createElement('textarea');
            ta.value = textToCopy;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) {}
            document.body.removeChild(ta);
            copyDone();
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(copyDone).catch(fallbackCopy);
          } else {
            fallbackCopy();
          }
        };

        // Render initial tab
        renderTabContent('bilingual');
      };

      window.viewRawImage = function(src, title) {
        let modal = document.getElementById('raw-image-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'raw-image-modal';
          modal.setAttribute('role', 'dialog');
          modal.setAttribute('aria-modal', 'true');
          modal.setAttribute('aria-label', 'Xem ảnh raw kênh');
          modal.tabIndex = -1;
          modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:99999; background:rgba(0,0,0,0.92); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
          modal.onclick = (e) => {
            if (e.target === modal || e.target.id === 'close-raw-img' || (e.target.closest && e.target.closest('#close-raw-img'))) {
              modal.style.display = 'none';
              document.body.style.overflow = '';
            }
          };
          modal.innerHTML = `
            <div style="position:relative; width:100%; max-width:960px; max-height:92vh; background:#111827; border:1px solid #374151; border-radius:1rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85);">
              <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.25rem; background:#1f2937; border-bottom:1px solid #374151; flex-shrink:0;">
                <span id="raw-img-title" style="font-size: 14px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:0.5rem;"><span style="display:inline-flex;">${ico('camera', 16)}</span><span></span></span>
                <button type="button" id="close-raw-img" class="btn-press cursor-pointer" style="padding:0.35rem 0.8rem; border-radius:0.5rem; background:#374151; border:1px solid #4b5563; color:#e5e7eb; font-size: 13px; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem;">${ico('x', 14)} Đóng</button>
              </div>
              <div style="padding:0.75rem; overflow:auto; max-height:calc(92vh - 55px); display:flex; align-items:center; justify-content:center; background:#000;">
                <img id="raw-img-src" src="" alt="Ảnh kênh chi tiết" width="1280" height="720" loading="lazy" decoding="async" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:0.5rem;">
              </div>
            </div>`;
          document.body.appendChild(modal);
        }
        document.querySelector('#raw-img-title span:last-child').textContent = title || 'Ảnh kênh gốc';
        document.getElementById('raw-img-src').src = src;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        focusModal(modal);
      };

      window.playEmbeddedDemoVideo = function(containerId, videoId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" style="width:100%; height:100%; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      };

      window.openQuickVideoModal = function(videoId, videoTitle, channelName, badgeLabel) {
        let modal = document.getElementById('quick-video-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'quick-video-modal';
          modal.setAttribute('role', 'dialog');
          modal.setAttribute('aria-modal', 'true');
          modal.setAttribute('aria-label', 'Xem nhanh video YouTube');
          modal.tabIndex = -1;
          modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:100001; background:rgba(0,0,0,0.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
          
          const closeModal = () => {
            modal.style.display = 'none';
            modal.innerHTML = '';
            const otherOpen = document.getElementById('raw-deep-modal')?.style.display === 'flex' ||
                              document.getElementById('video-transcript-modal')?.style.display === 'flex' ||
                              document.getElementById('raw-image-modal')?.style.display === 'flex';
            if (!otherOpen) {
              document.body.style.overflow = '';
            }
          };
          window.closeQuickVideoModal = closeModal;

          modal.onclick = (e) => {
            if (e.target === modal || e.target.id === 'close-quick-video' || (e.target.closest && e.target.closest('#close-quick-video'))) {
              closeModal();
            }
          };
          document.body.appendChild(modal);
        }

        /* PHASE 3: badge la CHUOI HIEN THI — data-badge (key) giu nguyen gia tri, strip emoji luc render. */
        const badge = stripDecorEmoji(badgeLabel || 'Tuyến Chuẩn');
        const displayChannel = channelName ? ('Kênh: ' + channelName) : 'Xem Trực Tiếp';

        modal.innerHTML = `
          <div style="position:relative; width:100%; max-width:960px; background:#0f172a; border:1px solid #334155; border-radius:1rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.95);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1.15rem; background:#1e293b; border-bottom:1px solid #334155; gap:1rem;">
              <div class="min-w-0-g3">
                <div class="row-wrap">
                  <span style="font-size: 16px; display:inline-flex;">${ico('clapperboard', 20)}</span>
                  <h3 style="font-size: 14px; font-weight:700; color:#fff; margin:0;" class="truncate">${esc(displayChannel)}</h3>
                  <span style="font-size: 11px; font-weight:700; padding:0.1rem 0.45rem; border-radius:0.35rem; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5;">${esc(badge)}</span>
                </div>
                <p style="font-size: 12px; color:#94a3b8; margin:0.2rem 0 0 0;" class="truncate" title="${esc(videoTitle)}">${esc(videoTitle)}</p>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; padding:0.35rem 0.75rem; border-radius:0.5rem; background:#2563eb; color:#fff; text-decoration:none; font-weight:600; display:inline-flex; align-items:center; gap:0.3rem;">${ico('arrow-up-right', 14)} Mở YouTube</a>
                <button type="button" id="close-quick-video" style="padding:0.35rem 0.75rem; border-radius:0.5rem; background:#334155; border:1px solid #475569; color:#e2e8f0; font-size: 12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;" title="Đóng [Esc]">${ico('x', 14)} Đóng</button>
              </div>
            </div>
            <div style="width:100%; aspect-ratio:16/9; background:#000;">
              <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" style="width:100%; height:100%; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          </div>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        focusModal(modal);
      };

      // Delegated safe handlers: truyen du lieu qua data-* thay vi inline onclick.
      // Ly do: tieu de video co dau nhay don (vi du "Can't", "Earth's") lam vo lenh
      // JS khi dung inline onclick -> nut "Xem Video" chet hoan toan.
      document.addEventListener('click', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        const stop = t.closest('.js-stop-prop');
        if (stop) e.stopPropagation();
        const act = t.closest('[data-action]');
        if (act) {
          const action = act.getAttribute('data-action');
          if (action === 'video-filter-reset') {
            e.preventDefault();
            state.freeOnly = false; state.marketFilter = ''; state.nicheFilter = ''; state.q = ''; state.skuFilter = ''; state.watchFilter = '';
            render();
            return;
          }
          if (action === 'video-filter-free') {
            e.preventDefault();
            state.freeOnly = !state.freeOnly;
            render();
            return;
          }
          if (action === 'retry-render') {
            e.preventDefault();
            render();
            return;
          }
          if (action === 'raw-tab') {
            e.preventDefault();
            const tabKey = act.getAttribute('data-tab') || 'overview';
            if (typeof window.switchRawTab === 'function') window.switchRawTab(tabKey);
            return;
          }
          if (action === 'raw-page') {
            e.preventDefault();
            const p = parseInt(act.getAttribute('data-page') || '1', 10);
            state.rawPage = Number.isFinite(p) && p > 0 ? p : 1;
            render();
            return;
          }
        }
        const quick = t.closest('.js-quick-video');
        if (quick) {
          e.stopPropagation();
          e.preventDefault();
          const vid = quick.getAttribute('data-vid');
          if (vid) {
            window.openQuickVideoModal(
              vid,
              quick.getAttribute('data-title') || '',
              quick.getAttribute('data-channel') || '',
              /* PHASE 3: fallback badge la CHU THUAN (khong emoji) — stripDecorEmoji o tang modal da xu ly. */
              quick.getAttribute('data-badge') || 'Video'
            );
          }
          return;
        }
        const img = t.closest('.js-view-raw-image');
        if (img) {
          if (window.viewRawImage) window.viewRawImage(img.getAttribute('data-src') || '', img.getAttribute('data-title') || '');
          return;
        }
        const demo = t.closest('.js-play-demo');
        if (demo) {
          e.stopPropagation();
          e.preventDefault();
          if (window.playEmbeddedDemoVideo) window.playEmbeddedDemoVideo(demo.getAttribute('data-container') || '', demo.getAttribute('data-vid') || '');
        }
      }, true);

      // Global Shortcuts: Escape to close modals, / to focus search, Tab trap trong modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const openModal = ['quick-video-modal', 'raw-deep-modal', 'video-transcript-modal', 'raw-image-modal', 'music-studio-modal']
            .map(id => document.getElementById(id))
            .find(m => m && m.style.display === 'flex');
          if (openModal) trapFocus(openModal, e);
        }
        if (e.key === 'Escape') {
          const musicModal = document.getElementById('music-studio-modal');
          if (musicModal && musicModal.style.display === 'flex') {
            const closeM = document.getElementById('close-music-studio');
            if (closeM) closeM.click();
            else { musicModal.style.display = 'none'; document.body.style.overflow = ''; }
            return;
          }
          const quickModal = document.getElementById('quick-video-modal');
          if (quickModal && quickModal.style.display === 'flex') {
            if (window.closeQuickVideoModal) window.closeQuickVideoModal();
            else { quickModal.style.display = 'none'; quickModal.innerHTML = ''; }
            return;
          }
          const subModal = document.getElementById('video-transcript-modal');
          if (subModal && subModal.style.display === 'flex') {
            subModal.style.display = 'none';
            return;
          }
          const rawModal = document.getElementById('raw-deep-modal') || document.getElementById('raw-detail-modal');
          if (rawModal && rawModal.style.display === 'flex') {
            if (window.closeRawDeepModal) {
              window.closeRawDeepModal();
            } else {
              rawModal.querySelectorAll('audio').forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
              rawModal.querySelectorAll('iframe').forEach(f => { try { f.src = 'about:blank'; } catch (e) {} });
              rawModal.style.display = 'none';
              document.body.style.overflow = '';
            }
            return;
          }
          const imgModal = document.getElementById('raw-image-modal');
          if (imgModal && imgModal.style.display === 'flex') {
            imgModal.style.display = 'none';
            document.body.style.overflow = '';
            return;
          }
        } else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
          if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
            const fq = document.getElementById('fq');
            if (fq) {
              e.preventDefault();
              fq.focus();
              fq.select();
            }
          }
        }
      });
    })();
  