import type {
  ICvRepository,
  UnmaskOptions,
} from '@/lib/api/types';
import type {
  CvDocumentBlindDto,
  CvDocumentFullDto,
  CandidateCvDetail,
  ExtractedFieldValue,
  CvInternalNote,
  CvHistoryEvent,
} from '@/types';
import {
  mockCandidatesRaw,
  sanitizeToBlindDto,
  unmaskToFullDto,
  type MockCandidateRecord,
} from '../data/candidates';
import { mockFolders } from '../data/folders';
import { mockPatterns, mockPatternVersions } from '../data/patterns';

interface CandidateInternalState {
  version: number;
  pipelineStage: string;
  isShortlisted: boolean;
  extractionStatus: 'in_progress' | 'completed' | 'validated' | 'error';
  isRestricted: boolean;
  fields: Record<string, ExtractedFieldValue>;
  notes: CvInternalNote[];
  history: CvHistoryEvent[];
  unmaskInfo?: {
    actorName: string;
    reason: string;
    unmaskedAt: string;
    expiresAt: string;
  };
}

export class MockCvRepository implements ICvRepository {
  private candidates: MockCandidateRecord[] = [...mockCandidatesRaw];
  private internalState = new Map<string, CandidateInternalState>();
  private unmaskedSessions = new Map<
    string,
    { actorId: string; actorName: string; reason: string; expiresAt: string }
  >();

  constructor() {
    this.initInternalStates();
  }

  private initInternalStates() {
    for (const c of this.candidates) {
      // Déterminer le pattern associé
      const folder = mockFolders.find((f) => f.id === c.folderId);
      const pattern = mockPatterns.find((p) => p.id === (folder?.patternId || 'PAT-TECH-04')) || mockPatterns[0];
      const version = mockPatternVersions.find(
        (v) => v.patternId === pattern.id && v.version === pattern.activeVersion,
      ) || mockPatternVersions[0];

      const initialFields: Record<string, ExtractedFieldValue> = {};

      // Initialisation des champs du socle et champs spécifiques
      for (const field of version.fields) {
        let val: any = '';
        let conf = c.aiConfidence || 95;
        let under = false;

        if (field.key === 'nom_complet' || field.key === 'identite_complete') {
          val = `${c._piiServerOnly.firstName} ${c._piiServerOnly.lastName}`;
          conf = 99;
        } else if (field.key === 'coordonnees_contact') {
          val = `${c._piiServerOnly.email} · ${c._piiServerOnly.phone}`;
          conf = 98;
        } else if (field.key === 'experiences_professionnelles') {
          val = c.experiences.map((e) => `${e.role} (${e.companySector}, ${e.period})`).join('\n');
          conf = 96;
        } else if (field.key === 'formations_diplomes') {
          val = c.education.map((e) => `${e.degree} - ${e.institutionType}`).join('\n');
          conf = 95;
        } else if (field.key === 'competences_cles') {
          val = c.skills.join(', ');
          conf = 97;
        } else if (field.key === 'annees_experience_data') {
          val = c.yearsExperience;
          conf = 94;
        } else if (field.key === 'architectures_cloud') {
          val = c.skills.filter((s) => ['Snowflake', 'Kafka', 'GCP BigQuery', 'Terraform', 'AWS'].includes(s));
          conf = 96;
        } else if (field.key === 'remuneration_souhaitee') {
          val = c.targetSalary;
          conf = 72; // Exemple sous le seuil 75% pour déclencher "À vérifier"
          under = true;
        } else if (field.key === 'mobilite_teletravail') {
          val = 'Hybride (2-3 jours)';
          conf = 91;
        } else {
          val = 'Donnée extraite conforme';
          conf = 90;
        }

        // Bounding boxes simulées pour l'interactivité viewer <-> formulaire
        let bbox = undefined;
        if (field.key === 'nom_complet' || field.key === 'identite_complete') {
          bbox = { id: 'bbox-id', page: 1, x: 8, y: 8, width: 36, height: 6, label: field.label };
        } else if (field.key === 'coordonnees_contact') {
          bbox = { id: 'bbox-contact', page: 1, x: 8, y: 15, width: 48, height: 7, label: field.label };
        } else if (field.key === 'experiences_professionnelles') {
          bbox = { id: 'bbox-exp', page: 1, x: 8, y: 46, width: 84, height: 26, label: field.label };
        } else if (field.key === 'formations_diplomes') {
          bbox = { id: 'bbox-edu', page: 2, x: 8, y: 10, width: 84, height: 18, label: field.label };
        } else if (field.key === 'competences_cles') {
          bbox = { id: 'bbox-skills', page: 2, x: 8, y: 32, width: 84, height: 18, label: field.label };
        } else if (field.key === 'remuneration_souhaitee') {
          bbox = { id: 'bbox-salary', page: 1, x: 8, y: 39, width: 38, height: 6, label: field.label };
        }

        initialFields[field.key] = {
          key: field.key,
          label: field.label,
          type: field.type,
          value: val,
          options: field.options,
          isPii: field.isPii,
          piiCategory: field.piiCategory,
          confidence: conf,
          isVerified: !under,
          underThreshold: under,
          bbox,
          aiPromptDescription: field.aiPromptDescription,
        };
      }

      // Candidat avec anomalie prompt_injection
      const isSuspicious = c.anomalies.some((a) => a.type === 'prompt_injection' || a.severity === 'critical');
      const isRestricted = c.rgpdStatus === 'dsr_requested';

      this.internalState.set(c.id, {
        version: 1,
        pipelineStage: c.id === 'cand-a1b2' ? 'Présélection' : 'Nouveau',
        isShortlisted: c.id === 'cand-a1b2',
        extractionStatus: isSuspicious ? 'error' : 'completed',
        isRestricted,
        fields: initialFields,
        notes: [
          {
            id: `note-${c.id}-1`,
            authorId: 'usr-idriss',
            authorName: 'Idriss Ouédraogo',
            authorRole: 'Talent Partner',
            content: 'Profil très prometteur pour le pôle Data & Cloud. Évaluation technique recommandée.',
            createdAt: '2026-03-02T10:15:00Z',
          },
        ],
        history: [
          {
            id: `hist-${c.id}-1`,
            action: 'EXTRACTION_COMPLETE',
            actorName: 'Agent LLM TalentLens v3.2',
            timestamp: c.createdAt,
            details: 'Extraction structurée via pattern sémantique PAT-TECH-04 v2.4 scellée RFC 3161.',
          },
        ],
      });
    }
  }

  async getByFolder(
    folderId: string,
    isBlindMode = true,
    unmaskContext?: UnmaskOptions,
  ): Promise<CvDocumentBlindDto[] | CvDocumentFullDto[]> {
    const list = this.candidates.filter((c) => c.folderId === folderId);
    if (isBlindMode) {
      return list.map(sanitizeToBlindDto);
    }
    return list.map((c) =>
      unmaskToFullDto(
        c,
        unmaskContext?.actorId || 'usr_auth',
        unmaskContext?.actorName || 'Utilisateur Habilité',
        unmaskContext?.reason || 'Mode aveugle levé sur le dossier',
      ),
    );
  }

  async getById(
    id: string,
    isBlindMode = true,
    unmaskContext?: UnmaskOptions,
  ): Promise<CvDocumentBlindDto | CvDocumentFullDto | null> {
    const found = this.candidates.find((c) => c.id === id);
    if (!found) return null;

    if (!isBlindMode && unmaskContext && unmaskContext.mfaTokenVerified) {
      return unmaskToFullDto(
        found,
        unmaskContext.actorId,
        unmaskContext.actorName,
        unmaskContext.reason,
      );
    }

    return sanitizeToBlindDto(found);
  }

  async search(params: {
    query?: string;
    folderId?: string;
    minYearsExp?: number;
    skills?: string[];
    isBlindMode?: boolean;
  }): Promise<CvDocumentBlindDto[]> {
    let result = this.candidates;

    if (params.folderId) {
      result = result.filter((c) => c.folderId === params.folderId);
    }
    if (params.minYearsExp !== undefined) {
      result = result.filter((c) => c.yearsExperience >= params.minYearsExp!);
    }
    if (params.skills && params.skills.length > 0) {
      result = result.filter((c) =>
        params.skills!.some((s) =>
          c.skills.some((cs) => cs.toLowerCase().includes(s.toLowerCase())),
        ),
      );
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (c) =>
          c.pseudonym.toLowerCase().includes(q) ||
          c.currentTitle.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)) ||
          c.experienceSummary.toLowerCase().includes(q),
      );
    }

    return result.map(sanitizeToBlindDto);
  }

  async updateAnomalyStatus(
    candidateId: string,
    anomalyId: string,
    resolved: boolean,
  ): Promise<boolean> {
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) return false;

    const anom = candidate.anomalies.find((a) => a.id === anomalyId);
    if (!anom) return false;

    anom.resolved = resolved;
    return true;
  }

  /**
   * Écran Central /cv/[id]
   * Fournit l'intégralité des données nécessaires avec étanchéité RGPD garantie.
   */
  async getCvDetail(id: string, isBlindMode = true, actorId?: string): Promise<CandidateCvDetail | null> {
    const candidate = this.candidates.find((c) => c.id === id);
    if (!candidate) return null;

    let state = this.internalState.get(id);
    if (!state) {
      this.initInternalStates();
      state = this.internalState.get(id)!;
    }

    const folder = mockFolders.find((f) => f.id === candidate.folderId) || mockFolders[0];
    const pattern = mockPatterns.find((p) => p.id === folder.patternId) || mockPatterns[0];
    const version = mockPatternVersions.find(
      (v) => v.patternId === pattern.id && v.version === pattern.activeVersion,
    ) || mockPatternVersions[0];

    // Déterminer la navigation (précédent/suivant)
    const folderCandidates = this.candidates.filter((c) => c.folderId === candidate.folderId);
    const currentIndex = folderCandidates.findIndex((c) => c.id === id);
    const previousId = currentIndex > 0 ? folderCandidates[currentIndex - 1].id : null;
    const nextId = currentIndex < folderCandidates.length - 1 ? folderCandidates[currentIndex + 1].id : null;

    // Vérifier si une levée d'anonymat est en cours pour ce candidat
    const unmaskSession = this.unmaskedSessions.get(id);
    const isActuallyUnmasked =
      !isBlindMode ||
      (unmaskSession !== undefined && new Date(unmaskSession.expiresAt).getTime() > Date.now());

    // Construction des champs selon le mode aveugle STRICT
    const fieldsCopy: Record<string, ExtractedFieldValue> = {};
    for (const [key, field] of Object.entries(state.fields)) {
      if (!isActuallyUnmasked && field.isPii) {
        // RÈGLE ABSOLUE : La valeur PII est remplacée par '***' côté serveur
        fieldsCopy[key] = {
          ...field,
          value: '***',
          underThreshold: false,
        };
      } else {
        fieldsCopy[key] = {
          ...field,
        };
      }
    }

    const detail: CandidateCvDetail = {
      id: candidate.id,
      pseudonym: candidate.pseudonym,
      hashId: candidate.hashId,
      folderId: candidate.folderId,
      folderReference: folder.reference,
      folderTitle: folder.title,
      currentTitle: candidate.currentTitle,
      yearsExperience: candidate.yearsExperience,
      seniorityLevel: candidate.seniorityLevel,
      location: candidate.location,
      pipelineStage: state.pipelineStage,
      isShortlisted: state.isShortlisted,
      isBlindMode: !isActuallyUnmasked,
      isRestricted: state.isRestricted,
      version: state.version,
      extractionStatus: state.extractionStatus,
      aiMatchScore: candidate.aiMatchScore,
      aiConfidence: candidate.aiConfidence,
      aiJustification: candidate.aiJustification,
      patternId: pattern.id,
      patternVersion: version.version,
      patternName: pattern.name,
      patternJsonSchema: version.jsonSchema,
      patternFields: version.fields,
      extractedFields: fieldsCopy,
      skills: candidate.skills.map((s) => ({ name: s })),
      experiences: candidate.experiences,
      education: candidate.education,
      notes: [...state.notes],
      history: [...state.history],
      anomalies: candidate.anomalies,
      navigation: {
        previousId,
        nextId,
        currentIndex: Math.max(0, currentIndex),
        totalInFolder: folderCandidates.length,
      },
    };

    if (isActuallyUnmasked) {
      detail.nominative = {
        firstName: candidate._piiServerOnly.firstName,
        lastName: candidate._piiServerOnly.lastName,
        email: candidate._piiServerOnly.email,
        phone: candidate._piiServerOnly.phone,
        fullAddress: candidate._piiServerOnly.fullAddress,
        originalCompanies: candidate._piiServerOnly.originalCompanies,
        originalInstitutions: candidate._piiServerOnly.originalInstitutions,
        originalPdfUrl: candidate._piiServerOnly.originalPdfUrl,
      };
      if (unmaskSession) {
        detail.unmaskInfo = {
          actorName: unmaskSession.actorName,
          reason: unmaskSession.reason,
          unmaskedAt: new Date().toISOString(),
          expiresAt: unmaskSession.expiresAt,
        };
      }
    }

    return detail;
  }

  async updateCvField(
    candidateId: string,
    key: string,
    value: any,
    clientVersion: number,
    user: { id: string; name: string },
  ): Promise<{ success: boolean; conflict?: boolean; currentVersion?: number; message?: string; newVersion?: number }> {
    const state = this.internalState.get(candidateId);
    if (!state) {
      return { success: false, message: 'Candidat introuvable' };
    }

    // Détection de conflit de concurrence optimiste
    if (state.version !== clientVersion) {
      return {
        success: false,
        conflict: true,
        currentVersion: state.version,
        message: 'Conflit de version détecté : la fiche a été modifiée par un autre utilisateur.',
      };
    }

    const field = state.fields[key];
    if (!field) {
      return { success: false, message: `Champ ${key} introuvable` };
    }

    // Protection RGPD : les champs PII ne peuvent pas être modifiés sans levée d'anonymat
    const isUnmasked = this.unmaskedSessions.has(candidateId);
    if (field.isPii && !isUnmasked) {
      return {
        success: false,
        message: 'Action refusée : les champs PII sont verrouillés et non modifiables en mode aveugle.',
      };
    }

    const originalAiValue = field.humanCorrection?.originalAiValue ?? field.value;
    const originalConfidence = field.humanCorrection?.originalConfidence ?? field.confidence;

    field.value = value;
    field.isVerified = true;
    field.underThreshold = false;
    field.humanCorrection = {
      correctedBy: user.name,
      correctedAt: new Date().toISOString(),
      originalAiValue,
      originalConfidence,
    };

    state.version += 1;
    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: 'FIELD_CORRECTED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Champ « ${field.label} » corrigé manuellement. Nouvelle valeur enregistrée.`,
    });

    return {
      success: true,
      newVersion: state.version,
    };
  }

  async validateCvField(candidateId: string, key: string, user: { name: string }): Promise<boolean> {
    const state = this.internalState.get(candidateId);
    if (!state || !state.fields[key]) return false;

    state.fields[key].isVerified = true;
    state.fields[key].underThreshold = false;
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: 'FIELD_VALIDATED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Champ « ${state.fields[key].label} » validé sous seuil d'incertitude.`,
    });

    return true;
  }

  async validateCvExtraction(candidateId: string, user: { name: string }): Promise<boolean> {
    const state = this.internalState.get(candidateId);
    if (!state) return false;

    state.extractionStatus = 'validated';
    for (const f of Object.values(state.fields)) {
      f.isVerified = true;
      f.underThreshold = false;
    }
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: 'EXTRACTION_VALIDATED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: 'Extraction globale certifiée et validée par le recruteur.',
    });

    return true;
  }

  async updateCvPipelineStage(candidateId: string, stage: string, user: { name: string }): Promise<boolean> {
    const state = this.internalState.get(candidateId);
    if (!state) return false;

    const prevStage = state.pipelineStage;
    state.pipelineStage = stage;
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: 'STAGE_CHANGED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: `Étape modifiée de « ${prevStage} » vers « ${stage} ».`,
    });

    return true;
  }

  async toggleCvShortlist(candidateId: string, user: { name: string }): Promise<boolean> {
    const state = this.internalState.get(candidateId);
    if (!state) return false;

    state.isShortlisted = !state.isShortlisted;
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: state.isShortlisted ? 'SHORTLIST_ADDED' : 'SHORTLIST_REMOVED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: state.isShortlisted ? 'Ajouté à la shortlist active.' : 'Retiré de la shortlist.',
    });

    return true;
  }

  async toggleCvRestriction(candidateId: string, user: { name: string }): Promise<boolean> {
    const state = this.internalState.get(candidateId);
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!state || !candidate) return false;

    state.isRestricted = !state.isRestricted;
    candidate.rgpdStatus = state.isRestricted ? 'dsr_requested' : 'compliant';
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: state.isRestricted ? 'RGPD_RESTRICTION_ENABLED' : 'RGPD_RESTRICTION_LIFTED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: state.isRestricted
        ? 'Opposition RGPD (Art. 21) activée : limitation de traitement en vigueur.'
        : 'Limitation de traitement levée.',
    });

    return true;
  }

  async addCvNote(
    candidateId: string,
    content: string,
    user: { id: string; name: string; role: string },
  ): Promise<CvInternalNote | null> {
    const state = this.internalState.get(candidateId);
    if (!state) return null;

    const newNote: CvInternalNote = {
      id: `note-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content,
      createdAt: new Date().toISOString(),
    };

    state.notes.unshift(newNote);
    state.version += 1;

    state.history.unshift({
      id: `hist-${Date.now()}`,
      action: 'NOTE_ADDED',
      actorName: user.name,
      timestamp: new Date().toISOString(),
      details: 'Nouvelle note interne d’évaluation enregistrée.',
    });

    return newNote;
  }

  async unmaskCv(
    candidateId: string,
    actorId: string,
    actorName: string,
    reason: string,
  ): Promise<CandidateCvDetail | null> {
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) return null;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    this.unmaskedSessions.set(candidateId, {
      actorId,
      actorName,
      reason,
      expiresAt,
    });

    const state = this.internalState.get(candidateId);
    if (state) {
      state.unmaskInfo = {
        actorName,
        reason,
        unmaskedAt: new Date().toISOString(),
        expiresAt,
      };
      state.history.unshift({
        id: `hist-${Date.now()}`,
        action: 'UNMASK_PERFORMED',
        actorName,
        timestamp: new Date().toISOString(),
        details: `Levée du mode aveugle autorisée (Art. 30 RGPD). Motif consigné : « ${reason} ». 2FA validée.`,
      });
      state.version += 1;
    }

    return this.getCvDetail(candidateId, false, actorId);
  }

  async deleteCv(candidateId: string, user: { name: string }): Promise<boolean> {
    const idx = this.candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) return false;

    this.candidates.splice(idx, 1);
    this.internalState.delete(candidateId);
    this.unmaskedSessions.delete(candidateId);
    return true;
  }
}
