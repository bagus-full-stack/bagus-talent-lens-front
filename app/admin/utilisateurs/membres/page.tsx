'use client';

import React from 'react';
import { useAdminUsers } from '@/components/admin/admin-users-context';
import { MembersTable } from '@/components/admin/members-table';

export default function AdminMembersPage() {
  const { members, setMembers } = useAdminUsers();

  return (
    <div className="space-y-4">
      <MembersTable
        members={members}
        onMembersChange={(updated) => setMembers(updated)}
      />
    </div>
  );
}
