'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Target,
  Shield,
  Check,
  Menu,
  Search,
  KeyRound,
  ShieldCheck,
  User,
} from 'lucide-react';
import { BlindBadge } from './blind-badge';
import { NotificationCenter } from './notification-center';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/auth-context';
import { RoleSwitcher } from './role-switcher';
import { Button } from '@/components/ui/button';

export interface TopBarProps {
  blindMode?: boolean;
  onBlindModeToggle?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  currentFolderReference?: string;
}

export function TopBar({
  blindMode = true,
  onBlindModeToggle,
  onOpenMobileSidebar,
  onOpenCommandPalette,
  currentFolderReference = '#CYB-88',
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { user, organization, logout, switchOrganization, isMockEnvironment, role, aal } = useAuth();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      {/* Barre supérieure : Sélecteur de rôle Démo & Statut de conformité */}
      <div className="flex h-9 items-center justify-between border-b border-indigo-100 bg-indigo-50/70 px-4 text-xs text-indigo-900 dark:border-indigo-950/60 dark:bg-indigo-950/40 dark:text-indigo-200">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold hidden sm:inline">Contrôle d’Accès & RBAC :</span>
          {/* Sélecteur de rôle de simulation (actif uniquement en environnement mock) */}
          <RoleSwitcher />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Mode aveugle global :</span>
            <button
              type="button"
              onClick={onBlindModeToggle}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                blindMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title="Basculer le mode aveugle global"
              aria-label="Basculer le mode aveugle global"
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  blindMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              {blindMode ? 'Actif' : 'Inactif'}
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
            Audit Ledger WORM · Scellé RFC 3161
          </span>
        </div>
      </div>

      {/* Barre de navigation principale */}
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Zone 1: Hamburger Mobile + Logo & Organisation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenMobileSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileSidebar}
              className="lg:hidden h-9 w-9 text-slate-700 dark:text-slate-200"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  TalentLens
                </span>
                <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  v3.4 PRO
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-500 sm:block dark:text-slate-400 leading-none">
                Plateforme éthique & Décision impartiale
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-block h-6 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          {/* Sélecteur d'organisation (contexte d'organisation) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/70 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Sélecteur d'organisation"
            >
              <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-left hidden sm:block">
                <span className="text-[10px] text-slate-400 block leading-none">Organisation</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate block">
                  {organization?.name || 'Cabinet Horizon RH'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>

            {showOrgMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOrgMenu(false)} />
                <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800 z-50 animate-in fade-in">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Organisations autorisées
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      switchOrganization('8a3b5c7d-9e1f-4a2b-8c3d-e4f5a6b7c8d9');
                      setShowOrgMenu(false);
                    }}
                    className="w-full flex items-center justify-between rounded px-2.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Cabinet Horizon RH</span>
                    </div>
                    <Check className="h-3.5 w-3.5 text-indigo-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchOrganization('org-partenaires-tech');
                      setShowOrgMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 mt-1"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Horizon Partners Europe</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-1.5 px-2">
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      Cookie signé d’organisation vérifié côté serveur.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zone 2: Palette de commandes ⌘K & Pastille Mode Aveugle */}
        <div className="flex items-center gap-3">
          {/* Bouton de déclenchement ⌘K */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Ouvrir la palette de commandes (Navigation rapide)"
            aria-label="Palette de commandes (Raccourci ⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Rechercher une action ou page...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              ⌘K
            </kbd>
          </button>

          {/* Pastille de mode aveugle du dossier courant */}
          <BlindBadge folder={currentFolderReference} compact />
        </div>

        {/* Zone 3: Notifications, Thème & Profil */}
        <div className="flex items-center gap-2">
          {/* Thème clair/sombre */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Basculer le thème"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Cloche de notifications temps réel */}
          <NotificationCenter />

          {/* Profil utilisateur & Menu Déconnexion */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menu profil utilisateur"
              aria-expanded={showUserMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
                {user?.avatarInitials || 'IO'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.fullName || 'Utilisateur'}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">
                  {role} {aal === 'aal2' ? '· AAL2 ✓' : '· AAL1'}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800 z-50 animate-in fade-in">
                  <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {user?.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.2 text-[10px] font-bold uppercase dark:bg-indigo-900 dark:text-indigo-200">
                        {role}
                      </span>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold dark:bg-emerald-900 dark:text-emerald-200">
                        {aal.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/parametres"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Mon compte & Rôles</span>
                    </Link>
                    <Link
                      href="/mfa-verify"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sécurité & Clés TOTP (MFA)</span>
                    </Link>
                    <Link
                      href="/composants"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Galerie des composants</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
