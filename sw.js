// Service worker : Mesure Pro hors ligne
const CACHE = 'mesure-pro-v1.0.9';
const APP_FILES = ['./', './index.html', './manifest.json', './icon-512.png'];
// Ressources externes mises en cache à la première ouverture avec Internet
const RUNTIME_HOSTS = ['cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google (connexion Drive) : toujours le réseau, pas de cache
  if (url.hostname.includes('google')) return;

  // Fichiers de l'app et CDN : cache d'abord, sinon réseau puis mise en cache
  const cacheable = url.origin === self.location.origin || RUNTIME_HOSTS.includes(url.hostname);
  if (!cacheable) return;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
