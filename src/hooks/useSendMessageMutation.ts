import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export function useSendMessageMutation(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      text, 
      senderId, 
      isEphemeral = false,
      isViewOnce = false
    }: { 
      text: string; 
      senderId: string; 
      isEphemeral?: boolean;
      isViewOnce?: boolean;
    }) => {
      // 1. Encrypt
      const { ciphertext } = await e2eEncryptionService.encrypt(text, chatId);

      // 2. Calculate expiry (24 hours from now) if ephemeral
      const expiresAt = isEphemeral 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
        : null;

      // 3. Send
      return await messageService.sendMessage({
        chatId,
        senderId,
        content: ciphertext,
        messageType: 'text',
        isEphemeral,
        expiresAt,
        isViewOnce,
      });
    },

    // Optimistic Update
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      if (previousMessages) {
        queryClient.setQueryData<Message[]>(['messages', chatId], [
          ...previousMessages,
          {
            id: `temp-${Date.now()}`,
            chatId,
            senderId: newMessage.senderId,
            text: newMessage.text,
            type: 'text',
            status: 'sending',
            isEphemeral: newMessage.isEphemeral || false,
            isViewOnce: newMessage.isViewOnce || false,
            createdAt: new Date(),
          } as any,
        ]);
      }
      return { previousMessages };
    },

    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', chatId], context.previousMessages);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
    
    // Configuración 2026: Reintentos si falla por red
    retry: 3,
  });
}
