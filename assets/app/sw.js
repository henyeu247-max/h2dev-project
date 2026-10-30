/* H2DEV PWA shell cache — G5
   UI-06 production fix (2026-09-28): BAN HOAT DONG la file nay.
   Ly do: nginx vhost co regex `.*\.(js|css)?` phuc vu /sw.js root TRUC TIEP tu
   webroot (thieu file) -> 404, duong /assets/... moi di dung Node (^~ prefix).
   sw-register.js do lai dang ky '/assets/app/sw.js' voi scope '/' — hop le nho
   header Service-Worker-Allowed: '/' ma server.js phuc vu cho file nay.
   /sw.js (root) chuyen thanh legacy. SHELL + CACHE giu nguyen ban batchd. */
/* 2026-10-30: bump ten cache -> SW moi install + activate xoa cache cu (uifix95, shell & data v10). */
const SHELL_CACHE = 'h2dev-shell-v10';
const DATA_CACHE = 'h2dev-data-v10';
const SHELL = [
  '/',
  '/index.html',
  '/player.html',
  '/learn.html',
  '/graph.html',
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
  '/assets/learn.js',
  '/assets/app/learn-main.js',
  '/assets/app/graph-main.js',
  '/assets/app/taxonomy.js',
  '/assets/app/ui-core.js',
  '/assets/app/icons.js',
  '/assets/app/search-core.js',
  '/assets/app/main.js',
  '/assets/app/boot-route.js',
  '/assets/app/player-main.js',
  '/assets/app/tabs/nav.js',
  '/assets/app/tabs/content.js',
  '/assets/app/modals/raw-deep.js',
  '/assets/app/search.js',
  '/assets/music_player_modal.js',
  '/assets/app/sw-register.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('h2dev-') && ![SHELL_CACHE, DATA_CACHE].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/video/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/live/')) return;
  if (url.pathname.startsWith('/assets/nhac-nen/')) return; // network only for data/media
  /* NANG CAP 2026-09-30: trang HTML (navigate) + du lieu .json = NETWORK-FIRST, cache chi de dung khi offline.
     Truoc day MOI request deu stale-while-revalidate -> sau moi lan deploy/cap nhat du lieu, lan mo dau tien van nhan
     HTML cu (?v cu -> JS/CSS cu) va JSON cu; do thuc te: /tatca sau khi doi ?v van nap content.js ban truoc. */
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.json')) {
    const network = fetch(e.request).then(async (res) => {
      if (res && res.ok) {
        const copy = res.clone();
        await caches.open(DATA_CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    });
    e.waitUntil(network.then(() => {}).catch(() => {}));
    e.respondWith(
      network.catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => {
        if (hit || e.request.mode !== 'navigate') return hit;
        /* offline: tra ve dung trang vo cho route SPA */
        const p = url.pathname;
        const shell = /^\/lotrinh\/[^/]+/.test(p) ? '/player.html' : (/^\/(lotrinh|learn\.html)/.test(p) ? '/learn.html' : (/^\/(graph|graph\.html)/.test(p) ? '/graph.html' : '/index.html'));
        return caches.match(shell);
      }))
    );
    return;
  }
  const network = fetch(e.request).then(async (res) => {
    if (res && res.ok) {
      const copy = res.clone();
      await caches.open(SHELL_CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
    }
    return res;
  });
  e.waitUntil(network.then(() => {}).catch(() => {}));
  e.respondWith(
    network.catch(() => caches.match(e.request).then((hit) => hit || caches.match(e.request, { ignoreSearch: true })))
  );
});
