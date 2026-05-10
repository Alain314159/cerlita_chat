import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatService } from '@/services/supabase/chat.service';
import type { Chat } from '@/types';

export function useChatsQuery(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['chats', userId];

  const query = useQuery<Chat[], Error>({
    queryKey,
    queryFn: () => chatService.getUserChats(userId || ''),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // 🔔 Sincronización en tiempo real integrada (Maestro 2026)
  useEffect(() => {
    if (!userId) return;

    console.log('[useChatsQuery] Subscribing to chat updates:', userId);
    const subscription = chatService.subscribeToUserChats(userId, (payload) => {
      console.log('[useChatsQuery] Realtime update:', payload.eventType);
      // Invalidar caché para forzar recarga de la lista
      queryClient.invalidateQueries({ queryKey });
    });

    return () => {
      console.log('[useChatsQuery] Unsubscribing');
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return query;
}
