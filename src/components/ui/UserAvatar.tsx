import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { theme } from '@/config/theme';
import type { ImageSourcePropType } from 'react-native';

interface UserAvatarProps {
  photoURL?: string | null;
  isOnline?: boolean;
  size?: number;
  style?: any;
}

export function UserAvatar({ photoURL, isOnline = false, size = 56, style }: UserAvatarProps) {
  const source: ImageSourcePropType = photoURL
    ? { uri: photoURL }
    : require('@/assets/images/default-avatar.png');

  return (
    <View style={[styles.container, style]}>
      <Avatar.Image size={size} source={source} />
      {isOnline && <View style={[styles.indicator, { width: size * 0.25, height: size * 0.25 }]} />}
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
