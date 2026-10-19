import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF6F2] dark:bg-[#121212] p-6 text-center text-[#2D241E] dark:text-[#F3EFEA]">
          <div className="max-w-md p-8 rounded-3xl bg-white/80 dark:bg-[#1E1E1E] shadow-xl border border-black/5 dark:border-white/10 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFD60A] text-[#111111] font-black text-xl flex items-center justify-center">
              !
            </div>
            <h2 className="text-xl font-extrabold">Une erreur est survenue</h2>
            <p className="text-sm opacity-80">
              L&apos;application a rencontré un problème inattendu lors du chargement.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-black/5 dark:bg-black/40 p-3 rounded-xl overflow-x-auto text-red-500 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                window.location.hash = '#/';
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-full bg-[#FFD60A] text-[#111111] font-bold text-sm shadow-md cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            >
              Recharger l&apos;application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
