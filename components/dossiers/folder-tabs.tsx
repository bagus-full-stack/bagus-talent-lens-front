'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Kanban,
  Bookmark,
  Users,
  Settings,
} from 'lucide-react';

interface FolderTabsProps {
  folderId: string;
  candidateCount: number;
}

export function FolderTabs({ folderId, candidateCount }: FolderTabsProps) {
  const pathname = usePathname();

  const baseUrl = `/dossiers/${folderId}`;

  const tabs = [
    {
      label: 'CV & Vivier',
      href: baseUrl,
      icon: FileText,
      badge: candidateCount,
      exact: true,
    },
    {
      label: 'Pipeline',
      href: `${baseUrl}/pipeline`,
      icon: Kanban,
      exact: false,
    },
    {
      label: 'Shortlists',
      href: `${baseUrl}/shortlists`,
      icon: Bookmark,
      exact: false,
    },
    {
      label: 'Membres',
      href: `${baseUrl}/membres`,
      icon: Users,
      exact: false,
    },
    {
      label: 'Paramètres',
      href: `${baseUrl}/parametres`,
      icon: Settings,
      exact: false,
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Onglets du dossier">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href || pathname === `${tab.href}/cv`
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
