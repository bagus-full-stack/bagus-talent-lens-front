import type {
  Conversation,
  ChatMessage,
  CitationSource,
  ProtectedCriterionRefusal,
} from '@/lib/schemas/chatbot';
import { mockCandidatesRaw, type MockCandidateRecord } from '@/lib/mock/data/candidates';
import { mockFolders } from '@/lib/mock/data/folders';
import { checkProtectedCriterion } from '@/lib/search/protected-criteria';

export interface CandidateChunk {
  chunkId: string;
  candidateId: string;
  candidatePseudonym: string;
  folderId: string;
  folderReference: string;
  jobTitle: string;
  page: number;
  bbox: {
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  };
  snippet: string;
  keywords: string[];
}

/**
 * Extraction et découpage de chunks sourcés depuis les profils de candidats
 */
function buildCandidateChunks(): CandidateChunk[] {
  const chunks: CandidateChunk[] = [];

  for (const cand of mockCandidatesRaw) {
    const folder = mockFolders.find((f) => f.id === cand.folderId);
    const folderRef = folder?.reference || '#REF';

    // Chunk 1: Compétences clés
    chunks.push({
      chunkId: `chk-${cand.id}-skills`,
      candidateId: cand.id,
      candidatePseudonym: cand.pseudonym,
      folderId: cand.folderId,
      folderReference: folderRef,
      jobTitle: cand.currentTitle,
      page: 1,
      bbox: {
        id: `bbox-${cand.id}-skills`,
        page: 1,
        x: 10,
        y: 22,
        width: 80,
        height: 14,
        label: 'Compétences attestées',
      },
      snippet: `Compétences vérifiées : ${cand.skills.join(', ')}. Niveau de séniorité : ${cand.seniorityLevel} (${cand.yearsExperience} ans d'expérience).`,
      keywords: cand.skills.map((s) => s.toLowerCase()),
    });

    // Chunk 2: Expériences et réalisations
    if (cand.experiences && cand.experiences.length > 0) {
      const exp = cand.experiences[0];
      chunks.push({
        chunkId: `chk-${cand.id}-exp1`,
        candidateId: cand.id,
        candidatePseudonym: cand.pseudonym,
        folderId: cand.folderId,
        folderReference: folderRef,
        jobTitle: cand.currentTitle,
        page: 1,
        bbox: {
          id: `bbox-${cand.id}-exp1`,
          page: 1,
          x: 10,
          y: 40,
          width: 80,
          height: 26,
          label: `Poste : ${exp.role}`,
        },
        snippet: `${exp.role} chez ${exp.companySector} (${exp.period}). ${exp.summary} ${exp.highlights.join(' ')}`,
        keywords: [
          exp.role.toLowerCase(),
          ...exp.highlights.flatMap((h) => h.toLowerCase().split(/\s+/)),
        ],
      });
    }

    // Chunk 3: Formation et certifications
    if (cand.education && cand.education.length > 0) {
      const edu = cand.education[0];
      chunks.push({
        chunkId: `chk-${cand.id}-edu`,
        candidateId: cand.id,
        candidatePseudonym: cand.pseudonym,
        folderId: cand.folderId,
        folderReference: folderRef,
        jobTitle: cand.currentTitle,
        page: 2,
        bbox: {
          id: `bbox-${cand.id}-edu`,
          page: 2,
          x: 10,
          y: 15,
          width: 80,
          height: 18,
          label: 'Formation & Certifications',
        },
        snippet: `Diplôme : ${edu.degree} (${edu.year}). Établissement : ${edu.institutionType}. Justification IA : ${cand.aiJustification}`,
        keywords: [edu.degree.toLowerCase(), edu.institutionType.toLowerCase()],
      });
    }
  }

  return chunks;
}

const ALL_CHUNKS = buildCandidateChunks();

// Initial Mock Conversations stockées côté serveur
const initialConversations: Conversation[] = [
  {
    id: 'conv-cyb-comparative',
    title: 'Comparatif Profils SOC Cybersécurité',
    selectedFolderIds: ['fld-cyb-88'],
    createdAt: '2026-10-06T10:15:00Z',
    updatedAt: '2026-10-06T10:18:00Z',
    messages: [
      {
        id: 'msg-init-1',
        role: 'user',
        content:
          'Quelles sont les compétences différentielles entre les candidats du dossier #CYB-88 pour la gestion d’incidents SOC et la conformité NIS2 ?',
        createdAt: '2026-10-06T10:15:10Z',
        status: 'complete',
        type: 'text',
      },
      {
        id: 'msg-init-2',
        role: 'assistant',
        content: `D'après l'analyse objective des extraits CV du dossier **#CYB-88** (Cybersécurité Senior SOC) :\n\n1. **Candidat #C8F2** [1] démontre une forte spécialisation en pilotage opérationnel d'incidents avec la détention du CISSP, la maîtrise de SIEM Splunk et CrowdStrike Falcon [2]. Il justifie d'une pratique active de réponse aux cyberattaques.\n\n2. **Candidat #E3D9** [3] se distingue davantage sur l'aspect conformité réglementaire et gouvernance cloud, notamment l'audit RGPD et l'architecture sécurisée AWS. Son profil est complémentaire pour adresser les exigences de documentation NIS2.\n\n3. **Candidat #TX91** concentre ses atouts sur le Threat Hunting et le framework Mitre ATT&CK avec des règles YARA personnalisées.\n\n*Rappel éthique : Cette synthèse découle uniquement des compétences techniques attestées sans prise en compte de critères extra-professionnels.*`,
        createdAt: '2026-10-06T10:15:45Z',
        status: 'complete',
        type: 'text',
        citations: [
          {
            index: 1,
            chunkId: 'chk-cand-c8f2-skills',
            candidateId: 'cand-c8f2',
            candidatePseudonym: 'Candidat #C8F2',
            folderId: 'fld-cyb-88',
            folderReference: '#CYB-88',
            jobTitle: 'Senior Security Operations & Incident Responder',
            page: 1,
            bbox: {
              id: 'bbox-cand-c8f2-skills',
              page: 1,
              x: 10,
              y: 22,
              width: 80,
              height: 14,
              label: 'Compétences attestées',
            },
            snippet:
              "Compétences vérifiées : CISSP, SIEM Splunk, CrowdStrike Falcon, MITRE ATT&CK, Analyse Forensics. Niveau de séniorité : senior (7 ans d'expérience).",
            relevanceScore: 96,
            verified: true,
          },
          {
            index: 2,
            chunkId: 'chk-cand-c8f2-exp1',
            candidateId: 'cand-c8f2',
            candidatePseudonym: 'Candidat #C8F2',
            folderId: 'fld-cyb-88',
            folderReference: '#CYB-88',
            jobTitle: 'Senior Security Operations & Incident Responder',
            page: 1,
            bbox: {
              id: 'bbox-cand-c8f2-exp1',
              page: 1,
              x: 10,
              y: 40,
              width: 80,
              height: 26,
              label: 'Poste : Senior Incident Responder',
            },
            snippet:
              "Senior Incident Responder chez MSSP Européen (SOC Managé) (2020 - Présent). Investigation et endiguement de plus de 40 incidents critiques ransomware et APT.",
            relevanceScore: 92,
            verified: true,
          },
          {
            index: 3,
            chunkId: 'chk-cand-e3d9-skills',
            candidateId: 'cand-e3d9',
            candidatePseudonym: 'Candidat #E3D9',
            folderId: 'fld-cyb-88',
            folderReference: '#CYB-88',
            jobTitle: 'Architecte Sécurité & Conformité Cloud',
            page: 1,
            bbox: {
              id: 'bbox-cand-e3d9-skills',
              page: 1,
              x: 10,
              y: 22,
              width: 80,
              height: 14,
              label: 'Compétences attestées',
            },
            snippet:
              "Compétences vérifiées : CISSP, Cloud Security AWS, Audit RGPD, ISO 27001, Terraform Sec. Niveau de séniorité : lead (9 ans d'expérience).",
            relevanceScore: 88,
            verified: true,
          },
        ],
        feedback: 'helpful',
      },
    ],
  },
  {
    id: 'conv-data-platform',
    title: 'Architecture Lakehouse Data Platform',
    selectedFolderIds: ['fld-de-2026'],
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T09:04:00Z',
    messages: [
      {
        id: 'msg-init-3',
        role: 'user',
        content:
          'Quel profil présente la plus grande maîtrise de Snowflake et d’ingestion temps réel Kafka ?',
        createdAt: '2026-10-06T09:00:10Z',
        status: 'complete',
        type: 'text',
      },
      {
        id: 'msg-init-4',
        role: 'assistant',
        content: `Pour le rôle d'architecture lakehouse avec Snowflake et Kafka, le profil le plus solide identifié dans le dossier **#DE-2026** est le **Candidat #A1B2** [1].\n\n• **Points forts avérés** : Direction technique sur un Data Lake Snowflake et Kafka avec réduction de latence de 45% et flux jusqu'à 40k msg/s [2].\n• **Gouvernance des données** : Expérience documentée en anonymisation continue conforme RGPD.\n• **Certification / Formation** : Diplôme d'Ingénieur en Informatique [3].`,
        createdAt: '2026-10-06T09:01:05Z',
        status: 'complete',
        type: 'text',
        citations: [
          {
            index: 1,
            chunkId: 'chk-cand-a1b2-skills',
            candidateId: 'cand-a1b2',
            candidatePseudonym: 'Candidat #A1B2',
            folderId: 'fld-de-2026',
            folderReference: '#DE-2026',
            jobTitle: 'Lead Data Platform & Architect',
            page: 1,
            bbox: {
              id: 'bbox-cand-a1b2-skills',
              page: 1,
              x: 10,
              y: 22,
              width: 80,
              height: 14,
              label: 'Compétences attestées',
            },
            snippet:
              "Compétences vérifiées : Snowflake, Python avancé, Apache Kafka, Data Governance, GCP BigQuery, Terraform, dbt. Niveau : lead (8 ans d'expérience).",
            relevanceScore: 98,
            verified: true,
          },
          {
            index: 2,
            chunkId: 'chk-cand-a1b2-exp1',
            candidateId: 'cand-a1b2',
            candidatePseudonym: 'Candidat #A1B2',
            folderId: 'fld-de-2026',
            folderReference: '#DE-2026',
            jobTitle: 'Lead Data Platform & Architect',
            page: 1,
            bbox: {
              id: 'bbox-cand-a1b2-exp1',
              page: 1,
              x: 10,
              y: 40,
              width: 80,
              height: 26,
              label: 'Poste : Lead Data Engineer',
            },
            snippet:
              "Lead Data Engineer chez FinTech Licorne (2021 - Présent). Refonte complète du Data Lake sous Snowflake et Kafka (-45% latence). Architecture streaming temps réel (40k msg/s).",
            relevanceScore: 95,
            verified: true,
          },
          {
            index: 3,
            chunkId: 'chk-cand-a1b2-edu',
            candidateId: 'cand-a1b2',
            candidatePseudonym: 'Candidat #A1B2',
            folderId: 'fld-de-2026',
            folderReference: '#DE-2026',
            jobTitle: 'Lead Data Platform & Architect',
            page: 2,
            bbox: {
              id: 'bbox-cand-a1b2-edu',
              page: 2,
              x: 10,
              y: 15,
              width: 80,
              height: 18,
              label: 'Formation & Certifications',
            },
            snippet:
              "Diplôme d'Ingénieur en Informatique (2016). Adéquation avec l'architecture lakehouse requise.",
            relevanceScore: 85,
            verified: true,
          },
        ],
        feedback: null,
      },
    ],
  },
];

// Serveur mémoire persistant
class ChatbotRepository {
  private conversations: Map<string, Conversation> = new Map();

  constructor() {
    for (const conv of initialConversations) {
      this.conversations.set(conv.id, JSON.parse(JSON.stringify(conv)));
    }
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  public createConversation(input: {
    title?: string;
    selectedFolderIds?: string[];
  }): Conversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id,
      title: input.title?.trim() || 'Nouvelle conversation',
      selectedFolderIds: input.selectedFolderIds || [],
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.conversations.set(id, newConv);
    return newConv;
  }

  public updateConversation(
    id: string,
    partial: Partial<Pick<Conversation, 'title' | 'selectedFolderIds'>>
  ): Conversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;

    if (partial.title !== undefined) conv.title = partial.title;
    if (partial.selectedFolderIds !== undefined) conv.selectedFolderIds = partial.selectedFolderIds;
    conv.updatedAt = new Date().toISOString();

    return conv;
  }

  public deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  public addMessage(convId: string, message: ChatMessage): Conversation | undefined {
    const conv = this.conversations.get(convId);
    if (!conv) return undefined;

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    // Auto title if first user message
    if (conv.messages.length === 1 && message.role === 'user') {
      conv.title =
        message.content.length > 40
          ? `${message.content.substring(0, 40).trim()}...`
          : message.content;
    }
    return conv;
  }

  public updateMessage(
    convId: string,
    messageId: string,
    partial: Partial<ChatMessage>
  ): Conversation | undefined {
    const conv = this.conversations.get(convId);
    if (!conv) return undefined;

    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return undefined;

    Object.assign(msg, partial);
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  public updateFeedback(
    convId: string,
    messageId: string,
    feedback: 'helpful' | 'unhelpful' | null
  ): boolean {
    const conv = this.conversations.get(convId);
    if (!conv) return false;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.feedback = feedback;
    return true;
  }

  /**
   * Recherche de chunks pertinents dans les dossiers interrogés
   */
  public searchChunks(query: string, folderIds: string[]): CandidateChunk[] {
    const terms = query
      .toLowerCase()
      .split(/[\s,;.!?'"()]+/)
      .filter((t) => t.length >= 3);

    let candidates = ALL_CHUNKS;
    if (folderIds && folderIds.length > 0) {
      candidates = candidates.filter((c) => folderIds.includes(c.folderId));
    }

    if (terms.length === 0) {
      return candidates.slice(0, 5);
    }

    const scored = candidates.map((chunk) => {
      let score = 0;
      const fullText = `${chunk.snippet} ${chunk.jobTitle} ${chunk.keywords.join(' ')}`.toLowerCase();
      for (const t of terms) {
        if (fullText.includes(t)) {
          score += 10;
        }
      }
      return { chunk, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.chunk);
  }
}

export const chatbotRepository = new ChatbotRepository();
