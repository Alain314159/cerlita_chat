import type { MessageType, EncryptedPayload, User } from '@/types';

export interface SendMessageDependencies {
  encrypt: (text: string, chatId: string) => Promise<{ 
    ciphertext: string; 
    iv: string; 
    authTag: string;
    keyVersion: string;
  }>;
  sendMessage: (params: any) => Promise<{ id: string }>;
  getChatParticipants: (chatId: string) => Promise<string[]>;
  getUserById: (userId: string) => Promise<User | null>;
  sendPushNotification: (token: string, title: string, body: string, data: any) => Promise<void>;
}

export const SendMessageUseCase = async (
  deps: SendMessageDependencies, 
  { 
    chatId, 
    senderId, 
    text, 
    options 
  }: {
    chatId: string;
    senderId: string;
    text: string;
    options?: {
      messageType?: MessageType;
      mediaUrl?: string;
      thumbnailUrl?: string;
      replyToId?: string;
      isEphemeral?: boolean;
      isViewOnce?: boolean;
    };
  }
): Promise<{ messageId: string; notificationPromise?: Promise<void> }> => {
  
  // 🔐 PASO 1: Cifrar ANTES de enviar al servidor
  let content: string | null = null;
  let encryptedPayload: EncryptedPayload | undefined;
  
  if (options?.messageType === 'text' || (!options?.messageType && text)) {
    const encryptionResult = await deps.encrypt(text, chatId);
    encryptedPayload = {
      ciphertext: encryptionResult.ciphertext,
      iv: encryptionResult.iv,
      authTag: encryptionResult.authTag,
      keyVersion: encryptionResult.keyVersion || 'v1',
    };
    content = encryptionResult.ciphertext; // Enviar ciphertext a la DB
  } else {
    content = text; // Para multimedia, el archivo ya debería estar cifrado antes de subir
  }

  // PASO 2: Enviar al servidor con payload cifrado (camelCase para el mapper)
  const result = await deps.sendMessage({
    chatId,
    senderId,
    text: content, // El mapper usará encryptedPayload.ciphertext si existe, sino text
    type: options?.messageType || 'text',
    mediaURL: options?.mediaUrl || null,
    thumbnailURL: options?.thumbnailUrl || null,
    replyToId: options?.replyToId || null,
    status: 'sent',
    isEphemeral: options?.isEphemeral || false,
    isViewOnce: options?.isViewOnce || false,
    encryptedPayload, // Pasar el objeto completo
    iv: encryptedPayload?.iv, // Retrocompatibilidad
  });


  // PASO 3: Notificación push GENÉRICA (no revelar contenido)
  const notificationPromise = (async () => {
    try {
      const participantIds = await deps.getChatParticipants(chatId);
      const recipientId = participantIds?.find((id: string) => id !== senderId);
      if (recipientId) {
        const userData = await deps.getUserById(recipientId);
        if (userData?.pushToken) {
          // 🔐 Mensaje genérico para no filtrar contenido E2E
          await deps.sendPushNotification(
            userData.pushToken, 
            "Nuevo mensaje", 
            "Tienes un mensaje nuevo", 
            { chatId, messageId: result.id }
          );
        }
      }
    } catch (err) { 
      console.error('[SendMessage] Push notification failed:', err); 
    }
  })();

  return { messageId: result.id, notificationPromise };
};
