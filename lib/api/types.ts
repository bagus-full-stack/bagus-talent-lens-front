import type {
  Organization,
  Membership,
  Folder,
  Pattern,
  PatternVersion,
  PatternField,
  CvDocumentBlindDto,
  CvDocumentFullDto,
  Candidacy,
  PipelineStage,
  Shortlist,
  Export,
  DataSubjectRequest,
  AuditEvent,
  CandidateCvDetail,
  CvInternalNote,
} from '@/types';

export interface UnmaskOptions {
  actorId: string;
  actorName: string;
  reason: string;
  mfaTokenVerified: boolean;
}

export interface ICvRepository {
  /**
   * Récupère la liste des candidats pour un dossier.
   * RÈGLE STRICTE : En mode aveugle (défaut), renvoie exclusivement des CvDocumentBlindDto.
   * Aucune PII n'est transmise au navigateur.
   */
  getByFolder(
    folderId: string,
    isBlindMode?: boolean,
    unmaskContext?: UnmaskOptions,
  ): Promise<CvDocumentBlindDto[] | CvDocumentFullDto[]>;
  getById(id: string, isBlindMode?: boolean, unmaskContext?: UnmaskOptions): Promise<CvDocumentBlindDto | CvDocumentFullDto | null>;
  search(params: {
    query?: string;
    folderId?: string;
    minYearsExp?: number;
    skills?: string[];
    isBlindMode?: boolean;
  }): Promise<CvDocumentBlindDto[]>;
  updateAnomalyStatus(candidateId: string, anomalyId: string, resolved: boolean): Promise<boolean>;

  // Méthodes pour l'écran central /cv/[id]
  getCvDetail(id: string, isBlindMode?: boolean, actorId?: string): Promise<CandidateCvDetail | null>;
  updateCvField(
    candidateId: string,
    key: string,
    value: any,
    clientVersion: number,
    user: { id: string; name: string },
  ): Promise<{ success: boolean; conflict?: boolean; currentVersion?: number; message?: string; newVersion?: number }>;
  validateCvField(candidateId: string, key: string, user: { name: string }): Promise<boolean>;
  validateCvExtraction(candidateId: string, user: { name: string }): Promise<boolean>;
  updateCvPipelineStage(candidateId: string, stage: string, user: { name: string }): Promise<boolean>;
  toggleCvShortlist(candidateId: string, user: { name: string }): Promise<boolean>;
  toggleCvRestriction(candidateId: string, user: { name: string }): Promise<boolean>;
  addCvNote(candidateId: string, content: string, user: { id: string; name: string; role: string }): Promise<CvInternalNote | null>;
  unmaskCv(candidateId: string, actorId: string, actorName: string, reason: string): Promise<CandidateCvDetail | null>;
  deleteCv(candidateId: string, user: { name: string }): Promise<boolean>;
}

export interface IFolderRepository {
  getAll(organizationId: string): Promise<Folder[]>;
  getById(id: string): Promise<Folder | null>;
  create(data: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'totalCandidates' | 'qualifiedCandidates'>): Promise<Folder>;
  update(id: string, data: Partial<Folder>): Promise<Folder | null>;
}

export interface IOrganizationRepository {
  getById(id: string): Promise<Organization | null>;
  getCurrent(): Promise<Organization>;
  getMembers(organizationId: string): Promise<Membership[]>;
  updateSettings(id: string, settings: Partial<Organization>): Promise<Organization>;
}

export interface IPipelineRepository {
  getStages(): Promise<PipelineStage[]>;
  getCandidaciesByFolder(folderId: string): Promise<Candidacy[]>;
  moveStage(candidacyId: string, targetStageId: string, reason?: string): Promise<Candidacy | null>;
}

export interface IShortlistRepository {
  getByFolder(folderId: string): Promise<Shortlist[]>;
  getById(id: string): Promise<Shortlist | null>;
  create(data: Omit<Shortlist, 'id' | 'createdAt' | 'updatedAt' | 'candidateCount'>): Promise<Shortlist>;
  reorderCandidates(shortlistId: string, candidateIds: string[]): Promise<Shortlist | null>;
}

export interface IExportRepository {
  getAll(organizationId: string): Promise<Export[]>;
  create(data: Omit<Export, 'id' | 'createdAt' | 'sha256Hash' | 'downloadCount'>): Promise<Export>;
}

export interface IDsrRepository {
  getAll(organizationId: string): Promise<DataSubjectRequest[]>;
  getById(id: string): Promise<DataSubjectRequest | null>;
  create(data: Omit<DataSubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'daysRemaining'>): Promise<DataSubjectRequest>;
  validateStep(dsrId: string, validatorId: string, comment?: string): Promise<DataSubjectRequest | null>;
}

export interface IAuditRepository {
  getEvents(organizationId: string, limit?: number): Promise<AuditEvent[]>;
  getAll(): Promise<AuditEvent[]>;
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'sha256Seal' | 'merkleVerified'>): Promise<AuditEvent>;
}

export interface IPatternRepository {
  getAll(): Promise<Pattern[]>;
  getById(id: string): Promise<Pattern | null>;
  getVersion(patternId: string, version: string): Promise<PatternVersion | null>;
  getVersions(patternId: string): Promise<PatternVersion[]>;
  create(data: { name: string; category: Pattern['category']; description: string; fields?: PatternField[] }): Promise<Pattern>;
  duplicate(id: string, newName?: string): Promise<Pattern>;
  archive(id: string): Promise<Pattern | null>;
  saveDraft(patternId: string, fields: PatternField[]): Promise<PatternVersion>;
  publishVersion(
    patternId: string,
    fields: PatternField[],
    options?: { reExtractExisting?: boolean }
  ): Promise<{
    version: PatternVersion;
    pattern: Pattern;
    reExtraction?: { affectedCvs: number; totalTokens: number; estimatedEur: number };
  }>;
  restoreVersion(patternId: string, targetVersion: string): Promise<{ version: PatternVersion; pattern: Pattern }>;
  testExtraction(
    fields: PatternField[],
    sampleCvId?: string,
  ): Promise<Array<{
    key: string;
    label: string;
    value: any;
    confidence: number;
    isPii: boolean;
  }>>;
}
