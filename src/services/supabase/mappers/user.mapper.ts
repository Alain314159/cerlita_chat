import type { User } from '@/types';

export const mapDatabaseUserToDomain = (dbUser: any): User | null => {
  if (!dbUser) return null;
  
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    displayName: dbUser.display_name || 'Usuario',
    cerlitaId: dbUser.cerlita_id || null,
    photoURL: dbUser.photo_url || null,
    avatar: dbUser.avatar_type ? {
      type: dbUser.avatar_type as 'system' | 'custom',
      uri: dbUser.avatar_uri,
      systemId: dbUser.avatar_system_id,
    } : undefined,
    isOnline: dbUser.is_online || false,
    lastSeen: dbUser.last_seen_at ? dbUser.last_seen_at : null,
    isTyping: dbUser.is_typing || false,
    pushToken: dbUser.push_token || null,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at || dbUser.created_at,
  };
};

export const mapDomainUserToDatabase = (updates: Partial<User>) => {
  const dbUpdates: any = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.cerlitaId !== undefined) dbUpdates.cerlita_id = updates.cerlitaId;
  if (updates.photoURL !== undefined) dbUpdates.photo_url = updates.photoURL;
  if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;
  if (updates.pushToken !== undefined) dbUpdates.push_token = updates.pushToken;
  
  if (updates.avatar) {
    dbUpdates.avatar_type = updates.avatar.type;
    dbUpdates.avatar_uri = updates.avatar.uri;
    dbUpdates.avatar_system_id = updates.avatar.systemId;
  }
  
  return dbUpdates;
};
