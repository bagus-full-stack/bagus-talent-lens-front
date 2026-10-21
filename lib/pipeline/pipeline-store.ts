import { mockCandidatesRaw, sanitizeToBlindDto } from '@/lib/mock/data/candidates';
import { mockFolders } from '@/lib/mock/data/folders';

export type StageCategory = 'active' | 'won' | 'lost';

export interface PipelineStageConfig {
  id: string;
  name: string;
  order: number;
  category: StageCategory;
  isBlindMandatory: boolean;
  isUnmaskTrigger: boolean; // Première étape de contact (ex: Entretien)
  colorKey: 'blue' | 'indigo' | 'amber' | 'purple' | 'emerald' | 'rose';
  description?: string;
}

export interface CandidacyTransition {
  id: string;
  fromStageId: string;
  toStageId: string;
  performedBy: string;
  performedAt: string;
  reason?: string;
  unmasked?: boolean;
}

export interface CandidacyInternalNote {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface PipelineCandidacy {
  id: string;
  version: number; // Numéro de version pour la détection de conflit
  folderId: string;
  candidateId: string; // ID dans mockCandidatesRaw
  pseudonym: string; // "Candidat #A1B2"
  unmaskedFullName?: string; // Nom réel disponible uniquement après unmask
  currentTitle: string;
  stageId: string;
  status: 'in_pipeline' | 'hired' | 'rejected';
  matchScore: number;
  yearsExperience: number;
  topSkills: string[];
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  daysInStage: number;
  appliedAt: string;
  updatedAt: string;
  isBlind: boolean;
  rejectionReason?: string;
  notes: CandidacyInternalNote[];
  history: CandidacyTransition[];
}

export const INITIAL_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'stg-new',
    name: 'Nouveau',
    order: 1,
    category: 'active',
    isBlindMandatory: true,
    isUnmaskTrigger: false,
    colorKey: 'blue',
    description: 'Candidatures importées ou reçues dans le vivier',
  },
  {
    id: 'stg-preselect',
    name: 'Présélectionné',
    order: 2,
    category: 'active',
    isBlindMandatory: true,
    isUnmaskTrigger: false,
    colorKey: 'indigo',
    description: 'Profils anonymes validés selon les critères indispensables',
  },
  {
    id: 'stg-interview',
    name: 'Entretien',
    order: 3,
    category: 'active',
    isBlindMandatory: false,
    isUnmaskTrigger: true, // Première étape de contact : levée de l'anonymat obligatoire
    colorKey: 'amber',
    description: 'Contact candidat avec point de rupture d’anonymat 2FA',
  },
  {
    id: 'stg-offer',
    name: 'Offre',
    order: 4,
    category: 'active',
    isBlindMandatory: false,
    isUnmaskTrigger: false,
    colorKey: 'purple',
    description: 'Proposition d’embauche et négociation contractuelle',
  },
  {
    id: 'stg-hired',
    name: 'Embauché',
    order: 5,
    category: 'won',
    isBlindMandatory: false,
    isUnmaskTrigger: false,
    colorKey: 'emerald',
    description: 'Contrat signé et intégration finalisée',
  },
  {
    id: 'stg-rejected',
    name: 'Refusé',
    order: 6,
    category: 'lost',
    isBlindMandatory: false,
    isUnmaskTrigger: false,
    colorKey: 'rose',
    description: 'Candidatures écartées avec motif objectif tracé',
  },
];

export const CODED_REJECTION_REASONS = [
  'Compétences techniques insuffisantes sur la stack requise',
  'Expérience professionnelle inférieure au niveau de séniorité attendu',
  'Prétentions salariales non alignées avec la grille du poste',
  'Disponibilité incompatible avec le calendrier du projet',
  'Niveau de maîtrise linguistique inférieur au seuil opérationnel',
  'Candidature retirée à l’initiative du candidat',
  'Profil retenu pour un autre poste au sein de l’organisation',
];

const RECRUITERS = [
  { id: 'usr_idriss_ouedraogo', name: 'Idriss Ouédraogo' },
  { id: 'usr_marc_lefebvre', name: 'Marc Lefebvre' },
  { id: 'usr_nadia_kaas', name: 'Nadia Kaas' },
  { id: 'usr_eleonore_chen', name: 'Éléonore Chen' },
];

function buildInitialCandidacies(): PipelineCandidacy[] {
  const result: PipelineCandidacy[] = [];
  const stages = INITIAL_PIPELINE_STAGES;

  // Répartition réaliste sur les premiers candidats
  for (let i = 0; i < Math.min(22, mockCandidatesRaw.length); i++) {
    const cand = mockCandidatesRaw[i];
    const rec = RECRUITERS[i % RECRUITERS.length];

    // Répartition équilibrée par étape
    let stageId = 'stg-new';
    let isBlind = true;
    let status: PipelineCandidacy['status'] = 'in_pipeline';
    let rejectionReason: string | undefined = undefined;

    if (i % 6 === 0) stageId = 'stg-new';
    else if (i % 6 === 1) stageId = 'stg-preselect';
    else if (i % 6 === 2) {
      stageId = 'stg-interview';
      isBlind = false; // Unmask déjà opéré
    } else if (i % 6 === 3) {
      stageId = 'stg-offer';
      isBlind = false;
    } else if (i % 6 === 4) {
      stageId = 'stg-hired';
      isBlind = false;
      status = 'hired';
    } else {
      stageId = 'stg-rejected';
      status = 'rejected';
      rejectionReason = CODED_REJECTION_REASONS[i % CODED_REJECTION_REASONS.length];
    }

    const days = Math.floor((i * 3 + 2) % 15) + 1;

    result.push({
      id: `cnd-${cand.id}`,
      version: 1,
      folderId: cand.folderId,
      candidateId: cand.id,
      pseudonym: cand.pseudonym,
      unmaskedFullName: isBlind ? undefined : `Alexandre ${cand.pseudonym.replace('Candidat #', '')}`,
      currentTitle: cand.currentTitle,
      stageId,
      status,
      matchScore: cand.aiMatchScore || 88,
      yearsExperience: cand.yearsExperience,
      topSkills: cand.skills.slice(0, 3),
      assignedRecruiterId: rec.id,
      assignedRecruiterName: rec.name,
      daysInStage: days,
      appliedAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-10-06T09:00:00Z',
      isBlind,
      rejectionReason,
      notes: [
        {
          id: `note-${i}-1`,
          authorName: 'Idriss Ouédraogo',
          authorRole: 'Lead Recruteur',
          content: 'Excellente maîtrise observée sur les architectures distribuées et pipelines temps réel.',
          createdAt: '2026-10-02T14:30:00Z',
        },
      ],
      history: [
        {
          id: `trans-${i}-1`,
          fromStageId: 'stg-new',
          toStageId: stageId,
          performedBy: 'Idriss Ouédraogo',
          performedAt: '2026-10-02T14:00:00Z',
          reason: stageId === 'stg-rejected' ? rejectionReason : undefined,
        },
      ],
    });
  }

  return result;
}

class PipelineStore {
  private stages: PipelineStageConfig[] = [...INITIAL_PIPELINE_STAGES];
  private candidacies: Map<string, PipelineCandidacy> = new Map();

  constructor() {
    const list = buildInitialCandidacies();
    for (const c of list) {
      this.candidacies.set(c.id, JSON.parse(JSON.stringify(c)));
    }
  }

  public getStages(): PipelineStageConfig[] {
    return [...this.stages].sort((a, b) => a.order - b.order);
  }

  public updateStages(stages: PipelineStageConfig[]): PipelineStageConfig[] {
    this.stages = [...stages].sort((a, b) => a.order - b.order);
    return this.getStages();
  }

  public getCandidacies(folderId?: string): PipelineCandidacy[] {
    const all = Array.from(this.candidacies.values());
    if (folderId && folderId !== 'all') {
      return all.filter((c) => c.folderId === folderId);
    }
    return all;
  }

  public getCandidacy(id: string): PipelineCandidacy | undefined {
    return this.candidacies.get(id);
  }

  /**
   * Transition d'étape avec vérification de version (conflit optimiste)
   */
  public moveCandidacy(params: {
    candidacyId: string;
    targetStageId: string;
    expectedVersion: number;
    reason?: string;
    unmaskReason?: string;
    recruiterName?: string;
  }): { success: boolean; conflict?: boolean; error?: string; candidacy?: PipelineCandidacy } {
    const candidacy = this.candidacies.get(params.candidacyId);
    if (!candidacy) {
      return { success: false, error: 'Candidature introuvable' };
    }

    // Détection de conflit de version (modification concurrente par un autre recruteur)
    if (candidacy.version !== params.expectedVersion) {
      return {
        success: false,
        conflict: true,
        error: `Conflit de synchronisation : ce candidat a été modifié entre-temps (version actuelle : ${candidacy.version}, attendue : ${params.expectedVersion}).`,
        candidacy,
      };
    }

    const targetStage = this.stages.find((s) => s.id === params.targetStageId);
    if (!targetStage) {
      return { success: false, error: 'Étape cible invalide' };
    }

    // Règle 1 : Catégorie 'lost' nécessite un motif obligatoire
    if (targetStage.category === 'lost') {
      if (!params.reason || !params.reason.trim()) {
        return {
          success: false,
          error: 'Un motif codé obligatoire doit être fourni pour classer un candidat en refus.',
        };
      }
      candidacy.status = 'rejected';
      candidacy.rejectionReason = params.reason;
    } else if (targetStage.category === 'won') {
      candidacy.status = 'hired';
      candidacy.rejectionReason = undefined;
    } else {
      candidacy.status = 'in_pipeline';
      candidacy.rejectionReason = undefined;
    }

    // Règle 2 : Étape de contact (isUnmaskTrigger) en mode aveugle nécessite justification
    let unmaskedNow = false;
    if (targetStage.isUnmaskTrigger && candidacy.isBlind) {
      candidacy.isBlind = false;
      candidacy.unmaskedFullName = `Alexandre ${candidacy.pseudonym.replace('Candidat #', '')}`;
      unmaskedNow = true;
    }

    const previousStageId = candidacy.stageId;
    candidacy.stageId = targetStage.id;
    candidacy.daysInStage = 0;
    candidacy.version += 1; // Incrément de version
    candidacy.updatedAt = new Date().toISOString();

    // Enregistrement dans l'historique
    candidacy.history.unshift({
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromStageId: previousStageId,
      toStageId: targetStage.id,
      performedBy: params.recruiterName || 'Idriss Ouédraogo',
      performedAt: new Date().toISOString(),
      reason: params.reason || params.unmaskReason,
      unmasked: unmaskedNow,
    });

    return { success: true, candidacy };
  }

  public addNote(candidacyId: string, content: string, authorName = 'Idriss Ouédraogo'): boolean {
    const c = this.candidacies.get(candidacyId);
    if (!c) return false;

    c.notes.unshift({
      id: `note-${Date.now()}`,
      authorName,
      authorRole: 'Recruteur',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });
    c.updatedAt = new Date().toISOString();
    return true;
  }

  public updateRecruiter(candidacyId: string, recruiterId: string): boolean {
    const c = this.candidacies.get(candidacyId);
    if (!c) return false;
    const rec = RECRUITERS.find((r) => r.id === recruiterId);
    if (!rec) return false;

    c.assignedRecruiterId = rec.id;
    c.assignedRecruiterName = rec.name;
    c.updatedAt = new Date().toISOString();
    return true;
  }

  public addCandidacy(candId: string, folderId: string): PipelineCandidacy | null {
    const cand = mockCandidatesRaw.find((c) => c.id === candId);
    if (!cand) return null;

    const newCnd: PipelineCandidacy = {
      id: `cnd-${cand.id}-${Date.now()}`,
      version: 1,
      folderId,
      candidateId: cand.id,
      pseudonym: cand.pseudonym,
      currentTitle: cand.currentTitle,
      stageId: 'stg-new',
      status: 'in_pipeline',
      matchScore: cand.aiMatchScore || 85,
      yearsExperience: cand.yearsExperience,
      topSkills: cand.skills.slice(0, 3),
      assignedRecruiterId: 'usr_idriss_ouedraogo',
      assignedRecruiterName: 'Idriss Ouédraogo',
      daysInStage: 0,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBlind: true,
      notes: [],
      history: [
        {
          id: `trans-init-${Date.now()}`,
          fromStageId: '',
          toStageId: 'stg-new',
          performedBy: 'Idriss Ouédraogo',
          performedAt: new Date().toISOString(),
          reason: 'Ajout manuel depuis le vivier',
        },
      ],
    };

    this.candidacies.set(newCnd.id, newCnd);
    return newCnd;
  }
}

export const pipelineStore = new PipelineStore();
export { RECRUITERS };
