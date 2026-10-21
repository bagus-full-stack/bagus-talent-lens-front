'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ShieldCheck,
  FileText,
  FolderOpen,
  Sparkles,
  Inbox,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'pipeline' | 'audit' | 'folder' | 'system';
  /**
   * GARANTIE DE CONFIDENTIALITÉ :
   * Les notifications ne contiennent STRICTEMENT aucune donnée personnelle directe (nom, prénom, contact).
   * Seules les références dépersonnalisées de dossiers ou pseudonymes sont autorisées.
   */
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Nouveaux CV analysés',
    message: '3 profils anonymisés ont été extraits et ajoutés au vivier du dossier #CYB-88.',
    timestamp: 'Il y a 5 min',
    read: false,
    category: 'folder',
  },
  {
    id: 'notif-2',
    title: 'Journal d’Audit WORM scellé',
    message: 'Le bloc d’audit horodaté pour l’organisation Cabinet Horizon RH a été signé cryptographiquement.',
    timestamp: 'Il y a 22 min',
    read: false,
    category: 'audit',
  },
  {
    id: 'notif-3',
    title: 'Progression de Shortlist',
    message: 'La sélection « Top Ingénieurs Sécurité Cloud » a été consolidée par l’équipe.',
    timestamp: 'Il y a 1 heure',
    read: true,
    category: 'pipeline',
  },
  {
    id: 'notif-4',
    title: 'Purge légale préventive',
    message: 'Contrôle automatique de rétention : aucun dossier inactif de plus de 24 mois.',
    timestamp: 'Il y a 3 heures',
    read: true,
    category: 'system',
  },
];

export function NotificationCenter({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'audit':
        return <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'folder':
        return <FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case 'pipeline':
        return <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'system':
      default:
        return <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        aria-label={`Notifications${unreadCount > 0 ? ` : ${unreadCount} non lue(s)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* En-tête du volet de notifications */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Centre de notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.2 text-[10px] font-bold font-mono dark:bg-indigo-950 dark:text-indigo-300">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span>Aucune notification récente</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    'p-3.5 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                    !notif.read && 'bg-indigo-50/40 dark:bg-indigo-950/20',
                  )}
                >
                  <div className="mt-0.5 shrink-0 rounded-md p-1.5 bg-slate-100 dark:bg-slate-800">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={cn(
                          'text-xs truncate',
                          notif.read
                            ? 'font-medium text-slate-700 dark:text-slate-300'
                            : 'font-bold text-slate-900 dark:text-slate-100',
                        )}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pied du volet : mention de confidentialité */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Flux temps-réel sécurisé · Aucune donnée nominative diffusée</span>
          </div>
        </div>
      )}
    </div>
  );
}
