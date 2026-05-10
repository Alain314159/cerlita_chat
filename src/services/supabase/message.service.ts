import { supabase } from './config';
import { mapDatabaseMessageToDomain, mapDomainMessageToDatabase } from './mappers/message.mapper';
import type { Message, MessageType } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export const messageService = {
  // Get messages for a chat with pagination support
  async getMessages(chatId: string, options: number | { limit?: number; before?: string } = 50): Promise<Message[]> {
    let limit = 50;
    let before: string | null = null;

    if (typeof options === 'number') {
      limit = options;
    } else {
      limit = options.limit ?? 50;
      before = options.before ?? null;
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    
    // Domain Mapping
    const messages = (data || []).map(mapDatabaseMessageToDomain);
    return messages.reverse();
  },

  // Send a message (pJ/bit Optimization: DB triggers handle chat updates)
  async sendMessage(params: {
    chatId: string;
    senderId: string;
    text: string | null;
    type: MessageType;
    mediaURL?: string | null;
    thumbnailURL?: string | null;
    replyToId?: string | null;
    iv?: string | null;
    authTag?: string | null;
    keyVersion?: string | null;
    status?: Message['status'];
    isEphemeral?: boolean;
    isViewOnce?: boolean;
  }): Promise<Message> {
    const dbPayload = mapDomainMessageToDatabase(params as any);

    const { data, error } = await supabase.from('messages').insert(dbPayload).select().single();

    if (error) throw new Error(error.message);

    // NOTE: last_message_id and updated_at in 'chats' are now handled 
    // by the server-side trigger 'update_chat_on_new_message_trigger'.
    // This reduces network roundtrips and ensures atomicity.
    return mapDatabaseMessageToDomain(data);
  },

  // Mark a view-once message as viewed (Nuclear Cleanup)
  async markAsViewed(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        viewed_at: new Date().toISOString(),
        // Note: The trigger 'trigger_burn_view_once' will automatically 
        // clear the content and media URLs in the database.
      })
      .eq('id', messageId)
      .eq('is_view_once', true);

    if (error) throw new Error(error.message);
  },

  // Update a message (edit)
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Update message status (delivered, read)
  async updateMessageStatus(messageId: string, status: 'delivered' | 'read'): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status,
        [status === 'read' ? 'read_at' : 'delivered_at']: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Mark all messages in a chat as read
  async markAllAsRead(chatId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .neq('status', 'read');

    if (error) throw new Error(error.message);
  },

  // Get a single message by ID
  async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) return null;
    return mapDatabaseMessageToDomain(data);
  },

  // Get chat participants for push notifications (Maestro 2026: Type Safety)
  async getChatParticipants(chatId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('participant_ids')
      .eq('id', chatId)
      .single();

    if (error) throw new Error(error.message);
    return (data as { participant_ids: string[] })?.participant_ids || [];
  },

  // Reaction management
  async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      emoji,
      user_id: userId,
    });

    if (error) throw new Error(error.message);
  },

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    const { error } = await supabase.from('message_reactions')
      .delete()
      .match({ message_id: messageId, emoji, user_id: userId });

    if (error) throw new Error(error.message);
  },

  // Subscribe to new messages in a chat (Maestro 2026: Full Event Sync)
  subscribeToMessages(
    chatId: string, 
    onEvent: (payload: any) => void
  ): { unsubscribe: () => void } {
    // 🔧 FIX ULTRA: Unique channel name to prevent "callbacks after subscribe" error
    const channelId = `chat_messages_${chatId}_${Date.now()}`;
    const channel = supabase.channel(channelId);
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          onEvent(payload);
        }
      )
      // Broadcast support for ephemeral events (typing)
      .on('broadcast', { event: 'typing' }, (payload) => {
        onEvent({ ...payload, eventType: 'BROADCAST', event: 'typing' });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error en canal ${channelId}`);
        }
      });
    
    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },
};
