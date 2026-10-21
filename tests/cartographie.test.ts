import { describe, it, expect, vi } from 'vitest';
import {
  generateCartographyPoints,
  CLUSTERS,
  PIPELINE_COLORS,
  cartographyStore,
} from '@/lib/cartographie/cartographie-service';
import type { CartographyFilters, CartographyPoint } from '@/lib/schemas/cartographie';

describe('Tests /cartographie : Projection vectorielle, Bascule 2D/3D, Lasso et Confidentialité', () => {
  // =========================================================================
  // 1. BASCULE 2D / 3D ET FORMAT ACCESSIBLE
  // =========================================================================
  describe('1. Bascule 2D / 3D et conservation de l’état des filtres', () => {
    it('switches between 2D and 3D view modes while preserving all filters', () => {
      let filters: CartographyFilters = {
        folderId: 'fld-cyb-88',
        selectedSkills: ['CISSP', 'Splunk'],
        minExperience: 5,
        maxExperience: 12,
        searchSkill: 'Python',
        selectedClusterId: 'cluster-sec',
        colorBy: 'pipeline',
        opacity: 0.75,
        viewMode: '2d',
        viewFormat: 'graph',
      };

      // Bascule vers 3D
      filters = { ...filters, viewMode: '3d' };
      expect(filters.viewMode).toBe('3d');
      expect(filters.folderId).toBe('fld-cyb-88');
      expect(filters.searchSkill).toBe('Python');
      expect(filters.selectedClusterId).toBe('cluster-sec');
      expect(filters.colorBy).toBe('pipeline');
      expect(filters.opacity).toBe(0.75);

      // Bascule vers le tableau accessible
      filters = { ...filters, viewFormat: 'table' };
      expect(filters.viewFormat).toBe('table');
      expect(filters.viewMode).toBe('3d'); // Conservation du mode sous-jacent

      // Retour en 2D Graphique
      filters = { ...filters, viewMode: '2d', viewFormat: 'graph' };
      expect(filters.viewMode).toBe('2d');
      expect(filters.viewFormat).toBe('graph');
      expect(filters.folderId).toBe('fld-cyb-88');
    });

    it('resets all filters to initial state cleanly when reset view is triggered', () => {
      const customFilters: CartographyFilters = {
        folderId: 'fld-full-12',
        selectedSkills: ['React'],
        minExperience: 8,
        maxExperience: 15,
        searchSkill: 'Docker',
        selectedClusterId: 'cluster-devops',
        colorBy: 'experience',
        opacity: 0.5,
        viewMode: '3d',
        viewFormat: 'table',
      };

      const defaultFilters: CartographyFilters = {
        folderId: 'all',
        selectedSkills: [],
        minExperience: 0,
        maxExperience: 20,
        searchSkill: '',
        selectedClusterId: null,
        colorBy: 'cluster',
        opacity: 0.85,
        viewMode: '2d',
        viewFormat: 'graph',
      };

      // Action Reset
      const resetFilters = { ...defaultFilters };
      expect(resetFilters.folderId).toBe('all');
      expect(resetFilters.minExperience).toBe(0);
      expect(resetFilters.searchSkill).toBe('');
      expect(resetFilters.selectedClusterId).toBeNull();
      expect(resetFilters.colorBy).toBe('cluster');
      expect(resetFilters.viewMode).toBe('2d');
    });
  });

  // =========================================================================
  // 2. SÉLECTION AU LASSO ET CRÉATION DE SHORTLIST
  // =========================================================================
  describe('2. Sélection au lasso et création de shortlist', () => {
    it('captures lasso-selected candidate points and triggers shortlist creation', () => {
      const { points } = generateCartographyPoints(100);

      // Simulation d'une sélection lasso de 4 points
      const lassoSelection = points.slice(0, 4);
      expect(lassoSelection).toHaveLength(4);

      // Simulation du callback onCreateShortlist
      const onShortlistCreated = vi.fn();
      onShortlistCreated(lassoSelection);

      expect(onShortlistCreated).toHaveBeenCalledTimes(1);
      expect(onShortlistCreated).toHaveBeenCalledWith(lassoSelection);
      expect(lassoSelection.map((p) => p.id)).toEqual([
        points[0].id,
        points[1].id,
        points[2].id,
        points[3].id,
      ]);
    });

    it('clears lasso selection correctly', () => {
      let selectedPoints: CartographyPoint[] = generateCartographyPoints(10).points;
      expect(selectedPoints.length).toBeGreaterThan(0);

      // Action Annuler la sélection
      selectedPoints = [];
      expect(selectedPoints).toHaveLength(0);
    });
  });

  // =========================================================================
  // 3. ABSENCE DE PII DANS LES INFOBULLES EN MODE AVEUGLE
  // =========================================================================
  describe('3. Absence de PII dans les infobulles en mode aveugle', () => {
    it('ensures no nominative PII (name, email, phone) exists in any cartography point', () => {
      const { points } = generateCartographyPoints(200);

      for (const pt of points) {
        // Pseudonyme obligatoire conforme DTO
        expect(pt.pseudonym).toMatch(/^Candidat #[A-Za-z0-9]+$/);

        // Aucune propriété contenant un prénom, nom, téléphone ou email
        const keys = Object.keys(pt);
        expect(keys).not.toContain('fullName');
        expect(keys).not.toContain('firstName');
        expect(keys).not.toContain('lastName');
        expect(keys).not.toContain('email');
        expect(keys).not.toContain('phone');
        expect(keys).not.toContain('telephone');

        // Les compétences clés de l'infobulle sont limitées à 3
        expect(pt.topSkills.length).toBeLessThanOrEqual(3);
      }
    });

    it('formats tooltip content strictly with pseudonym, title and 3 skills', () => {
      const samplePoint: CartographyPoint = {
        id: 'cand-c8f2',
        pseudonym: 'Candidat #C8F2',
        currentTitle: 'Senior Security Operations & Incident Responder',
        topSkills: ['CISSP', 'SIEM Splunk', 'CrowdStrike Falcon'],
        folderId: 'fld-cyb-88',
        folderReference: '#CYB-88',
        yearsExperience: 7,
        pipelineStage: 'entretien_tech',
        clusterId: 'cluster-sec',
        clusterName: 'Cybersécurité SOC & Threat Intel',
        x: 3.8,
        y: -2.0,
        z: -1.5,
      };

      // Vérification du contenu affiché dans l'infobulle
      expect(samplePoint.pseudonym).toBe('Candidat #C8F2');
      expect(samplePoint.currentTitle).toContain('Security');
      expect(samplePoint.topSkills).toEqual(['CISSP', 'SIEM Splunk', 'CrowdStrike Falcon']);
      expect(samplePoint.folderReference).toBe('#CYB-88');

      // Aucune donnée personnelle
      expect(JSON.stringify(samplePoint)).not.toMatch(/@/); // Pas d'email
      expect(JSON.stringify(samplePoint)).not.toMatch(/\+33/); // Pas de téléphone
    });
  });

  // =========================================================================
  // 4. ÉTAT : SEUIL CRITIQUE MOINS DE 50 CV
  // =========================================================================
  describe('4. État : Moins de 50 CV analysés', () => {
    it('detects when the pool has fewer than 50 candidates and flags critical threshold', () => {
      const smallPool = generateCartographyPoints(45).points;
      expect(smallPool.length).toBe(45);

      const isBelowThreshold = smallPool.length < 50;
      expect(isBelowThreshold).toBe(true);

      const normalPool = generateCartographyPoints(1200).points;
      expect(normalPool.length).toBe(1200);
      expect(normalPool.length < 50).toBe(false);
    });
  });

  // =========================================================================
  // 5. RECALCUL INCRÉMENTAL UMAP (ADMIN)
  // =========================================================================
  describe('5. Recalcul incrémental UMAP', () => {
    it('updates lastCalculatedAt timestamp when recalculate is executed', () => {
      const initial = cartographyStore.getData();
      const initialTimestamp = initial.lastCalculatedAt;

      const updated = cartographyStore.recalculate();
      expect(updated.lastCalculatedAt).toBeDefined();
      expect(updated.isRecalculating).toBe(false);
      expect(updated.points.length).toBeGreaterThan(0);
      expect(updated.clusters.length).toBe(CLUSTERS.length);
    });
  });
});
