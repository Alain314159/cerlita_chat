import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export function useMessagesQuery(chatId: string, initialData?: Message[]) {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const messages = await messageService.getMessages(chatId);
      
      // Decrypt messages before returning to the UI
      return await Promise.all(
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
      ) as Message[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    initialData,
  });
}
