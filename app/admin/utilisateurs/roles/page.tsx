'use client';

import React from 'react';
import { PermissionsMatrixView } from '@/components/admin/permissions-matrix-view';

export default function AdminRolesPage() {
  return (
    <div className="space-y-4">
      <PermissionsMatrixView />
    </div>
  );
}
