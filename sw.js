/**
 * Service Worker — minimal offline cache for PWA installability.
 * Caches the shell; dynamic assets fetched from network with cache fallback.
 */

const CACHE_NAME = 'apex-rift-v2';
const SHELL_ASSETS = [
    './',
    './index.html',
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
    const url = new URL(e.request.url);
    if (url.pathname.endsWith('.js')) {
        e.respondWith(fetch(e.request));
        return;
    }
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
