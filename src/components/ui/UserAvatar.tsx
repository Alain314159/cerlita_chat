import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';

interface UserAvatarProps {
  photoURL?: string | null;
  isOnline?: boolean;
  size?: number;
  style?: any;
  accessibilityLabel?: string;
}

export function UserAvatar({ photoURL, isOnline = false, size = 56, style, accessibilityLabel }: UserAvatarProps) {
  const theme = useTheme();
  
  const source = photoURL 
    ? { uri: photoURL } 
    : undefined;

  return (
    <View style={[styles.container, style]} accessibilityLabel={accessibilityLabel}>
      <Avatar.Image 
        size={size} 
        source={source as any}
        onError={() => console.warn('[UserAvatar] Failed to load:', photoURL)}
      />
      {isOnline && (
        <View 
          style={[styles.indicator, { 
            width: size * 0.25, 
            height: size * 0.25, 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.surface 
          }]} 
          accessibilityLabel="Usuario en línea"
        />
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
    borderWidth: 2,
  },
});
