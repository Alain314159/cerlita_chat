import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export const ForwardMessageUseCase = async (
  message: Message,
  targetChatIds: string[],
  currentUserId: string
) => {
  if (!message.text) return;

  for (const chatId of targetChatIds) {
    const { ciphertext } = await e2eEncryptionService.encrypt(message.text, chatId);
    await messageService.sendMessage({
      chatId,
      senderId: currentUserId,
      content: ciphertext,
      messageType: 'text',
    });
  }
};
