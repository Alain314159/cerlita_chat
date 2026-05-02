import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { theme } from '@/config/theme';
import { Chat, AvatarOption } from '@/types';
import { haptics } from '@/services/haptics';
import { Avatar } from '@/components/ui/Avatar';

// Componente memoizado para cada item de chat
const ChatItem = React.memo(function ChatItem({ chat, onPress }: {
  chat: Chat;
  onPress: (chatId: string) => void;
}) {
  const displayName = chat.name || 'Chat';
  const isOnline = false;
  
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
    >
      <View style={styles.avatarContainer}>
        <Avatar
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

        <Text style={styles.lastMessage} numberOfLines={1}>
          {chat.lastMessage || 'No hay mensajes'}
        </Text>
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
  }, [user, loadChats]);

  const filteredChats = useMemo(() =>
    chats.filter((chat) => {
      const name = chat.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [chats, searchQuery]
  );

  const renderItem = useCallback(({ item }: { item: Chat }) => (
    <ChatItem chat={item} onPress={(id) => useRouter().push(`/(chat)/${id}`)} />
  ), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={() => useRouter().push('/(chat)/new')}>
          <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar chats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron chats</Text>
            </View>
          ) : null
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text,
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
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.text,
  },
  time: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.textSecondary,
  },
});
