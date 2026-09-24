// H2DEV Project - Interactive Music Studio Modal
(function() {
  let musicData = null;
  let currentFilter = 'all';
  let searchQuery = '';

  async function loadMusicCatalog() {
    if (musicData) return musicData;
    try {
      const res = await fetch('data/music_catalog.json?v=20260922-g2');
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

  /* Toast chuan: dung .toast-msg (h2dev-shell.css muc 9).
   * Modal co z-index:100005 nen toast phai cao hon de khong bi che. */
  function showToast(msg) {
    let el = document.querySelector('.toast-msg.js-music-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-msg js-music-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.style.zIndex = '100010';
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
    const streamSrc = rawSrc + (rawSrc.includes('?') ? '&' : '?') + 'v=20260922-g2';

    return `
      <div style="background:#0f172a; border:1px solid ${isCopy ? '#7f1d1d' : '#1e293b'}; border-radius:0.75rem; padding:0.85rem 1rem; display:flex; flex-direction:column; gap:0.5rem; box-shadow:0 4px 14px rgba(0,0,0,0.35);">
        <!-- Row 1: Badges + Download -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap; min-width:0;">
            <span style="font-size: 12px; font-weight: 700; padding:0.1rem 0.4rem; border-radius:0.35rem; background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.5); color:#d8b4fe; font-family:monospace;">${esc(t.id)}</span>
            <span style="font-size: 11px; font-weight:700; padding:0.1rem 0.4rem; border-radius:0.35rem; ${badgeColor}">${badgeText}</span>
            <span style="font-size: 11px; color:#94a3b8; font-family:monospace;">${esc(t.durationFormatted)} • ${t.sizeMB} MB</span>
          </div>
          <a href="${esc(streamSrc)}" download="${esc(t.fileName)}" style="flex-shrink:0; font-size: 12px; padding:0.25rem 0.6rem; border-radius:0.4rem; background:#2563eb; color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;">
            ${ico('download', 14)} Tải MP3
          </a>
        </div>

        <!-- Row 2: Title -->
        <div>
          <h4 style="font-size: 14px; font-weight:700; color:#f8fafc; margin:0; word-break:break-word; line-height:1.35;" title="${esc(t.fileName)}">${esc(t.fileName)}</h4>
          ${t.detectedTitle ? `<div style="font-size: 12px; color:#f87171; font-weight:600; margin-top:0.15rem; display:flex; align-items:center; gap:0.2rem;">${ico('alert-triangle', 14)} <span>Phát hiện: ${esc(t.detectedTitle)}${t.detectedArtist ? ' — ' + esc(t.detectedArtist) : ''}</span></div>` : ''}
        </div>

        <!-- Row 3: Meta Info (Ngách & Mood compact) -->
        <div style="font-size: 12px; color:#cbd5e1; line-height:1.4; display:flex; flex-direction:column; gap:0.15rem;">
          <div class="truncate"><strong style="color:#94a3b8;">Ngách:</strong> <span style="color:#38bdf8; font-weight:600;">${esc(t.categoryNiche)}</span></div>
          <div class="truncate" title="${esc(t.mood || t.moodDescription)}"><strong style="color:#94a3b8;">Mood:</strong> ${esc(t.mood || t.moodDescription)}</div>
        </div>

        <!-- Row 4: Audio Player -->
        <div style="margin-top:auto; padding-top:0.2rem;">
          <audio controls preload="none" style="width:100%; height:34px; border-radius:0.35rem; outline:none;" src="${esc(streamSrc)}"></audio>
        </div>

        <!-- Row 5: Footer & Copy Path (Chống tràn viền) -->
        <div style="display:flex; align-items:center; justify-content:space-between; font-size: 11px; color:#64748b; border-top:1px solid #1e293b; padding-top:0.35rem; gap:0.5rem; min-width:0;">
          <span class="truncate" style="flex:1; min-width:0; display:inline-flex; align-items:center; gap:0.25rem;" title="${esc(t.fileName)}">${ico('folder', 14)} <span class="truncate">${esc(t.fileName)}</span></span>
          <button type="button" class="js-copy-music-path" data-copy-path="${esc(t.localAbsPath || t.fileName)}" data-copy-id="${esc(t.id)}" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size: 11px; font-weight:700; padding:0; flex-shrink:0; white-space:nowrap; display:inline-flex; align-items:center; gap:0.2rem;">${ico('clipboard-copy', 14)} Copy Path</button>
        </div>
      </div>
    `;
  }

  window.openMusicStudioModal = async function(initialFilter = 'all') {
    currentFilter = initialFilter;
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
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:100005; background:rgba(0,0,0,0.92); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
      document.body.appendChild(modal);

      modal.onclick = (e) => {
        const copyBtn = e.target.closest && e.target.closest('.js-copy-music-path');
        if (copyBtn) {
          const path = copyBtn.getAttribute('data-copy-path') || '';
          const id = copyBtn.getAttribute('data-copy-id') || '';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(path)
              .then(() => showToast('Đã copy đường dẫn local: ' + id))
              .catch(() => showToast('Không copy được path: ' + id));
          } else {
            showToast('Trình duyệt không hỗ trợ clipboard API — path: ' + path);
          }
          return;
        }
        if (e.target === modal || e.target.id === 'close-music-studio' || e.target.closest('#close-music-studio')) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
          modal.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
        }
      };
    }

    function renderModalBody() {
      const q = searchQuery.toLowerCase().trim();
      const filtered = cat.tracks.filter(t => {
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
        return hay.includes(q);
      });

      const totalCount = cat.tracks.length;
      const safeCount = cat.tracks.filter(t => t.copyrightRisk === 'SAFE').length;
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

      modal.innerHTML = `
        <div style="position:relative; width:100%; max-width:1180px; max-height:92vh; background:#070a12; border:1px solid #334155; border-radius:1rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.95);">
          <!-- Compact Header -->
          <div style="display:flex; align-items:center; justify-content:space-between; padding:0.8rem 1.1rem; background:#0f172a; border-bottom:1px solid #1e293b; gap:0.75rem; flex-shrink:0;">
            <div style="min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                <span style="color:#a855f7;display:inline-flex;align-items:center;">${ico('headphones', 24)}</span>
                <h3 style="font-size: 16px; font-weight: 700; color:#fff; margin:0;" class="truncate">Trạm Nhạc Nền ${nicheCount} Ngách YouTube</h3>
                <span style="font-size: 11px; font-weight:700; padding:0.12rem 0.5rem; border-radius:0.35rem; background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.5); color:#e9d5ff;">${totalCount} Tracks (${safeCount} SAFE YPP)</span>
              </div>
            </div>
            <button type="button" id="close-music-studio" style="width:32px; height:32px; border-radius:50%; background:#1e293b; border:1px solid #334155; color:#e2e8f0; font-size: 14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;" title="Đóng [Esc]">${ico('x', 16)}</button>
          </div>

          <!-- Sticky Search & Filter Toolbar -->
          <div style="padding:0.65rem 1.1rem; background:#090d16; border-bottom:1px solid #1e293b; display:flex; flex-direction:column; gap:0.5rem; flex-shrink:0;">
            <!-- Search Bar with built-in clear -->
            <div style="position:relative; display:flex; align-items:center;">
              <input type="text" id="music-search" placeholder="Tìm mã (MUSIC-046), tên bài, mood, nhạc cụ..." value="${esc(searchQuery)}" style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:0.5rem; padding:0.45rem 2rem 0.45rem 0.75rem; font-size: 13px; color:#fff; outline:none;">
              ${searchQuery ? `<button type="button" id="music-reset" style="position:absolute; right:8px; background:none; border:none; color:#94a3b8; font-size: 14px; cursor:pointer; padding:2px 6px; display:inline-flex; align-items:center;">${ico('x', 14)}</button>` : ''}
            </div>

            <!-- Mobile-Friendly Dropdown Selector -->
            <div class="mobile-only-filter">
              <select id="mobile-mfilter-select" style="width:100%; background:#0f172a; border:1px solid #334155; border-radius:0.5rem; padding:0.42rem 0.65rem; font-size: 12px; color:#fff; font-weight:600; outline:none;">
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
                <option value="copyrighted" ${currentFilter==='copyrighted'?'selected':''}>Bản quyền (${copyCount})</option>
              </select>
            </div>

            <!-- Compact Single-Line Swipeable Chip Bar -->
            <div style="display:flex; gap:0.35rem; overflow-x:auto; padding-bottom:0.15rem; white-space:nowrap; -webkit-overflow-scrolling:touch; scrollbar-width:none;">
              <button type="button" data-mfilter="all" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; border:1px solid ${currentFilter==='all'?'#a855f7':'#1e293b'}; background:${currentFilter==='all'?'#7e22ce':'#0f172a'}; color:#fff;">Tất cả (${totalCount})</button>
              <button type="button" data-mfilter="safe" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='safe'?'#10b981':'#1e293b'}; background:${currentFilter==='safe'?'#047857':'#0f172a'}; color:#6ee7b7;">${icoColored('shield-check',14,'#6ee7b7')} SAFE (${safeCount})</button>
              <button type="button" data-mfilter="cophong" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='cophong'?'#ec4899':'#1e293b'}; background:${currentFilter==='cophong'?'#be185d':'#0f172a'}; color:#fbcfe8;">${icoColored('drama',14,'#fbcfe8')} Cổ Trang (${cophongCount})</button>
              <button type="button" data-mfilter="darkcrime" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='darkcrime'?'#f59e0b':'#1e293b'}; background:${currentFilter==='darkcrime'?'#b45309':'#0f172a'}; color:#fde68a;">${icoColored('fingerprint',14,'#fde68a')} Dark Crime (${darkcrimeCount})</button>
              <button type="button" data-mfilter="history" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='history'?'#38bdf8':'#1e293b'}; background:${currentFilter==='history'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('landmark',14,'#bae6fd')} Lịch sử (${historyCount})</button>
              <button type="button" data-mfilter="animation" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='animation'?'#8b5cf6':'#1e293b'}; background:${currentFilter==='animation'?'#6d28d9':'#0f172a'}; color:#ddd6fe;">${icoColored('sparkles',14,'#ddd6fe')} Hoạt hình (${animationCount})</button>
              <button type="button" data-mfilter="philosophy" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='philosophy'?'#38bdf8':'#1e293b'}; background:${currentFilter==='philosophy'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('moon',14,'#bae6fd')} Triết lý (${philosophyCount})</button>
              <button type="button" data-mfilter="prophecy" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='prophecy'?'#38bdf8':'#1e293b'}; background:${currentFilter==='prophecy'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('wand-sparkles',14,'#bae6fd')} Tiên tri (${prophecyCount})</button>
              <button type="button" data-mfilter="wildlife" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='wildlife'?'#38bdf8':'#1e293b'}; background:${currentFilter==='wildlife'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('paw-print',14,'#bae6fd')} Sinh tồn (${wildlifeCount})</button>
              <button type="button" data-mfilter="military" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='military'?'#38bdf8':'#1e293b'}; background:${currentFilter==='military'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('swords',14,'#bae6fd')} Quân sự (${militaryCount})</button>
              <button type="button" data-mfilter="ambient" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='ambient'?'#38bdf8':'#1e293b'}; background:${currentFilter==='ambient'?'#0369a1':'#0f172a'}; color:#bae6fd;">${icoColored('hourglass',14,'#bae6fd')} Ambient (${ambientCount})</button>
              <button type="button" data-mfilter="copyrighted" style="padding:0.25rem 0.65rem; border-radius:0.4rem; font-size: 12px; font-weight:700; cursor:pointer; flex-shrink:0; display:inline-flex; align-items:center; gap:0.25rem; border:1px solid ${currentFilter==='copyrighted'?'#ef4444':'#1e293b'}; background:${currentFilter==='copyrighted'?'#b91c1c':'#0f172a'}; color:#fca5a5;">${icoColored('alert-triangle',14,'#fca5a5')} Bản quyền (${copyCount})</button>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="music-studio-grid" style="flex:1; overflow-y:auto; padding:1rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.85rem; align-content:start;">
            ${filtered.length ? filtered.map(renderTrackCard).join('') : '<div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:#64748b; font-size: 14px;">Không tìm thấy bài hát nào phù hợp bộ lọc</div>'}
          </div>
        </div>
      `;

      const searchInput = modal.querySelector('#music-search');
      if (searchInput) {
        searchInput.oninput = (e) => {
          searchQuery = e.target.value;
          renderModalBody();
          const nextInput = modal.querySelector('#music-search');
          if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length); }
        };
      }
      const resetBtn = modal.querySelector('#music-reset');
      if (resetBtn) {
        resetBtn.onclick = () => { searchQuery = ''; renderModalBody(); };
      }
      const mobileSelect = modal.querySelector('#mobile-mfilter-select');
      if (mobileSelect) {
        mobileSelect.onchange = () => {
          currentFilter = mobileSelect.value;
          renderModalBody();
        };
      }
      modal.querySelectorAll('[data-mfilter]').forEach(b => {
        b.onclick = () => {
          currentFilter = b.getAttribute('data-mfilter');
          renderModalBody();
        };
      });
    }

    renderModalBody();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-open-music-studio');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const mfilter = btn.getAttribute('data-music-filter') || 'all';
      window.openMusicStudioModal(mfilter);
    }
  }, true);
})();
