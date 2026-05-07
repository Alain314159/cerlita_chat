import type { Chat } from '@/types';

export const mapDatabaseChatToDomain = (dbChat: any): Chat => {
  return {
    id: dbChat.id,
    name: dbChat.name,
    type: dbChat.type,
    participant_ids: dbChat.participant_ids || [],
    lastMessageId: dbChat.last_message_id,
    lastMessage: dbChat.last_message,
    lastMessageAt: dbChat.last_message_at,
    unreadCount: dbChat.unread_count || 0,
    createdAt: dbChat.created_at,
    updatedAt: dbChat.updated_at,
  };
};
