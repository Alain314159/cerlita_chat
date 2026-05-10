import { useInfiniteQuery, InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { mapDatabaseMessageToDomain } from '@/services/supabase/mappers/message.mapper';
import type { Message } from '@/types';

export function useMessagesQuery(chatId: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<Message[], Error, Message[], [string, string], string | null>({
    queryKey: ['messages', chatId],
    // ... rest of config ...
    queryFn: async ({ pageParam }) => {
      try {
        if (!chatId || typeof chatId !== 'string') return [];

        const messages = await messageService.getMessages(chatId, {
          limit: 30,
          before: pageParam ?? undefined,
        });

        if (!messages || messages.length === 0) return [];

        const decryptedMessages = await Promise.all(
          messages.map(async (msg) => {
            if (msg?.text && msg.type === 'text' && msg.encryptedPayload) {
              try {
                const { text } = await e2eEncryptionService.decrypt(
                  msg.encryptedPayload.ciphertext,
                  chatId,
                  msg.encryptedPayload.iv,
                  msg.encryptedPayload.authTag,
                  msg.encryptedPayload.keyVersion
                );
                return { ...msg, text };
              } catch (err) {
                console.warn('[Decryption] Failed:', msg.id, err);
                return { ...msg, text: '[Error de cifrado]', status: 'failed' as const };
              }
            }
            return msg;
          })
        );
        return decryptedMessages;
      } catch (error) {
        console.error('[useMessagesQuery] Critical error:', error);
        return [];
      }
    },

    getNextPageParam: (lastPage) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length < 30) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      return oldest?.createdAt ? new Date(oldest.createdAt).toISOString() : undefined;
    },

    initialPageParam: null as string | null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    
    select: (data: InfiniteData<Message[], string | null>): Message[] => {
      if (!data || !data.pages) return [];
      return data.pages.flatMap(page => page ?? []).filter(item => item && item.id);
    },
    placeholderData: (previousData) => previousData,
  });

  // 🔔 Sincronización en tiempo real integrada (Maestro 2026)
  useEffect(() => {
    if (!chatId) return;

    console.log('[useMessagesQuery] Subscribing to chat:', chatId);
    const subscription = messageService.subscribeToMessages(chatId, async (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' && newRecord) {
        const domainMsg = mapDatabaseMessageToDomain(newRecord);
        let finalMsg = domainMsg;

        if (domainMsg.text && domainMsg.encryptedPayload) {
          try {
            const { text } = await e2eEncryptionService.decrypt(
              domainMsg.encryptedPayload.ciphertext,
              chatId,
              domainMsg.encryptedPayload.iv,
              domainMsg.encryptedPayload.authTag,
              domainMsg.encryptedPayload.keyVersion
            );
            finalMsg = { ...domainMsg, text };
          } catch (err) {
            finalMsg = { ...domainMsg, text: '[Error de cifrado]', status: 'failed' };
          }
        }

        queryClient.setQueryData<InfiniteData<Message[], string | null>>(['messages', chatId], (old) => {
          if (!old || !old.pages) return old;
          if (old.pages.some(page => page.some(m => m.id === finalMsg.id))) return old;
          const newPages = [...old.pages];
          newPages[0] = [finalMsg, ...(newPages[0] || [])];
          return { ...old, pages: newPages };
        });
      } else if (eventType === 'UPDATE' && newRecord) {
        queryClient.setQueryData<InfiniteData<Message[], string | null>>(['messages', chatId], (old) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map(page => 
              page.map(m => m.id === newRecord.id ? mapDatabaseMessageToDomain(newRecord) : m)
            ),
          };
        });
      } else if (eventType === 'DELETE' && oldRecord) {
        queryClient.setQueryData<InfiniteData<Message[], string | null>>(['messages', chatId], (old) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map(page => page.filter(m => m.id !== oldRecord.id)),
          };
        });
      }
    });

    return () => {
      console.log('[useMessagesQuery] Unsubscribing');
      subscription.unsubscribe();
    };
  }, [chatId, queryClient]);

  return query;
}
