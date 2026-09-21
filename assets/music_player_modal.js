// H2DEV Project - Interactive Music Studio Modal
(function() {
  let musicData = null;
  let currentFilter = 'all';
  let searchQuery = '';

  async function loadMusicCatalog() {
    if (musicData) return musicData;
    try {
      const res = await fetch('data/music_catalog.json?_t=' + Date.now());
      musicData = await res.json();
      return musicData;
    } catch (e) {
      console.error('Khong the load data/music_catalog.json', e);
      return null;
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderTrackCard(t) {
    const isSafe = t.copyrightRisk === 'SAFE';
    const isCopy = t.copyrightRisk === 'COPYRIGHTED';
    const badgeColor = isSafe ? 'background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); color:#6ee7b7;' :
                      (isCopy ? 'background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5;' :
                                'background:rgba(245,158,11,0.2); border:1px solid rgba(245,158,11,0.4); color:#fde68a;');
    const badgeText = isSafe ? '🟢 SAFE (YPP)' : (isCopy ? '🔴 BẢN QUYỀN (CẤM YPP)' : '🟡 CẦN THẬN TRỌNG');
    const rawSrc = t.streamUrl || ('assets/nhac-nen/' + (t.folder && t.folder !== 'Nhạc nền' ? t.folder + '/' : '') + t.fileName);
    const streamSrc = rawSrc + (rawSrc.includes('?') ? '&' : '?') + 'v=20260921-v49';

    return `
      <div style="background:#0f172a; border:1px solid ${isCopy ? '#7f1d1d' : '#1e293b'}; border-radius:0.75rem; padding:1rem; display:flex; flex-direction:column; gap:0.65rem; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.5rem;">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <span style="font-size:0.72rem; font-weight:800; padding:0.1rem 0.4rem; border-radius:0.35rem; background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.5); color:#d8b4fe; font-family:monospace;">${esc(t.id)}</span>
              <span style="font-size:0.72rem; font-weight:700; padding:0.1rem 0.4rem; border-radius:0.35rem; ${badgeColor}">${badgeText}</span>
              <span style="font-size:0.68rem; color:#94a3b8; font-family:monospace;">${esc(t.durationFormatted)} • ${t.sizeMB} MB</span>
            </div>
            <h4 style="font-size:0.85rem; font-weight:700; color:#f8fafc; margin:0.35rem 0 0 0; word-break:break-word;" title="${esc(t.fileName)}">${esc(t.fileName)}</h4>
            ${t.detectedTitle ? `<div style="font-size:0.75rem; color:#f87171; font-weight:600; margin-top:0.2rem;">⚠️ Phát hiện: ${esc(t.detectedTitle)}${t.detectedArtist ? ' — ' + esc(t.detectedArtist) : ''}</div>` : ''}
          </div>
          <a href="${esc(streamSrc)}" download="${esc(t.fileName)}" style="flex-shrink:0; font-size:0.72rem; padding:0.3rem 0.6rem; border-radius:0.4rem; background:#2563eb; color:#fff; text-decoration:none; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
            ⬇️ Tải
          </a>
        </div>

        <div style="font-size:0.72rem; color:#cbd5e1; line-height:1.4;">
          <div><strong style="color:#94a3b8;">Mood:</strong> ${esc(t.mood || t.moodDescription)}</div>
          <div><strong style="color:#94a3b8;">Nhạc cụ:</strong> ${esc(Array.isArray(t.leadInstruments) ? t.leadInstruments.join(', ') : 'Dàn nhạc')}</div>
          <div><strong style="color:#94a3b8;">Ngách:</strong> <span style="color:#38bdf8;">${esc(t.categoryNiche)}</span></div>
        </div>

        <div style="margin-top:auto; padding-top:0.3rem;">
          <audio controls preload="none" style="width:100%; height:36px; border-radius:0.35rem; outline:none;" src="${esc(streamSrc)}"></audio>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.68rem; color:#64748b; border-top:1px solid #1e293b; padding-top:0.4rem;">
          <span class="truncate">📁 Local: ${esc(t.fileName)}</span>
          <button type="button" onclick="navigator.clipboard.writeText('${esc(t.localAbsPath || t.fileName).replace(/'/g, "\\'")}'); alert('Đã copy đường dẫn local: ${esc(t.id)}');" style="background:none; border:none; color:#38bdf8; cursor:pointer; font-size:0.68rem; font-weight:600; padding:0;">📋 Copy Path</button>
        </div>
      </div>
    `;
  }

  window.openMusicStudioModal = async function(initialFilter = 'all') {
    currentFilter = initialFilter;
    const cat = await loadMusicCatalog();
    if (!cat || !cat.tracks) {
      alert('Không thể tải kho nhạc nền. Vui lòng thử lại!');
      return;
    }

    let modal = document.getElementById('music-studio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'music-studio-modal';
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:100005; background:rgba(0,0,0,0.92); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
      document.body.appendChild(modal);

      modal.onclick = (e) => {
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
        if (currentFilter === 'safe' && t.copyrightRisk !== 'SAFE') return false;
        if (currentFilter === 'copyrighted' && t.copyrightRisk !== 'COPYRIGHTED') return false;
        if (currentFilter === 'review' && t.copyrightRisk !== 'REVIEW') return false;
        if (currentFilter === 'history' && (!t.categoryNiche || (!t.categoryNiche.includes('Lịch sử') && !t.categoryNiche.includes('Khảo Cổ') && !t.categoryNiche.includes('Everyday')))) return false;
        if (currentFilter === 'cophong' && (!t.categoryNiche || (!t.categoryNiche.includes('Cổ Trang') && !t.categoryNiche.includes('Tiên Hiệp') && !t.categoryNiche.includes('Guzheng') && !t.categoryNiche.includes('Pipa') && !t.categoryNiche.includes('Gamela')))) return false;
        if (currentFilter === 'darkcrime' && (!t.categoryNiche || (!t.categoryNiche.includes('Dark Crime') && !t.categoryNiche.includes('Tài Chính') && !t.categoryNiche.includes('Kinh Doanh') && !t.categoryNiche.includes('Winter')))) return false;
        if (currentFilter === 'animation' && (!t.categoryNiche || (!t.categoryNiche.includes('Hoạt Hình') && !t.categoryNiche.includes('Trẻ Em') && !t.categoryNiche.includes('Phép Thuật') && !t.categoryNiche.includes('Sugar Plum')))) return false;
        if (currentFilter === 'prophecy' && (!t.categoryNiche || !t.categoryNiche.includes('Tiên tri'))) return false;
        if (currentFilter === 'philosophy' && (!t.categoryNiche || (!t.categoryNiche.includes('Vũ trụ') && !t.categoryNiche.includes('Triết lý') && !t.categoryNiche.includes('Sức Khỏe') && !t.categoryNiche.includes('Senior') && !t.categoryNiche.includes('Kinh Thánh') && !t.categoryNiche.includes('Tôn Giáo')))) return false;
        if (currentFilter === 'wildlife' && (!t.categoryNiche || !t.categoryNiche.includes('Sinh tồn'))) return false;
        if (currentFilter === 'military' && (!t.categoryNiche || (!t.categoryNiche.includes('Quân sự') && !t.categoryNiche.includes('Chiến tranh') && !t.categoryNiche.includes('Mars')))) return false;
        if (currentFilter === 'ambient' && (!t.categoryNiche || !t.categoryNiche.includes('Long-form'))) return false;

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
      const historyCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Lịch sử') || t.categoryNiche.includes('Khảo Cổ') || t.categoryNiche.includes('Everyday'))).length;
      const cophongCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Cổ Trang') || t.categoryNiche.includes('Tiên Hiệp') || t.categoryNiche.includes('Guzheng') || t.categoryNiche.includes('Pipa') || t.categoryNiche.includes('Gamela'))).length;
      const darkcrimeCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Dark Crime') || t.categoryNiche.includes('Tài Chính') || t.categoryNiche.includes('Kinh Doanh') || t.categoryNiche.includes('Winter'))).length;
      const animationCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Hoạt Hình') || t.categoryNiche.includes('Trẻ Em') || t.categoryNiche.includes('Phép Thuật') || t.categoryNiche.includes('Sugar Plum'))).length;
      const prophecyCount = cat.tracks.filter(t => t.categoryNiche && t.categoryNiche.includes('Tiên tri')).length;
      const philosophyCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Vũ trụ') || t.categoryNiche.includes('Triết lý') || t.categoryNiche.includes('Sức Khỏe') || t.categoryNiche.includes('Senior') || t.categoryNiche.includes('Kinh Thánh') || t.categoryNiche.includes('Tôn Giáo'))).length;
      const wildlifeCount = cat.tracks.filter(t => t.categoryNiche && t.categoryNiche.includes('Sinh tồn')).length;
      const militaryCount = cat.tracks.filter(t => t.categoryNiche && (t.categoryNiche.includes('Quân sự') || t.categoryNiche.includes('Chiến tranh') || t.categoryNiche.includes('Mars'))).length;
      const ambientCount = cat.tracks.filter(t => t.categoryNiche && t.categoryNiche.includes('Long-form')).length;

      modal.innerHTML = `
        <div style="position:relative; width:100%; max-width:1180px; max-height:92vh; background:#070a12; border:1px solid #334155; border-radius:1rem; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.95);">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:#0f172a; border-bottom:1px solid #1e293b; gap:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span style="font-size:1.35rem;">🎧</span>
                <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">Trạm Nhạc Nền Edit Video Chuẩn 15 Ngách YouTube</h3>
                <span style="font-size:0.72rem; font-weight:700; padding:0.15rem 0.5rem; border-radius:0.35rem; background:rgba(168,85,247,0.25); border:1px solid rgba(168,85,247,0.5); color:#e9d5ff;">${totalCount} Tracks Đã Audit Gemini & FFprobe (${safeCount} SAFE YPP)</span>
              </div>
              <p style="font-size:0.75rem; color:#94a3b8; margin:0.25rem 0 0 0;">Nghe thử trực tiếp, kiểm định bản quyền 100% $0.00 Content ID Safe, phân chia theo 15 ngách chuyên dụng và tải MP3 tức thì.</p>
            </div>
            <button type="button" id="close-music-studio" style="padding:0.4rem 0.85rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#e2e8f0; font-size:0.75rem; font-weight:700; cursor:pointer;" title="Đóng [Esc]">✕ Đóng</button>
          </div>

          <div style="padding:0.85rem 1.25rem; background:#090d16; border-bottom:1px solid #1e293b; display:flex; flex-direction:column; gap:0.65rem;">
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <input type="text" id="music-search" placeholder="🔍 Tìm theo mã track (vd: MUSIC-046), tên bài, nhạc cụ (Guzheng, Pipa, Violin), mood, ngách YouTube..." value="${esc(searchQuery)}" style="flex:1; background:#0f172a; border:1px solid #334155; border-radius:0.5rem; padding:0.5rem 0.75rem; font-size:0.8rem; color:#fff; outline:none;">
              <button type="button" id="music-reset" style="padding:0.5rem 0.85rem; border-radius:0.5rem; background:#1e293b; border:1px solid #334155; color:#94a3b8; font-size:0.75rem; font-weight:600; cursor:pointer;">Reset</button>
            </div>

            <div style="display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:0.2rem; scrollbar-width:thin;">
              <button type="button" data-mfilter="all" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='all'?'#a855f7':'#1e293b'}; background:${currentFilter==='all'?'#7e22ce':'#0f172a'}; color:#fff;">Tất cả (${totalCount})</button>
              <button type="button" data-mfilter="safe" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='safe'?'#10b981':'#1e293b'}; background:${currentFilter==='safe'?'#047857':'#0f172a'}; color:#6ee7b7;">🟢 100% SAFE YPP (${safeCount})</button>
              <button type="button" data-mfilter="cophong" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='cophong'?'#ec4899':'#1e293b'}; background:${currentFilter==='cophong'?'#be185d':'#0f172a'}; color:#fbcfe8;">🏮 Cổ Trang / Tiên Hiệp (${cophongCount})</button>
              <button type="button" data-mfilter="darkcrime" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='darkcrime'?'#f59e0b':'#1e293b'}; background:${currentFilter==='darkcrime'?'#b45309':'#0f172a'}; color:#fde68a;">🕵️ Dark Crime / Kịch tính (${darkcrimeCount})</button>
              <button type="button" data-mfilter="history" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='history'?'#38bdf8':'#1e293b'}; background:${currentFilter==='history'?'#0369a1':'#0f172a'}; color:#bae6fd;">🏛️ Lịch sử & Khảo cổ (${historyCount})</button>
              <button type="button" data-mfilter="animation" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='animation'?'#8b5cf6':'#1e293b'}; background:${currentFilter==='animation'?'#6d28d9':'#0f172a'}; color:#ddd6fe;">✨ Hoạt hình & Trẻ em (${animationCount})</button>
              <button type="button" data-mfilter="philosophy" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='philosophy'?'#38bdf8':'#1e293b'}; background:${currentFilter==='philosophy'?'#0369a1':'#0f172a'}; color:#bae6fd;">🌌 Triết lý / Dưỡng sinh (${philosophyCount})</button>
              <button type="button" data-mfilter="prophecy" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='prophecy'?'#38bdf8':'#1e293b'}; background:${currentFilter==='prophecy'?'#0369a1':'#0f172a'}; color:#bae6fd;">🔮 Tiên tri / Bí ẩn (${prophecyCount})</button>
              <button type="button" data-mfilter="wildlife" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='wildlife'?'#38bdf8':'#1e293b'}; background:${currentFilter==='wildlife'?'#0369a1':'#0f172a'}; color:#bae6fd;">🐾 Sinh tồn (${wildlifeCount})</button>
              <button type="button" data-mfilter="military" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='military'?'#38bdf8':'#1e293b'}; background:${currentFilter==='military'?'#0369a1':'#0f172a'}; color:#bae6fd;">⚔️ Quân sự (${militaryCount})</button>
              <button type="button" data-mfilter="ambient" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='ambient'?'#38bdf8':'#1e293b'}; background:${currentFilter==='ambient'?'#0369a1':'#0f172a'}; color:#bae6fd;">⏳ 15-25p Ambient (${ambientCount})</button>
              <button type="button" data-mfilter="copyrighted" style="padding:0.3rem 0.7rem; border-radius:0.4rem; font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ${currentFilter==='copyrighted'?'#ef4444':'#1e293b'}; background:${currentFilter==='copyrighted'?'#b91c1c':'#0f172a'}; color:#fca5a5;">🔴 Bản quyền (${copyCount})</button>
            </div>
          </div>

          <div class="music-studio-grid" style="flex:1; overflow-y:auto; padding:1.25rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1rem; align-content:start;">
            ${filtered.length ? filtered.map(renderTrackCard).join('') : '<div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:#64748b; font-size:0.9rem;">Không tìm thấy bài hát nào phù hợp bộ lọc</div>'}
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
        resetBtn.onclick = () => { searchQuery = ''; currentFilter = 'all'; renderModalBody(); };
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
