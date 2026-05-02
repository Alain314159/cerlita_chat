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
    replyToId?: string | null;
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
    }).select().single();

    if (error) throw new Error(error.message);

    // Update the last_message_id in the chat
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
