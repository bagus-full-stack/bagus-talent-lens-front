// Service Worker Hermétique TalentLens - Sécurité & Zéro-PII
// Enregistre uniquement la coquille applicative et les assets statiques.
// INTERDICTION STRICTE : Aucun cache pour les routes /api/* ni aucune donnée candidat.

const CACHE_NAME = 'talentlens-shell-v1';
const OFFLINE_URL = '/offline';

// Ressources statiques autorisées en pré-cache (uniquement la coquille et assets graphiques)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pré-cache partiel des assets statiques :', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. RÈGLE CRITIQUE RGPD : Ne JAMAIS intercepter ni mettre en cache les requêtes API
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    // Laisser passer directement au réseau sans toucher au CacheStorage
    return;
  }

  // 2. Gestion des requêtes de navigation (pages HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return cachedOffline || new Response('Connexion requise', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

  // 3. Coquille applicative & assets statiques Next.js (_next/static, polices, css)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 408 });
        });
      })
    );
    return;
  }

  // 4. Par défaut : Réseau uniquement
  event.respondWith(fetch(request));
});
