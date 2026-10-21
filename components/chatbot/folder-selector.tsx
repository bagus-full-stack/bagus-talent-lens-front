'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Folder, Check, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockFolders } from '@/lib/mock/data/folders';

interface FolderSelectorProps {
  selectedFolderIds: string[];
  onChange: (folderIds: string[]) => void;
}

export function FolderSelector({ selectedFolderIds, onChange }: FolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAll = selectedFolderIds.length === 0 || selectedFolderIds.length === mockFolders.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (id: string) => {
    if (selectedFolderIds.includes(id)) {
      const next = selectedFolderIds.filter((f) => f !== id);
      onChange(next);
    } else {
      onChange([...selectedFolderIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const activeLabel = isAll
    ? `Tous les dossiers (${mockFolders.length})`
    : selectedFolderIds.length === 1
    ? mockFolders.find((f) => f.id === selectedFolderIds[0])?.reference || '1 dossier'
    : `${selectedFolderIds.length} dossiers`;

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={containerRef} data-testid="folder-selector">
      <span className="text-xs text-slate-500 font-medium hidden sm:inline">Périmètre :</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs gap-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-medium"
        aria-expanded={isOpen}
      >
        <Folder className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="truncate max-w-[150px]">{activeLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1.5 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Dossiers interrogés</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-normal"
            >
              Tout cocher
            </button>
          </div>

          <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isAll ? (
                  <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Tous les dossiers
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Global</span>
            </button>

            {mockFolders.map((folder) => {
              const isChecked = !isAll && selectedFolderIds.includes(folder.id);
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleToggle(folder.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {folder.reference}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {folder.totalCandidates} profils
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-5 truncate w-full">
                    {folder.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
