import { messageService } from '@/services/supabase/message.service';

export const DeleteMessageUseCase = async (messageId: string) => {
  await messageService.deleteMessage(messageId);
};
