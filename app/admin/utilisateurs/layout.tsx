'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { can, type PermissionUser } from '@/lib/permissions';
import { mockFolders } from '@/lib/mock/data/folders';
import { AdminUsersProvider, useAdminUsers } from '@/components/admin/admin-users-context';
import { AdminMfaAlert } from '@/components/admin/admin-mfa-alert';

function AdminUsersLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const { members, invitations } = useAdminUsers();

  const permUser: PermissionUser = { id: user?.id || 'usr-current', role };
  const hasAccess = can(permUser, 'users.manage');

  const tabs = [
    {
      href: '/admin/utilisateurs/membres',
      label: 'Membres',
      icon: Users,
      badge: members.length.toString(),
      isActive: pathname.startsWith('/admin/utilisateurs/membres') || pathname === '/admin/utilisateurs',
    },
    {
      href: '/admin/utilisateurs/invitations',
      label: 'Invitations',
      icon: Mail,
      badge: invitations.filter((i) => i.status === 'pending').length.toString(),
      isActive: pathname.startsWith('/admin/utilisateurs/invitations'),
    },
    {
      href: '/admin/utilisateurs/roles',
      label: 'Rôles & Permissions',
      icon: ShieldCheck,
      badge: '13 actions',
      isActive: pathname.startsWith('/admin/utilisateurs/roles'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar
        blindMode={blindMode}
        onBlindModeToggle={() => setBlindMode(!blindMode)}
      />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} shortlistCount={3} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
                  Administration
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  Utilisateurs & Accès
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Gestion des Utilisateurs & Habilitations
                </h1>
                <Badge variant="warning">Owner & Admin</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Administration de l’équipe, contrôle des accès multi-facteurs, gestion des invitations et matrice de conformité RGPD.
              </p>
            </div>
          </div>

          {/* Contrôle d'accès strict (Owner & Admin uniquement) */}
          {!hasAccess ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Accès restreint aux Administrateurs et Propriétaires
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Votre rôle actuel (<span className="font-mono font-semibold uppercase">{role}</span>) ne dispose pas de la permission <code className="font-mono">users.manage</code>.
              </p>
              <Link href="/">
                <Button size="sm" variant="outline" className="text-xs mt-2">
                  Retour au tableau de bord
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Alerte visible si un Admin n'a pas activé la MFA */}
              <AdminMfaAlert members={members} />

              {/* Sous-navigation en routes */}
              <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                        tab.isActive
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold bg-indigo-50/20 dark:bg-indigo-950/20 rounded-t-lg'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <Badge
                          variant={tab.isActive ? 'default' : 'outline'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {tab.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Contenu spécifique de la sous-route */}
              <div className="pt-2">{children}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminUsersProvider>
      <AdminUsersLayoutContent>{children}</AdminUsersLayoutContent>
    </AdminUsersProvider>
  );
}
