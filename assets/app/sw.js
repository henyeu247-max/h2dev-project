/* H2DEV PWA shell cache — G5
   ⚠️ LEGACY (UI-06, 2026-09-28): file nay KHONG con duoc dang ky. sw-register.js
   tro ve '/sw.js' o goc de co scope '/' control toan site. Giu file nay theo
   quy dinh NO_DELETE — KHONG sua logic o day nua, sua o /sw.js de 1 nguon su that. */
const CACHE = 'h2dev-shell-v20260922-g5-legacy-unused';
const SHELL = [
  '/',
  '/index.html',
  '/player.html',
  '/learn.html',
  '/assets/tailwind.css',
  '/assets/viddar.css',
  '/assets/app/taxonomy.js',
  '/assets/app/ui-core.js',
  '/assets/app/tabs/nav.js',
  '/assets/app/tabs/content.js',
  '/assets/app/modals/raw-deep.js',
  '/assets/app/search.js',
  '/assets/app/g3-inline.css',
  '/manifest.json'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/video/') || url.pathname.startsWith('/assets/nhac-nen/')) {
    return; // network only for data/media
  }
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
