import type { IDsrRepository } from '@/lib/api/types';
import type { DataSubjectRequest, DsrStatus, DsrComment } from '@/lib/schemas/dsr';
import { mockDsrRequests } from '../data/dsr';
import { DsrService } from '@/lib/rgpd/dsr-service';

export class MockDsrRepository implements IDsrRepository {
  private dsrs: DataSubjectRequest[] = [...mockDsrRequests];

  /**
   * Retourne toutes les demandes avec calcul dynamique du compte à rebours de l'échéance légale CNIL (J+30).
   */
  async getAll(organizationId: string): Promise<DataSubjectRequest[]> {
    const now = Date.now();
    return this.dsrs
      .filter((d) => d.organizationId === organizationId)
      .map((d) => {
        // Recalcul du nombre de jours restants
        if (d.status !== 'fulfilled' && d.status !== 'rejected') {
          const diffMs = new Date(d.legalDeadline).getTime() - now;
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          return { ...d, daysRemaining: days };
        }
        return d;
      })
      .sort((a, b) => {
        // Tri prioritaire : d'abord les demandes ouvertes les plus urgentes (jours restants ascendants)
        if (a.status !== 'fulfilled' && b.status === 'fulfilled') return -1;
        if (a.status === 'fulfilled' && b.status !== 'fulfilled') return 1;
        return a.daysRemaining - b.daysRemaining;
      });
  }

  async getById(id: string): Promise<DataSubjectRequest | null> {
    const found = this.dsrs.find((d) => d.id === id);
    if (!found) return null;

    if (found.status !== 'fulfilled' && found.status !== 'rejected') {
      const diffMs = new Date(found.legalDeadline).getTime() - Date.now();
      found.daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return found;
  }

  async create(
    data: Omit<DataSubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'daysRemaining'>
  ): Promise<DataSubjectRequest> {
    const num = Math.floor(100 + Math.random() * 900);
    const id = `#DSR-2026-${num}`;
    const nowIso = new Date().toISOString();

    // Délai légal CNIL : J+30 calendaires
    const legalDeadline =
      data.legalDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const dataLocations =
      data.dataLocations && data.dataLocations.length > 0
        ? data.dataLocations
        : DsrService.getCandidateInventory(data.candidateId || 'cand-new', data.candidatePseudonym);

    const newDsr: DataSubjectRequest = {
      ...data,
      id,
      legalDeadline,
      daysRemaining: 30,
      dataLocations,
      comments: data.comments || [],
      attachments: data.attachments || [],
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: nowIso,
          action: 'CREATION_DEMANDE',
          actorName: data.assignedDpoName || 'DPO',
          actorRole: 'DPO',
          details: `Demande d’exercice de droit (${data.requestType}) initiée pour ${data.candidatePseudonym}`,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.dsrs.unshift(newDsr);
    return newDsr;
  }

  /**
   * Ajoute un commentaire interne au dossier DSR
   */
  async addComment(
    id: string,
    comment: Omit<DsrComment, 'id' | 'createdAt'>
  ): Promise<DataSubjectRequest | null> {
    const dsr = await this.getById(id);
    if (!dsr) return null;

    const newComment: DsrComment = {
      ...comment,
      id: `cmt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!dsr.comments) dsr.comments = [];
    dsr.comments.push(newComment);
    dsr.updatedAt = new Date().toISOString();

    return dsr;
  }

  /**
   * Fait avancer le statut général d'une demande
   */
  async advanceStatus(
    id: string,
    newStatus: DsrStatus,
    actor: { id: string; name: string; role: string },
    comment?: string
  ): Promise<DataSubjectRequest | null> {
    const dsr = await this.getById(id);
    if (!dsr) return null;

    dsr.status = newStatus;
    dsr.updatedAt = new Date().toISOString();

    if (!dsr.history) dsr.history = [];
    dsr.history.push({
      id: `hist-${Date.now()}`,
      timestamp: dsr.updatedAt,
      action: `CHANGEMENT_STATUT_${newStatus.toUpperCase()}`,
      actorName: actor.name,
      actorRole: actor.role,
      details: comment || `Passage au statut ${newStatus}`,
    });

    if (newStatus === 'fulfilled' || newStatus === 'rejected') {
      dsr.closedAt = dsr.updatedAt;
    }

    return dsr;
  }

  /**
   * Double validation d'effacement (Art. 17).
   * RÈGLE STRICTE : Le second validateur doit être DISTINCT du premier validateur !
   */
  async validateErasureStep(
    dsrId: string,
    validator: { id: string; name: string; role: string },
    comment?: string
  ): Promise<DataSubjectRequest | null> {
    const dsr = await this.getById(dsrId);
    if (!dsr) return null;

    const nowIso = new Date().toISOString();
    if (!dsr.history) dsr.history = [];

    // Cas 1 : Première validation (ou passage en cours)
    if (!dsr.firstValidatorId) {
      dsr.firstValidatorId = validator.id;
      dsr.firstValidatorName = validator.name;
      dsr.firstValidatedAt = nowIso;
      dsr.status = 'under_review';
      dsr.updatedAt = nowIso;

      dsr.history.push({
        id: `hist-${Date.now()}`,
        timestamp: nowIso,
        action: 'PREMIERE_VALIDATION_EFFACEMENT',
        actorName: validator.name,
        actorRole: validator.role,
        details: comment || 'Premier niveau de validation d’effacement accordé (DPO / Admin).',
      });

      return dsr;
    }

    // Cas 2 : Seconde validation
    // RÈGLE DE SÉCURITÉ : UN MÊME UTILISATEUR NE PEUT PAS ÊTRE LE PREMIER ET LE SECOND VALIDATEUR !
    if (dsr.firstValidatorId === validator.id) {
      throw new Error(
        'Double validation refusée : le second validateur doit être un utilisateur distinct du premier validateur.'
      );
    }

    // Enregistrement de la seconde validation et clôture
    dsr.secondValidatorId = validator.id;
    dsr.secondValidatorName = validator.name;
    dsr.secondValidatedAt = nowIso;
    dsr.status = 'fulfilled';
    dsr.closedAt = nowIso;
    dsr.updatedAt = nowIso;

    // Purge de l'ensemble des composants inventoriés
    if (dsr.dataLocations) {
      dsr.dataLocations = dsr.dataLocations.map((loc) => ({
        ...loc,
        status: 'purged' as const,
      }));
    }

    // Scellement WORM
    dsr.sha256Certificate = `CERT-WORM-SHA256-${Date.now().toString(16)}-${dsr.id.replace('#', '')}`;
    dsr.closureReason = comment || 'Effacement intégral exécuté après double validation conjointe.';

    dsr.history.push({
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      action: 'SECONDE_VALIDATION_EFFACEMENT_CLOTURE',
      actorName: validator.name,
      actorRole: validator.role,
      details: comment || 'Second niveau de validation accordé. Cascade d’effacement exécutée.',
    });

    return dsr;
  }

  /**
   * Action de restriction / opposition (Art. 18 & 21)
   */
  async restrictCandidateTreatment(
    dsrId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<DataSubjectRequest | null> {
    const dsr = await this.getById(dsrId);
    if (!dsr) return null;

    const nowIso = new Date().toISOString();
    dsr.status = 'fulfilled';
    dsr.closedAt = nowIso;
    dsr.updatedAt = nowIso;

    if (dsr.dataLocations) {
      dsr.dataLocations = dsr.dataLocations.map((loc) => ({
        ...loc,
        status: 'restricted' as const,
      }));
    }

    if (!dsr.history) dsr.history = [];
    dsr.history.push({
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      action: 'RESTRICTION_TRAITEMENT_APPLIQUEE',
      actorName: actor.name,
      actorRole: actor.role,
      details: 'Traitement restreint (drapeau restriction activé, exclu du matching et des exports).',
    });

    return dsr;
  }

  // Compatibilité avec l'interface legacy IDsrRepository
  async validateStep(dsrId: string, validatorId: string, comment?: string): Promise<DataSubjectRequest | null> {
    return this.validateErasureStep(dsrId, { id: validatorId, name: 'Validateur', role: 'DPO' }, comment);
  }
}
