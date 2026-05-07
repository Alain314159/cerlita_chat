import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import type { Message } from '@/types';

export const ForwardMessageUseCase = async (
  message: Message,
  targetChatIds: string[],
  currentUserId: string
) => {
  const contentToForward = message.plaintext || message.text;
  if (!contentToForward) return;

  for (const chatId of targetChatIds) {
    const { ciphertext, iv, authTag, keyVersion } = await e2eEncryptionService.encrypt(contentToForward, chatId);
    await messageService.sendMessage({
      chatId,
      senderId: currentUserId,
      text: ciphertext,
      type: 'text',
      iv,
      encryptedPayload: { ciphertext, iv, authTag, keyVersion }
    } as any);
  }
};
