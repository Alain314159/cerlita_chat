import { messageService } from '@/services/supabase/message.service';
import { supabase } from '@/services/supabase/config';

jest.mock('@/services/supabase/config', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

describe('messageService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getMessages', () => {
    it('should get messages for a chat', async () => {
      const mockDbMessages = [
        { 
          id: '1', 
          content: 'Hello', 
          chat_id: 'chat-123', 
          sender_id: 'user-1', 
          message_type: 'text',
          status: 'sent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        { 
          id: '2', 
          content: 'Hi', 
          chat_id: 'chat-123', 
          sender_id: 'user-2', 
          message_type: 'text',
          status: 'read',
          created_at: '2024-01-01T00:00:01Z',
          updated_at: '2024-01-01T00:00:01Z'
        },
      ];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockDbMessages, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await messageService.getMessages('chat-123');

      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(result[0]!.text).toBe('Hi');
      expect(result[1]!.text).toBe('Hello');
    });
  });

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const mockDbMsg = { 
        id: '1', 
        content: 'encrypted', 
        message_type: 'text', 
        chat_id: 'chat-123',
        sender_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      const mockInsertChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDbMsg, error: null })
      };
      
      const mockFromChain = {
        insert: jest.fn().mockReturnValue(mockInsertChain),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      (supabase.from as jest.Mock).mockReturnValue(mockFromChain);

      const result = await messageService.sendMessage({
        chatId: 'chat-123',
        senderId: 'user-1',
        text: 'encrypted-text',
        type: 'text',
      });

      expect(mockFromChain.insert).toHaveBeenCalledWith(expect.objectContaining({
        chat_id: 'chat-123',
        content: 'encrypted-text',
      }));
      expect(result.id).toBe('1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all messages as read', async () => {
      const mockChain: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
      };
      
      // La clave es que neq devuelva el objeto mockChain para permitir encadenamiento
      // Y al final, simulamos que el objeto tiene un comportamiento de promesa (then)
      // porque el servicio lo usa con await
      mockChain.neq.mockReturnValue(mockChain);
      
      // Simulamos el comportamiento de Supabase query
      mockChain.then = jest.fn((resolve) => resolve({ error: null }));

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await messageService.markAllAsRead('chat-123', 'user-1');

      expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'read'
      }));
      expect(mockChain.eq).toHaveBeenCalledWith('chat_id', 'chat-123');
      expect(mockChain.neq).toHaveBeenCalledWith('sender_id', 'user-1');
      expect(mockChain.neq).toHaveBeenCalledWith('status', 'read');
    });
  });
});
