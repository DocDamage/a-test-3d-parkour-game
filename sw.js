/**
 * Service Worker — minimal offline cache for PWA installability.
 * Caches the shell; dynamic assets fetched from network with cache fallback.
 */

const CACHE_NAME = 'apex-rift-v1';
const SHELL_ASSETS = [
    './',
    './index.html',
    './js/main.js',
    './locales/en.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
