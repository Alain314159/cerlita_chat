import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

interface StatusBadgeProps {
  isOnline: boolean;
  size?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isOnline, size = 12 }) => {
  return (
    <View style={[
      styles.badge, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: isOnline ? theme.colors.online : theme.colors.offline,
        borderColor: theme.colors.background,
        borderWidth: size / 6
      }
    ]} />
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
});
