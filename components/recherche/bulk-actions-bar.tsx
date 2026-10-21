'use client';

import React, { useState } from 'react';
import {
  BookmarkPlus,
  Kanban,
  Download,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/form-and-toast';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  selectedIds: string[];
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  selectedIds,
}: BulkActionsBarProps) {
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkShortlist = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      addToast({
        type: 'success',
        title: 'Candidats ajoutés à la shortlist',
        message: `${selectedCount} candidat(s) ont été ajoutés à la shortlist active avec succès.`,
      });
      onClearSelection();
    }, 400);
  };

  const handleBulkPipeline = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      addToast({
        type: 'success',
        title: 'Pipeline mis à jour',
        message: `${selectedCount} candidat(s) ont été positionnés dans la phase « Entretien RH » du pipeline.`,
      });
      onClearSelection();
    }, 400);
  };

  const handleBulkExport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Simulation d'exportation conforme RGPD
      const blob = new Blob(
        [
          `# EXPORT TALENTLENS - STRICTEMENT ANONYMISÉ RGPD\nDate: ${new Date().toISOString()}\nTotal candidats: ${selectedCount}\nIDs: ${selectedIds.join(', ')}`,
        ],
        { type: 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentlens_export_anonymise_${selectedCount}_candidats.csv`;
      a.click();
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Export RGPD généré',
        message: `Fichier CSV anonymisé téléchargé pour ${selectedCount} candidat(s).`,
      });
    }, 400);
  };

  return (
    <aside
      aria-label="Actions groupées sur les candidats sélectionnés"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 px-4 py-3 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-2xl w-[92vw]"
    >
      <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white font-mono">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap">
          candidat{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1">
        <Button
          size="sm"
          onClick={handleBulkShortlist}
          disabled={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-xs"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Shortlist</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkPipeline}
          disabled={isProcessing}
          className="text-xs h-8 gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Pipeline</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkExport}
          disabled={isProcessing}
          className="text-xs h-8 gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export RGPD</span>
        </Button>
      </div>

      <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          title="Tout désélectionner"
          aria-label="Tout désélectionner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
