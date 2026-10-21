import { z } from 'zod';

export const PiiCategorySchema = z.enum([
  'identity',
  'contact',
  'address',
  'photo',
  'age_birth',
  'nationality',
  'civil_status',
  'other',
  'location',
  'institution',
  'birthdate',
  'salary',
]);

export type PiiCategory = z.infer<typeof PiiCategorySchema>;

export const PII_CATEGORY_LABELS: Record<PiiCategory, string> = {
  identity: 'Identité',
  contact: 'Coordonnées & Contact',
  address: 'Adresse postale',
  photo: 'Photographie',
  age_birth: 'Âge / Date de naissance',
  nationality: 'Nationalité',
  civil_status: 'État civil',
  other: 'Autre PII',
  location: 'Localisation',
  institution: 'Établissement fréquenté',
  birthdate: 'Date de naissance',
  salary: 'Rémunération actuelle',
};

export const PatternFieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'list',
  'boolean',
  'enum',
]);

export type PatternFieldType = z.infer<typeof PatternFieldTypeSchema>;

export const FIELD_TYPE_LABELS: Record<PatternFieldType, string> = {
  text: 'Texte libre',
  number: 'Nombre',
  date: 'Date',
  list: 'Liste (tags/mots-clés)',
  boolean: 'Booléen (Oui / Non)',
  enum: 'Énumération (choix fixe)',
};

export const PatternFieldSchema = z.object({
  key: z
    .string()
    .min(2, 'Le nom technique doit comporter au moins 2 caractères.')
    .regex(/^[a-z0-9_]+$/, 'Le nom technique doit être un slug (minuscules, chiffres et tirets du bas uniquement).'),
  label: z.string().min(2, 'Le libellé doit comporter au moins 2 caractères.'),
  type: PatternFieldTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  isPii: z.boolean().default(false),
  piiCategory: PiiCategorySchema.optional(),
  aiPromptDescription: z.string().optional(),
  isLocked: z.boolean().optional(),
  isSystem: z.boolean().optional(),
});

export type PatternField = z.infer<typeof PatternFieldSchema>;

// Validation de formulaire avec unicité des clés techniques
export const PatternFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Le nom du pattern doit comporter au moins 3 caractères.'),
  category: z.enum(['Tech', 'Commercial', 'Management', 'Support', 'Finance']),
  description: z.string().min(5, 'La description doit comporter au moins 5 caractères.'),
  fields: z
    .array(PatternFieldSchema)
    .min(1, 'Le pattern doit contenir au moins un champ.')
    .refine(
      (fields) => {
        const keys = fields.map((f) => f.key.trim().toLowerCase());
        return new Set(keys).size === keys.length;
      },
      {
        message: 'Chaque champ doit avoir un nom technique (slug) unique.',
        path: ['fields'],
      },
    ),
});

export type PatternFormData = z.infer<typeof PatternFormSchema>;

export const PatternVersionSchema = z.object({
  id: z.string(),
  patternId: z.string(),
  version: z.string(),
  status: z.enum(['active', 'draft', 'archived']),
  fields: z.array(PatternFieldSchema),
  schemaJson: z.string(),
  changelog: z.string().optional(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
});

export type PatternVersion = z.infer<typeof PatternVersionSchema>;

export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Tech', 'Commercial', 'Management', 'Support', 'Finance']),
  description: z.string(),
  activeVersion: z.string(),
  totalFields: z.number().int().nonnegative(),
  piiFieldsCount: z.number().int().nonnegative(),
  extractedCvCount: z.number().int().nonnegative(),
  matchingAccuracy: z.number().min(0).max(100),
  status: z.enum(['active', 'draft', 'archived']),
  updatedAt: z.string(),
});

export type Pattern = z.infer<typeof PatternSchema>;

// Champs obligatoires du socle normalisé (verrouillés avec cadenas)
export const DEFAULT_SOCLE_FIELDS: PatternField[] = [
  {
    key: 'nom_complet',
    label: 'Nom & Prénom du candidat',
    type: 'text',
    required: true,
    isPii: true,
    piiCategory: 'identity',
    aiPromptDescription: "Extrait le nom et le prénom complets de la personne pour l'anonymisation.",
    isLocked: true,
    isSystem: true,
  },
  {
    key: 'coordonnees_contact',
    label: 'Coordonnées de contact (Email / Téléphone)',
    type: 'text',
    required: true,
    isPii: true,
    piiCategory: 'contact',
    aiPromptDescription: 'Adresse email professionnelle ou personnelle et numéros de téléphone.',
    isLocked: true,
    isSystem: true,
  },
  {
    key: 'localisation_geographique',
    label: 'Localisation & Mobilité',
    type: 'text',
    required: true,
    isPii: true,
    piiCategory: 'location',
    aiPromptDescription: 'Ville, code postal ou région de résidence du candidat et mobilité déclarée.',
    isLocked: true,
    isSystem: true,
  },
  {
    key: 'experiences_professionnelles',
    label: 'Expériences professionnelles',
    type: 'list',
    required: true,
    isPii: false,
    aiPromptDescription: 'Liste chronologique des postes, employeurs, missions clés et durées en années.',
    isLocked: true,
    isSystem: true,
  },
  {
    key: 'formations_diplomes',
    label: 'Formations & Diplômes',
    type: 'list',
    required: true,
    isPii: false,
    aiPromptDescription: 'Titres académiques, écoles, universités et années d’obtention.',
    isLocked: true,
    isSystem: true,
  },
  {
    key: 'competences_cles',
    label: 'Compétences clés & Savoir-faire',
    type: 'list',
    required: true,
    isPii: false,
    aiPromptDescription: 'Savoir-faire techniques, logiciels, méthodologies et expertises métier.',
    isLocked: true,
    isSystem: true,
  },
];

// Détection de risque PII sur les champs texte ou list non marqués PII
const PII_KEYWORDS = [
  'nom',
  'prenom',
  'email',
  'mail',
  'telephone',
  'tel',
  'phone',
  'adresse',
  'ville',
  'postale',
  'photo',
  'age',
  'naissance',
  'nationalite',
  'civil',
  'situation',
  'mari',
  'enfant',
  'salaire',
  'remuneration',
  'pretention',
  'secu',
  'permis',
  'iban',
  'rib',
  'contact',
  'perso',
];

export function detectPiiRisk(field: PatternField): boolean {
  if (field.isPii) return false;
  if (field.type !== 'text' && field.type !== 'list') return false;

  const target = `${field.key} ${field.label} ${field.aiPromptDescription || ''}`.toLowerCase();
  return PII_KEYWORDS.some((kw) => target.includes(kw));
}

// Générateur de JSON Schema conforme Draft-07 à partir des champs
export function generateJsonSchema(
  fields: PatternField[],
  meta?: { id?: string; name?: string; version?: string },
): Record<string, any> {
  const properties: Record<string, any> = {};
  const requiredKeys: string[] = [];

  for (const f of fields) {
    if (f.required) {
      requiredKeys.push(f.key);
    }

    let fieldSchema: Record<string, any> = {
      title: f.label,
      description: f.aiPromptDescription || `Extraction du champ ${f.label}`,
      'x-pii': f.isPii,
      'x-locked': !!f.isLocked,
    };

    if (f.isPii && f.piiCategory) {
      fieldSchema['x-pii-category'] = f.piiCategory;
    }

    switch (f.type) {
      case 'number':
        fieldSchema.type = 'number';
        break;
      case 'boolean':
        fieldSchema.type = 'boolean';
        break;
      case 'date':
        fieldSchema.type = 'string';
        fieldSchema.format = 'date';
        break;
      case 'list':
        fieldSchema.type = 'array';
        fieldSchema.items = { type: 'string' };
        break;
      case 'enum':
        fieldSchema.type = 'string';
        if (f.options && f.options.length > 0) {
          fieldSchema.enum = f.options;
        }
        break;
      case 'text':
      default:
        fieldSchema.type = 'string';
        break;
    }

    properties[f.key] = fieldSchema;
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: meta?.name || 'Pattern Extraction Schema',
    pattern_id: meta?.id || 'PATTERN-CUSTOM',
    version: meta?.version || '1.0',
    type: 'object',
    required: requiredKeys,
    properties,
    additionalProperties: false,
  };
}

// Diff entre deux versions de champs
export interface PatternDiffResult {
  added: PatternField[];
  removed: PatternField[];
  modified: Array<{
    key: string;
    label: string;
    changes: Array<{ property: string; from: any; to: any }>;
  }>;
}

export function diffPatternFields(
  previousFields: PatternField[],
  currentFields: PatternField[],
): PatternDiffResult {
  const prevMap = new Map(previousFields.map((f) => [f.key, f]));
  const currMap = new Map(currentFields.map((f) => [f.key, f]));

  const added: PatternField[] = [];
  const removed: PatternField[] = [];
  const modified: PatternDiffResult['modified'] = [];

  for (const curr of currentFields) {
    if (!prevMap.has(curr.key)) {
      added.push(curr);
    } else {
      const prev = prevMap.get(curr.key)!;
      const changes: Array<{ property: string; from: any; to: any }> = [];

      if (prev.label !== curr.label) {
        changes.push({ property: 'libellé', from: prev.label, to: curr.label });
      }
      if (prev.type !== curr.type) {
        changes.push({ property: 'type', from: prev.type, to: curr.type });
      }
      if (prev.required !== curr.required) {
        changes.push({ property: 'obligatoire', from: prev.required, to: curr.required });
      }
      if (prev.isPii !== curr.isPii) {
        changes.push({ property: 'PII', from: prev.isPii, to: curr.isPii });
      }
      if (prev.piiCategory !== curr.piiCategory) {
        changes.push({ property: 'catégorie PII', from: prev.piiCategory, to: curr.piiCategory });
      }
      if (prev.aiPromptDescription !== curr.aiPromptDescription) {
        changes.push({ property: 'description IA', from: prev.aiPromptDescription, to: curr.aiPromptDescription });
      }

      if (changes.length > 0) {
        modified.push({
          key: curr.key,
          label: curr.label,
          changes,
        });
      }
    }
  }

  for (const prev of previousFields) {
    if (!currMap.has(prev.key)) {
      removed.push(prev);
    }
  }

  return { added, removed, modified };
}

// Estimation de coût pour la ré-extraction lors d'une publication
export function estimateReExtractionCost(cvCount: number, fieldsCount: number) {
  // En moyenne ~500 tokens de base de CV + 65 tokens par champ analysé
  const tokensPerCv = Math.round(500 + fieldsCount * 65);
  const totalTokens = cvCount * tokensPerCv;
  // Tarif serveur IA UE souverain : ~1,50 € HT par million de tokens
  const estimatedEur = Number(((totalTokens / 1_000_000) * 1.5).toFixed(2));

  return {
    affectedCvs: cvCount,
    tokensPerCv,
    totalTokens,
    estimatedEur,
    estimatedMinutes: Math.max(1, Math.ceil((cvCount * 0.4) / 60)), // ~400ms par CV en parallèle
  };
}
