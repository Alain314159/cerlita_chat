import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type TermuxKey = 'ESC' | 'TAB' | 'CTRL' | 'ALT' | '-' | '/' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TermuxKeyBarProps {
  onKeyPress: (key: TermuxKey) => void;
}

const KEYS: { label: string; value: TermuxKey; isIcon?: boolean }[] = [
  { label: 'ESC', value: 'ESC' },
  { label: 'TAB', value: 'TAB' },
  { label: 'CTRL', value: 'CTRL' },
  { label: 'ALT', value: 'ALT' },
  { label: '-', value: '-' },
  { label: '/', value: '/' },
  { label: 'arrow-up', value: 'UP', isIcon: true },
  { label: 'arrow-down', value: 'DOWN', isIcon: true },
  { label: 'arrow-left', value: 'LEFT', isIcon: true },
  { label: 'arrow-right', value: 'RIGHT', isIcon: true },
];

export const TermuxKeyBar: React.FC<TermuxKeyBarProps> = ({ onKeyPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {KEYS.map((key) => (
          <TouchableOpacity
            key={key.value}
            style={styles.keyButton}
            onPress={() => onKeyPress(key.value)}
          >
            {key.isIcon ? (
              <MaterialCommunityIcons name={key.label as any} size={20} color="#FFF" />
            ) : (
              <Text style={styles.keyText}>{key.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    backgroundColor: '#1c1c1e', // Dark terminal-like color
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  keyButton: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    marginHorizontal: 3,
    borderRadius: 6,
  },
  keyText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
