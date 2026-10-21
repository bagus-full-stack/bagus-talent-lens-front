'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Service worker enregistré
        })
        .catch((err) => {
          console.warn('[PWA] Échec d’enregistrement du Service Worker :', err);
        });
    }
  }, []);

  return null;
}
