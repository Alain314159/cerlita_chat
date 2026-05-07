import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Searchbar, ActivityIndicator, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/supabase/chat.service';
import { userService } from '@/services/supabase/user.service';
import type { User } from '@/types';
import { Search, UserPlus, Users } from 'lucide-react-native';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NewChatScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const loadContacts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const contactList = await userService.getContacts(user.id);
      setContacts(contactList);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch(debouncedQuery);
    } else {
      setUsers([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async (searchQuery: string) => {
    if (!user?.id) return;
    try {
      setSearching(true);
      const results = await userService.searchUsers(user.id, searchQuery);
      setUsers(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = async (selectedUser: User) => {
    if (!user?.id) return;
    
    Alert.alert(
      'Conectar',
      `¿Quieres iniciar un chat con ${selectedUser.displayName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Conectar', 
          onPress: async () => {
            try {
              setLoading(true);
              const chatId = await chatService.getOrCreateDirectChat(user.id, selectedUser.id);
              if (!chatId) throw new Error('No se pudo crear la conexión');
              router.push(`/(chat)/${chatId}`);
            } catch (error: any) {
              console.error('Failed to create chat:', error);
              Alert.alert('Error', error.message || 'No se pudo crear el chat');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={() => handleSelectUser(item)}
    >
      <Avatar.Image
        size={56}
        source={item.photoURL ? { uri: item.photoURL } : require('@/assets/images/default-avatar.png')}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.onSurface }]}>{item.displayName}</Text>
        <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>{item.email}</Text>
      </View>
      <UserPlus size={20} color={theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Descubrir</Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar usuarios..."
          onChangeText={setQuery}
          value={query}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant, elevation: 0 }]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ fontSize: 16, color: theme.colors.onSurface }}
          icon={() => <Search size={20} color={theme.colors.onSurfaceVariant} />}
        />
      </View>

      {searching || (loading && !query) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={query ? users : contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={!query && contacts.length > 0 ? (
            <Text style={[styles.sectionTitle, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant }]}>Mis Contactos</Text>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                {query ? <Search size={64} color={theme.colors.onSurfaceVariant} /> : <Users size={64} color={theme.colors.onSurfaceVariant} />}
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                {query ? 'Sin resultados' : 'No tienes contactos'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {query ? 'Prueba con otro nombre' : 'Busca a alguien para chatear'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchbar: { elevation: 0, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { padding: 16, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  listContent: { flexGrow: 1 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyIconContainer: { marginBottom: 16, opacity: 0.3 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },
});
