'use client';

import React from 'react';
import { EyeOff, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlindModeBadgeProps {
  className?: string;
  compact?: boolean;
}

export function BlindModeBadge({ className, compact = false }: BlindModeBadgeProps) {
  return (
    <div
      role="status"
      aria-label="Mode aveugle actif : données à caractère personnel caviardées par le serveur"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-xs transition-colors hover:bg-amber-100/80 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200',
        className,
      )}
    >
      <EyeOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
      <span className="tracking-wide uppercase text-[11px] font-bold">
        {compact ? 'Mode aveugle actif' : 'Mode aveugle actif (PII caviardées)'}
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
    </div>
  );
}
