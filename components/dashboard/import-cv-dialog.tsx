'use client';

import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportModal } from '@/components/import/import-modal';

interface ImportCvDialogProps {
  buttonText?: string;
  variant?: 'default' | 'outline';
  className?: string;
  folderId?: string;
}

export function ImportCvDialog({
  buttonText = 'Importer des CV',
  variant = 'default',
  className,
  folderId,
}: ImportCvDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={`gap-2 text-xs font-semibold shadow-sm ${
          variant === 'default'
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'border-slate-700 text-slate-200 hover:bg-slate-800'
        } ${className || ''}`}
      >
        <UploadCloud className="h-4 w-4" />
        <span>{buttonText}</span>
      </Button>

      <ImportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        folderId={folderId}
      />
    </>
  );
}
