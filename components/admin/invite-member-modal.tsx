'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
  Eye,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Role, Invitation } from '@/types';
import { createInvitationAction } from '@/app/actions/users';
import { useAuth } from '@/lib/auth/auth-context';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInv: any) => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const { user, role: authRole } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<Role>('recruiter');
  const [canRevealIdentity, setCanRevealIdentity] = useState<boolean>(false);
  const [canExport, setCanExport] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse email professionnelle valide.');
      return;
    }

    setLoading(true);
    try {
      const res = await createInvitationAction(
        {
          email: email.trim(),
          role,
          can_reveal_identity: canRevealIdentity,
          can_export: canExport,
        },
        {
          id: user?.id || 'usr-current',
          name: user?.name || 'Administrateur',
          role: authRole || 'admin',
        }
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors de l’envoi de l’invitation.');
        return;
      }

      if (res.data) {
        onSuccess(res.data);
        onClose();
        setEmail('');
        setCanRevealIdentity(false);
        setCanExport(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions: Record<Role, { label: string; desc: string }> = {
    owner: { label: 'Propriétaire (Owner)', desc: 'Contrôle total sur l’organisation, la facturation et les clés.' },
    admin: { label: 'Administrateur (Admin)', desc: 'Gestion de l’équipe, des configurations et de l’ensemble des dossiers.' },
    recruiter: { label: 'Recruteur (Recruiter)', desc: 'Import, recherche, pipeline et évaluation des candidatures.' },
    dpo: { label: 'DPO / Juriste (DPO)', desc: 'Gouvernance RGPD, registre Art. 30, logs d’audit et demandes DSR.' },
    reader: { label: 'Lecteur / Client (Reader)', desc: 'Consultation en lecture seule, aucun export ni modification.' },
    viewer: { label: 'Observateur (Viewer)', desc: 'Accès limité en consultation.' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Inviter un nouveau collaborateur
              </h3>
              <p className="text-xs text-slate-500">
                Lien sécurisé à usage unique expirable sous 7 jours
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Adresse email professionnelle <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="prenom.nom@horizon-rh.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rôle attribué <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {(['admin', 'recruiter', 'dpo', 'reader'] as Role[]).map((r) => {
                const info = roleDescriptions[r];
                return (
                  <label
                    key={r}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                      role === r
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={role === r}
                      onChange={() => {
                        setRole(r);
                        if (r === 'admin' || r === 'owner') {
                          setCanRevealIdentity(true);
                          setCanExport(true);
                        } else {
                          setCanRevealIdentity(false);
                          setCanExport(false);
                        }
                      }}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {info.label}
                      </span>
                      <span className="block text-[11px] text-slate-500">{info.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Permissions fines conditionnelles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Habilitations granulaires additionnelles :
            </span>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={canRevealIdentity || role === 'admin' || role === 'owner'}
                disabled={role === 'admin' || role === 'owner'}
                onChange={(e) => setCanRevealIdentity(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Autoriser la levée du mode aveugle (identity.reveal)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={canExport || role === 'admin' || role === 'owner'}
                disabled={role === 'admin' || role === 'owner' || role === 'reader'}
                onChange={(e) => setCanExport(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <div className="flex items-center gap-1.5">
                <FileDown className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Autoriser les exports nominatifs PII (export.named)
                </span>
              </div>
            </label>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {loading ? (
                <span>Génération...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Envoyer l’invitation (7j)</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
