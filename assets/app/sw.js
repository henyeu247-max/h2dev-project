/* H2DEV PWA shell cache — G5
   UI-06 production fix (2026-09-28): BAN HOAT DONG la file nay.
   Ly do: nginx vhost co regex `.*\.(js|css)?` phuc vu /sw.js root TRUC TIEP tu
   webroot (thieu file) -> 404, duong /assets/... moi di dung Node (^~ prefix).
   sw-register.js do lai dang ky '/assets/app/sw.js' voi scope '/' — hop le nho
   header Service-Worker-Allowed: '/' ma server.js phuc vu cho file nay.
   /sw.js (root) chuyen thanh legacy. SHELL + CACHE giu nguyen ban batchd. */
/* 2026-09-30: bump ten cache -> SW moi install + activate xoa cache cu (ban UI fix-all). */
const CACHE = 'h2dev-shell-v20260930-uifix1';
const SHELL = [
  '/',
  '/index.html',
  '/player.html',
  '/learn.html',
  '/manifest.json',
  '/assets/tailwind.css',
  '/assets/viddar.css',
  '/assets/learn.css',
  '/assets/player.css',
  '/assets/h2dev-tokens.css',
  '/assets/h2dev-primitives.css',
  '/assets/h2dev-shell.css',
  '/assets/h2dev-icons.css',
  '/assets/h2dev-components-lesson-row.css',
  '/assets/app/g3-inline.css',
  '/assets/h2dev-core.js',
  '/assets/app/taxonomy.js',
  '/assets/app/ui-core.js',
  '/assets/app/icons.js',
  '/assets/app/search-core.js',
  '/assets/app/main.js',
  '/assets/app/player-main.js',
  '/assets/app/tabs/nav.js',
  '/assets/app/tabs/content.js',
  '/assets/app/modals/raw-deep.js',
  '/assets/app/search.js',
  '/assets/music_player_modal.js'
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
