'use client';

import React, { Component, type ReactNode } from 'react';
import { ErrorState } from '@/components/shared/feedback-states';

interface Props {
  children: ReactNode;
  title?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class BlockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ne pas exposer d'informations sensibles
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-900/40 bg-slate-900/80 p-4">
          <ErrorState
            title={this.props.title || 'Bloc temporairement indisponible'}
            message={
              this.state.error?.message ||
              this.props.fallbackMessage ||
              'Une anomalie est survenue lors de l’affichage de cette section.'
            }
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
