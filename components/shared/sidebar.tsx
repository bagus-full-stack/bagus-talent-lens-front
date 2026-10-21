'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Sparkles,
  Bot,
  Network,
  Kanban,
  Bookmark,
  Users,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Component,
  Shield,
  CheckCircle2,
  Layers,
  FileDown,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { hasPermission } from '@/lib/permissions/rbac';
import { useAuth } from '@/lib/auth/auth-context';
import { can, type PermissionAction, type PermissionUser } from '@/lib/permissions';

export interface SidebarProps {
  currentRole?: Role;
  folderCount?: number;
  shortlistCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  defaultCollapsed?: boolean;
}

export function Sidebar({
  currentRole,
  folderCount = 3,
  shortlistCount = 3,
  isMobileOpen = false,
  onMobileClose,
  defaultCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { role: authRole, user } = useAuth();
  const activeRole = currentRole || authRole;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      const saved = document.cookie
        .split('; ')
        .find((row) => row.startsWith('tl_sidebar_collapsed='))
        ?.split('=')[1];
      if (saved !== undefined) {
        return saved === 'true';
      }
    }
    return defaultCollapsed;
  });

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    document.cookie = `tl_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const permUser: PermissionUser = {
    id: user?.id || 'usr-current',
    role: activeRole,
  };

  const recruitmentLinks = [
    {
      href: '/',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: '/dossiers',
      label: 'Dossiers',
      icon: FolderOpen,
      badge: folderCount.toString(),
    },
    {
      href: '/recherche',
      label: 'Recherche de talents',
      icon: Search,
      badge: 'Sémantique',
    },
    {
      href: '/matching',
      label: 'Matching prédictif',
      icon: Sparkles,
      badge: 'Explicable',
    },
    {
      href: '/chatbot',
      label: 'Assistant Copilote IA',
      icon: Bot,
      badge: 'RAG',
    },
    {
      href: '/cartographie',
      label: 'Cartographie sémantique',
      icon: Network,
      badge: '2D/3D',
    },
    {
      href: '/pipeline',
      label: 'Pipeline actif',
      icon: Kanban,
      badge: 'Kanban',
    },
    {
      href: '/shortlists',
      label: 'Shortlists',
      icon: Bookmark,
      badge: shortlistCount.toString(),
    },
    {
      href: '/exports',
      label: 'Exports & Fichiers',
      icon: FileDown,
      badge: 'WORM',
    },
    {
      href: '/patterns',
      label: "Patterns d'extraction",
      icon: Layers,
      badge: 'Schémas',
    },
    {
      href: '/composants',
      label: 'Composants partagés',
      icon: Component,
      badge: 'Galerie',
    },
  ];

  const adminLinks: {
    href: string;
    label: string;
    icon: React.ElementType;
    action: PermissionAction;
  }[] = [
    {
      href: '/admin/utilisateurs/membres',
      label: 'Utilisateurs & Rôles',
      icon: Users,
      action: 'users.manage',
    },
    {
      href: '/rgpd',
      label: 'RGPD & Registre',
      icon: ShieldCheck,
      action: 'rgpd.manage',
    },
    {
      href: '/rgpd/demandes',
      label: 'Demandes DSR (Art. 15-22)',
      icon: FileCheck2,
      action: 'rgpd.manage',
    },
    {
      href: '/audit',
      label: "Journal d'audit WORM",
      icon: FileText,
      action: 'audit.read',
    },
    {
      href: '/parametres',
      label: 'Paramètres',
      icon: Settings,
      action: 'settings.write',
    },
  ];

  // Contenu interne de la navigation
  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="py-4">
        {/* En-tête mobile avec bouton fermer */}
        <div className="flex items-center justify-between px-4 mb-4 lg:hidden">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Navigation</span>
          <button
            onClick={onMobileClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fermer le tiroir"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Recrutement */}
        <div className={cn('px-4 mb-2', isCollapsed && 'lg:hidden')}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Plateforme Recrutement
          </p>
        </div>
        <nav className="space-y-0.5 px-2">
          {recruitmentLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                  isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400',
                    )}
                  />
                  <span className={cn(isCollapsed && 'lg:hidden')}>{item.label}</span>
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      isActive
                        ? 'bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Section Administration & Conformité */}
        <div className={cn('px-4 mt-6 mb-2', isCollapsed && 'lg:hidden')}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Conformité & Admin
          </p>
        </div>
        <nav className="space-y-0.5 px-2">
          {adminLinks.map((item) => {
            const isAllowed = can(permUser, item.action);
            const isActive =
              pathname === item.href ||
              (item.href.startsWith('/admin/utilisateurs') && pathname.startsWith('/admin/utilisateurs'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  !isAllowed && 'opacity-60 cursor-not-allowed',
                  isActive
                    ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                  isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400',
                    )}
                  />
                  <span className={cn(isCollapsed && 'lg:hidden')}>{item.label}</span>
                </div>
                {!isCollapsed && !isAllowed && (
                  <span title="Droit restreint pour ce profil">
                    <Lock className="h-3 w-3 text-slate-400" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cartouche bas de page & Bouton de repliement */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* Bouton de repliement desktop */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex w-full items-center justify-center p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors text-xs font-medium gap-2"
          aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Replier la barre (240px)</span>
            </>
          )}
        </button>

        {/* Normes & Sécurité (masqué si replié) */}
        {!isCollapsed && (
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Norme AFNOR & RGPD</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-400 leading-tight">
              Décisions humaines garanties sans biais automatisé.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Version Desktop (240 px ou 64 px replié) */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 min-h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-[240px]',
        )}
        aria-label="Navigation principale"
      >
        {sidebarContent}
      </aside>

      {/* 2. Version Mobile en tiroir (Drawer) avec backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop avec flou */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Tiroir */}
          <div className="fixed inset-y-0 left-0 w-[240px] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-50 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
