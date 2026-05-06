import type { Message, MessageType } from '@/types';

export const mapDatabaseMessageToDomain = (dbMsg: any): Message => {
  return {
    id: dbMsg.id,
    chatId: dbMsg.chat_id,
    senderId: dbMsg.sender_id,
    type: dbMsg.message_type as MessageType,
    text: dbMsg.content, // Este se descifra luego en el store/use-case
    mediaURL: dbMsg.media_url,
    thumbnailURL: dbMsg.thumbnail_url,
    status: dbMsg.status as Message['status'],
    deliveredAt: dbMsg.delivered_at ? new Date(dbMsg.delivered_at) : null,
    readAt: dbMsg.read_at ? new Date(dbMsg.read_at) : null,
    createdAt: new Date(dbMsg.created_at),
    updatedAt: new Date(dbMsg.updated_at),
    isEdited: dbMsg.is_edited || false,
    editedAt: dbMsg.is_edited ? new Date(dbMsg.updated_at) : null,
    replyToId: dbMsg.reply_to_id,
  };
};

export const mapDomainMessageToDatabase = (params: any) => {
  return {
    chat_id: params.chatId,
    sender_id: params.senderId,
    content: params.content,
    message_type: params.messageType,
    media_url: params.mediaUrl,
    thumbnail_url: params.thumbnailUrl,
    reply_to_id: params.replyToId,
    status: params.status || 'sent',
    is_ephemeral: params.isEphemeral || false,
    expires_at: params.expiresAt || null,
    is_view_once: params.isViewOnce || false,
  };
};
