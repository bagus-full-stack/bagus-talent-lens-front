import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA & Service Worker Security (Zero-PII Compliance)', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');

  it('Garantit que le service worker public/sw.js existe', () => {
    expect(fs.existsSync(swPath)).toBe(true);
  });

  it('Interdit formellement la mise en cache de toutes les routes /api/ dans le service worker', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Vérifie l'exclusion formelle des routes d'API
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
    // Vérifie qu'aucune méthode autre que GET n'est mise en cache
    expect(swContent).toContain("request.method !== 'GET'");
  });

  it('Vérifie que la page de repli hors-ligne /offline est déclarée dans le pré-cache', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain("'/offline'");
  });

  it('Garantit que le fichier public/sw.js ne contient aucune référence ou DTO de candidat en dur', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).not.toContain('firstName');
    expect(swContent).not.toContain('lastName');
    expect(swContent).not.toContain('mockCandidatesRaw');
  });
});
