import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Chat } from '@/types';
import { chatService } from '@/services/supabase/chat.service';

interface ChatStore {
  // State
  chats: Chat[];
  loading: boolean;
  error: string | null;
  activeChat: Chat | null;
  channels: Map<string, RealtimeChannel>;

  // Actions
  loadChats: (userId: string) => Promise<void>;
  createChat: (userId1: string, userId2: string) => Promise<string>;
  setActiveChat: (chat: Chat | null) => void;
  subscribeToChats: (userId: string) => void;
  unsubscribeFromChats: () => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chats: [],
  loading: false,
  error: null,
  activeChat: null,
  channels: new Map(),

  // Load chats
  loadChats: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const chats = await chatService.getUserChats(userId);

      set({
        chats,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load chats';
      set({
        loading: false,
        error: message,
      });
    }
  },

  // Create chat
  createChat: async (userId1: string, userId2: string) => {
    try {
      set({ loading: true, error: null });

      const chat = await chatService.createChat({
        participantIds: [userId1, userId2],
        isGroup: false,
      });

      set({ loading: false });
      return chat.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create chat';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Set active chat
  setActiveChat: (chat: Chat | null) => {
    set({ activeChat: chat });
  },

  // Subscribe to chats (realtime)
  subscribeToChats: (userId: string) => {
    const { channels } = get();
    const channelKey = `chats_${userId}`;

    // Unsubscribe from previous if exists
    const existingChannel = channels.get(channelKey);
    if (existingChannel) {
      existingChannel.unsubscribe();
      channels.delete(channelKey);
    }

    const channel = chatService.subscribeToUserChats(userId, (chats: Chat[]) => {
      set({ chats });
    });

    channels.set(channelKey, channel);
    set({ channels });
  },

  // Unsubscribe from chats
  unsubscribeFromChats: () => {
    const { channels } = get();
    channels.forEach((channel) => channel.unsubscribe());
    channels.clear();
    set({ channels });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
