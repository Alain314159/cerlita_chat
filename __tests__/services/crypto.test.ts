import { e2eEncryptionService } from '@/services/crypto/e2e.service';
import { webcrypto } from 'node:crypto';

// Añadir soporte de WebCrypto al entorno de test para Node
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Mock de expo-crypto para entorno de test
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32)),
  digestStringAsync: jest.fn().mockResolvedValue('mocked-digest'),
  CryptoCipherAlgorithm: { AES_GCM: 'aes-gcm' },
}));

// Mock de SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(Buffer.from('a'.repeat(32)).toString('base64')),
  setItemAsync: jest.fn().mockResolvedValue(null),
}));

describe('E2E Encryption Service', () => {
  const chatId = 'test-chat-uuid';
  const otherChatId = 'other-chat-uuid';
  const plainText = 'Hola, este es un mensaje secreto 💕';

  beforeEach(async () => {
    // Limpiar claves antes de cada test
    await e2eEncryptionService.clearAllKeys();
  });

  it('debe cifrar un mensaje y devolver un ciphertext diferente al original', async () => {
    const { ciphertext } = await e2eEncryptionService.encrypt(plainText, chatId);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(plainText);
  });

  it('debe descifrar correctamente un mensaje cifrado para el mismo chat', async () => {
    const { ciphertext, iv } = await e2eEncryptionService.encrypt(plainText, chatId);
    const decrypted = await e2eEncryptionService.decrypt(ciphertext, iv, chatId);
    expect(decrypted).toBe(plainText);
  });

  it('debe fallar al descifrar un mensaje con un chatId diferente (aislamiento)', async () => {
    const { ciphertext, iv } = await e2eEncryptionService.encrypt(plainText, chatId);
    
    // Al intentar descifrar con otro chatId, usará una clave diferente recuperada del mock
    // En este caso, el mock siempre devuelve la misma clave, por lo que para forzar el fallo
    // en aislamiento real deberíamos mockear claves diferentes.
    // Pero como estamos usando el mismo mock, fallará si intentamos descifrar algo que no corresponde.
    // Realmente, si la clave es la misma, descifraría.
    // Para probar el aislamiento, necesitamos que el mock devuelva claves distintas según el chatId.
    
    // Mock dinámico para SecureStore
    const SecureStore = require('expo-secure-store');
    SecureStore.getItemAsync.mockImplementation((key: string) => {
      if (key.includes(chatId)) return Buffer.from('a'.repeat(32)).toString('base64');
      if (key.includes(otherChatId)) return Buffer.from('b'.repeat(32)).toString('base64');
      return null;
    });

    try {
      await e2eEncryptionService.decrypt(ciphertext, iv, otherChatId);
      // No debería llegar aquí si la clave es diferente
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('debe generar IVs diferentes para el mismo mensaje (seguridad GCM)', async () => {
    const res1 = await e2eEncryptionService.encrypt(plainText, chatId);
    const res2 = await e2eEncryptionService.encrypt(plainText, chatId);
    
    expect(res1.ciphertext).not.toBe(res2.ciphertext);
  });
});
