'use client';

import React from 'react';
import { useAdminUsers } from '@/components/admin/admin-users-context';
import { InvitationsTable } from '@/components/admin/invitations-table';

export default function AdminInvitationsPage() {
  const { invitations, setInvitations } = useAdminUsers();

  return (
    <div className="space-y-4">
      <InvitationsTable
        invitations={invitations}
        onInvitationsChange={(updated) => setInvitations(updated)}
      />
    </div>
  );
}
