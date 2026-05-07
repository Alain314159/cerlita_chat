
import { jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Set dummy env vars for tests to suppress warnings
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

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
      contains: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn(), randomUUID: jest.fn().mockReturnValue('mock-uuid') }));
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

const mockColors = {
  primary: '#6750A4',
  primaryContainer: '#EADDFF',
  secondary: '#625B71',
  surface: '#FFFFFF',
  background: '#FFFFFF',
  error: '#B3261E',
  onSurface: '#000000',
  onSurfaceVariant: '#49454F',
  surfaceVariant: '#E7E0EC',
  text: '#000000',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textInverse: '#FFFFFF',
  border: '#CCCCCC',
  online: '#00FF00',
  offline: '#666666',
  typing: '#6750A4',
  tickRead: '#34B7F1',
  tickDelivered: '#8E8E93',
  elevation: { level0: 'transparent', level1: '#F7F2FA' },
};

const mockTheme = {
  dark: false,
  mode: 'adaptive',
  roundness: 4,
  colors: mockColors,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  fonts: {
    bodyLarge: { fontFamily: 'System', fontWeight: '400', letterSpacing: 0, lineHeight: 24, fontSize: 16 },
  },
  animation: { scale: 1.0 },
};

jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, TextInput: RNTextInput } = require('react-native');
  
  return {
    IconButton: (props: any) => {
      const { icon, testID, accessibilityLabel, disabled } = props;
      return React.createElement('IconButton', { 
        ...props, 
        accessibilityRole: 'button',
        accessibilityState: { disabled: !!disabled },
        accessibilityLabel: accessibilityLabel || (typeof icon === 'string' ? `icon-${icon}` : undefined),
        testID: testID || (typeof icon === 'string' ? `icon-button-${icon}` : undefined)
      });
    },
    TextInput: React.forwardRef((props: any, ref: any) => {
      return React.createElement(RNTextInput, { ...props, ref });
    }),
    MD3LightTheme: mockTheme,
    MD3DarkTheme: { ...mockTheme, dark: true },
    useTheme: () => mockTheme,
    withTheme: (Component: any) => (props: any) => React.createElement(Component, { ...props, theme: mockTheme }),
    Provider: ({ children }: any) => children,
    PaperProvider: ({ children }: any) => children,
    Portal: ({ children }: any) => children,
    Modal: ({ children }: any) => children,
  };
});

// Mock de React Native nativo
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Send: (props: any) => React.createElement(View, { ...props, testID: 'lucide-send' }),
    Camera: (props: any) => React.createElement(View, { ...props, testID: 'lucide-camera' }),
    Mic: (props: any) => React.createElement(View, { ...props, testID: 'lucide-mic' }),
    Paperclip: (props: any) => React.createElement(View, { ...props, testID: 'lucide-paperclip' }),
    Check: (props: any) => React.createElement(View, { ...props, testID: 'lucide-check' }),
    CheckCheck: (props: any) => React.createElement(View, { ...props, testID: 'lucide-check-check' }),
  };
});
