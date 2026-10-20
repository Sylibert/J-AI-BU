import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://tlskiupygrbmtjiximrt.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Vnt43oHN5GlC2CubafjZfQ_9Tgbv3Dw';

export interface DrinkLogRow {
  id?: string;
  user_name: string;
  group_id: string;
  logged_date: string; // Format YYYY-MM-DD
  created_at?: string;
}

export interface GroupMemberStat {
  userName: string;
  hasValidatedToday: boolean;
  monthCount: number;
  isCurrentUser: boolean;
}

declare global {
  interface Window {
    supabase?: {
      createClient: typeof createClient;
    };
  }
}

// Utilise le client CDN global s'il est disponible dans <head>, sinon le module NPM
const createSupabase = (): SupabaseClient => {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
};

export const supabase = createSupabase();
