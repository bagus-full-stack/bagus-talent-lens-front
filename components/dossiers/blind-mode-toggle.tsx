'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff, Eye, ShieldAlert, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { ReasonDialog } from '@/components/shared/reason-dialog';
import { ReauthDialog } from '@/components/shared/reauth-dialog';
import { toast } from '@/components/shared/form-and-toast';
import { setBlindModeAction } from '@/app/(app)/dossiers/actions';

interface BlindModeToggleProps {
  folderId: string;
  blindModeEnabled: boolean;
  folderTitle: string;
  folderReference: string;
}

export function BlindModeToggle({
  folderId,
  blindModeEnabled,
  folderTitle,
  folderReference,
}: BlindModeToggleProps) {
  const router = useRouter();
  const { can, role } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState('');

  const canReveal = can('identity.reveal');

  const handleToggleClick = () => {
    if (isPending) return;

    // Si on est en mode aveugle (ON) et qu'on veut passer en nominatif (OFF)
    if (blindModeEnabled) {
      if (!canReveal) {
        toast.error(
          'Permission insuffisante',
          `Le rôle « ${role} » n'est pas habilité à lever le mode aveugle (permission 'identity.reveal' manquante).`,
        );
        return;
      }
      // Étape 1 : Saisie de la justification légale Art. 30 RGPD
      setIsReasonOpen(true);
    } else {
      // Si on est déjà en mode nominatif (OFF) et qu'on veut repasser en aveugle (ON) : immédiat !
      startTransition(async () => {
        try {
          const res = await setBlindModeAction(folderId, true);
          if (!res.success) {
            toast.error('Erreur', res.error || 'Impossible de réactiver le mode aveugle.');
            return;
          }
          toast.success(
            'Mode aveugle réactivé',
            'L’ensemble des profils et CVs sont à nouveau strictement anonymisés par le serveur.',
          );
          router.refresh();
        } catch {
          toast.error('Erreur système', 'Échec de la communication avec le serveur.');
        }
      });
    }
  };

  // Après validation du motif dans ReasonDialog -> ouverture de ReauthDialog
  const handleReasonSubmitted = (reason: string) => {
    setPendingReason(reason);
    setIsReasonOpen(false);
    setIsReauthOpen(true);
  };

  // Après confirmation de sécurité dans ReauthDialog -> appel Server Action
  const handleReauthSuccess = async () => {
    setIsReauthOpen(false);
    startTransition(async () => {
      try {
        const res = await setBlindModeAction(folderId, false, pendingReason, true);
        if (!res.success) {
          toast.error('Erreur de levée', res.error || 'La levée d’anonymat a été rejetée.');
          return;
        }
        toast.success(
          'Mode aveugle désactivé (Accès nominatif)',
          'Identités démasquées sous traçabilité WORM pour ce dossier.',
        );
        router.refresh();
      } catch {
        toast.error('Erreur', 'Impossible de lever le mode aveugle.');
      }
    });
  };

  const tooltipText = !canReveal
    ? "Permission insuffisante : la levée du mode aveugle requiert l'habilitation 'identity.reveal' et une authentification renforcée AAL2."
    : blindModeEnabled
      ? "Cliquez pour lever le mode aveugle (justification Art. 30 et ré-authentification requises)"
      : "Cliquez pour rétablir immédiatement l'anonymisation anti-biais stricte";

  return (
    <>
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
            blindModeEnabled
              ? 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
          }`}
          title={tooltipText}
        >
          <div className="flex items-center gap-1.5">
            {blindModeEnabled ? (
              <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            )}
            <span className="text-xs font-bold select-none">
              Mode aveugle : {blindModeEnabled ? 'ACTIF' : 'INACTIF'}
            </span>
          </div>

          {/* Interrupteur Switch avec infobulle si désactivé */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={blindModeEnabled}
              disabled={!canReveal && blindModeEnabled}
              onClick={handleToggleClick}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                blindModeEnabled
                  ? 'bg-amber-600'
                  : 'bg-slate-300 dark:bg-slate-700'
              } ${
                !canReveal && blindModeEnabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90'
              }`}
              title={tooltipText}
              aria-label="Basculer le mode aveugle"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  blindModeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}

          {/* Indicateur de restriction de permission si l'utilisateur ne peut pas lever */}
          {!canReveal && blindModeEnabled && (
            <span
              className="inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
              title="Désactivé : votre rôle ne possède pas la permission 'identity.reveal'"
            >
              <Lock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            </span>
          )}
        </div>
      </div>

      {/* Boîte de dialogue 1 : Saisie de la justification (Art. 30 RGPD) */}
      <ReasonDialog
        isOpen={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        onSubmit={handleReasonSubmitted}
        actionType="unmask"
        title="Levée exceptionnelle du mode aveugle"
        description={`Vous demandez l'accès aux identités et données nominatives pour le dossier ${folderTitle} (${folderReference}). Conformément à l'Article 30 du RGPD, cette action est irréversiblement tracée dans le journal d'audit WORM.`}
        targetItemName={folderTitle}
        submitButtonText="Confirmer le motif et passer à l'authentification"
      />

      {/* Boîte de dialogue 2 : Ré-authentification forte AAL2 */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onSuccess={handleReauthSuccess}
        title="Validation de Sécurité Forte (AAL2)"
        description="Confirmez votre identité par mot de passe ou code TOTP 2FA pour finaliser la levée d’anonymat."
        actionName={`Levée du mode aveugle sur ${folderReference}`}
      />
    </>
  );
}
