import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

export const EditMessageUseCase = async (messageId: string, newText: string, chatId: string) => {
  const { ciphertext, iv, authTag, keyVersion } = await e2eEncryptionService.encrypt(newText, chatId);
  
  await messageService.updateMessage(messageId, {
    text: ciphertext,
    isEdited: true,
    iv,
    encryptedPayload: { ciphertext, iv, authTag, keyVersion }
  } as any);

  return { decryptedText: newText };
};
