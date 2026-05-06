import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, MessageType, ReplyContext } from '@/types';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { pushNotificationService } from '@/services/pushNotifications';
import { userService } from '@/services/supabase/user.service';
import { safeStoreAction } from '@/utils/safeAction';
import { SendMessageUseCase } from '@/use-cases/chat/SendMessage';
import { LoadMessagesUseCase } from '@/use-cases/chat/LoadMessages';
import { EditMessageUseCase } from '@/use-cases/chat/EditMessage';
import { DeleteMessageUseCase } from '@/use-cases/chat/DeleteMessage';
import { ForwardMessageUseCase } from '@/use-cases/chat/ForwardMessage';
import { HandleRealtimeMessageUseCase } from '@/use-cases/chat/HandleRealtimeMessage';

interface MessageStore {
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  replyContext: ReplyContext | null;
  subscription: RealtimeChannel | null;
  typingUsers: Record<string, boolean>;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setError: (error: string | null) => void;
  setCurrentUserId: (userId: string) => void;
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
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (chatId: string, userId: string) => Promise<void>;
  subscribeToMessages: (chatId: string) => void;
  unsubscribeFromMessages: () => void;
  setReplyContext: (context: ReplyContext | null) => void;
  getReplyContext: (messageId: string) => Promise<ReplyContext | null>;
  forwardMessage: (messageId: string, targetChatIds: string[]) => Promise<void>;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  currentUserId: null,
  replyContext: null,
  subscription: null,
  typingUsers: {},

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.messages.some((m) => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),
  setError: (error) => set({ error }),
  setCurrentUserId: (userId: string) => set({ currentUserId: userId }),

  loadMessages: async (chatId: string) => {
    try {
      set({ loading: true, error: null });
      const messages = await LoadMessagesUseCase(
        {
          getMessages: messageService.getMessages,
          decrypt: e2eEncryptionService.decrypt
        },
        chatId
      );
      set({ messages, loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load messages';
      set({ loading: false, error: message });
    }
  },

  sendMessage: async (chatId, senderId, text, options) => {
    return safeStoreAction('sendMessage', async () => {
      try {
        set({ loading: true, error: null });
        
        const { replyContext } = get();
        const replyToId = options?.replyToId || replyContext?.messageId || undefined;

        await SendMessageUseCase(
          {
            encrypt: e2eEncryptionService.encrypt,
            sendMessage: messageService.sendMessage,
            getChatParticipants: messageService.getChatParticipants,
            getUserById: userService.getUserById,
            sendPushNotification: pushNotificationService.sendPushNotification,
          },
          {
            chatId,
            senderId,
            text,
            options: { ...options, replyToId }
          }
        );

        set({ replyContext: null, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message });
        throw error;
      }
    }, { chatId, senderId });
  },

  editMessage: async (messageId, newText, chatId) => {
    try {
      await EditMessageUseCase(messageId, newText, chatId);
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
      await DeleteMessageUseCase(messageId);
      set({ messages: get().messages.filter((m) => m.id !== messageId) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      console.error(message);
      throw error;
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const { currentUserId } = get();
      if (!currentUserId) return;
      await messageService.addReaction(messageId, emoji, currentUserId);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },

  markAsRead: async (chatId, userId) => {
    try {
      await messageService.markAllAsRead(chatId, userId);
    } catch (error: unknown) {
      console.error('Failed to mark as read:', error);
    }
  },

  subscribeToMessages: (chatId: string) => {
    get().unsubscribeFromMessages();

    const sub = messageService.subscribeToMessages(chatId, async (payload: any) => {
      const processedMsg = await HandleRealtimeMessageUseCase(
        { decrypt: e2eEncryptionService.decrypt },
        payload,
        chatId
      );

      if (!processedMsg) return;

      const { eventType } = payload;
      const currentMessages = get().messages;

      if (eventType === 'INSERT') {
        if (!currentMessages.find((m) => m.id === processedMsg.id)) {
          set({ messages: [...currentMessages, processedMsg] });
        }
      } else if (eventType === 'UPDATE') {
        set({
          messages: currentMessages.map((m) =>
            m.id === processedMsg.id ? { ...m, ...processedMsg } : m
          ),
        });
      } else if (eventType === 'DELETE') {
        set({
          messages: currentMessages.filter((m) => m.id !== processedMsg.id),
        });
      }
    });

    set({ subscription: sub });
  },

  unsubscribeFromMessages: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },

  setReplyContext: (context) => set({ replyContext: context }),

  getReplyContext: async (messageId) => {
    try {
      const data = await messageService.getMessageById(messageId);
      if (!data) return null;
      return {
        messageId: data.id,
        senderName: 'User',
        text: data.type === 'text' ? data.text || '' : data.type,
        type: data.type as MessageType,
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
      
      await ForwardMessageUseCase(original, targetChatIds, currentUserId);
    } catch (error: unknown) {
      console.error('Failed to forward:', error);
      throw error;
    }
  },
}));
