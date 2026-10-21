'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  UserCheck,
  Download,
  Trash2,
  FileSpreadsheet,
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Paperclip,
  History,
  Check,
  X,
  AlertCircle,
  Database,
  Layers,
  MapPin,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { can, type PermissionUser } from '@/lib/permissions';
import { mockFolders } from '@/lib/mock/data/folders';
import { ReauthDialog } from '@/components/shared/reauth-dialog';
import {
  type DataSubjectRequest,
  DSR_TYPE_LABELS,
  DSR_STATUS_LABELS,
  type DsrStatus,
} from '@/lib/schemas/dsr';
import { DsrService, type ErasureCascadeStep, type ErasureReport } from '@/lib/rgpd/dsr-service';
import {
  validateErasureStepAction,
  advanceDsrStatusAction,
  addDsrCommentAction,
  restrictCandidateAction,
} from '@/app/actions/dsr';

export default function DsrDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = typeof params?.id === 'string' ? decodeURIComponent(params.id) : '';

  const { user, role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);

  const permUser: PermissionUser = { id: user?.id || '', role };
  const hasAccess = can(permUser, 'rgpd.manage');

  const [dsr, setDsr] = useState<DataSubjectRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État de réauthentification forte
  const [isReauthOpen, setIsReauthOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'validate_step1' | 'validate_step2' | null>(null);

  // Cascade d'effacement animée
  const [isCascadeModalOpen, setIsCascadeModalOpen] = useState<boolean>(false);
  const [cascadeProgress, setCascadeProgress] = useState<number>(0);
  const [cascadeSteps, setCascadeSteps] = useState<ErasureCascadeStep[]>(DsrService.getErasureCascadeSteps());

  // Nouveau commentaire
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Rapport d'effacement
  const [erasureReport, setErasureReport] = useState<ErasureReport | null>(null);

  // Chargement des données
  const fetchDsrDetail = async () => {
    if (!idParam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rgpd/demandes/${encodeURIComponent(idParam)}`);
      if (res.ok) {
        const data = await res.json();
        setDsr(data.dsr);
      } else {
        setErrorMessage('Dossier DSR introuvable.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess && idParam) {
      fetchDsrDetail();
    }
  }, [hasAccess, idParam]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />
        <div className="flex flex-1">
          <Sidebar currentRole={role} folderCount={mockFolders.length} />
          <main className="flex-1 p-6 max-w-4xl mx-auto flex items-center justify-center">
            <Card className="p-8 max-w-md text-center space-y-4 border-rose-200 bg-white dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Accès Non Autorisé</h2>
              <p className="text-xs text-slate-500">
                La consultation et l'instruction des dossiers DSR requièrent l'habilitation <strong>DPO</strong> ou <strong>Admin</strong>.
              </p>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />
        <div className="flex flex-1">
          <Sidebar currentRole={role} folderCount={mockFolders.length} />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span>Chargement du dossier d'instruction RGPD...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!dsr) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />
        <div className="flex flex-1">
          <Sidebar currentRole={role} folderCount={mockFolders.length} />
          <main className="flex-1 p-8 max-w-2xl mx-auto text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold">Demande introuvable</h2>
            <p className="text-xs text-slate-500">La référence {idParam} ne correspond à aucun dossier.</p>
            <Link href="/rgpd/demandes">
              <Button size="sm" variant="outline" className="text-xs">
                Retour à la liste des demandes
              </Button>
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const typeMeta = DSR_TYPE_LABELS[dsr.requestType];
  const isClosed = dsr.status === 'fulfilled' || dsr.status === 'rejected';
  const days = dsr.daysRemaining;
  const isOverdue = days <= 0 && !isClosed;
  const isCritical = days <= 3 && days > 0 && !isClosed;
  const isWarning = days <= 10 && days > 3 && !isClosed;

  // Frise des 4 statuts
  const stepsTimeline = [
    { key: 'received', label: '1. Reçue', desc: 'Demande enregistrée' },
    { key: 'identity_verified', label: '2. Identité vérifiée', desc: dsr.idVerificationNote || 'CNI/Passeport contrôlé' },
    { key: 'under_review', label: '3. En cours', desc: dsr.requiresDoubleValidation ? '1ère validation accordée' : 'Instruction technique' },
    { key: 'fulfilled', label: '4. Clôturée', desc: isClosed ? 'Certificat WORM émis' : 'En attente clôture' },
  ];

  const currentStepIndex =
    dsr.status === 'received'
      ? 1
      : dsr.status === 'identity_verified'
      ? 2
      : dsr.status === 'under_review'
      ? 3
      : 4;

  // Règle de double validation
  const isSameValidator = Boolean(dsr.firstValidatorId && dsr.firstValidatorId === user?.id);

  // Gestion de la validation d'effacement
  const handleTriggerErasureValidation = (step: 'validate_step1' | 'validate_step2') => {
    setErrorMessage(null);

    // Contrôle d'auto-validation strict
    if (step === 'validate_step2' && isSameValidator) {
      setErrorMessage(
        'Double validation refusée : le second validateur doit être un utilisateur distinct du premier validateur.'
      );
      return;
    }

    setPendingAction(step);
    setIsReauthOpen(true);
  };

  const handleReauthSuccess = async () => {
    setIsReauthOpen(false);
    if (!pendingAction) return;

    if (pendingAction === 'validate_step2') {
      // Démarre la cascade d'effacement animée
      setIsCascadeModalOpen(true);
      setCascadeProgress(15);

      setTimeout(() => setCascadeProgress(45), 500);
      setTimeout(() => setCascadeProgress(75), 1100);

      setTimeout(async () => {
        try {
          const result = await validateErasureStepAction(
            dsr.id,
            {
              id: user?.id || 'usr_second_val',
              name: user?.name || 'Second Validateur',
              role: role,
            },
            'Seconde validation conjointe accordée et effacement cascade exécuté.',
            true
          );

          if (!result.success || !result.data) {
            throw new Error(result.error || 'Erreur lors de la seconde validation');
          }

          setCascadeProgress(100);
          setTimeout(() => {
            setIsCascadeModalOpen(false);
            setDsr(result.data.dsr);
            if (result.data.erasureReport) {
              setErasureReport(result.data.erasureReport);
            }
            setSuccessMessage(
              'Cascade d’effacement achevée avec succès. Certificat WORM immuable généré.'
            );
          }, 600);
        } catch (err: any) {
          setIsCascadeModalOpen(false);
          setErrorMessage(err.message || 'Échec de validation.');
        }
      }, 1800);
    } else {
      // Étape 1
      try {
        const result = await validateErasureStepAction(
          dsr.id,
          {
            id: user?.id || 'usr_val1',
            name: user?.name || 'Premier Validateur',
            role: role,
          },
          'Premier niveau de validation d’effacement accordé (DPO / Admin).',
          true
        );

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erreur lors de la première validation');
        }

        setDsr(result.data.dsr);
        setSuccessMessage('Premier niveau de validation d’effacement enregistré. En attente du second validateur.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Échec de première validation.');
      }
    }
  };

  // Ajout de commentaire
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await addDsrCommentAction(dsr.id, newComment, {
        id: user?.id || 'usr_dpo',
        name: user?.name || 'Séverine Petit',
        role: role,
      });
      if (res.success && res.data) {
        setDsr(res.data);
        setNewComment('');
      } else {
        setErrorMessage(res.error || 'Erreur ajout commentaire');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Action restriction
  const handleRestrict = async () => {
    try {
      const res = await restrictCandidateAction(dsr.id, {
        id: user?.id || 'usr_dpo',
        name: user?.name || 'Séverine Petit',
        role: role,
      });
      if (res.success && res.data) {
        setDsr(res.data);
        setSuccessMessage('Traitement du candidat restreint avec succès (Art. 18 / 21 RGPD).');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur restriction');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* En-tête de navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                href="/rgpd/demandes"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Retour au registre des demandes</span>
              </Link>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Demande {dsr.id}</span>
                </h1>
                <Badge className="bg-indigo-600 text-white font-mono text-xs">
                  {typeMeta.article}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {DSR_STATUS_LABELS[dsr.status].label}
                </Badge>
              </div>

              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Candidat : <strong className="font-mono text-slate-700 dark:text-slate-300">{dsr.candidatePseudonym}</strong></span>
                <span>·</span>
                <span>Dossier : <strong className="font-mono text-slate-700 dark:text-slate-300">{dsr.folderReference}</strong></span>
                <span>·</span>
                <span>Reçu le : {new Date(dsr.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDsrDetail}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Actualiser</span>
              </Button>
            </div>
          </div>

          {/* Messages de succès ou d'erreur */}
          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Bandeau d'alerte Échéance CNIL (J-10 / J-3 / En retard) */}
          {!isClosed && (
            <div
              className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
                isOverdue
                  ? 'border-rose-300 bg-rose-50/90 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : isCritical
                  ? 'border-rose-300 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 animate-pulse'
                  : isWarning
                  ? 'border-amber-300 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50/80 text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 shrink-0 ${isOverdue || isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-500'}`} />
                <div>
                  <strong className="font-bold text-sm">
                    {isOverdue
                      ? `Échéance légale CNIL dépassée (${days} jours)`
                      : isCritical
                      ? `Alerte critique CNIL : J-${days} avant échéance légale`
                      : isWarning
                      ? `Alerte de vigilance : J-${days} avant échéance légale`
                      : `Compte à rebours légal : ${days} jours restants`}
                  </strong>
                  <p className="mt-0.5 opacity-90">
                    L'Article 12.3 du RGPD impose une réponse au candidat sous <strong>30 jours calendaires au plus tard</strong> (date limite : {new Date(dsr.legalDeadline).toLocaleDateString('fr-FR')}).
                  </p>
                </div>
              </div>

              <Badge
                variant={isOverdue || isCritical ? 'destructive' : isWarning ? 'warning' : 'outline'}
                className="font-mono text-xs px-2.5 py-1"
              >
                {isOverdue ? 'RETARD CNIL' : `J-${days}`}
              </Badge>
            </div>
          )}

          {/* 1. Frise des Statuts Horizontale */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">
              Frise de progression de l'instruction
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {stepsTimeline.map((st, index) => {
                const stepNum = index + 1;
                const isPassed = stepNum < currentStepIndex || isClosed;
                const isCurrent = stepNum === currentStepIndex && !isClosed;

                return (
                  <div
                    key={st.key}
                    className={`rounded-lg border p-3.5 transition-all relative ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : isPassed
                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {st.label}
                      </span>
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4 text-indigo-600 animate-spin" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Zone d'actions selon le Type de Demande */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Traitement & Actions Spécifiques : {typeMeta.label} ({typeMeta.article})
                </h3>
              </div>
              <span className="text-xs text-slate-500">{typeMeta.description}</span>
            </div>

            {/* CAS 1 : EFFACEMENT (Art. 17) */}
            {dsr.requestType === 'erasure' && (
              <div className="space-y-4 text-xs">
                {isClosed ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                          Effacement irréversible achevé et scellé dans le registre WORM
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Toutes les données ont été détruites. Certificat cryptographique :{' '}
                          <code className="font-mono text-[11px]">{dsr.sha256Certificate}</code>
                        </p>
                      </div>
                    </div>

                    <a href={`/api/rgpd/demandes/${encodeURIComponent(dsr.id)}/erasure-report`} download>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs">
                        <Download className="h-4 w-4" />
                        <span>Télécharger rapport d'effacement (sans PII)</span>
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4 space-y-2">
                      <div className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Protocole de double validation obligatoire (Art. 17 RGPD) :</span>
                      </div>
                      <p className="text-amber-800 dark:text-amber-300 leading-tight">
                        La destruction définitive exige deux approbations distinctes. <strong>Un même utilisateur ne peut en aucun cas être le premier et le second validateur.</strong> Une authentification forte (MFA) est requise à chaque étape.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Validateur 1 */}
                        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                          <div className="text-[11px] text-slate-500 font-medium">Premier Validateur (DPO/Admin)</div>
                          {dsr.firstValidatorId ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>{dsr.firstValidatorName}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">En attente de première signature</div>
                          )}
                        </div>

                        {/* Validateur 2 */}
                        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                          <div className="text-[11px] text-slate-500 font-medium">Second Validateur (Distinct obligatoire)</div>
                          {dsr.secondValidatorId ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>{dsr.secondValidatorName}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">En attente de contre-signature</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Boutons de déclenchement */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {!dsr.firstValidatorId ? (
                        <Button
                          size="sm"
                          onClick={() => handleTriggerErasureValidation('validate_step1')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Première Validation (DPO / Admin)</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          {isSameValidator && (
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Vous êtes déjà le premier validateur. Un second compte distinct doit signer.</span>
                            </span>
                          )}

                          <Button
                            size="sm"
                            disabled={isSameValidator}
                            onClick={() => handleTriggerErasureValidation('validate_step2')}
                            className="bg-rose-600 hover:bg-rose-700 text-white gap-2 text-xs shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Seconde Validation Conjointe & Exécution Cascade</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CAS 2 : ACCÈS & PORTABILITÉ (Art. 15 / 20) */}
            {(dsr.requestType === 'access' || dsr.requestType === 'portability') && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Générez l'archive complète des données personnelles, scores IA et documents du candidat pour satisfaire le droit d'accès ou la portabilité au format lisible par machine.
                </p>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Dossier Complet Candidat (Archive JSON / ZIP)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Comprend les fiches, notes internes, logs de matching et historique des candidatures.
                      </div>
                    </div>
                  </div>

                  <a href={`/api/rgpd/demandes/${encodeURIComponent(dsr.id)}/erasure-report`} download>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      <span>Générer le dossier complet</span>
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* CAS 3 : RECTIFICATION (Art. 16) */}
            {dsr.requestType === 'rectification' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  La demande de rectification porte sur des informations inexactes ou incomplètes. Vous pouvez accéder directement à la fiche candidat pour appliquer les modifications demandées.
                </p>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Fiche d'Évaluation du Candidat
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Identifiant : {dsr.candidatePseudonym} · Dossier {dsr.folderReference}
                    </div>
                  </div>

                  <Link href={`/cv/${encodeURIComponent(dsr.candidateId || 'cand-a1b2')}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                      <span>Ouvrir la fiche candidat (/cv/[id])</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* CAS 4 : OPPOSITION & LIMITATION (Art. 18 / 21) */}
            {(dsr.requestType === 'opposition' || dsr.requestType === 'restriction') && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Le candidat demande la limitation de traitement ou s'oppose à son intégration dans le matching prédictif. Le profil sera gelé sans suppression physique des données.
                </p>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Restriction du traitement des données
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Active le drapeau d'opposition (exclu du matching, des exports et des listes).
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleRestrict}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Restreindre le traitement</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 2. Panneau « Données concernées » : Inventaire fourni par le serveur */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-600" />
                  <span>Panneau « Données concernées » (Inventaire Certifié par le Serveur)</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cartographie exacte des 10 catégories d'actifs de données hébergés pour ce candidat.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {dsr.dataLocations?.length || 10} catégories
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(dsr.dataLocations || DsrService.getCandidateInventory(dsr.candidateId || 'cand-a1b2')).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.component}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category}
                        </Badge>
                        {item.status === 'purged' ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Purgé
                          </Badge>
                        ) : item.status === 'restricted' ? (
                          <Badge className="bg-amber-600 text-white text-[10px]">
                            Restreint
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-[10px]">
                            En attente
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Emplacement : {item.storage}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Action : {item.actionRequired}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      {item.itemCount || 1} élément(s)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commentaires, Historique WORM & Pièces jointes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commentaires internes */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <span>Commentaires internes & Notes DPO</span>
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {dsr.comments?.length || 0}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {(!dsr.comments || dsr.comments.length === 0) ? (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      Aucun commentaire sur ce dossier.
                    </div>
                  ) : (
                    dsr.comments.map((cmt) => (
                      <div key={cmt.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                          <span>{cmt.authorName} ({cmt.authorRole})</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(cmt.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{cmt.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter une note d'instruction interne (DPO/Admin)..."
                    className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                    >
                      {isSubmittingComment ? 'Enregistrement...' : 'Ajouter le commentaire'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Historique d'audit WORM */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  <span>Journal d'Audit Immuable du Dossier (WORM)</span>
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono text-emerald-600 border-emerald-300">
                  Scellé WORM
                </Badge>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(dsr.history || []).map((h) => (
                    <div key={h.id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                          {h.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Par : <strong>{h.actorName}</strong> ({h.actorRole})
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{h.details}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Boîte de dialogue de Ré-authentification forte */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onSuccess={handleReauthSuccess}
        title="Double Validation RGPD : Contrôle 2FA Obligatoire"
        description="L'effacement irréversible de données personnelles exige une validation forte d'identité (TOTP / Mot de passe)."
        actionName="Validation Effacement RGPD"
      />

      {/* Modal de progression de cascade d'effacement */}
      {isCascadeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full border-4 border-rose-100 border-t-rose-600 animate-spin mx-auto flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Cascade d'effacement en cours d'exécution...
              </h3>
              <p className="text-xs text-slate-500">
                Purge cryptographique des 10 catégories d'actifs de données du candidat.
              </p>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-600 h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${cascadeProgress}%` }}
              />
            </div>

            <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
              {cascadeSteps.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rose-600" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{s.component}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-center font-mono text-slate-400">
              Scellement de l'audit trail WORM en cours...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
