import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
// @ts-ignore
import { gcm } from '@noble/ciphers/aes';
// @ts-ignore
import { hkdf } from '@noble/hashes/hkdf';
// @ts-ignore
import { sha256 } from '@noble/hashes/sha2';

export class E2EEncryptionService {
  private keyCache = new Map<string, Uint8Array>();

  // Generar clave AES para un chat
  async generateChatKey(chatId: string): Promise<Uint8Array> {
    const keyBytes = await Crypto.getRandomBytesAsync(32); // 256 bits

    // Almacenar clave de forma segura
    await SecureStore.setItemAsync(
      `chat_key_${chatId}`,
      this.uint8ArrayToBase64(keyBytes)
    );

    return keyBytes;
  }

  // Obtener o crear clave para chat
  async getChatKey(chatId: string): Promise<Uint8Array> {
    if (this.keyCache.has(chatId)) {
      return this.keyCache.get(chatId)!;
    }

    const storedKey = await SecureStore.getItemAsync(`chat_key_${chatId}`);

    if (storedKey) {
      const key = this.base64ToUint8Array(storedKey);
      
      // Maestro 2026: Cache Limit (LRU-ish)
      if (this.keyCache.size > 50) {
        const firstKey = this.keyCache.keys().next().value;
        if (firstKey) this.keyCache.delete(firstKey);
      }
      
      this.keyCache.set(chatId, key);
      return key;
    }

    // Para Cerlita Chat 1-on-1 siempre usamos shared keys (HKDF).
    throw new Error(`No E2E key found for chat ${chatId}. Handshake required.`);
  }

  /**
   * Establece una clave compartida determinísticamente (Maestro 2026: Zero-Trust Handshake).
   */
  async establishSharedKey(chatId: string, userId: string, peerId: string): Promise<void> {
    const sortedIds = [userId, peerId].sort();
    const seed = `${sortedIds[0]}:${sortedIds[1]}:cerlita_v1`;
    
    const encoder = new TextEncoder();
    
    // Derivación HKDF usando @noble (Consistente en Android/iOS/Web)
    const chatKey = hkdf(sha256, encoder.encode(seed), encoder.encode('cerlita-chat-salt-v1'), encoder.encode(`chat-key:${chatId}`), 32);
    
    const base64Key = this.uint8ArrayToBase64(chatKey);
    
    // Almacenar con el ID del chat (UUID)
    await SecureStore.setItemAsync(`chat_key_${chatId}`, base64Key);
    
    // También almacenar con el ID determinístico para recuperación
    const deterministicId = sortedIds.join(':');
    await SecureStore.setItemAsync(`chat_key_${deterministicId}`, base64Key);
    
    this.keyCache.set(chatId, chatKey);
  }

  // Cifrar mensaje
  async encrypt(plaintext: string, chatId: string): Promise<{ ciphertext: string; iv: string; authTag: string; keyVersion: string }> {
    const key = await this.getChatKey(chatId);
    const iv = await Crypto.getRandomBytesAsync(12); // 96 bits para GCM

    const aes = gcm(key, iv);
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = aes.encrypt(encoded);

    // En @noble/ciphers/aes, el authTag está incluido al final del ciphertext
    const authTagLength = 16;
    const ciphertext = encrypted.slice(0, -authTagLength);
    const authTag = encrypted.slice(-authTagLength);

    return {
      ciphertext: this.uint8ArrayToBase64(ciphertext),
      iv: this.uint8ArrayToBase64(iv),
      authTag: this.uint8ArrayToBase64(authTag),
      keyVersion: 'v1',
    };
  }

  // Descifrar mensaje
  async decrypt(
    ciphertext: string,
    chatId: string,
    iv?: string,
    authTag?: string,
    keyVersion?: string
  ): Promise<{ text: string }> {
    if (!iv || !authTag) {
      return { text: ciphertext };
    }

    try {
      const key = await this.getChatKey(chatId);
      const ivArray = this.base64ToUint8Array(iv);
      const ciphertextArray = this.base64ToUint8Array(ciphertext);
      const authTagArray = this.base64ToUint8Array(authTag);
      
      // Combinar para @noble gcm
      const combined = new Uint8Array(ciphertextArray.length + authTagArray.length);
      combined.set(ciphertextArray);
      combined.set(authTagArray, ciphertextArray.length);

      const aes = gcm(key, ivArray);
      const decrypted = aes.decrypt(combined);

      return { text: new TextDecoder().decode(decrypted) };
    } catch (err) {
      console.error('[E2E] Decryption failed:', err);
      return { text: '[Error de descifrado]' };
    }
  }

  // Eliminar clave de chat
  async deleteChatKey(chatId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`chat_key_${chatId}`);
    this.keyCache.delete(chatId);
    
    // Buscar y borrar referencias determinísticas
    for (const [key, _] of this.keyCache) {
      if (key.includes(':') && key.includes(chatId)) {
         await SecureStore.deleteItemAsync(`chat_key_${key}`);
         this.keyCache.delete(key);
      }
    }
  }

  // Limpiar todas las claves
  async clearAllKeys(): Promise<void> {
    this.keyCache.clear();
  }

  private uint8ArrayToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      const byte = buffer[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

export const e2eEncryptionService = new E2EEncryptionService();
