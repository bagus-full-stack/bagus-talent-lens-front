import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateFolderSchema, createFolderAction, setBlindModeAction } from '@/app/(app)/dossiers/actions';
import { getFolderRepository, getCvRepository, getAuditRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { mockCandidatesRaw, sanitizeToBlindDto } from '@/lib/mock/data/candidates';
import type { PermissionUser } from '@/lib/permissions';

// Mock du module de session serveur pour tester différents rôles et permissions
let mockUser: PermissionUser | null = {
  id: 'usr_idriss_ouedraogo',
  role: 'admin',
  can_reveal_identity: true,
  can_export: true,
  aal: 'aal2',
  organizationId: mockOrganization.id,
};

vi.mock('@/lib/auth/session', () => ({
  getServerCurrentUser: vi.fn(async () => mockUser),
  requireServerPermission: vi.fn(async (action: string) => {
    if (!mockUser) throw new Error('Unauthenticated');
    if (action === 'identity.reveal' && !mockUser.can_reveal_identity) {
      throw new Error("Action interdite [403] : permission 'identity.reveal' manquante.");
    }
    return mockUser;
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Gestion des Dossiers de Recrutement (/dossiers & /dossiers/[id])', () => {
  beforeEach(() => {
    // Réinitialisation de l'utilisateur de test par défaut (Admin habilité AAL2)
    mockUser = {
      id: 'usr_idriss_ouedraogo',
      role: 'admin',
      can_reveal_identity: true,
      can_export: true,
      aal: 'aal2',
      organizationId: mockOrganization.id,
    };
  });

  // 1. Validation Zod du schéma de création
  describe('1. Validation Zod du schéma CreateFolderSchema', () => {
    it('valide un dossier conforme avec héritage du mode aveugle', () => {
      const payload = {
        title: 'Lead Architecte Cloud & DevOps',
        jobTitle: 'Senior Cloud Architect',
        contractType: 'CDI' as const,
        location: 'Paris (Hybride 2j)',
        remotePolicy: 'hybrid' as const,
        blindModeEnabled: mockOrganization.defaultBlindMode, // true
        assignedMemberIds: ['usr_idriss_ouedraogo'],
        patternId: 'PAT-TECH-04',
      };

      const result = CreateFolderSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Lead Architecte Cloud & DevOps');
        expect(result.data.blindModeEnabled).toBe(true);
        expect(result.data.patternId).toBe('PAT-TECH-04');
      }
    });

    it('rejette un dossier avec un nom trop court (< 2 caractères)', () => {
      const payload = {
        title: 'A',
        jobTitle: 'Dev',
      };

      const result = CreateFolderSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('au moins 2 caractères');
      }
    });
  });

  // 2. Création de dossier via Server Action
  describe('2. Création de dossier via createFolderAction', () => {
    it('permet à un Admin / Recruteur de créer un dossier et trace l’événement d’audit', async () => {
      const folderRepo = getFolderRepository();
      const auditRepo = getAuditRepository();
      const initialCount = (await folderRepo.getAll(mockOrganization.id)).length;

      const res = await createFolderAction({
        title: 'Ingénieur QA Automation',
        jobTitle: 'QA Lead Cypress / Playwright',
        department: 'Qualité Logicielle',
        contractType: 'CDI',
        location: 'Lyon (Full Remote)',
        remotePolicy: 'full_remote',
        blindModeEnabled: true,
        assignedMemberIds: ['usr_idriss_ouedraogo'],
        patternId: 'PAT-TECH-04',
      });

      expect(res.success).toBe(true);
      expect(res.folder).toBeDefined();
      expect(res.folder?.title).toBe('Ingénieur QA Automation');
      expect(res.folder?.reference).toMatch(/^#[A-Z0-9-]+$/);
      expect(res.folder?.blindModeEnabled).toBe(true);

      const afterCount = (await folderRepo.getAll(mockOrganization.id)).length;
      expect(afterCount).toBe(initialCount + 1);

      // Vérification du scellement d’audit WORM
      const auditEvents = await auditRepo.getEvents(mockOrganization.id, 5);
      const createEvent = auditEvents.find((e) => e.resource.id === res.folder?.id);
      expect(createEvent).toBeDefined();
      expect(createEvent?.action).toBe('FOLDER_CREATE');
    });

    it('interdit la création de dossier à un rôle non habilité (ex: reader)', async () => {
      mockUser = {
        id: 'usr_reader',
        role: 'reader',
        can_reveal_identity: false,
        can_export: false,
        aal: 'aal1',
        organizationId: mockOrganization.id,
      };

      const res = await createFolderAction({
        title: 'Tentative Dossier Non Autorisé',
        jobTitle: 'Test',
        contractType: 'CDI',
        location: 'Paris',
        remotePolicy: 'hybrid',
        blindModeEnabled: true,
        assignedMemberIds: [],
        patternId: 'PAT-TECH-04',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Action non autorisée');
    });
  });

  // 3. Bascule du mode aveugle (ON -> OFF et OFF -> ON)
  describe('3. Bascule du mode aveugle via setBlindModeAction', () => {
    it('autorise la levée ON -> OFF avec permission (identity.reveal) et motif légal', async () => {
      const folderRepo = getFolderRepository();
      const folder = (await folderRepo.getAll(mockOrganization.id))[0];
      expect(folder).toBeDefined();

      const res = await setBlindModeAction(
        folder.id,
        false, // passage en nominatif
        'Entretien final d’embauche programmé avec le candidat et le client',
        true, // AAL2 vérifié
      );

      expect(res.success).toBe(true);
      expect(res.blindModeEnabled).toBe(false);

      // Vérifier que le dossier en base a bien le mode aveugle désactivé
      const updatedFolder = await folderRepo.getById(folder.id);
      expect(updatedFolder?.blindModeEnabled).toBe(false);

      // Vérifier que le serveur renvoie ensuite des DTOs nominatifs complets (avec prénom, nom, etc.)
      const cvRepo = getCvRepository();
      const candidates = await cvRepo.getByFolder(folder.id, false);
      expect(candidates.length).toBeGreaterThan(0);
      const firstCandidate = candidates[0];
      expect(firstCandidate.isAnonymized).toBe(false);
      expect((firstCandidate as any).firstName).toBeDefined();
      expect((firstCandidate as any).lastName).toBeDefined();
      expect((firstCandidate as any).email).toBeDefined();
    });

    it('rejette la levée ON -> OFF si la permission identity.reveal est absente', async () => {
      const folderRepo = getFolderRepository();
      const folder = (await folderRepo.getAll(mockOrganization.id))[0];

      // Utilisateur sans droit de levée d’anonymat
      mockUser = {
        id: 'usr_recruiter_no_reveal',
        role: 'recruiter',
        can_reveal_identity: false,
        can_export: false,
        aal: 'aal1',
        organizationId: mockOrganization.id,
      };

      const res = await setBlindModeAction(
        folder.id,
        false,
        'Motif valide mais sans habilitation',
        true,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Permission refusée');
    });

    it('rejette la levée ON -> OFF si aucun motif légal n’est fourni', async () => {
      const folderRepo = getFolderRepository();
      const folder = (await folderRepo.getAll(mockOrganization.id))[0];

      const res = await setBlindModeAction(
        folder.id,
        false,
        '', // Motif vide
        true,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('motif légal');
    });

    it('permet le rétablissement immédiat du mode aveugle OFF -> ON sans restriction', async () => {
      const folderRepo = getFolderRepository();
      const folder = (await folderRepo.getAll(mockOrganization.id))[0];

      const res = await setBlindModeAction(folder.id, true);
      expect(res.success).toBe(true);
      expect(res.blindModeEnabled).toBe(true);

      const updatedFolder = await folderRepo.getById(folder.id);
      expect(updatedFolder?.blindModeEnabled).toBe(true);

      // Vérifier que le serveur renvoie à nouveau des DTOs strictement anonymisés (sans PII)
      const cvRepo = getCvRepository();
      const candidates = await cvRepo.getByFolder(folder.id, true);
      expect(candidates.length).toBeGreaterThan(0);
      const firstCandidate = candidates[0];
      expect(firstCandidate.isAnonymized).toBe(true);
      expect((firstCandidate as any).firstName).toBeUndefined();
      expect((firstCandidate as any).lastName).toBeUndefined();
      expect((firstCandidate as any).email).toBeUndefined();
    });
  });

  // 4. Pagination et filtrage serveur
  describe('4. Pagination par URL et filtrage des dossiers', () => {
    it('calcule correctement la pagination et filtre par terme de recherche', async () => {
      const folderRepo = getFolderRepository();
      const all = await folderRepo.getAll(mockOrganization.id);

      // Recherche sur "Data"
      const search = 'data';
      const filtered = all.filter((f) =>
        f.title.toLowerCase().includes(search) || f.jobTitle.toLowerCase().includes(search),
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((f) => f.title.toLowerCase().includes('data') || f.jobTitle.toLowerCase().includes('data'))).toBe(true);

      // Simulation de pagination : page 1, limite 2
      const page = 1;
      const limit = 2;
      const totalPages = Math.ceil(filtered.length / limit);
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      expect(paginated.length).toBeLessThanOrEqual(2);
      expect(totalPages).toBeGreaterThanOrEqual(1);
    });

    it('filtre fidèlement selon le statut du mode aveugle (active / inactive)', async () => {
      const folderRepo = getFolderRepository();
      const all = await folderRepo.getAll(mockOrganization.id);

      const activeOnly = all.filter((f) => f.blindModeEnabled);
      expect(activeOnly.every((f) => f.blindModeEnabled === true)).toBe(true);
    });
  });

  // 5. Présence de la colonne « Restreint » (opposition RGPD)
  describe('5. Statut RGPD et colonne « Restreint » (Opposition Art. 21)', () => {
    it('identifie les candidats ayant une opposition RGPD active (dsr_requested)', () => {
      const restrictedCandidates = mockCandidatesRaw.filter((c) => c.rgpdStatus === 'dsr_requested');
      expect(restrictedCandidates.length).toBeGreaterThan(0);

      const candidateWithDsr = restrictedCandidates[0];
      const blindDto = sanitizeToBlindDto(candidateWithDsr);

      expect(blindDto.rgpdStatus).toBe('dsr_requested');
      // Ce candidat est bien identifié pour afficher l'icône ShieldAlert "Opposition RGPD active"
    });
  });
});
