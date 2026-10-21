import { describe, it, expect, beforeEach } from 'vitest';
import {
  pipelineStore,
  CODED_REJECTION_REASONS,
  INITIAL_PIPELINE_STAGES,
} from '@/lib/pipeline/pipeline-store';

describe('Tests /pipeline : Kanban, Règles Métier, Levée d’anonymat et Conflits de Version', () => {
  let sampleCandidacyId: string;

  beforeEach(() => {
    const list = pipelineStore.getCandidacies();
    expect(list.length).toBeGreaterThan(0);
    sampleCandidacyId = list[0].id;
  });

  // =========================================================================
  // 1. GLISSER-DÉPOSER AU CLAVIER / TRANSITION NORMALE
  // =========================================================================
  describe('1. Glisser-déposer et commandes clavier de transition', () => {
    it('executes manual step transition cleanly, updating stage, history, and version', () => {
      const candidacyBefore = pipelineStore.getCandidacy(sampleCandidacyId)!;
      const initialVersion = candidacyBefore.version;

      // Transition vers "Présélectionné"
      const result = pipelineStore.moveCandidacy({
        candidacyId: sampleCandidacyId,
        targetStageId: 'stg-preselect',
        expectedVersion: initialVersion,
        recruiterName: 'Idriss Ouédraogo',
      });

      expect(result.success).toBe(true);
      expect(result.candidacy?.stageId).toBe('stg-preselect');
      expect(result.candidacy?.daysInStage).toBe(0);
      expect(result.candidacy?.version).toBe(initialVersion + 1);

      // Traçabilité WORM dans l'historique
      expect(result.candidacy?.history).toBeDefined();
      expect(result.candidacy?.history[0].toStageId).toBe('stg-preselect');
      expect(result.candidacy?.history[0].performedBy).toBe('Idriss Ouédraogo');
    });
  });

  // =========================================================================
  // 2. REFUS SANS MOTIF IMPOSSIBLE (RÈGLE MÉTIER STRICTE)
  // =========================================================================
  describe('2. Règle métier : Refus sans motif impossible', () => {
    it('blocks transition to a lost/rejected stage if reason is missing or empty', () => {
      const candidacy = pipelineStore.getCandidacy(sampleCandidacyId)!;

      // Tentative sans motif
      const resultNoReason = pipelineStore.moveCandidacy({
        candidacyId: sampleCandidacyId,
        targetStageId: 'stg-rejected',
        expectedVersion: candidacy.version,
        reason: '',
      });

      expect(resultNoReason.success).toBe(false);
      expect(resultNoReason.error).toContain('motif codé obligatoire');

      // Tentative avec espaces blancs uniquement
      const resultBlankReason = pipelineStore.moveCandidacy({
        candidacyId: sampleCandidacyId,
        targetStageId: 'stg-rejected',
        expectedVersion: candidacy.version,
        reason: '   ',
      });

      expect(resultBlankReason.success).toBe(false);
    });

    it('approves rejection transition when a valid coded reason is supplied', () => {
      const candidacy = pipelineStore.getCandidacy(sampleCandidacyId)!;
      const codedReason = CODED_REJECTION_REASONS[0]; // 'Compétences techniques insuffisantes...'

      const result = pipelineStore.moveCandidacy({
        candidacyId: sampleCandidacyId,
        targetStageId: 'stg-rejected',
        expectedVersion: candidacy.version,
        reason: codedReason,
      });

      expect(result.success).toBe(true);
      expect(result.candidacy?.status).toBe('rejected');
      expect(result.candidacy?.rejectionReason).toBe(codedReason);
      expect(result.candidacy?.history[0].reason).toBe(codedReason);
    });
  });

  // =========================================================================
  // 3. TRANSITION EN MODE AVEUGLE AVEC RÉ-AUTHENTIFICATION (UNMASK TRIGGER)
  // =========================================================================
  describe('3. Règle métier : Transition en mode aveugle vers étape de contact', () => {
    it('requires unmasking justification and unmasks identity on contact stage (stg-interview)', () => {
      // Trouver un candidat encore en mode aveugle
      const blindCandidate = pipelineStore
        .getCandidacies()
        .find((c) => c.isBlind && c.stageId !== 'stg-interview');
      expect(blindCandidate).toBeDefined();

      const unmaskJustification = 'Entretien de qualification programmé le 10/10/2026';

      const result = pipelineStore.moveCandidacy({
        candidacyId: blindCandidate!.id,
        targetStageId: 'stg-interview',
        expectedVersion: blindCandidate!.version,
        unmaskReason: unmaskJustification,
      });

      expect(result.success).toBe(true);
      expect(result.candidacy?.stageId).toBe('stg-interview');
      expect(result.candidacy?.isBlind).toBe(false); // Levée d'anonymat opérée
      expect(result.candidacy?.unmaskedFullName).toBeDefined();
      expect(result.candidacy?.history[0].unmasked).toBe(true);
      expect(result.candidacy?.history[0].reason).toBe(unmaskJustification);
    });
  });

  // =========================================================================
  // 4. CONFLIT DE VERSION ET INTÉGRITÉ DES DONNÉES
  // =========================================================================
  describe('4. Gestion des conflits de version (Optimistic locking)', () => {
    it('detects version mismatch when a card was already modified by another recruiter', () => {
      const candidacy = pipelineStore.getCandidacy(sampleCandidacyId)!;
      const outdatedVersion = candidacy.version - 1; // Simulation d'une version obsolète

      const result = pipelineStore.moveCandidacy({
        candidacyId: sampleCandidacyId,
        targetStageId: 'stg-offer',
        expectedVersion: outdatedVersion,
      });

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.error).toContain('Conflit de synchronisation');
    });
  });

  // =========================================================================
  // 5. NOTES INTERNES AVEC TRAÇABILITÉ ÉTHIQUE
  // =========================================================================
  describe('5. Notes internes horodatées', () => {
    it('adds timestamped internal notes with author information', () => {
      const candidacy = pipelineStore.getCandidacy(sampleCandidacyId)!;
      const initialNotesCount = candidacy.notes.length;

      const noteText = 'Candidat évalué sur les questions d’architecture distribuée : excellentes réponses.';
      const ok = pipelineStore.addNote(sampleCandidacyId, noteText, 'Marc Lefebvre');

      expect(ok).toBe(true);
      const updated = pipelineStore.getCandidacy(sampleCandidacyId)!;
      expect(updated.notes.length).toBe(initialNotesCount + 1);
      expect(updated.notes[0].content).toBe(noteText);
      expect(updated.notes[0].authorName).toBe('Marc Lefebvre');
    });
  });
});
