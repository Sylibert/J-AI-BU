import React, { useState } from 'react';
import { Bell, BellRing, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useHydrationReminder } from '../hooks/useHydrationReminder';

interface NotificationReminderModalProps {
  reminder: ReturnType<typeof useHydrationReminder>;
}

export const NotificationReminderModal: React.FC<NotificationReminderModalProps> = ({ reminder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { isSupported, permission, isEnabled, toggleReminder, testNotification, reminderHour } = reminder;

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const ok = await testNotification();
    setIsTesting(false);
    if (ok) {
      setTestStatus('Notification test envoyée avec succès !');
    } else {
      setTestStatus('Impossible d’envoyer la notification. Vérifiez les autorisations.');
    }
  };

  const handleToggle = async () => {
    await toggleReminder();
  };

  return (
    <>
      {/* Bouton Cloche dans l'en-tête */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Configurer les rappels d’hydratation"
        title="Rappel à 20h"
        className="relative w-[44px] h-[44px] rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] flex items-center justify-center cursor-pointer shadow-[var(--shadow-btn)] active:scale-90 transition-transform"
      >
        {isEnabled ? (
          <BellRing className="w-[19px] h-[19px] stroke-[2.2] text-[#FFD60A]" />
        ) : (
          <Bell className="w-[19px] h-[19px] stroke-[2.0] text-[var(--text-main)] opacity-75" />
        )}

        {/* Indicateur discret si activé */}
        {isEnabled && (
          <span className="absolute top-[10px] right-[10px] w-2 h-2 rounded-full bg-[#FFD60A] ring-1 ring-[var(--card-bg)]" />
        )}
      </button>

      {/* Modal de configuration */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-[28px] bg-[var(--card-bg)] p-6 shadow-2xl border border-[var(--border-subtle)] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Titre et fermeture */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD60A] flex items-center justify-center text-[#111111]">
                  <Bell className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[var(--text-main)] leading-tight">
                    Rappels locaux
                  </h3>
                  <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                    Notification quotidienne à {reminderHour}h00
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full bg-[var(--card-subtle)] flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="space-y-4">
              {/* Carte Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--card-subtle)] border border-[var(--border-subtle)]">
                <div className="pr-3">
                  <div className="text-[14px] font-bold text-[var(--text-main)]">
                    Rappeler si non validé
                  </div>
                  <div className="text-[12px] font-semibold text-[var(--text-muted)] mt-0.5">
                    Chaque soir à {reminderHour}h00
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggle}
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label="Activer ou désactiver le rappel de 20h"
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-[#FFD60A]' : 'bg-[var(--border-subtle)] dark:bg-white/10'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Explication */}
              <p className="text-[12px] font-medium leading-relaxed text-[var(--text-main)]/75 px-1">
                Si vous n’avez pas encore appuyé sur le bouton pour consigner votre hydratation du jour après 20h, une notification locale vous est envoyée directement via le <strong>Service Worker</strong> de votre application.
              </p>

              {/* Statut permission & alertes */}
              {permission === 'denied' && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[12px] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Les notifications sont bloquées dans votre navigateur. Activez-les dans les paramètres de votre appareil pour recevoir le rappel de 20h.
                  </div>
                </div>
              )}

              {!isSupported && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-[12px] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Sur iPhone / iPad, ajoutez l’application sur votre <strong>écran d’accueil</strong> (Safari) pour pouvoir recevoir les notifications locales.
                  </div>
                </div>
              )}

              {/* Bouton de Test */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="w-full h-11 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[13px] font-bold text-[var(--text-main)] flex items-center justify-center gap-2 hover:bg-[var(--card-subtle)] active:scale-[0.98] transition-all cursor-pointer shadow-2xs disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-[#FFD60A] fill-[#FFD60A]" />
                  <span>{isTesting ? 'Envoi du test...' : 'Tester la notification'}</span>
                </button>

                {testStatus && (
                  <p className="mt-2 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{testStatus}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full h-11 rounded-2xl bg-[#111111] dark:bg-[#F4F5F7] text-[13px] font-extrabold uppercase tracking-wider text-white dark:text-[#111111] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
