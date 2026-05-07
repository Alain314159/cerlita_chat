import type { Message, MessageType } from '@/types';

export const mapDatabaseMessageToDomain = (dbMsg: any): Message => {
  return {
    id: dbMsg.id,
    chatId: db_chat_id(dbMsg),
    senderId: dbMsg.sender_id,
    type: dbMsg.message_type as MessageType,
    text: dbMsg.content,
    mediaURL: dbMsg.media_url,
    thumbnailURL: dbMsg.thumbnail_url,
    status: dbMsg.status as Message['status'],
    deliveredAt: dbMsg.delivered_at,
    readAt: dbMsg.read_at,
    createdAt: dbMsg.created_at,
    updatedAt: dbMsg.updated_at,
    iv: dbMsg.iv,
    isEdited: dbMsg.is_edited || false,
    editedAt: dbMsg.is_edited ? dbMsg.updated_at : null,
    replyToId: dbMsg.reply_to_id,
    isEphemeral: dbMsg.is_ephemeral,
    isViewOnce: dbMsg.is_view_once,
  };
};

function db_chat_id(msg: any) {
  return msg.chat_id || msg.chatId;
}

export const mapDomainMessageToDatabase = (params: Partial<Message>) => {
  return {
    chat_id: params.chatId,
    sender_id: params.senderId,
    content: params.text,
    message_type: params.type,
    media_url: params.mediaURL,
    thumbnail_url: params.thumbnailURL,
    reply_to_id: params.replyToId,
    status: params.status || 'sent',
    is_ephemeral: params.isEphemeral || false,
    iv: params.iv,
    expires_at: params.isEphemeral ? (params as any).expiresAt : null,
    is_view_once: params.isViewOnce || false,
  };
};
