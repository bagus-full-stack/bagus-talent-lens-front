import { describe, it, expect } from 'vitest';
import { createExportAction } from '@/app/actions/export';
import { getExportRepository } from '@/lib/api';
import { ServerExportGenerator } from '@/lib/exports/export-generator';
import type { Export } from '@/lib/schemas/export';
import { mockOrganization } from '@/lib/mock/data/organizations';

describe("Assistant d'Export et /exports - Sécurité, Plafond, Expiration & WORM", () => {
  const exportRepo = getExportRepository() as any;

  describe('1. Contrôles de Permissions & Export Nominatif', () => {
    it('Refuse un export nominatif si l’utilisateur n’a pas la permission export.named', async () => {
      const result = await createExportAction(
        {
          title: 'Export Test Nominatif Non Autorisé',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 10,
          format: 'pdf_shortlist',
          confidentiality: 'nominative_justified',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: true,
            includeNotes: false,
          },
          nominativeJustification: {
            reasonCode: 'RECRUITMENT_INTERVIEW_SCHEDULED',
            justificationText: 'Entretien prévu sous 48h',
            legalBasisConfirmed: true,
            reauthVerified: true,
          },
        },
        // Recruteur standard sans can_export nominatif
        {
          id: 'usr_recruiter_basic',
          name: 'Jean Recruteur',
          role: 'recruiter',
          can_export: false,
        }
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.error).toContain('export.named');
    });

    it('Refuse tout export pour le rôle reader / lecteur externe', async () => {
      const result = await createExportAction(
        {
          title: 'Export Anonymisé Tentative Reader',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 5,
          format: 'pdf_shortlist',
          confidentiality: 'anonymized_strict',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: false,
            includeNotes: false,
          },
        },
        {
          id: 'usr_reader_client',
          name: 'Client Observateur',
          role: 'reader',
        }
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.error).toContain('export.anonymized');
    });

    it('Refuse un export nominatif sans motif réglementaire obligatoire', async () => {
      const result = await createExportAction(
        {
          title: 'Export Nominatif Sans Motif',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 10,
          format: 'csv_table',
          confidentiality: 'nominative_justified',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: true,
            includeNotes: false,
          },
          // Justification absente
        },
        {
          id: 'usr_admin',
          name: 'Admin RH',
          role: 'admin',
          can_export: true,
        }
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('JUSTIFICATION_REQUIRED');
      expect(result.error).toContain('motif réglementaire codé');
    });

    it('Refuse un export nominatif si la confirmation de base légale RGPD n’est pas cochée', async () => {
      const result = await createExportAction(
        {
          title: 'Export Nominatif Sans Base Légale',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 10,
          format: 'csv_table',
          confidentiality: 'nominative_justified',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: true,
            includeNotes: false,
          },
          nominativeJustification: {
            reasonCode: 'RECRUITMENT_INTERVIEW_SCHEDULED',
            justificationText: 'Entretien prévu',
            legalBasisConfirmed: false, // Non confirmée
            reauthVerified: true,
          },
        },
        {
          id: 'usr_admin',
          name: 'Admin RH',
          role: 'admin',
          can_export: true,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('Refuse un export nominatif si la ré-authentification forte n’est pas validée', async () => {
      const result = await createExportAction(
        {
          title: 'Export Nominatif Sans 2FA',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 10,
          format: 'csv_table',
          confidentiality: 'nominative_justified',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: true,
            includeNotes: false,
          },
          nominativeJustification: {
            reasonCode: 'CLIENT_OFFER_CONTRACT',
            justificationText: 'Offre client',
            legalBasisConfirmed: true,
            reauthVerified: false, // Pas de ré-authentification
          },
        },
        {
          id: 'usr_admin',
          name: 'Admin RH',
          role: 'admin',
          can_export: true,
        }
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('REAUTH_REQUIRED');
      expect(result.error).toContain('Ré-authentification requise');
    });
  });

  describe('2. Contrôle du Plafond (200 Candidats Maximum)', () => {
    it('Refuse strictement un export dépassant le plafond de 200 candidats (ex: 201)', async () => {
      const result = await createExportAction(
        {
          title: 'Export Volume Trop Élevé',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 201, // Plafond dépassé
          format: 'pdf_shortlist',
          confidentiality: 'anonymized_strict',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: false,
            includeNotes: false,
          },
        },
        {
          id: 'usr_recruiter',
          name: 'Claire Recruteur',
          role: 'recruiter',
          can_export: true,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Plafond réglementaire dépassé');
    });

    it('Accepte un export au plafond limite exact de 200 candidats', async () => {
      const result = await createExportAction(
        {
          title: 'Export Volume Conforme 200 Candidats',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 200, // Limite exacte
          format: 'pdf_shortlist',
          confidentiality: 'anonymized_strict',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: false,
            includeNotes: false,
          },
        },
        {
          id: 'usr_recruiter',
          name: 'Claire Recruteur',
          role: 'recruiter',
          can_export: true,
        }
      );

      expect(result.success).toBe(true);
      expect(result.export).toBeDefined();
      expect(result.export?.candidateCount).toBe(200);
      expect(result.export?.id).toMatch(/^#EXP-2026-\d{4}$/);
    });
  });

  describe('3. Règle d’Anonymisation Stricte & Coordonnées Caviardées', () => {
    it('Désactive et caviarde systématiquement les coordonnées en mode anonymisé', async () => {
      const result = await createExportAction(
        {
          title: 'Export Anonymisé Garanti',
          folderId: 'fld-de-2026',
          folderReference: '#DE-2026',
          candidateCount: 5,
          format: 'csv_table',
          confidentiality: 'anonymized_strict',
          options: {
            includeScores: true,
            includeSkills: true,
            includeContact: true, // Demande malicieuse ou erronée
            includeNotes: false,
          },
        },
        {
          id: 'usr_recruiter',
          name: 'Claire Recruteur',
          role: 'recruiter',
          can_export: true,
        }
      );

      expect(result.success).toBe(true);
      // Les options enregistrées ont forcé includeContact à false
      expect(result.export?.options?.includeContact).toBe(false);

      // Génération du fichier CSV serveur
      const { file } = await exportRepo.generateFileContent(result.export!.id);
      const csvString = file.buffer.toString('utf-8');

      // Aucune donnée nominative de contact
      expect(csvString).toContain('MODE AVEUGLE NATIF');
      expect(csvString).toContain('[DONNEES MASQUEES - MODE AVEUGLE NATIF]');
      expect(csvString).not.toContain('candidat@email-verifie.fr');
    });
  });

  describe('4. Expiration du Lien (7 jours max) & Téléchargement Révocation', () => {
    it('Détecte les exports dont la date d’expiration est dépassée et révoque le téléchargement', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // J-1 (expiré)

      const expiredExport = await exportRepo.create({
        organizationId: mockOrganization.id,
        userId: 'usr_test',
        userName: 'Test User',
        userRole: 'RECRUITER',
        folderId: 'fld-de-2026',
        folderReference: '#DE-2026',
        folderTitle: 'Data Engineer',
        title: 'Export Archivé Purgé',
        format: 'pdf_shortlist',
        confidentiality: 'anonymized_strict',
        candidateCount: 10,
        fileSizeBytes: 2400000,
        expiresAt: pastDate,
        status: 'available',
      });

      // La méthode isExpired doit renvoyer true
      expect(exportRepo.isExpired(expiredExport)).toBe(true);

      // Le repository doit marquer le statut en 'expired'
      const retrieved = await exportRepo.getById(expiredExport.id);
      expect(retrieved?.status).toBe('expired');

      // La tentative de génération/téléchargement du fichier doit être rejetée
      await expect(exportRepo.generateFileContent(expiredExport.id)).rejects.toThrow(
        /expiré/i
      );
    });

    it('Autorise le téléchargement d’un export non expiré avec calcul de hash SHA-256 et filigrane', async () => {
      const validExport = await exportRepo.create({
        organizationId: mockOrganization.id,
        userId: 'usr_test',
        userName: 'Idriss Ouédraogo',
        userRole: 'LEAD_RECRUITER',
        folderId: 'fld-de-2026',
        folderReference: '#DE-2026',
        folderTitle: 'Data Engineer',
        title: 'Synthèse Valide 7 Jours',
        format: 'pdf_shortlist',
        confidentiality: 'anonymized_strict',
        candidateCount: 8,
        fileSizeBytes: 2400000,
        status: 'available',
      });

      expect(exportRepo.isExpired(validExport)).toBe(false);

      const { file, exportItem } = await exportRepo.generateFileContent(validExport.id);
      expect(file.mimeType).toBe('application/pdf');
      expect(file.filename).toContain('talentlens_export_');
      expect(file.sha256Hash).toMatch(/^SHA256:[a-f0-9]{64}$/);

      // Enregistre le téléchargement
      const updated = await exportRepo.recordDownload(validExport.id);
      expect(updated?.downloadCount).toBe(1);
      expect(updated?.status).toBe('downloaded');
    });
  });
});
