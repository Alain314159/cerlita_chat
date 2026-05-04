import { useMessageStore } from '../messageStore';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { pushNotificationService } from '@/services/pushNotifications';
import { userService } from '@/services/supabase/user.service';

// Mocks
jest.mock('@/services/supabase/message.service');
jest.mock('@/services/supabase/user.service');
jest.mock('@/services/crypto/e2e.service');
jest.mock('@/services/pushNotifications');

describe('messageStore - Real Architecture Test', () => {
  const mockChatId = 'chat-123';
  const mockSenderId = 'user-sender';
  const mockRecipientId = 'user-recipient';
  const textMessage = 'Mensaje ultra secreto 🤐';
  const encryptedText = 'cifrado-123';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useMessageStore.setState({
      messages: [],
      loading: false,
      error: null,
      currentUserId: mockSenderId
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe orquestar el envío de mensaje: cifrar -> guardar -> notificar', async () => {
    // ... setup mocks ...
    (e2eEncryptionService.encrypt as jest.Mock).mockResolvedValue({ ciphertext: encryptedText });
    (messageService.sendMessage as jest.Mock).mockResolvedValue({ id: 'msg-final' });
    (messageService.getChatParticipants as jest.Mock).mockResolvedValue([mockSenderId, mockRecipientId]);
    (userService.getUserById as jest.Mock).mockImplementation((id) => {
      if (id === mockRecipientId) return Promise.resolve({ id, push_token: 'token-valido', display_name: 'Amigo' });
      if (id === mockSenderId) return Promise.resolve({ id, display_name: 'Yo' });
      return Promise.resolve(null);
    });

    // 2. Acción
    await useMessageStore.getState().sendMessage(mockChatId, mockSenderId, textMessage);

    // 3. Verificaciones
    expect(e2eEncryptionService.encrypt).toHaveBeenCalledWith(textMessage, mockChatId);
    
    // Forzar la resolución de todas las microtareas/promesas pendientes
    await new Promise(jest.requireActual('timers').setImmediate);
    
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalled();
  });

  it('debe manejar errores de cifrado correctamente y actualizar el estado', async () => {
    (e2eEncryptionService.encrypt as jest.Mock).mockRejectedValue(new Error('Cifrado falló'));

    try {
      await useMessageStore.getState().sendMessage(mockChatId, mockSenderId, 'error');
    } catch (e) {
      // Ignorar error lanzado
    }

    const state = useMessageStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Cifrado falló');
  });
});
