import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

export const EditMessageUseCase = async (messageId: string, newText: string, chatId: string) => {
  const { ciphertext } = await e2eEncryptionService.encrypt(newText, chatId);
  
  await messageService.updateMessage(messageId, {
    content: ciphertext,
    is_edited: true,
  });

  return { decryptedText: newText };
};
