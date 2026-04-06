import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { theme } from '@/config/theme';

export interface AvatarProps {
  uri?: string;
  systemAvatarId?: number;
  size?: number;
  isOnline?: boolean;
  displayName?: string;
  showStatus?: boolean;
}

// Generar color basado en el ID del avatar del sistema
function getAvatarColor(id: number): string {
  const colors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.info,
  ];
  return colors[id % colors.length];
}

// Obtener iniciales del displayName
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  uri,
  systemAvatarId,
  size = 56,
  isOnline = false,
  displayName,
  showStatus = true,
}: AvatarProps) {
  // Si hay URI personalizada, usarla
  if (uri) {
    return (
      <View style={styles.container}>
        <PaperAvatar.Image size={size} source={{ uri }} />
        {showStatus && isOnline && (
          <View style={[styles.indicator, { width: size * 0.25, height: size * 0.25 }]} />
        )}
      </View>
    );
  }

  // Si hay un avatar del sistema, mostrar placeholder con color
  if (systemAvatarId !== undefined) {
    return (
      <View style={styles.container}>
        <PaperAvatar.Image
          size={size}
          source={{
            uri: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='${size}' height='${size}' fill='${encodeURIComponent(getAvatarColor(systemAvatarId))}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='${size * 0.4}' fill='white' font-weight='bold'>${displayName ? getInitials(displayName) : 'U'}</text></svg>`,
          }}
        />
        {showStatus && isOnline && (
          <View style={[styles.indicator, { width: size * 0.25, height: size * 0.25 }]} />
        )}
      </View>
    );
  }

  // Fallback: mostrar iniciales o ícono por defecto
  return (
    <View style={styles.container}>
      <PaperAvatar.Text
        size={size}
        label={displayName ? getInitials(displayName) : 'U'}
        color={theme.colors.textInverse}
        style={{ backgroundColor: theme.colors.primary }}
      />
      {showStatus && isOnline && (
        <View style={[styles.indicator, { width: size * 0.25, height: size * 0.25 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 999,
    backgroundColor: theme.colors.online,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
