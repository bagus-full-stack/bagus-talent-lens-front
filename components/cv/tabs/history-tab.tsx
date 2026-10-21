'use client';

import React from 'react';
import {
  History,
  Clock,
  Sparkles,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  FileText,
} from 'lucide-react';
import type { CandidateCvDetail, CvHistoryEvent } from '@/types';
import { cn } from '@/lib/utils';

export function HistoryTab({ candidate }: { candidate: CandidateCvDetail }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'EXTRACTION_COMPLETE':
        return <Sparkles className="h-4 w-4 text-indigo-600" />;
      case 'EXTRACTION_VALIDATED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'FIELD_CORRECTED':
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'FIELD_VALIDATED':
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
      case 'STAGE_CHANGED':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'UNMASK_PERFORMED':
        return <ShieldCheck className="h-4 w-4 text-amber-600" />;
      case 'RGPD_RESTRICTION_ENABLED':
      case 'RGPD_RESTRICTION_LIFTED':
        return <ShieldAlert className="h-4 w-4 text-rose-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Empreinte cryptographique RFC 3161 */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Scellement Cryptographique RFC 3161</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">WORM Immuable</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono break-all bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
          {candidate.hashId}
        </p>
      </div>

      {/* Timeline d'audit */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          <span>Journal d’Audit &amp; Traçabilité ({candidate.history.length})</span>
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {candidate.history.map((event) => (
            <div key={event.id} className="relative group">
              {/* Point de timeline avec icône */}
              <div className="absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                {getActionIcon(event.action)}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {event.action}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {event.details}
                </p>

                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                  <span>Auteur :</span>
                  <strong className="text-slate-600 dark:text-slate-300 font-semibold">{event.actorName}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
