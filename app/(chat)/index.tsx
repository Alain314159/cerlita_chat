import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Searchbar, FAB } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/config/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Chat, AvatarOption } from '@/types';
import { haptics } from '@/services/haptics';
import { Avatar } from '@/components/ui/Avatar';

// Componente memoizado para cada item de chat
const ChatItem = React.memo(function ChatItem({ chat, onPress }: {
  chat: Chat;
  onPress: (chatId: string) => void;
}) {
  const otherParticipant = chat.participants?.find((p: any) => p?.users) as any;
  const participantInfo = otherParticipant?.users;
  const displayName = participantInfo?.display_name || chat.name || 'Usuario';
  const photoURL = participantInfo?.photo_url;
  const isOnline = participantInfo?.is_online || false;
  
  // Construir avatar option
  const userAvatar: AvatarOption | undefined = participantInfo?.avatar || (
    photoURL ? { type: 'custom', uri: photoURL } : undefined
  );

  const handlePress = useCallback(() => {
    haptics.medium();
    onPress(chat.id);
  }, [chat.id, onPress]);

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Chat con ${displayName}`}
      accessibilityHint={`Abrir conversación con ${displayName}`}
      testID={`chat-item-${chat.id}`}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          uri={userAvatar?.type === 'custom' ? userAvatar.uri : undefined}
          systemAvatarId={userAvatar?.type === 'system' ? userAvatar.systemId : undefined}
          size={56}
          displayName={displayName}
          isOnline={isOnline}
        />
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.displayName}>{displayName}</Text>
          {chat.lastMessageAt && (
            <Text style={styles.time}>
              {format(new Date(chat.lastMessageAt), 'HH:mm', { locale: es })}
            </Text>
          )}
        </View>

        {chat.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage}
          </Text>
        )}
      </View>

      {chat.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function ChatListScreen() {
  const { user } = useAuth();
  const { chats, loading, loadChats } = useChat();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await loadChats(user.id);
      setRefreshing(false);
    }
  }, [user]);

  const filteredChats = useMemo(() =>
    chats.filter((chat) => {
      const otherUserId = chat.participants.find((p) => p !== user?.id);
      const participantName = chat.participantsInfo[otherUserId || '']?.displayName || '';
      return participantName.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [chats, searchQuery, user?.id]
  );

  const handleChatPress = useCallback((chatId: string) => {
    router.push(`/(chat)/${chatId}`);
  }, []);

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <ChatItem
      chat={item}
      onPress={handleChatPress}
    />
  ), [handleChatPress]);

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>💕 Cerlita Chat</Text>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar chats..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          accessibilityLabel="Buscar chats"
        />
      </View>

      {/* Lista de Chats */}
      <FlashList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={80}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No hay chats todavía</Text>
            <Text style={styles.emptySubtitle}>
              Comienza una nueva conversación
            </Text>
          </View>
        }
      />

      {/* Botón flotante */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + theme.spacing.lg }]}
        onPress={() => {
          haptics.medium();
          router.push('/(chat)/new-chat');
        }}
        color={theme.colors.textInverse}
        accessibilityRole="button"
        accessibilityLabel="Nuevo chat"
        testID="new-chat-fab"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchbar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.online,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  time: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
