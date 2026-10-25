import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  UserPlus,
  Settings2,
} from 'lucide-react';
import { UseSupabaseGroupReturn } from '../hooks/useSupabaseGroup';
import { getHighestUnlockedTier, TrophyTier } from './TrophiesView';

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

/**
 * Insigne SVG d'étoile/médaille stylisé avec reflets métalliques selon le rang mensuel du membre :
 * - Moins de 5 jours : Aucun badge
 * - 5 à 11 jours : Bronze (L'Éclaireur) — reflets cuivrés / marron doré
 * - 12 à 19 jours : Argent (Le Baroudeur) — gris métallique clair et lumineux
 * - 20 à 27 jours : Or (Le Conquérant) — jaune vif mat (#FFD60A) / doré chaleureux
 * - 28 jours et plus : Diamant (L'Indomptable) — bleu glacier / cyan électrique subtil
 */
function MemberTierStarBadge({ monthCount }: { monthCount: number }) {
  const tier = getHighestUnlockedTier(monthCount);
  if (!tier) return null;

  const badgeStyles: Record<
    TrophyTier['id'],
    {
      gradientId: string;
      stops: [string, string, string];
      stroke: string;
      pillBg: string;
      pillBorder: string;
      textColor: string;
    }
  > = {
    bronze: {
      gradientId: 'star-grad-bronze',
      stops: ['#F3B680', '#CD7F32', '#8C5220'],
      stroke: '#A05A2C',
      pillBg: 'bg-amber-600/12 dark:bg-amber-500/15',
      pillBorder: 'border-amber-600/30 dark:border-amber-500/30',
      textColor: 'text-[#B86B28] dark:text-[#E59A59]',
    },
    silver: {
      gradientId: 'star-grad-silver',
      stops: ['#FFFFFF', '#CBD5E1', '#94A3B8'],
      stroke: '#94A3B8',
      pillBg: 'bg-slate-400/15 dark:bg-slate-300/15',
      pillBorder: 'border-slate-400/35 dark:border-slate-300/30',
      textColor: 'text-slate-600 dark:text-slate-200',
    },
    gold: {
      gradientId: 'star-grad-gold',
      stops: ['#FFF380', '#FFD60A', '#D99B00'],
      stroke: '#CA8A04',
      pillBg: 'bg-[#FFD60A]/20 dark:bg-[#FFD60A]/15',
      pillBorder: 'border-[#FFD60A]/50 dark:border-[#FFD60A]/40',
      textColor: 'text-[#9A6E00] dark:text-[#FFD60A]',
    },
    diamond: {
      gradientId: 'star-grad-diamond',
      stops: ['#E0F2FE', '#38BDF8', '#0284C7'],
      stroke: '#0284C7',
      pillBg: 'bg-sky-400/15 dark:bg-sky-400/15',
      pillBorder: 'border-sky-400/40 dark:border-sky-400/35',
      textColor: 'text-sky-600 dark:text-sky-300',
    },
  };

  const style = badgeStyles[tier.id];

  return (
    <span
      title={`${tier.fullTitle} (${monthCount} j ce mois-ci)`}
      aria-label={tier.fullTitle}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${style.pillBg} ${style.pillBorder} shrink-0`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={style.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.stops[0]} />
            <stop offset="55%" stopColor={style.stops[1]} />
            <stop offset="100%" stopColor={style.stops[2]} />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${style.gradientId})`}
          stroke={style.stroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
          d="M12 2.2l2.92 6.08 6.68.92-4.86 4.68 1.18 6.62L12 17.32 6.08 20.5l1.18-6.62L2.4 9.2l6.68-.92L12 2.2z"
        />
      </svg>
      <span className={`text-[10px] font-extrabold leading-none ${style.textColor}`}>
        {tier.name}
      </span>
    </span>
  );
}

interface FriendsCircleViewProps {
  supabaseGroup: UseSupabaseGroupReturn;
  onTriggerHaptic?: (pattern?: number | number[]) => void;
  onSwipeDownToTrophies: () => void;
}

export function FriendsCircleView({
  supabaseGroup,
  onTriggerHaptic,
  onSwipeDownToTrophies,
}: FriendsCircleViewProps) {
  const {
    groupId,
    isConfigured,
    setIsModalOpen,
    isLoadingGroup,
    members,
    refreshGroupData,
    getInviteLink,
  } = supabaseGroup;

  const [copiedInvite, setCopiedInvite] = useState(false);

  const now = new Date();
  const currentMonthLabel = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const validatedTodayCount = members.filter((m) => m.hasValidatedToday).length;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = getInviteLink();
    if (!link) return;
    onTriggerHaptic?.(10);

    try {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2200);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto px-[18px] pt-1 pb-6 touch-pan-y">
      {/* Poignée de retour vers le haut (Trophées) */}
      <button
        type="button"
        onClick={() => {
          onTriggerHaptic?.(10);
          onSwipeDownToTrophies();
        }}
        className="w-full max-w-[420px] py-2 mb-2 flex flex-col items-center justify-center gap-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer shrink-0"
      >
        <div className="w-9 h-1 rounded-full bg-[var(--text-muted)]/30 mb-1" />
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide">
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Glissez vers le bas pour revenir aux Trophées</span>
        </span>
      </button>

      {/* En-tête du groupe & bouton d'invitation */}
      <div className="w-full max-w-[420px] p-4 mb-3.5 rounded-[24px] bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#FFD60A] text-[#111111] flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15px] font-extrabold text-[var(--text-main)] truncate">
                  {groupId ? `#${groupId}` : 'Aucun groupe actif'}
                </h2>
              </div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] truncate">
                {isConfigured
                  ? `${validatedTodayCount}/${members.length} ont validé aujourd'hui · ${currentMonthLabel}`
                  : 'Configure ton profil pour voir tes potes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isConfigured && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerHaptic?.(10);
                  void refreshGroupData();
                }}
                aria-label="Actualiser le groupe"
                className="spring-icon-btn w-9 h-9 rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingGroup ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerHaptic?.(10);
                setIsModalOpen(true);
              }}
              aria-label="Modifier mon pseudo ou mon groupe"
              className="spring-icon-btn w-9 h-9 rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions rapides : Copier le lien d'invitation ou configurer */}
        {isConfigured ? (
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full h-[40px] px-3.5 rounded-[14px] bg-[var(--card-subtle)] hover:bg-[var(--btn-hover)] border border-[var(--border-subtle)] text-[12px] font-bold text-[var(--text-main)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copiedInvite ? (
              <>
                <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Lien d&apos;invitation copié !
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Inviter un pote dans #{groupId}</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onTriggerHaptic?.(10);
              setIsModalOpen(true);
            }}
            className="w-full h-[42px] px-4 rounded-[14px] bg-[#FFD60A] text-[#111111] text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.4]" />
            <span>Choisir mon prénom et mon groupe</span>
          </button>
        )}
      </div>

      {/* Légende de la liste */}
      <div className="w-full max-w-[420px] shrink-0 flex items-center justify-between px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        <span>Membre & état du jour</span>
        <span>Ce mois-ci</span>
      </div>

      {/* Liste des membres du groupe */}
      <div className="w-full max-w-[420px] shrink-0 flex flex-col gap-2">
        {members.length === 0 ? (
          <div className="w-full rounded-[22px] p-6 bg-[var(--card-bg)] border border-[var(--border-subtle)] text-center">
            <p className="text-[13px] font-bold text-[var(--text-main)] mb-1">
              Aucun membre trouvé dans ce cercle
            </p>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              Configure ton prénom ou partage le lien d&apos;invitation avec tes amis pour commencer le suivi.
            </p>
          </div>
        ) : (
          members.map((member) => {
            const memberTier = getHighestUnlockedTier(member.monthCount);
            return (
              <div
                key={member.userName.toLowerCase()}
                className="w-full rounded-[20px] px-4 py-3.5 bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex items-center justify-between gap-3 transition-colors"
              >
                {/* Gauche : Pastille d'état du jour + Prénom + Badge/Étoile de palier */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Pastille jaune mat (#FFD60A) si validé aujourd'hui, ou cercle gris/vide sinon */}
                  <span
                    aria-label={
                      member.hasValidatedToday
                        ? "A validé sa journée aujourd'hui"
                        : "N'a pas encore validé aujourd'hui"
                    }
                    title={
                      member.hasValidatedToday
                        ? "Validé aujourd'hui"
                        : "Pas encore validé aujourd'hui"
                    }
                    className={`w-4 h-4 rounded-full shrink-0 transition-all duration-300 ${
                      member.hasValidatedToday
                        ? 'bg-[#FFD60A] shadow-[0_0_10px_rgba(255,214,10,0.45)]'
                        : 'bg-transparent border-2 border-neutral-300 dark:border-neutral-600'
                    }`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[14px] font-extrabold text-[var(--text-main)] truncate">
                        {member.userName}
                      </span>
                      {member.isCurrentUser && (
                        <span className="text-[11px] font-bold text-[var(--text-muted)] shrink-0">
                          · Toi
                        </span>
                      )}
                      <MemberTierStarBadge monthCount={member.monthCount} />
                    </div>
                    <span className="block text-[11px] font-semibold text-[var(--text-muted)] truncate">
                      {member.hasValidatedToday
                        ? "Noté pour aujourd'hui"
                        : 'En attente aujourd’hui'}
                      {memberTier ? ` · ${memberTier.rankTitle}` : ''}
                    </span>
                  </div>
                </div>

                {/* Droite : Compteur total de jours validés sur le mois en cours */}
                <div className="text-right shrink-0">
                  <span className="text-[18px] font-extrabold text-[var(--text-main)] tabular-nums">
                    {member.monthCount}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-muted)] ml-1">
                    j
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
