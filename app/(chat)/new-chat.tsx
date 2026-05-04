import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/config/theme';
import { supabase } from '@/services/supabase/config';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/supabase/chat.service';
import type { User } from '@/types';

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Cargar contactos (conexiones aceptadas)
  const loadContacts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          sender:sender_id (*),
          receiver:receiver_id (*)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      const contactList = data.map((conn: any) => 
        conn.sender.id === user.id ? conn.receiver : conn.sender
      );
      setContacts(contactList);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user?.id]);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = async (selectedUser: User) => {
    if (!user?.id) return;
    try {
      const chatId = await chatService.getOrCreateDirectChat(user.id, selectedUser.id);
      router.replace(`/(chat)/${chatId}` as any);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
      accessibilityRole="button"
      accessibilityLabel={`Iniciar chat con ${item.displayName}`}
      testID={`user-${item.id}`}
    >
      <Avatar.Image
        size={56}
        source={item.photoURL ? { uri: item.photoURL } : require('@/assets/images/default-avatar.png')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo Chat</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar nuevos usuarios..."
          onChangeText={searchUsers}
          value={searchQuery}
          style={styles.searchbar}
          accessibilityLabel="Buscar usuarios"
          testID="user-search"
        />
      </View>

      {/* List */}
      {searching || loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchQuery ? users : contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={!searchQuery && contacts.length > 0 ? (
            <Text style={styles.sectionTitle}>Mis Contactos</Text>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '👥'}</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'No tienes contactos'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Intenta con otro nombre' 
                  : 'Busca a alguien para enviarle una solicitud'}
              </Text>
            </View>
          }
        />
      )}
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
  sectionTitle: {
    padding: theme.spacing.md,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    backgroundColor: theme.colors.backgroundSecondary,
    textTransform: 'uppercase',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  userInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
