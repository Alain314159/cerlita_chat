import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Searchbar, FAB } from 'react-native-paper';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/config/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatListScreen() {
  const { user } = useAuth();
  const { chats, loading, loadChats } = useChat();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadChats(user.id);
    }
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    if (user) {
      setRefreshing(true);
      await loadChats(user.id);
      setRefreshing(false);
    }
  }, [user]);

  const filteredChats = chats.filter((chat) => {
    const participantName = chat.participantsInfo[chat.participants.find((p) => p !== user?.id) || '']?.displayName || '';
    return participantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }: any) => {
    const otherUserId = item.participants.find((p: string) => p !== user?.id);
    const participantInfo = item.participantsInfo[otherUserId];
    const displayName = participantInfo?.displayName || 'Usuario';
    const photoURL = participantInfo?.photoURL;
    const isOnline = participantInfo?.isOnline || false;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/(chat)/${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={56}
            source={photoURL ? { uri: photoURL } : require('@/assets/images/default-avatar.png')}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.displayName}>{displayName}</Text>
            {item.lastMessageAt && (
              <Text style={styles.time}>
                {format(new Date(item.lastMessageAt), 'HH:mm', { locale: es })}
              </Text>
            )}
          </View>
          
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💕 Cerlita Chat</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar chats..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
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

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(chat)/new-chat')}
        color={theme.colors.textInverse}
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
