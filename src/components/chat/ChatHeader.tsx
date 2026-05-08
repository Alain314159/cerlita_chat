import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { StatusBadge } from '../ui/StatusBadge';

interface ChatHeaderProps {
  name?: string;
  isTyping?: boolean;
  isOnline?: boolean;
  photoUrl?: string;
  onOpenOptions: () => void;
  loading?: boolean;
}

import { ArrowLeft, MoreVertical } from 'lucide-react-native';

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  name, 
  isTyping, 
  isOnline = false,
  photoUrl, 
  onOpenOptions,
  loading
}) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <IconButton 
        icon={() => <ArrowLeft size={24} color={theme.colors.textPrimary} />} 
        onPress={() => router.back()} 
      />
      <View>
        {photoUrl ? (
          <Avatar.Image size={40} source={{ uri: photoUrl }} />
        ) : (
          <Avatar.Image size={40} source={require('../../../assets/images/default-avatar.png')} />
        )}
        <StatusBadge isOnline={isOnline} size={14} />
      </View>
      <View style={styles.headerInfo}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />
        ) : (
          <>
            <Text style={styles.headerName} numberOfLines={1}>{name || 'Usuario'}</Text>
            {isTyping && <Text style={styles.typingText}>escribiendo...</Text>}
          </>
        )}
      </View>
      <IconButton 
        icon={() => <MoreVertical size={24} color={theme.colors.textPrimary} />} 
        onPress={onOpenOptions} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: theme.spacing.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  headerInfo: { 
    flex: 1, 
    marginLeft: theme.spacing.sm 
  },
  headerName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: theme.colors.textPrimary 
  },
  typingText: { 
    fontSize: 12, 
    color: theme.colors.typing, 
    fontStyle: 'italic' 
  },
});
