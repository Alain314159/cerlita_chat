import { supabase } from './config';

export const chatService = {
  // Get all chats for a user
  async getUserChats(userId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get chat by ID
  async getChatById(chatId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*, participants:chat_participants(user_id, users(*))')
      .eq('id', chatId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get or create a direct chat between two users
  async getOrCreateDirectChat(user1Id: string, user2Id: string) {
    const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
      user1_id: user1Id,
      user2_id: user2Id,
    } as any);

    if (error) throw new Error(error.message);
    return data;
  },

  // Get participants for a chat
  async getParticipants(chatId: string) {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('*, user:users(*)')
      .eq('chat_id', chatId);

    if (error) throw new Error(error.message);
    return data;
  },

  // Update last message in chat
  async updateLastMessage(chatId: string, messageId: string) {
    const { error } = await supabase
      .from('chats')
      .update({
        last_message_id: messageId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', chatId);

    if (error) throw new Error(error.message);
  },

  // Subscribe to chat updates
  subscribeToUserChats(userId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`public:chats:participants=${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participant_ids=cs.{${userId}}`,
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  },
};
