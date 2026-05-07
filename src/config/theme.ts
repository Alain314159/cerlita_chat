import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Romantic Theme Colors - Light
export const lightColors = {
  ...(MD3LightTheme?.colors || {}),
  primary: '#FF69B4',
  primaryContainer: '#FFF0F5',
  onPrimaryContainer: '#FF1493',
  secondary: '#8E8E93',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  textInverse: '#FFFFFF',
  textLink: '#FF69B4',
  border: '#E5E5EA',
  online: '#34C759',
  offline: '#8E8E93',
  typing: '#FF69B4',
  messageSent: '#FF69B4',
  messageSentText: '#FFFFFF',
  messageReceived: '#F2F2F7',
  messageReceivedText: '#1C1C1E',
  tickRead: '#34B7F1',
  tickDelivered: '#8E8E93',
  error: '#FF3B30',
};

// Romantic Theme Colors - Dark
export const darkColors = {
  ...(MD3DarkTheme?.colors || {}),
  primary: '#FF69B4',
  primaryContainer: '#4D1B31',
  onPrimaryContainer: '#FFB6C1',
  secondary: '#8E8E93',
  background: '#1C1C1E',
  backgroundSecondary: '#2C2C2E',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textInverse: '#1C1C1E',
  textLink: '#FF69B4',
  border: '#38383A',
  online: '#32D74B',
  offline: '#8E8E93',
  typing: '#FF69B4',
  messageSent: '#FF69B4',
  messageSentText: '#FFFFFF',
  messageReceived: '#3A3A3C',
  messageReceivedText: '#FFFFFF',
  tickRead: '#34B7F1',
  tickDelivered: '#8E8E93',
  error: '#FF3B30',
};

const commonSettings = {
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  borderRadius: {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
  },
  shadows: {
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

export const theme = {
  ...MD3LightTheme,
  ...commonSettings,
  colors: lightColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  ...commonSettings,
  colors: darkColors,
};
