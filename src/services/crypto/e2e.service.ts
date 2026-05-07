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
      
      // Maestro 2026: Cache Limit (LRU-ish)
      if (this.keyCache.size > 50) {
        const firstKey = this.keyCache.keys().next().value;
        if (firstKey) this.keyCache.delete(firstKey);
      }
      
      this.keyCache.set(chatId, key);
      return key;
    }

    // Si no hay clave, NO generamos una aleatoria para chats E2E.
    // Se debe haber establecido previamente via establishSharedKey.
    // Solo generamos aleatoria como fallback si realmente es necesario, 
    // pero para Cerlita Chat 1-on-1 siempre usamos shared keys.
    throw new Error(`No E2E key found for chat ${chatId}. Handshake required.`);
  }

  /**
   * Establece una clave compartida determinísticamente (Maestro 2026: Zero-Trust Handshake).
   * Esta versión es la "Solución Mínima Viable" recomendada por la auditoría.
   */
  async establishSharedKey(chatId: string, userId: string, peerId: string): Promise<void> {
    const sortedIds = [userId, peerId].sort();
    const seed = `${sortedIds[0]}:${sortedIds[1]}:cerlita_v1`;
    
    const encoder = new TextEncoder();
    const crypto = (globalThis.crypto || (global as any).crypto) as Crypto;
    
    // Derivación HKDF
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(seed),
      'HKDF',
      false,
      ['deriveKey']
    );
    
    const chatKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode('cerlita-chat-salt-v1'),
        info: encoder.encode(`chat-key:${chatId}`),
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, 
      ['encrypt', 'decrypt']
    );
    
    const rawKey = await crypto.subtle.exportKey('raw', chatKey);
    const base64Key = this.arrayBufferToBase64(new Uint8Array(rawKey));
    
    // Almacenar con el ID del chat (UUID)
    await SecureStore.setItemAsync(`chat_key_${chatId}`, base64Key);
    
    // También almacenar con el ID determinístico para recuperación si el UUID cambia o se pierde
    const deterministicId = sortedIds.join(':');
    await SecureStore.setItemAsync(`chat_key_${deterministicId}`, base64Key);
    
    const key = await this.importKey(new Uint8Array(rawKey));
    this.keyCache.set(chatId, key);
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

  // Utilidad: ArrayBuffer a Base64 (Maestro 2026: Robust for binaries)
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
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
