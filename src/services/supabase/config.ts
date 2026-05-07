import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';

// Safe storage for SSR/SSG
const isWeb = Platform.OS === 'web';
const storage = isWeb 
  ? (typeof window !== 'undefined' ? AsyncStorage : undefined) 
  : AsyncStorage;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options) => {
      try {
        return await fetch(url, options);
      } catch (error) {
        console.error('[Supabase] Network error:', error);
        throw error;
      }
    },
  },
});
