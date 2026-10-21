'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  X,
  Inbox,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /**
   * Clé optionnelle pour identifier les lignes (par défaut 'id')
   */
  getRowId?: (row: TData, index: number) => string;
  /**
   * Placeholder du champ de recherche global
   */
  searchPlaceholder?: string;
  /**
   * Nom de la colonne à filtrer par texte (si non spécifié, filtre sur toute la ligne)
   */
  filterColumnKey?: string;
  /**
   * État de chargement (affiche un squelette animé)
   */
  isLoading?: boolean;
  /**
   * Actions groupées lorsque des lignes sont sélectionnées
   */
  renderBulkActions?: (selectedRows: TData[], resetSelection: () => void) => React.ReactNode;
  /**
   * Message pour l'état vide
   */
  emptyMessage?: string;
  emptyTitle?: string;
  /**
   * Nombre de lignes par page par défaut
   */
  pageSize?: number;
  /**
   * Mode compact
   */
  compact?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  searchPlaceholder = 'Rechercher dans la liste...',
  filterColumnKey,
  isLoading = false,
  renderBulkActions,
  emptyTitle = 'Aucun élément trouvé',
  emptyMessage = 'Aucune donnée ne correspond aux critères sélectionnés.',
  pageSize = 10,
  compact = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const tableData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Barre d'outils supérieure : recherche + actions groupées */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input
            placeholder={searchPlaceholder}
            value={
              filterColumnKey
                ? ((table.getColumn(filterColumnKey)?.getFilterValue() as string) ?? '')
                : globalFilter
            }
            onChange={(e) => {
              if (filterColumnKey) {
                table.getColumn(filterColumnKey)?.setFilterValue(e.target.value);
              } else {
                setGlobalFilter(e.target.value);
              }
            }}
            className="pl-9 h-9 text-xs"
            aria-label="Champ de filtre du tableau"
          />
          {Boolean(globalFilter || (filterColumnKey && table.getColumn(filterColumnKey)?.getFilterValue())) && (
            <button
              onClick={() => {
                setGlobalFilter('');
                if (filterColumnKey) {
                  table.getColumn(filterColumnKey)?.setFilterValue('');
                }
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Effacer le filtre"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Barre d'actions groupées */}
        {hasSelection && renderBulkActions && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-md px-3 py-1 text-xs text-indigo-950 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-200 animate-in fade-in slide-in-from-top-1">
            <span className="font-semibold tabular-nums">
              {selectedRows.length} sélectionné{selectedRows.length > 1 ? 's' : ''}
            </span>
            <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800 mx-1" />
            {renderBulkActions(selectedRows, () => table.resetRowSelection())}
          </div>
        )}
      </div>

      {/* Conteneur de tableau avec défilement horizontal et bordures */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* En-tête de colonnes avec tri */}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={cn(
                          'px-3.5 py-3 font-semibold uppercase tracking-wider text-[11px] select-none',
                          canSort && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                          compact && 'py-2 px-2.5',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-slate-400">
                              {isSorted === 'asc' ? (
                                <ArrowUp className="h-3 w-3 text-indigo-600" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown className="h-3 w-3 text-indigo-600" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Corps du tableau */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                // Squelettes de chargement
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`loading-skeleton-${rIdx}`} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={`skeleton-cell-${cIdx}`} className="px-3.5 py-3.5">
                        <div className="h-4 bg-slate-200 rounded dark:bg-slate-800 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isSelected = row.getIsSelected();
                  return (
                    <tr
                      key={row.id}
                      data-state={isSelected ? 'selected' : undefined}
                      className={cn(
                        'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
                        isSelected && 'bg-indigo-50/60 dark:bg-indigo-950/40 font-medium',
                        compact && 'text-[11px]',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn('px-3.5 py-3 text-slate-800 dark:text-slate-200', compact && 'py-2 px-2.5')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                // État vide
                <tr>
                  <td colSpan={columns.length} className="h-44 text-center p-6">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Inbox className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{emptyTitle}</p>
                      <p className="text-xs max-w-sm text-slate-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau : pagination & indicateurs de lignes */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span>
              Ligne{table.getFilteredRowModel().rows.length > 1 ? 's' : ''} :{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {table.getFilteredRowModel().rows.length}
              </strong>
            </span>
            {hasSelection && (
              <span className="text-indigo-600 font-semibold font-mono">
                ({selectedRows.length} sélectionnée{selectedRows.length > 1 ? 's' : ''})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Page</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                {table.getState().pagination.pageIndex + 1}
              </strong>
              <span>sur</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                {Math.max(1, table.getPageCount())}
              </strong>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Première page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Dernière page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
