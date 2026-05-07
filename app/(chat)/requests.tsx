import React from 'react';
import { View, FlatList, StyleSheet, Text, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '@/services/supabase/connection.service';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button, Card, IconButton, ActivityIndicator, useTheme } from 'react-native-paper';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RequestsScreen() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { user } = useAuthStore();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['connection-requests', user?.id],
    queryFn: () => connectionService.getIncomingRequests(),
    enabled: !!user?.id,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => connectionService.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error) => {
      Alert.alert('Error', 'No se pudo aceptar la solicitud. Verifica tu conexión.');
      console.error('Accept error:', error);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => connectionService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests', user?.id] });
    },
    onError: (error) => {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
      console.error('Reject error:', error);
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: 'Solicitudes de Chat', headerTitleAlign: 'center' }} />
      
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.centered}>
            <IconButton icon="heart-broken" size={48} iconColor={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No tienes solicitudes pendientes por ahora.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <UserAvatar 
                photoURL={item.sender?.photoURL || item.sender?.photo_url} 
                size={50} 
              />
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                  {item.sender?.displayName || item.sender?.display_name || 'Usuario desconocido'}
                </Text>
                <Text style={[styles.msg, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  list: { padding: 16 },
  card: { marginBottom: 12, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold' },
  msg: { fontSize: 13 },
  actions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 8 },
});
