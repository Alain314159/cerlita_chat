import type { MessageType } from '@/types';

export interface SendMessageDependencies {
  encrypt: (text: string, chatId: string) => Promise<{ ciphertext: string }>;
  sendMessage: (params: any) => Promise<{ id: string }>;
  getChatParticipants: (chatId: string) => Promise<string[]>;
  getUserById: (userId: string) => Promise<any>;
  sendPushNotification: (token: string, title: string, body: string, data: any) => Promise<void>;
}

interface SendMessageParams {
  chatId: string;
  senderId: string;
  text: string;
  options?: {
    messageType?: MessageType;
    mediaUrl?: string;
    thumbnailUrl?: string;
    replyToId?: string;
  };
}

export const SendMessageUseCase = async (
  deps: SendMessageDependencies,
  { chatId, senderId, text, options }: SendMessageParams
) => {
  const messageType = options?.messageType || 'text';
  let content = text;

  if (messageType === 'text') {
    const { ciphertext } = await deps.encrypt(text, chatId);
    content = ciphertext;
  }

  const result = await deps.sendMessage({
    chatId,
    senderId,
    content,
    messageType,
    mediaUrl: options?.mediaUrl || null,
    thumbnailUrl: options?.thumbnailUrl || null,
    replyToId: options?.replyToId || null,
  });

  const notificationPromise = (async () => {
    try {
      const participantIds = await deps.getChatParticipants(chatId);
      const recipientId = participantIds?.find((id: string) => id !== senderId);

      if (recipientId) {
        const userData = await deps.getUserById(recipientId);
        const senderData = await deps.getUserById(senderId);

        if (userData?.pushToken) {
          await deps.sendPushNotification(
            userData.pushToken,
            `Mensaje de ${senderData?.displayName || 'Alguien'}`,
            messageType === 'text' ? text : `Te ha enviado un ${messageType}`,
            { chatId, type: 'new_message' }
          );
        }
      }
    } catch (err) {
      console.error('[SendMessageUseCase] Push Error:', err);
    }
  })();

  return {
    messageId: result.id,
    notificationPromise
  };
};
