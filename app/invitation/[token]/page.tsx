'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Copy,
  Download,
  QrCode,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  Calendar,
  FileCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getInvitationServerState,
  submitCredentialsAction,
  verifyMfaAction,
  skipMfaAction,
  acceptCharterAndFinalizeAction,
  type InvitationDataResponse,
} from './actions';

function calculatePasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    special: boolean;
  };
} {
  const checks = {
    length: pass.length >= 12,
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    digit: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  const satisfiedCount = Object.values(checks).filter(Boolean).length;

  if (!pass) return { score: 0, label: 'Vide', color: 'bg-slate-700', checks };
  if (satisfiedCount <= 2) return { score: 1, label: 'Faible', color: 'bg-red-500', checks };
  if (satisfiedCount === 3 || satisfiedCount === 4) {
    return { score: satisfiedCount, label: 'Moyen', color: 'bg-amber-500', checks };
  }
  return { score: 5, label: 'Très fort (Conforme RGPD)', color: 'bg-emerald-500', checks };
}

function InvitationFlowContent() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  // État du serveur
  const [loading, setLoading] = useState(true);
  const [invData, setInvData] = useState<InvitationDataResponse | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // État de l'étape courante (1: Compte, 2: MFA, 3: Bienvenue)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : Formulaire d'inscription
  const [authMethod, setAuthMethod] = useState<'password' | 'google' | 'linkedin'>('password');
  const [emailInput, setEmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Étape 2 : MFA TOTP
  const [otpCode, setOtpCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [step2Submitting, setStep2Submitting] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Étape 3 : Charte & Finalisation
  const [acceptedCharter, setAcceptedCharter] = useState(false);
  const [showCharterDetails, setShowCharterDetails] = useState(false);
  const [step3Submitting, setStep3Submitting] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // Charger l'état serveur au montage
  useEffect(() => {
    let isMounted = true;
    async function loadServerState() {
      if (!token) return;
      setLoading(true);
      try {
        const data = await getInvitationServerState(token);
        if (!isMounted) return;
        setInvData(data);
        if (data.status === 'valid' && data.invitation) {
          setCurrentStep(data.step);
          setEmailInput(data.invitation.email);
        } else if (data.errorMessage) {
          setGeneralError(data.errorMessage);
        }
      } catch {
        if (isMounted) setGeneralError('Impossible de charger l’invitation. Vérifiez votre connexion.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadServerState();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Robustesse du mot de passe en direct
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const isPasswordValid =
    passwordStrength.checks.length &&
    passwordStrength.checks.uppercase &&
    passwordStrength.checks.lowercase &&
    passwordStrength.checks.digit &&
    passwordStrength.checks.special;

  const isEmailMatching = Boolean(
    invData?.invitation?.email &&
      emailInput.trim().toLowerCase() === invData.invitation.email.trim().toLowerCase(),
  );

  // Soumission Étape 1
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invData?.invitation) return;

    if (!isEmailMatching) {
      setStep1Error('L’adresse email doit correspondre exactement à l’invitation reçue.');
      return;
    }

    if (authMethod === 'password') {
      if (!isPasswordValid) {
        setStep1Error('Le mot de passe ne respecte pas l’ensemble des règles de sécurité.');
        return;
      }
      if (password !== confirmPassword) {
        setStep1Error('Les deux mots de passe saisis ne sont pas identiques.');
        return;
      }
    }

    setStep1Submitting(true);
    setStep1Error(null);

    try {
      const res = await submitCredentialsAction(token, {
        authMethod,
        email: emailInput,
        password: authMethod === 'password' ? password : undefined,
        confirmPassword: authMethod === 'password' ? confirmPassword : undefined,
        fullName: fullNameInput || undefined,
      });

      if (!res.success) {
        setStep1Error(res.error || 'Erreur lors de la validation des identifiants.');
        return;
      }

      // Progression vers l'étape 2 (MFA)
      setCurrentStep(2);
      // Nettoyer mot de passe en mémoire
      setPassword('');
      setConfirmPassword('');
    } catch {
      setStep1Error('Erreur réseau lors de la communication avec le serveur.');
    } finally {
      setStep1Submitting(false);
    }
  };

  // Simulation SSO Google / LinkedIn
  const handleSsoClick = (method: 'google' | 'linkedin') => {
    setAuthMethod(method);
    if (!invData?.invitation) return;
    setEmailInput(invData.invitation.email);
  };

  // Copie de la clé secrète TOTP
  const handleCopySecret = () => {
    if (!invData?.mfaSecret) return;
    navigator.clipboard.writeText(invData.mfaSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Téléchargement des codes de secours
  const handleDownloadBackupCodes = () => {
    if (!invData?.backupCodes || invData.backupCodes.length === 0) return;
    const content = [
      '======================================================',
      'TALENTLENS - CODES DE SECOURS DOUBLE AUTHENTIFICATION',
      '======================================================',
      `Organisation : Cabinet Horizon RH`,
      `Compte : ${invData.invitation?.email}`,
      `Généré le : ${new Date().toLocaleString('fr-FR')}`,
      '',
      'Ces codes sont à usage unique. Conservez-les en lieu sûr :',
      ...invData.backupCodes.map((code, idx) => `${idx + 1}. ${code}`),
      '',
      '======================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes-secours-talentlens-${invData.invitation?.email || 'compte'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copier les codes de secours
  const handleCopyBackupCodes = () => {
    if (!invData?.backupCodes) return;
    navigator.clipboard.writeText(invData.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Soumission Étape 2 (Vérification TOTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (otpCode.length !== 6) {
      setStep2Error('Veuillez saisir le code à 6 chiffres généré par votre application.');
      return;
    }

    setStep2Submitting(true);
    setStep2Error(null);

    try {
      const res = await verifyMfaAction(token, otpCode);
      if (!res.success) {
        setStep2Error(res.error || 'Code de confirmation TOTP invalide.');
        return;
      }

      // Si nouveaux codes renvoyés
      if (res.backupCodes) {
        setInvData((prev) => (prev ? { ...prev, backupCodes: res.backupCodes! } : prev));
      }

      setCurrentStep(3);
    } catch {
      setStep2Error('Erreur de validation du code avec le serveur.');
    } finally {
      setStep2Submitting(false);
    }
  };

  // Passer l'étape 2 (Non obligatoire pour profils non-admins)
  const handleSkipMfa = async () => {
    if (!token) return;
    setStep2Submitting(true);
    setStep2Error(null);

    try {
      const res = await skipMfaAction(token);
      if (!res.success) {
        setStep2Error(res.error || 'Impossible de passer cette étape.');
        return;
      }

      setCurrentStep(3);
    } catch {
      setStep2Error('Erreur de communication avec le serveur.');
    } finally {
      setStep2Submitting(false);
    }
  };

  // Soumission Étape 3 (Finalisation et redirection replace)
  const handleFinalize = async () => {
    if (!token) return;
    if (!acceptedCharter) {
      setStep3Error('Vous devez obligatoirement accepter la charte d’utilisation pour continuer.');
      return;
    }

    setStep3Submitting(true);
    setStep3Error(null);

    try {
      const res = await acceptCharterAndFinalizeAction(token, { acceptedCharter: true });
      if (!res.success) {
        setStep3Error(res.error || 'Erreur lors de la finalisation du compte.');
        setStep3Submitting(false);
        return;
      }

      // Redirection SÉCURISÉE avec replace : le jeton est immédiatement effacé de l'historique
      router.replace(res.redirectUrl || '/');
    } catch {
      setStep3Error('Erreur de finalisation.');
      setStep3Submitting(false);
    }
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Vérification sécurisée du jeton d’invitation...</p>
        </div>
      </div>
    );
  }

  // ÉCRAN D'ERREUR 1 : Expirée
  if (invData?.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-red-900/50 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-14 h-14 bg-red-950/80 border border-red-800 rounded-2xl flex items-center justify-center text-red-400">
            <XCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold">
              Invitation Expirée
            </span>
            <h1 className="text-xl font-bold text-white">Ce lien d’invitation a expiré</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pour des raisons strictes de sécurité et de conformité RGPD, les liens d’accès à la
              plateforme TalentLens ont une durée de validité limitée à 7 jours.
            </p>
          </div>
          {invData.invitation && (
            <div className="p-3 bg-slate-800/60 rounded-xl text-left text-xs space-y-1.5 border border-slate-700">
              <div className="flex justify-between text-slate-400">
                <span>Destinataire :</span>
                <span className="font-mono text-slate-200">{invData.invitation.email}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date de validité échue :</span>
                <span className="text-red-300">
                  {new Date(invData.invitation.expiresAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push('/connexion')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
            >
              Retour à la page de connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN D'ERREUR 2 : Déjà Utilisée
  if (invData?.status === 'already_used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-900/50 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-14 h-14 bg-amber-950/80 border border-amber-800 rounded-2xl flex items-center justify-center text-amber-400">
            <UserCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              Invitation Déjà Utilisée
            </span>
            <h1 className="text-xl font-bold text-white">Votre compte est déjà activé</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ce lien d’invitation a déjà été utilisé pour créer et rattacher votre compte au
              <strong> Cabinet Horizon RH</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/connexion')}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Se connecter à TalentLens</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ÉCRAN D'ERREUR 3 : Introuvable / Erreur réseau
  if (invData?.status === 'not_found' || generalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
            <AlertTriangle className="h-7 w-7 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Invitation introuvable</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {generalError || 'Ce lien d’accès est invalide ou a été révoqué par un administrateur.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/connexion')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
          >
            Aller à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  const invitation = invData?.invitation;
  const isMfaMandatory = invData?.mfaMandatory ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* En-tête TalentLens & Mode Aveugle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">TalentLens</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Mode Aveugle Natif
                </span>
              </div>
              <p className="text-xs text-slate-400">Plateforme ATS B2B & Évaluation Anonymisée</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-mono">Organisation</span>
            <span className="text-xs font-semibold text-slate-200">{invitation?.organizationName}</span>
          </div>
        </div>

        {/* Indicateur de Progression (3 Étapes) */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {/* Étape 1 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                currentStep === 1
                  ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-xs'
                  : currentStep > 1
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1 text-xs font-semibold">
                {currentStep > 1 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">
                    1
                  </span>
                )}
                <span className="hidden sm:inline">1. Compte & Accès</span>
                <span className="sm:hidden">1. Compte</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Identifiants</span>
            </div>

            {/* Étape 2 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                currentStep === 2
                  ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-xs'
                  : currentStep > 2
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1 text-xs font-semibold">
                {currentStep > 2 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span
                    className={`h-5 w-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                      currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    2
                  </span>
                )}
                <span className="hidden sm:inline">2. Sécurité & MFA</span>
                <span className="sm:hidden">2. MFA</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {isMfaMandatory ? 'AAL2 Obligatoire' : 'Recommandé'}
              </span>
            </div>

            {/* Étape 3 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                currentStep === 3
                  ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-xs'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1 text-xs font-semibold">
                <span
                  className={`h-5 w-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                    currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  3
                </span>
                <span className="hidden sm:inline">3. Droits & Charte</span>
                <span className="sm:hidden">3. Bienvenue</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Finalisation</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ÉTAPE 1 : INVITATION & CRÉATION DU COMPTE */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Récapitulatif Invitation du serveur */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <span className="text-slate-400">Invité par :</span>
                  <strong className="text-white">{invitation?.invitedByName}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Expire le{' '}
                    {invitation &&
                      new Date(invitation.expiresAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Rôle proposé :</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{invitation?.roleLabel}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email du compte invité :</span>
                  <div className="inline-flex items-center gap-1.5 font-mono text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{invitation?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rappel obligatoire de concordance d'email */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Rappel de conformité RGPD :</strong> L’adresse email de votre compte doit
                correspondre strictement à l’adresse de l’invitation (
                <span className="font-mono underline">{invitation?.email}</span>). Tout écart
                entraînera le rejet de l’accès.
              </p>
            </div>

            {/* Choix du mode d'authentification */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Choisissez votre méthode d’accès :
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSsoClick('google')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                    authMethod === 'google'
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSsoClick('linkedin')}
                  className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                    authMethod === 'linkedin'
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" fill="#0A66C2" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.79 1.75-1.76s-.78-1.76-1.75-1.76a1.76 1.76 0 0 0 0 3.52m1.39 9.74v-8.37H5.07v8.37z" />
                  </svg>
                  <span>LinkedIn (OIDC)</span>
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`px-3 py-0.5 rounded-full font-semibold border ${
                      authMethod === 'password'
                        ? 'bg-slate-800 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Ou par mot de passe sécurisé
                  </button>
                </div>
              </div>
            </div>

            {/* Formulaire complet */}
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nom et Prénom
                </label>
                <input
                  type="text"
                  placeholder="Ex : Camille Dupont"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Adresse email
                  </label>
                  {isEmailMatching ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Conforme à l’invitation
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="h-3 w-3" /> Doit correspondre à l’invitation
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`w-full py-2 pl-9 pr-3 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                      isEmailMatching
                        ? 'border-emerald-600/70 bg-slate-800/80 text-white focus:ring-emerald-500'
                        : 'border-amber-600 bg-amber-950/20 text-amber-200 focus:ring-amber-500'
                    }`}
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Champs de mot de passe (si méthode password) */}
              {authMethod === 'password' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Définir votre mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Au moins 12 caractères sécurisés"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full py-2 pl-3 pr-10 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                        title={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Jauge de robustesse */}
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Robustesse :</span>
                        <span className="font-semibold text-slate-200">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-full flex-1 rounded-full transition-all ${
                              passwordStrength.score >= lvl ? passwordStrength.color : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Règles en direct */}
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks.length ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordStrength.checks.length ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                        )}
                        <span>Au moins 12 caractères</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks.uppercase ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordStrength.checks.uppercase ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                        )}
                        <span>1 lettre majuscule (A-Z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks.lowercase ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordStrength.checks.lowercase ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                        )}
                        <span>1 lettre minuscule (a-z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks.digit ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordStrength.checks.digit ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                        )}
                        <span>Au moins 1 chiffre (0-9)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks.special ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {passwordStrength.checks.special ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                        )}
                        <span>1 caractère spécial (@!#$%...)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Retapez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-[11px] text-red-400">
                        Les deux mots de passe ne correspondent pas.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step1Error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{step1Error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  step1Submitting ||
                  !isEmailMatching ||
                  (authMethod === 'password' && (!isPasswordValid || password !== confirmPassword))
                }
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {step1Submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Continuer vers l’étape Sécurité & MFA</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : MFA (TOTP) & CODES DE SECOURS */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            {/* Bannière de règle de rôle */}
            {isMfaMandatory ? (
              <div className="p-3.5 bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    Double Authentification (MFA AAL2) Obligatoire
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    En tant qu’<strong>{invitation?.roleLabel}</strong>, vous disposez de privilèges
                    étendus d’administration et d’arbitrage RGPD. Conformément à la politique de
                    sécurité du Cabinet Horizon RH, l’activation du 2FA est exigée pour finaliser
                    l’inscription.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  L’activation de la double authentification (TOTP) est vivement recommandée pour
                  protéger les données des dossiers candidats. Vous pouvez également passer cette étape
                  et la configurer plus tard.
                </p>
              </div>
            )}

            {/* Carte de configuration TOTP */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Visualisation QR Code haute fidélité */}
                <div className="bg-white p-3 rounded-xl border border-slate-600 shadow-md shrink-0 flex flex-col items-center">
                  <div className="w-36 h-36 border-2 border-slate-900 p-2 bg-white flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                      <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                    </div>
                    <div className="flex justify-center items-center py-2">
                      <QrCode className="h-12 w-12 text-slate-900" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                      <div className="w-4 h-4 bg-slate-900" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 font-mono font-bold">
                    Scan TOTP (30s)
                  </span>
                </div>

                <div className="text-xs space-y-2.5">
                  <p className="font-semibold text-white">
                    1. Scannez le QR code avec votre application Authenticator
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Compatible avec Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden
                    ou FreeOTP (API standard Supabase MFA).
                  </p>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Ou saisissez la clé secrète manuellement :
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-700 text-slate-200">
                      <span className="font-bold tracking-wider select-all">{invData?.mfaSecret}</span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="ml-auto text-indigo-400 hover:text-indigo-300 p-1 rounded"
                        title="Copier la clé"
                      >
                        {copiedKey ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire de validation du code à 6 chiffres */}
              <form onSubmit={handleVerifyOtp} className="pt-3 border-t border-slate-700/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    2. Saisissez le code à 6 chiffres pour valider l’association
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ex : 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {step2Error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{step2Error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {!isMfaMandatory ? (
                    <button
                      type="button"
                      onClick={handleSkipMfa}
                      disabled={step2Submitting}
                      className="text-xs text-slate-400 hover:text-slate-200 underline font-medium py-2"
                    >
                      Passer pour l’instant
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-400/80 font-mono">
                      * Validation requise pour rôle Admin
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={step2Submitting || otpCode.length !== 6}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {step2Submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Valider et enregistrer le 2FA</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Affichage Unique de 8 codes de secours téléchargeables */}
            {invData?.backupCodes && invData.backupCodes.length > 0 && (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <KeyRound className="h-4 w-4 text-amber-400" />
                    <span>Vos 8 codes de secours d’urgence (Affichage unique)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyBackupCodes}
                      className="text-slate-400 hover:text-white p-1 text-xs inline-flex items-center gap-1"
                      title="Copier tous les codes"
                    >
                      {copiedCodes ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="text-[10px] hidden sm:inline">Copier</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBackupCodes}
                      className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-indigo-300"
                    >
                      <Download className="h-3 w-3" />
                      <span>Télécharger (.txt)</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ⚠️ <strong>Attention :</strong> Ces codes ne seront plus jamais réaffichés après
                  cette page. Ils vous permettent de déverrouiller votre compte en cas de perte de
                  votre smartphone.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs text-center">
                  {invData.backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : BIENVENUE, DROITS & CHARTE DE DÉONTOLOGIE */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-1.5">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Votre compte est prêt !</h1>
              <p className="text-xs text-slate-400">
                Organisation rattachée : <strong>{invitation?.organizationName}</strong> · Rôle :{' '}
                <span className="text-indigo-400 font-semibold">{invitation?.roleLabel}</span>
              </p>
            </div>

            {/* Résumé des Droits (« Peut / Ne peut pas ») */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Périmètre de vos habilitations de sécurité
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Colonne : Ce que vous pouvez faire */}
                <div className="space-y-2 p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Ce que vous pouvez faire :
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Consulter les dossiers de recrutement en mode aveugle natif</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Noter, filtrer et comparer les candidatures sur compétences réelles</span>
                    </li>

                    {/* Droit spécifique : Levée du mode aveugle */}
                    {invitation?.can_reveal_identity ? (
                      <li className="flex items-start gap-1.5 font-medium text-emerald-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Levée du mode aveugle :</strong> Autorisé à démasquer l’identité
                          civile (motif obligatoire audité dans le registre WORM).
                        </span>
                      </li>
                    ) : (
                      invitation?.role === 'recruiter' && (
                        <li className="flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Demander une levée de mode aveugle à l’administrateur</span>
                        </li>
                      )
                    )}

                    {/* Droit spécifique : Exports nominatifs */}
                    {invitation?.can_export ? (
                      <li className="flex items-start gap-1.5 font-medium text-emerald-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Exports nominatifs :</strong> Générer des synthèses PDF / Excel
                          nominatives.
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Exporter des synthèses de shortlists 100% anonymisées</span>
                      </li>
                    )}

                    {invitation?.role === 'admin' && (
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Inviter de nouveaux membres et gérer les droits RBAC</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Colonne : Ce que vous NE pouvez PAS faire */}
                <div className="space-y-2 p-3 bg-red-950/20 border border-red-900/40 rounded-xl">
                  <span className="font-semibold text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Ce que vous ne pouvez pas faire :
                  </span>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    {!invitation?.can_reveal_identity ? (
                      <li className="flex items-start gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Levée d’anonymat interdite :</strong> Le mode aveugle reste
                          infranchissable pour votre compte.
                        </span>
                      </li>
                    ) : null}

                    {!invitation?.can_export ? (
                      <li className="flex items-start gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Export nominatif interdit :</strong> Aucune donnée personnelle
                          (nom, coordonnées) ne peut être exportée.
                        </span>
                      </li>
                    ) : null}

                    {invitation?.role !== 'admin' && invitation?.role !== 'owner' && (
                      <>
                        <li className="flex items-start gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>Modifier la politique de conservation et purge RGPD</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>Consulter le journal d’audit de sécurité WORM complet</span>
                        </li>
                      </>
                    )}

                    {invitation?.can_reveal_identity && invitation?.can_export && (
                      <li className="flex items-start gap-1.5 text-slate-400">
                        <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>Contourner l’enregistrement des motifs de levée (traçabilité WORM non effaçable)</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Case d'acceptation de la charte d'utilisation */}
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedCharter}
                  onChange={(e) => setAcceptedCharter(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs leading-relaxed text-slate-300">
                  <span className="font-semibold text-white block mb-0.5">
                    Acceptation de la Charte d’Utilisation et de Déontologie TalentLens
                  </span>
                  <span>
                    Je m’engage formellement à respecter la confidentialité des dossiers de recrutement,
                    le principe de non-discrimination à l’embauche et la conformité RGPD (Art. 5 &
                    32). Je reconnais que toute action est tracée dans un registre immuable.
                  </span>
                </div>
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => setShowCharterDetails(!showCharterDetails)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>
                    {showCharterDetails
                      ? 'Masquer les engagements clés'
                      : 'Consulter les 4 engagements clés de la charte'}
                  </span>
                  {showCharterDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {showCharterDetails && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] space-y-2 text-slate-400 animate-in fade-in">
                    <p>
                      <strong>1. Évaluation objective :</strong> Privilégier les compétences et
                      expériences sans chercher à contourner l’anonymisation des critères protégés.
                    </p>
                    <p>
                      <strong>2. Motif légitime :</strong> Toute demande ou levée de mode aveugle doit
                      reposer sur une justification opérationnelle stricte (convocation en entretien
                      final, contractualisation).
                    </p>
                    <p>
                      <strong>3. Confidentialité absolue :</strong> Interdiction stricte de divulguer,
                      photographier ou diffuser hors de l’organisation les documents de candidatures.
                    </p>
                    <p>
                      <strong>4. Auditabilité :</strong> Tout accès aux données est scellé dans le journal
                      de preuve WORM conservé pour audits CNIL.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {step3Error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{step3Error}</span>
              </div>
            )}

            {/* Bouton d'accès final (redirection replace) */}
            <button
              type="button"
              onClick={handleFinalize}
              disabled={step3Submitting || !acceptedCharter}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step3Submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Accepter et accéder à l’espace de travail</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      }
    >
      <InvitationFlowContent />
    </Suspense>
  );
}
