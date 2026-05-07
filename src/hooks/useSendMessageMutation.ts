import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';
import * as SecureStore from 'expo-secure-store';

const OFFLINE_QUEUE_KEY = 'cerlita_offline_messages';

// Helper robusto para detectar errores de red
const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || error.status;
  
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('offline') ||
    msg.includes('connection') ||
    code === 'NETWORK_ERROR' ||
    code === 0 ||
    error?.name === 'TypeError' && msg.includes('fetch')
  );
};

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
      // 1. Cifrado local con AES-GCM (authTag incluido)
      const { ciphertext, iv, authTag, keyVersion } = await e2eEncryptionService.encrypt(text, chatId);

      // 2. Envío al servidor
      return await messageService.sendMessage({
        chatId,
        senderId,
        text: ciphertext,
        iv,
        authTag,
        keyVersion,
        type: 'text',
        isEphemeral,
        isViewOnce,
        status: 'sent'
      });
    },

    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });
      
      const previousData = queryClient.getQueryData<Message[]>(['messages', chatId]);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const optimisticMsg: Message = {
        id: tempId,
        chatId,
        senderId: newMessage.senderId,
        text: newMessage.text, // Plaintext SOLO para caché local (UI inmediata)
        type: 'text',
        status: 'sending',
        isEphemeral: newMessage.isEphemeral || false,
        isViewOnce: newMessage.isViewOnce || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        deliveredAt: null,
        mediaURL: null,
        thumbnailURL: null,
        replyToId: null,
        isEdited: false,
      };

      queryClient.setQueryData<Message[]>(['messages', chatId], (old) => {
        if (!old) return [optimisticMsg];
        return [optimisticMsg, ...old];
      });

      return { previousData, tempId };
    },

    onError: (err, newMessage, context) => {
      // Marcar como fallido en UI
      queryClient.setQueryData<Message[]>(['messages', chatId], (old) => {
        return old?.map((m: Message) => 
          m.id === context?.tempId ? { ...m, status: 'failed' as const } : m
        );
      });

      // TODO: Implementar guardado en SecureStore para cola offline real
      console.error('[Mutation Error]', err);
    },

    onSuccess: (data, variables, context) => {
      // Reemplazar temporal con real
      queryClient.setQueryData<Message[]>(['messages', chatId], (old) => {
        return old?.map((m: Message) => 
          m.id === context?.tempId ? data : m
        );
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
    
    retry: (failureCount, error: any) => {
      if (failureCount >= 5) return false;
      return isNetworkError(error);
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
}
