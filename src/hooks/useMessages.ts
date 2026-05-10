import { useCallback, useState, useMemo } from 'react';
import { InfiniteData } from '@tanstack/react-query';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore, AuthStore } from '@/store/authStore';
import { useMessagesQuery } from './useMessagesQuery';
import type { ReplyContext, Message } from '@/types';

export function useMessages(chatId: string) {
  const queryResult = useMessagesQuery(chatId);
  const { data: rawData, isLoading: loading, error: queryError } = queryResult;

  const messages = useMemo(() => {
    const data = rawData as unknown as InfiniteData<Message[], string | null>;
    if (!data || !data.pages) return [];
    return data.pages.flat().filter((m: Message): m is Message => m !== null && !!m.id);
  }, [rawData]);

  const {
    typingUsers,
    replyContext,
    sendMessage,
    markAsRead,
    addReaction,
    subscribeToMessages,
    unsubscribeFromMessages,
    setError,
    setReplyContext,
    loadMessages,
    error: storeError,
  } = useMessageStore();

  const { user } = useAuthStore() as AuthStore;
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // Send message
  const handleSendMessage = useCallback(async (text: string, options?: any) => {
    if (!user || !chatId) return;
    try {
      setSending(true);
      await sendMessage(chatId, user.id, text, options);
    } finally {
      setSending(false);
    }
  }, [user, chatId, sendMessage]);

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    await addReaction(messageId, emoji);
  }, [addReaction, user]);

  const handleMarkAsRead = useCallback(async () => {
    if (!user || !chatId) return;
    await markAsRead(chatId, user.id);
  }, [user, chatId, markAsRead]);

  const isOtherUserTyping = useCallback(() => {
    if (!user) return false;
    return Object.keys(typingUsers).some((id) => id !== user.id);
  }, [typingUsers, user]);

  return {
    messages,
    loading,
    sending,
    error: queryError || storeError,
    queryResult,
    isTyping,
    setIsTyping,
    isOtherUserTyping,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage: handleSendMessage,
    addReaction: handleAddReaction,
    markAsRead: handleMarkAsRead,
    setError,
    replyContext,
    setReplyContext,
  };
}
