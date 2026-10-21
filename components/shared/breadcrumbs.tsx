'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Accueil',
  dossiers: 'Dossiers',
  recherche: 'Recherche de talents',
  matching: 'Matching prédictif',
  chatbot: 'Assistant Copilote IA',
  cartographie: 'Cartographie sémantique',
  pipeline: 'Pipeline de recrutement',
  shortlists: 'Shortlists',
  utilisateurs: 'Utilisateurs & Droits',
  rgpd: 'Registre RGPD',
  audit: 'Journal d’Audit WORM',
  parametres: 'Paramètres',
  composants: 'Composants partagés',
  patterns: 'Patterns d’extraction',
  import: 'Importation de CV',
  cv: 'Fiche Candidat',
};

export function Breadcrumbs({ items, className }: { items?: BreadcrumbItem[]; className?: string }) {
  const pathname = usePathname();

  let breadcrumbs: BreadcrumbItem[] = [];

  if (items && items.length > 0) {
    breadcrumbs = items;
  } else {
    // Génération automatique à partir de l'URL
    const segments = pathname.split('/').filter(Boolean);
    breadcrumbs = [
      { label: 'Accueil', href: '/' },
      ...segments.map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 1).join('/')}`;
        const label = ROUTE_LABELS[seg] || decodeURIComponent(seg.replace(/-/g, ' '));
        const isLast = idx === segments.length - 1;
        return {
          label: label.charAt(0).toUpperCase() + label.slice(1),
          href: isLast ? undefined : href,
        };
      }),
    ];
  }

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Fil d’Ariane" className={cn('flex items-center text-xs text-slate-500', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home className="h-3 w-3" aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
