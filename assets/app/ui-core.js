/* H2UICore - G3 helpers extract from index.html */
(function (global) {
  'use strict';
function safeArray(value) { return Array.isArray(value) ? value : []; }

function nicheKeyFor(ngach) { const map = (global.H2Taxonomy && global.H2Taxonomy.NICHE_MAP) || {}; return map[ngach] || ngach; }

function xanhBadge(x) {
  if (x === true) return ['badge-green', 'XANH'];
  if (x === 'CÓ MẪU TĂNG') return ['badge-blue', 'CÓ MẪU TĂNG'];
  if (x === 'CÓ ĐIỀU KIỆN') return ['badge-amber', 'CÓ ĐK'];
  if (x === 'THẬN TRỌNG') return ['badge-amber', 'THẬN TRỌNG'];
  if (x === 'CHƯA ĐỦ BẰNG CHỨNG') return ['badge-muted', 'CHƯA ĐỦ'];
  if (x === 'ĐỎ') return ['badge-red', 'ĐỎ'];
  if (x === 'META') return ['badge-muted', 'META'];
  return ['badge-muted', String(x || '')];
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); } // CANONICAL — khớp H2Core.esc

function trapFocus(container, e) {
  if (e.key !== 'Tab' || !container) return;
  if (!container.contains(document.activeElement)) {
    e.preventDefault();
    focusModal(container);
    return;
  }
  const focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function focusModal(modal) {
  if (!modal) return;
  try { modal.focus(); } catch (e) {}
  if (!modal.contains(document.activeElement)) {
    const f = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f) try { f.focus(); } catch (e) {}
  }
  if (!modal.contains(document.activeElement)) {
    // force: đặt tabindex nếu thiếu rồi focus container
    if (!modal.hasAttribute('tabindex')) modal.tabIndex = -1;
    try { modal.focus({ preventScroll: true }); } catch (e) {}
  }
}

function fmtBytes(n) { if (!n) return ''; if (n > 1e9) return (n / 1e9).toFixed(2) + ' GB'; if (n > 1e6) return (n / 1e6).toFixed(0) + ' MB'; return (n / 1e3).toFixed(0) + ' KB'; }

function fmtMb(mb) { if (!mb) return ''; return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : mb.toFixed(0) + ' MB'; }

function loadChecks() { try { return JSON.parse(localStorage.getItem('h2dev-checklist') || '{}'); } catch (e) { return {}; } }

function saveCheck(id, on) { const m = loadChecks(); m[id] = !!on; localStorage.setItem('h2dev-checklist', JSON.stringify(m)); }

function loadWatched() { try { return JSON.parse(localStorage.getItem('h2dev-watched') || '{}'); } catch (e) { return {}; } }

function watchedBadge(sku) {
  const w = loadWatched()[sku];
  if (!w) return '';
  const d = Number(w.d) || 0, t = Number(w.t) || 0;
  const ratio = (d > 0 && t > 0) ? Math.min(1, t / d) : 0;
  const done = Boolean(w.watched) || ratio >= 0.95;
  if (done) return `<span class="badge badge-green" title="Đã xem hết">✓ Đã xem</span>`;
  if (ratio > 0.02) return `<span class="badge badge-amber" title="Đang xem dở ${Math.round(ratio * 100)}% — Xem tiếp">Dở ${Math.round(ratio * 100)}%</span>`;
  return '';
}

function watchedProgress(sku) {
  const w = loadWatched()[sku];
  if (!w) return '';
  const d = Number(w.d) || 0, t = Number(w.t) || 0;
  const ratio = (d > 0 && t > 0) ? Math.min(100, Math.round(t / d * 100)) : 0;
  if (ratio <= 0) return '';
  return `<div class="absolute bottom-0 left-0 right-0 h-1 bg-ink-900/80"><div class="h-full bg-brand-500" style="width:${ratio}%"></div></div>`;
}

function watchedResumeLabel(sku) {
  const w = loadWatched()[sku];
  if (!w) return '';
  const d = Number(w.d) || 0, t = Number(w.t) || 0;
  const ratio = (d > 0 && t > 0) ? Math.min(1, t / d) : 0;
  if (w.watched || ratio >= 0.95) return '';
  if (ratio > 0.02) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `Xem tiếp (${m}:${String(s).padStart(2, '0')})`; }
  return '';
}

function highlightQuery(text, query) {
  if (!text || !query) return esc(text || '');
  const cleanQ = query.trim();
  if (!cleanQ) return esc(text);
  const escapedQ = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQ})`, 'gi');
  const safeText = esc(text);
  return safeText.replace(regex, '<mark class="bg-brand-500/35 text-brand-200 px-0.5 rounded font-bold">$1</mark>');
}


function statCard(icon, label, value, sub, tabTarget, live) {
  const isSvg = typeof icon === 'string' && icon.includes('<svg');
  const glyph = isSvg ? icon : (icon ? `<span class="stat-glyph">${icon}</span>` : '');
  const clickAttr = tabTarget ? ` data-open-tab="${esc(tabTarget)}" role="button" tabindex="0" title="Mở tab ${esc(label)}"` : '';
  return `<div class="bento-card${tabTarget ? ' cursor-pointer hover:border-brand/40 transition-colors' : ''}"${clickAttr}>
<div class="stat-icon">${glyph}</div>
<div class="stat-body">
  <div class="stat-value"${live ? ' aria-live="polite"': ''}>${value}</div>
  <div class="stat-label">${label}</div>
  ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
</div>
${tabTarget ? `<span class="stat-arrow text-gray-500 text-xs font-mono">→</span>` : ''}
  </div>`;
}
function pageBanner(title, sub, stats) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Tránh thẻ thứ 5 bị lẻ bóng 1 mình trên mobile (UX Pro Max - Rhythm & Grid stability)
  const displayStats = (stats && stats.length === 5 && isMobile) ? stats.slice(0, 4) : stats;
  const cards = (displayStats || []).map(s => statCard(s.icon, s.label, s.value, s.sub || '', s.tab || '', !!s.live)).join('');
  return `
  ${sub ? `<p class="page-lede">${sub}</p>` : ''}
  ${cards ? `<div class="bento-grid mb-6">${cards}</div>` : ''}`;
}

  global.H2UICore = {
    safeArray: safeArray,
    nicheKeyFor: nicheKeyFor,
    xanhBadge: xanhBadge,
    esc: esc,
    trapFocus: trapFocus,
    focusModal: focusModal,
    fmtBytes: fmtBytes,
    fmtMb: fmtMb,
    loadChecks: loadChecks,
    saveCheck: saveCheck,
    loadWatched: loadWatched,
    watchedBadge: watchedBadge,
    watchedProgress: watchedProgress,
    watchedResumeLabel: watchedResumeLabel,
    highlightQuery: highlightQuery,
    statCard: statCard,
    pageBanner: pageBanner
  };
})(typeof window !== 'undefined' ? window : globalThis);
