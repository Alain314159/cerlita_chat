import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, MessageType, ReplyContext } from '@/types';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { pushNotificationService } from '@/services/pushNotifications';
import { userService } from '@/services/supabase/user.service';
import { safeStoreAction } from '@/utils/safeAction';

interface MessageStore {
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: Set<string>;
  channels: Map<string, RealtimeChannel>;
  replyContext: ReplyContext | null;
  starredMessages: Set<string>;
  reactions: Map<string, Map<string, string[]>>;
  currentUserId: string | null;

  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (
    chatId: string,
    senderId: string,
    text: string,
    options?: {
      messageType?: MessageType;
      mediaUrl?: string;
      thumbnailUrl?: string;
      replyToId?: string;
    }
  ) => Promise<void>;
  editMessage: (messageId: string, newText: string, chatId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (chatId: string, userId: string) => Promise<void>;
  subscribeToMessages: (chatId: string) => void;
  unsubscribeFromMessages: (chatId?: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setError: (error: string | null) => void;
  setReplyContext: (context: ReplyContext | null) => void;
  getReplyContext: (messageId: string) => Promise<ReplyContext | null>;
  forwardMessage: (messageId: string, targetChatIds: string[]) => Promise<void>;
  starMessage: (messageId: string) => void;
  unstarMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  getReactionCounts: (messageId: string, currentUserId: string) => Record<string, { count: number; userReacted: boolean }>;
  setCurrentUserId: (userId: string) => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  typingUsers: new Set(),
  channels: new Map(),
  replyContext: null,
  starredMessages: new Set<string>(),
  reactions: new Map<string, Map<string, string[]>>(),
  currentUserId: null,

  setCurrentUserId: (userId: string) => set({ currentUserId: userId }),

  loadMessages: async (chatId: string) => {
    try {
      set({ loading: true, error: null });
      const messages = await messageService.getMessages(chatId);
      const decryptedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          if (msg.content && msg.message_type === 'text') {
            try {
              const decrypted = await e2eEncryptionService.decrypt(msg.content, '', chatId);
              return { ...msg, text: decrypted };
            } catch {
              return { ...msg, text: '[Unable to decrypt]' };
            }
          }
          return { ...msg, text: msg.content };
        })
      );
      set({ messages: decryptedMessages as unknown as Message[], loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load messages';
      set({ loading: false, error: message });
    }
  },

  sendMessage: async (chatId, senderId, text, options) => {
    return safeStoreAction('sendMessage', async () => {
      set({ loading: true, error: null });
      const messageType = options?.messageType || 'text';
      let content = text;
      
      if (messageType === 'text') {
        const { ciphertext } = await e2eEncryptionService.encrypt(text, chatId);
        content = ciphertext;
      }
      
      const { replyContext } = get();
      const replyToId = options?.replyToId || replyContext?.messageId || null;

      // 1. Enviar el mensaje a la DB
      await messageService.sendMessage({
        chatId,
        senderId,
        content,
        messageType,
        mediaUrl: options?.mediaUrl || null,
        thumbnailUrl: options?.thumbnailUrl || null,
        replyToId,
      });

      // 2. Intentar enviar notificación Push
      (async () => {
        try {
          const participantIds = await messageService.getChatParticipants(chatId);
          const recipientId = participantIds?.find((id: string) => id !== senderId);
            
          if (recipientId) {
            const userData = await userService.getUserById(recipientId);
            const senderData = await userService.getUserById(senderId);

            if (userData?.push_token) {
              await pushNotificationService.sendPushNotification(
                userData.push_token,
                `Mensaje de ${senderData?.display_name || 'Alguien'}`,
                messageType === 'text' ? text : `Te ha enviado un ${messageType}`,
                { chatId, type: 'new_message' }
              );
            }
          }
        } catch (err) {
          console.error('[PushNotification] Error sending notification:', err);
        }
      })();

      set({ replyContext: null, loading: false });
    }, { chatId, senderId });
  },

  editMessage: async (messageId, newText, chatId) => {
    try {
      const { ciphertext } = await e2eEncryptionService.encrypt(newText, chatId);
      await messageService.updateMessage(messageId, {
        content: ciphertext,
        is_edited: true,
      });
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((m) =>
          m.id === messageId ? { ...m, text: newText, editedAt: new Date() } : m
        ),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to edit message';
      console.error(message);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      set({ messages: get().messages.filter((m) => m.id !== messageId) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      console.error(message);
      throw error;
    }
  },

  markAsRead: async (messageId) => {
    try {
      await messageService.updateMessageStatus(messageId, 'read');
    } catch (error: unknown) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async (chatId, userId) => {
    try {
      await messageService.markAllAsRead(chatId, userId);
    } catch (error: unknown) {
      console.error('Failed to mark all as read:', error);
    }
  },

  subscribeToMessages: async (chatId) => {
    const { channels } = get();
    const existingChannel = channels.get(chatId);
    if (existingChannel) {
      existingChannel.unsubscribe();
      channels.delete(chatId);
    }

    const channel = messageService.subscribeToMessages(chatId, async (payload: any) => {
      const raw = payload.new as any;
      if (!raw) return;

      const msg: Message = {
        id: raw.id,
        chatId: raw.chat_id,
        senderId: raw.sender_id,
        type: raw.message_type as MessageType,
        text: raw.content,
        mediaURL: raw.media_url,
        thumbnailURL: raw.thumbnail_url,
        status: raw.status as Message['status'],
        deliveredAt: raw.delivered_at ? new Date(raw.delivered_at) : null,
        readAt: raw.read_at ? new Date(raw.read_at) : null,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at),
        isEdited: raw.is_edited,
        editedAt: raw.is_edited ? new Date(raw.updated_at) : null,
        replyToId: raw.reply_to_id,
      };

      if (msg.type === 'text' && msg.text) {
        try {
          const decrypted = await e2eEncryptionService.decrypt(msg.text, '', chatId);
          msg.text = decrypted;
        } catch {
          msg.text = '[Unable to decrypt]';
        }
      }

      const currentMessages = get().messages;
      const existingIndex = currentMessages.findIndex((m) => m.id === msg.id);
      if (existingIndex >= 0) {
        const updated = [...currentMessages];
        updated[existingIndex] = msg;
        set({ messages: updated });
      } else {
        set({ messages: [...currentMessages, msg] });
      }
    });

    channels.set(chatId, channel);
    set({ channels });
  },

  unsubscribeFromMessages: (chatId?: string) => {
    const { channels } = get();
    if (chatId) {
      const channel = channels.get(chatId);
      if (channel) { channel.unsubscribe(); channels.delete(chatId); }
    } else {
      channels.forEach((ch) => ch.unsubscribe());
      channels.clear();
    }
    set({ channels });
  },

  setTyping: (userId, isTyping) => {
    const { typingUsers } = get();
    const newTyping = new Set(typingUsers);
    if (isTyping) newTyping.add(userId); else newTyping.delete(userId);
    set({ typingUsers: newTyping });
  },

  setError: (error) => set({ error }),

  setReplyContext: (context) => set({ replyContext: context }),

  getReplyContext: async (messageId) => {
    try {
      const data = await messageService.getMessageById(messageId);
      if (!data) return null;
      return {
        messageId: data.id,
        senderName: 'User',
        text: data.message_type === 'text' ? data.content : data.message_type,
        type: data.message_type as MessageType,
      };
    } catch {
      return null;
    }
  },

  forwardMessage: async (messageId, targetChatIds) => {
    try {
      const original = get().messages.find((m) => m.id === messageId);
      if (!original) throw new Error('Message not found');
      const currentUserId = get().currentUserId || '';
      for (const chatId of targetChatIds) {
        if (original.text) {
          const { ciphertext } = await e2eEncryptionService.encrypt(original.text, chatId);
          await messageService.sendMessage({
            chatId, senderId: currentUserId, content: ciphertext, messageType: 'text',
          });
        }
      }
    } catch (error: unknown) {
      console.error('Failed to forward:', error);
      throw error;
    }
  },

  starMessage: (messageId) => {
    const starred = new Set(get().starredMessages);
    starred.add(messageId);
    set({ starredMessages: starred });
  },

  unstarMessage: (messageId) => {
    const starred = new Set(get().starredMessages);
    starred.delete(messageId);
    set({ starredMessages: starred });
  },

  addReaction: async (messageId, emoji, userId) => {
    try {
      await messageService.addReaction(messageId, emoji, userId);
      const msgReactions = get().reactions.get(messageId) || new Map();
      const users = msgReactions.get(emoji) || [];
      if (!users.includes(userId)) {
        msgReactions.set(emoji, [...users, userId]);
        get().reactions.set(messageId, msgReactions);
      }
    } catch (e) { console.error('Reaction error:', e); }
  },

  removeReaction: async (messageId, emoji, userId) => {
    try {
      await messageService.removeReaction(messageId, emoji, userId);
      const msgReactions = get().reactions.get(messageId);
      if (msgReactions) {
        const users = msgReactions.get(emoji) || [];
        msgReactions.set(emoji, users.filter((u) => u !== userId));
      }
    } catch (e) { console.error('Remove reaction error:', e); }
  },

  getReactionCounts: (messageId, currentUserId) => {
    const msgReactions = get().reactions.get(messageId) || new Map();
    const result: Record<string, { count: number; userReacted: boolean }> = {};
    msgReactions.forEach((users, emoji) => {
      result[emoji] = { count: users.length, userReacted: users.includes(currentUserId) };
    });
    return result;
  },
}));

