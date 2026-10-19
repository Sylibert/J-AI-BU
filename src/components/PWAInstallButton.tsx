import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        aria-label="Installer l'application"
        title="Installer sur l'écran d'accueil"
        className="w-[44px] h-[44px] rounded-full bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[var(--text-main)] flex items-center justify-center shadow-[var(--shadow-btn)] active:scale-90 transition-transform cursor-pointer"
      >
        <Download className="w-[18px] h-[18px] stroke-[2.2]" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        aria-label="Installer sur iOS"
        title="Ajouter sur l'écran d'accueil"
        className="w-[44px] h-[44px] rounded-full bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[var(--text-main)] flex items-center justify-center shadow-[var(--shadow-btn)] active:scale-90 transition-transform cursor-pointer"
      >
        <Download className="w-[18px] h-[18px] stroke-[2.2]" />
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-[28px] bg-[var(--card-bg)] p-6 shadow-2xl border border-[var(--border-subtle)] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD60A] flex items-center justify-center font-extrabold text-xs tracking-tight text-[#111111]">
                  GBU
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-[var(--text-main)] leading-tight">
                    Installer GBU
                  </h3>
                  <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                    {isIOS ? 'Safari sur iPhone / iPad' : "Ajout à l'écran d'accueil"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full bg-[var(--card-subtle)] flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

            <div className="space-y-3 text-[13px] font-semibold text-[var(--text-main)]/85 bg-[var(--card-subtle)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--card-bg)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] shadow-2xs shrink-0">
                  <Share className="w-3.5 h-3.5 stroke-[2.3]" />
                </span>
                <span>
                  1. Touchez le bouton <strong className="text-[var(--text-main)]">Partager</strong> dans la barre de Safari.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[var(--card-bg)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] shadow-2xs shrink-0">
                  <PlusSquare className="w-3.5 h-3.5 stroke-[2.3]" />
                </span>
                <span>
                  2. Sélectionnez <strong className="text-[var(--text-main)]">Sur l&apos;écran d&apos;accueil</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full h-11 rounded-2xl bg-[#FFD60A] text-[13px] font-extrabold uppercase tracking-wider text-[#111111] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
