import { useMessageStore } from '../messageStore';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { pushNotificationService } from '@/services/pushNotifications';
import { supabase } from '@/services/supabase/config';

// Mocks
jest.mock('@/services/supabase/message.service');
jest.mock('@/services/crypto/e2e.service');
jest.mock('@/services/pushNotifications');
jest.mock('@/services/supabase/config');

describe('messageStore', () => {
  const mockChatId = 'chat-123';
  const mockSenderId = 'user-abc';
  const mockRecipientId = 'user-xyz';
  const textMessage = 'Hola amor ❤️';
  const encryptedText = 'encrypted-payload-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
    useMessageStore.setState({
      messages: [],
      loading: false,
      error: null
    });
  });

  it('debe enviar un mensaje cifrado y disparar la notificación push', async () => {
    // 1. Setup Mocks
    (e2eEncryptionService.encrypt as jest.Mock).mockResolvedValue({ ciphertext: encryptedText, iv: 'iv-123' });
    (messageService.sendMessage as jest.Mock).mockResolvedValue({ id: 'msg-999' });
    
    // Mock Supabase para encontrar al destinatario
    (supabase.from as jest.Mock).mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        if (table === 'chats') return Promise.resolve({ data: { participant_ids: [mockSenderId, mockRecipientId] } });
        if (table === 'users') return Promise.resolve({ data: { push_token: 'expo-token-xyz', display_name: 'Recipient' } });
        return Promise.resolve({ data: null });
      })
    }));

    // 2. Ejecutar envío
    await useMessageStore.getState().sendMessage(mockChatId, mockSenderId, textMessage);

    // 3. Verificaciones
    expect(e2eEncryptionService.encrypt).toHaveBeenCalledWith(textMessage, mockChatId);
    expect(messageService.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: mockChatId,
      content: encryptedText,
      messageType: 'text'
    }));

    // Esperar a que la notificación (que es asíncrona) se dispare
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalled();
  });

  it('no debe enviar notificación si no hay push_token', async () => {
    (e2eEncryptionService.encrypt as jest.Mock).mockResolvedValue({ ciphertext: encryptedText, iv: 'iv-123' });
    
    // Mock Supabase sin token
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { push_token: null } })
    }));

    await useMessageStore.getState().sendMessage(mockChatId, mockSenderId, textMessage);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(pushNotificationService.sendPushNotification).not.toHaveBeenCalled();
  });
});
