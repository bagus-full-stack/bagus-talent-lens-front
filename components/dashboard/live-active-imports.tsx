'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Radio, CheckCircle2, UploadCloud, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LiveActiveImportsProps {
  initialCount?: number;
}

export function LiveActiveImports({ initialCount = 3 }: LiveActiveImportsProps) {
  const [activeCount, setActiveCount] = useState(initialCount);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Connexion Supabase Realtime si configuré
    try {
      const supabase = createClient();
      const channel = supabase
        .channel('realtime:cv-imports')
        .on('broadcast', { event: 'import_progress' }, (payload) => {
          if (payload?.count !== undefined) {
            setActiveCount(payload.count);
          }
          if (payload?.message) {
            setLastEvent(payload.message);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Mode simulation hors-ligne
    }
  }, []);

  // Simulation d'une progression en direct pour démonstration
  const handleSimulateFinish = () => {
    setActiveCount((prev) => {
      const next = Math.max(0, prev - 1);
      setLastEvent(
        next === 0
          ? 'Tous les lots de CV ont été anonymisés et indexés.'
          : `Lot finalisé avec succès. Reste ${next} import(s) en cours.`,
      );
      if (next === 0) setIsProcessing(false);
      return next;
    });
  };

  const handleSimulateAdd = () => {
    setActiveCount((prev) => {
      const next = prev + 1;
      setIsProcessing(true);
      setLastEvent(`Nouveau lot de CV injecté (#LOT-${Date.now().toString().slice(-4)})`);
      return next;
    });
  };

  return (
    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </span>
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span className="font-semibold text-white">
            {activeCount > 0 ? `${activeCount} import(s) en cours d'indexation` : 'Aucun import en cours'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>Realtime actif</span>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Détection PII & Anonymisation Gemini</span>
            <span className="font-mono text-indigo-300">Traitement en direct</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {lastEvent && (
        <p className="text-[11px] text-indigo-200/90 font-mono italic truncate">
          ℹ️ {lastEvent}
        </p>
      )}

      {/* Boutons d'interaction de simulation Realtime */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800 text-[10px]">
        <button
          type="button"
          onClick={handleSimulateAdd}
          className="text-slate-400 hover:text-indigo-300 underline"
          title="Simuler l'arrivée d'un nouveau lot"
        >
          + Ajouter un lot
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleSimulateFinish}
            className="text-slate-400 hover:text-emerald-300 underline"
            title="Simuler la finalisation d'un lot"
          >
            Terminer un lot
          </button>
        )}
      </div>
    </div>
  );
}
