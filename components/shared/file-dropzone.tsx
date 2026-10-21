'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface FileDropzoneProps {
  onFilesSelected?: (files: File[]) => void;
  acceptedFileTypes?: string[]; // Par défaut: ['.pdf', '.docx']
  maxFileSizeMb?: number; // Par défaut: 10 Mo
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  acceptedFileTypes = ['.pdf', '.docx', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSizeMb = 10,
  maxFiles = 5,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [filesList, setFilesList] = useState<UploadedFileItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxFileSizeMb * 1024 * 1024;

  const validateAndAddFiles = useCallback(
    (incomingFiles: FileList | File[]) => {
      setErrorMessage(null);
      const newItems: UploadedFileItem[] = [];
      const validFiles: File[] = [];

      Array.from(incomingFiles).forEach((file) => {
        // Vérification de la taille
        if (file.size > maxSizeBytes) {
          setErrorMessage(
            `Le fichier « ${file.name} » dépasse la taille maximale autorisée de ${maxFileSizeMb} Mo.`,
          );
          return;
        }

        // Vérification de l'extension
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isValidExt =
          acceptedFileTypes.includes(ext) ||
          acceptedFileTypes.includes(file.type) ||
          (file.type === 'application/pdf' && ext === '.pdf') ||
          (ext === '.docx' || ext === '.pdf');

        if (!isValidExt) {
          setErrorMessage(
            `Format non supporté pour « ${file.name} ». Formats acceptés : PDF et DOCX.`,
          );
          return;
        }

        const item: UploadedFileItem = {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          name: file.name,
          size: file.size,
          status: 'success',
          progress: 100,
        };

        newItems.push(item);
        validFiles.push(file);
      });

      if (newItems.length > 0) {
        setFilesList((prev) => [...prev, ...newItems].slice(0, maxFiles));
        if (onFilesSelected) {
          onFilesSelected(validFiles);
        }
      }
    },
    [maxSizeBytes, maxFileSizeMb, acceptedFileTypes, maxFiles, onFilesSelected],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const removeFile = (id: string) => {
    setFilesList((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Zone de drop accessible au clavier */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Zone de dépôt de documents CV. Appuyez sur Entrée pour parcourir vos fichiers."
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-200 select-none cursor-pointer',
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01] dark:bg-indigo-950/40 dark:border-indigo-400'
            : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60',
          disabled && 'opacity-50 cursor-not-allowed hover:border-slate-300 hover:bg-white',
          'focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) validateAndAddFiles(e.target.files);
          }}
          className="hidden"
          aria-hidden="true"
        />

        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Glissez-déposez vos CV ici, ou{' '}
          <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">
            parcourez vos dossiers
          </span>
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Formats acceptés : PDF ou DOCX (Taille maximale : {maxFileSizeMb} Mo par document)
        </p>

        {/* Mention de garantie éthique et RGPD */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Garantie RGPD : Détection PII automatique côté serveur. Métadonnées invisibles purgées.</span>
        </div>
      </div>

      {/* Message d'erreur de validation */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Liste des fichiers sélectionnés */}
      {filesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Fichiers prêts pour l'analyse ({filesList.length})</span>
            <button
              onClick={() => setFilesList([])}
              className="text-indigo-600 hover:text-indigo-800 text-xs"
            >
              Tout vider
            </button>
          </div>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {filesList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 text-xs text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 dark:bg-slate-800">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(item.size)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Prêt</span>
                  </span>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    aria-label={`Supprimer ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
