'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Membership } from '@/types';
import type { StoredInvitation } from '@/lib/mock/data/invitations';
import { mockMemberships } from '@/lib/mock/data/organizations';
import { mockInvitations } from '@/lib/mock/data/invitations';

interface AdminUsersContextType {
  members: Membership[];
  setMembers: React.Dispatch<React.SetStateAction<Membership[]>>;
  invitations: StoredInvitation[];
  setInvitations: React.Dispatch<React.SetStateAction<StoredInvitation[]>>;
}

const AdminUsersContext = createContext<AdminUsersContextType | null>(null);

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Membership[]>(mockMemberships);
  const [invitations, setInvitations] = useState<StoredInvitation[]>(mockInvitations);

  return (
    <AdminUsersContext.Provider
      value={{
        members,
        setMembers,
        invitations,
        setInvitations,
      }}
    >
      {children}
    </AdminUsersContext.Provider>
  );
}

export function useAdminUsers() {
  const context = useContext(AdminUsersContext);
  if (!context) {
    throw new Error('useAdminUsers must be used within an AdminUsersProvider');
  }
  return context;
}
