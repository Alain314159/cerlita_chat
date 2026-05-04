import { MD3LightTheme } from 'react-native-paper';

// Theme configuration - Romantic theme
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Fix for Material Design 3 elevation colors
    elevation: {
      level0: 'transparent',
      level1: '#FFF0F5',
      level2: '#FFEBEE',
      level3: '#FCE4EC',
      level4: '#F8BBD0',
      level5: '#F48FB1',
    },
    // Primary - Rosa
    primary: '#FF69B4',
    primaryContainer: '#FFF0F5',
    onPrimaryContainer: '#FF1493',
    primaryLight: '#FFB6C1',
    primaryDark: '#FF1493',
    primaryMuted: '#FFF0F5',
    
    // Secondary - Gris Koala
    secondary: '#8E8E93',
    secondaryContainer: '#F2F2F7',
    secondaryLight: '#F2F2F7',
    secondaryDark: '#636366',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    
    // Messages
    messageSent: '#FF69B4',
    messageSentText: '#FFFFFF',
    messageReceived: '#F2F2F7',
    messageReceivedText: '#1C1C1E',
    
    // Ticks
    tickSent: '#8E8E93',
    tickDelivered: '#8E8E93',
    tickRead: '#34B7F1',
    
    // Status
    online: '#34C759',
    offline: '#8E8E93',
    typing: '#FF69B4',
    
    // Text
    text: '#1C1C1E',
    textMain: '#1C1C1E',
    textPrimary: '#1C1C1E',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    textInverse: '#FFFFFF',
    textLink: '#FF1493',
    onSurface: '#1C1C1E',
    onSurfaceVariant: '#8E8E93',
    
    // System
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    errorLight: '#FFEBEE',
    info: '#5AC8FA',

    // Borders
    border: '#E5E5EA',
    borderLight: '#F2F2F7',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    tiny: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 16,
    },
    caption: {
      fontSize: 11,
      fontWeight: 'normal' as const,
      lineHeight: 14,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;
