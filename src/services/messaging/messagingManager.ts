import { supabase } from '@/services/supabase/config';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { pushNotificationService } from '@/services/pushNotifications';
import type { MessageType } from '@/types';

export const messagingManager = {
  /**
   * Proceso completo de envío: Cifrado -> DB -> Notificación.
   */
  async sendMessageWithRetry(
    chatId: string,
    senderId: string,
    text: string,
    options: any = {},
    retryCount = 0
  ): Promise<any> {
    try {
      const messageType: MessageType = options?.messageType || 'text';
      
      // 1. Cifrado E2E
      let content = text;
      let iv = null;
      let authTag = null;
      let keyVersion = 'v1';

      if (messageType === 'text') {
        const encrypted = await e2eEncryptionService.encrypt(text, chatId);
        content = encrypted.ciphertext;
        iv = encrypted.iv;
        authTag = encrypted.authTag;
        keyVersion = encrypted.keyVersion;
      }
      
      // 2. Persistencia en Supabase
      const messageData = await messageService.sendMessage({
        chatId,
        senderId,
        text: content,
        type: messageType,
        mediaURL: options?.mediaUrl || null,
        thumbnailURL: options?.thumbnailUrl || null,
        replyToId: options?.replyToId || null,
        iv,
        authTag,
        keyVersion,
        isEphemeral: options?.isEphemeral || false,
        isViewOnce: options?.isViewOnce || false,
      });

      // 3. Notificación en segundo plano (No bloqueante)
      this.dispatchNotification(chatId, senderId, text, messageType);

      return messageData;
    } catch (error) {
      if (retryCount < 3) {
        console.warn(`[MessagingManager] Fallo en envío, reintentando (${retryCount + 1})...`);
        return this.sendMessageWithRetry(chatId, senderId, text, options, retryCount + 1);
      }
      throw error;
    }
  },

  /**
   * Gestiona el envío de la notificación de Expo de forma aislada.
   */
  async dispatchNotification(chatId: string, senderId: string, text: string, messageType: string) {
    try {
      const { data: chatData } = await supabase
        .from('chats')
        .select('participant_ids')
        .eq('id', chatId)
        .single();

      if (!chatData) return;

      const recipientId = chatData.participant_ids.find((id: string) => id !== senderId);
      if (!recipientId) return;

      const { data: userData } = await supabase
        .from('users')
        .select('push_token, display_name')
        .eq('id', recipientId)
        .single();

      const { data: senderData } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', senderId)
        .single();

      if (userData?.push_token) {
        await pushNotificationService.sendPushNotification(
          userData.push_token,
          `Mensaje de ${senderData?.display_name || 'Alguien'}`,
          'Tienes un mensaje nuevo', // Privacidad E2E
          { chatId, type: 'new_message' }
        );
      }
    } catch (err) {
      console.error('[MessagingManager] Error en notificación:', err);
    }
  }
};
