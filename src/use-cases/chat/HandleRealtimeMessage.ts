import { mapDatabaseMessageToDomain } from '@/services/supabase/mappers/message.mapper';
import type { Message } from '@/types';

export interface RealtimeMessageDependencies {
  decrypt: (
    ciphertext: string, 
    chatId: string, 
    iv: string, 
    authTag: string, 
    keyVersion?: string
  ) => Promise<{ text: string }>;
  isMessageProcessed: (messageId: string) => boolean;
  markMessageProcessed: (messageId: string) => void;
}

export const HandleRealtimeMessageUseCase = async (
  deps: RealtimeMessageDependencies, 
  payload: any, 
  chatId: string
): Promise<Message | null> => {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  if (eventType !== 'INSERT' && eventType !== 'UPDATE') {
    // Para borrados, devolvemos el ID para que el store lo elimine
    if (eventType === 'DELETE' && oldRecord?.id) {
      return { id: oldRecord.id } as any;
    }
    return null;
  }
  
  if (!newRecord?.id) return null;
  
  // Deduplicación
  if (deps.isMessageProcessed(newRecord.id) && eventType === 'INSERT') {
    return null;
  }
  
  try {
    const domainMsg = mapDatabaseMessageToDomain(newRecord);
    
    if (domainMsg.type === 'text' && domainMsg.encryptedPayload) {
      const { text } = await deps.decrypt(
        domainMsg.encryptedPayload.ciphertext,
        chatId,
        domainMsg.encryptedPayload.iv,
        domainMsg.encryptedPayload.authTag,
        domainMsg.encryptedPayload.keyVersion
      );
      const decryptedMsg = { ...domainMsg, text, plaintext: text };
      deps.markMessageProcessed(newRecord.id);
      return decryptedMsg;
    }
    
    deps.markMessageProcessed(newRecord.id);
    return domainMsg;
  } catch (err) {
    console.error('[Realtime] Failed to process message:', newRecord.id, err);
    return {
      ...mapDatabaseMessageToDomain(newRecord),
      text: '[Error al procesar mensaje]',
      status: 'failed',
    };
  }
};
