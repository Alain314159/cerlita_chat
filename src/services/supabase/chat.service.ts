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
    return (data || []).map(mapDatabaseChatToDomain);
  },

  // Get chat by ID
  async getChatById(chatId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('*, participants:chat_participants(user_id, users(*))')
      .eq('id', chatId)
      .single();

    if (error) return null;
    return mapDatabaseChatToDomain(data);
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
    return supabase
      .channel(`public:chats:participants=${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          // Filtro optimizado para participantes
          filter: `participant_ids=cs.{${userId}}`,
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  },
};
