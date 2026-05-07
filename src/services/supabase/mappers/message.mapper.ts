import type { Message, MessageType, EncryptedPayload } from '@/types';

export const mapDatabaseMessageToDomain = (dbMsg: any): Message => {
  const encryptedPayload: EncryptedPayload | undefined = dbMsg.iv 
    ? {
        ciphertext: dbMsg.content || '',
        iv: dbMsg.iv,
        authTag: dbMsg.auth_tag || '',
        keyVersion: dbMsg.key_version || 'v1',
      }
    : undefined;

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
    encryptedPayload,
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

export const mapDomainMessageToDatabase = (msg: Message) => {
  return {
    chat_id: msg.chatId,
    sender_id: msg.senderId,
    content: msg.encryptedPayload?.ciphertext ?? msg.text,
    message_type: msg.type,
    media_url: msg.mediaURL,
    thumbnail_url: msg.thumbnailURL,
    reply_to_id: msg.replyToId,
    status: msg.status || 'sent',
    is_ephemeral: msg.isEphemeral || false,
    iv: msg.encryptedPayload?.iv || msg.iv || null,
    auth_tag: msg.encryptedPayload?.authTag || null,
    key_version: msg.encryptedPayload?.keyVersion || 'v1',
    expires_at: msg.isEphemeral ? (msg as any).expiresAt : null,
    is_view_once: msg.isViewOnce || false,
  };
};
