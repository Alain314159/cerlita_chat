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
import { Heart, PlusCircle, Search } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';

import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Chat, AvatarOption } from '@/types';
import { haptics } from '@/services/haptics';
import { Avatar } from '@/components/ui/Avatar';

// Componente memoizado para cada item de chat
const ChatItem = React.memo(function ChatItem({ chat, onPress, currentUserId }: {
  chat: Chat;
  onPress: (chatId: string) => void;
  currentUserId?: string;
}) {
  const theme = useTheme();
  const recipientInfo = useMemo(() => {
    if (chat.name) return { name: chat.name, photo: undefined };
    
    const other = chat.participants?.find(p => (p.user_id || p.id) !== currentUserId);
    if (other) {
      const u = other.users || other;
      return { 
        name: u.display_name || u.displayName || 'Usuario',
        photo: u.photo_url || u.photoURL,
        isOnline: u.is_online || u.isOnline
      };
    }
    return { name: 'Chat', photo: undefined };
  }, [chat, currentUserId]);

  const displayName = recipientInfo.name;
  const isOnline = !!recipientInfo.isOnline;
  
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
  const { chats, loading, loadChats } = useChat();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
    <ChatItem 
      chat={item} 
      onPress={(id) => useRouter().push(`/(chat)/${id}`)} 
      currentUserId={user?.id}
    />
  ), [user?.id]);

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
            refreshing={refreshing} 
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
});
