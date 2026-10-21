'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Bot,
  Network,
  Kanban,
  Bookmark,
  Users,
  ShieldCheck,
  FileText,
  Settings,
  UploadCloud,
  LogOut,
  Sun,
  Moon,
  EyeOff,
  Component,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions rapides' | 'Dossiers actifs' | 'Préférences';
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { logout, role } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Tableau de bord principal',
      category: 'Navigation',
      icon: LayoutDashboard,
      href: '/',
      shortcut: 'G D',
    },
    {
      id: 'nav-dossiers',
      title: 'Dossiers de recrutement & viviers',
      category: 'Navigation',
      icon: FolderOpen,
      href: '/dossiers',
      shortcut: 'G F',
    },
    {
      id: 'nav-recherche',
      title: 'Recherche sémantique de profils',
      category: 'Navigation',
      icon: Search,
      href: '/recherche',
      shortcut: 'G R',
    },
    {
      id: 'nav-matching',
      title: 'Matching prédictif explicable',
      category: 'Navigation',
      icon: Sparkles,
      href: '/matching',
      shortcut: 'G M',
    },
    {
      id: 'nav-pipeline',
      title: 'Pipeline actif & étapes',
      category: 'Navigation',
      icon: Kanban,
      href: '/pipeline',
      shortcut: 'G P',
    },
    {
      id: 'nav-shortlists',
      title: 'Shortlists de présentation',
      category: 'Navigation',
      icon: Bookmark,
      href: '/shortlists',
      shortcut: 'G S',
    },
    {
      id: 'nav-patterns',
      title: "Patterns d'extraction sémantique (Schémas)",
      category: 'Navigation',
      icon: Layers,
      href: '/patterns',
    },
    {
      id: 'nav-chatbot',
      title: 'Copilote IA & Assistant de décision',
      category: 'Navigation',
      icon: Bot,
      href: '/chatbot',
    },
    {
      id: 'nav-cartographie',
      title: 'Cartographie sémantique des compétences',
      category: 'Navigation',
      icon: Network,
      href: '/cartographie',
    },
    {
      id: 'nav-components',
      title: 'Galerie des composants partagés',
      category: 'Navigation',
      icon: Component,
      href: '/composants',
    },
    // Administration
    {
      id: 'nav-users',
      title: 'Utilisateurs & Gestion des rôles RBAC',
      category: 'Navigation',
      icon: Users,
      href: '/utilisateurs',
    },
    {
      id: 'nav-rgpd',
      title: 'Registre RGPD & Exercice des droits',
      category: 'Navigation',
      icon: ShieldCheck,
      href: '/rgpd',
    },
    {
      id: 'nav-audit',
      title: 'Journal d’Audit immuable WORM',
      category: 'Navigation',
      icon: FileText,
      href: '/audit',
    },
    {
      id: 'nav-settings',
      title: 'Paramètres d’organisation',
      category: 'Navigation',
      icon: Settings,
      href: '/parametres',
    },
    // Dossiers actifs (références dépersonnalisées uniquement)
    {
      id: 'folder-cyb-88',
      title: 'Dossier #CYB-88 : Lead Cloud Security Architect',
      category: 'Dossiers actifs',
      icon: FolderOpen,
      href: '/recherche?folder=fld-101',
    },
    {
      id: 'folder-data-12',
      title: 'Dossier #DATA-12 : Data Platform Engineer',
      category: 'Dossiers actifs',
      icon: FolderOpen,
      href: '/recherche?folder=fld-102',
    },
    {
      id: 'folder-sec-45',
      title: 'Dossier #SEC-45 : Consultant Auditeur SOC-2',
      category: 'Dossiers actifs',
      icon: FolderOpen,
      href: '/recherche?folder=fld-103',
    },
    // Actions rapides
    {
      id: 'act-import',
      title: 'Importer de nouveaux CV',
      category: 'Actions rapides',
      icon: UploadCloud,
      href: '/dossiers',
    },
    {
      id: 'act-new-shortlist',
      title: 'Créer une nouvelle shortlist',
      category: 'Actions rapides',
      icon: Bookmark,
      href: '/shortlists',
    },
    // Préférences
    {
      id: 'pref-theme',
      title: theme === 'dark' ? 'Basculer en mode Clair' : 'Basculer en mode Sombre',
      category: 'Préférences',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'pref-logout',
      title: 'Déconnexion de l’application',
      category: 'Préférences',
      icon: LogOut,
      action: () => logout(),
    },
  ];

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = useCallback((item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }, [onClose, router]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose, executeCommand]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Champ de recherche ⌘K */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher une page, une action, un dossier... (ex: dossiers, 2FA, dark)"
            className="w-full bg-transparent py-3.5 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden dark:text-slate-100"
            aria-label="Recherche dans la palette de commandes"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-[10px] font-mono font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
            Échap
          </kbd>
        </div>

        {/* Rappel de confidentialité */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-indigo-600" />
            <span>Index de commande sans données de candidats</span>
          </div>
          <span className="font-mono text-[10px]">Navigation & Actions</span>
        </div>

        {/* Liste des résultats filtrés */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aucune commande trouvée pour « {query} ».
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => executeCommand(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-slate-400')} />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] uppercase font-mono px-1.5 py-0.5 rounded',
                        isSelected
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd
                        className={cn(
                          'text-[10px] font-mono px-1 rounded',
                          isSelected ? 'text-indigo-200' : 'text-slate-400',
                        )}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de la palette */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ pour naviguer</span>
            <span>↵ pour sélectionner</span>
          </div>
          <span>TalentLens ⌘K</span>
        </div>
      </div>
    </div>
  );
}
