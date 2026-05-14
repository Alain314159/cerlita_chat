import type { Chat, User } from '@/types';
import { mapDatabaseUserToDomain } from './user.mapper';

export const mapDatabaseChatToDomain = (dbChat: any, currentUserId?: string): Chat => {
  let recipient: User | null = null;
  
  if (dbChat.participants && Array.isArray(dbChat.participants)) {
    // Buscar al otro participante que no es el usuario actual
    const otherParticipant = dbChat.participants.find((p: any) => 
      (p.user || p.users) && (!currentUserId || p.user_id !== currentUserId)
    );
    if (otherParticipant) {
      recipient = mapDatabaseUserToDomain(otherParticipant.user || otherParticipant.users);
    }
  }

  return {
    id: dbChat.id,
    name: dbChat.name,
    type: dbChat.type,
    participant_ids: dbChat.participant_ids || [],
    recipient,
    lastMessageId: dbChat.last_message_id,
    lastMessage: dbChat.last_message,
    lastMessageAt: dbChat.last_message_at,
    unreadCount: dbChat.unread_count || 0,
    createdAt: dbChat.created_at,
    updatedAt: dbChat.updated_at,
  };
};
