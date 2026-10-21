import type { Pattern, PatternVersion, PatternField } from '@/types';
import { DEFAULT_SOCLE_FIELDS, generateJsonSchema } from '@/lib/schemas/pattern';

export const mockPatterns: Pattern[] = [
  {
    id: 'PAT-TECH-04',
    name: 'Tech & Ingénierie Data',
    category: 'Tech',
    description: 'Extraction approfondie des architectures distribuées, frameworks Big Data & certifications cloud.',
    activeVersion: 'v2.4',
    totalFields: 10,
    piiFieldsCount: 5,
    extractedCvCount: 1420,
    matchingAccuracy: 98.2,
    status: 'active',
    updatedAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'PAT-SALES-02',
    name: 'Profils Commerciaux & Vente B2B',
    category: 'Commercial',
    description: 'Détection des cycles de vente, ARR signés, quotas et méthodologies MEDDIC/Challenger.',
    activeVersion: 'v1.2',
    totalFields: 9,
    piiFieldsCount: 4,
    extractedCvCount: 680,
    matchingAccuracy: 94.1,
    status: 'active',
    updatedAt: '2026-02-14T11:00:00Z',
  },
  {
    id: 'PAT-DEVOPS-03',
    name: 'Ingénierie DevOps & Cloud',
    category: 'Tech',
    description: 'Certification Kubernetes, Terraform IaC, observabilité et pratiques SRE.',
    activeVersion: 'v3.0',
    totalFields: 11,
    piiFieldsCount: 4,
    extractedCvCount: 0,
    matchingAccuracy: 95.0,
    status: 'draft',
    updatedAt: '2026-10-01T15:30:00Z',
  },
  {
    id: 'PAT-SUPP-01',
    name: 'Support & Relation Client',
    category: 'Support',
    description: 'Extraction des langues maîtrisées, outils CRM et métriques CSAT / First Response.',
    activeVersion: 'v1.0',
    totalFields: 8,
    piiFieldsCount: 4,
    extractedCvCount: 312,
    matchingAccuracy: 91.8,
    status: 'active',
    updatedAt: '2026-02-02T09:00:00Z',
  },
  {
    id: 'PAT-EXEC-02',
    name: 'Cadres Exécutifs & Direction',
    category: 'Management',
    description: 'P&L managé, effectifs encadrés, gouvernance et transformation stratégique.',
    activeVersion: 'v2.0',
    totalFields: 9,
    piiFieldsCount: 4,
    extractedCvCount: 190,
    matchingAccuracy: 97.5,
    status: 'active',
    updatedAt: '2026-01-28T14:00:00Z',
  },
];

const techFieldsV24: PatternField[] = [
  ...DEFAULT_SOCLE_FIELDS,
  {
    key: 'annees_experience_data',
    label: "Années d'expérience Data",
    type: 'number',
    required: true,
    isPii: false,
    aiPromptDescription: "Nombre total d'années d'expérience cumulées en ingénierie de données ou backend distribué.",
    isLocked: false,
  },
  {
    key: 'architectures_cloud',
    label: 'Architectures Cloud maîtrisées',
    type: 'list',
    required: true,
    isPii: false,
    aiPromptDescription: 'Fournisseurs de Cloud (AWS, GCP, Azure) et services spécifiques (BigQuery, Redshift, Snowflake, EKS).',
    isLocked: false,
  },
  {
    key: 'remuneration_souhaitee',
    label: 'Prétentions salariales brutes',
    type: 'number',
    required: false,
    isPii: true,
    piiCategory: 'salary',
    aiPromptDescription: 'Salaire annuel brut exprimé en euros ou XOF souhaité par le candidat.',
    isLocked: false,
  },
  {
    key: 'mobilite_teletravail',
    label: 'Politique de télétravail souhaitée',
    type: 'enum',
    options: ['Full Remote', 'Hybride (2-3 jours)', 'Présentiel exclusif'],
    required: true,
    isPii: false,
    aiPromptDescription: 'Préférence de travail à distance ou présentiel indiquée dans le CV.',
    isLocked: false,
  },
];

const techFieldsV23: PatternField[] = [
  ...DEFAULT_SOCLE_FIELDS,
  {
    key: 'annees_experience_data',
    label: "Années d'expérience Data",
    type: 'number',
    required: true,
    isPii: false,
    aiPromptDescription: "Nombre d'années en ingénierie de données.",
    isLocked: false,
  },
  {
    key: 'architectures_cloud',
    label: 'Architectures Cloud maîtrisées',
    type: 'list',
    required: false,
    isPii: false,
    aiPromptDescription: 'Fournisseurs Cloud (AWS, GCP).',
    isLocked: false,
  },
];

export const mockPatternVersions: PatternVersion[] = [
  {
    id: 'ver-tech-v24',
    patternId: 'PAT-TECH-04',
    version: 'v2.4',
    status: 'active',
    fields: techFieldsV24,
    schemaJson: JSON.stringify(generateJsonSchema(techFieldsV24, { id: 'PAT-TECH-04', version: '2.4' }), null, 2),
    changelog: 'Ajout de la rémunération souhaitée, politique télétravail et renforcement de la validation Cloud.',
    createdAt: '2026-09-15T10:00:00Z',
    publishedAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'ver-tech-v23',
    patternId: 'PAT-TECH-04',
    version: 'v2.3',
    status: 'archived',
    fields: techFieldsV23,
    schemaJson: JSON.stringify(generateJsonSchema(techFieldsV23, { id: 'PAT-TECH-04', version: '2.3' }), null, 2),
    changelog: 'Version initiale avec socle normalisé et expérience data.',
    createdAt: '2026-06-10T09:00:00Z',
    publishedAt: '2026-06-12T14:30:00Z',
  },
  {
    id: 'ver-sales-v12',
    patternId: 'PAT-SALES-02',
    version: 'v1.2',
    status: 'active',
    fields: [
      ...DEFAULT_SOCLE_FIELDS,
      {
        key: 'arr_signe_moyen',
        label: 'ARR signé moyen (k€)',
        type: 'number',
        required: false,
        isPii: false,
        aiPromptDescription: 'Montant moyen de nouveaux contrats annuels récurrents négociés par le candidat.',
        isLocked: false,
      },
      {
        key: 'methodologie_vente',
        label: 'Méthodologie commerciale',
        type: 'enum',
        options: ['MEDDIC', 'Challenger Sale', 'Spin Selling', 'Solution Selling', 'Autre'],
        required: false,
        isPii: false,
        aiPromptDescription: 'Méthodologie de vente citée (MEDDIC, Challenger, etc.).',
        isLocked: false,
      },
      {
        key: 'cycle_vente_moyen',
        label: 'Durée moyenne de cycle de vente',
        type: 'text',
        required: false,
        isPii: false,
        aiPromptDescription: 'Durée moyenne du closing (ex: 3 à 6 mois).',
        isLocked: false,
      },
    ],
    schemaJson: JSON.stringify(generateJsonSchema(DEFAULT_SOCLE_FIELDS, { id: 'PAT-SALES-02', version: '1.2' }), null, 2),
    changelog: 'Intégration du cycle de vente et méthodologies MEDDIC.',
    createdAt: '2026-02-10T10:00:00Z',
    publishedAt: '2026-02-14T11:00:00Z',
  },
  {
    id: 'ver-devops-v30',
    patternId: 'PAT-DEVOPS-03',
    version: 'v3.0',
    status: 'draft',
    fields: [
      ...DEFAULT_SOCLE_FIELDS,
      {
        key: 'certifications_devops',
        label: 'Certifications Cloud / Kubernetes',
        type: 'list',
        required: true,
        isPii: false,
        aiPromptDescription: 'Certifications officielles obtenues (CKA, CKAD, AWS Solutions Architect, etc.).',
        isLocked: false,
      },
      {
        key: 'outils_iac_observabilite',
        label: 'Outils IaC et Observabilité',
        type: 'list',
        required: true,
        isPii: false,
        aiPromptDescription: 'Terraform, Ansible, Datadog, Prometheus, Grafana, OpenTelemetry.',
        isLocked: false,
      },
    ],
    schemaJson: JSON.stringify(generateJsonSchema(DEFAULT_SOCLE_FIELDS, { id: 'PAT-DEVOPS-03', version: '3.0' }), null, 2),
    changelog: 'Brouillon de la v3.0 avec focus observabilité et SRE.',
    createdAt: '2026-10-01T15:30:00Z',
  },
];

// Exemples de CV types pour le banc d'essai (onglet "Tester sur un CV")
export interface SampleCvExample {
  id: string;
  title: string;
  category: string;
  summary: string;
  fullText: string;
}

export const SAMPLE_CV_EXAMPLES: SampleCvExample[] = [
  {
    id: 'sample-tech-senior',
    title: 'CV Développeur Senior Data & Cloud (Alexandre Martin)',
    category: 'Tech',
    summary: 'Lead Data Engineer avec 8 ans d’expérience sur AWS, Snowflake, Spark et Python.',
    fullText: `Alexandre Martin
alexandre.martin.dev@email.fr | +33 6 12 34 56 78 | Paris, France (Mobile IDF & Remote)
Prétentions salariales : 75 000 € brut / an | Préavis : 1 mois

EXPÉRIENCES PROFESSIONNELLES :
- Senior Data Platform Engineer - FinTech PayWave (2022 - Présent) :
  Architecture d'un data lakehouse temps réel avec Snowflake, dbt, Apache Kafka et AWS EKS.
  Gestion de pipelines ingérant plus de 15 millions d'événements financiers par jour.
- Data Engineer - ScaleUp AdAnalytics (2018 - 2022) :
  Migration de clusters Hadoop on-premise vers Google Cloud Platform (BigQuery, Cloud Composer / Airflow).

FORMATIONS & DIPLÔMES :
- Master en Informatique Décisionnelle & Big Data - Université Paris-Saclay (2018)
- Licence Mathématiques & Informatique - Sorbonne Université (2016)

COMPÉTENCES CLÉS :
- Langages : Python, SQL avancé, Scala, Bash
- Cloud & Data : AWS (S3, Glue, Athena, EKS), GCP (BigQuery), Snowflake, dbt, Apache Spark, Kafka, Terraform
- Méthodologies : Agile Scrum, CI/CD GitOps, Data Governance`,
  },
  {
    id: 'sample-commercial-b2b',
    title: 'CV Responsable Commercial Grands Comptes (Élodie Bernard)',
    category: 'Commercial',
    summary: 'Account Executive B2B SaaS avec 6 ans d’expérience, 120% d’atteinte de quota et maîtrise MEDDIC.',
    fullText: `Élodie Bernard
elodie.bernard.sales@pro-contact.com | +33 7 98 76 54 32 | Lyon, France
Télétravail : Hybride (2 jours présentiel max) | Disponibilité : Immédiate

EXPÉRIENCES PROFESSIONNELLES :
- Senior Enterprise Account Executive - SaaS HR Tech (2021 - Présent) :
  Prospection et négociation de contrats annuels (ARR) entre 60k€ et 250k€ auprès des DRH du SBF 120.
  Atteinte de 125% du quota annuel sur 3 années consécutives. Maîtrise rigoureuse du framework MEDDIC.
- Commerciale B2B - CRM Solutions (2018 - 2021) :
  Gestion d'un portefeuille de 45 comptes PME et ETI. Cycle de vente moyen de 4 mois.

FORMATIONS :
- Master 2 Négociation Commerciale Internationale - KEDGE Business School (2018)

COMPÉTENCES CLÉS :
- Vente consultative, MEDDIC, prospection multicanale, Salesforce CRM, HubSpot, négociation contractuelle complexe`,
  },
  {
    id: 'sample-devops-lead',
    title: 'CV Lead DevOps & SRE (Thomas Dubois)',
    category: 'Tech',
    summary: 'Architecte Kubernetes certifié CKA/CKS avec expertise Terraform, Datadog et sécurité DevSecOps.',
    fullText: `Thomas Dubois
thomas.dubois.sre@infra-cloud.org | +33 6 45 89 12 30 | Nantes (100% Télétravail)

EXPÉRIENCES PROFESSIONNELLES :
- Lead SRE & DevOps - CloudNative Studio (2020 - Présent) :
  Responsable de l'infrastructure de 45 microservices conteneurisés sous Kubernetes (EKS & GKE).
  Réduction des incidents de production de 40% via mise en place de Datadog, OpenTelemetry et SLO/SLI.
- Ingénieur Systèmes & Cloud - Infogérance SaaS (2017 - 2020) :
  Automatisation complète du provisionnement via Terraform et Ansible.

CERTIFICATIONS :
- Certified Kubernetes Administrator (CKA)
- AWS Certified Solutions Architect - Professional

COMPÉTENCES CLÉS :
- Kubernetes, Docker, Helm, Terraform, Ansible, CI/CD GitLab, Datadog, Prometheus, Grafana, Linux SRE`,
  },
];
