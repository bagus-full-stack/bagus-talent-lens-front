import { cookies } from 'next/headers';
import type { Role, Membership, Organization } from '@/types';
import { mockOrganization, mockMemberships } from '@/lib/mock/data/organizations';
import { requirePermission, type PermissionAction, type PermissionUser } from '@/lib/permissions';

export interface AuthSession {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarInitials: string;
    title: string;
  };
  membership: Membership;
  organization: Organization;
  role: Role;
  blindModeActive: boolean;
}

export function getDefaultSession(): AuthSession {
  const currentMember = mockMemberships[0]; // Idriss Ouédraogo
  return {
    user: {
      id: currentMember.userId,
      fullName: currentMember.fullName,
      email: currentMember.email,
      avatarInitials: 'IO',
      title: 'Lead Talent Partner & Admin',
    },
    membership: currentMember,
    organization: mockOrganization,
    role: currentMember.role,
    blindModeActive: true,
  };
}

/**
 * Récupère l'utilisateur courant côté serveur (cookies HTTP-only ou mock)
 */
export async function getServerCurrentUser(): Promise<PermissionUser | null> {
  const cookieStore = await cookies();
  const isLoggedOut = cookieStore.get('tl_logged_out')?.value === 'true';
  if (isLoggedOut) {
    return null;
  }

  const role = (cookieStore.get('tl_role')?.value as Role) || 'admin';
  const aal = (cookieStore.get('tl_aal')?.value as 'aal1' | 'aal2') || 'aal2';
  const userId = cookieStore.get('tl_user_id')?.value || 'usr-default';
  const canRevealIdentity = cookieStore.get('tl_can_reveal')?.value === 'true';
  const canExport = cookieStore.get('tl_can_export')?.value === 'true';

  // Si membre mock trouvé, hériter de ses drapeaux
  const matchingMember = mockMemberships.find((m) => m.userId === userId || m.role === role);

  return {
    id: userId,
    role: (matchingMember?.role || role),
    can_reveal_identity: matchingMember?.can_reveal_identity ?? canRevealIdentity,
    can_export: matchingMember?.can_export ?? canExport,
    aal,
    organizationId: mockOrganization.id,
  };
}

/**
 * Garde serveur unifié pour Server Actions et Route Handlers :
 * Récupère la session courante et valide la permission requise (lève 403 ForbiddenError sinon).
 */
export async function requireServerPermission(action: PermissionAction): Promise<PermissionUser> {
  const user = await getServerCurrentUser();
  requirePermission(action, user);
  return user!;
}

