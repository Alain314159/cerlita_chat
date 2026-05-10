import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, Text, Button } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/types';
import { haptics } from '@/services/haptics';
import { Avatar } from '@/components/ui/Avatar';
import { chatService } from '@/services/supabase/chat.service';

import { useChatsQuery } from '@/hooks/useChatsQuery';

// Componente memoizado para cada item de chat
const ChatItem = React.memo(function ChatItem({ chat, onPress, currentUserId }: {
  chat: Chat;
  onPress: (chatId: string) => void;
  currentUserId?: string;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const recipientInfo = useMemo(() => {
    if (chat.recipient) {
      return {
        name: chat.recipient.displayName,
        photo: chat.recipient.photoURL,
        isOnline: chat.recipient.isOnline
      };
    }
    
    if (chat.name) return { name: chat.name, photo: undefined };
    
    return { name: 'Chat', photo: undefined };
  }, [chat]);

  const displayName = recipientInfo.name;
  const isOnline = recipientInfo.isOnline;

  const handlePress = () => {
    onPress(chat.id);
  };

  const handleLongPress = () => {
    haptics.heavy();
    Alert.alert(
      'Eliminar chat',
      `¿Estás seguro de que quieres eliminar la conversación con ${displayName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteChat(chat.id);
              await queryClient.invalidateQueries({ queryKey: ['chats', currentUserId] });
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el chat');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Chat con ${displayName}`}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          size={56}
          displayName={displayName}
          photoURL={recipientInfo.photo || undefined}
          isOnline={isOnline}
        />
      </View>

      <View style={[styles.chatInfo, { borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={styles.chatHeader}>
          <Text style={[styles.displayName, { color: theme.colors.onSurface }]}>{displayName}</Text>
          {chat.lastMessageAt && (
            <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
              {format(new Date(chat.lastMessageAt), 'HH:mm', { locale: es })}
            </Text>
          )}
        </View>

        <Text style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
          {chat.lastMessage || 'No hay mensajes'}
        </Text>
      </View>

      {chat.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.unreadText}>{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function ChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: chats, isLoading, isError, refetch } = useChatsQuery(user?.id || '');

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    if (!searchQuery.trim()) return chats;
    
    return chats.filter(chat => {
      const name = chat.recipient?.displayName || chat.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Mensajes</Text>
        <TouchableOpacity onPress={() => router.push('/(chat)/new-chat')}>
          <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            placeholder="Buscar chats..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem 
            chat={item} 
            onPress={(id) => router.push(`/(chat)/${id}`)} 
            currentUserId={user?.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="heart-outline" size={64} color={theme.colors.outline} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery ? 'No se encontraron chats' : 'No tienes conversaciones aún'}
            </Text>
            {!searchQuery && (
              <Button 
                mode="contained" 
                onPress={() => router.push('/(chat)/new-chat')}
                style={{ marginTop: 20 }}
              >
                Buscar personas
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
