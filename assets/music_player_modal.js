// H2DEV Project - Interactive Music Studio Modal
(function() {
  let musicData = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let activeAudioEl = null;

  function eqSvg() {
    return '<svg class="h2-svg-anim h2-eq-bars" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="1" y="3" width="2.5" height="9" rx="1"/><rect x="5.5" y="1" width="2.5" height="11" rx="1"/><rect x="10" y="4" width="2.5" height="8" rx="1"/></svg>';
  }

  function syncNowPlayingUI() {
    const modal = document.getElementById('music-studio-modal');
    if (!modal) return;
    const playingAudio = Array.from(modal.querySelectorAll('audio')).find(a => !a.paused && !a.ended) || null;
    if (playingAudio) activeAudioEl = playingAudio;
    const isPlaying = Boolean(playingAudio);

    modal.querySelectorAll('.music-track-card').forEach(card => {
      const cardAudio = card.querySelector('audio');
      const match = Boolean(activeAudioEl && cardAudio === activeAudioEl && isPlaying);
      card.classList.toggle('is-playing', match);
      const eq = card.querySelector('.js-track-eq');
      if (eq) eq.style.display = match ? 'inline-flex' : 'none';
    });

    const bar = modal.querySelector('#music-now-playing');
    if (!bar) return;
    if (!activeAudioEl || !activeAudioEl.isConnected) {
      bar.classList.add('hidden');
      return;
    }
    const card = activeAudioEl.closest('.music-track-card');
    const title = (card && card.getAttribute('data-track-title')) || 'Đang phát nhạc nền';
    const titleEl = bar.querySelector('#music-np-title');
    const toggleBtn = bar.querySelector('#music-np-toggle');
    const eqWrap = bar.querySelector('#music-np-eq');
    if (titleEl) { titleEl.textContent = title; titleEl.title = title; }
    if (eqWrap) eqWrap.style.display = isPlaying ? 'inline-flex' : 'none';
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', isPlaying ? 'Tạm dừng' : 'Phát tiếp');
      toggleBtn.innerHTML = isPlaying ? ico('pause', 14) : ico('play', 14);
    }
    bar.classList.remove('hidden');
  }

  // Audio Singleton: chống phát chồng nhiều bài nhạc trong modal hoặc ngoài trang
  document.addEventListener('play', (e) => {
    const target = e.target;
    if (!target || target.tagName !== 'AUDIO') return;
    document.querySelectorAll('audio').forEach((audioEl) => {
      if (audioEl !== target && !audioEl.paused) {
        try { audioEl.pause(); } catch (_) {}
      }
    });
    activeAudioEl = target;
    syncNowPlayingUI();
  }, true);

  document.addEventListener('pause', (e) => {
    if (e.target && e.target.tagName === 'AUDIO') syncNowPlayingUI();
  }, true);

  document.addEventListener('ended', (e) => {
    if (e.target && e.target.tagName === 'AUDIO') syncNowPlayingUI();
  }, true);

  async function loadMusicCatalog() {
    if (musicData) return musicData;
    try {
      const res = await fetch('data/music_catalog.json?v=20261126-uifix110');
      musicData = await res.json();
      return musicData;
    } catch (e) {
      console.error('Khong the load data/music_catalog.json', e);
      return null;
    }
  }

  function esc(s) {
    if (globalThis.H2Core && typeof globalThis.H2Core.esc === 'function') return globalThis.H2Core.esc(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* L3-XSS-02: strict media URL validator — allows only https?:// or safe relative/root-relative paths */
  function safeMediaUrl(raw) {
    const u = String(raw == null ? '' : raw).trim();
    if (!u) return '';
    // Reject control chars
    if (/[\u0000-\u001F\u007F]/.test(u)) return '';
    // Reject protocol-relative, UNC paths, scheme: (except https?://)
    if (/^\/\//.test(u) || /^\\\\/.test(u)) return '';
    // Reject anything with backtick, angle bracket, quotes, or &quot; / &#39; / &lt; / &gt; entities
    if (/[`<>"']/.test(u) || /(&quot;|&#39;|&lt;|&gt;)/i.test(u)) return '';
    // Allow https?://
    if (/^https?:\/\//i.test(u)) return u;
    // Allow root-relative paths that don't contain //
    if (/^\/(?!\/)/.test(u) && !/\/\//.test(u)) return u;
    // Allow relative paths without scheme: (no colon in first segment)
    const head = u.split(/[/?#]/)[0];
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(head) || head.includes(':')) return '';
    // Reject if contains //
    if (/\/\//.test(u)) return '';
    return u;
  }

  /* Icon: uy quyen cho H2Core.ico (1 chuan duy nhat - ICON-MAPPING.md muc 1b).
   * KHONG tu viet ban sao thu 3. Fallback rong neu chua nap h2dev-core. */
  function ico(name, size) {
    if (globalThis.H2Core && typeof globalThis.H2Core.ico === 'function') return globalThis.H2Core.ico(name, size);
    return '';
  }

  /* Icon co MAU (giu ngu nghia den bao YPP SAFE/COPYRIGHTED/REVIEW).
   * .h2-icon dung background-color:currentColor => doi mau bang color cua span boc ngoai. */
  function icoColored(name, size, color) {
    return '<span style="color:' + color + ';display:inline-flex;align-items:center;">' + ico(name, size) + '</span>';
  }

  /* UI-08 (2026-09-28): 1 CHU QUYEN toast = H2Core.showToast. Ban cu tu set
     z-index inline 100010 (audit UI-08: "music separately overrides"); gio
     toast chung da duoc nâng --h2-z-toast = 1020 (> modal-top 1010) o tokens.
     Fallback chi khi h2dev-core chua nap. */
  function showToast(msg) {
    if (globalThis.H2Core && typeof globalThis.H2Core.showToast === 'function') {
      globalThis.H2Core.showToast(msg, 2200);
      return;
    }
    let el = document.querySelector('.toast-msg.js-music-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-msg js-music-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      const box = document.getElementById('toast-box') || document.body;
      box.appendChild(el);
    }
    el.textContent = msg;
    if (el._h2Timer) clearTimeout(el._h2Timer);
    el._h2Timer = setTimeout(() => { el.remove(); }, 2200);
  }

  function renderTrackCard(t) {
    const isSafe = t.copyrightRisk === 'SAFE';
    const isCopy = t.copyrightRisk === 'COPYRIGHTED';
    const badgeColor = isSafe ? 'background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); color:#6ee7b7;' :
                      (isCopy ? 'background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5;' :
                                'background:rgba(245,158,11,0.2); border:1px solid rgba(245,158,11,0.4); color:#fde68a;');
    const badgeText = isSafe
      ? icoColored('shield-check', 14, '#6ee7b7') + ' SAFE (YPP)'
      : (isCopy
        ? icoColored('alert-triangle', 14, '#fca5a5') + ' BẢN QUYỀN'
        : icoColored('alert-circle', 14, '#fde68a') + ' THẬN TRỌNG');
    const rawSrc = t.streamUrl || ('assets/nhac-nen/' + (t.folder && t.folder !== 'Nhạc nền' ? t.folder + '/' : '') + t.fileName);
    const safeSrc = safeMediaUrl(rawSrc);
    const streamSrc = safeSrc ? safeSrc + (safeSrc.includes('?') ? '&' : '?') + 'v=20261126-uifix110' : '';

    return `
      <div class="music-track-card" data-track-id="${esc(t.id)}" data-track-title="${esc(t.fileName)}" style="border-color:${isCopy ? '#7f1d1d' : 'var(--border-strong)'};">
        <!-- Row 1: Badges + Download -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap; min-width:0;">
            <span style="font-size: 12px; font-weight: 700; padding:0.1rem 0.4rem; border-radius:0.35rem; background:rgba(226,2,58,0.16); border:1px solid rgba(226,2,58,0.45); color:#fda4af; font-family:monospace;">${esc(t.id)}</span>
            <span style="font-size: 12px; font-weight:700; padding:0.1rem 0.4rem; border-radius:0.35rem; ${badgeColor}">${badgeText}</span>
            <span style="font-size: 12px; color:var(--fg-muted); font-family:monospace;">${esc(t.durationFormatted)} • ${t.sizeMB} MB</span>
          </div>
          ${streamSrc ? `<a href="${esc(streamSrc)}" download="${esc(t.fileName)}" class="btn-ghost" style="flex-shrink:0; font-size: 12px; padding:0.25rem 0.6rem; border-radius:0.4rem; background:var(--surface-2); border:1px solid var(--border-strong); color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;">
            ${ico('download', 14)} Tải MP3
          </a>` : ''}
        </div>

        <!-- Row 2: Title -->
        <div>
          <h4 style="font-size: 14px; font-weight:700; color:var(--fg); margin:0; word-break:break-word; line-height:1.35; display:flex; align-items:center; gap:0.35rem;" title="${esc(t.fileName)}"><span class="js-track-eq" style="display:none; color:var(--brand); align-items:center;">${eqSvg()}</span><span>${esc(t.fileName)}</span></h4>
          ${t.detectedTitle ? `<div style="font-size: 12px; color:#f87171; font-weight:600; margin-top:0.15rem; display:flex; align-items:center; gap:0.2rem;">${ico('alert-triangle', 14)} <span>Phát hiện: ${esc(t.detectedTitle)}${t.detectedArtist ? ' — ' + esc(t.detectedArtist) : ''}</span></div>` : ''}
        </div>

        <!-- Row 3: Meta Info (Ngách & Mood compact) -->
        <div style="font-size: 12px; color:var(--fg-2); line-height:1.4; display:flex; flex-direction:column; gap:0.15rem;">
          ${(() => {
            const rawCat = String(t.categoryNiche || '').trim();
            const firstSeg = rawCat.split('(')[0].split('/')[0].trim();
            const nxQuery = /^long-form ambient$/i.test(firstSeg)
              ? 'H01'
              : (/^lịch sử đời sống$/i.test(firstSeg) ? 'H30' : firstSeg);
            return `<div class="truncate"><strong style="color:var(--fg-muted);">Ngách:</strong> <a href="/ngachxanh?q=${encodeURIComponent(nxQuery)}" data-nx-q="${esc(nxQuery)}" class="js-music-niche-link" style="display:inline-flex; align-items:center; padding:2px 0; color:#38bdf8; font-weight:600; text-decoration:none;" title="Đối chiếu ngách ${esc(rawCat)} trên Tab Ngách Xanh">${esc(rawCat)} ↗</a></div>`;
          })()}
          <div class="truncate" title="${esc(t.mood || t.moodDescription)}"><strong style="color:var(--fg-muted);">Mood:</strong> ${esc(t.mood || t.moodDescription)}</div>
        </div>

        <!-- Row 4: Audio Player -->
        <div style="margin-top:auto; padding-top:0.2rem;">
          ${streamSrc ? `<audio controls preload="none" style="width:100%; height:34px; border-radius:0.35rem; outline:none;" src="${esc(streamSrc)}"></audio>` : `<div style="font-size:12px; color:var(--fg-muted); padding:0.25rem 0;">Không thể tải nhạc (URL không hợp lệ)</div>`}
        </div>

        <!-- Row 5: Footer & Copy Path (Chống tràn viền) -->
        <div style="display:flex; align-items:center; justify-content:space-between; font-size: 12px; color:var(--fg-muted); border-top:1px solid var(--border-strong); padding-top:0.35rem; gap:0.5rem; min-width:0;">
          <span class="truncate" style="flex:1; min-width:0; display:inline-flex; align-items:center; gap:0.25rem;" title="${esc(t.fileName)}">${ico('folder', 14)} <span class="truncate">${esc(t.fileName)}</span></span>
          <button type="button" class="js-copy-music-path" data-copy-path="${esc(t.localAbsPath || t.fileName)}" data-copy-id="${esc(t.id)}" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size: 12px; font-weight:700; padding:0; flex-shrink:0; white-space:nowrap; display:inline-flex; align-items:center; gap:0.2rem;">${ico('clipboard-copy', 14)} Copy Path</button>
        </div>
      </div>
    `;
  }

  function syncMusicUrlState(isOpen) {
    try {
      const pRaw = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (pRaw !== 'nhac' && pRaw !== 'nhac-nen' && pRaw !== 'nhacnen') return;
      const u = new URL(location.href);
      if (isOpen && currentFilter && currentFilter !== 'all') u.searchParams.set('mfilter', currentFilter);
      else u.searchParams.delete('mfilter');
      if (isOpen && searchQuery && searchQuery.trim()) u.searchParams.set('mq', searchQuery.trim());
      else u.searchParams.delete('mq');
      if (isOpen) u.searchParams.set('mopen', '1');
      else u.searchParams.delete('mopen');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (_) {}
  }

  window.openMusicStudioModal = async function(initialFilter = 'all', initialQuery = '', _triggerEl = null) {
    /* L4-A11Y-02: Capture trigger element SYNCHRONOUSLY before any await, so focus can be restored on close */
    const _prevActive = _triggerEl || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null) || document.getElementById('btn-music-studio');
    currentFilter = initialFilter || 'all';
    // uifix103: luôn reset searchQuery để xóa filter cũ khi mở lại modal không có query
    searchQuery = typeof initialQuery === 'string' ? initialQuery : '';
    const cat = await loadMusicCatalog();
    if (!cat || !cat.tracks) {
      showToast('Không thể tải kho nhạc nền. Vui lòng thử lại!');
      return;
    }

    let modal = document.getElementById('music-studio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'music-studio-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Trạm nhạc nền');
      modal.tabIndex = -1;
      // P1 (2026-09-26): z-index 100005 la SO CAM (ngoai thang 8 bac) -> dung token.
      // blur 12px -> 10px theo --h2-backdrop-blur.
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:var(--h2-z-modal-top); background:var(--h2-overlay-bg); backdrop-filter:blur(var(--h2-backdrop-blur)); -webkit-backdrop-filter:blur(var(--h2-backdrop-blur)); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
      document.body.appendChild(modal);

      modal.onclick = (e) => {
        const navLink = e.target.closest && e.target.closest('.js-music-niche-link, .js-music-sodo-link');
        if (navLink) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
          modal.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
          syncMusicUrlState(false);
          const targetHref = navLink.getAttribute('href') || '';
          if (targetHref && typeof window.navigateDirectUrl === 'function' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            window.navigateDirectUrl(targetHref);
          }
          return;
        }
        const copyBtn = e.target.closest && e.target.closest('.js-copy-music-path');
        if (copyBtn) {
          const path = copyBtn.getAttribute('data-copy-path') || '';
          const id = copyBtn.getAttribute('data-copy-id') || '';
          if (globalThis.H2Core && typeof globalThis.H2Core.copyWithFeedback === 'function') {
            globalThis.H2Core.copyWithFeedback(copyBtn, path, {
              successLabel: 'Đã copy',
              toastMsg: 'Đã copy đường dẫn local: ' + id
            });
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(path)
              .then(() => showToast('Đã copy đường dẫn local: ' + id))
              .catch(() => showToast('Không copy được path: ' + id));
          } else {
            showToast('Trình duyệt không hỗ trợ clipboard API — path: ' + path);
          }
          return;
        }
        if (e.target === modal || e.target.id === 'close-music-studio' || (e.target.closest && e.target.closest('#close-music-studio'))) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
          modal.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
          activeAudioEl = null;
          syncNowPlayingUI();
          syncMusicUrlState(false);
          if (modal._prevActiveElement && typeof modal._prevActiveElement.focus === 'function') {
            try { modal._prevActiveElement.focus(); } catch (err) {}
          }
        }
      };
    }

    function getFilteredTracks() {
      const q = searchQuery.toLowerCase().trim();
      return cat.tracks.filter(t => {
        const cn = (t.categoryNiche || '').toLowerCase();
        if (currentFilter === 'safe' && t.copyrightRisk !== 'SAFE') return false;
        if (currentFilter === 'copyrighted' && t.copyrightRisk !== 'COPYRIGHTED') return false;
        if (currentFilter === 'review' && t.copyrightRisk !== 'REVIEW') return false;
        if (currentFilter === 'history' && (!cn.includes('lịch sử') && !cn.includes('khảo cổ') && !cn.includes('everyday'))) return false;
        if (currentFilter === 'cophong' && (!cn.includes('cổ trang') && !cn.includes('tiên hiệp') && !cn.includes('guzheng') && !cn.includes('pipa') && !cn.includes('gamela'))) return false;
        if (currentFilter === 'darkcrime' && (!cn.includes('dark crime') && !cn.includes('tài chính') && !cn.includes('kinh doanh') && !cn.includes('winter'))) return false;
        if (currentFilter === 'animation' && (!cn.includes('hoạt hình') && !cn.includes('trẻ em') && !cn.includes('phép thuật') && !cn.includes('sugar plum'))) return false;
        if (currentFilter === 'prophecy' && (!cn.includes('tiên tri'))) return false;
        if (currentFilter === 'philosophy' && (!cn.includes('vũ trụ') && !cn.includes('triết lý') && !cn.includes('sức khỏe') && !cn.includes('senior') && !cn.includes('kinh thánh') && !cn.includes('tôn giáo'))) return false;
        if (currentFilter === 'wildlife' && (!cn.includes('sinh tồn'))) return false;
        if (currentFilter === 'military' && (!cn.includes('quân sự') && !cn.includes('chiến tranh') && !cn.includes('mars'))) return false;
        if (currentFilter === 'ambient' && (!cn.includes('long-form') && (t.durationSeconds || 0) < 600)) return false;
        if (!q) return true;
        const hay = [
          t.id || '',
          t.fileName || '',
          t.categoryNiche || '',
          t.mood || '',
          t.moodDescription || '',
          (t.leadInstruments || []).join(' '),
          t.detectedTitle || '',
          t.detectedArtist || '',
          t.author || ''
        ].join(' ').toLowerCase();
        /* FIX 2026-09-30 (UI-01): tim khong dau dung chung hop dong voi H2SearchCore. */
        return (globalThis.H2SearchCore && H2SearchCore.includes) ? H2SearchCore.includes(hay, q) : hay.includes(q);
      });
    }

    function getCountMap() {
      const totalCount = cat.tracks.length;
      const safeCount = cat.tracks.filter(t => t.copyrightRisk === 'SAFE').length;
      const reviewCount = cat.tracks.filter(t => t.copyrightRisk === 'REVIEW').length;
      const copyCount = cat.tracks.filter(t => t.copyrightRisk === 'COPYRIGHTED').length;
      const historyCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('lịch sử') || cn.includes('khảo cổ') || cn.includes('everyday'); }).length;
      const cophongCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('cổ trang') || cn.includes('tiên hiệp') || cn.includes('guzheng') || cn.includes('pipa') || cn.includes('gamela'); }).length;
      const darkcrimeCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('dark crime') || cn.includes('tài chính') || cn.includes('kinh doanh') || cn.includes('winter'); }).length;
      const animationCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('hoạt hình') || cn.includes('trẻ em') || cn.includes('phép thuật') || cn.includes('sugar plum'); }).length;
      const prophecyCount = cat.tracks.filter(t => (t.categoryNiche || '').toLowerCase().includes('tiên tri')).length;
      const philosophyCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('vũ trụ') || cn.includes('triết lý') || cn.includes('sức khỏe') || cn.includes('senior') || cn.includes('kinh thánh') || cn.includes('tôn giáo'); }).length;
      const wildlifeCount = cat.tracks.filter(t => (t.categoryNiche || '').toLowerCase().includes('sinh tồn')).length;
      const militaryCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('quân sự') || cn.includes('chiến tranh') || cn.includes('mars'); }).length;
      const ambientCount = cat.tracks.filter(t => { const cn = (t.categoryNiche || '').toLowerCase(); return cn.includes('long-form') || (t.durationSeconds || 0) >= 600; }).length;
      const nicheCount = new Set(cat.tracks.map(t => t.categoryNiche || 'Khác')).size;
      return { totalCount, safeCount, reviewCount, copyCount, historyCount, cophongCount, darkcrimeCount, animationCount, prophecyCount, philosophyCount, wildlifeCount, militaryCount, ambientCount, nicheCount };
    }

    // uifix103: renderModalShell — xây dựng khung cố định 1 lần (khi modal.innerHTML rỗng)
    // KHÔNG gọi lại khi chỉ thay đổi searchQuery hoặc filter chip.
    function renderModalShell(cm) {
      const { totalCount, safeCount, reviewCount, copyCount, historyCount, cophongCount, darkcrimeCount, animationCount, prophecyCount, philosophyCount, wildlifeCount, militaryCount, ambientCount, nicheCount } = cm;
      modal.innerHTML = `
        <div style="position:relative; width:100%; max-width:1180px; max-height:92vh; background:var(--bg); border:1px solid var(--border-strong); border-radius:1rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.95);">
          <!-- Compact Header -->
          <div style="display:flex; align-items:center; justify-content:space-between; padding:0.8rem 1.1rem; background:var(--surface); border-bottom:1px solid var(--border-strong); gap:0.75rem; flex-shrink:0;">
            <div style="min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                <span style="color:var(--brand);display:inline-flex;align-items:center;">${ico('headphones', 24)}</span>
                <h3 style="font-size: 16px; font-weight: 700; color:#fff; margin:0;" class="truncate">Trạm Nhạc Nền ${nicheCount} Ngách YouTube</h3>
                <span style="font-size: 12px; font-weight:700; padding:0.12rem 0.5rem; border-radius:0.35rem; background:rgba(226,2,58,0.16); border:1px solid rgba(226,2,58,0.45); color:#fda4af;">${totalCount} Tracks (${safeCount} SAFE YPP)</span>
                <a href="/sodo?snode=track:h2dev" class="js-music-sodo-link" style="display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; padding:0.15rem 0.55rem; border-radius:0.35rem; background:var(--surface-2); border:1px solid var(--border-strong); color:#38bdf8; text-decoration:none;">Sơ đồ DB ↗</a>
              </div>
            </div>
            <button type="button" id="close-music-studio" style="width:44px; height:44px; border-radius:50%; background:var(--surface-2); border:1px solid var(--border-strong); color:var(--fg); font-size: 14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;" aria-label="Đóng Trạm Nhạc Nền" title="Đóng [Esc]">${ico('x', 16)}</button>
          </div>

          <!-- Sticky Search & Filter Toolbar -->
          <div style="padding:0.65rem 1.1rem; background:var(--surface); border-bottom:1px solid var(--border-strong); display:flex; flex-direction:column; gap:0.5rem; flex-shrink:0;">
            <!-- Search Bar with built-in clear -->
            <div style="position:relative; display:flex; align-items:center;">
              <input type="text" id="music-search" aria-label="Tìm kiếm nhạc nền" placeholder="Tìm mã (MUSIC-046), tên bài, mood, nhạc cụ..." value="${esc(searchQuery)}" style="width:100%; background:var(--surface); border:1px solid var(--border-strong); border-radius:0.5rem; padding:0.45rem 2.75rem 0.45rem 0.75rem; font-size: 13px; color:#fff; outline:none;">
              <button type="button" id="music-reset" aria-label="Xóa từ khóa tìm kiếm nhạc nền" title="Xóa tìm kiếm" style="position:absolute; right:4px; width:36px; height:36px; justify-content:center; background:none; border:none; color:var(--fg-muted); font-size: 14px; cursor:pointer; padding:0; display:${searchQuery ? 'inline-flex' : 'none'}; align-items:center;">${ico('x', 14)}</button>
            </div>

            <!-- Mobile-Friendly Dropdown Selector -->
            <div class="mobile-only-filter">
              <select id="mobile-mfilter-select" aria-label="Lọc nhạc nền theo ngách và trạng thái YPP" style="width:100%; background:var(--surface); border:1px solid var(--border-strong); border-radius:0.5rem; padding:0.42rem 0.65rem; font-size: 12px; color:#fff; font-weight:600; outline:none;">
                <option value="all" ${currentFilter==='all'?'selected':''}>Tất cả (${totalCount})</option>
                <option value="safe" ${currentFilter==='safe'?'selected':''}>100% SAFE YPP (${safeCount})</option>
                <option value="cophong" ${currentFilter==='cophong'?'selected':''}>Cổ Trang / Tiên Hiệp (${cophongCount})</option>
                <option value="darkcrime" ${currentFilter==='darkcrime'?'selected':''}>Dark Crime / Kịch tính (${darkcrimeCount})</option>
                <option value="history" ${currentFilter==='history'?'selected':''}>Lịch sử &amp; Khảo cổ (${historyCount})</option>
                <option value="animation" ${currentFilter==='animation'?'selected':''}>Hoạt hình &amp; Trẻ em (${animationCount})</option>
                <option value="philosophy" ${currentFilter==='philosophy'?'selected':''}>Triết lý / Dưỡng sinh (${philosophyCount})</option>
                <option value="prophecy" ${currentFilter==='prophecy'?'selected':''}>Tiên tri / Bí ẩn (${prophecyCount})</option>
                <option value="wildlife" ${currentFilter==='wildlife'?'selected':''}>Sinh tồn (${wildlifeCount})</option>
                <option value="military" ${currentFilter==='military'?'selected':''}>Quân sự (${militaryCount})</option>
                <option value="ambient" ${currentFilter==='ambient'?'selected':''}>15-25p Ambient (${ambientCount})</option>
                <option value="review" ${currentFilter==='review'?'selected':''}>Thận trọng / CC-BY (${reviewCount})</option>
                <option value="copyrighted" ${currentFilter==='copyrighted'?'selected':''}>Bản quyền (${copyCount})</option>
              </select>
            </div>

            <!-- Chip bar: xuong dong trong khung (UI-fix 2026-10-09). -->
            <div id="music-chip-bar" style="display:flex; flex-wrap:wrap; gap:0.35rem; padding-bottom:0.15rem;">
              <button type="button" data-mfilter="all" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; border:1px solid ${currentFilter==='all'?'var(--brand)':'var(--border-strong)'}; background:${currentFilter==='all'?'var(--brand)':'var(--surface)'}; color:#fff;">Tất cả (${totalCount})</button>
              <button type="button" data-mfilter="safe" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='safe'?'#10b981':'var(--border-strong)'}; background:${currentFilter==='safe'?'#047857':'var(--surface)'}; color:#6ee7b7;">${icoColored('shield-check',14,'#6ee7b7')} SAFE (${safeCount})</button>
              <button type="button" data-mfilter="cophong" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='cophong'?'#ec4899':'var(--border-strong)'}; background:${currentFilter==='cophong'?'#be185d':'var(--surface)'}; color:#fbcfe8;">${icoColored('drama',14,'#fbcfe8')} Cổ Trang (${cophongCount})</button>
              <button type="button" data-mfilter="darkcrime" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='darkcrime'?'#f59e0b':'var(--border-strong)'}; background:${currentFilter==='darkcrime'?'#b45309':'var(--surface)'}; color:#fde68a;">${icoColored('fingerprint',14,'#fde68a')} Dark Crime (${darkcrimeCount})</button>
              <button type="button" data-mfilter="history" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='history'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='history'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('landmark',14,'#bae6fd')} Lịch sử (${historyCount})</button>
              <button type="button" data-mfilter="animation" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='animation'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='animation'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('sparkles',14,'#bae6fd')} Hoạt hình (${animationCount})</button>
              <button type="button" data-mfilter="philosophy" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='philosophy'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='philosophy'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('moon',14,'#bae6fd')} Triết lý (${philosophyCount})</button>
              <button type="button" data-mfilter="prophecy" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='prophecy'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='prophecy'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('wand-sparkles',14,'#bae6fd')} Tiên tri (${prophecyCount})</button>
              <button type="button" data-mfilter="wildlife" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='wildlife'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='wildlife'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('paw-print',14,'#bae6fd')} Sinh tồn (${wildlifeCount})</button>
              <button type="button" data-mfilter="military" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='military'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='military'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('swords',14,'#bae6fd')} Quân sự (${militaryCount})</button>
              <button type="button" data-mfilter="ambient" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='ambient'?'#38bdf8':'var(--border-strong)'}; background:${currentFilter==='ambient'?'#0369a1':'var(--surface)'}; color:#bae6fd;">${icoColored('hourglass',14,'#bae6fd')} Ambient (${ambientCount})</button>
              <button type="button" data-mfilter="review" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='review'?'#f59e0b':'var(--border-strong)'}; background:${currentFilter==='review'?'#92400e':'var(--surface)'}; color:#fde68a;">${icoColored('alert-circle',14,'#fde68a')} Thận trọng (${reviewCount})</button>
              <button type="button" data-mfilter="copyrighted" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='copyrighted'?'#ef4444':'var(--border-strong)'}; background:${currentFilter==='copyrighted'?'#b91c1c':'var(--surface)'}; color:#fca5a5;">${icoColored('alert-triangle',14,'#fca5a5')} Bản quyền (${copyCount})</button>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="music-studio-grid" style="flex:1; overflow-y:auto; padding:1rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.85rem; align-content:start;">
          </div>

          <!-- Sticky Now-Playing Mini-Bar -->
          <div id="music-now-playing" class="music-now-playing hidden">
            <div style="display:flex; align-items:center; gap:0.5rem; min-width:0; flex:1;">
              <span id="music-np-eq" style="color:var(--brand); display:inline-flex; align-items:center; flex-shrink:0;">${eqSvg()}</span>
              <span id="music-np-title" class="truncate" style="font-size:13px; font-weight:700; color:#fff;"></span>
            </div>
            <div style="display:flex; align-items:center; gap:0.35rem; flex-shrink:0;">
              <button type="button" id="music-np-prev" class="btn-ghost" aria-label="Bài trước" style="min-height:36px; min-width:36px; padding:0 0.5rem; border-radius:0.5rem; border:1px solid var(--border-strong); background:var(--surface); color:var(--fg); display:inline-flex; align-items:center; justify-content:center;">${ico('chevron-left', 14)}</button>
              <button type="button" id="music-np-toggle" class="h2-btn h2-btn--brand h2-btn--sm" aria-label="Tạm dừng" style="min-height:36px; min-width:36px; padding:0 0.7rem;">${ico('pause', 14)}</button>
              <button type="button" id="music-np-next" class="btn-ghost" aria-label="Bài tiếp" style="min-height:36px; min-width:36px; padding:0 0.5rem; border-radius:0.5rem; border:1px solid var(--border-strong); background:var(--surface); color:var(--fg); display:inline-flex; align-items:center; justify-content:center;">${ico('chevron-right', 14)}</button>
            </div>
          </div>
        </div>
      `;
      _bindShellEvents();
    }

    // uifix103: updateModalList — chỉ cập nhật .music-studio-grid + chip styles + nút reset
    // KHÔNG tạo lại #music-search hay phá <audio> đang phát.
    function updateModalList() {
      const cm = getCountMap();
      const filtered = getFilteredTracks();
      const { totalCount } = cm;

      // Update grid
      const grid = modal.querySelector('.music-studio-grid');
      if (grid) {
        grid.innerHTML = filtered.length
          ? filtered.map(renderTrackCard).join('')
          : `<div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--fg-muted); font-size: 14px;"><div>Không tìm thấy bài hát nào phù hợp bộ lọc</div><button type="button" id="music-empty-reset" style="margin-top:0.75rem; padding:0.4rem 0.9rem; border-radius:0.5rem; background:var(--brand); border:1px solid var(--brand); color:#fff; font-size:12px; font-weight:700; cursor:pointer;">Xóa bộ lọc &amp; Xem tất cả (${totalCount})</button></div>`;
        const emptyResetBtn = grid.querySelector('#music-empty-reset');
        if (emptyResetBtn) emptyResetBtn.onclick = () => {
          searchQuery = '';
          currentFilter = 'all';
          const musicSearch = modal.querySelector('#music-search');
          if (musicSearch) musicSearch.value = '';
          const mobileSelect = modal.querySelector('#mobile-mfilter-select');
          if (mobileSelect) mobileSelect.value = 'all';
          syncMusicUrlState(true);
          updateModalList();
        };
      }

      // Update reset button visibility
      const resetBtn = modal.querySelector('#music-reset');
      if (resetBtn) resetBtn.style.display = searchQuery ? 'inline-flex' : 'none';

      // Update chip active styles
      modal.querySelectorAll('[data-mfilter]').forEach(b => {
        const val = b.getAttribute('data-mfilter') || 'all';
        const isActive = val === currentFilter;
        // minimal: toggle border/background color based on active state
        // (chip styles already set in innerHTML; just update border/bg for active chip)
        const chipColors = {
          all:         { border: 'var(--brand)', bg: 'var(--brand)' },
          safe:        { border: '#10b981', bg: '#047857' },
          cophong:     { border: '#ec4899', bg: '#be185d' },
          darkcrime:   { border: '#f59e0b', bg: '#b45309' },
          history:     { border: '#38bdf8', bg: '#0369a1' },
          animation:   { border: '#38bdf8', bg: '#0369a1' },
          philosophy:  { border: '#38bdf8', bg: '#0369a1' },
          prophecy:    { border: '#38bdf8', bg: '#0369a1' },
          wildlife:    { border: '#38bdf8', bg: '#0369a1' },
          military:    { border: '#38bdf8', bg: '#0369a1' },
          ambient:     { border: '#38bdf8', bg: '#0369a1' },
          review:      { border: '#f59e0b', bg: '#92400e' },
          copyrighted: { border: '#ef4444', bg: '#b91c1c' },
        };
        const c = chipColors[val] || { border: 'var(--border-strong)', bg: 'var(--surface)' };
        b.style.borderColor = isActive ? c.border : 'var(--border-strong)';
        b.style.background  = isActive ? c.bg   : 'var(--surface)';
      });

      // Update mobile select
      const mobileSelect = modal.querySelector('#mobile-mfilter-select');
      if (mobileSelect) mobileSelect.value = currentFilter;
    }

    function _bindShellEvents() {
      const searchInput = modal.querySelector('#music-search');
      if (searchInput) {
        searchInput.oninput = (e) => {
          searchQuery = e.target.value;
          syncMusicUrlState(true);
          updateModalList();
          // giữ focus và con trỏ — KHÔNG gọi renderModalBody (tránh destroy #music-search)
        };
      }
      const resetBtn = modal.querySelector('#music-reset');
      if (resetBtn) {
        resetBtn.onclick = () => { searchQuery = ''; syncMusicUrlState(true); if (searchInput) { searchInput.value = ''; } updateModalList(); };
      }
      const mobileSelect = modal.querySelector('#mobile-mfilter-select');
      if (mobileSelect) {
        mobileSelect.onchange = () => {
          currentFilter = mobileSelect.value;
          syncMusicUrlState(true);
          updateModalList();
        };
      }
      modal.querySelectorAll('[data-mfilter]').forEach(b => {
        b.onclick = () => {
          const val = b.getAttribute('data-mfilter') || 'all';
          currentFilter = (val !== 'all' && currentFilter === val) ? 'all' : val;
          syncMusicUrlState(true);
          updateModalList();
        };
      });
      const stepTrack = (delta) => {
        const audios = Array.from(modal.querySelectorAll('.music-studio-grid audio'));
        if (!audios.length) return;
        const curIdx = activeAudioEl ? audios.indexOf(activeAudioEl) : -1;
        const nextIdx = curIdx === -1 ? 0 : (curIdx + delta + audios.length) % audios.length;
        const nextAudio = audios[nextIdx];
        if (nextAudio) {
          try { nextAudio.scrollIntoView({ block: 'nearest' }); } catch (_) {}
          const p = nextAudio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      };
      const npToggle = modal.querySelector('#music-np-toggle');
      const npPrev = modal.querySelector('#music-np-prev');
      const npNext = modal.querySelector('#music-np-next');
      if (npToggle) npToggle.onclick = () => {
        if (!activeAudioEl) return stepTrack(0);
        if (activeAudioEl.paused) {
          const p = activeAudioEl.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } else {
          activeAudioEl.pause();
        }
      };
      if (npPrev) npPrev.onclick = () => stepTrack(-1);
      if (npNext) npNext.onclick = () => stepTrack(1);
    }

    function renderModalBody() {
      const cm = getCountMap();
      renderModalShell(cm);
      updateModalList();
    }

    renderModalBody();
    syncMusicUrlState(true);
    /* UI-07 (2026-09-28): capture trigger khi mo + focus vao trong modal
       (close o dong 148 da restore _prevActiveElement nhung trc day khong ai gan).
       Escape + Tab-trap cho modal nay da co o global keydown (main.js muc Global Shortcuts). */
    modal._prevActiveElement = _prevActive;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (globalThis.H2Core && typeof globalThis.H2Core.focusModal === 'function') {
      globalThis.H2Core.focusModal(modal);
    }
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-open-music-studio');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const mfilter = btn.getAttribute('data-music-filter') || 'all';
      const mq = btn.getAttribute('data-music-query') || '';
      /* L4-A11Y-02: pass btn synchronously as trigger before async loadMusicCatalog */
      window.openMusicStudioModal(mfilter, mq, btn);
    }
  }, true);
})();
