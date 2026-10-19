/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useHydrationReminder } from './hooks/useHydrationReminder';
import { NotificationReminderModal } from './components/NotificationReminderModal';
import { useTheme } from './hooks/useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { UserAuthModal } from './components/UserAuthModal';

const STORAGE_KEY = 'gbu_validated_dates';

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

const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function formatDateKey(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayKey(): string {
  return formatDateKey(new Date());
}

function loadValidatedDates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function saveValidatedDates(dates: string[]): void {
  try {
    const uniqueSorted = Array.from(new Set(dates)).sort();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueSorted));
  } catch (e) {
    console.error('Erreur de sauvegarde localStorage', e);
  }
}

function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}

/**
 * Pour remplacer le texte du bouton par vos propres images PNG transparentes :
 * 1. Déposez `btn-jai-bu.png` et `btn-note.png` dans le dossier `/public`.
 * 2. Passez `USE_CUSTOM_BUTTON_IMAGES` à `true` ci-dessous.
 */
const USE_CUSTOM_BUTTON_IMAGES = false;

export default function App() {
  const [validatedDates, setValidatedDates] = useState<string[]>(() => loadValidatedDates());
  const location = useLocation();
  const navigate = useNavigate();
  const currentView: 'tracker' | 'calendar' = location.pathname.startsWith('/calendar')
    ? 'calendar'
    : 'tracker';

  const setCurrentView = useCallback(
    (view: 'tracker' | 'calendar') => {
      if (view === 'calendar') {
        navigate('/calendar');
      } else {
        navigate('/');
      }
    },
    [navigate]
  );
  const [displayedDate, setDisplayedDate] = useState<Date>(() => new Date());
  const [todayKey, setTodayKey] = useState<string>(() => getTodayKey());
  const [animTrigger, setAnimTrigger] = useState<number>(0);
  const [isPopAnimating, setIsPopAnimating] = useState(false);
  const [isPressingButton, setIsPressingButton] = useState(false);
  const [customImgError, setCustomImgError] = useState<{ initial: boolean; validated: boolean }>({
    initial: false,
    validated: false,
  });

  // Authentification Firebase & Synchronisation Cloud multi-appareils
  const authHook = useFirebaseAuth(validatedDates, setValidatedDates);

  // États pour le slide horizontal (Swipe gauche / droite)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [dragOffsetPx, setDragOffsetPx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Synchronisation automatique lorsque l'application revient au premier plan un nouveau jour
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTodayKey(getTodayKey());
        setValidatedDates(loadValidatedDates());
      }
    };

    const midnightInterval = window.setInterval(() => {
      const currentKey = getTodayKey();
      setTodayKey((prev) => (prev !== currentKey ? currentKey : prev));
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(midnightInterval);
    };
  }, []);

  const toggleDateValidation = useCallback(
    (dateKey: string) => {
      setValidatedDates((prev) => {
        const exists = prev.includes(dateKey);
        const next = exists ? prev.filter((d) => d !== dateKey) : [...prev, dateKey];
        const uniqueSorted = Array.from(new Set(next)).sort();
        saveValidatedDates(uniqueSorted);
        authHook.syncDateChangeToCloud(uniqueSorted);
        return uniqueSorted;
      });
    },
    [authHook]
  );

  const isTodayValidated = useMemo(
    () => validatedDates.includes(todayKey),
    [validatedDates, todayKey]
  );

  // Gestion des rappels d'hydratation après 20h via Service Worker
  const reminder = useHydrationReminder({ isTodayValidated, todayKey });

  // Mode sombre / clair respectant la préférence système
  const themeState = useTheme();

  // Statistiques sur le mois en cours et l'année en cours
  const { monthCount, yearCount } = useMemo(() => {
    const now = new Date();
    const currentYearPrefix = `${now.getFullYear()}-`;
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;

    const mCount = validatedDates.filter((d) => d.startsWith(currentMonthPrefix)).length;
    const yCount = validatedDates.filter((d) => d.startsWith(currentYearPrefix)).length;

    return { monthCount: mCount, yearCount: yCount };
  }, [validatedDates, todayKey]);

  // Calcul de la grille mensuelle du calendrier
  const calendarData = useMemo(() => {
    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();

    // 0 = Dimanche -> converti en Lundi = 0 ... Dimanche = 6
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const emptyCells = Array.from({ length: startOffset }, (_, idx) => idx);
    const dayCells = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNumber = idx + 1;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      return {
        dayNumber,
        dateKey,
        isToday: dateKey === todayKey,
        isValidated: validatedDates.includes(dateKey),
      };
    });

    return {
      monthLabel: `${MONTHS_FR[month]} ${year}`,
      emptyCells,
      dayCells,
    };
  }, [displayedDate, validatedDates, todayKey]);

  const handleMainButtonClick = () => {
    // Si un swipe est en cours, ignorer le clic
    if (Math.abs(dragOffsetPx) > 10) return;

    triggerHaptic([12, 30, 18]);
    setAnimTrigger((prev) => prev + 1);
    setIsPopAnimating(true);
    window.setTimeout(() => setIsPopAnimating(false), 540);
    toggleDateValidation(getTodayKey());
  };

  const handlePrevMonth = () => {
    triggerHaptic(10);
    setDisplayedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHaptic(10);
    setDisplayedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (dateKey: string) => {
    if (Math.abs(dragOffsetPx) > 10) return;
    triggerHaptic(10);
    toggleDateValidation(dateKey);
  };

  // --- GESTION DU SWIPE / SLIDE HORIZONTAL ---
  const handleSwipeStart = (clientX: number, clientY: number) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    isDraggingRef.current = false;
  };

  const handleSwipeMove = (clientX: number, clientY: number) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = clientX - touchStartX.current;
    const deltaY = clientY - touchStartY.current;

    if (!isDraggingRef.current) {
      // Démarrer le drag uniquement si le geste est majoritairement horizontal
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDraggingRef.current = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    // Résistance élastique aux bords extrêmes
    if (currentView === 'tracker' && deltaX > 0) {
      setDragOffsetPx(deltaX * 0.25);
    } else if (currentView === 'calendar' && deltaX < 0) {
      setDragOffsetPx(deltaX * 0.25);
    } else {
      setDragOffsetPx(deltaX);
    }
  };

  const handleSwipeEnd = () => {
    if (isDraggingRef.current) {
      const width = containerRef.current?.clientWidth || 360;
      const threshold = Math.min(75, width * 0.2);

      // Slide vers la gauche depuis l'accueil -> Calendrier
      if (currentView === 'tracker' && dragOffsetPx < -threshold) {
        triggerHaptic(10);
        setDisplayedDate(new Date());
        setCurrentView('calendar');
      }
      // Slide vers la droite depuis le calendrier -> Accueil
      else if (currentView === 'calendar' && dragOffsetPx > threshold) {
        triggerHaptic(10);
        setCurrentView('tracker');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffsetPx(0);
  };

  const baseTranslatePercent = currentView === 'tracker' ? 0 : -50;

  return (
    <div
      ref={containerRef}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handleSwipeStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          handleSwipeMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleSwipeEnd}
      onTouchCancel={handleSwipeEnd}
      onMouseDown={(e) => handleSwipeStart(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (touchStartX.current !== null) {
          handleSwipeMove(e.clientX, e.clientY);
        }
      }}
      onMouseUp={handleSwipeEnd}
      onMouseLeave={() => {
        if (touchStartX.current !== null) {
          handleSwipeEnd();
        }
      }}
      className="app-safe-container flex flex-col w-full h-full max-w-[480px] mx-auto select-none overflow-hidden touch-pan-y"
    >
      {/* En-tête discret */}
      <header className="grid grid-cols-[auto_1fr_auto] items-center h-[48px] px-[24px] shrink-0 gap-3">
        <div className="justify-self-start">
          <PWAInstallButton />
        </div>

        <h1 className="text-center text-[12px] font-bold tracking-[1.6px] uppercase text-[var(--text-main)] opacity-75 whitespace-nowrap">
          {currentView === 'tracker' ? "AUJOURD'HUI" : 'HISTORIQUE'}
        </h1>

        <div className="flex items-center gap-2 justify-self-end">
          <ThemeToggle themeState={themeState} />
          <NotificationReminderModal reminder={reminder} />
          <UserAuthModal authHook={authHook} datesCount={validatedDates.length} />
        </div>
      </header>

      {/* Piste horizontale de slide (2 écrans : 0 = Tracker, 1 = Calendrier) */}
      <main className="relative flex-1 w-full overflow-hidden">
        <div
          style={{
            transform: `translate3d(calc(${baseTranslatePercent}% + ${dragOffsetPx}px), 0, 0)`,
            transition: isDragging
              ? 'none'
              : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="flex w-[200%] h-full will-change-transform"
        >
          {/* VUE 1 : TRACKER PRINCIPAL */}
          <section
            aria-hidden={currentView !== 'tracker'}
            className="w-1/2 h-full px-[24px] flex flex-col items-center justify-center relative"
          >
            <div className="relative flex items-center justify-center">
              {/* Ondes de choc radiales au clic */}
              {animTrigger > 0 && (
                <React.Fragment key={animTrigger}>
                  <span
                    className={`ripple-wave-1 pointer-events-none absolute inset-0 rounded-full ${
                      isTodayValidated
                        ? 'border-[3px] border-[#2D1810]/55 bg-[#2D1810]/12'
                        : 'border-[3px] border-[#FFD60A]/65 bg-[#FFD60A]/15'
                    }`}
                  />
                  <span
                    className={`ripple-wave-2 pointer-events-none absolute inset-0 rounded-full ${
                      isTodayValidated
                        ? 'border-[2px] border-[#2D1810]/35'
                        : 'border-[2px] border-[#FFD60A]/45'
                    }`}
                  />
                </React.Fragment>
              )}

              <button
                type="button"
                onPointerDown={() => setIsPressingButton(true)}
                onPointerUp={() => setIsPressingButton(false)}
                onPointerLeave={() => setIsPressingButton(false)}
                onPointerCancel={() => setIsPressingButton(false)}
                onClick={handleMainButtonClick}
                aria-label={
                  isTodayValidated
                    ? "Noté pour aujourd'hui. Appuyez pour annuler"
                    : "Valider j'ai bu aujourd'hui"
                }
                className={`main-btn-modern relative z-10 w-[272px] h-[272px] rounded-full flex flex-col items-center justify-center p-[12px] cursor-pointer outline-none overflow-hidden ${
                  isPopAnimating ? 'animating-pop' : ''
                } ${
                  isPressingButton ? 'scale-[0.92]' : ''
                } ${
                  isTodayValidated
                    ? 'bg-[#2D1810] text-white shadow-[0_22px_48px_-10px_rgba(45,24,16,0.55),0_6px_16px_rgba(0,0,0,0.12),inset_0_0_0_4px_rgba(255,255,255,0.14)]'
                    : 'bg-[#FFD60A] text-[#111111] shadow-[0_20px_40px_-12px_rgba(255,214,10,0.45),0_4px_12px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div
                  className={`flex flex-col items-center justify-center text-center w-full ${
                    isPopAnimating ? 'btn-content-swap' : ''
                  }`}
                >
                  {USE_CUSTOM_BUTTON_IMAGES &&
                  ((!isTodayValidated && !customImgError.initial) ||
                    (isTodayValidated && !customImgError.validated)) ? (
                    <img
                      src={isTodayValidated ? '/btn-note.png' : '/btn-jai-bu.png'}
                      alt={isTodayValidated ? "Noté pour aujourd'hui" : "J'ai bu aujourd'hui"}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setCustomImgError((prev) => ({
                          ...prev,
                          [isTodayValidated ? 'validated' : 'initial']: true,
                        }))
                      }
                      className="max-w-[225px] max-h-[225px] object-contain pointer-events-none"
                    />
                  ) : (
                    <div
                      className={`font-arial-black flex flex-col items-center justify-center uppercase w-full select-none transition-colors duration-300 ease-out ${
                        isTodayValidated ? 'text-white' : 'text-[#111111]'
                      }`}
                    >
                      <span
                        className={`block whitespace-nowrap ${
                          isTodayValidated
                            ? 'text-[31px] leading-[0.95] tracking-[0.2px]'
                            : 'text-[44px] leading-[0.92] tracking-[0.4px]'
                        }`}
                      >
                        {isTodayValidated ? 'NOTÉ POUR' : 'J’AI BU'}
                      </span>
                      <span
                        className={`block whitespace-nowrap mt-[2px] ${
                          isTodayValidated
                            ? 'text-[25px] leading-[1.0] tracking-[0.1px]'
                            : 'text-[22.5px] leading-[1.0] tracking-[0.2px]'
                        }`}
                      >
                        AUJOURD’HUI
                      </span>
                    </div>
                  )}

                  <span
                    className={`overflow-hidden transition-all duration-300 ease-out text-[11px] leading-[13px] font-bold tracking-[0.4px] ${
                      isTodayValidated
                        ? 'mt-[10px] max-h-[20px] opacity-100 text-white/75'
                        : 'mt-0 max-h-0 opacity-0 text-transparent'
                    }`}
                  >
                    Appuyez pour annuler
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* VUE 2 : CALENDRIER & STATISTIQUES */}
          <section
            aria-hidden={currentView !== 'calendar'}
            className="w-1/2 h-full px-[24px] flex flex-col items-center justify-start pt-[16px]"
          >
            {/* Double compteur haut */}
            <div className="flex flex-row justify-center items-center gap-[48px] w-full mb-[24px] py-[18px] px-[24px] bg-[var(--card-bg)] rounded-[24px] shadow-[var(--shadow-card)] border border-[var(--border-subtle)] transition-colors duration-200">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-extrabold text-[var(--text-main)] leading-[1.1] mb-[5px] tabular-nums">
                  {monthCount}
                </span>
                <span className="text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase whitespace-nowrap">
                  CE MOIS-CI
                </span>
              </div>

              <div className="w-[1px] h-[32px] bg-[var(--border-subtle)]" />

              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-extrabold text-[var(--text-main)] leading-[1.1] mb-[5px] tabular-nums">
                  {yearCount}
                </span>
                <span className="text-[11px] font-bold tracking-[1px] text-[var(--text-muted)] uppercase whitespace-nowrap">
                  CETTE ANNÉE
                </span>
              </div>
            </div>

            {/* Grille du calendrier */}
            <div className="w-full bg-[var(--card-bg)] rounded-[28px] py-[22px] px-[18px] shadow-[var(--shadow-calendar)] border border-[var(--border-subtle)] transition-colors duration-200">
              <div className="flex items-center justify-between mb-[18px] px-[4px]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Mois précédent"
                  className="spring-icon-btn w-[40px] h-[40px] rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:bg-[var(--btn-hover)]"
                >
                  <ChevronLeft className="w-[18px] h-[18px] stroke-[2.5]" />
                </button>

                <span className="text-[15px] font-extrabold uppercase tracking-[0.6px] text-[var(--text-main)] whitespace-nowrap">
                  {calendarData.monthLabel}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Mois suivant"
                  className="spring-icon-btn w-[40px] h-[40px] rounded-full bg-[var(--card-subtle)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:bg-[var(--btn-hover)]"
                >
                  <ChevronRight className="w-[18px] h-[18px] stroke-[2.5]" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 mb-[10px] text-center">
                {WEEKDAYS_FR.map((dayLabel, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold text-[var(--text-muted)] py-[4px]"
                  >
                    {dayLabel}
                  </span>
                ))}
              </div>

              {/* Grille des jours du mois */}
              <div className="grid grid-cols-7 gap-y-[8px] gap-x-[4px] justify-items-center">
                {calendarData.emptyCells.map((emptyIdx) => (
                  <div
                    key={`empty-${emptyIdx}`}
                    className="w-[38px] h-[38px] rounded-full pointer-events-none"
                  />
                ))}

                {calendarData.dayCells.map(({ dayNumber, dateKey, isToday, isValidated }) => (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleDayClick(dateKey)}
                    aria-label={`${dayNumber} ${calendarData.monthLabel}${
                      isValidated ? ' (validé)' : ''
                    }`}
                    aria-pressed={isValidated}
                    className={`spring-day-cell w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] tabular-nums cursor-pointer relative outline-none ${
                      isValidated
                        ? isToday
                          ? 'bg-[#FFD60A] text-[#111111] font-extrabold shadow-[inset_0_0_0_2px_#111111,0_3px_10px_rgba(255,214,10,0.35)]'
                          : 'bg-[#FFD60A] text-[#111111] font-extrabold shadow-[0_3px_10px_rgba(255,214,10,0.35)]'
                        : isToday
                        ? 'font-bold text-[var(--text-main)] shadow-[inset_0_0_0_1.8px_var(--text-main)]'
                        : 'font-bold text-[var(--text-main)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {dayNumber}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-[18px] text-center text-[11px] font-semibold text-[var(--text-muted)]">
              Touchez une date pour modifier l&apos;historique
            </p>
          </section>
        </div>
      </main>

      {/* Indicateur discret de pagination / slide en bas */}
      <footer className="flex flex-col items-center justify-center gap-1.5 pt-2 pb-1 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Écran Aujourd'hui"
            onClick={() => {
              triggerHaptic(10);
              setCurrentView('tracker');
            }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              currentView === 'tracker'
                ? 'w-5 bg-[var(--text-main)]'
                : 'w-1.5 bg-[var(--text-main)] opacity-20'
            }`}
          />
          <button
            type="button"
            aria-label="Écran Calendrier"
            onClick={() => {
              triggerHaptic(10);
              setDisplayedDate(new Date());
              setCurrentView('calendar');
            }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              currentView === 'calendar'
                ? 'w-5 bg-[var(--text-main)]'
                : 'w-1.5 bg-[var(--text-main)] opacity-20'
            }`}
          />
        </div>
        <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wide">
          {currentView === 'tracker'
            ? 'Glissez vers la gauche pour le calendrier'
            : "Glissez vers la droite pour aujourd'hui"}
        </span>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
