'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Role, Membership, Organization } from '@/types';
import type { PermissionAction, PermissionUser } from '@/lib/permissions';
import { can } from '@/lib/permissions';
import { mockOrganization, mockMemberships } from '@/lib/mock/data/organizations';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  avatarInitials: string;
  title: string;
  role: Role;
  aal: 'aal1' | 'aal2';
  can_reveal_identity: boolean;
  can_export: boolean;
  organizationId: string;
}

export interface AuthContextType {
  user: CurrentUser | null;
  membership: Membership | null;
  organization: Organization;
  role: Role;
  aal: 'aal1' | 'aal2';
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  lastReauthAt: number | null;
  isMockEnvironment: boolean;
  can: (action: PermissionAction, resource?: unknown) => boolean;
  switchMockRole: (role: Role, options?: { aal?: 'aal1' | 'aal2' }) => void;
  recordReauth: () => void;
  setSessionExpired: (expired: boolean) => void;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: CurrentUser | null;
}) {
  const isMock = process.env.NEXT_PUBLIC_DATA_SOURCE !== 'supabase';

  // Chargement de l'utilisateur initial ou sélection mock par défaut (Idriss, Admin AAL2)
  const [currentMember, setCurrentMember] = useState<Membership>(() => {
    if (typeof window !== 'undefined' && isMock) {
      try {
        const savedRoleId = localStorage.getItem('talentlens_demo_member_id');
        if (savedRoleId) {
          const found = mockMemberships.find((m) => m.userId === savedRoleId);
          if (found) return found;
        }
      } catch {
        // Fallback en cas d'accès restreint au storage
      }
    }
    return mockMemberships[0];
  });

  const [aal, setAal] = useState<'aal1' | 'aal2'>(() => {
    if (typeof window !== 'undefined' && isMock) {
      try {
        const savedRoleId = localStorage.getItem('talentlens_demo_member_id');
        if (savedRoleId) {
          const found = mockMemberships.find((m) => m.userId === savedRoleId);
          if (found) return found.aal || 'aal1';
        }
      } catch {
        // Fallback en cas d'accès restreint au storage
      }
    }
    return mockMemberships[0].aal || 'aal2';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [lastReauthAt, setLastReauthAt] = useState<number | null>(null);
  const [organization, setOrganization] = useState<Organization>(mockOrganization);

  const user: CurrentUser | null = useMemo(() => {
    if (!currentMember) return null;
    const names = currentMember.fullName.split(' ');
    const initials = names.map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    return {
      id: currentMember.userId,
      fullName: currentMember.fullName,
      email: currentMember.email,
      avatarInitials: initials,
      title:
        currentMember.role === 'admin'
          ? 'Lead Talent Partner & Admin'
          : currentMember.role === 'owner'
          ? 'Directrice Associée & Fondatrice'
          : currentMember.role === 'dpo'
          ? 'Avocate & Déléguée Protection Données'
          : currentMember.role === 'reader'
          ? 'Client Partenaire (Observateur)'
          : 'Consultant Recrutement Senior',
      role: currentMember.role,
      aal,
      can_reveal_identity: Boolean(currentMember.can_reveal_identity),
      can_export: Boolean(currentMember.can_export),
      organizationId: organization.id,
    };
  }, [currentMember, aal, organization.id]);

  const checkPermission = useCallback(
    (action: PermissionAction, resource?: unknown) => {
      if (!user) return false;
      const permUser: PermissionUser = {
        id: user.id,
        role: user.role,
        can_reveal_identity: user.can_reveal_identity,
        can_export: user.can_export,
        organizationId: user.organizationId,
        aal: user.aal,
      };
      return can(permUser, action, resource);
    },
    [user],
  );

  // Bascule rapide de rôle en mode démo (interdit en production)
  const switchMockRole = useCallback(
    (targetRole: Role, options?: { aal?: 'aal1' | 'aal2' }) => {
      if (!isMock) {
        console.warn('La bascule de rôle de démonstration est désactivée en environnement de production.');
        return;
      }
      const match = mockMemberships.find((m) => {
        if (options?.aal) {
          return m.role === targetRole && m.aal === options.aal;
        }
        return m.role === targetRole;
      }) || mockMemberships.find((m) => m.role === targetRole) || mockMemberships[0];

      setCurrentMember(match);
      setAal(options?.aal ?? match.aal ?? 'aal1');
      if (typeof window !== 'undefined') {
        localStorage.setItem('talentlens_demo_member_id', match.userId);
        document.cookie = `tl_role=${match.role}; path=/; max-age=86400`;
        document.cookie = `tl_aal=${options?.aal ?? match.aal ?? 'aal1'}; path=/; max-age=86400`;
      }
    },
    [isMock],
  );

  const recordReauth = useCallback(() => {
    const now = Date.now();
    setLastReauthAt(now);
    if (typeof window !== 'undefined') {
      document.cookie = `tl_reauth_at=${now}; path=/; max-age=3600`;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        document.cookie = 'tl_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'tl_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'tl_reauth_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('talentlens_demo_member_id');
        window.location.href = '/connexion';
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchOrganization = useCallback((orgId: string) => {
    if (typeof window !== 'undefined') {
      document.cookie = `tl_org_id=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        membership: currentMember,
        organization,
        role: currentMember.role,
        aal,
        isAuthenticated: true,
        isLoading,
        isSessionExpired,
        lastReauthAt,
        isMockEnvironment: isMock,
        can: checkPermission,
        switchMockRole,
        recordReauth,
        setSessionExpired: setIsSessionExpired,
        logout,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un <AuthProvider>');
  }
  return context;
}

export function useCurrentUser(): CurrentUser | null {
  const { user } = useAuth();
  return user;
}

export function usePermission(action: PermissionAction, resource?: unknown): boolean {
  const { can: checkCan } = useAuth();
  return checkCan(action, resource);
}
