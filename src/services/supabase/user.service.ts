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

  async updatePushToken(userId: string, token: string) {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token } as any)
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }
};
