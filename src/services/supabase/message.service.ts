import { supabase } from './config';

export const messageService = {
  // Get messages for a chat with pagination support
  async getMessages(chatId: string, options: number | { limit?: number; before?: string } = 50) {
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
      .order('created_at', { ascending: false }) // Order by newest first for better paging
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    // Return in ascending order for the UI
    return (data || []).reverse();
  },

  // Send a message
  async sendMessage(params: {
    chatId: string;
    senderId: string;
    content: string;
    messageType: string;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
    isEphemeral?: boolean;
    expiresAt?: string | null;
    isViewOnce?: boolean;
    }) {
    const { data, error } = await (supabase.from('messages') as any).insert({
      chat_id: params.chatId,
      sender_id: params.senderId,
      content: params.content,
      message_type: params.messageType,
      media_url: params.mediaUrl,
      thumbnail_url: params.thumbnailUrl,
      reply_to_id: params.replyToId,
      status: 'sent',
      is_ephemeral: params.isEphemeral || false,
      expires_at: params.expiresAt || null,
      is_view_once: params.isViewOnce || false,
    }).select().single();

    if (error) throw new Error(error.message);
    return data;
    },

    // Mark a view-once message as viewed (burn after reading)
    async markAsViewed(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ 
        viewed_at: new Date().toISOString(),
        content: '[Mensaje de visualización única ya visto]', // Sobrescribir contenido por seguridad
      } as any)
      .eq('id', messageId)
      .eq('is_view_once', true);

    if (error) throw new Error(error.message);
    },
    ...
    await supabase.from('chats')
      .update({ 
        last_message_id: data.id,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', params.chatId);

    return data;
  },

  // Update a message (edit)
  async updateMessage(messageId: string, updates: any) {
    const { error } = await supabase
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Delete a message
  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Update message status (delivered, read)
  async updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status,
        [status === 'read' ? 'read_at' : 'delivered_at']: new Date().toISOString()
      } as any)
      .eq('id', messageId);

    if (error) throw new Error(error.message);
  },

  // Mark all messages in a chat as read
  async markAllAsRead(chatId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      } as any)
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .neq('status', 'read');

    if (error) throw new Error(error.message);
  },

  // Get a single message by ID
  async getMessageById(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, message_type, content, chat_id')
      .eq('id', messageId)
      .single();

    if (error) return null;
    return data;
  },

  // Get chat participants for push notifications
  async getChatParticipants(chatId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('participant_ids')
      .eq('id', chatId)
      .single();

    if (error) throw new Error(error.message);
    return (data as any)?.participant_ids as string[];
  },

  // Reaction management
  async addReaction(messageId: string, emoji: string, userId: string) {
    const { error } = await (supabase.from('message_reactions') as any).insert({
      message_id: messageId,
      emoji,
      user_id: userId,
    });

    if (error) throw new Error(error.message);
  },

  async removeReaction(messageId: string, emoji: string, userId: string) {
    const { error } = await (supabase.from('message_reactions') as any)
      .delete()
      .match({ message_id: messageId, emoji, user_id: userId });

    if (error) throw new Error(error.message);
  },

  // Subscribe to new messages in a chat
  subscribeToMessages(chatId: string, onMessage: (payload: any) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: any) => {
          onMessage(payload);
        }
      )
      .subscribe();
  },
};
