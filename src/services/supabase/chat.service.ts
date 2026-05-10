import { supabase } from './config';
import { RealtimeChannel } from '@supabase/supabase-js';
import { mapDatabaseChatToDomain } from './mappers/chat.mapper';
import type { Chat } from '@/types';

export const chatService = {
  // Get all chats for a user (Maestro 2026: Strong Typing & Mappers)
  async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('chat:chats(*, participants:chat_participants(user_id, users(*)))')
      .eq('user_id', userId)
      .order('chat(updated_at)', { ascending: false });

    if (error) throw new Error(error.message);
    
    // Mapear correctamente desde la tabla de unión
    return (data || [])
      .filter(row => row.chat) // Evitar nulos si hay inconsistencias
      .map(row => mapDatabaseChatToDomain(row.chat, userId));
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

  // Delete a chat and its messages (Maestro 2026: Safe Atomic Deletion)
  async deleteChat(chatId: string): Promise<void> {
    // 1. Romper la referencia circular del last_message_id (Fundamental para Postgres)
    await supabase.from('chats').update({ last_message_id: null }).eq('id', chatId);

    // 2. Eliminar reacciones primero (dependen de los mensajes)
    // Usamos una subquery para mayor precisión
    const { data: msgIds } = await supabase.from('messages').select('id').eq('chat_id', chatId);
    if (msgIds && msgIds.length > 0) {
      await supabase.from('message_reactions').delete().in('message_id', msgIds.map(m => m.id));
    }

    // 3. Eliminar mensajes
    await supabase.from('messages').delete().eq('chat_id', chatId);

    // 4. Eliminar participantes
    await supabase.from('chat_participants').delete().eq('chat_id', chatId);

    // 5. Finalmente eliminar el chat raíz
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
  subscribeToUserChats(userId: string, onUpdate: (payload: any) => void): { unsubscribe: () => void } {
    // 🔧 FIX ULTRA 2026: Unique channel name to avoid "callbacks after subscribe" error
    const channelId = `user_chats_${userId}_${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
        }