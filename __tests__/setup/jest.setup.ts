
import { jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock de Supabase para evitar errores de red en tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ 
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis() 
    }),
    auth: { 
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    }
  })
}));

// Mock de Expo Modules
jest.mock('expo-font', () => ({ isLoaded: jest.fn().mockReturnValue(true), loadAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), getItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  setNotificationChannelAsync: jest.fn(),
}));

// Mock de React Native nativo
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-url-polyfill/auto', () => ({}));
