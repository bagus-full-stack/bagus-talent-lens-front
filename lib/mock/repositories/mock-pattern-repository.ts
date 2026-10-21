import type { IPatternRepository } from '@/lib/api/types';
import type { Pattern, PatternVersion, PatternField } from '@/types';
import {
  mockPatterns,
  mockPatternVersions,
  SAMPLE_CV_EXAMPLES,
} from '../data/patterns';
import {
  DEFAULT_SOCLE_FIELDS,
  generateJsonSchema,
  estimateReExtractionCost,
} from '@/lib/schemas/pattern';

export class MockPatternRepository implements IPatternRepository {
  private patterns = [...mockPatterns];
  private versions = [...mockPatternVersions];

  async getAll(): Promise<Pattern[]> {
    return [...this.patterns];
  }

  async getById(id: string): Promise<Pattern | null> {
    const pattern = this.patterns.find((p) => p.id === id);
    return pattern ? { ...pattern } : null;
  }

  async getVersion(patternId: string, version: string): Promise<PatternVersion | null> {
    const ver = this.versions.find((v) => v.patternId === patternId && v.version === version);
    if (ver) return { ...ver };

    // Si la version demandée n'existe pas explicitement, créer une version basée sur le pattern ou le socle
    const pattern = await this.getById(patternId);
    if (!pattern) return null;

    const defaultVer: PatternVersion = {
      id: `ver-${patternId}-${version}`,
      patternId,
      version,
      status: pattern.status === 'draft' ? 'draft' : 'active',
      fields: [...DEFAULT_SOCLE_FIELDS],
      schemaJson: JSON.stringify(generateJsonSchema(DEFAULT_SOCLE_FIELDS, { id: patternId, version }), null, 2),
      createdAt: new Date().toISOString(),
    };
    this.versions.push(defaultVer);
    return { ...defaultVer };
  }

  async getVersions(patternId: string): Promise<PatternVersion[]> {
    const list = this.versions.filter((v) => v.patternId === patternId);
    if (list.length === 0) {
      const pattern = await this.getById(patternId);
      if (pattern) {
        const initial = await this.getVersion(patternId, pattern.activeVersion);
        if (initial) return [initial];
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(data: {
    name: string;
    category: Pattern['category'];
    description: string;
    fields?: PatternField[];
  }): Promise<Pattern> {
    const nextId = `PAT-CUSTOM-${String(this.patterns.length + 1).padStart(2, '0')}`;
    const initialFields = data.fields && data.fields.length > 0 ? data.fields : [...DEFAULT_SOCLE_FIELDS];
    const piiCount = initialFields.filter((f) => f.isPii).length;

    const newPattern: Pattern = {
      id: nextId,
      name: data.name,
      category: data.category,
      description: data.description,
      activeVersion: 'v1.0-brouillon',
      totalFields: initialFields.length,
      piiFieldsCount: piiCount,
      extractedCvCount: 0,
      matchingAccuracy: 95.0,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

    const initialVersion: PatternVersion = {
      id: `ver-${nextId}-v10`,
      patternId: nextId,
      version: 'v1.0-brouillon',
      status: 'draft',
      fields: initialFields,
      schemaJson: JSON.stringify(generateJsonSchema(initialFields, { id: nextId, version: '1.0' }), null, 2),
      createdAt: new Date().toISOString(),
      changelog: 'Création initiale du pattern avec socle normalisé.',
    };

    this.patterns.unshift(newPattern);
    this.versions.unshift(initialVersion);
    return { ...newPattern };
  }

  async duplicate(id: string, newName?: string): Promise<Pattern> {
    const source = await this.getById(id);
    if (!source) throw new Error(`Pattern source introuvable: ${id}`);

    const sourceVersion = await this.getVersion(source.id, source.activeVersion);
    const sourceFields = sourceVersion ? sourceVersion.fields : [...DEFAULT_SOCLE_FIELDS];

    const copyId = `PAT-COPY-${Date.now().toString().slice(-4)}`;
    const duplicatePattern: Pattern = {
      ...source,
      id: copyId,
      name: newName || `Copie de ${source.name}`,
      activeVersion: 'v1.0-brouillon',
      extractedCvCount: 0,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

    const duplicateVersion: PatternVersion = {
      id: `ver-${copyId}-v10`,
      patternId: copyId,
      version: 'v1.0-brouillon',
      status: 'draft',
      fields: JSON.parse(JSON.stringify(sourceFields)),
      schemaJson: JSON.stringify(generateJsonSchema(sourceFields, { id: copyId, version: '1.0' }), null, 2),
      changelog: `Dupliqué depuis ${source.name} (${source.activeVersion}).`,
      createdAt: new Date().toISOString(),
    };

    this.patterns.unshift(duplicatePattern);
    this.versions.unshift(duplicateVersion);
    return { ...duplicatePattern };
  }

  async archive(id: string): Promise<Pattern | null> {
    const index = this.patterns.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.patterns[index] = {
      ...this.patterns[index],
      status: 'archived',
      updatedAt: new Date().toISOString(),
    };
    return { ...this.patterns[index] };
  }

  async saveDraft(patternId: string, fields: PatternField[]): Promise<PatternVersion> {
    const pattern = await this.getById(patternId);
    if (!pattern) throw new Error('Pattern introuvable');

    const draftVersionName = pattern.activeVersion.includes('brouillon')
      ? pattern.activeVersion
      : `${pattern.activeVersion}-brouillon`;

    let draft = this.versions.find((v) => v.patternId === patternId && v.version === draftVersionName);

    const schemaJson = JSON.stringify(
      generateJsonSchema(fields, { id: patternId, name: pattern.name, version: draftVersionName }),
      null,
      2,
    );

    if (draft) {
      draft.fields = [...fields];
      draft.schemaJson = schemaJson;
      draft.status = 'draft';
    } else {
      draft = {
        id: `ver-${patternId}-${Date.now()}`,
        patternId,
        version: draftVersionName,
        status: 'draft',
        fields: [...fields],
        schemaJson,
        createdAt: new Date().toISOString(),
      };
      this.versions.unshift(draft);
    }

    // Mettre à jour les compteurs du pattern
    const patternIdx = this.patterns.findIndex((p) => p.id === patternId);
    if (patternIdx !== -1) {
      this.patterns[patternIdx] = {
        ...this.patterns[patternIdx],
        totalFields: fields.length,
        piiFieldsCount: fields.filter((f) => f.isPii).length,
        updatedAt: new Date().toISOString(),
      };
    }

    return { ...draft };
  }

  async publishVersion(
    patternId: string,
    fields: PatternField[],
    options?: { reExtractExisting?: boolean },
  ): Promise<{
    version: PatternVersion;
    pattern: Pattern;
    reExtraction?: { affectedCvs: number; totalTokens: number; estimatedEur: number };
  }> {
    const patternIdx = this.patterns.findIndex((p) => p.id === patternId);
    if (patternIdx === -1) throw new Error('Pattern introuvable');

    const pattern = this.patterns[patternIdx];
    const prevVersions = await this.getVersions(patternId);

    // Calcul du prochain numéro de version sémantique
    let nextVersionNum = 'v1.0';
    if (pattern.activeVersion.startsWith('v')) {
      const match = pattern.activeVersion.replace('-brouillon', '').match(/v(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        // Si plus de 3 champs changés ou champs socle modifiés -> passage à la version majeure suivante
        nextVersionNum = `v${major}.${minor + 1}`;
      } else {
        nextVersionNum = 'v2.0';
      }
    }

    // Archiver les versions actives précédentes
    this.versions.forEach((v) => {
      if (v.patternId === patternId && v.status === 'active') {
        v.status = 'archived';
      }
    });

    const newVersion: PatternVersion = {
      id: `ver-${patternId}-${nextVersionNum}`,
      patternId,
      version: nextVersionNum,
      status: 'active',
      fields: [...fields],
      schemaJson: JSON.stringify(
        generateJsonSchema(fields, { id: patternId, name: pattern.name, version: nextVersionNum }),
        null,
        2,
      ),
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      changelog: `Publication de la version ${nextVersionNum} (${fields.length} champs, ${fields.filter((f) => f.isPii).length} PII).`,
    };

    this.versions.unshift(newVersion);

    // Mettre à jour le pattern
    const updatedPattern: Pattern = {
      ...pattern,
      activeVersion: nextVersionNum,
      status: 'active',
      totalFields: fields.length,
      piiFieldsCount: fields.filter((f) => f.isPii).length,
      updatedAt: new Date().toISOString(),
    };
    this.patterns[patternIdx] = updatedPattern;

    let reExtractionData: { affectedCvs: number; totalTokens: number; estimatedEur: number } | undefined;
    if (options?.reExtractExisting && pattern.extractedCvCount > 0) {
      const estimate = estimateReExtractionCost(pattern.extractedCvCount, fields.length);
      reExtractionData = {
        affectedCvs: pattern.extractedCvCount,
        totalTokens: estimate.totalTokens,
        estimatedEur: estimate.estimatedEur,
      };
    }

    return {
      version: { ...newVersion },
      pattern: { ...updatedPattern },
      reExtraction: reExtractionData,
    };
  }

  async restoreVersion(patternId: string, targetVersion: string): Promise<{ version: PatternVersion; pattern: Pattern }> {
    const patternIdx = this.patterns.findIndex((p) => p.id === patternId);
    if (patternIdx === -1) throw new Error('Pattern introuvable');

    const targetVer = this.versions.find((v) => v.patternId === patternId && v.version === targetVersion);
    if (!targetVer) throw new Error(`Version ${targetVersion} introuvable pour ce pattern.`);

    // Cloner la version ciblée comme nouveau brouillon de restauration
    const restoredVersion: PatternVersion = {
      id: `ver-${patternId}-restored-${Date.now()}`,
      patternId,
      version: `${targetVersion}-restaure`,
      status: 'draft',
      fields: JSON.parse(JSON.stringify(targetVer.fields)),
      schemaJson: targetVer.schemaJson,
      createdAt: new Date().toISOString(),
      changelog: `Restauré à partir de la version historique ${targetVersion}.`,
    };

    this.versions.unshift(restoredVersion);

    const updatedPattern: Pattern = {
      ...this.patterns[patternIdx],
      totalFields: targetVer.fields.length,
      piiFieldsCount: targetVer.fields.filter((f) => f.isPii).length,
      updatedAt: new Date().toISOString(),
    };
    this.patterns[patternIdx] = updatedPattern;

    return { version: restoredVersion, pattern: updatedPattern };
  }

  async testExtraction(
    fields: PatternField[],
    sampleCvId = 'sample-tech-senior',
  ): Promise<
    Array<{
      key: string;
      label: string;
      value: any;
      confidence: number;
      isPii: boolean;
    }>
  > {
    const sample = SAMPLE_CV_EXAMPLES.find((s) => s.id === sampleCvId) || SAMPLE_CV_EXAMPLES[0];

    // Simulation d'extraction intelligente IA basée sur le texte du CV exemple
    return fields.map((field) => {
      let value: any = 'Donnée non détectée';
      let confidence = 0.85;

      switch (field.key) {
        case 'nom_complet':
          value = sample.id.includes('tech') ? 'Alexandre Martin' : sample.id.includes('sales') ? 'Élodie Bernard' : 'Thomas Dubois';
          confidence = 0.99;
          break;
        case 'coordonnees_contact':
          value = sample.id.includes('tech')
            ? 'alexandre.martin.dev@email.fr | +33 6 12 34 56 78'
            : sample.id.includes('sales')
              ? 'elodie.bernard.sales@pro-contact.com | +33 7 98 76 54 32'
              : 'thomas.dubois.sre@infra-cloud.org | +33 6 45 89 12 30';
          confidence = 0.98;
          break;
        case 'localisation_geographique':
          value = sample.id.includes('tech') ? 'Paris, France' : sample.id.includes('sales') ? 'Lyon, France' : 'Nantes, France';
          confidence = 0.96;
          break;
        case 'experiences_professionnelles':
          value = sample.id.includes('tech')
            ? [
                'Senior Data Platform Engineer - FinTech PayWave (2022 - Présent)',
                'Data Engineer - ScaleUp AdAnalytics (2018 - 2022)',
              ]
            : sample.id.includes('sales')
              ? [
                  'Senior Enterprise Account Executive - SaaS HR Tech (2021 - Présent)',
                  'Commerciale B2B - CRM Solutions (2018 - 2021)',
                ]
              : [
                  'Lead SRE & DevOps - CloudNative Studio (2020 - Présent)',
                  'Ingénieur Systèmes & Cloud - Infogérance SaaS (2017 - 2020)',
                ];
          confidence = 0.94;
          break;
        case 'formations_diplomes':
          value = sample.id.includes('tech')
            ? ['Master en Informatique Décisionnelle (Paris-Saclay)', 'Licence Informatique (Sorbonne)']
            : ['Master 2 Négociation Commerciale Internationale (KEDGE)'];
          confidence = 0.97;
          break;
        case 'competences_cles':
          value = sample.id.includes('tech')
            ? ['Python', 'Snowflake', 'Apache Spark', 'Kafka', 'Terraform', 'AWS']
            : sample.id.includes('sales')
              ? ['Vente consultative', 'MEDDIC', 'Salesforce CRM', 'Négociation complexe']
              : ['Kubernetes', 'Docker', 'Terraform', 'Datadog', 'GitLab CI'];
          confidence = 0.95;
          break;
        case 'annees_experience_data':
        case 'annees_experience':
          value = 8;
          confidence = 0.92;
          break;
        case 'architectures_cloud':
          value = ['Amazon Web Services (AWS)', 'Google Cloud Platform (BigQuery)'];
          confidence = 0.95;
          break;
        case 'remuneration_souhaitee':
        case 'salaire':
          value = 75000;
          confidence = 0.91;
          break;
        case 'mobilite_teletravail':
          value = 'Hybride (2-3 jours)';
          confidence = 0.88;
          break;
        case 'arr_signe_moyen':
          value = 180;
          confidence = 0.89;
          break;
        case 'methodologie_vente':
          value = 'MEDDIC';
          confidence = 0.97;
          break;
        default:
          if (field.type === 'number') {
            value = 4;
            confidence = 0.82;
          } else if (field.type === 'boolean') {
            value = true;
            confidence = 0.89;
          } else if (field.type === 'list') {
            value = ['Option A identifiée', 'Option B validée'];
            confidence = 0.84;
          } else if (field.type === 'date') {
            value = '2024-01-15';
            confidence = 0.86;
          } else {
            value = `Exemple extrait : profil qualifié conforme aux critères ${field.label}`;
            confidence = 0.85;
          }
      }

      return {
        key: field.key,
        label: field.label,
        value,
        confidence,
        isPii: field.isPii,
      };
    });
  }
}
