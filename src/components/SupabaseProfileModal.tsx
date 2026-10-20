import React, { useState, useEffect } from 'react';
import { Users, X, Copy, Check, Sparkles, UserCheck } from 'lucide-react';
import { UseSupabaseGroupReturn } from '../hooks/useSupabaseGroup';

interface SupabaseProfileModalProps {
  supabaseGroup: UseSupabaseGroupReturn;
  onTriggerHaptic?: (pattern?: number | number[]) => void;
}

export function SupabaseProfileModal({
  supabaseGroup,
  onTriggerHaptic,
}: SupabaseProfileModalProps) {
  const {
    userName,
    groupId,
    isConfigured,
    isModalOpen,
    setIsModalOpen,
    saveProfileAndGroup,
    getInviteLink,
    members,
  } = supabaseGroup;

  const [nameInput, setNameInput] = useState(userName);
  const [groupInput, setGroupInput] = useState(groupId || 'les-potes');
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      setNameInput(userName);
      setGroupInput(groupId || 'les-potes');
      setFormError(null);
    }
  }, [isModalOpen, userName, groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanGroup = groupInput.trim();

    if (!cleanName) {
      setFormError('Veuillez entrer votre prénom ou pseudo.');
      return;
    }
    if (!cleanGroup) {
      setFormError('Veuillez entrer un nom de groupe.');
      return;
    }

    onTriggerHaptic?.([10, 20]);
    await saveProfileAndGroup(cleanName, cleanGroup);
  };

  const handleCopyInvite = async () => {
    const targetGroup = groupInput.trim() || groupId || 'les-potes';
    const link = getInviteLink(targetGroup);
    if (!link) return;

    onTriggerHaptic?.(10);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <>
      {/* Bouton discret dans l'en-tête */}
      <button
        type="button"
        onClick={() => {
          onTriggerHaptic?.(10);
          setIsModalOpen(true);
        }}
        aria-label="Profil et groupe d'amis"
        title={
          isConfigured
            ? `${userName} · Groupe #${groupId}`
            : 'Rejoindre un groupe avec vos potes'
        }
        className={`spring-icon-btn relative w-[36px] h-[36px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${
          isConfigured
            ? 'bg-[#FFD60A]/20 text-[var(--text-main)] border border-[#FFD60A]/60'
            : 'bg-[var(--card-subtle)] text-[var(--text-main)] hover:bg-[var(--btn-hover)]'
        }`}
      >
        {isConfigured ? (
          <span className="text-[12px] font-extrabold uppercase tracking-tight">
            {userName.trim().slice(0, 2)}
          </span>
        ) : (
          <Users className="w-[17px] h-[17px] stroke-[2.2]" />
        )}
      </button>

      {/* Modale de configuration Profil & Groupe */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-[28px] bg-[var(--card-bg)] border border-[var(--border-subtle)] p-6 shadow-2xl text-[var(--text-main)] relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#FFD60A] text-[#111111] flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold leading-tight">
                    Mon Cercle de Potes
                  </h2>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Synchronisation simple et sans mot de passe
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="gbu-user-name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
                >
                  Ton prénom ou pseudo
                </label>
                <input
                  id="gbu-user-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex : Alex"
                  maxLength={24}
                  autoFocus={!userName}
                  className="w-full h-[46px] px-4 rounded-[16px] bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-[14px] font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[#FFD60A] transition-colors select-text"
                />
              </div>

              <div>
                <label
                  htmlFor="gbu-group-id"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
                >
                  Nom du groupe (code d&apos;équipe)
                </label>
                <input
                  id="gbu-group-id"
                  type="text"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  placeholder="Ex : les-potes"
                  maxLength={32}
                  className="w-full h-[46px] px-4 rounded-[16px] bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-[14px] font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[#FFD60A] transition-colors select-text"
                />
              </div>

              {formError && (
                <p className="text-[12px] font-semibold text-red-500">{formError}</p>
              )}

              <button
                type="submit"
                className="w-full h-[48px] rounded-[16px] bg-[#FFD60A] text-[#111111] font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,214,10,0.3)] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <UserCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Enregistrer et rejoindre</span>
              </button>
            </form>

            {/* Partage rapide du lien d'invitation */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">
                  Inviter des amis dans ce groupe
                </span>
                {isConfigured && (
                  <span className="text-[11px] font-bold text-[var(--text-muted)] tabular-nums">
                    {members.length} membre{members.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyInvite}
                className="w-full h-[42px] px-3.5 rounded-[14px] bg-[var(--card-subtle)] hover:bg-[var(--btn-hover)] border border-[var(--border-subtle)] text-[12px] font-bold text-[var(--text-main)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Lien d&apos;invitation copié !
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="truncate">
                      Copier le lien (?groupe={groupInput.trim().toLowerCase().replace(/\s+/g, '-') || 'les-potes'})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
