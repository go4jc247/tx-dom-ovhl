// ============================================================
// TX-Dom-Dev Service Worker
// Version: v17.27.0 — Moon bidder lead strategy
// UPDATE CACHE_NAME every release to bust old caches
// ============================================================

const CACHE_NAME = 'tx-dom-v17.27.0';
const urlsToCache = [
  './index.html',
  // CSS
  './assets/css/styles.css',
  // JS
  './assets/js/game.js',
  // Images
  './assets/images/icon-180.png',
  './assets/images/icon-512.png',
  './assets/images/manifest-icon-192.png',
  './assets/images/manifest-icon-512.png',
  './assets/images/splash-bg.png',
  './assets/images/home-logo.png',
  './assets/images/logo-tn51.png',
  './assets/images/logo-t42.png',
  './assets/images/logo-moon.png',
  // SFX
  './assets/audio/sfx-click.mp3',
  './assets/audio/sfx-play1.mp3',
  './assets/audio/sfx-play3.mp3',
  './assets/audio/sfx-shuffle.mp3',
  './assets/audio/sfx-invalid.mp3',
  './assets/audio/sfx-collect.mp3',
  // BGM & result songs
  './assets/audio/bgm1.mp3',
  './assets/audio/bgm2.mp3',
  './assets/audio/bgm3.mp3',
  './assets/audio/win-song.mp3',
  './assets/audio/lose-song.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.ok && r.type === 'basic') {
          const rc = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, rc));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Offline — please reconnect', { status: 503, headers: { 'Content-Type': 'text/plain' } })))
  );
});
