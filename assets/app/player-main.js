/* G6 extract from player.html */

/**
 * PHASE 3 (2026-09-23): helper sinh the icon chuan thay cho emoji.
 * Dung: ico('file-text')  ->  <span class="h2-icon h2-icon--16" data-h2i="file-text" aria-hidden="true"></span>
 * Sua: ico('file-text', 20) de doi kich thuoc (chi 14/16/20/24).
 */
function ico(name, size) {
  return '<span class="h2-icon h2-icon--' + (size || 16) + '" data-h2i="' + name + '" aria-hidden="true"></span>';
}

/**
 * PHASE 3 (2026-09-23): bo emoji TRANG TRI o dau chuoi du lieu (📌 ⚠️ ✨ 👁 🌐...).
 * Ly do: data/video_insights.json co 274 emoji nam TRONG noi dung text that
 * (key_takeaways, avoid_flags). Khong sua data (dung quy tac "sua data phai qua script"),
 * thay vao do loc o TANG RENDER — dung noi, khong pha du lieu goc.
 * KHONG dung quoc ky (co the la nhan ngon ngu) va khong dung emoji giua cau.
 */
function stripLeadEmoji(s) {
  return String(s == null ? '' : s)
    .replace(/^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{23F3}\u{23F1}\u{2B50}\u{2B1B}\u{2B1C}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2460}-\u{24FF}]+/u, '')
    .trim();
}

/**
 * PHASE 3: bo emoji trang tri NGOAI quoc ky (🌐 ✨ ...) nhung GIU 🇻🇳 🇯🇵 (nhan ngon ngu).
 * Dung cho chuoi nhu "🇻🇳 Việt / 🌐 Toàn cầu" -> "🇻🇳 Việt / Toàn cầu".
 */
function stripDecorEmoji(s) {
  return String(s == null ? '' : s)
    .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2705}\u{274C}\u{23F3}\u{23F1}\u{2B50}\u{2B1B}\u{2B1C}]+/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const params = new URLSearchParams(location.search);
function resolveSku() {
  const pathParts = location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2 && (pathParts[0].toLowerCase() === 'lotrinh' || pathParts[0].toLowerCase() === 'video')) {
    return decodeURIComponent(pathParts[1]);
  }
  return params.get('sku');
}
const sku = resolveSku();
try {
  if (sku && window.self !== window.top && window.top.location.origin === window.location.origin) {
    window.top.history.replaceState(null, '', '/lotrinh/' + encodeURIComponent(sku));
  }
} catch(e) {}
const CAT = '/data/catalog_full.json';
/**
 * N11 FIX (2026-09-23): uy quyen cho H2Core (nguon su that duy nhat) khi co, fallback khi vang.
 * Truoc day la ban sao tay ("CANONICAL — khớp H2Core.esc") -> de troi lech.
 * player.html nay da nap /assets/h2dev-core.js truoc file nay.
 */
function esc(s){
  if (window.H2Core && typeof window.H2Core.esc === 'function') return window.H2Core.esc(s);
  return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtBytes(n){
  if (window.H2Core && typeof window.H2Core.fmtBytes === 'function') return window.H2Core.fmtBytes(n);
  if(!n)return'';if(n>1e9)return(n/1e9).toFixed(2)+' GB';if(n>1e6)return(n/1e6).toFixed(0)+' MB';return(n/1e3).toFixed(0)+' KB';
}
function docName(p){const n=(p||'').split('/').pop().split('?')[0];try{return decodeURIComponent(n);}catch(e){return n;}}
function badge(label, cls){ return `<span class="badge ${cls}">${label}</span>`; }
function cleanDocName(name, file){
  let t=String(name||'').trim();
  if(/^https?:\/\//i.test(t)){
    const m=t.match(/\/d\/([a-zA-Z0-9_-]{6,})/);
    return m ? ('Tài nguyên Drive · '+m[1].slice(0,8)) : 'Tài nguyên Drive';
  }
  t=t.replace(/\s*\((bấm vào đây|bấm vào tại đây|bấm vào đây để liên hệ)[^)]*\)/gi,'')
    .replace(/\s*-\s*H2DEV\s*$/i,'')
    .replace(/\s{2,}/g,' ')
    .trim();
  return t || docName(file) || 'Tài nguyên';
}
function hostLabel(link){
  if(!link) return '';
  if(/docs\.google\.com\/document/.test(link)) return 'Google Docs';
  if(/docs\.google\.com\/spreadsheets/.test(link)) return 'Google Sheet';
  if(/docs\.google\.com\/forms|forms\.gle/.test(link)) return 'Google Form';
  if(/drive\.google/.test(link)) return 'Google Drive';
  if(/labs\.google|dreamina/.test(link)) return 'AI gen';
  try{ return new URL(link).hostname.replace(/^www\./,''); }catch(e){ return 'Link'; }
}
/* ---------- Shared progress + watched store (same key as index.html) ---------- */
function loadStore(){ try{ return JSON.parse(localStorage.getItem('h2dev-watched')||'{}'); }catch(e){ return {}; } }
function saveStore(m){
  localStorage.setItem('h2dev-watched', JSON.stringify(m));
  try{
    const favs=JSON.parse(localStorage.getItem('h2dev-fav')||'[]');
    const recent=JSON.parse(localStorage.getItem('h2dev-recent')||'null');
    localStorage.setItem('h2dev-admin', JSON.stringify({role:'admin',version:1,updatedAt:Date.now(),watched:m,favorites:Array.isArray(favs)?favs:[],recent:recent}));
  }catch(e){}
}
function fmtTime(sec){ const n=Math.max(0, Math.floor(Number(sec)||0)); const m=Math.floor(n/60), s=Math.floor(n%60); return m+':'+String(s).padStart(2,'0'); }

/* Quay lại: về trang trước nếu có lịch sử (history.back), nếu không thì về /lotrinh, else về / */
function goBack(){
  if (params.get('back') === '1' || window.history.length > 1) {
    history.back();
  } else if (/^\/lotrinh\//i.test(location.pathname) || params.get('back') === 'learn.html') {
    location.href = '/lotrinh';
  } else {
    location.href = '/';
  }
}
const btnBack=document.getElementById('btnBack');
if(btnBack) btnBack.onclick = goBack;

/* PHASE 2: Back-to-top chuan (truoc day player THIEU ca element + JS) */
(function initBackToTop(){
  const btt = document.getElementById('btn-back-to-top');
  if(!btt) return;
  btt.onclick = function(){ try { window.scrollTo({top:0, behavior:'smooth'}); } catch(e){ window.scrollTo(0,0); } };
  const onScroll = function(){
    const top = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
    if (top > 320) btt.classList.add('is-visible');
    else btt.classList.remove('is-visible');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();
const floatingBackBtn=document.getElementById('floatingBackBtn');
if(floatingBackBtn) floatingBackBtn.onclick = goBack;

// Tự động hiện nút nổi khi cuộn xuống dưới, ẩn khi ở đỉnh
window.addEventListener('scroll', () => {
  if (!floatingBackBtn) return;
  if (window.scrollY > 120) {
    floatingBackBtn.classList.add('is-visible');
  } else {
    floatingBackBtn.classList.remove('is-visible');
  }
}, { passive: true });

// Cử chỉ vuốt từ mép trái sang phải để quay lại (Edge Swipe Back)
let playerTouchStartX = 0, playerTouchStartY = 0;
window.addEventListener('touchstart', (e) => {
  if (!e.touches || !e.touches[0]) return;
  playerTouchStartX = e.touches[0].screenX;
  playerTouchStartY = e.touches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].screenX - playerTouchStartX;
  const dy = e.changedTouches[0].screenY - playerTouchStartY;
  // Bắt đầu từ mép trái (trong khoảng 40px từ cạnh trái) và vuốt ngang sang phải > 80px
  if (playerTouchStartX < 50 && dx > 80 && Math.abs(dy) < 50) {
    goBack();
  }
}, { passive: true });

/* ---------- THEATER MODE (Chế độ Chiếu rạp chuẩn YouTube - Phím T) ---------- */
const btnTheater=document.getElementById('btnTheater');
const theaterLabel=document.getElementById('theaterLabel');
const THEATER_KEY='h2dev_theater_mode';

function setTheaterMode(active, save=true){
  document.body.classList.toggle('theater-active', active);
  if(btnTheater){
    btnTheater.classList.toggle('active', active);
    if(theaterLabel){
      theaterLabel.textContent = active ? 'Mặc định' : 'Chiếu rạp';
    }
  }
  if(save){
    try{ localStorage.setItem(THEATER_KEY, active ? '1' : '0'); }catch(e){}
  }
}
function setPlayerTab(tab, btn) {
  const colOverview = document.getElementById('colOverview');
  const pInsights = document.getElementById('pinsights');
  const pTranscript = document.getElementById('ptranscript');
  const colSide = document.getElementById('colSide');
  const buttons = document.querySelectorAll('#playerTabSelector button');
  buttons.forEach(b => {
    b.className = 'flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold text-fg-muted hover:text-fg transition-colors text-center flex items-center justify-center gap-1 min-h-[44px]';
    b.setAttribute('aria-selected', 'false');
    /* PHASE 2: roving tabindex chuan ARIA */
    b.setAttribute('tabindex', '-1');
    b.setAttribute('aria-controls', 'playerMain');
  });
  if (btn) {
    btn.className = 'flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-white bg-surface border border-border/80 transition-colors text-center flex items-center justify-center gap-1 min-h-[44px]';
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');
  }
  if (window.innerWidth < 1024) {
    if (tab === 'overview') {
      colOverview.style.display = 'block';
      colSide.style.display = 'none';
    } else if (tab === 'insights') {
      colOverview.style.display = 'none';
      colSide.style.display = 'block';
      pInsights.style.display = 'block';
      pTranscript.style.display = 'none';
    } else if (tab === 'transcript') {
      colOverview.style.display = 'none';
      colSide.style.display = 'block';
      pInsights.style.display = 'none';
      pTranscript.style.display = 'block';
    }
  }
}
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    const colOverview = document.getElementById('colOverview');
    const colSide = document.getElementById('colSide');
    const pInsights = document.getElementById('pinsights');
    const pTranscript = document.getElementById('ptranscript');
    if (colOverview) colOverview.style.display = '';
    if (colSide) colSide.style.display = '';
    if (pInsights) pInsights.style.display = '';
    if (pTranscript) pTranscript.style.display = '';
  }
});

/* PHASE 2: dieu huong player tab bang ban phim (ArrowLeft/Right/Home/End) */
(function initPlayerTabKeyboard(){
  const selector = document.getElementById('playerTabSelector');
  if (!selector) return;
  selector.setAttribute('role', 'tablist');
  if (!selector.getAttribute('aria-label')) selector.setAttribute('aria-label', 'Nội dung bài học');
  /* P0: chot trang thai roving tabindex NGAY khi nap, khong doi click.
     Ly do: #playerTabSelector bi an o desktop (display:none) nen setPlayerTab()
     khong duoc goi -> 3 tab thieu tabindex/aria-controls. Voi nguoi dung ban phim
     va AT, mot tablist thieu trang thai tabindex la loi WCAG. Dat tai day la
     NO-OP o desktop (phan tu van an) va DUNG o mobile. */
  const tabsAll = Array.prototype.slice.call(selector.querySelectorAll('button[role="tab"]'));
  tabsAll.forEach((b, i) => {
    if (!b.hasAttribute('aria-controls')) b.setAttribute('aria-controls', 'playerMain');
    const on = b.getAttribute('aria-selected') === 'true';
    b.setAttribute('tabindex', on ? '0' : '-1');
  });
  selector.addEventListener('keydown', (e) => {
    if (['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key) === -1) return;
    const btns = Array.prototype.slice.call(selector.querySelectorAll('button[role="tab"]'));
    if (!btns.length) return;
    let idx = btns.indexOf(document.activeElement);
    if (idx === -1) idx = btns.findIndex(b => b.getAttribute('aria-selected') === 'true');
    if (idx === -1) idx = 0;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowLeft') next = (idx - 1 + btns.length) % btns.length;
    else if (e.key === 'ArrowRight') next = (idx + 1) % btns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = btns.length - 1;
    btns[next].focus();
    btns[next].click();
  });
})();

// Khôi phục trạng thái đã lưu
try{
  if(localStorage.getItem(THEATER_KEY) === '1'){
    setTheaterMode(true, false);
  }
}catch(e){}

if(btnTheater){
  btnTheater.onclick=()=>{
    const isNow = document.body.classList.contains('theater-active');
    setTheaterMode(!isNow);
  };
}

// Lắng nghe phím tắt toàn cục (T: Rạp chiếu, F: Toàn màn hình, Space/K: Play/Pause, J/L: Tua -10s/+10s, M: Tắt tiếng)
window.addEventListener('keydown', (e)=>{
  const activeTag = (document.activeElement && document.activeElement.tagName) || '';
  if(activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
  
  const key = e.key.toLowerCase();
  const pv = document.getElementById('pv');

  if(key === 't'){
    e.preventDefault();
    const isNow = document.body.classList.contains('theater-active');
    setTheaterMode(!isNow);
  } else if(key === 'f'){
    e.preventDefault();
    if(pv){
      if(!document.fullscreenElement){
        (pv.requestFullscreen || pv.webkitRequestFullscreen || pv.mozRequestFullScreen || pv.msRequestFullscreen).call(pv);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen).call(document);
      }
    }
  } else if(key === 'k' || (e.code === 'Space' && activeTag !== 'BUTTON')){
    e.preventDefault();
    if(pv){
      if(pv.paused) pv.play(); else pv.pause();
    }
  } else if(key === 'j'){
    e.preventDefault();
    if(pv && Number.isFinite(pv.currentTime)) pv.currentTime = Math.max(0, pv.currentTime - 10);
  } else if(key === 'l'){
    e.preventDefault();
    if(pv && Number.isFinite(pv.currentTime)) pv.currentTime = Math.min(pv.duration || 999999, pv.currentTime + 10);
  } else if(key === 'm'){
    e.preventDefault();
    if(pv) {
      pv.muted = !pv.muted;
      if (typeof showToast === 'function') showToast(pv.muted ? 'Đã tắt tiếng' : 'Đã bật tiếng', 1500);
    }
  } else if(e.code === 'ArrowLeft'){
    e.preventDefault();
    if(pv && Number.isFinite(pv.currentTime)) pv.currentTime = Math.max(0, pv.currentTime - 5);
  } else if(e.code === 'ArrowRight'){
    e.preventDefault();
    if(pv && Number.isFinite(pv.currentTime)) pv.currentTime = Math.min(pv.duration || 999999, pv.currentTime + 5);
  }
});
(async()=>{
  let transcriptSegments = [];
  let activeSegIndex = -1;
  let userIsScrolling = false;
  let scrollTimeout = null;
  try{
    if(!sku){ throw new Error('Thiếu mã video trong URL'); }
    const [catalogResponse, modulesResponse]=await Promise.all([fetch(CAT), fetch('data/modules.json', {cache:'no-store'})]);
    if(!catalogResponse.ok) throw new Error(`Không tải được catalog (${catalogResponse.status})`);
    if(!modulesResponse.ok) throw new Error(`Không tải được lộ trình (${modulesResponse.status})`);
    const CAT2=await catalogResponse.json();
    const modulesData=await modulesResponse.json();
    const catalogBySku=new Map(CAT2.map(item=>[item.sku,item]));
    const route=modulesData.modules.flatMap(module=>module.items.map(item=>({item:catalogBySku.get(item.sku)||item,module})));
    const routePos=route.findIndex(x=>x.item.sku===sku);
    const v=catalogBySku.get(sku)|| (routePos>=0?route[routePos].item:null);
    if(!v){ throw new Error('Không tìm thấy khóa học'); }
    const prevItem = routePos > 0 ? route[routePos - 1].item : null;
    const nextItem = routePos >= 0 && routePos < route.length - 1 ? route[routePos + 1].item : null;
    const btnPrev=document.getElementById('btnPrev');
    const btnNext=document.getElementById('btnNext');
    const routeSeq=document.getElementById('routeSeq');
    if(routeSeq){
      routeSeq.textContent = 'Lộ trình · Bài ' + String(routePos + 1).padStart(2,'0') + '/' + route.length;
    }
    const makeNavUrl = function (targetSku) {
      if (/^\/lotrinh\//i.test(location.pathname)) {
        return '/lotrinh/' + encodeURIComponent(targetSku);
      }
      return 'player.html?sku=' + encodeURIComponent(targetSku) + (params.get('back') ? '&back=1' : '');
    };
    if(btnPrev){
      btnPrev.disabled = !prevItem;
      btnPrev.onclick = () => { if(prevItem) location.href = makeNavUrl(prevItem.sku); };
    }
    if(btnNext){
      btnNext.disabled = !nextItem;
      btnNext.onclick = () => { if(nextItem) location.href = makeNavUrl(nextItem.sku); };
    }
    document.title=v.title+' — H2DEV Project';
    document.getElementById('ptitle').textContent=v.title;
    const metaEl=document.getElementById('pmeta');
    metaEl.innerHTML = [
      badge(esc(sku), 'badge-muted font-mono'),
      badge(fmtBytes(v.size), 'badge-muted'),
      badge(v.drm?'DRM':'HLS', v.drm?'badge-amber':'badge-blue'),
      badge(v.free?'FREE':'PRO', v.free?'badge-green':'badge-red'),
    ].join('');
    const pv=document.getElementById('pv');
    // Media path: prefer the declared path from data (supports .mp4 and .webm),
    // then fall back to probing video/<sku>/<sku>.mp4 and .webm in order.
    const declared = (v.mp4 && /(^|\/)video\//.test(v.mp4)) ? v.mp4 : '';
    const defaultLocal = declared || `video/${sku}/${sku}.mp4`;
    let local = '';
    const candidates = declared ? [declared] : [`video/${sku}/${sku}.mp4`, `video/${sku}/${sku}.webm`];
    for (const cand of candidates) {
      try {
        const headRes = await fetch(cand, { method: 'HEAD', cache: 'no-store' });
        if (headRes.ok) {
          local = cand;
          break;
        }
      } catch(e) {}
    }
    // Fallback nếu HEAD probe bị chặn bởi proxy nhưng catalog xác nhận có file (>0 byte)
    if (!local && v.size && v.size > 0) {
      local = defaultLocal;
    }
    const localAvailable = Boolean(local);
    const playbackSource = localAvailable ? local : (v.video_link || defaultLocal);
    const isWebm = /\.webm(\?|$)/i.test(playbackSource);
    if (playbackSource) {
      pv.src = playbackSource;
      const initialSeek = parseFloat(params.get('t'));
      if (Number.isFinite(initialSeek) && initialSeek > 0) {
        pv.addEventListener('loadedmetadata', () => {
          pv.currentTime = initialSeek;
          pv.play().catch(() => {});
        }, { once: true });
      }
      pv.onerror = () => {
        if (playbackSource.endsWith('.mp4')) {
          pv.src = playbackSource.replace(/\.mp4$/, '.webm');
        } else {
          metaEl.innerHTML += `<span class="badge badge-red">Không đọc được nguồn phát</span>`;
        }
      };
    } else {
      metaEl.innerHTML += `<span class="badge badge-amber">Chưa tải được video (file 0 byte)</span>`;
    }
    const srcBox=document.getElementById('psources');
    let h='';
    if(v.origin) h+=`<a href="${esc(v.origin)}" target="_blank" rel="noopener noreferrer">${ico('globe', 14)}<span>Bài học gốc H2Dev</span></a>`;
    if(localAvailable) h+=`<a href="${esc(local)}" download class="btn-download-mp4">${ico('download', 14)}<span>Tải ${isWebm?'WEBM':'MP4'} Full HD</span></a>`;
    srcBox.innerHTML=h;
    if(v.channels&&v.channels.length){
      document.getElementById('pchannels').classList.remove('hidden');
      document.getElementById('pchannelslist').innerHTML=v.channels.map(c=>{
        const handle=String(c).replace(/^@/,'');
        return `<div class="inline-flex items-center gap-1.5 bg-surface-card border border-ink-600 p-1.5 rounded-xl text-xs">
          <a href="https://www.youtube.com/@${encodeURIComponent(handle)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 hover:text-brand-400 font-semibold px-2 py-1 transition-colors"><span class="h2-icon h2-icon--16" data-h2i="tv" aria-hidden="true"></span> @${esc(handle)}↗</a>
          <button type="button" class="btn-press bg-ink-700 hover:bg-ink-600 text-gray-300 hover:text-white px-2 py-1 rounded-xl text-2xs font-mono border border-ink-600" data-copy-handle="@${esc(handle)}" title="Sao chép handle @${esc(handle)}"><span class="h2-icon h2-icon--14" data-h2i="clipboard" aria-hidden="true"></span> Copy</button>
        </div>`;
      }).join('');
    }
    if(v.docs&&v.docs.length){
      document.getElementById('pdocs').classList.remove('hidden');
      document.getElementById('pdocslist').innerHTML=v.docs.map(d=>{
        const name=cleanDocName(d.name||'', d.file||'');
        const host=hostLabel(d.link);
        const isExternal = d.link && /^https?:\/\//i.test(d.link) && d.link !== d.file;
        const link=isExternal?`<a href="${esc(d.link)}" target="_blank" rel="noopener noreferrer" class="btn-doc-link inline-flex items-center gap-1"><span>↗</span><span>${esc(host||'Mở nguồn')}</span></a>`:'';
        const isReadable = d.file && /\.(md|txt)$/i.test(d.file);
        const readBtn = isReadable ? `<button type="button" class="btn-press btn-doc-link inline-flex items-center gap-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 cursor-pointer" data-doc-file="${esc(d.file)}" data-doc-name="${esc(name)}">${ico('eye', 14)}<span>Đọc trực tiếp</span></button>` : '';
        const localFile=d.file?`<a href="${esc(d.file)}" target="_blank" rel="noopener noreferrer" class="btn-doc-link inline-flex items-center gap-1">${ico('file-text', 14)}<span>Mở file local</span></a>`:'';
        return `<article class="card p-3.5 min-w-0 overflow-hidden"><div class="text-sm font-semibold text-white break-words [overflow-wrap:anywhere]">${esc(name)}</div>${host&&isExternal?`<div class="text-2xs text-gray-400 mt-1">${esc(host)}</div>`:''}<div class="mt-2.5 flex flex-wrap gap-2">${readBtn}${link}${localFile}</div></article>`;
      }).join('');
    }

    /* ---------- Cảnh báo TOÀN VẸN MEDIA (file hong, thieu du lieu) ---------- */
    try {
      const mi = v && v.media_integrity;
      if (mi && mi.status === 'BROKEN_AUDIO_TRUNCATED') {
        const m = mi.measured || {};
        const el = document.getElementById('mediaIntegrityNotice');
        if (el) {
          const pct = m.ratio_to_expected ? Math.round(m.ratio_to_expected * 100) : null;
          el.innerHTML = ico('alert-triangle', 14) + ' <strong>Cảnh báo chất lượng file:</strong> luồng audio của video này '
            + 'bị thiếu dữ liệu gốc' + (pct ? ' (chỉ còn ~' + pct + '% packet)' : '')
            + '. Phụ đề bên dưới chỉ tương ứng phần audio còn lại — không phải đầy đủ nội dung bài giảng. '
            + '<span class="text-amber-300/80">Cần thay file gốc để phục hồi.</span>';
          el.classList.remove('hidden');
        }
      }
    } catch (e) { /* khong anh huong hien thi chinh */ }

    /* ---------- Phân Tích Thực Chiến & Ghi Chú AI (Insights) ---------- */
    try {
      const insRes = await fetch('data/video_insights.json', {cache:'no-store'});
      if (insRes.ok) {
        const insAll = await insRes.json();
        const ins = insAll[sku];
        if (ins) {
          document.getElementById('pinsights').classList.remove('hidden');
          const legacyNoticeEl = document.getElementById('legacyInsightNotice');
          if (ins.visual_audio_checked) {
            legacyNoticeEl.classList.add('hidden');
          } else {
            legacyNoticeEl.classList.remove('hidden');
          }
          
          // Badges
          const badgesEl = document.getElementById('insightBadges');
          const marketBadgeClass = ins.market_code === 'JP' ? 'badge-red' : (ins.market_code === 'KR' ? 'badge-blue' : (ins.market_code === 'VN' ? 'badge-green' : 'badge-amber'));
          badgesEl.innerHTML = [
            badge(esc(stripDecorEmoji(ins.target_market)), marketBadgeClass),
            badge(esc(ins.niche_primary), 'badge-muted'),
            ...(ins.tools_mentioned || []).map(t => badge(esc(t), 'badge-blue font-mono text-2xs'))
          ].join(' ');

          // Takeaways
          const takeawaysEl = document.getElementById('insightTakeaways');
          if (ins.key_takeaways && ins.key_takeaways.length) {
            takeawaysEl.innerHTML = ins.key_takeaways.map(t => {
              const clean = stripLeadEmoji(t);
              const colonIdx = clean.indexOf(':');
              if (colonIdx > 0 && colonIdx < 60) {
                const head = clean.slice(0, colonIdx).trim();
                const body = clean.slice(colonIdx + 1).trim();
                return `<li class="py-1.5 list-none"><div class="font-bold text-amber-300 text-xs leading-snug tracking-tight mb-1 flex items-start gap-1">${ico('pin', 14)}<span>${esc(head)}:</span></div><div class="text-gray-300 text-xs leading-relaxed pl-5">${esc(body)}</div></li>`;
              }
              return `<li class="py-1 text-gray-300 leading-relaxed text-xs list-none">${esc(clean)}</li>`;
            }).join('');
          } else {
            takeawaysEl.innerHTML = `<li class="text-gray-400">Đang cập nhật ghi chú…</li>`;
          }
          // Edit SOP
          const editEl = document.getElementById('insightEditSop');
          let sopHtml = `<div class="p-2 rounded-xl bg-ink-800/80 border border-emerald-900/30 text-emerald-300 font-medium flex items-start gap-1.5">${ico('sparkles', 14)}<span>${esc(ins.edit_sop?.primary || 'Quy trình chuẩn bị kịch bản & dựng video độc bản')}</span></div>`;
          if (ins.edit_sop?.additional && ins.edit_sop.additional.length) {
            sopHtml += `<ul class="list-disc list-inside space-y-1 mt-1.5 text-gray-300">${ins.edit_sop.additional.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
          }
          editEl.innerHTML = sopHtml;

          // Avoid Flags
          const avoidEl = document.getElementById('insightAvoidFlags');
          if (ins.avoid_flags && ins.avoid_flags.length) {
            avoidEl.innerHTML = ins.avoid_flags.map(f => `<li class="text-rose-300/90 leading-relaxed flex items-start gap-1.5">${ico('alert-triangle', 14)}<span>${esc(stripLeadEmoji(f))}</span></li>`).join('');
          } else {
            avoidEl.innerHTML = `<li class="text-gray-400">Không có cảnh báo nghiêm trọng.</li>`;
          }

          // Timeline Keynotes
          if (ins.key_timestamps && ins.key_timestamps.length) {
            document.getElementById('insightTimelineWrap').classList.remove('hidden');
            const tlEl = document.getElementById('insightTimeline');
            tlEl.innerHTML = ins.key_timestamps.map(k => {
              return `<button type="button" class="inline-flex items-center gap-1.5 bg-ink-800 hover:bg-ink-700 border border-ink-600 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer" data-seek="${k.seconds}">
                <span class="font-mono text-sky-400 font-bold bg-ink-900 px-1.5 py-0.5 rounded text-2xs">${esc(k.time)}</span>
                <span class="text-gray-300 text-2xs truncate max-w-[200px]">${esc(k.label)}</span>
              </button>`;
            }).join('');
          }
        } else {
          document.getElementById('pinsights').classList.remove('hidden');
          document.getElementById('insightTakeaways').innerHTML = '<li class="text-gray-400">Video này chưa có dữ liệu phân tích thực chiến AI.</li>';
          document.getElementById('insightAvoidFlags').innerHTML = '<li class="text-gray-400">Chưa có ghi chú cảnh báo.</li>';
        }
      } else {
        document.getElementById('pinsights').classList.remove('hidden');
        document.getElementById('insightTakeaways').innerHTML = '<li class="text-gray-400">Video này chưa có dữ liệu phân tích thực chiến AI.</li>';
        document.getElementById('insightAvoidFlags').innerHTML = '<li class="text-gray-400">Chưa có ghi chú cảnh báo.</li>';
      }
    } catch(e) {}
    /* ---------- Interactive AI Transcript (SRT / JSON) ---------- */
    try {
      const srtPath = 'video/' + encodeURIComponent(sku) + '/transcript.srt';
      const txtPath = 'video/' + encodeURIComponent(sku) + '/transcript.txt';
      const jsonPath = 'video/' + encodeURIComponent(sku) + '/transcript.json';
      document.getElementById('btnDownloadSrt').href = srtPath;
      document.getElementById('btnDownloadTxt').href = txtPath;

      // Prefer declared transcript type: if the catalog record has a .json transcript path,
      // fetch it; otherwise try jsonPath directly before falling back to .txt.
      const declaredJson = (v.transcript && /\.json$/i.test(v.transcript)) ? v.transcript : '';
      const txtFallback = async () => {
        const txtRes = await fetch(txtPath);
        if (!txtRes.ok) return null;
        const raw = await txtRes.text();
        const segs = [];
        const re = /^\[(\d{2}):(\d{2}):(\d{2})(?:[.,]\d+)?\s*-\s*(\d{2}):(\d{2}):(\d{2})(?:[.,]\d+)?\]\s*(.*)$/;
        for (const line of raw.split(/\r?\n/)) {
          const m = re.exec(line.trim());
          if (!m) continue;
          const start = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
          const end = (+m[4]) * 3600 + (+m[5]) * 60 + (+m[6]);
          const text = (m[7] || '').trim();
          if (text) segs.push({ start, end, text });
        }
        return segs.length ? { segments: segs } : null;
      };

      let trData = null;
      const jsonCandidate = declaredJson || jsonPath;
      if (jsonCandidate) {
        try {
          const trRes = await fetch(jsonCandidate);
          if (trRes.ok) trData = await trRes.json();
        } catch (e) { /* fall through to txt */ }
      }
      if (!trData) {
        try { trData = await txtFallback(); } catch (e) { /* no transcript available */ }
      }
      {
        const tList = document.getElementById('transcriptList');
        const segs = Array.isArray(trData) ? trData : (trData?.segments || []);
        if (segs && segs.length) {
          transcriptSegments = segs;
          document.getElementById('ptranscript').classList.remove('hidden');
          tList.innerHTML = transcriptSegments.map((s, idx) => {
            const start = Math.floor(s.start || 0);
            const timeStr = fmtTime(start);
            return `<div class="transcript-line" id="tr-seg-${idx}" role="button" tabindex="0" data-seek="${start}" title="Bấm để phát từ ${timeStr}">
              <span class="transcript-time">${timeStr}</span>
              <span class="transcript-text">${esc(s.text)}</span>
            </div>`;
          }).join('');

          tList.addEventListener('scroll', () => {
            userIsScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => { userIsScrolling = false; }, 3000);
          });
        } else {
          document.getElementById('ptranscript').classList.remove('hidden');
          document.getElementById('transcriptList').innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">Video này chưa có phụ đề lời thoại bóc tách sẵn.</div>';
        }
      }
    } catch(e) {
      document.getElementById('ptranscript').classList.remove('hidden');
      document.getElementById('transcriptList').innerHTML = '<div class="p-4 text-center text-gray-400 text-xs">Video này chưa có phụ đề lời thoại bóc tách sẵn.</div>';
    }

    /* ---------- Watched + progress + resume + note (shared store) ---------- */
    try {
      const adminResponse = await fetch('/api/admin-state', {cache:'no-store'});
      if (adminResponse.ok) {
        const adminState = await adminResponse.json();
        const curW = loadStore();
        const remoteW = (adminState.watched && typeof adminState.watched === 'object') ? adminState.watched : {};
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
        const remoteF = Array.isArray(adminState.favorites) ? adminState.favorites : [];
        const favSet = new Set([...remoteF, ...(Array.isArray(curF) ? curF : [])].filter(Boolean));
        localStorage.setItem('h2dev-fav', JSON.stringify([...favSet]));

        if (adminState.recent && !localStorage.getItem('h2dev-recent')) {
          localStorage.setItem('h2dev-recent', JSON.stringify(adminState.recent));
        }
        localStorage.setItem('h2dev-admin', JSON.stringify(Object.assign({}, adminState, { watched: mergedW, favorites: [...favSet] })));
      }
    } catch(e) {}
    const store=loadStore();
    const rec=store[sku]||{watched:false,note:'',t:0,d:0};
    const stateEl=document.getElementById('pstate');
    const btnW=document.getElementById('btnWatched');
    const btnR=document.getElementById('btnResume');
    const pWrap=document.getElementById('progressWrap');
    const pBar=document.getElementById('progressBar');
    const pLabel=document.getElementById('progressLabel');
    const noteInput=document.getElementById('noteInput');
    const btnClearProgress=document.getElementById('btnClearProgress');
    const P95=0.95;
    const renderState = function (){
      const rec2=store[sku]||{watched:false,note:'',t:0,d:0};
      const d=Number(rec2.d)||0, t=Number(rec2.t)||0;
      const ratio=(d>0&&t>0)?Math.min(1, t/d):0;
      const done=Boolean(rec2.watched)||ratio>=P95;
      const inprog=(!done && ratio>0.02);
      // PHASE 3 (2026-09-23): doi emoji -> .h2-icon. Phai dung innerHTML (khong phai
      // textContent) vi textContent se xoa luon the <span class="h2-icon">.
      const iconW = (name, size) => '<span class="h2-icon h2-icon--' + (size || 14) + '" data-h2i="' + name + '" aria-hidden="true"></span>';
      if(done){ btnW.innerHTML=iconW('check-circle') + ' Đã xem'; btnW.className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors bg-green-700 text-white'; }
      else if(inprog){ btnW.innerHTML=iconW('hourglass') + ' Đang dở '+Math.round(ratio*100)+'%'; btnW.className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors bg-amber-700 text-white'; }
      else { btnW.innerHTML=iconW('square') + ' Chưa xem'; btnW.className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors bg-ink-700 hover:bg-ink-600 border border-ink-600 text-gray-300'; }
      if(t>5 && !done){
        btnR.innerHTML=iconW('play') + ' Xem tiếp từ '+fmtTime(t);
        btnR.classList.remove('hidden');
        btnR.classList.add('inline-flex');
      } else {
        btnR.classList.add('hidden');
        btnR.classList.remove('inline-flex');
      }
      pWrap.classList.toggle('hidden', !done);
      pBar.style.width=Math.min(100,Math.round(ratio*100))+'%';
      pLabel.textContent=done?('100% · đã xem'):(ratio>0?Math.round(ratio*100)+'%':'');
      noteInput.value=rec2.note||'';
    }
    stateEl.classList.remove('hidden');
    renderState();
    btnW.onclick=()=>{
      const cur=store[sku]||{watched:false,note:noteInput.value,t:rec.t,d:rec.d};
      cur.watched=!cur.watched;
      if(cur.watched&&!cur.d&&Number.isFinite(pv.duration)&&pv.duration>0) cur.d=pv.duration;
      store[sku]=Object.assign({},rec,cur,{watched:cur.watched,note:noteInput.value});
      saveStore(store); renderState();
    };
    btnR.onclick=()=>{
      const target=Number((store[sku]||{}).t)||0;
      if(Number.isFinite(target)&&target>0){
        pv.currentTime=Math.min(target, (Number.isFinite(pv.duration)&&pv.duration>0)?pv.duration:target);
        pv.play();
      }
    };
    btnClearProgress.onclick=()=>{
      delete store[sku];
      saveStore(store);
      renderState();
    };
    noteInput.oninput=()=>{
      const cur=store[sku]||{watched:false,note:'',t:rec.t,d:rec.d};
      cur.note=noteInput.value;
      store[sku]=cur;
      saveStore(store);
    };
    /* Save recent watched (for learn.html resume banner) */
    try{
      const recentPayload={sku:sku,ts:Date.now(),nextSku:nextItem?nextItem.sku:null};
      localStorage.setItem('h2dev-recent', JSON.stringify(recentPayload));
      localStorage.setItem('recentWatched', JSON.stringify({item_id:sku,item_name:v.title,next_video_url:nextItem?nextItem.mp4:null}));
    }catch(e){}

    /* auto-save progress every 3s while playing + mark watched at 95% */
    /* auto-save progress every 3s while playing + realtime transcript sync */
    let lastSave=0;
    pv.addEventListener('timeupdate',()=>{
      const d=pv.duration, t=pv.currentTime;
      if(!Number.isFinite(t)) return;

      // Realtime transcript auto-highlight
      const tList = document.getElementById('transcriptList');
      if (tList && transcriptSegments && transcriptSegments.length) {
        let curIndex = -1;
        for (let i = 0; i < transcriptSegments.length; i++) {
          const s = transcriptSegments[i];
          const nextStart = (transcriptSegments[i + 1] ? transcriptSegments[i + 1].start : s.end) || (s.start + 10);
          if (t >= (s.start - 0.3) && t < nextStart) {
            curIndex = i;
            break;
          }
        }
        if (curIndex !== -1 && curIndex !== activeSegIndex) {
          activeSegIndex = curIndex;
          const lines = tList.querySelectorAll('.transcript-line');
          lines.forEach((l, idx) => {
            l.classList.toggle('is-active', idx === curIndex);
          });
          const activeEl = document.getElementById('tr-seg-' + curIndex);
          if (activeEl && !userIsScrolling) {
            const topPos = activeEl.offsetTop - tList.offsetTop - (tList.clientHeight / 2) + (activeEl.clientHeight / 2);
            tList.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          }
        }
      }

      if(!Number.isFinite(d)||d<=0) return;
      const now=Date.now();
      if(now-lastSave<3000) return;
      lastSave=now;
      const cur=store[sku]||{watched:false,note:noteInput.value,t:0,d:0};
      cur.t=Math.max(Number(cur.t)||0, t);
      cur.d=d;
      if(t/d>=P95) cur.watched=true;
      store[sku]=cur;
      saveStore(store);
      renderState();
    });
    pv.addEventListener('ended',()=>{
      const cur=store[sku]||{watched:false,note:noteInput.value,t:0,d:0};
      cur.watched=true;
      if(Number.isFinite(pv.duration)&&pv.duration>0){
        cur.d=pv.duration;
        cur.t=pv.duration;
      }
      store[sku]=cur; saveStore(store); renderState();
    });
    // Khởi tạo tab mặc định khi vào trang trên mobile
    if (window.innerWidth < 1024) {
      setPlayerTab('overview', document.querySelector('#playerTabSelector button'));
    }
  }catch(error){
    document.getElementById('ptitle').textContent='Không thể tải video';
    document.getElementById('pmeta').innerHTML=`<span class="badge badge-red">${esc(error.message)}</span>`;
  }
})();
/* ---------- Toast & Clipboard Helpers ---------- */
function showToast(msg, duration = 3000) {
  const box = document.getElementById('toast-box') || document.body;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.innerHTML = `<span>${esc(msg)}</span>`;
  box.appendChild(el);
  /* P0: thong bao cho screen reader qua vung a11y cap trang (dong bo index) */
  try {
    const a11yEl = document.getElementById('a11y-status');
    if (a11yEl) a11yEl.textContent = msg;
  } catch (e) {}
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px) scale(0.95)';
    el.style.transition = 'all 0.25s ease';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

function copyHandle(handle) {
  navigator.clipboard.writeText(handle).then(() => {
    showToast(`Đã sao chép ${handle} — Dán vào YouTube để tìm kiếm`);
  }).catch(() => {
    showToast(`Handle: ${handle}`);
  });
}

/* ---------- Doc Reader Modal ---------- */
let currentDocRawText = '';

/* ---------- Doc Reader: render Markdown thanh HTML an toan (esc truoc khi noi suy) ---------- */
function renderMarkdownDoc(md) {
  const lines = String(md || '').split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (!inTable) return;
    if (tableRows.length > 0) {
      let html = '<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-ink-600 text-xs text-left">';
      let isHeader = true;
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        if (row.every(c => /^:?-+:?$/.test(c.trim()))) {
          isHeader = false;
          continue;
        }
        html += '<tr class="' + (isHeader ? 'bg-ink-700 text-white font-semibold' : 'hover:bg-ink-800/50 border-t border-ink-600') + '">';
        row.forEach(c => {
          html += '<' + (isHeader ? 'th' : 'td') + ' class="p-2 border border-ink-600">' + inlineMd(c.trim()) + '</' + (isHeader ? 'th' : 'td') + '>';
        });
        html += '</tr>';
      }
      html += '</table></div>';
      out.push(html);
    }
    tableRows = [];
    inTable = false;
  }

  function inlineMd(str) {
    return esc(str)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:underline">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-ink-800 border border-ink-600 text-amber-300 font-mono text-xs">$1</code>')
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
      .replace(/\$\\rightarrow\$|\\rightarrow/g, '→');
  }

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCode) {
        out.push('<pre class="p-3.5 bg-ink-900 border border-ink-600 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto my-2"><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
        codeBuf = [];
        inCode = false;
      } else {
        flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed.slice(1, -1).split('|'));
      continue;
    } else {
      flushTable();
    }
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) {
      out.push('<h1 class="text-xl font-bold text-white border-b border-ink-600 pb-2 mt-4 mb-2">' + inlineMd(trimmed.slice(2)) + '</h1>');
    } else if (trimmed.startsWith('## ')) {
      out.push('<h2 class="text-base font-bold text-brand-400 mt-4 mb-2">' + inlineMd(trimmed.slice(3)) + '</h2>');
    } else if (trimmed.startsWith('### ')) {
      out.push('<h3 class="text-sm font-semibold text-sky-300 mt-3 mb-1">' + inlineMd(trimmed.slice(4)) + '</h3>');
    } else if (trimmed.startsWith('> ')) {
      out.push('<blockquote class="border-l-4 border-brand-500 bg-brand-500/10 px-3.5 py-2 rounded-r-xl text-gray-300 text-xs my-2">' + inlineMd(trimmed.slice(2)) + '</blockquote>');
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const chk = trimmed.startsWith('- [x] ');
      out.push('<div class="flex items-center gap-2 py-0.5 text-xs ' + (chk ? 'text-emerald-400 font-medium' : 'text-gray-300') + '"><span class="w-4 h-4 rounded border flex items-center justify-center ' + (chk ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-ink-500') + '">' + (chk ? '<span class="h2-icon h2-icon--14" data-h2i="check" aria-hidden="true"></span>' : '') + '</span>' + inlineMd(trimmed.slice(6)) + '</div>');
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      out.push('<li class="text-xs text-gray-300 ml-4 list-disc my-1">' + inlineMd(trimmed.slice(2)) + '</li>');
    } else {
      out.push('<p class="text-xs text-gray-300 leading-relaxed my-1.5">' + inlineMd(trimmed) + '</p>');
    }
  }
  flushTable();
  return out.join('\n');
}

async function viewDocInModal(filePath, title) {
  const modal = document.getElementById('docModal');
  const titleEl = document.getElementById('docModalTitle');
  const bodyEl = document.getElementById('docModalBody');
  const rawLink = document.getElementById('docModalRawLink');
  if (!modal || !titleEl || !bodyEl) return;
  
  titleEl.textContent = title || filePath.split('/').pop();
  rawLink.href = filePath;
  bodyEl.innerHTML = '<div class="text-center text-gray-400 py-12 flex flex-col items-center gap-3"><div class="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div><div>Đang tải tài liệu…</div></div>';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error('Không thể tải file: HTTP ' + res.status);
    const text = await res.text();
    currentDocRawText = text;
    if (/\.md$/i.test(filePath)) {
      bodyEl.innerHTML = renderMarkdownDoc(text);
    } else {
      bodyEl.innerHTML = `<pre class="bg-ink-900/80 p-4 rounded-xl border border-ink-600 text-xs font-mono text-gray-200 overflow-x-auto whitespace-pre-wrap">${esc(text)}</pre>`;
    }
  } catch (err) {
    bodyEl.innerHTML = `<div class="p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-200 text-sm">Lỗi tải tài liệu: ${esc(err.message)}</div>`;
  }
}

function closeDocModal() {
  const modal = document.getElementById('docModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function copyDocContent() {
  if (!currentDocRawText) return;
  navigator.clipboard.writeText(currentDocRawText).then(() => {
    showToast('Đã sao chép nội dung tài liệu');
  }).catch(() => {
    showToast('Không thể sao chép');
  });
}

/* ---------- G2: delegated handlers (data-*) + focus-trap modal ---------- */
function trapFocus(container, e) {
  if (e.key !== 'Tab' || !container) return;
  const focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t || !t.closest) return;
  const tabBtn = t.closest('[data-player-tab]');
  if (tabBtn) {
    setPlayerTab(tabBtn.getAttribute('data-player-tab'), tabBtn);
    return;
  }
  const copyH = t.closest('[data-copy-handle]');
  if (copyH) {
    copyHandle(copyH.getAttribute('data-copy-handle') || '');
    return;
  }
  const docBtn = t.closest('[data-doc-file]');
  if (docBtn) {
    viewDocInModal(docBtn.getAttribute('data-doc-file') || '', docBtn.getAttribute('data-doc-name') || 'Tài liệu');
    return;
  }
  const seek = t.closest('[data-seek]');
  if (seek) {
    const sec = Number(seek.getAttribute('data-seek')) || 0;
    const pv = document.getElementById('pv');
    if (pv) { pv.currentTime = sec; pv.play(); }
    return;
  }
  const act = t.closest('[data-action]');
  if (act) {
    const action = act.getAttribute('data-action');
    if (action === 'copy-doc') { copyDocContent(); return; }
    if (action === 'close-doc') { closeDocModal(); return; }
  }
  const modal = document.getElementById('docModal');
  if (modal && t === modal) closeDocModal();
});

document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('docModal');
  const open = modal && modal.style.display && modal.style.display !== 'none';
  if (open) trapFocus(modal, e);
  const seg = e.target && e.target.closest && e.target.closest('.transcript-line[data-seek]');
  if (seg && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    const sec = Number(seg.getAttribute('data-seek')) || 0;
    const pv = document.getElementById('pv');
    if (pv) { pv.currentTime = sec; pv.play(); }
  }
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('docModal');
    if (modal && modal.style.display && modal.style.display !== 'none') closeDocModal();
  }
});

