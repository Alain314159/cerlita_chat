import { supabase } from './config';
import { RealtimeChannel } from '@supabase/supabase-js';
import { mapDatabaseChatToDomain } from './mappers/chat.mapper';
import type { Chat } from '@/types';

export const chatService = {
  // Get all chats for a user (Maestro 2026: Strong Typing & Mappers)
  async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*, participants:chat_participants(user_id, users(*))')
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(chat => mapDatabaseChatToDomain(chat, userId));
  },

  // Get chat by ID
  async getChatById(chatId: string, userId?: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('*, participants:chat_participants(user_id, users(*))')
      .eq('id', chatId)
      .single();

    if (error) return null;
    return mapDatabaseChatToDomain(data, userId);
  },

  // Get or create a direct chat between two users
  async getOrCreateDirectChat(user1Id: string, user2Id: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
      user1_id: user1Id,
      user2_id: user2Id,
    });

    if (error) throw new Error(error.message);
    return data as string;
  },

  // Get participants for a chat
  async getParticipants(chatId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('*, user:users(*)')
      .eq('chat_id', chatId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Delete a chat and its messages
  async deleteChat(chatId: string): Promise<void> {
    // Primero eliminar mensajes
    await supabase.from('messages').delete().eq('chat_id', chatId);
    // Luego eliminar participantes
    await supabase.from('chat_participants').delete().eq('chat_id', chatId);
    // Por último eliminar el chat
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    
    if (error) throw new Error(error.message);
  },

  // Update last message in chat (Optional: trigger handles this, but kept for manual overrides)
  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update({
        last_message_id: messageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId);

    if (error) throw new Error(error.message);
  },

  // Subscribe to chat updates
  subscribeToUserChats(userId: string, onUpdate: (payload: any) => void): RealtimeChannel {
    // 🔧 FIX ULTRA 2026: Supabase Realtime 'cs' is unreliable for arrays.
    // Instead, we subscribe to the chat_participants table for the current user.
    // When a user is added to a chat, the list should refresh.
    return supabase
      .channel(`user_chats:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate({ eventType: 'REFRESH' });
        }
      )
      // Also listen for updates to chats the user is already in (last_message_id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          // Verify if the user is a participant of the updated chat locally
          onUpdate(payload);
        }
      )
      .subscribe();
  },
};
