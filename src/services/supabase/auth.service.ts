import { supabase } from './config';
import type { User } from '@/types';
import type { Database } from '@/types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

export const authService = {
  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Sign up
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    
    const row = data as UserRow;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      photoURL: row.photo_url,
      isOnline: row.is_online,
      lastSeen: row.last_seen_at ? new Date(row.last_seen_at) : null,
      isTyping: row.is_typing,
      pushToken: row.push_token,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },

  // Update profile
  async updateProfile(userId: string, updates: { displayName?: string; photoURL?: string }) {
    const { error } = await supabase
      .from('users')
      .update({
        display_name: updates.displayName,
        photo_url: updates.photoURL,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  // Update presence
  async updatePresence(isOnline: boolean, userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'cerlitachat://reset-password',
    });
    if (error) throw new Error(error.message);
  },

  // On auth state change
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        callback(event, session);
      }
    );
    return subscription;
  },
};
