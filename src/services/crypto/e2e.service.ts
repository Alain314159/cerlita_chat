import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export class E2EEncryptionService {
  private keyCache = new Map<string, CryptoKey>();

  // Generar clave AES para un chat
  async generateChatKey(chatId: string): Promise<CryptoKey> {
    const keyBytes = await Crypto.getRandomBytesAsync(32); // 256 bits

    // Almacenar clave de forma segura
    await SecureStore.setItemAsync(
      `chat_key_${chatId}`,
      this.arrayBufferToBase64(keyBytes)
    );

    return this.importKey(keyBytes);
  }

  // Obtener o crear clave para chat
  async getChatKey(chatId: string): Promise<CryptoKey> {
    if (this.keyCache.has(chatId)) {
      return this.keyCache.get(chatId)!;
    }

    const storedKey = await SecureStore.getItemAsync(`chat_key_${chatId}`);

    if (storedKey) {
      const key = await this.importKey(this.base64ToArrayBuffer(storedKey));
      this.keyCache.set(chatId, key);
      return key;
    }

    return this.generateChatKey(chatId);
  }

  // Cifrar mensaje
  async encrypt(plaintext: string, chatId: string): Promise<{ ciphertext: string; iv: string; authTag: string; keyVersion: string }> {
    const key = await this.getChatKey(chatId);
    const crypto = (globalThis.crypto || (global as unknown as { crypto: Crypto }).crypto) as Crypto;
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits para GCM

    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    const ciphertextArray = new Uint8Array(ciphertextBuffer);
    // El authTag suele ser los últimos 16 bytes en la implementación de Web Crypto
    const authTagLength = 16;
    const ciphertext = ciphertextArray.slice(0, -authTagLength);
    const authTag = ciphertextArray.slice(-authTagLength);

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      authTag: this.arrayBufferToBase64(authTag),
      keyVersion: 'v1', // Versión inicial
    };
  }

  // Descifrar mensaje
  async decrypt(
    ciphertext: string,
    chatId: string,
    iv?: string,
    authTag?: string
  ): Promise<{ text: string }> {
    if (!iv || !authTag) {
      // Si falta IV o Tag, no podemos verificar integridad
      return { text: ciphertext };
    }

    try {
      const key = await this.getChatKey(chatId);
      const crypto = (globalThis.crypto || (global as unknown as { crypto: Crypto }).crypto) as Crypto;

      const ciphertextArray = this.base64ToArrayBuffer(ciphertext);
      const authTagArray = this.base64ToArrayBuffer(authTag);
      
      // Combinar ciphertext y authTag para Web Crypto Subtle
      const combined = new Uint8Array(ciphertextArray.length + authTagArray.length);
      combined.set(ciphertextArray);
      combined.set(authTagArray, ciphertextArray.length);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: this.base64ToArrayBuffer(iv),
        },
        key,
        combined
      );

      return { text: new TextDecoder().decode(decrypted) };
    } catch (err) {
      console.error('[E2E] Decryption failed:', err);
      return { text: '[Error de descifrado]' };
    }
  }

  // Importar clave raw
  private async importKey(keyData: Uint8Array): Promise<CryptoKey> {
    const crypto = (globalThis.crypto || (global as unknown as { crypto: Crypto }).crypto) as Crypto;
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Eliminar clave de chat
  async deleteChatKey(chatId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`chat_key_${chatId}`);
    this.keyCache.delete(chatId);
  }

  // Limpiar todas las claves
  async clearAllKeys(): Promise<void> {
    this.keyCache.clear();
  }

  // Utilidad: ArrayBuffer a Base64
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    buffer.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  // Utilidad: Base64 a ArrayBuffer
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

export const e2eEncryptionService = new E2EEncryptionService();
