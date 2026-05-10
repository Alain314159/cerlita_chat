import { supabase } from './config';
import type { User } from '@/types';
import { mapDatabaseUserToDomain, mapDomainUserToDatabase } from './mappers/user.mapper';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

export const authService = {
  // Sign in
  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    
    // Al hacer login, devolvemos el perfil completo
    return await this.getUserProfile(data.user.id);
  },

  // Sign up with Atomic Profile Creation (Self-Healing Pattern)
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    // 1. Auth Signup
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (signUpError) throw new Error(signUpError.message);
    if (!data.user) throw new Error('No se pudo crear el usuario');

    // 2. Immediate Profile Creation
    // We do this manually because DB trigger was restricted by infra owner
    try {
      await this.createProfile({
        id: data.user.id,
        email: email,
        display_name: displayName,
      });
    } catch (profileError) {
      console.warn('Profile creation failed during signup, will retry on next login:', profileError);
    }

    return await this.getUserProfile(data.user.id);
  },

  // Create user profile
  async createProfile(params: { id: string; email: string; display_name: string }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: params.id,
        email: params.email,
        display_name: params.display_name,
        updated_at: new Date().toISOString(),
      });

    if (error && !error.message.includes('duplicate key')) {
      throw new Error(error.message);
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Get user profile (Self-healing with Upsert)
  async getUserProfile(userId: string): Promise<User> {
    // Basic UUID validation (Permissive for future versions and case sensitivity)
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      throw new Error('Invalid user ID format');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If user exists in auth but not in public.users, create it (Atomic Upsert)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        const { data: newUser, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            display_name: user.user_metadata.display_name || 'Usuario',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .single();

        if (upsertError) throw new Error(upsertError.message);
        const domainUser = mapDatabaseUserToDomain(newUser);
        if (!domainUser) throw new Error('Failed to map user profile');
        return domainUser;
      }
      throw new Error(error.message);
    }
    const domainUser = mapDatabaseUserToDomain(data);
    if (!domainUser) throw new Error('Failed to map user profile');
    return domainUser;
  },

  // Update profile
  async updateProfile(userId: string, updates: { displayName?: string; photoURL?: string }): Promise<void> {
    const dbUpdates = mapDomainUserToDatabase(updates);
    
    const { error } = await supabase
      .from('users')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  // Update presence
  async updatePresence(isOnline: boolean, userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'cerlitachat://reset-password',
    });
    if (error) throw new Error(error.message);
  },

  // Get current session
  async getSession() {
    return await supabase.auth.getSession();
  },

  // On auth state change
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        callback(event, session);
      }
    );
    return subscription;
  },
};
