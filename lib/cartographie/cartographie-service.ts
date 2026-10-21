import { mockCandidatesRaw } from '@/lib/mock/data/candidates';
import { mockFolders } from '@/lib/mock/data/folders';
import type {
  CartographyPoint,
  CartographyCluster,
  CartographyDataResponse,
  PipelineStage,
} from '@/lib/schemas/cartographie';

export const CLUSTERS: CartographyCluster[] = [
  {
    id: 'cluster-data',
    name: 'Data Lakehouse & Streaming',
    color: '#3B82F6', // Bleu
    count: 0,
  },
  {
    id: 'cluster-sec',
    name: 'Cybersécurité SOC & Threat Intel',
    color: '#EF4444', // Rouge
    count: 0,
  },
  {
    id: 'cluster-cloud',
    name: 'Cloud Sec & Audit RGPD / NIS2',
    color: '#10B981', // Vert émeraude
    count: 0,
  },
  {
    id: 'cluster-devops',
    name: 'Staff Fullstack & DevSecOps',
    color: '#8B5CF6', // Violet
    count: 0,
  },
  {
    id: 'cluster-infra',
    name: 'Infrastructure & SRE Kubernetes',
    color: '#F59E0B', // Ambre
    count: 0,
  },
];

const PIPELINE_STAGES: PipelineStage[] = [
  'nouveau',
  'qualifie',
  'entretien_rh',
  'entretien_tech',
  'offre',
  'ecarte',
];

export const PIPELINE_COLORS: Record<PipelineStage, string> = {
  nouveau: '#94A3B8', // Slate
  qualifie: '#38BDF8', // Sky
  entretien_rh: '#A855F7', // Purple
  entretien_tech: '#F97316', // Orange
  offre: '#22C55E', // Green
  ecarte: '#EF4444', // Red
};

export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  nouveau: 'Nouveau vivier',
  qualifie: 'Qualifié IA',
  entretien_rh: 'Entretien RH',
  entretien_tech: 'Entretien Technique',
  offre: 'Offre formulée',
  ecarte: 'Écarté avec motif',
};

// Coordonnées de centres de clusters 2D/3D (UMAP projection)
const CLUSTER_CENTERS: Record<string, { x: number; y: number; z: number }> = {
  'cluster-data': { x: -3.5, y: 2.5, z: 1.2 },
  'cluster-sec': { x: 3.8, y: -2.0, z: -1.5 },
  'cluster-cloud': { x: 2.0, y: 3.5, z: 2.8 },
  'cluster-devops': { x: -2.0, y: -3.2, z: -2.2 },
  'cluster-infra': { x: 0.5, y: -0.5, z: 0.1 },
};

// Générateur pseudo-aléatoire reproductible (PRNG)
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Construit les points de la cartographie à partir des 30 vrais candidats enrichis
 * de points viviers distribués pour tester la fluidité jusqu'à grande échelle (ex: 5 000 à 50 000).
 */
export function generateCartographyPoints(count = 1200): {
  points: CartographyPoint[];
  clusters: CartographyCluster[];
} {
  const points: CartographyPoint[] = [];
  const clusterCounts: Record<string, number> = {
    'cluster-data': 0,
    'cluster-sec': 0,
    'cluster-cloud': 0,
    'cluster-devops': 0,
    'cluster-infra': 0,
  };

  // 1. D'abord les candidats réels de TalentLens
  for (let i = 0; i < mockCandidatesRaw.length; i++) {
    const cand = mockCandidatesRaw[i];
    const folder = mockFolders.find((f) => f.id === cand.folderId);

    // Déterminer le cluster sémantique
    let clusterId = 'cluster-data';
    if (cand.folderId === 'fld-cyb-88') {
      clusterId = i % 2 === 0 ? 'cluster-sec' : 'cluster-cloud';
    } else if (cand.folderId === 'fld-full-12') {
      clusterId = i % 2 === 0 ? 'cluster-devops' : 'cluster-infra';
    }

    const center = CLUSTER_CENTERS[clusterId];
    const jitterX = (seededRandom(i * 11 + 1) - 0.5) * 1.8;
    const jitterY = (seededRandom(i * 17 + 2) - 0.5) * 1.8;
    const jitterZ = (seededRandom(i * 23 + 3) - 0.5) * 1.8;

    const clusterObj = CLUSTERS.find((c) => c.id === clusterId)!;
    clusterCounts[clusterId]++;

    const stage = PIPELINE_STAGES[i % PIPELINE_STAGES.length];

    points.push({
      id: cand.id,
      // STRICTEMENT SANS PII (MODE AVEUGLE)
      pseudonym: cand.pseudonym,
      currentTitle: cand.currentTitle,
      topSkills: cand.skills.slice(0, 3),
      allSkills: cand.skills,
      folderId: cand.folderId,
      folderReference: folder?.reference || '#REF',
      yearsExperience: cand.yearsExperience,
      pipelineStage: stage,
      clusterId,
      clusterName: clusterObj.name,
      x: Number((center.x + jitterX).toFixed(3)),
      y: Number((center.y + jitterY).toFixed(3)),
      z: Number((center.z + jitterZ).toFixed(3)),
    });
  }

  // 2. Si count > 30, générer des profils vectoriels synthétiques (anonymisés) pour simuler un grand vivier
  const extraNeeded = count - points.length;
  const clusterKeys = Object.keys(CLUSTER_CENTERS);

  const sampleTitles: Record<string, string[]> = {
    'cluster-data': ['Data Engineer PySpark', 'Data Architect Snowflake', 'Analytics Engineer dbt', 'Streaming Engineer Kafka'],
    'cluster-sec': ['Analyste SOC Senior', 'Pentester & Forensics', 'Incident Responder', 'Threat Hunter Mitre'],
    'cluster-cloud': ['Cloud Security Architect', 'Auditeur RGPD & ISO 27001', 'SecOps AWS/Azure', 'Gouvernance IAM'],
    'cluster-devops': ['Staff Fullstack React/Node', 'Lead Developer Go/TypeScript', 'DevOps Platform Engineer', 'Fullstack Cloud Architect'],
    'cluster-infra': ['SRE Kubernetes', 'Ingénieur Terraform Cloud', 'Ingénieur Réseau & Virtualisation', 'Observability Engineer'],
  };

  const sampleSkills: Record<string, string[][]> = {
    'cluster-data': [
      ['Snowflake', 'Python', 'Kafka'],
      ['PySpark', 'Airflow', 'dbt'],
      ['BigQuery', 'SQL', 'GCP'],
      ['Kafka', 'Golang', 'Flink'],
    ],
    'cluster-sec': [
      ['Splunk', 'CrowdStrike', 'CISSP'],
      ['OSCP', 'Python', 'Metasploit'],
      ['Wireshark', 'EDR', 'YARA'],
      ['Mitre ATT&CK', 'SIEM', 'Suricata'],
    ],
    'cluster-cloud': [
      ['AWS Security', 'ISO 27001', 'RGPD'],
      ['Terraform', 'Azure Policy', 'IAM'],
      ['Audit SOC-2', 'NIS2', 'EBIOS RM'],
      ['Kubernetes Sec', 'Vault', 'Trivy'],
    ],
    'cluster-devops': [
      ['React', 'TypeScript', 'Node.js'],
      ['Next.js', 'PostgreSQL', 'Tailwind'],
      ['Docker', 'CI/CD GitLab', 'AWS'],
      ['NestJS', 'GraphQL', 'Redis'],
    ],
    'cluster-infra': [
      ['Kubernetes', 'Helm', 'Terraform'],
      ['Prometheus', 'Grafana', 'Linux'],
      ['Ansible', 'OpenTelemetry', 'AWS'],
      ['Ceph', 'BGP', 'ArgoCD'],
    ],
  };

  const folderIds = ['fld-de-2026', 'fld-cyb-88', 'fld-full-12'];

  for (let i = 0; i < extraNeeded; i++) {
    const seed = i + 1000;
    const clusterId = clusterKeys[Math.floor(seededRandom(seed * 7) * clusterKeys.length)];
    const center = CLUSTER_CENTERS[clusterId];

    // Distribution gaussienne approximée
    const r1 = seededRandom(seed * 13);
    const r2 = seededRandom(seed * 19);
    const r3 = seededRandom(seed * 29);
    const radius = 2.4 * Math.sqrt(r1);
    const theta = r2 * 2 * Math.PI;
    const phi = (r3 - 0.5) * Math.PI;

    const jX = radius * Math.cos(theta) * Math.cos(phi);
    const jY = radius * Math.sin(theta) * Math.cos(phi);
    const jZ = radius * Math.sin(phi);

    clusterCounts[clusterId]++;
    const clusterObj = CLUSTERS.find((c) => c.id === clusterId)!;

    const titles = sampleTitles[clusterId];
    const title = titles[Math.floor(seededRandom(seed * 31) * titles.length)];

    const skillsGroup = sampleSkills[clusterId];
    const topSkills = skillsGroup[Math.floor(seededRandom(seed * 37) * skillsGroup.length)];

    const fId = folderIds[Math.floor(seededRandom(seed * 41) * folderIds.length)];
    const folder = mockFolders.find((f) => f.id === fId);

    const exp = Math.floor(seededRandom(seed * 43) * 15) + 1;
    const stage = PIPELINE_STAGES[Math.floor(seededRandom(seed * 47) * PIPELINE_STAGES.length)];

    const hexId = (seed + 0x1000).toString(16).toUpperCase().slice(-4);

    points.push({
      id: `cand-syn-${i + 1}`,
      pseudonym: `Candidat #${hexId}`,
      currentTitle: title,
      topSkills,
      allSkills: [...topSkills, 'Anglais Pro', 'Agile/Scrum'],
      folderId: fId,
      folderReference: folder?.reference || '#REF',
      yearsExperience: exp,
      pipelineStage: stage,
      clusterId,
      clusterName: clusterObj.name,
      x: Number((center.x + jX).toFixed(3)),
      y: Number((center.y + jY).toFixed(3)),
      z: Number((center.z + jZ).toFixed(3)),
    });
  }

  const clustersWithCounts = CLUSTERS.map((c) => ({
    ...c,
    count: clusterCounts[c.id] || 0,
  }));

  return { points, clusters: clustersWithCounts };
}

// État mémoire persistant côté serveur
class CartographyStore {
  private lastCalculatedAt: string = '2026-10-06T03:00:00Z';
  private cachedData: ReturnType<typeof generateCartographyPoints> | null = null;
  private isRecalculating = false;

  public getData(pointCount = 1200): CartographyDataResponse {
    if (!this.cachedData || this.cachedData.points.length !== pointCount) {
      this.cachedData = generateCartographyPoints(pointCount);
    }

    return {
      points: this.cachedData.points,
      clusters: this.cachedData.clusters,
      totalCount: this.cachedData.points.length,
      lastCalculatedAt: this.lastCalculatedAt,
      isRecalculating: this.isRecalculating,
      blindMode: true,
    };
  }

  public recalculate(): CartographyDataResponse {
    this.isRecalculating = true;
    this.lastCalculatedAt = new Date().toISOString();
    this.cachedData = generateCartographyPoints(1200);
    this.isRecalculating = false;
    return this.getData();
  }
}

export const cartographyStore = new CartographyStore();
