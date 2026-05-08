import React, { useCallback, useMemo } from 'react';
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
import { Heart, PlusCircle, Search } from 'lucide-react-native';
import { useTheme, Text, Button } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { Chat } from '@/types';
import { haptics } from '@/services/haptics';
import { Avatar } from '@/components/ui/Avatar';
import { chatService } from '@/services/supabase/chat.service';

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
  const isOnline = !!recipientInfo.isOnline;
  
  const handlePress = useCallback(() => {
    haptics.medium();
    onPress(chat.id);
  }, [chat.id, onPress]);

  const handleLongPress = useCallback(() => {
    haptics.heavy();
    Alert.alert(
      'Eliminar chat',
      '¿Estás seguro de que quieres eliminar esta conversación?',
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
  }, [chat.id, currentUserId, queryClient]);

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Chat con ${displayName}`}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          size={56}
          displayName={displayName}
          photoURL={recipientInfo.photo}
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
  const [searchQuery, setSearchQuery] = React.useState('');
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const { data: chats = [], isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: () => chatService.getUserChats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30,   // 30 min
  });

  // 🔔 Sincronización en tiempo real (Maestro 2026)
  useEffect(() => {
    if (!user?.id) return;

    console.log('[ChatList] Subscribing to chat updates for:', user.id);
    const channel = chatService.subscribeToUserChats(user.id, (payload) => {
      console.log('[ChatList] Realtime update received:', payload.eventType);
      // Invalidar caché para forzar recarga de la lista
      queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
    });

    return () => {
      console.log('[ChatList] Unsubscribing from chat updates');
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const filteredChats = useMemo(() =>
    chats.filter((chat) => {
      const name = chat.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [chats, searchQuery]
  );

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <ChatItem 
      chat={item} 
      onPress={(id) => router.push(`/(chat)/${id}`)} 
      currentUserId={user?.id}
    />
  ), [user?.id, router]);

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>Error al cargar chats</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Chats</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Search size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          placeholder="Buscar chats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading && chats.length > 0} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No se encontraron chats</Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
          )
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
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarContainer: {
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
    borderBottomWidth: 0.5,
    paddingBottom: 12,
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
    fontSize: 13,
  },
  lastMessage: {
    fontSize: 15,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
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
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
