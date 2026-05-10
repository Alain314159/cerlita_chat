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
  channels: Map<string, { unsubscribe: () => void }>;

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
      const mappedChats = await chatService.getUserChats(userId);
      set({ chats: mappedChats, loading: false });
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
      const chatId = await chatService.getOrCreateDirectChat(userId1, userId2);
      set({ loading: false });
      return chatId;
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
    const existing = channels.get(channelKey);
    if (existing) {
      existing.unsubscribe();
      channels.delete(channelKey);
    }

    const sub = chatService.subscribeToUserChats(userId, (payload: any) => {
      // In a real app, you might want to handle individual events (INSERT, UPDATE, DELETE)
      // For simplicity, we just reload all chats for now or handle the payload
      get().loadChats(userId);
    });

    channels.set(channelKey, sub);
    set({ channels });
  },

  // Unsubscribe from chats
  unsubscribeFromChats: () => {
    const { channels } = get();
    channels.forEach((sub) => sub.unsubscribe());
    channels.clear();
    set({ channels });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
