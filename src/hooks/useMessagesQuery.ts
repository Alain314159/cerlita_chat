import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export function useMessagesQuery(chatId: string) {
  return useInfiniteQuery<Message[], Error, Message[], [string, string], string | null>({
    queryKey: ['messages', chatId],
    
    queryFn: async ({ pageParam }) => {
      try {
        // Validar chatId antes de consultar
        if (!chatId || typeof chatId !== 'string') {
          console.warn('[useMessagesQuery] Invalid chatId:', chatId);
          return [];
        }

        const messages = await messageService.getMessages(chatId, {
          limit: 30,
          before: pageParam ?? undefined,
        });

        // 🔧 FIX: Garantizar que siempre retornamos un array, nunca undefined
        if (!messages) {
          console.debug('[useMessagesQuery] No messages returned, returning []');
          return [];
        }

        // Si no hay mensajes, retornar array vacío sin intentar descifrar
        if (messages.length === 0) return [];

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
        return []; // Nunca propagar error, siempre retornar array válido
      }
    },

    // 🔧 FIX ULTRA-DEFENSIVO para getNextPageParam
    getNextPageParam: (lastPage) => {
      // Validaciones en cascada
      if (lastPage === null || lastPage === undefined) {
        return undefined;
      }
      if (!Array.isArray(lastPage)) {
        console.warn('[getNextPageParam] lastPage is not array:', typeof lastPage);
        return undefined;
      }
      if (lastPage.length === 0) {
        return undefined; // Chat vacío o última página
      }
      if (lastPage.length < 30) {
        return undefined; // No hay más páginas
      }
      
      // Obtener cursor del mensaje más antiguo (último del array)
      const oldest = lastPage[lastPage.length - 1];
      if (!oldest?.createdAt) {
        console.warn('[getNextPageParam] oldest message missing createdAt');
        return undefined;
      }
      
      return new Date(oldest.createdAt).toISOString();
    },

    initialPageParam: null as string | null,
    
    // Configuración optimizada para chats nuevos
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    
    // 🔧 FIX: select con validación exhaustiva de estructura
    select: (data: InfiniteData<Message[], string | null>): Message[] => {
      // Caso 1: data es undefined/null
      if (!data) return [];
      
      // Caso 2: data.pages no existe o no es array
      if (!data.pages || !Array.isArray(data.pages)) {
        console.warn('[select] Invalid data structure:', data);
        return [];
      }
      
      // Aplanar páginas y filtrar elementos inválidos
      return data.pages
        .flatMap(page => page ?? [])
        .filter((item): item is Message => 
          item !== null && 
          item !== undefined && 
          typeof item === 'object' && 
          'id' in item
        );
    },
    
    // 🔧 FIX: Habilitar placeholder data para chats nuevos (evita undefined inicial)
    placeholderData: (previousData) => previousData,
  });
}
