'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Membership } from '@/types';
import { removeUserMembershipAction } from '@/app/actions/users';
import { useAuth } from '@/lib/auth/auth-context';

export interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: Membership | null;
  onSuccess: (removedUserId: string) => void;
  isLastOwner?: boolean;
  isSelf?: boolean;
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  member,
  onSuccess,
  isLastOwner = false,
  isSelf = false,
}: RemoveMemberDialogProps) {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await removeUserMembershipAction(member.userId, {
        id: user?.id || 'usr-current',
        name: user?.name || 'Administrateur',
        role: role || 'admin',
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors du retrait du membre.');
        return;
      }

      onSuccess(member.userId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between bg-red-50/60 dark:bg-red-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/60 rounded-lg text-red-600 dark:text-red-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-red-950 dark:text-red-100">
                Retirer le collaborateur
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300">
                {member.fullName} ({member.email})
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

        {/* Corps */}
        <div className="p-4 space-y-4">
          {/* Bloc d'avertissement de sécurité obligatoire */}
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-900 dark:text-red-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-semibold block">
                  Révocation immédiate des sessions actives :
                </strong>
                <p className="mt-0.5">
                  Le retrait de ce membre révoquera immédiatement et irréversiblement tous ses jetons de session actifs, son accès aux dossiers et ses habilitations sur la plateforme.
                </p>
              </div>
            </div>
          </div>

          {/* Garde-fous bloquants */}
          {isSelf && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Garde-fou :</strong> Vous ne pouvez pas vous retirer vous-même de l’organisation. Demandez à un autre administrateur.
              </span>
            </div>
          )}

          {isLastOwner && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Garde-fou légal :</strong> Ce membre est le dernier Propriétaire (Owner) de l’organisation. Nommez d’abord un autre Owner avant de pouvoir le retirer.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="text-xs text-slate-600 dark:text-slate-400">
            Êtes-vous certain de vouloir révoquer les accès de <strong className="text-slate-900 dark:text-slate-100">{member.fullName}</strong> ?
            Cette opération sera scellée au registre d&apos;audit WORM.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
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
            disabled={loading || isSelf || isLastOwner}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{loading ? 'Révocation en cours...' : 'Confirmer le retrait & Révoquer sessions'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
