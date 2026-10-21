'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  FileText,
  Lock,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlindBadge } from '@/components/shared/blind-badge';
import { cn } from '@/lib/utils';

export interface BoundingBox {
  id: string;
  page: number;
  x: number; // en pourcentage (0-100)
  y: number; // en pourcentage (0-100)
  width: number; // en pourcentage (0-100)
  height: number; // en pourcentage (0-100)
  label: string;
  category?: 'pii_name' | 'pii_contact' | 'pii_photo' | 'skill' | 'experience' | 'salary' | 'other';
  anonymizedText?: string;
  fieldKey?: string;
}

export interface PdfViewerProps {
  documentTitle?: string;
  totalPages?: number;
  initialPage?: number;
  boundingBoxes?: BoundingBox[];
  isAnonymizedDefault?: boolean;
  folderReference?: string;
  className?: string;
  // Nouvelles props d'intégration /cv/[id]
  signedUrl?: string;
  candidatePseudonym?: string;
  isBlindMode?: boolean;
  activeBboxId?: string | null;
  onSelectBbox?: (bbox: BoundingBox) => void;
  onRefreshSignedUrl?: () => Promise<string | void> | void;
  hasLoadError?: boolean;
  onRetry?: () => void;
  expiresInSeconds?: number;
}

const DEFAULT_BBOXES: BoundingBox[] = [
  {
    id: 'bbox-1',
    page: 1,
    x: 8,
    y: 8,
    width: 32,
    height: 6,
    label: 'Identité candidat (Nom & Prénom)',
    category: 'pii_name',
    anonymizedText: 'CANDIDAT #CYB-8821',
  },
  {
    id: 'bbox-2',
    page: 1,
    x: 8,
    y: 15,
    width: 45,
    height: 7,
    label: 'Coordonnées (Email, Tél, Ville)',
    category: 'pii_contact',
    anonymizedText: '***@***.*** · +33 * ** ** **',
  },
  {
    id: 'bbox-3',
    page: 1,
    x: 75,
    y: 7,
    width: 18,
    height: 14,
    label: 'Zone photo / Avatar',
    category: 'pii_photo',
    anonymizedText: '[PHOTO CAVIARDÉE]',
  },
];

export function PdfViewer({
  documentTitle = 'CV_Document.pdf',
  totalPages = 2,
  initialPage = 1,
  boundingBoxes = DEFAULT_BBOXES,
  isAnonymizedDefault = true,
  folderReference = '#DE-2026',
  className,
  signedUrl,
  candidatePseudonym,
  isBlindMode,
  activeBboxId,
  onSelectBbox,
  onRefreshSignedUrl,
  hasLoadError = false,
  onRetry,
  expiresInSeconds = 60,
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const effectiveBlindMode = isBlindMode !== undefined ? isBlindMode : isAnonymizedDefault;
  const [isAnonymized, setIsAnonymized] = useState(effectiveBlindMode);
  const [selectedBbox, setSelectedBbox] = useState<BoundingBox | null>(null);
  const [ttlSeconds, setTtlSeconds] = useState(expiresInSeconds);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Synchronisation du mode aveugle parent
  useEffect(() => {
    if (isBlindMode !== undefined) {
      setIsAnonymized(isBlindMode);
    }
  }, [isBlindMode]);

  // Synchronisation de la bbox active depuis l'extérieur (sélection d'un champ du formulaire)
  useEffect(() => {
    if (activeBboxId) {
      const found = boundingBoxes.find((b) => b.id === activeBboxId || b.fieldKey === activeBboxId);
      if (found) {
        setSelectedBbox(found);
        if (found.page !== currentPage) {
          setCurrentPage(found.page);
        }
      }
    }
  }, [activeBboxId, boundingBoxes, currentPage]);

  // Décompte de validité de l'URL signée (60s) et renouvellement automatique
  useEffect(() => {
    setTtlSeconds(expiresInSeconds);
    const interval = setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 1) {
          // Déclencher le renouvellement de signature
          if (onRefreshSignedUrl) {
            onRefreshSignedUrl();
          }
          return expiresInSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [signedUrl, expiresInSeconds, onRefreshSignedUrl]);

  // Chargement du document depuis l'URL signée
  useEffect(() => {
    if (!signedUrl) return;

    let isMounted = true;
    setIsDocumentLoading(true);

    fetch(signedUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Échec du chargement du document signé');
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setSvgContent(text);
          setIsDocumentLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsDocumentLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [signedUrl]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(175, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(75, z - 25));
  const handleResetZoom = () => setZoomLevel(100);

  const currentPageBboxes = boundingBoxes.filter((b) => b.page === currentPage);

  const handleBboxClick = (bbox: BoundingBox) => {
    setSelectedBbox(bbox);
    if (onSelectBbox) {
      onSelectBbox(bbox);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 overflow-hidden shadow-xs',
        className,
      )}
    >
      {/* Barre d'outils supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 text-xs dark:bg-slate-900 dark:border-slate-800">
        {/* Titre et statut */}
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
            {documentTitle}
          </span>
          <BlindBadge folder={folderReference} compact isActive={isAnonymized} />
        </div>

        {/* Contrôles de navigation et de zoom */}
        <div className="flex items-center gap-3">
          {/* Indicateur d'URL signée (60s) */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border',
              ttlSeconds <= 10
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
            )}
            title="URL signée sécurisée régénérée automatiquement toutes les 60 secondes"
          >
            <Lock className="h-2.5 w-2.5" />
            <span>URL signée : {ttlSeconds}s</span>
          </div>

          {/* Commutateur mode aveugle du viewer (ou indicateur verrouillé) */}
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border',
              isAnonymized
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {isAnonymized ? (
              <>
                <EyeOff className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                <span>Version caviardée</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Original dérogatoire</span>
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="font-mono px-2 text-slate-600 dark:text-slate-400 text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={zoomLevel <= 75}
              onClick={handleZoomOut}
              aria-label="Zoom arrière"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={handleResetZoom}
              className="font-mono text-xs px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Réinitialiser le zoom à 100%"
            >
              {zoomLevel}%
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={zoomLevel >= 175}
              onClick={handleZoomIn}
              aria-label="Zoom avant"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bandeau d'avertissement quand le mode anonymisé est actif */}
      {isAnonymized && (
        <div className="bg-amber-500 text-amber-950 font-bold px-4 py-1.5 text-[11px] flex items-center justify-between dark:bg-amber-600 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>
              Document conforme TalentLens : Les métadonnées, photos et PII nominatives ont été caviardées par le serveur.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-amber-600/50 px-1.5 py-0.5 rounded dark:bg-amber-700/60">
            Art. 25 RGPD
          </span>
        </div>
      )}

      {/* État d'erreur de chargement */}
      {hasLoadError && (
        <div className="p-4 m-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Échec du chargement du document signé. L'URL a peut-être expiré.</span>
          </div>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 gap-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Réessayer</span>
            </Button>
          )}
        </div>
      )}

      {/* Espace de visualisation du document */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start min-h-[500px]">
        {isDocumentLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs">Chargement sécurisé du document...</span>
          </div>
        ) : svgContent ? (
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative w-[595px] h-[842px] bg-white text-slate-900 shadow-xl rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 select-none overflow-hidden"
          >
            {/* Rendu dynamique du SVG reçu via l'URL signée du serveur */}
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />

            {/* Superposition des Bounding Boxes interactives */}
            {currentPageBboxes.map((bbox) => {
              const isSelected = selectedBbox?.id === bbox.id || activeBboxId === bbox.id || activeBboxId === bbox.fieldKey;

              return (
                <div
                  key={bbox.id}
                  onClick={() => handleBboxClick(bbox)}
                  style={{
                    left: `${bbox.x}%`,
                    top: `${bbox.y}%`,
                    width: `${bbox.width}%`,
                    height: `${bbox.height}%`,
                  }}
                  className={cn(
                    'absolute z-10 cursor-pointer rounded border-2 transition-all',
                    isSelected
                      ? 'ring-4 ring-indigo-500 border-indigo-600 bg-indigo-500/20 animate-pulse'
                      : bbox.category?.startsWith('pii')
                      ? 'border-amber-500 bg-amber-200/40 hover:bg-amber-300/50'
                      : 'border-indigo-400 bg-indigo-100/30 hover:bg-indigo-200/40',
                  )}
                  title={`${bbox.label} (Cliquer pour sélectionner le champ)`}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-bold shadow-xs absolute -top-4 left-0 truncate max-w-full',
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : bbox.category?.startsWith('pii')
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-white',
                    )}
                  >
                    {bbox.category?.startsWith('pii') && <Lock className="h-2 w-2 shrink-0" />}
                    <span>{bbox.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Affichage standard vectoriel simulé */
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative w-[595px] h-[842px] bg-white text-slate-900 shadow-xl rounded-md p-10 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-sans select-none"
          >
            {currentPage === 1 ? (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                        {candidatePseudonym || 'CANDIDAT #DE-2026'}
                      </h1>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">
                        Architecte &amp; Ingénieur Data Senior
                      </p>
                      <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                        <div>***@***.*** · +33 * ** ** **</div>
                        <div>Région Île-de-France · Mobilité Hybride</div>
                      </div>
                    </div>
                    <div className="h-20 w-20 rounded-lg border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 dark:bg-slate-800 dark:border-slate-700">
                      <EyeOff className="h-6 w-6 text-amber-600" />
                      <span className="text-[9px] mt-1 text-slate-400 font-mono">CAVIARDÉ</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Profil &amp; Compétences Clés
                  </h2>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Ingénieur expert en architectures analytiques distribuées (Snowflake, Apache Kafka, GCP BigQuery, Terraform).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Formations &amp; Certifications
                </h2>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">Diplôme d'Ingénieur Informatique &amp; Big Data</span>
                    <span className="font-mono text-slate-400">2016</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bounding boxes */}
            {currentPageBboxes.map((bbox) => (
              <div
                key={bbox.id}
                onClick={() => handleBboxClick(bbox)}
                style={{
                  left: `${bbox.x}%`,
                  top: `${bbox.y}%`,
                  width: `${bbox.width}%`,
                  height: `${bbox.height}%`,
                }}
                className={cn(
                  'absolute z-10 cursor-pointer rounded border-2 transition-all',
                  selectedBbox?.id === bbox.id || activeBboxId === bbox.id
                    ? 'ring-4 ring-indigo-500 border-indigo-600 bg-indigo-500/20'
                    : 'border-amber-500 bg-amber-200/40 hover:bg-amber-300/50',
                )}
              >
                <div className="flex items-center gap-1 px-1 py-0.5 bg-amber-600 text-white rounded text-[8px] font-bold shadow-xs">
                  <Lock className="h-2 w-2" />
                  <span>{bbox.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
