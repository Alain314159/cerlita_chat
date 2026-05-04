import { supabase } from './config';
import type { User } from '@/types';

export const userService = {
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      isOnline: data.is_online,
      lastSeen: data.last_seen_at ? new Date(data.last_seen_at) : null,
      isTyping: data.is_typing,
      pushToken: data.push_token,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async updatePushToken(userId: string, token: string) {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token } as any)
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }
};
