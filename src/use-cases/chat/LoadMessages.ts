import type { Message } from '@/types';

export interface LoadMessagesDependencies {
  getMessages: (chatId: string) => Promise<any[]>;
  decrypt: (content: string, key: string, chatId: string) => Promise<string>;
}

export const LoadMessagesUseCase = async (deps: LoadMessagesDependencies, chatId: string) => {
  const messages = await deps.getMessages(chatId);
  
  const decryptedMessages = await Promise.all(
    messages.map(async (msg: any) => {
      if (msg.text && msg.type === 'text') {
        try {
          const decrypted = await deps.decrypt(msg.text, '', chatId);
          return { ...msg, text: decrypted };
        } catch {
          return { ...msg, text: '[Unable to decrypt]' };
        }
      }
      return msg;
    })
  );

  return decryptedMessages as Message[];
};
