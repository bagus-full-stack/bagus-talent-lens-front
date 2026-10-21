import type { Role } from '@/types';

export type PermissionAction =
  | 'import'
  | 'search'
  | 'match'
  | 'chat'
  | 'pipeline.write'
  | 'shortlist.write'
  | 'export.anonymized'
  | 'export.named'
  | 'identity.reveal'
  | 'rgpd.manage'
  | 'audit.read'
  | 'settings.write'
  | 'users.manage';

export interface PermissionUser {
  id: string;
  role: Role;
  can_reveal_identity?: boolean;
  can_export?: boolean;
  organizationId?: string;
  aal?: 'aal1' | 'aal2';
}

/**
 * Erreur typée HTTP 403 renvoyée côté serveur en cas de violation de permission.
 */
export class ForbiddenError extends Error {
  public readonly code = 'FORBIDDEN' as const;
  public readonly status = 403 as const;
  public readonly action: PermissionAction;
  public readonly role: Role | 'anonymous';

  constructor(action: PermissionAction, role: Role | 'anonymous' = 'anonymous', message?: string) {
    super(
      message ||
        `Action interdite [403] : le rôle '${role}' ne dispose pas de la permission '${action}'.`,
    );
    this.name = 'ForbiddenError';
    this.action = action;
    this.role = role;
  }
}

/**
 * Table de vérité unique can(user, action, resource?)
 * Utilisée côté serveur (autorité absolue) et côté client (ergonomie).
 */
export function can(
  user: PermissionUser | null | undefined,
  action: PermissionAction,
  _resource?: unknown,
): boolean {
  if (!user || !user.role) {
    return false;
  }

  const { role, can_reveal_identity, can_export } = user;

  switch (role) {
    case 'owner':
    case 'admin':
      // Owner et Admin ont accès universel aux fonctions de l'organisation
      return true;

    case 'recruiter':
      switch (action) {
        case 'import':
        case 'search':
        case 'match':
        case 'chat':
        case 'pipeline.write':
        case 'shortlist.write':
        case 'export.anonymized':
          return true;
        case 'export.named':
          return Boolean(can_export);
        case 'identity.reveal':
          return Boolean(can_reveal_identity);
        case 'rgpd.manage':
        case 'audit.read':
        case 'settings.write':
        case 'users.manage':
          return false;
        default:
          return false;
      }

    case 'dpo':
      switch (action) {
        case 'search':
        case 'export.anonymized':
        case 'export.named': // Autorisé pour audit légal CNIL et réquisitions
        case 'rgpd.manage':
        case 'audit.read':
          return true;
        case 'import':
        case 'match':
        case 'chat':
        case 'pipeline.write':
        case 'shortlist.write':
        case 'identity.reveal':
        case 'settings.write':
        case 'users.manage':
          return false;
        default:
          return false;
      }

    case 'reader':
    case 'viewer':
      switch (action) {
        case 'search':
          return true; // Consultation en lecture seule des profils
        case 'export.anonymized':
        case 'export.named':
          // Règle stricte : le lecteur / observateur client ne voit aucun bouton d'export
          return false;
        case 'import':
        case 'match':
        case 'chat':
        case 'pipeline.write':
        case 'shortlist.write':
        case 'identity.reveal':
        case 'rgpd.manage':
        case 'audit.read':
        case 'settings.write':
        case 'users.manage':
          return false;
        default:
          return false;
      }

    default:
      return false;
  }
}

/**
 * Fournit une explication conviviale et claire en français pour les infobulles (tooltips)
 * lorsque le composant <Can /> est en mode 'disable'.
 */
export function getPermissionDeniedReason(role: Role | 'anonymous', action: PermissionAction): string {
  if (role === 'anonymous') {
    return 'Authentification requise pour effectuer cette opération.';
  }

  switch (action) {
    case 'export.anonymized':
    case 'export.named':
      if (role === 'reader' || role === 'viewer') {
        return 'Le profil Lecteur / Client Observateur n’a pas l’autorisation d’exporter les données.';
      }
      return 'L’exportation nominative requiert une habilitation spécifique ou un rôle Administrateur/DPO.';

    case 'identity.reveal':
      return 'La levée du mode aveugle est strictement contrôlée. Elle requiert une habilitation ré-authentifiée et un motif légitime Art. 30 RGPD.';

    case 'rgpd.manage':
      return 'La gestion des demandes d’exercice de droits RGPD est réservée au DPO et aux Administrateurs.';

    case 'audit.read':
      return 'L’accès au journal d’audit immuable WORM est réservé au DPO et aux Administrateurs habilités.';

    case 'users.manage':
      return 'Seuls les Administrateurs et le Propriétaire peuvent gérer les membres et invitations.';

    case 'settings.write':
      return 'La modification des paramètres d’organisation requiert les droits Administrateur ou Propriétaire.';

    case 'import':
    case 'pipeline.write':
    case 'shortlist.write':
    case 'match':
      return 'Cette action de recrutement est réservée aux Recruteurs et Administrateurs.';

    default:
      return 'Vous ne disposez pas des habilitations nécessaires pour cette action.';
  }
}

/**
 * Garde serveur à appeler impérativement dans chaque Server Action et Route Handler.
 * Lève une ForbiddenError (403) si l'utilisateur ne dispose pas du droit requis.
 */
export function requirePermission(action: PermissionAction, user?: PermissionUser | null): void {
  if (!user || !can(user, action)) {
    throw new ForbiddenError(action, user?.role || 'anonymous');
  }
}

export const MATRIX_ROLES: Role[] = ['owner', 'admin', 'recruiter', 'dpo', 'reader'];

export interface PermissionMatrixItem {
  action: PermissionAction;
  label: string;
  category: string;
  description: string;
  roles: Record<Role, 'granted' | 'conditional' | 'forbidden'>;
}

export const PERMISSION_ACTIONS_CONFIG: Record<
  PermissionAction,
  { label: string; category: string; description: string }
> = {
  import: {
    label: 'Import de CVs (Ingestion)',
    category: 'Recrutement',
    description: 'Téléversement et extraction de documents de candidature.',
  },
  search: {
    label: 'Recherche sémantique & Filtres',
    category: 'Recrutement',
    description: 'Interrogation du vivier de talents par critères et compétences.',
  },
  match: {
    label: 'Matching IA & Explicabilité',
    category: 'Recrutement',
    description: "Calcul du score d'affinité IA et restitution du raisonnement.",
  },
  chat: {
    label: 'Assistant IA Chatbot',
    category: 'Recrutement',
    description: 'Dialogue sémantique avec citations et requêtes candidates.',
  },
  'pipeline.write': {
    label: 'Pipeline de recrutement (Kanban)',
    category: 'Recrutement',
    description: 'Déplacement des candidats entre les étapes du processus.',
  },
  'shortlist.write': {
    label: 'Gestion des Shortlists',
    category: 'Recrutement',
    description: 'Création, ordonnancement et partage de sélections.',
  },
  'export.anonymized': {
    label: 'Export anonymisé (PDF/CSV)',
    category: 'Exports & Fichiers',
    description: 'Génération de dossiers sans données nominatives (mode aveugle).',
  },
  'export.named': {
    label: 'Export nominatif (Données PII)',
    category: 'Exports & Fichiers',
    description: 'Export complet avec identités réelles (contrôle strict et audit).',
  },
  'identity.reveal': {
    label: 'Levée du mode aveugle',
    category: 'Gouvernance & Sécurité',
    description: 'Démasquage temporaire des données personnelles avec justification.',
  },
  'rgpd.manage': {
    label: 'Gouvernance RGPD & Registre',
    category: 'Gouvernance & Sécurité',
    description: 'Traitement des demandes DSR, rétention et registre Art. 30.',
  },
  'audit.read': {
    label: "Journal d'audit WORM",
    category: 'Gouvernance & Sécurité',
    description: 'Consultation des événements scellés et preuves cryptographiques.',
  },
  'settings.write': {
    label: "Configuration de l'Organisation",
    category: 'Administration',
    description: "Modification des règles globales et politiques d'accès.",
  },
  'users.manage': {
    label: 'Gestion des Membres & Invitations',
    category: 'Administration',
    description: 'Invitation, attribution des rôles et révocation des sessions.',
  },
};

/**
 * Génère dynamiquement la matrice Rôles × Permissions depuis la table de vérité can().
 * Garantit la cohérence absolue entre l'affichage et les gardes serveurs.
 */
export function getPermissionsMatrix(): PermissionMatrixItem[] {
  const actions = Object.keys(PERMISSION_ACTIONS_CONFIG) as PermissionAction[];
  const roles: Role[] = ['owner', 'admin', 'recruiter', 'dpo', 'reader'];

  return actions.map((action) => {
    const meta = PERMISSION_ACTIONS_CONFIG[action];
    const roleMap = {} as Record<Role, 'granted' | 'conditional' | 'forbidden'>;

    for (const r of roles) {
      // 1. Test standard sans privilèges additionnels
      const baseUser: PermissionUser = {
        id: 'matrix_evaluator',
        role: r,
        can_export: false,
        can_reveal_identity: false,
      };
      const baseGranted = can(baseUser, action);

      if (baseGranted) {
        roleMap[r] = 'granted';
      } else {
        // 2. Test avec privilèges additionnels accordés (can_export, can_reveal_identity)
        const condUser: PermissionUser = {
          id: 'matrix_evaluator',
          role: r,
          can_export: true,
          can_reveal_identity: true,
        };
        const condGranted = can(condUser, action);
        if (condGranted) {
          roleMap[r] = 'conditional';
        } else {
          roleMap[r] = 'forbidden';
        }
      }
    }

    return {
      action,
      label: meta.label,
      category: meta.category,
      description: meta.description,
      roles: roleMap,
    };
  });
}

