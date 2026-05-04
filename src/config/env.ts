import { Platform } from 'react-native';

// Environment variables from app.json or .env
// Usamos acceso estático directo para que Metro las inyecte correctamente en web
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (SUPABASE_URL.includes('placeholder') || SUPABASE_ANON_KEY.includes('placeholder')) {
  console.warn(
    '⚠️ Supabase credentials not configured. Copy .env.example to .env and add your credentials.'
  );
}

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  
  app: {
    name: 'Cerlita Chat',
    version: '1.0.0',
    scheme: 'cerlitachat',
  },
  
  features: {
    enableTypingIndicator: true,
    enablePresence: true,
    enableNotifications: true,
    enableE2EEncryption: true,
    maxImageSizeMB: 10,
    maxVideoSizeMB: 50,
    messagePageSize: 50,
  },
  
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
};
