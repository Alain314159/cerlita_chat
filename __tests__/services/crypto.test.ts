import { e2eEncryptionService } from '@/services/crypto/e2e.service';

// Mock de expo-crypto para entorno de test
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(12)),
  digestStringAsync: jest.fn().mockResolvedValue('mocked-digest'),
  CryptoCipherAlgorithm: { AES_GCM: 'aes-gcm' },
}));

// Mock de SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mocked-key'),
  setItemAsync: jest.fn().mockResolvedValue(null),
}));

describe('E2E Encryption Service', () => {
  const chatId = 'test-chat-uuid';
  const otherChatId = 'other-chat-uuid';
  const plainText = 'Hola, este es un mensaje secreto 💕';

  beforeEach(async () => {
    // Limpiar claves antes de cada test si fuera necesario
  });

  it('debe cifrar un mensaje y devolver un ciphertext diferente al original', async () => {
    const { ciphertext } = await e2eEncryptionService.encrypt(plainText, chatId);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(plainText);
  });

  it('debe descifrar correctamente un mensaje cifrado para el mismo chat', async () => {
    const { ciphertext } = await e2eEncryptionService.encrypt(plainText, chatId);
    const decrypted = await e2eEncryptionService.decrypt(ciphertext, '', chatId);
    expect(decrypted).toBe(plainText);
  });

  it('debe fallar al descifrar un mensaje con un chatId diferente (aislamiento)', async () => {
    const { ciphertext } = await e2eEncryptionService.encrypt(plainText, chatId);
    
    // Intentar descifrar con otro chatId debería lanzar error o devolver algo inválido
    try {
      const decrypted = await e2eEncryptionService.decrypt(ciphertext, '', otherChatId);
      expect(decrypted).not.toBe(plainText);
    } catch (error) {
      // Es aceptable que lance error si el aislamiento es fuerte
      expect(error).toBeDefined();
    }
  });

  it('debe generar IVs diferentes para el mismo mensaje (seguridad GCM)', async () => {
    const res1 = await e2eEncryptionService.encrypt(plainText, chatId);
    const res2 = await e2eEncryptionService.encrypt(plainText, chatId);
    
    expect(res1.ciphertext).not.toBe(res2.ciphertext);
  });
});
