import { useState, useEffect, useCallback, useRef } from 'react';

const REMINDER_ENABLED_KEY = 'gbu_reminder_enabled';
const REMINDER_SENT_PREFIX = 'gbu_reminder_sent_';
const REMINDER_HOUR = 20; // 20h00
const REMINDER_MINUTE = 0;

interface UseHydrationReminderProps {
  isTodayValidated: boolean;
  todayKey: string;
}

export function useHydrationReminder({ isTodayValidated, todayKey }: UseHydrationReminderProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMINDER_ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Check support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator;

    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Helper to send a notification via the active Service Worker
  const sendNotificationViaSW = useCallback(
    async (title: string, options: NotificationOptions) => {
      try {
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service Worker non supporté');
        }

        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return true;
        }

        // Fallback to standard Notification constructor if service worker ready fails
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, options);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Erreur lors de l’envoi de la notification :', err);
        return false;
      }
    },
    []
  );

  // Method to trigger the actual 20h reminder
  const triggerEveningReminder = useCallback(
    async (force: boolean = false) => {
      if (!force) {
        if (!isEnabled || isTodayValidated) return;
        const alreadySent = localStorage.getItem(`${REMINDER_SENT_PREFIX}${todayKey}`);
        if (alreadySent) return;
      }

      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const iconUrl = `${cleanBase}pwa-192x192.png`;

      const success = await sendNotificationViaSW('GBU — Rappel d’hydratation 💧', {
        body: 'Il est 20h passées ! N’oubliez pas de boire et d’enregistrer votre hydratation.',
        icon: iconUrl,
        badge: iconUrl,
        tag: 'gbu-hydration-reminder',
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          url: cleanBase,
          dateKey: todayKey,
        },
      } as NotificationOptions);

      if (success && !force) {
        localStorage.setItem(`${REMINDER_SENT_PREFIX}${todayKey}`, 'true');
      }
      return success;
    },
    [isEnabled, isTodayValidated, todayKey, sendNotificationViaSW]
  );

  // Test notification function for the user to try instantly
  const testNotification = useCallback(async () => {
    let currentPerm = permission;
    if (currentPerm !== 'granted') {
      currentPerm = await Notification.requestPermission();
      setPermission(currentPerm);
    }

    if (currentPerm !== 'granted') {
      return false;
    }

    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const iconUrl = `${cleanBase}pwa-192x192.png`;

    const success = await sendNotificationViaSW('GBU — Test de notification 💧', {
      body: 'Le rappel automatique à 20h est bien configuré avec le Service Worker !',
      icon: iconUrl,
      badge: iconUrl,
      tag: 'gbu-test-notification',
      vibrate: [100, 50, 100],
    } as NotificationOptions);

    if (success) {
      setLastTestedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }
    return success;
  }, [permission, sendNotificationViaSW]);

  // Toggle reminder on/off
  const toggleReminder = useCallback(
    async (forceState?: boolean) => {
      const nextState = forceState !== undefined ? forceState : !isEnabled;

      if (nextState) {
        let currentPerm = permission;
        if (currentPerm !== 'granted') {
          currentPerm = await Notification.requestPermission();
          setPermission(currentPerm);
        }

        if (currentPerm === 'granted') {
          setIsEnabled(true);
          localStorage.setItem(REMINDER_ENABLED_KEY, 'true');
          return true;
        } else {
          setIsEnabled(false);
          localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
          return false;
        }
      } else {
        setIsEnabled(false);
        localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
        return true;
      }
    },
    [isEnabled, permission]
  );

  // Setup scheduler for 20h00
  useEffect(() => {
    if (!isEnabled || permission !== 'granted') {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const checkAndSchedule = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Target time today at 20:00
      const targetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE, 0);

      // If we are currently at or past 20:00 today
      if (now >= targetToday) {
        const alreadySent = localStorage.getItem(`${REMINDER_SENT_PREFIX}${todayKey}`);
        if (!isTodayValidated && !alreadySent) {
          triggerEveningReminder();
        }

        // Schedule for tomorrow at 20:00
        const targetTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, REMINDER_HOUR, REMINDER_MINUTE, 0);
        const msUntilTomorrow = targetTomorrow.getTime() - now.getTime();
        
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          checkAndSchedule();
        }, Math.max(1000, msUntilTomorrow));
      } else {
        // Schedule for today at 20:00
        const msUntilTarget = targetToday.getTime() - now.getTime();
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          checkAndSchedule();
        }, Math.max(1000, msUntilTarget));
      }
    };

    checkAndSchedule();

    // Check again when the app comes back to the foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date();
        if (now.getHours() >= REMINDER_HOUR) {
          const alreadySent = localStorage.getItem(`${REMINDER_SENT_PREFIX}${todayKey}`);
          if (!isTodayValidated && !alreadySent) {
            triggerEveningReminder();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, permission, isTodayValidated, todayKey, triggerEveningReminder]);

  return {
    isSupported,
    permission,
    isEnabled,
    toggleReminder,
    testNotification,
    lastTestedAt,
    reminderHour: REMINDER_HOUR,
  };
}
