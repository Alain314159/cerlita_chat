import { mapDatabaseMessageToDomain } from '@/services/supabase/mappers/message.mapper';
import type { Message } from '@/types';

export interface RealtimeMessageDependencies {
  decrypt: (content: string, key: string, chatId: string) => Promise<string>;
}

export const HandleRealtimeMessageUseCase = async (
  deps: RealtimeMessageDependencies,
  payload: any,
  chatId: string
): Promise<Message | null> => {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    const domainMsg = mapDatabaseMessageToDomain(newRecord);
    
    if (domainMsg.type === 'text' && domainMsg.text) {
      try {
        const decrypted = await deps.decrypt(domainMsg.text, '', chatId);
        return { ...domainMsg, text: decrypted };
      } catch (err) {
        return { ...domainMsg, text: '[Error decrypting realtime message]' };
      }
    }
    return domainMsg;
  }
  
  // Para borrados, devolvemos el ID para que el store lo elimine
  if (eventType === 'DELETE') {
    return { id: oldRecord.id } as any;
  }

  return null;
};
