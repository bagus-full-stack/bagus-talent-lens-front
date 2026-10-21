'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* =========================================================================
   1. FormField accessible (React Hook Form + Zod)
   ========================================================================= */

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          {label}
          {required && (
            <span className="text-red-600 dark:text-red-400 ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>, {
              id,
              'aria-invalid': Boolean(error),
              'aria-describedby': error ? errorId : hint ? hintId : undefined,
            })
          : children}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-[11px] text-slate-500">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in-50"
        >
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/* =========================================================================
   2. Toaster & Système de Toast Notification
   ========================================================================= */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToast: ToastContextType['toast'] | null = null;

export const toast = {
  success: (title: string, message?: string) => {
    if (globalToast) return globalToast.success(title, message);
    return '';
  },
  error: (title: string, message?: string) => {
    if (globalToast) return globalToast.error(title, message);
    return '';
  },
  warning: (title: string, message?: string) => {
    if (globalToast) return globalToast.warning(title, message);
    return '';
  },
  info: (title: string, message?: string) => {
    if (globalToast) return globalToast.info(title, message);
    return '';
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastItem: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duration = toastItem.durationMs ?? 5000;

      setToasts((prev) => [...prev, { ...toastItem, id }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast],
  );

  const toastMethods = useMemo(
    () => ({
      success: (title: string, message?: string) =>
        addToast({ type: 'success', title, message }),
      error: (title: string, message?: string) =>
        addToast({ type: 'error', title, message, durationMs: 7000 }),
      warning: (title: string, message?: string) =>
        addToast({ type: 'warning', title, message }),
      info: (title: string, message?: string) =>
        addToast({ type: 'info', title, message }),
    }),
    [addToast],
  );

  useEffect(() => {
    globalToast = toastMethods;
  }, [toastMethods]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé au sein d’un <ToastProvider>');
  }
  return context;
}

export function Toaster() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;
  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles: Record<ToastType, { border: string; bg: string; text: string; iconColor: string }> = {
    success: {
      border: 'border-emerald-300 dark:border-emerald-800',
      bg: 'bg-emerald-50 dark:bg-emerald-950/90',
      text: 'text-emerald-950 dark:text-emerald-100',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      border: 'border-rose-300 dark:border-rose-800',
      bg: 'bg-rose-50 dark:bg-rose-950/90',
      text: 'text-rose-950 dark:text-rose-100',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-800',
      bg: 'bg-amber-50 dark:bg-amber-950/90',
      text: 'text-amber-950 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      border: 'border-indigo-300 dark:border-indigo-800',
      bg: 'bg-indigo-50 dark:bg-indigo-950/90',
      text: 'text-indigo-950 dark:text-indigo-100',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none"
      aria-live="polite"
      role="region"
      aria-label="Zone des notifications"
    >
      {toasts.map((item) => {
        const Icon = icons[item.type];
        const style = styles[item.type];

        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-2',
              style.bg,
              style.border,
              style.text,
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.iconColor)} aria-hidden="true" />

            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold leading-tight">{item.title}</div>
              {item.message && (
                <div className="mt-1 opacity-90 leading-relaxed font-normal">{item.message}</div>
              )}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fermer la notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
