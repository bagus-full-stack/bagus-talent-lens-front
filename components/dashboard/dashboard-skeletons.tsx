import React from 'react';

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-800 rounded-md" />
            <div className="h-8 w-8 bg-slate-800 rounded-xl" />
          </div>
          <div className="h-8 w-20 bg-slate-800 rounded-md" />
          <div className="h-3 w-36 bg-slate-800/60 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function ActionsRequiredSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-40 bg-slate-800 rounded-md" />
        <div className="h-4 w-16 bg-slate-800 rounded-md" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-slate-850/40 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-48 bg-slate-800 rounded-md" />
              <div className="h-4 w-20 bg-slate-800 rounded-md" />
            </div>
            <div className="h-3 w-64 bg-slate-800/60 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentFoldersSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-36 bg-slate-800 rounded-md" />
        <div className="h-4 w-20 bg-slate-800 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-850/40 space-y-2.5">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-800 rounded-md" />
              <div className="h-4 w-16 bg-slate-800 rounded-md" />
            </div>
            <div className="h-4 w-40 bg-slate-800 rounded-md" />
            <div className="h-3 w-32 bg-slate-800/60 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PipelineChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-48 bg-slate-800 rounded-md" />
        <div className="h-4 w-24 bg-slate-800 rounded-md" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
        {[40, 75, 50, 30, 20, 15].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-slate-800 rounded-t-md"
              style={{ height: `${h}%` }}
            />
            <div className="h-3 w-10 bg-slate-800/60 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-36 bg-slate-800 rounded-md" />
        <div className="h-4 w-16 bg-slate-800 rounded-md" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl">
            <div className="h-8 w-8 rounded-lg bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-44 bg-slate-800 rounded-md" />
              <div className="h-3 w-60 bg-slate-800/60 rounded-md" />
            </div>
            <div className="h-3 w-16 bg-slate-800/40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiConsumptionSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-44 bg-slate-800 rounded-md" />
        <div className="h-4 w-20 bg-slate-800 rounded-md" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-slate-800 rounded-full" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 rounded-xl bg-slate-800/50" />
          <div className="h-16 rounded-xl bg-slate-800/50" />
        </div>
      </div>
    </div>
  );
}
