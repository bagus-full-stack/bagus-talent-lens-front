'use client';

import React, { useState } from 'react';
import {
  Trash2,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CvRetentionItem, PurgeLogItem } from '@/lib/schemas/rgpd-governance';
import { triggerPurgeAction } from '@/app/actions/rgpd';
import { useAuth } from '@/lib/auth/auth-context';

export interface PurgePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToPurge: CvRetentionItem[];
  onPurgeSuccess: (newLog: PurgeLogItem) => void;
}

export function PurgePreviewModal({
  isOpen,
  onClose,
  itemsToPurge,
  onPurgeSuccess,
}: PurgePreviewModalProps) {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecutePurge = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ids = itemsToPurge.map((item) => item.candidateId);
      const res = await triggerPurgeAction(ids, {
        id: user?.id || 'usr-dpo',
        name: user?.name || 'Séverine Petit',
        role: role || 'dpo',
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors de la purge.');
        return;
      }

      if (res.data) {
        onPurgeSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between bg-red-50/60 dark:bg-red-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/60 rounded-lg text-red-600 dark:text-red-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-red-950 dark:text-red-100">
                Purge cryptographique WORM ({itemsToPurge.length} CV concernés)
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300">
                Échéance légale de rétention 24 mois dépassée
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message d'avertissement irréversible */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <strong className="font-semibold">Action irréversible et certifiée :</strong>
              <p className="mt-0.5">
                La purge procèdera à la destruction physique des PDF originaux, versions caviardées, représentations vectorielles, et métadonnées nominatives. Un procès-verbal de destruction chiffré (SHA-256) sera scellé au registre.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Liste des profils programmés pour destruction :
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg max-h-52 overflow-y-auto">
              {itemsToPurge.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Aucun profil immédiat en attente de purge.
                </div>
              ) : (
                itemsToPurge.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.candidatePseudonym}
                      </span>
                      <span className="text-slate-500 ml-2">Dossier {item.folderReference}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">
                      {item.daysRemaining <= 0 ? 'Délai échu' : `J-${item.daysRemaining}`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Double signature DPO requise</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading || itemsToPurge.length === 0}
              onClick={handleExecutePurge}
              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{loading ? 'Purge en cours...' : 'Exécuter la purge certifiée'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
