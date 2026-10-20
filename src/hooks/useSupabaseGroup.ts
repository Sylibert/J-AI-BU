import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, DrinkLogRow, GroupMemberStat } from '../lib/supabase';

const USER_NAME_STORAGE_KEY = 'gbu_user_name';
const GROUP_ID_STORAGE_KEY = 'gbu_group_id';
const VALIDATED_DATES_STORAGE_KEY = 'gbu_validated_dates';

function normalizeGroupCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

function getUrlGroupParam(): string | null {
  if (typeof window === 'undefined') return null;

  // Vérifie dans window.location.search (?groupe=les-potes)
  const searchParams = new URLSearchParams(window.location.search);
  const fromSearch = searchParams.get('groupe') || searchParams.get('group');
  if (fromSearch && fromSearch.trim()) {
    return normalizeGroupCode(fromSearch);
  }

  // Vérifie aussi dans le hash si l'URL est du type /#/?groupe=les-potes
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(qIndex));
    const fromHash = hashParams.get('groupe') || hashParams.get('group');
    if (fromHash && fromHash.trim()) {
      return normalizeGroupCode(fromHash);
    }
  }

  return null;
}

export interface UseSupabaseGroupReturn {
  userName: string;
  groupId: string;
  isConfigured: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isLoadingGroup: boolean;
  syncError: string | null;
  members: GroupMemberStat[];
  saveProfileAndGroup: (newName: string, newGroup: string) => Promise<void>;
  syncDateToggle: (dateKey: string, isNowValidated: boolean) => Promise<void>;
  refreshGroupData: () => Promise<void>;
  getInviteLink: (customGroup?: string) => string;
}

export function useSupabaseGroup(
  validatedDates: string[],
  setValidatedDates: React.Dispatch<React.SetStateAction<string[]>>,
  todayKey: string
): UseSupabaseGroupReturn {
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim() || '';
    } catch {
      return '';
    }
  });

  const [groupId, setGroupId] = useState<string>(() => {
    const urlGroup = getUrlGroupParam();
    if (urlGroup) return urlGroup;
    try {
      return localStorage.getItem(GROUP_ID_STORAGE_KEY)?.trim() || '';
    } catch {
      return '';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [groupLogs, setGroupLogs] = useState<DrinkLogRow[]>([]);
  const initialSyncDoneRef = useRef<string>('');

  const isConfigured = Boolean(userName.trim() && groupId.trim());

  // Détection initiale du paramètre ?groupe=... ou de la première visite
  useEffect(() => {
    const urlGroup = getUrlGroupParam();
    const savedName = localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim() || '';
    const savedGroup = localStorage.getItem(GROUP_ID_STORAGE_KEY)?.trim() || '';

    if (urlGroup) {
      setGroupId(urlGroup);
      try {
        localStorage.setItem(GROUP_ID_STORAGE_KEY, urlGroup);
      } catch {
        // Ignore storage error
      }
      // Si l'utilisateur n'a pas encore renseigné son prénom, ouvrir la modale avec le groupe pré-rempli
      if (!savedName) {
        setIsModalOpen(true);
      }
    } else if (!savedName || !savedGroup) {
      // Première visite : demander prénom + groupe
      setIsModalOpen(true);
    }
  }, []);

  // Fonction de récupération des logs du groupe et synchronisation bidirectionnelle
  const refreshGroupData = useCallback(async () => {
    const cleanGroup = groupId.trim();
    const cleanName = userName.trim();
    if (!cleanGroup) {
      setGroupLogs([]);
      return;
    }

    setIsLoadingGroup(true);
    setSyncError(null);

    try {
      const { data, error } = await supabase
        .from('drink_logs')
        .select('id, user_name, group_id, logged_date, created_at')
        .eq('group_id', cleanGroup);

      if (error) {
        throw error;
      }

      const rows: DrinkLogRow[] = Array.isArray(data) ? data : [];
      setGroupLogs(rows);

      // Si l'utilisateur a un pseudo configuré, synchroniser ses dates locales et distantes
      if (cleanName) {
        const myRemoteDates = rows
          .filter((r) => r.user_name.trim().toLowerCase() === cleanName.toLowerCase())
          .map((r) => r.logged_date);

        // Fusionner les dates locales et distantes pour l'utilisateur actif
        let localSnapshot: string[] = [];
        try {
          const raw = localStorage.getItem(VALIDATED_DATES_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localSnapshot = parsed;
            }
          }
        } catch {
          localSnapshot = validatedDates;
        }

        const merged = Array.from(new Set([...localSnapshot, ...myRemoteDates])).sort();
        if (merged.length !== localSnapshot.length) {
          try {
            localStorage.setItem(VALIDATED_DATES_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignore
          }
          setValidatedDates(merged);
        }

        // Pousser vers Supabase les dates locales qui ne sont pas encore sur le serveur
        const remoteSet = new Set(myRemoteDates);
        const missingOnServer = merged.filter((d) => !remoteSet.has(d));

        const syncKey = `${cleanName}:${cleanGroup}:${missingOnServer.join(',')}`;
        if (missingOnServer.length > 0 && initialSyncDoneRef.current !== syncKey) {
          initialSyncDoneRef.current = syncKey;
          const rowsToInsert = missingOnServer.map((d) => ({
            user_name: cleanName,
            group_id: cleanGroup,
            logged_date: d,
          }));

          const { error: insertErr } = await supabase
            .from('drink_logs')
            .upsert(rowsToInsert, {
              onConflict: 'user_name,group_id,logged_date',
              ignoreDuplicates: true,
            });

          // Fallback si la contrainte unique n'existe pas sur la table
          if (insertErr) {
            for (const row of rowsToInsert) {
              await supabase.from('drink_logs').insert(row);
            }
          }

          // Recharger les données après insertion initiale
          const { data: updatedData } = await supabase
            .from('drink_logs')
            .select('id, user_name, group_id, logged_date, created_at')
            .eq('group_id', cleanGroup);

          if (Array.isArray(updatedData)) {
            setGroupLogs(updatedData);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion Supabase';
      console.warn('Synchronisation Supabase:', msg);
      setSyncError(msg);
    } finally {
      setIsLoadingGroup(false);
    }
  }, [groupId, userName, validatedDates, setValidatedDates]);

  // Charger les données au montage et à chaque changement de groupe/utilisateur
  useEffect(() => {
    if (groupId.trim()) {
      void refreshGroupData();
    }
  }, [groupId, userName, refreshGroupData]);

  // Souscription temps réel Supabase sur le groupe actif
  useEffect(() => {
    const cleanGroup = groupId.trim();
    if (!cleanGroup) return;

    const channel = supabase
      .channel(`drink_logs_group_${cleanGroup}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drink_logs',
          filter: `group_id=eq.${cleanGroup}`,
        },
        () => {
          void refreshGroupData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, refreshGroupData]);

  // Synchroniser un clic sur le bouton principal ou un jour du calendrier
  const syncDateToggle = useCallback(
    async (dateKey: string, isNowValidated: boolean) => {
      const cleanName = userName.trim();
      const cleanGroup = groupId.trim();
      if (!cleanName || !cleanGroup) return;

      // Mise à jour optimiste immédiate de la liste du groupe
      setGroupLogs((prev) => {
        const filtered = prev.filter(
          (r) =>
            !(
              r.user_name.trim().toLowerCase() === cleanName.toLowerCase() &&
              r.logged_date === dateKey
            )
        );
        if (isNowValidated) {
          return [
            ...filtered,
            {
              user_name: cleanName,
              group_id: cleanGroup,
              logged_date: dateKey,
            },
          ];
        }
        return filtered;
      });

      try {
        if (isNowValidated) {
          // Vérifier d'abord s'il existe déjà pour éviter tout doublon même sans contrainte SQL
          const { data: existing } = await supabase
            .from('drink_logs')
            .select('id')
            .eq('user_name', cleanName)
            .eq('group_id', cleanGroup)
            .eq('logged_date', dateKey)
            .limit(1);

          if (!existing || existing.length === 0) {
            const { error } = await supabase.from('drink_logs').insert({
              user_name: cleanName,
              group_id: cleanGroup,
              logged_date: dateKey,
            });
            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from('drink_logs')
            .delete()
            .eq('user_name', cleanName)
            .eq('group_id', cleanGroup)
            .eq('logged_date', dateKey);

          if (error) throw error;
        }
      } catch (err: unknown) {
        console.warn('Erreur lors de la mise à jour Supabase:', err);
      }
    },
    [userName, groupId]
  );

  // Sauvegarder le profil et le groupe dans localStorage puis synchroniser
  const saveProfileAndGroup = useCallback(
    async (newName: string, newGroup: string) => {
      const cleanName = newName.trim();
      const cleanGroup = normalizeGroupCode(newGroup);
      if (!cleanName || !cleanGroup) return;

      setUserName(cleanName);
      setGroupId(cleanGroup);

      try {
        localStorage.setItem(USER_NAME_STORAGE_KEY, cleanName);
        localStorage.setItem(GROUP_ID_STORAGE_KEY, cleanGroup);
      } catch {
        // Ignore storage error
      }

      setIsModalOpen(false);
    },
    []
  );

  // Générer le lien d'invitation avec ?groupe=...
  const getInviteLink = useCallback(
    (customGroup?: string) => {
      const targetGroup = normalizeGroupCode(customGroup ?? groupId);
      if (typeof window === 'undefined') return '';
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      return targetGroup ? `${baseUrl}?groupe=${encodeURIComponent(targetGroup)}` : baseUrl;
    },
    [groupId]
  );

  // Agrégation des statistiques des membres du groupe pour le mois en cours
  const members = useMemo<GroupMemberStat[]>(() => {
    const currentMonthPrefix = todayKey.slice(0, 8); // "YYYY-MM-"
    const map = new Map<string, { displayName: string; dates: Set<string> }>();

    // Ajouter les logs reçus depuis Supabase
    for (const row of groupLogs) {
      const rawName = (row.user_name || '').trim();
      if (!rawName) continue;
      const key = rawName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { displayName: rawName, dates: new Set() });
      }
      if (row.logged_date) {
        map.get(key)!.dates.add(row.logged_date);
      }
    }

    // Toujours inclure l'utilisateur courant avec ses dates locales instantanées
    const cleanMyName = userName.trim();
    if (cleanMyName && groupId.trim()) {
      const myKey = cleanMyName.toLowerCase();
      if (!map.has(myKey)) {
        map.set(myKey, { displayName: cleanMyName, dates: new Set() });
      } else {
        map.get(myKey)!.displayName = cleanMyName;
      }
      for (const d of validatedDates) {
        map.get(myKey)!.dates.add(d);
      }
    }

    const list: GroupMemberStat[] = [];
    for (const [key, entry] of map.entries()) {
      const allDates = Array.from(entry.dates);
      const hasValidatedToday = entry.dates.has(todayKey);
      const monthCount = allDates.filter((d) => d.startsWith(currentMonthPrefix)).length;
      const isCurrentUser = Boolean(cleanMyName && key === cleanMyName.toLowerCase());

      list.push({
        userName: entry.displayName,
        hasValidatedToday,
        monthCount,
        isCurrentUser,
      });
    }

    // Trier : compteur du mois décroissant, puis validé aujourd'hui, puis ordre alphabétique
    return list.sort((a, b) => {
      if (b.monthCount !== a.monthCount) return b.monthCount - a.monthCount;
      if (a.hasValidatedToday !== b.hasValidatedToday) return a.hasValidatedToday ? -1 : 1;
      return a.userName.localeCompare(b.userName, 'fr');
    });
  }, [groupLogs, userName, groupId, validatedDates, todayKey]);

  return {
    userName,
    groupId,
    isConfigured,
    isModalOpen,
    setIsModalOpen,
    isLoadingGroup,
    syncError,
    members,
    saveProfileAndGroup,
    syncDateToggle,
    refreshGroupData,
    getInviteLink,
  };
}
