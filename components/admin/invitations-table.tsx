'use client';

import React, { useState } from 'react';
import {
  Mail,
  UserPlus,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/types';
import type { StoredInvitation } from '@/lib/mock/data/invitations';
import { resendInvitationAction, revokeInvitationAction } from '@/app/actions/users';
import { useAuth } from '@/lib/auth/auth-context';
import { InviteMemberModal } from './invite-member-modal';

export interface InvitationsTableProps {
  invitations: StoredInvitation[];
  onInvitationsChange: (updated: StoredInvitation[]) => void;
}

export function InvitationsTable({
  invitations,
  onInvitationsChange,
}: InvitationsTableProps) {
  const { user, role: authRole } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const actorInfo = {
    id: user?.id || 'usr-current',
    name: user?.name || 'Administrateur',
    role: authRole || 'admin',
  };

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleResend = async (inv: StoredInvitation) => {
    try {
      const res = await resendInvitationAction(inv.id, actorInfo);
      if (res.success && res.data) {
        onInvitationsChange(
          invitations.map((i) => (i.id === inv.id ? res.data! : i))
        );
        showNotification(`Invitation renvoyée avec succès à ${inv.email} (+7 jours de validité).`);
      }
    } catch (err: any) {
      showNotification(`Erreur lors du renvoi : ${err.message}`);
    }
  };

  const handleRevoke = async (inv: StoredInvitation) => {
    try {
      const res = await revokeInvitationAction(inv.id, actorInfo);
      if (res.success && res.data) {
        onInvitationsChange(
          invitations.map((i) => (i.id === inv.id ? res.data! : i))
        );
        showNotification(`Invitation révoquée pour ${inv.email}.`);
      }
    } catch (err: any) {
      showNotification(`Erreur lors de la révocation : ${err.message}`);
    }
  };

  const handleCopyLink = (inv: StoredInvitation) => {
    const inviteLink = `${window.location.origin}/invitation?token=${inv.token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedTokenId(inv.id);
    showNotification(`Lien d’invitation copié dans le presse-papier !`);
    setTimeout(() => setCopiedTokenId(null), 3000);
  };

  const handleInvitationCreated = (newInv: StoredInvitation) => {
    onInvitationsChange([newInv, ...invitations]);
    showNotification(`Nouvelle invitation envoyée à ${newInv.email}.`);
  };

  return (
    <div className="space-y-4">
      {/* Barre supérieure avec bouton Inviter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Gestion des Invitations de Collaborateurs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des invitations en cours, expiration à 7 jours et révocations immédiates.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Inviter un collaborateur</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tableau des invitations */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Destinataire</th>
                <th className="p-3">Rôle invité</th>
                <th className="p-3">Auteur de l’invitation</th>
                <th className="p-3">Échéance d’expiration</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucune invitation en cours.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                  const isPending = inv.status === 'pending' && !isExpired;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{inv.email}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ID: {inv.id.slice(0, 18)}...
                        </span>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {inv.role}
                        </Badge>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {inv.invitedByName || inv.invitedBy}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(inv.expiresAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isExpired ? 'Expirée' : 'Valide 7 jours'}
                        </span>
                      </td>

                      <td className="p-3">
                        <Badge
                          variant={
                            inv.status === 'accepted'
                              ? 'success'
                              : inv.status === 'revoked'
                              ? 'destructive'
                              : isExpired
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {inv.status === 'accepted'
                            ? 'Acceptée'
                            : inv.status === 'revoked'
                            ? 'Révoquée'
                            : isExpired
                            ? 'Expirée'
                            : 'En attente'}
                        </Badge>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(inv)}
                                className="h-7 text-[11px] gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span>{copiedTokenId === inv.id ? 'Copié !' : 'Copier lien'}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResend(inv)}
                                className="h-7 text-[11px] gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Renvoyer (+7j)</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevoke(inv)}
                                className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 border-red-200"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Révoquer</span>
                              </Button>
                            </>
                          )}

                          {isExpired && inv.status !== 'revoked' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResend(inv)}
                              className="h-7 text-[11px] gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Réactiver (+7j)</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInvitationCreated}
      />
    </div>
  );
}
