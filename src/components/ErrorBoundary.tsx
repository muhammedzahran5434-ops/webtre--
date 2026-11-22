import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readableMessage = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        readableMessage = `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path || 'database'})`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, errorMessage: readableMessage };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('WebTrex ErrorBoundary caught error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080D1A] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0E1629] border border-white/10 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
