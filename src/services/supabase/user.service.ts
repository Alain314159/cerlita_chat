import { supabase } from './config';
import type { User } from '@/types';
import { mapDatabaseUserToDomain } from './mappers/user.mapper';

const userCache = new Map<string, { data: User; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 min

export const userService = {
  async getUserById(userId: string): Promise<User | null> {
    // 1. Check Cache
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') {
        console.error('[UserService] Failed to fetch user:', error);
      }
      return null;
    }

    const domainUser = mapDatabaseUserToDomain(data);
    if (!domainUser) return null;
    
    // 2. Update Cache
    userCache.set(userId, { data: domainUser, timestamp: Date.now() });
    
    return domainUser;
  },

  invalidateCache(userId: string): void {
    userCache.delete(userId);
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
      .select('id, email, display_name, cerlita_id, photo_url, is_online')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,cerlita_id.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(50);

    if (error) throw error;
    return (data || [])
      .map(user => mapDatabaseUserToDomain(user))
      .filter((u): u is User => u !== null);
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
    return (data || [])
      .map((conn: any) => {
        const otherUser = conn.sender.id === currentUserId ? conn.receiver : conn.sender;
        return mapDatabaseUserToDomain(otherUser);
      })
      .filter((u): u is User => u !== null);
  }
};
