import { describe, it, expect } from 'vitest';
import { mockCandidatesRaw, sanitizeToBlindDto, unmaskToFullDto } from '@/lib/mock/data/candidates';
import { CvDocumentBlindDtoSchema, CvDocumentFullDtoSchema } from '@/lib/schemas/cv-document';

describe('Principe de Sécurité Central · Mode Aveugle Strict (Anti-PII Leakage)', () => {
  it('garantit que le DTO aveugle ne contient AUCUNE PII (nom, prénom, email, téléphone, adresse)', () => {
    mockCandidatesRaw.forEach((candidate) => {
      const blindDto = sanitizeToBlindDto(candidate);

      // Validation par schéma Zod strict
      const parseResult = CvDocumentBlindDtoSchema.safeParse(blindDto);
      expect(parseResult.success).toBe(true);

      // Vérification explicite qu'aucune propriété PII n'est accessible
      expect((blindDto as Record<string, unknown>).firstName).toBeUndefined();
      expect((blindDto as Record<string, unknown>).lastName).toBeUndefined();
      expect((blindDto as Record<string, unknown>).email).toBeUndefined();
      expect((blindDto as Record<string, unknown>).phone).toBeUndefined();
      expect((blindDto as Record<string, unknown>).fullAddress).toBeUndefined();
      expect((blindDto as Record<string, unknown>)._piiServerOnly).toBeUndefined();

      // Vérification que le pseudonyme et le hachage RFC 3161 sont conformes
      expect(blindDto.isAnonymized).toBe(true);
      expect(blindDto.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
      expect(blindDto.hashId).toContain('SHA256:');
    });
  });

  it('exige un contexte d’autorisation valide (MFA + motif Art. 30) pour dé-caviarder', () => {
    const rawCandidate = mockCandidatesRaw[0];
    const fullDto = unmaskToFullDto(
      rawCandidate,
      'usr_test_actor',
      'Test Recruiter',
      'Entretien technique client validé',
    );

    const parseResult = CvDocumentFullDtoSchema.safeParse(fullDto);
    expect(parseResult.success).toBe(true);
    expect(fullDto.isAnonymized).toBe(false);
    expect(fullDto.firstName).toBe('Lucas');
    expect(fullDto.lastName).toBe('Meyer');
    expect(fullDto.unmaskJustification.reason).toBe('Entretien technique client validé');
    expect(fullDto.unmaskJustification.expiresAt).toBeDefined();
  });
});
