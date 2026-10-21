'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CommandPalette } from '@/components/shared/command-palette';
import { ToastProvider } from '@/components/shared/form-and-toast';
import { useAuth } from '@/lib/auth/auth-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [blindMode, setBlindMode] = useState(true);

  // Raccourci clavier global ⌘K / Ctrl+K pour ouvrir la palette de commandes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Barre supérieure unifiée */}
        <TopBar
          blindMode={blindMode}
          onBlindModeToggle={() => setBlindMode(!blindMode)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          currentFolderReference="#CYB-88"
        />

        {/* Corps principal : Barre latérale de 240 px repliable + Zone de contenu */}
        <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
          {/* Barre latérale (240px fixe / 64px repliée / tiroir mobile) */}
          <Sidebar
            currentRole={role}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Zone de contenu principale avec fil d'Ariane et largeur maximale adaptée */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
              {/* Fil d'Ariane automatique */}
              <Breadcrumbs className="mb-2" />

              {/* Contenu de la page */}
              {children}
            </main>
          </div>
        </div>

        {/* Palette de commandes ⌘K */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
