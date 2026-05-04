import { renderHook, waitFor } from '@testing-library/react-native';
import { useMessagesQuery } from '../useMessagesQuery';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mocks
jest.mock('@/services/supabase/message.service');
jest.mock('@/services/crypto/e2e.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMessagesQuery - Integration Test', () => {
  const mockChatId = 'chat-123';
  const mockMessages = [
    { id: '1', content: 'encrypted-1', message_type: 'text' },
    { id: '2', content: 'hello', message_type: 'system' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe cargar mensajes y descifrarlos automáticamente', async () => {
    (messageService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (e2eEncryptionService.decrypt as jest.Mock).mockResolvedValue('Decrypted Message');

    const { result } = renderHook(() => useMessagesQuery(mockChatId), {
      wrapper: createWrapper(),
    });

    // Debe estar en estado loading inicialmente
    expect(result.current.isLoading).toBe(true);

    // Esperar a que la query termine
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].text).toBe('Decrypted Message');
    expect(result.current.data![1].text).toBe('hello'); // System messages no se descifran
    expect(e2eEncryptionService.decrypt).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar [Unable to decrypt] si falla el descifrado pero seguir funcionando', async () => {
    (messageService.getMessages as jest.Mock).mockResolvedValue([mockMessages[0]]);
    (e2eEncryptionService.decrypt as jest.Mock).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useMessagesQuery(mockChatId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].text).toBe('[Unable to decrypt]');
  });
});
