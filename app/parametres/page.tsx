'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  Building2,
  EyeOff,
  ShieldCheck,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  RotateCcw,
  Sliders,
  Webhook,
  Layers,
  ChevronRight,
  ShieldAlert,
  Server,
  Key,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { ReauthDialog } from '@/components/shared/reauth-dialog';
import { Can } from '@/components/shared/can';
import { useAuth } from '@/lib/auth/auth-context';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { mockFolders } from '@/lib/mock/data/folders';
import { cn } from '@/lib/utils';

// Schéma de validation Zod des Paramètres
const SettingsSchema = z.object({
  // 1. Général
  name: z.string().min(2, 'Le nom de l’organisation doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'L’identifiant unique (slug) est requis'),
  timezone: z.string(),
  contactEmail: z.string().email('Adresse email invalide'),

  // 2. Mode aveugle & masquage de biais
  defaultBlindMode: z.boolean(),
  maskPhotos: z.boolean(),
  maskNames: z.boolean(),
  maskAgeAndBirthDate: z.boolean(),
  maskPostalAddresses: z.boolean(),
  maskSchoolNames: z.boolean(),
  allowCandidateUnmaskOnInterview: z.boolean(),

  // 3. Authentification & MFA
  mfaEnforced: z.boolean(),
  sessionTimeoutMinutes: z.number().min(15).max(1440),
  allowedLoginMethods: z.array(z.string()),
  allowedAuthDomains: z.string(),

  // 4. Durées de conservation & Purge CNIL
  retentionMonths: z.number().min(6, 'Minimum 6 mois').max(36, 'Maximum 36 mois conforme CNIL'),
  purgeAutomated: z.boolean(),
  dsrNotificationEmail: z.string().email('Email du DPO requis'),
  autoArchiveAfterInactivityDays: z.number().min(30).max(365),

  // 5. Pipeline & étapes
  defaultPipelineStages: z.string(),
  requireScoreThresholdForShortlist: z.boolean(),
  shortlistScoreMinimum: z.number().min(0).max(100),

  // 6. Intégrations API
  webhookUrl: z.string().url('URL de webhook invalide').or(z.literal('')),
  exportMaxCeiling: z.number().max(200, 'Plafond réglementaire limité à 200 candidats'),
  enableGeminiMatching: z.boolean(),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

type TabKey =
  | 'general'
  | 'blind_mode'
  | 'auth_mfa'
  | 'rgpd_purge'
  | 'pipeline'
  | 'integrations';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  description: string;
  isSensitive?: boolean;
}

const TABS: TabItem[] = [
  {
    key: 'general',
    label: 'Général',
    icon: Building2,
    description: 'Identité de l’organisation, fuseau et coordonnées',
  },
  {
    key: 'blind_mode',
    label: 'Mode Aveugle & Biais',
    icon: EyeOff,
    description: 'Politique de caviardage natif et masquage anti-discrimination',
    isSensitive: true,
  },
  {
    key: 'auth_mfa',
    label: 'Authentification & MFA',
    icon: Lock,
    description: 'Politique 2FA/AAL2 obligatoire, sessions et domaines SSO',
    isSensitive: true,
  },
  {
    key: 'rgpd_purge',
    label: 'Rétention & Purge CNIL',
    icon: Clock,
    description: 'Délais de conservation, destruction automatique et DPO',
    isSensitive: true,
  },
  {
    key: 'pipeline',
    label: 'Pipeline & Étapes',
    icon: Sliders,
    description: 'Étapes par défaut, seuils de matching et scoring',
  },
  {
    key: 'integrations',
    label: 'Intégrations API & IA',
    icon: Webhook,
    description: 'Webhooks sortants, plafonds d’export et moteur sémantique',
  },
];

export default function OrganizationSettingsPage() {
  const { role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isReauthOpen, setIsReauthOpen] = useState<boolean>(false);
  const [pendingValues, setPendingValues] = useState<SettingsFormValues | null>(null);

  // Valeurs initiales du formulaire
  const defaultValues: SettingsFormValues = {
    name: mockOrganization.name,
    slug: mockOrganization.slug,
    timezone: mockOrganization.timezone || 'Europe/Paris',
    contactEmail: 'contact@horizon-rh.fr',

    defaultBlindMode: mockOrganization.defaultBlindMode,
    maskPhotos: true,
    maskNames: true,
    maskAgeAndBirthDate: true,
    maskPostalAddresses: true,
    maskSchoolNames: true,
    allowCandidateUnmaskOnInterview: true,

    mfaEnforced: mockOrganization.mfaEnforced,
    sessionTimeoutMinutes: 60,
    allowedLoginMethods: mockOrganization.allowedLoginMethods,
    allowedAuthDomains: mockOrganization.allowedAuthDomains.join(', '),

    retentionMonths: mockOrganization.retentionMonths,
    purgeAutomated: mockOrganization.purgeAutomated,
    dsrNotificationEmail: 'dpo@horizon-rh.fr',
    autoArchiveAfterInactivityDays: 180,

    defaultPipelineStages: 'À trier, Sélectionné, Entretien RH, Entretien Client, Offre, Recruté',
    requireScoreThresholdForShortlist: true,
    shortlistScoreMinimum: 65,

    webhookUrl: 'https://api.horizon-rh.fr/webhooks/talentlens',
    exportMaxCeiling: 200,
    enableGeminiMatching: true,
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Détermine si des champs sensibles ont été modifiés
  const hasSensitiveChanges = () => {
    return Boolean(
      dirtyFields.defaultBlindMode ||
      dirtyFields.mfaEnforced ||
      dirtyFields.retentionMonths ||
      dirtyFields.purgeAutomated
    );
  };

  // Traitement de soumission du formulaire
  const onFormSubmit = (values: SettingsFormValues) => {
    // Si des modifications portent sur des paramètres critiques (Mode aveugle global, MFA, purge RGPD),
    // déclencher obligatoirement la ré-authentification forte <ReauthDialog>
    if (hasSensitiveChanges()) {
      setPendingValues(values);
      setIsReauthOpen(true);
      return;
    }

    applySettings(values);
  };

  const applySettings = (_values: SettingsFormValues) => {
    setSavedSuccess(true);
    reset(_values); // Marque comme non modifié
    setIsReauthOpen(false);
    setPendingValues(null);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReauthSuccess = () => {
    if (pendingValues) {
      applySettings(pendingValues);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar
        blindMode={blindMode}
        onBlindModeToggle={() => setBlindMode(!blindMode)}
        currentFolderReference="#DE-2026"
      />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} shortlistCount={3} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Fil d'Ariane & En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
                  Administration
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  Paramètres de l'Organisation
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Paramètres &amp; Gouvernance de l'Organisation
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configuration centralisée du caviardage, de la sécurité 2FA, des purges CNIL et des intégrations.
              </p>
            </div>

            {/* Bannière de confirmation de sauvegarde */}
            {savedSuccess && (
              <div className="p-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Paramètres enregistrés et appliqués avec succès.</span>
              </div>
            )}
          </div>

          {/* Formulaire complet enveloppé */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Bannière flottante ou fixe de détection des modifications non enregistrées */}
            {isDirty && (
              <div className="sticky top-12 z-30 bg-amber-500 text-slate-950 p-3.5 px-5 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
                  <span>
                    Vous avez des modifications non enregistrées sur cette page.
                  </span>
                  {hasSensitiveChanges() && (
                    <Badge variant="outline" className="bg-amber-600/30 border-slate-900 text-[10px] text-slate-950 font-bold uppercase">
                      Confirmation 2FA Requise
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => reset()}
                    className="h-8 text-xs bg-amber-400 border-amber-600 hover:bg-amber-300 text-slate-950"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs bg-slate-950 hover:bg-slate-900 text-white font-bold gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Enregistrer les modifications
                  </Button>
                </div>
              </div>
            )}

            {/* Disposition 2 Colonnes : Navigation latérale par onglets + Contenu de l'onglet actif */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Volet de Navigation latérale par onglets (4 colonnes) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs space-y-1">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Catégories de configuration
                </div>

                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-xs border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0 mt-0.5',
                          isActive
                            ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{tab.label}</span>
                          {tab.isSensitive && (
                            <span title="Modifications sensibles soumises à ré-authentification 2FA">
                              <Lock className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volet de Contenu de l'onglet actif (8 colonnes) */}
              <div className="lg:col-span-8">
                {/* 1. Onglet Général */}
                {activeTab === 'general' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <span>Identité de l'Organisation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Nom du Cabinet ou de l'Organisation :
                          </label>
                          <Input {...register('name')} className="text-xs" />
                          {errors.name && <p className="text-rose-500 text-[11px]">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Identifiant Unique (Slug) :
                          </label>
                          <Input {...register('slug')} className="text-xs font-mono" />
                          {errors.slug && <p className="text-rose-500 text-[11px]">{errors.slug.message}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Email de contact administratif :
                          </label>
                          <Input {...register('contactEmail')} type="email" className="text-xs" />
                          {errors.contactEmail && (
                            <p className="text-rose-500 text-[11px]">{errors.contactEmail.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Fuseau horaire :
                          </label>
                          <select
                            {...register('timezone')}
                            className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                          >
                            <option value="Europe/Paris">Europe/Paris (UTC+1 / UTC+2)</option>
                            <option value="UTC">UTC (Temps Universel Coordonné)</option>
                            <option value="America/Montreal">America/Montreal (UTC-5)</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 2. Onglet Mode Aveugle & Biais (Sensible) */}
                {activeTab === 'blind_mode' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <EyeOff className="w-5 h-5 text-indigo-600" />
                          <span>Gouvernance du Mode Aveugle &amp; Caviardage Natif</span>
                        </CardTitle>
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <Lock className="w-3 h-3" />
                          2FA Requise
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5 text-xs">
                      {/* Bascule générale */}
                      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            Activation par défaut du Mode Aveugle pour tous les nouveaux dossiers
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Garantit le respect de la politique anti-discrimination dès l'import des CV. Les recruteurs ne verront que des pseudonymes cryptographiques (ex: « Candidat #B7K2 »).
                          </p>
                        </div>

                        <Controller
                          name="defaultBlindMode"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                        />
                      </div>

                      {/* Règles unitaires de caviardage */}
                      <div className="space-y-3 pt-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-wider">
                          Champs soumis au caviardage algorithmique automatique :
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="p-3 border rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Photographies &amp; Visages (Biais d'apparence)
                            </span>
                            <input
                              type="checkbox"
                              {...register('maskPhotos')}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                          </label>

                          <label className="p-3 border rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Noms &amp; Prénoms (Biais d'origine/genre)
                            </span>
                            <input
                              type="checkbox"
                              {...register('maskNames')}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                          </label>

                          <label className="p-3 border rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Âge &amp; Dates de naissance (Biais générationnel)
                            </span>
                            <input
                              type="checkbox"
                              {...register('maskAgeAndBirthDate')}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                          </label>

                          <label className="p-3 border rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Adresses postales complètes (Biais géographique)
                            </span>
                            <input
                              type="checkbox"
                              {...register('maskPostalAddresses')}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 3. Onglet Authentification & MFA (Sensible) */}
                {activeTab === 'auth_mfa' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lock className="w-5 h-5 text-indigo-600" />
                          <span>Politique d'Authentification Forte &amp; MFA</span>
                        </CardTitle>
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <Lock className="w-3 h-3" />
                          2FA Requise
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            Imposer l'Authentification Multi-Facteurs (MFA / AAL2) pour toute l'organisation
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Bloque l'accès aux recruteurs et administrateurs tant qu'une clé TOTP ou FIDO2 n'a pas été configurée et validée.
                          </p>
                        </div>

                        <Controller
                          name="mfaEnforced"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Délai d'inactivité avant verrouillage de session (minutes) :
                          </label>
                          <Input
                            type="number"
                            {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Domaines de messagerie d'entreprise autorisés (SSO) :
                          </label>
                          <Input {...register('allowedAuthDomains')} className="text-xs font-mono" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 4. Onglet Rétention & Purge CNIL (Sensible) */}
                {activeTab === 'rgpd_purge' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="w-5 h-5 text-indigo-600" />
                          <span>Durées de Conservation &amp; Purge Automatisée (CNIL)</span>
                        </CardTitle>
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <Lock className="w-3 h-3" />
                          2FA Requise
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Durée maximale de conservation légale des profils (Mois) :
                          </label>
                          <Input
                            type="number"
                            min={6}
                            max={36}
                            {...register('retentionMonths', { valueAsNumber: true })}
                            className="text-xs font-bold"
                          />
                          <p className="text-[11px] text-slate-500">Recommandation CNIL : 24 mois maximum.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Email du Délégué à la Protection des Données (DPO) :
                          </label>
                          <Input {...register('dsrNotificationEmail')} type="email" className="text-xs" />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between gap-4 mt-2">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            Exécution automatique de la purge des profils expirés
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Détruit irréversiblement les documents PDF, extraits et vecteurs de compétences dès le dépassement de la durée légale.
                          </p>
                        </div>

                        <Controller
                          name="purgeAutomated"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 5. Onglet Pipeline & Étapes */}
                {activeTab === 'pipeline' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-600" />
                        <span>Étapes du Pipeline &amp; Seuils d'Excellence</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200">
                          Étapes standards du Kanban (séparées par une virgule) :
                        </label>
                        <Input {...register('defaultPipelineStages')} className="text-xs" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Seuil minimal d'adéquation pour intégration en Shortlist (%) :
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            {...register('shortlistScoreMinimum', { valueAsNumber: true })}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 6. Onglet Intégrations API & IA */}
                {activeTab === 'integrations' && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Webhook className="w-5 h-5 text-indigo-600" />
                        <span>Webhooks &amp; Intégration Moteur Sémantique</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200">
                          URL du Webhook de notification d'événements (WORM Hook) :
                        </label>
                        <Input {...register('webhookUrl')} className="text-xs font-mono" />
                        {errors.webhookUrl && (
                          <p className="text-rose-500 text-[11px]">{errors.webhookUrl.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label className="font-semibold text-slate-800 dark:text-slate-200">
                          Plafond de candidats par export (limite stricte max 200) :
                        </label>
                        <Input
                          type="number"
                          max={200}
                          {...register('exportMaxCeiling', { valueAsNumber: true })}
                          className="text-xs w-48 font-mono"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bouton de sauvegarde inférieur standard */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={!isDirty}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer les paramètres
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* Modale de réauthentification forte pour les paramètres sensibles */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onSuccess={handleReauthSuccess}
        title="Confirmation de Sécurité Forte (AAL2)"
        description="Vous modifiez des paramètres critiques de gouvernance (Mode aveugle global, politique MFA ou délais de purge légale CNIL). Veuillez confirmer votre identité par mot de passe ou code TOTP."
        actionName="Enregistrement des Paramètres Sensibles"
      />
    </div>
  );
}
