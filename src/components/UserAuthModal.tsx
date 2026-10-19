import React, { useState } from 'react';
import { User as UserIcon, LogOut, X, Cloud, CloudCheck, Loader2 } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface UserAuthModalProps {
  authHook: ReturnType<typeof useFirebaseAuth>;
  datesCount: number;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ authHook, datesCount }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user, isLoading, isSyncing, syncError, loginWithGoogle, logout } = authHook;

  const handleLogin = async () => {
    const ok = await loginWithGoogle();
    if (ok) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton Compte dans l'en-tête */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={user ? `Compte (${user.displayName || user.email})` : 'Connexion compte Google'}
        title={user ? 'Mon compte' : 'Se connecter'}
        className="relative w-[44px] h-[44px] rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] flex items-center justify-center cursor-pointer shadow-[var(--shadow-btn)] active:scale-90 transition-transform overflow-hidden"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Photo de profil'}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <UserIcon className="w-[19px] h-[19px] stroke-[2.0] text-[var(--text-main)] opacity-75" />
        )}

        {/* Indicateur de synchronisation cloud */}
        {user && (
          <span className="absolute bottom-[2px] right-[2px] w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--card-bg)]" />
        )}
      </button>

      {/* Modal d'authentification */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-[28px] bg-[var(--card-bg)] p-6 shadow-2xl border border-[var(--border-subtle)] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD60A] flex items-center justify-center text-[#111111]">
                  <Cloud className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[var(--text-main)] leading-tight">
                    {user ? 'Compte Cloud' : 'Synchronisation'}
                  </h3>
                  <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                    {user ? 'Sauvegarde multi-appareils active' : 'Retrouvez votre historique partout'}
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

            {/* Contenu selon connexion */}
            {user ? (
              <div className="space-y-4">
                {/* Profil utilisateur connecté */}
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--card-subtle)] border border-[var(--border-subtle)]">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Photo'}
                      className="w-12 h-12 rounded-full border border-[var(--border-subtle)] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FFD60A] text-[#111111] font-bold flex items-center justify-center text-lg">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[var(--text-main)] truncate">
                      {user.displayName || 'Utilisateur'}
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* État de synchronisation */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold">
                  <div className="flex items-center gap-2">
                    <CloudCheck className="w-4 h-4 stroke-[2.4]" />
                    <span>Synchronisé avec Google</span>
                  </div>
                  <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20">
                    {datesCount} jour{datesCount > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-[12px] font-medium leading-relaxed text-[var(--text-main)]/75 px-1">
                  Vos dates sont automatiquement enregistrées sur votre compte Firebase. Si vous changez de téléphone ou ouvrez l’application sur un autre écran, connectez-vous avec ce même compte pour tout retrouver.
                </p>

                {/* Bouton de déconnexion */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-11 rounded-2xl bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-[13px] font-bold text-rose-500 dark:text-rose-400 flex items-center justify-center gap-2 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer shadow-2xs mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13px] font-medium leading-relaxed text-[var(--text-main)]/80">
                  Connectez-vous avec votre compte Google pour sauvegarder votre historique dans le cloud. Vos données seront automatiquement restaurées si vous changez de téléphone ou visitez l’application depuis un autre appareil.
                </p>

                {syncError && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[12px] font-medium">
                    {syncError}
                  </div>
                )}

                {/* Bouton Google Sign-In */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isSyncing}
                  className="w-full h-12 rounded-2xl bg-white text-[#111111] border border-black/15 flex items-center justify-center gap-3 font-bold text-[14px] shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSyncing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#111111]" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continuer avec Google</span>
                </button>

                <p className="text-[11px] text-center font-medium text-[var(--text-muted)]">
                  Sans compte, vos données restent stockées localement sur ce navigateur.
                </p>
              </div>
            )}

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
