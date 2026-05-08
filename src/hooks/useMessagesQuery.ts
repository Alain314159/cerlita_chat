import { useInfiniteQuery } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export function useMessagesQuery(chatId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', chatId],
    
    queryFn: async ({ pageParam }) => {
      try {
        const messages = await messageService.getMessages(chatId, {
          limit: 30,
          before: pageParam ?? undefined,
        });

        // Protección: si no hay mensajes, retornar array vacío
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
              } catch {
                return { ...msg, text: '[Error de cifrado]', status: 'failed' as const };
              }
            }
            return msg;
          })
        );
        return decryptedMessages;
      } catch (error) {
        console.error('[useMessagesQuery] Error:', error);
        return []; // Nunca retornar undefined
      }
    },

    // 🔧 FIX CRÍTICO: getNextPageParam con validación exhaustiva
    getNextPageParam: (lastPage, allPages) => {
      // Validación defensiva en cada nivel
      if (!lastPage) return undefined;
      if (!Array.isArray(lastPage)) return undefined;
      if (lastPage.length === 0) return undefined;
      if (lastPage.length < 30) return undefined;
      
      const oldest = lastPage[lastPage.length - 1];
      if (!oldest?.createdAt) return undefined;
      
      return new Date(oldest.createdAt).toISOString();
    },

    initialPageParam: null as string | null,
    
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    
    // 🔧 FIX: select con validación de estructura
    select: (data) => {
      if (!data?.pages) return [];
      if (!Array.isArray(data.pages)) return [];
      return data.pages
        .flat()
        .filter((item): item is Message => item !== null && item !== undefined);
    },
  });
}
