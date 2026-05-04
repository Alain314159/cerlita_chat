import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '@/services/supabase/connection.service';
import { theme } from '@/config/theme';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button, Card, IconButton, ActivityIndicator } from 'react-native-paper';
import { Stack } from 'expo-router';

export default function RequestsScreen() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['connection-requests'],
    queryFn: () => connectionService.getIncomingRequests(),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => connectionService.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] }); // Recargar lista de chats
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => connectionService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Solicitudes de Chat', headerTitleAlign: 'center' }} />
      
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.centered}>
            <IconButton icon="heart-broken" size={48} iconColor={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes solicitudes pendientes por ahora.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <UserAvatar 
                photoURL={item.sender?.photo_url} 
                displayName={item.sender?.display_name || 'Alguien'} 
                size={50} 
              />
              <View style={styles.info}>
                <Text style={styles.name}>{item.sender?.display_name || 'Usuario desconocido'}</Text>
                <Text style={styles.msg} numberOfLines={1}>
                  {item.initial_message_encrypted ? 'Te envió un mensaje secreto...' : 'Quiere conectar contigo'}
                </Text>
              </View>
              <View style={styles.actions}>
                <IconButton 
                  icon="check-circle" 
                  iconColor={theme.colors.primary} 
                  size={28} 
                  onPress={() => acceptMutation.mutate(item.id)}
                  disabled={acceptMutation.isPending}
                />
                <IconButton 
                  icon="close-circle" 
                  iconColor={theme.colors.error} 
                  size={28} 
                  onPress={() => rejectMutation.mutate(item.id)}
                  disabled={rejectMutation.isPending}
                />
              </View>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  list: { padding: 16 },
  card: { marginBottom: 12, backgroundColor: theme.colors.surface, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  msg: { fontSize: 13, color: theme.colors.textSecondary },
  actions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 8 },
});
