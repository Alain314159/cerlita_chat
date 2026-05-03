import { e2eEncryptionService } from '../e2e.service';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { webcrypto } from 'node:crypto';

// Añadir soporte de WebCrypto al entorno de test
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Mocks
jest.mock('expo-secure-store');
jest.mock('expo-crypto');

describe('E2EEncryptionService', () => {
  const mockChatId = 'test-chat-123';
  const secretMessage = 'Hola amor, te quiero ❤️';

  beforeEach(async () => {
    jest.clearAllMocks();
    await e2eEncryptionService.clearAllKeys();
    
    // Mock de Crypto.getRandomBytesAsync para que devuelva un Uint8Array válido
    (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValue(new Uint8Array(32));
  });

  it('debe cifrar y descifrar un mensaje correctamente', async () => {
    const { ciphertext, iv } = await e2eEncryptionService.encrypt(secretMessage, mockChatId);
    
    expect(ciphertext).toBeDefined();
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext).not.toBe(secretMessage);

    const decrypted = await e2eEncryptionService.decrypt(ciphertext, iv, mockChatId);
    expect(decrypted).toBe(secretMessage);
  });

  it('debe fallar al descifrar con un IV incorrecto', async () => {
    const { ciphertext } = await e2eEncryptionService.encrypt(secretMessage, mockChatId);
    const wrongIv = btoa('wrong-iv-length-96-bits-xyz');

    await expect(
      e2eEncryptionService.decrypt(ciphertext, wrongIv, mockChatId)
    ).rejects.toThrow();
  });

  it('debe generar una nueva clave si no existe en SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    
    await e2eEncryptionService.getChatKey(mockChatId);
    
    expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      `chat_key_${mockChatId}`,
      expect.any(String)
    );
  });

  it('debe recuperar la clave existente de SecureStore', async () => {
    const existingKeyBase64 = btoa('a'.repeat(32)); // 32 bytes key
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(existingKeyBase64);
    
    await e2eEncryptionService.getChatKey(mockChatId);
    
    expect(Crypto.getRandomBytesAsync).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(`chat_key_${mockChatId}`);
  });

  it('debe manejar mensajes con caracteres especiales y emojis', async () => {
    const emojiMessage = '🚀🔥 🔒 1234567890 !@#$%^&*()_+';
    const { ciphertext, iv } = await e2eEncryptionService.encrypt(emojiMessage, mockChatId);
    const decrypted = await e2eEncryptionService.decrypt(ciphertext, iv, mockChatId);
    
    expect(decrypted).toBe(emojiMessage);
  });

  it('debe fallar si el ciphertext está corrupto', async () => {
    const { iv } = await e2eEncryptionService.encrypt(secretMessage, mockChatId);
    const corruptedCiphertext = btoa('not-a-valid-encrypted-message');

    await expect(
      e2eEncryptionService.decrypt(corruptedCiphertext, iv, mockChatId)
    ).rejects.toThrow();
  });
});
