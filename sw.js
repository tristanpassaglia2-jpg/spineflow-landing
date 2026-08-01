const CACHE = 'spineflow-v9-rc4';
const CORE = [
  '/', '/index.html', '/assets/css/app.css', '/assets/js/app.js',
  '/data/exercises.json', '/data/regions.json', '/manifest.webmanifest',
  '/media/coach/mi-profe.webp'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('/index.html'))));
});
