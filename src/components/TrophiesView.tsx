import React, { useMemo, useState } from 'react';
import { 
  Trophy, 
  Award, 
  Gem, 
  Medal, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  Users
} from 'lucide-react';

export interface TrophyTier {
  id: 'bronze' | 'silver' | 'gold' | 'diamond';
  name: string;
  targetDays: number;
  emoji: string;
  subtitle: string;
  description: string;
  accentColor: string;
  gradientBg: string;
  borderClass: string;
  badgeBg: string;
  glowColor: string;
}

const TROPHY_TIERS: TrophyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    targetDays: 5,
    emoji: '🥉',
    subtitle: 'Premier jalon',
    description: '5 jours de consommation notés dans le mois.',
    accentColor: '#D97706',
    gradientBg: 'from-amber-500/15 via-orange-500/10 to-transparent',
    borderClass: 'border-amber-500/30 dark:border-amber-500/40',
    badgeBg: 'bg-gradient-to-br from-[#CD7F32] via-[#B87333] to-[#8C5220]',
    glowColor: 'rgba(205, 127, 50, 0.25)',
  },
  {
    id: 'silver',
    name: 'Argent',
    targetDays: 12,
    emoji: '🥈',
    subtitle: 'Régularité confirmée',
    description: '12 jours de consommation notés dans le mois.',
    accentColor: '#94A3B8',
    gradientBg: 'from-slate-300/20 via-slate-400/10 to-transparent',
    borderClass: 'border-slate-300/40 dark:border-slate-600/50',
    badgeBg: 'bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
    glowColor: 'rgba(203, 213, 225, 0.3)',
  },
  {
    id: 'gold',
    name: 'Or',
    targetDays: 18,
    emoji: '🥇',
    subtitle: 'Maître du suivi',
    description: '18 jours de consommation notés dans le mois.',
    accentColor: '#EAB308',
    gradientBg: 'from-yellow-400/20 via-amber-400/10 to-transparent',
    borderClass: 'border-yellow-400/40 dark:border-yellow-400/50',
    badgeBg: 'bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#CA8A04]',
    glowColor: 'rgba(234, 179, 8, 0.35)',
  },
  {
    id: 'diamond',
    name: 'Diamant',
    targetDays: 25,
    emoji: '💎',
    subtitle: 'Légende ultime',
    description: '25 jours de consommation notés dans le mois.',
    accentColor: '#06B6D4',
    gradientBg: 'from-cyan-400/20 via-blue-500/10 to-transparent',
    borderClass: 'border-cyan-400/40 dark:border-cyan-400/50',
    badgeBg: 'bg-gradient-to-br from-[#67E8F9] via-[#06B6D4] to-[#0284C7]',
    glowColor: 'rgba(6, 182, 212, 0.35)',
  },
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface TrophiesViewProps {
  validatedDates: string[];
  onTriggerHaptic?: (pattern?: number | number[]) => void;
  onNavigateHome?: () => void;
  onNavigateCalendar?: () => void;
  onSwipeUpToFriends?: () => void;
  groupMemberCount?: number;
  groupId?: string;
}

export function TrophiesView({
  validatedDates,
  onTriggerHaptic,
  onNavigateHome,
  onSwipeUpToFriends,
  groupMemberCount = 0,
  groupId = '',
}: TrophiesViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Nombre de jours pour le mois affiché
  const currentMonthPrefix = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-`;

  const daysInCurrentMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const monthCount = useMemo(() => {
    return validatedDates.filter((d) => d.startsWith(currentMonthPrefix)).length;
  }, [validatedDates, currentMonthPrefix]);

  const isCurrentRealMonth = useMemo(() => {
    const now = new Date();
    return (
      now.getFullYear() === selectedDate.getFullYear() &&
      now.getMonth() === selectedDate.getMonth()
    );
  }, [selectedDate]);

  // Trophée le plus élevé atteint ce mois
  const highestUnlockedTier = useMemo(() => {
    const unlocked = TROPHY_TIERS.filter((t) => monthCount >= t.targetDays);
    return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
  }, [monthCount]);

  // Prochain trophée à atteindre
  const nextTargetTier = useMemo(() => {
    return TROPHY_TIERS.find((t) => monthCount < t.targetDays) || null;
  }, [monthCount]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTriggerHaptic?.(10);
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTriggerHaptic?.(10);
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrentMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTriggerHaptic?.(10);
    setSelectedDate(new Date());
  };

  // Icône du composant selon le palier
  const renderTierIcon = (id: TrophyTier['id'], isUnlocked: boolean) => {
    const iconClass = `w-6 h-6 ${isUnlocked ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'}`;
    switch (id) {
      case 'bronze':
        return <Medal className={iconClass} />;
      case 'silver':
        return <Award className={iconClass} />;
      case 'gold':
        return <Trophy className={iconClass} />;
      case 'diamond':
        return <Gem className={iconClass} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto px-[18px] pt-2 pb-6 touch-pan-y">
      {/* Sélecteur de mois & Titre gamifié */}
      <div className="w-full max-w-[420px] mb-3">
        <div className="flex items-center justify-between px-2 py-1 bg-[var(--card-bg)] rounded-[20px] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mois précédent"
            className="spring-icon-btn w-[34px] h-[34px] rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[13px] font-extrabold uppercase tracking-wider text-[var(--text-main)]">
              {MONTHS_FR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
            {!isCurrentRealMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="text-[10px] font-semibold text-[#FFD60A] underline underline-offset-2 hover:opacity-80"
              >
                Revenir à ce mois-ci
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Mois suivant"
            className="spring-icon-btn w-[34px] h-[34px] rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carte d'en-tête : Progression globale & Palier actuel */}
      <div className="w-full max-w-[420px] p-4 mb-3.5 rounded-[24px] bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] relative overflow-hidden">
        {/* Glow décoratif de fond */}
        <div 
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 transition-colors duration-500"
          style={{
            backgroundColor: highestUnlockedTier ? highestUnlockedTier.accentColor : '#FFD60A'
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[var(--card-subtle)] flex items-center justify-center text-[16px] shadow-sm">
                {highestUnlockedTier ? highestUnlockedTier.emoji : '🎯'}
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Statut du mois
                </span>
                <span className="text-[14px] font-extrabold text-[var(--text-main)]">
                  {highestUnlockedTier ? `Palier ${highestUnlockedTier.name}` : 'En route pour le Bronze'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[20px] font-black text-[var(--text-main)] tabular-nums">
                {monthCount}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                /{daysInCurrentMonth} j
              </span>
            </div>
          </div>

          {/* Message de motivation */}
          <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[var(--card-subtle)] text-[11px] font-semibold text-[var(--text-main)] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
            <span className="truncate">
              {nextTargetTier ? (
                <>
                  Plus que <strong className="text-[#FFD60A] font-bold">{nextTargetTier.targetDays - monthCount} jour{nextTargetTier.targetDays - monthCount > 1 ? 's' : ''}</strong> pour débloquer le {nextTargetTier.name} {nextTargetTier.emoji}
                </>
              ) : (
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">
                  Félicitations ! Tous les trophées du mois sont débloqués 💎
                </span>
              )}
            </span>
          </div>

          {/* Timeline de progression jalonnée (0 -> 5 -> 12 -> 18 -> 25) */}
          <div className="relative pt-2 pb-1">
            {/* Ligne de fond */}
            <div className="h-2 w-full bg-[var(--card-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((monthCount / 25) * 100))}%`,
                }}
              />
            </div>

            {/* Balises des 4 trophées */}
            <div className="flex justify-between items-center mt-2 px-0.5">
              {TROPHY_TIERS.map((tier) => {
                const isPassed = monthCount >= tier.targetDays;
                return (
                  <div
                    key={tier.id}
                    className="flex flex-col items-center gap-0.5"
                    style={{ minWidth: '40px' }}
                  >
                    <span
                      className={`text-[12px] transition-transform duration-300 ${
                        isPassed ? 'scale-110 drop-shadow-sm' : 'opacity-40 grayscale'
                      }`}
                    >
                      {tier.emoji}
                    </span>
                    <span
                      className={`text-[9px] font-bold tabular-nums ${
                        isPassed
                          ? 'text-[var(--text-main)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {tier.targetDays}j
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des 4 trophées */}
      <div className="w-full max-w-[420px] flex flex-col gap-2.5">
        {TROPHY_TIERS.map((tier) => {
          const isUnlocked = monthCount >= tier.targetDays;
          const progressPercent = Math.min(100, Math.round((monthCount / tier.targetDays) * 100));
          const remainingDays = Math.max(0, tier.targetDays - monthCount);

          return (
            <div
              key={tier.id}
              onClick={() => {
                onTriggerHaptic?.(isUnlocked ? [15, 20] : 10);
              }}
              style={{
                boxShadow: isUnlocked
                  ? `0 6px 20px -4px ${tier.glowColor}`
                  : 'var(--shadow-card)',
              }}
              className={`relative overflow-hidden rounded-[22px] p-3.5 transition-all duration-300 border ${
                tier.borderClass
              } ${
                isUnlocked
                  ? 'bg-[var(--card-bg)]'
                  : 'bg-[var(--card-bg)] opacity-85'
              }`}
            >
              {/* Fond dégradé subtil selon le métal */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${tier.gradientBg} pointer-events-none opacity-40`}
              />

              <div className="relative z-10 flex items-center gap-3">
                {/* Badge 3D / Médaille */}
                <div
                  className={`relative shrink-0 w-12 h-12 rounded-[16px] flex items-center justify-center shadow-md transition-transform duration-300 ${
                    isUnlocked
                      ? `${tier.badgeBg} ring-2 ring-white/30 dark:ring-white/10 scale-100`
                      : 'bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 opacity-60'
                  }`}
                >
                  {renderTierIcon(tier.id, isUnlocked)}

                  {/* Indicateur de verrouillage / validation */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                      isUnlocked
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-600 text-neutral-200'
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                    )}
                  </div>
                </div>

                {/* Détails du trophée */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <h2 className="text-[14px] font-extrabold text-[var(--text-main)] truncate">
                        {tier.name}
                      </h2>
                      <span className="text-[12px]">{tier.emoji}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isUnlocked
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-muted)]'
                      }`}
                    >
                      {isUnlocked ? 'Débloqué' : `Verrouillé`}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mb-2 font-medium">
                    {tier.description}
                  </p>

                  {/* Barre de progression individuelle */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--card-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnlocked
                            ? 'bg-emerald-500'
                            : 'bg-[#FFD60A]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-bold text-[var(--text-main)] tabular-nums shrink-0">
                      {isUnlocked ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {tier.targetDays}/{tier.targetDays} j
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">
                          {monthCount}/{tier.targetDays} j ({remainingDays} restant{remainingDays > 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invitation au Swipe vers le haut : Vue Potes / Cercle */}
      <div className="w-full max-w-[420px] mt-3.5 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onTriggerHaptic?.(10);
            onSwipeUpToFriends?.();
          }}
          className="w-full py-2.5 px-4 rounded-[18px] bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#FFD60A]/20 text-[var(--text-main)] flex items-center justify-center">
              <Users className="w-3.5 h-3.5 stroke-[2.4]" />
            </span>
            <div className="text-left">
              <span className="block text-[12px] font-extrabold text-[var(--text-main)]">
                Vue Potes / Cercle {groupId ? `(#${groupId})` : ''}
              </span>
              <span className="block text-[10px] font-semibold text-[var(--text-muted)]">
                Glissez vers le haut pour voir la progression des amis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            {groupMemberCount > 0 && (
              <span className="tabular-nums">{groupMemberCount}</span>
            )}
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateHome}
          className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Glissez vers la gauche pour revenir à Aujourd&apos;hui</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
