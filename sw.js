// ============================================================
// TX-Dom-Dev Service Worker
// Version: v18.0.0 — Fix TN51 team structure: restore 2 teams of 3
// UPDATE CACHE_NAME every release to bust old caches
// ============================================================

const CACHE_NAME = 'tx-dom-v18.0.0';
const urlsToCache = [
  './index.html',
  // CSS
  './assets/css/styles.css',
  // JS
  './assets/js/game.js',
  './assets/js/tutorial.js',
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
  // Tutorial narration (45 clips)
  './assets/audio/tutorial/L1_S1_welcome.mp3',
  './assets/audio/tutorial/L1_S2_domino_set.mp3',
  './assets/audio/tutorial/L1_S3_four_players.mp3',
  './assets/audio/tutorial/L1_S4_deal.mp3',
  './assets/audio/tutorial/L2_S1_suits.mp3',
  './assets/audio/tutorial/L2_S2_sixes_suit.mp3',
  './assets/audio/tutorial/L2_S3_doubles.mp3',
  './assets/audio/tutorial/L2_S4_two_suits.mp3',
  './assets/audio/tutorial/L3_S1_count_tiles.mp3',
  './assets/audio/tutorial/L3_S2_total_count.mp3',
  './assets/audio/tutorial/L3_S3_your_count.mp3',
  './assets/audio/tutorial/L4_S1_bidding.mp3',
  './assets/audio/tutorial/L4_S2_highest_bid.mp3',
  './assets/audio/tutorial/L4_S3_when_to_bid.mp3',
  './assets/audio/tutorial/L4_S4_your_hand.mp3',
  './assets/audio/tutorial/L4_S5_bid.mp3',
  './assets/audio/tutorial/L4_S6_trump.mp3',
  './assets/audio/tutorial/L5_S1_tricks.mp3',
  './assets/audio/tutorial/L5_S2_who_wins.mp3',
  './assets/audio/tutorial/L5_S3_strategy.mp3',
  './assets/audio/tutorial/L5_S4_play.mp3',
  './assets/audio/tutorial/L6_S1_scoring.mp3',
  './assets/audio/tutorial/L6_S2_example.mp3',
  './assets/audio/tutorial/L6_S3_key_facts.mp3',
  './assets/audio/tutorial/L7_S1_following.mp3',
  './assets/audio/tutorial/L7_S2_trumping.mp3',
  './assets/audio/tutorial/L7_S3_trump_led.mp3',
  './assets/audio/tutorial/L8_S1_practice.mp3',
  './assets/audio/tutorial/L8_S2_deal.mp3',
  './assets/audio/tutorial/L8_S3_bid.mp3',
  './assets/audio/tutorial/L8_S4_trump.mp3',
  './assets/audio/tutorial/L8_S5_play.mp3',
  './assets/audio/tutorial/L9_S1_nello.mp3',
  './assets/audio/tutorial/L9_S2_nello_rules.mp3',
  './assets/audio/tutorial/L9_S3_good_nello.mp3',
  './assets/audio/tutorial/L10_S1_doubles_trump.mp3',
  './assets/audio/tutorial/L10_S2_when_doubles.mp3',
  './assets/audio/tutorial/L10_S3_follow_me.mp3',
  './assets/audio/tutorial/L11_S1_review.mp3',
  './assets/audio/tutorial/L11_S2_reference.mp3',
  './assets/audio/tutorial/L11_S3_deal.mp3',
  './assets/audio/tutorial/L11_S4_bid.mp3',
  './assets/audio/tutorial/L11_S5_trump.mp3',
  './assets/audio/tutorial/L11_S6_play.mp3',
  './assets/audio/tutorial/L11_S7_congrats.mp3',
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
