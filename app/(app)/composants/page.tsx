'use client';

import React, { useState } from 'react';
import {
  Component,
  Shield,
  EyeOff,
  Table,
  AlertTriangle,
  KeyRound,
  FileText,
  Sparkles,
  Layers,
  UploadCloud,
  FileCheck,
  Bell,
  Check,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// 1. PiiField
import { PiiField } from '@/components/shared/pii-field';
// 2. BlindBadge
import { BlindBadge } from '@/components/shared/blind-badge';
// 3. DataTable
import { DataTable } from '@/components/shared/data-table';
import type { ColumnDef } from '@tanstack/react-table';
// 4. ConfirmDialog & DestructiveDialog
import { ConfirmDialog, DestructiveDialog } from '@/components/shared/confirm-dialog';
// 5. ReauthDialog
import { ReauthDialog } from '@/components/shared/reauth-dialog';
// 6. ReasonDialog
import { ReasonDialog } from '@/components/shared/reason-dialog';
// 7. Badges & Gauges
import { ConfidenceBadge, StatusBadge, ScoreGauge } from '@/components/shared/badges-and-gauges';
// 8. Feedback States
import { EmptyState, ErrorState, ForbiddenState } from '@/components/shared/feedback-states';
// 9. FileDropzone
import { FileDropzone } from '@/components/shared/file-dropzone';
// 10. PdfViewer
import { PdfViewer } from '@/components/shared/pdf-viewer';
// 11. FormField & Toaster
import { FormField, useToast } from '@/components/shared/form-and-toast';
// 12. NotificationCenter
import { NotificationCenter } from '@/components/shared/notification-center';

interface CandidateRow {
  id: string;
  pseudonym: string;
  currentRole: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  status: string;
}

const DEMO_DATA: CandidateRow[] = [
  {
    id: 'cand-1',
    pseudonym: 'CANDIDAT #CYB-8821',
    currentRole: 'Lead Cloud Security Architect',
    score: 94,
    confidence: 'high',
    status: 'interview',
  },
  {
    id: 'cand-2',
    pseudonym: 'CANDIDAT #DATA-4402',
    currentRole: 'Senior Data Platform Engineer',
    score: 87,
    confidence: 'high',
    status: 'screening',
  },
  {
    id: 'cand-3',
    pseudonym: 'CANDIDAT #SEC-1934',
    currentRole: 'Consultant Auditeur SOC-2 & ISO 27001',
    score: 68,
    confidence: 'medium',
    status: 'new',
  },
  {
    id: 'cand-4',
    pseudonym: 'CANDIDAT #DEV-7719',
    currentRole: 'Ingénieur DevOps & FinOps',
    score: 42,
    confidence: 'low',
    status: 'rejected',
  },
];

export default function ComponentsDemoPage() {
  const { toast } = useToast();

  // Dialog states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDestructiveOpen, setIsDestructiveOpen] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  // FormField state
  const [testEmail, setTestEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  // PiiField simulation input
  const [serverPiiValue, setServerPiiValue] = useState('***@***.***');

  // DataTable columns definition
  const columns: ColumnDef<CandidateRow>[] = [
    {
      accessorKey: 'pseudonym',
      header: 'Candidat (Mode aveugle)',
      cell: ({ row }) => (
        <PiiField value={row.original.pseudonym} mode="badge" fieldLabel="Identifiant candidat" />
      ),
    },
    {
      accessorKey: 'currentRole',
      header: 'Intitulé de poste objectif',
      cell: ({ row }) => <span className="font-semibold">{row.original.currentRole}</span>,
    },
    {
      accessorKey: 'score',
      header: 'Score Adéquation',
      cell: ({ row }) => <ScoreGauge score={row.original.score} size="sm" />,
    },
    {
      accessorKey: 'confidence',
      header: 'Fiabilité IA',
      cell: ({ row }) => <ConfidenceBadge level={row.original.confidence} score={row.original.score} />,
    },
    {
      accessorKey: 'status',
      header: 'Étape Pipeline',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  const handleValidateEmail = (val: string) => {
    setTestEmail(val);
    if (!val) {
      setEmailError('L’adresse email professionnelle est obligatoire.');
    } else if (!val.includes('@') || !val.includes('.')) {
      setEmailError('Format d’adresse email invalide (ex: recruteur@cabinet.fr).');
    } else {
      setEmailError(undefined);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div>
        <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">
          <Component className="h-4 w-4" />
          <span>Bibliothèque UI · Design System Éthique & RGPD</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Composants partagés TalentLens
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Cette vitrine interactive démontre les 12 composants partagés hautement accessibles et conformes aux conventions éthiques, RGPD et sécurité (Prompts 0 et 1).
        </p>
      </div>

      {/* Grille des 12 composants */}
      <div className="space-y-8">
        {/* Composant 1: PiiField */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  1
                </span>
                <span>&lt;PiiField /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Affiche strictement la valeur reçue du serveur sans aucun masquage côté client. Applique le style « masqué » si la valeur est un marqueur d'anonymisation (« *** », « [ANONYMISÉ] » ou pseudonyme).
              </p>
            </div>
            <Badge variant="outline">Art. 25 RGPD</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Mode Inline (Valeur caviardée) :</span>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <PiiField value="***" fieldLabel="Email candidat" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Mode Badge (Pseudonyme SHA-256) :</span>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <PiiField value="CAND-8821" mode="badge" fieldLabel="Pseudonyme" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Mode Block (Cartouche sécurisé) :</span>
              <PiiField value="[ANONYMISÉ PAR SERVEUR]" mode="block" fieldLabel="Téléphone personnel" />
            </div>
          </div>
        </Card>

        {/* Composant 2: BlindBadge */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  2
                </span>
                <span>&lt;BlindBadge /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pastille ambre « Mode aveugle actif » avec voyant pulsé et référence de dossier optionnelle.
              </p>
            </div>
            <Badge variant="outline">Anti-Biais</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <BlindBadge folder="#CYB-88" />
            <BlindBadge folder="#DATA-12" compact />
            <BlindBadge isActive={false} />
          </div>
        </Card>

        {/* Composant 3: DataTable */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  3
                </span>
                <span>&lt;DataTable /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tableau TanStack Table avec tri de colonnes, recherche en direct, pagination, sélection de lignes et barre d'actions groupées.
              </p>
            </div>
            <Badge variant="outline">TanStack Table</Badge>
          </div>

          <DataTable
            columns={columns}
            data={DEMO_DATA}
            searchPlaceholder="Filtrer les candidats présélectionnés..."
            renderBulkActions={(selected, reset) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.success('Action groupée', `${selected.length} profils déplacés vers l'étape suivante.`);
                    reset();
                  }}
                  className="h-7 text-xs"
                >
                  Déplacer vers Entretien
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info('Export anonymisé', `${selected.length} fiches exportées sans PII.`);
                    reset();
                  }}
                  className="h-7 text-xs"
                >
                  Export anonymisé
                </Button>
              </div>
            )}
          />
        </Card>

        {/* Composant 4: ConfirmDialog & DestructiveDialog */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  4
                </span>
                <span>&lt;ConfirmDialog /&gt; & &lt;DestructiveDialog /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Modales de sécurité avec saisie obligatoire du mot « SUPPRIMER » et mention explicite de consignation d'audit WORM (Art. 30 RGPD).
              </p>
            </div>
            <Badge variant="outline">Audit WORM</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsConfirmOpen(true)} className="text-xs">
              Ouvrir ConfirmDialog standard
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDestructiveOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Ouvrir DestructiveDialog (avec « SUPPRIMER »)</span>
            </Button>
          </div>

          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={() => {
              setIsConfirmOpen(false);
              toast.success('Action confirmée', 'L’opération a été exécutée avec succès.');
            }}
            title="Valider la mise à jour de la shortlist ?"
            description="Les profils sélectionnés seront partagés avec l'ensemble des consultants autorisés sur cette offre."
          />

          <DestructiveDialog
            isOpen={isDestructiveOpen}
            onClose={() => setIsDestructiveOpen(false)}
            onConfirm={() => {
              setIsDestructiveOpen(false);
              toast.error('Suppression scellée', 'Dossier purgé et consigné dans le journal d’audit WORM.');
            }}
            title="Suppression définitive du vivier"
            description="Cette action effacera de façon irréversible l'ensemble des documents CV et données associées."
            confirmWord="SUPPRIMER"
          />
        </Card>

        {/* Composant 5: ReauthDialog */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  5
                </span>
                <span>&lt;ReauthDialog /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Boîte de ré-authentification récente (mot de passe ou TOTP 6 chiffres) pour autoriser les actions hautement sensibles.
              </p>
            </div>
            <Badge variant="outline">AAL2 Exigé</Badge>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsReauthOpen(true)}
            className="text-xs gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-700"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Simuler une ré-authentification forte (requireRecentAuth)</span>
          </Button>

          <ReauthDialog
            isOpen={isReauthOpen}
            onClose={() => setIsReauthOpen(false)}
            onSuccess={() => {
              setIsReauthOpen(false);
              toast.success('Ré-authentification réussie', 'Preuve d’authentification récente déposée en cookie HTTP-only.');
            }}
            actionName="Autorisation d'export nominatif légal"
          />
        </Card>

        {/* Composant 6: ReasonDialog */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  6
                </span>
                <span>&lt;ReasonDialog /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Recueil d'un motif obligatoire (minimum 10 caractères) pour la levée d'anonymat, le refus ou l'export nominatif, transmis à la Server Action.
              </p>
            </div>
            <Badge variant="outline">Art. 30 RGPD</Badge>
          </div>

          <Button size="sm" onClick={() => setIsReasonOpen(true)} className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
            <FileText className="h-3.5 w-3.5" />
            <span>Tester ReasonDialog (Levée d'anonymat)</span>
          </Button>

          <ReasonDialog
            isOpen={isReasonOpen}
            onClose={() => setIsReasonOpen(false)}
            onSubmit={(reason) => {
              setIsReasonOpen(false);
              toast.success('Motif enregistré', `Justification Art. 30 RGPD scellée : « ${reason} »`);
            }}
            actionType="unmask"
            targetItemName="Candidat #CYB-8821"
          />
        </Card>

        {/* Composant 7: Badges & Gauges */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  7
                </span>
                <span>&lt;ConfidenceBadge /&gt;, &lt;StatusBadge /&gt;, &lt;ScoreGauge /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Indicateurs explicites accessibles pour daltoniens (avec libellés textuels complets, sans reposer sur la couleur seule).
              </p>
            </div>
            <Badge variant="outline">Accessibilité RGAA</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Badges de Fiabilité IA :</span>
              <div className="flex flex-col gap-2">
                <ConfidenceBadge level="high" score={94} />
                <ConfidenceBadge level="medium" score={68} />
                <ConfidenceBadge level="low" score={35} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Badges de Statut Pipeline :</span>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="new" />
                <StatusBadge status="screening" />
                <StatusBadge status="interview" />
                <StatusBadge status="offer" />
                <StatusBadge status="rejected" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Jauges d'Adéquation Sémantique :</span>
              <div className="flex items-center gap-4">
                <ScoreGauge score={94} size="md" showDetails />
                <ScoreGauge score={68} size="md" showDetails />
                <ScoreGauge score={35} size="md" showDetails />
              </div>
            </div>
          </div>
        </Card>

        {/* Composant 8: EmptyState, ErrorState, ForbiddenState */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  8
                </span>
                <span>&lt;EmptyState /&gt;, &lt;ErrorState /&gt;, &lt;ForbiddenState /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Retours d'état accessibles avec options d'action et bouton de nouvelle tentative.
              </p>
            </div>
            <Badge variant="outline">Feedback UI</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EmptyState
              title="Aucun dossier archivé"
              description="Tous vos viviers de recrutement sont actifs et à jour."
              actionText="Créer un vivier"
              onAction={() => toast.info('Action', 'Création de dossier')}
            />

            <ErrorState
              title="Échec de synchronisation RAG"
              message="Le modèle d'indexation n'a pu joindre le serveur vectoriel."
              errorCode="ERR_RAG_TIMEOUT"
              onRetry={() => { toast.success('Succès', 'Connexion rétablie.'); }}
            />

            <ForbiddenState
              title="Accès restreint (403)"
              message="Seul le profil DPO ou Administrateur peut consulter le registre."
              requiredRoleOrPermission="rgpd.manage"
            />
          </div>
        </Card>

        {/* Composant 9: FileDropzone */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  9
                </span>
                <span>&lt;FileDropzone /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Zone de glisser-déposer accessible au clavier (Tab + Entrée/Espace), filtrage strict PDF/DOCX et avertissement sur le caviardage serveur.
              </p>
            </div>
            <Badge variant="outline">Accessibilité Clavier</Badge>
          </div>

          <FileDropzone
            onFilesSelected={(files) =>
              toast.success('CV importés', `${files.length} document(s) prêt(s) pour le caviardage serveur.`)
            }
          />
        </Card>

        {/* Composant 10: PdfViewer */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  10
                </span>
                <span>&lt;PdfViewer /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visionneuse de CV avec zoom vectoriel, pagination, superposition de boîtes englobantes (bounding boxes) et bandeau de version anonymisée.
              </p>
            </div>
            <Badge variant="outline">Visionneuse Bbox</Badge>
          </div>

          <PdfViewer documentTitle="CV_Alexandre_Dumont_Architecte.pdf" folderReference="#CYB-88" />
        </Card>

        {/* Composant 11: FormField & Toaster */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  11
                </span>
                <span>&lt;FormField /&gt; & &lt;Toaster /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Champs de formulaire avec validation Zod, messages en français, attributs ARIA complets et système de notifications Toaster.
              </p>
            </div>
            <Badge variant="outline">react-hook-form + Zod</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <FormField
                id="demo-email-input"
                label="Email professionnel du collaborateur"
                required
                hint="Utilisé pour transmettre le lien d'activation de session."
                error={emailError}
              >
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => handleValidateEmail(e.target.value)}
                  placeholder="recruteur@cabinet-horizon.fr"
                  className="text-xs"
                />
              </FormField>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleValidateEmail('email-errone-sans-arobase')}
                  className="text-xs"
                >
                  Déclencher une erreur de validation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleValidateEmail('admin@cabinet-horizon.fr')}
                  className="text-xs"
                >
                  Renseigner une valeur valide
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Déclencher des Toasts :</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success('Opération réussie', 'Le candidat a été ajouté à la shortlist.')}
                  className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  Toast Succès
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.error('Action refusée', 'Le profil Lecteur n’a pas le droit d’exporter.')}
                  className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  Toast Erreur
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.warning('Alerte délai', 'Ce vivier nécessite un renouvellement de consentement.')}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Toast Avertissement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info('Information', 'Nouveau bloc WORM horodaté.')}
                  className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                >
                  Toast Info
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Composant 12: NotificationCenter */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  12
                </span>
                <span>&lt;NotificationCenter /&gt;</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Centre de notifications alimenté en temps réel (Supabase Realtime), garantissant l'absence stricte de données personnelles dans les messages.
              </p>
            </div>
            <Badge variant="outline">Realtime Privacy</Badge>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cliquez sur la cloche pour dérouler le centre de notifications :
            </span>
            <NotificationCenter />
          </div>
        </Card>
      </div>
    </div>
  );
}
