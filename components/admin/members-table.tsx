'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  MoreVertical,
  Trash2,
  Lock,
  Eye,
  FileDown,
  RefreshCw,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Membership, Role } from '@/types';
import {
  changeUserRoleAction,
  toggleUserPermissionAction,
  resetUserMfaAction,
  revokeUserSessionsAction,
} from '@/app/actions/users';
import { useAuth } from '@/lib/auth/auth-context';
import { RemoveMemberDialog } from './remove-member-dialog';

export interface MembersTableProps {
  members: Membership[];
  onMembersChange: (updatedMembers: Membership[]) => void;
}

export function MembersTable({ members, onMembersChange }: MembersTableProps) {
  const { user, role: authRole } = useAuth();
  const [selectedForRemoval, setSelectedForRemoval] = useState<Membership | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const actorInfo = {
    id: user?.id || 'usr-current',
    name: user?.name || 'Administrateur',
    role: authRole || 'admin',
  };

  const activeOwnersCount = members.filter((m) => m.role === 'owner' && m.status === 'active').length;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setActionFeedback(null);
    } else {
      setActionFeedback(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionFeedback(null);
      setActionError(null);
    }, 4500);
  };

  const handleRoleChange = async (member: Membership, newRole: Role) => {
    setActiveMenuId(null);
    if (member.role === newRole) return;

    try {
      const res = await changeUserRoleAction(member.userId, newRole, actorInfo);
      if (!res.success) {
        showNotification(res.error || 'Erreur lors du changement de rôle.', true);
        return;
      }

      if (res.data) {
        onMembersChange(
          members.map((m) => (m.userId === member.userId ? res.data! : m))
        );
        showNotification(`Rôle de ${member.fullName} mis à jour vers '${newRole.toUpperCase()}'.`);
      }
    } catch (err: any) {
      showNotification(err.message || 'Erreur inattendue.', true);
    }
  };

  const handleTogglePermission = async (
    member: Membership,
    key: 'can_reveal_identity' | 'can_export'
  ) => {
    try {
      const res = await toggleUserPermissionAction(member.userId, key, actorInfo);
      if (!res.success) {
        showNotification(res.error || 'Erreur lors de la mise à jour.', true);
        return;
      }

      if (res.data) {
        onMembersChange(
          members.map((m) => (m.userId === member.userId ? res.data! : m))
        );
        const label = key === 'can_reveal_identity' ? 'Levée mode aveugle' : 'Export nominatif';
        showNotification(`Habilitation '${label}' ${res.data[key] ? 'accordée' : 'retirée'} pour ${member.fullName}.`);
      }
    } catch (err: any) {
      showNotification(err.message || 'Erreur inattendue.', true);
    }
  };

  const handleResetMfa = async (member: Membership) => {
    setActiveMenuId(null);
    try {
      const res = await resetUserMfaAction(member.userId, actorInfo);
      if (!res.success) {
        showNotification(res.error || 'Erreur lors de la réinitialisation MFA.', true);
        return;
      }

      if (res.data) {
        onMembersChange(
          members.map((m) => (m.userId === member.userId ? res.data! : m))
        );
        showNotification(`MFA réinitialisée pour ${member.fullName}. Il devra reconfigurer son second facteur.`);
      }
    } catch (err: any) {
      showNotification(err.message || 'Erreur inattendue.', true);
    }
  };

  const handleRevokeSessions = async (member: Membership) => {
    setActiveMenuId(null);
    try {
      const res = await revokeUserSessionsAction(member.userId, actorInfo);
      if (!res.success) {
        showNotification(res.error || 'Erreur lors de la révocation.', true);
        return;
      }

      showNotification(`Toutes les sessions actives de ${member.fullName} ont été révoquées avec succès.`);
    } catch (err: any) {
      showNotification(err.message || 'Erreur inattendue.', true);
    }
  };

  const handleMemberRemoved = (removedUserId: string) => {
    onMembersChange(members.filter((m) => m.userId !== removedUserId && m.id !== removedUserId));
    showNotification('Le membre a été retiré de l’organisation et ses sessions ont été révoquées immédiatement.');
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'destructive';
      case 'admin':
        return 'warning';
      case 'dpo':
        return 'success';
      case 'recruiter':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Notifications retour */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="p-3">Collaborateur</th>
                <th className="p-3">Rôle organisation</th>
                <th className="p-3">Méthode de connexion</th>
                <th className="p-3">Sécurité MFA</th>
                <th className="p-3">Permissions fines</th>
                <th className="p-3">Dernière activité</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => {
                const isSelf = member.userId === user?.id;
                const isLastOwner = member.role === 'owner' && activeOwnersCount <= 1;

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Collaborateur (Avatar, Nom, Email) */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                          {getInitials(member.fullName)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{member.fullName}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 bg-slate-100 text-slate-600">
                                Vous
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rôle organisation avec sélecteur direct */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                          className={`h-7 px-2 text-xs rounded-md border bg-white dark:bg-slate-800 font-medium ${
                            isSelf
                              ? 'opacity-70 cursor-not-allowed border-slate-200 dark:border-slate-700'
                              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                          }`}
                        >
                          <option value="owner">Propriétaire (Owner)</option>
                          <option value="admin">Administrateur (Admin)</option>
                          <option value="recruiter">Recruteur (Recruiter)</option>
                          <option value="dpo">DPO / Légal</option>
                          <option value="reader">Lecteur (Reader)</option>
                        </select>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-[10px] uppercase">
                          {member.role}
                        </Badge>
                      </div>
                    </td>

                    {/* Méthode de connexion */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {member.authMethod === 'google'
                            ? 'Google Workspace'
                            : member.authMethod === 'linkedin'
                            ? 'LinkedIn SSO'
                            : member.authMethod === 'fido2'
                            ? 'WebAuthn / FIDO2'
                            : 'Mot de passe fort'}
                        </span>
                      </div>
                    </td>

                    {/* Statut MFA */}
                    <td className="p-3">
                      {member.mfaEnabled ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                          <ShieldCheck className="h-4 w-4 shrink-0" />
                          <span>MFA Active ({member.aal?.toUpperCase()})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold text-[11px]">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>MFA Désactivée</span>
                        </div>
                      )}
                    </td>

                    {/* Permissions fines (Toggles) */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {/* Toggle can_reveal_identity */}
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(member, 'can_reveal_identity')}
                          title={member.can_reveal_identity ? 'Désactiver la levée du mode aveugle' : 'Activer la levée du mode aveugle'}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                            member.can_reveal_identity
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          <span>Anonymat</span>
                        </button>

                        {/* Toggle can_export */}
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(member, 'can_export')}
                          title={member.can_export ? 'Désactiver l’export nominatif' : 'Activer l’export nominatif'}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                            member.can_export
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <FileDown className="h-3 w-3" />
                          <span>Export</span>
                        </button>
                      </div>
                    </td>

                    {/* Dernière activité */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {member.lastActiveAt}
                    </td>

                    {/* Actions contextuelles */}
                    <td className="p-3 text-right">
                      <div className="relative inline-block text-left">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                          className="h-7 w-7 p-0"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>

                        {activeMenuId === member.id && (
                          <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 text-xs animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => handleResetMfa(member)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                              <span>Réinitialiser la MFA</span>
                            </button>

                            <button
                              onClick={() => handleRevokeSessions(member)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                            >
                              <LogOut className="h-3.5 w-3.5 text-slate-500" />
                              <span>Révoquer les sessions</span>
                            </button>

                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                            <button
                              disabled={isSelf || isLastOwner}
                              onClick={() => {
                                setActiveMenuId(null);
                                setSelectedForRemoval(member);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                                isSelf || isLastOwner
                                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>
                                Retirer le membre {isLastOwner ? '(Dernier Owner)' : isSelf ? '(Vous)' : ''}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale de confirmation de retrait avec avertissement révocation de session */}
      <RemoveMemberDialog
        isOpen={Boolean(selectedForRemoval)}
        onClose={() => setSelectedForRemoval(null)}
        member={selectedForRemoval}
        onSuccess={handleMemberRemoved}
        isLastOwner={selectedForRemoval?.role === 'owner' && activeOwnersCount <= 1}
        isSelf={selectedForRemoval?.userId === user?.id}
      />
    </div>
  );
}
