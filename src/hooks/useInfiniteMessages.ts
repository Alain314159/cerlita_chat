import { useState, useCallback } from 'react';
import { messageService } from '@/services/supabase/message.service';
import type { Message } from '@/types';

export function useInfiniteMessages(chatId: string, initialMessages: Message[]) {
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(
    async (allMessages: Message[]) => {
      if (loadingMore || !hasMore || allMessages.length === 0) return;
      setLoadingMore(true);
      try {
        const oldest = allMessages[0];
        if (!oldest) return;
        
        const before = typeof oldest.createdAt === 'string' 
          ? oldest.createdAt 
          : (oldest.createdAt as any).toISOString();

        const older = await messageService.getMessages(chatId, {
          limit: 30,
          before: before,
        });
        if (older.length < 30) setHasMore(false);
        return older;
      } finally {
        setLoadingMore(false);
      }
    },
    [chatId, loadingMore, hasMore],
  );

  return { hasMore, loadingMore, loadMore };
}
