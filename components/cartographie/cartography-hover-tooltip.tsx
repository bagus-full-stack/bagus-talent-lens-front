'use client';

import React from 'react';
import type { CartographyPoint } from '@/lib/schemas/cartographie';
import { ShieldCheck, Sparkles, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CartographyHoverTooltipProps {
  point: CartographyPoint | null;
}

export function CartographyHoverTooltip({ point }: CartographyHoverTooltipProps) {
  if (!point) return null;

  return (
    <div
      data-testid="cartography-hover-tooltip"
      className="absolute top-4 right-4 z-30 w-72 bg-slate-900/95 text-white rounded-lg shadow-2xl p-3 border border-slate-700 backdrop-blur-md pointer-events-none text-xs space-y-2 animate-in fade-in duration-100"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        {/* Identité selon DTO (Strictement pseudonymisée en mode aveugle) */}
        <span
          data-testid="tooltip-pseudonym"
          className="font-bold text-indigo-300 font-mono text-sm"
        >
          {point.pseudonym}
        </span>
        <Badge
          variant="outline"
          className="text-[10px] text-slate-300 border-slate-700 bg-slate-800"
        >
          {point.folderReference}
        </Badge>
      </div>

      <div>
        <p className="font-semibold text-slate-100 truncate" data-testid="tooltip-title">
          {point.currentTitle}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {point.yearsExperience} ans d'expérience • {point.clusterName}
        </p>
      </div>

      {/* 3 compétences */}
      <div className="space-y-1 pt-1 border-t border-slate-800/80">
        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
          Compétences clés
        </span>
        <div className="flex flex-wrap gap-1" data-testid="tooltip-skills">
          {point.topSkills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[10px] px-1.5 py-0.5 rounded font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="h-2.5 w-2.5" /> Mode aveugle vérifié
        </span>
        <span className="italic">Cliquer pour le tiroir</span>
      </div>
    </div>
  );
}
