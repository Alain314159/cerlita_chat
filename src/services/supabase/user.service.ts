import { supabase } from './config';
import type { User } from '@/types';
import { mapDatabaseUserToDomain } from './mappers/user.mapper';

export const userService = {
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return mapDatabaseUserToDomain(data);
  },

  async updatePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  async searchUsers(currentUserId: string, query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, photo_url, is_online')
      .ilike('display_name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) throw error;
    return data?.map(user => mapDatabaseUserToDomain(user)) || [];
  },

  async getContacts(currentUserId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        sender:sender_id (*),
        receiver:receiver_id (*)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (error) throw error;
    return data.map((conn: any) => 
      mapDatabaseUserToDomain(conn.sender.id === currentUserId ? conn.receiver : conn.sender)
    );
  }
};
