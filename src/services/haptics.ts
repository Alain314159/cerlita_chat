import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Servicio de retroalimentación háptica
 * Proporciona feedback táctil en interacciones del usuario
 */
export const haptics = {
  // Impacto ligero
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.error);
    }
  },

  // Impacto medio
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(console.error);
    }
  },

  // Impacto fuerte
  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(console.error);
    }
  },

  // Notificación de éxito
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(console.error);
    }
  },

  // Notificación de error
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(console.error);
    }
  },

  // Notificación de advertencia
  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(console.error);
    }
  },

  // Selección (para pickers, sliders, etc.)
  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(console.error);
    }
  },
};
