/* G6: SW register ? extracted
   UI-06 production fix (2026-09-28): dang ky '/assets/app/sw.js' (di dung Node qua
   nginx ^~ /assets/) voi scope '/' — hop le nho header Service-Worker-Allowed: '/'
   ma server.js phuc vu cho SW script. Register '/sw.js' root bi nginx regex chen
   404 (regex `.*\.(js|css)?` serve truc tiep tu webroot thieu file). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/assets/app/sw.js', { scope: '/' }).catch(function () {});
  });
}
