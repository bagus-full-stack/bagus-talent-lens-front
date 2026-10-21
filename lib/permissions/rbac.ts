import type { Role } from '@/types';

export interface RolePermissions {
  canViewFolders: boolean;
  canCreateFolders: boolean;
  canImportCv: boolean;
  canRequestUnmask: boolean;
  canExecuteUnmask: boolean;
  canExportAnonymized: boolean;
  canExportNominative: boolean;
  canManageDsr: boolean;
  canExecuteDsrPurge: boolean;
  canViewAuditLogs: boolean;
  canManageTeam: boolean;
  canConfigureAiPatterns: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  owner: {
    canViewFolders: true,
    canCreateFolders: true,
    canImportCv: true,
    canRequestUnmask: true,
    canExecuteUnmask: true,
    canExportAnonymized: true,
    canExportNominative: true,
    canManageDsr: true,
    canExecuteDsrPurge: true,
    canViewAuditLogs: true,
    canManageTeam: true,
    canConfigureAiPatterns: true,
  },
  admin: {
    canViewFolders: true,
    canCreateFolders: true,
    canImportCv: true,
    canRequestUnmask: true,
    canExecuteUnmask: true,
    canExportAnonymized: true,
    canExportNominative: true,
    canManageDsr: true,
    canExecuteDsrPurge: true,
    canViewAuditLogs: true,
    canManageTeam: true,
    canConfigureAiPatterns: true,
  },
  recruiter: {
    canViewFolders: true,
    canCreateFolders: true,
    canImportCv: true,
    canRequestUnmask: true,
    canExecuteUnmask: false, // Nécessite validation ou élévation 2FA
    canExportAnonymized: true,
    canExportNominative: false, // Requiert approbation DPO / Admin
    canManageDsr: false,
    canExecuteDsrPurge: false,
    canViewAuditLogs: false,
    canManageTeam: false,
    canConfigureAiPatterns: false,
  },
  dpo: {
    canViewFolders: true,
    canCreateFolders: false,
    canImportCv: false,
    canRequestUnmask: false,
    canExecuteUnmask: false,
    canExportAnonymized: true,
    canExportNominative: true, // Pour audit légal
    canManageDsr: true,
    canExecuteDsrPurge: true,
    canViewAuditLogs: true,
    canManageTeam: false,
    canConfigureAiPatterns: false,
  },
  viewer: {
    canViewFolders: true,
    canCreateFolders: false,
    canImportCv: false,
    canRequestUnmask: false,
    canExecuteUnmask: false,
    canExportAnonymized: false,
    canExportNominative: false,
    canManageDsr: false,
    canExecuteDsrPurge: false,
    canViewAuditLogs: false,
    canManageTeam: false,
    canConfigureAiPatterns: false,
  },
  reader: {
    canViewFolders: true,
    canCreateFolders: false,
    canImportCv: false,
    canRequestUnmask: false,
    canExecuteUnmask: false,
    canExportAnonymized: false,
    canExportNominative: false,
    canManageDsr: false,
    canExecuteDsrPurge: false,
    canViewAuditLogs: false,
    canManageTeam: false,
    canConfigureAiPatterns: false,
  },
};

export function hasPermission(role: Role, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
