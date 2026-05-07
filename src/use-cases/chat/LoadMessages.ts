import type { Message } from '@/types';

export interface LoadMessagesDependencies {
  getMessages: (chatId: string, options?: { limit?: number; before?: string }) => Promise<any[]>;
  decrypt: (
    ciphertext: string, 
    chatId: string, 
    iv: string, 
    authTag: string, 
    keyVersion?: string
  ) => Promise<{ text: string }>;
}

export const LoadMessagesUseCase = async (
  deps: LoadMessagesDependencies, 
  chatId: string,
  options?: { limit?: number; before?: string }
): Promise<Message[]> => {
  const messages = await deps.getMessages(chatId, options);

  // Descifrado con concurrencia limitada (evita picos de memoria)
  const CONCURRENCY_LIMIT = 5;
  const results: Message[] = [];
  
  for (let i = 0; i < messages.length; i += CONCURRENCY_LIMIT) {
    const batch = messages.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.allSettled(
      batch.map(async (msg) => {
        if (msg.type === 'text' && msg.encryptedPayload) {
          try {
            const { text } = await deps.decrypt(
              msg.encryptedPayload.ciphertext,
              chatId,
              msg.encryptedPayload.iv,
              msg.encryptedPayload.authTag,
              msg.encryptedPayload.keyVersion
            );
            return { ...msg, text, plaintext: text }; // plaintext SOLO para caché local
          } catch (err) {
            console.warn('[LoadMessages] Decryption failed:', msg.id, err);
            return { ...msg, text: '[Mensaje no legible]', status: 'failed' as const };
          }
        }
        return msg;
      })
    );
    
    results.push(
      ...batchResults.map((r, idx) => r.status === 'fulfilled' ? r.value : batch[idx])
    );
  }
  
  return results;
};
