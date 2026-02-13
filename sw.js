
const CACHE_NAME = 'gurumate-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'
];

// File logo dipisahkan agar jika gagal di-fetch (belum diupload), SW tetap berhasil terinstall
const OPTIONAL_ASSETS = [
  './logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Install aset utama
      cache.addAll(ASSETS);
      // Coba install logo secara terpisah
      OPTIONAL_ASSETS.forEach(asset => {
        fetch(asset).then(response => {
          if(response.ok) cache.put(asset, response);
        }).catch(() => console.log('Optional asset not found yet'));
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback sederhana jika offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline content unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
