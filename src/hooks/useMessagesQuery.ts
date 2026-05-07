import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export function useMessagesQuery(chatId: string) {
  return useInfiniteQuery<Message[], Error, Message[], [string, string], string | null>({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam }) => {
      const messages = await messageService.getMessages(chatId, { 
        limit: 30, 
        before: (pageParam as string) || undefined 
      });

      // Descifrado con concurrencia limitada para eficiencia térmica y de memoria
      const CONCURRENCY_LIMIT = 5;
      const decryptedMessages: Message[] = [];
      
      for (let i = 0; i < messages.length; i += CONCURRENCY_LIMIT) {
        const batch = messages.slice(i, i + CONCURRENCY_LIMIT);
        const batchResults = await Promise.allSettled(
          batch.map(async (msg) => {
            if (msg.text && msg.type === 'text' && msg.encryptedPayload) {
              try {
                const { text } = await e2eEncryptionService.decrypt(
                  msg.encryptedPayload.ciphertext,
                  chatId,
                  msg.encryptedPayload.iv,
                  msg.encryptedPayload.authTag
                );
                return { ...msg, text, plaintext: text }; // plaintext SOLO para caché local
              } catch (err) {
                console.warn('[Decryption] Failed for message:', msg.id, err);
                return { ...msg, text: '[Error de cifrado]', status: 'failed' as const };
              }
            }
            // Fallback para mensajes antiguos sin encryptedPayload estructurado
            if (msg.text && msg.iv && !msg.encryptedPayload) {
                try {
                    // Intentar descifrado simple (retrocompatibilidad)
                    const { text } = await e2eEncryptionService.decrypt(msg.text, chatId, msg.iv, msg.iv /* fake tag to try */);
                    return { ...msg, text, plaintext: text };
                } catch {
                    return { ...msg, text: '[Error de cifrado]', status: 'failed' as const };
                }
            }
            return msg;
          })
        );
        
        decryptedMessages.push(
          ...batchResults.map((result, idx) => 
            result.status === 'fulfilled' ? result.value : batch[idx] as Message
          )
        );
      }

      return decryptedMessages;
    },
    getNextPageParam: (lastPage: Message[]) => {
      if (!lastPage || lastPage.length < 30) return null;
      // Usar el mensaje MÁS ANTIGUO (último del array si está ordenado descendente)
      const oldest = lastPage[lastPage.length - 1];
      return oldest?.createdAt || null;
    },
    initialPageParam: null,
    staleTime: 1000 * 60 * 5, // 5 minutos (Maestro 2026: Eficiencia de datos)
    gcTime: 1000 * 60 * 30,   // 30 minutos de retención
    select: (data: InfiniteData<Message[], string | null>): Message[] => {
      return data.pages.flat();
    },
  });
}
