import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/config/theme';
import { supabase } from '@/services/supabase/config';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/supabase/chat.service';
import type { User } from '@/types';
import { Search, UserPlus, Users } from 'lucide-react-native';

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        .neq('id', user?.id)
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
      setLoading(true);
      const chatId = await chatService.getOrCreateDirectChat(user.id, selectedUser.id);
      if (!chatId) throw new Error('No se pudo crear la conexión');
      router.push(`/(chat)/${chatId}` as any);
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el chat');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      <Avatar.Image
        size={56}
        source={item.photoURL ? { uri: item.photoURL } : require('@/assets/images/default-avatar.png')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <UserPlus size={20} color={theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo Chat</Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar usuarios..."
          onChangeText={searchUsers}
          value={searchQuery}
          style={styles.searchbar}
          icon={() => <Search size={20} color={theme.colors.secondary} />}
          inputStyle={{ fontSize: 16 }}
        />
      </View>

      {searching || (loading && !searchQuery) ? (
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
              <View style={styles.emptyIconContainer}>
                {searchQuery ? <Search size={64} color={theme.colors.secondary} /> : <Users size={64} color={theme.colors.secondary} />}
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'No tienes contactos'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Prueba con otro nombre' : 'Busca a alguien para chatear'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF69B4' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchbar: { elevation: 0, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
  sectionTitle: { padding: 16, fontSize: 12, fontWeight: 'bold', color: '#888', backgroundColor: '#f9f9f9', textTransform: 'uppercase' },
  listContent: { flexGrow: 1 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 14, color: '#888' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyIconContainer: { marginBottom: 16, opacity: 0.3 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#444' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 },
});
