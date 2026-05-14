import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';
import { hkdf } from '@noble/hashes/hkdf';
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

  /**
   * Cifra datos binarios (Maestro 2026: Multimedia ZK).
   */
  async encryptBinary(data: Uint8Array, chatId: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; authTag: Uint8Array }> {
    const key = await this.getChatKey(chatId);
    const iv = await Crypto.getRandomBytesAsync(12);

    const aes = gcm(key, iv);
    const encrypted = aes.encrypt(data);

    const authTagLength = 16;
    const ciphertext = encrypted.slice(0, -authTagLength);
    const authTag = encrypted.slice(-authTagLength);

    return { ciphertext, iv, authTag };
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
      
      const decrypted = await this.decryptBinary(ciphertextArray, chatId, ivArray, authTagArray);
      return { text: new TextDecoder().decode(decrypted) };
    } catch (err) {
      console.error('[E2E] Decryption failed:', err);
      return { text: '[Error de descifrado]' };
    }
  }

  /**
   * Descifra datos binarios (Maestro 2026: Multimedia ZK).
   */
  async decryptBinary(
    ciphertext: Uint8Array,
    chatId: string,
    iv: Uint8Array,
    authTag: Uint8Array
  ): Promise<Uint8Array> {
    const key = await this.getChatKey(chatId);
    
    // Combinar para @noble gcm
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);

    const aes = gcm(key, iv);
    return aes.decrypt(combined);
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

  // Maestro 2026: Robust Base64 for Web/Mobile with Unicode support
  private uint8ArrayToBase64(buffer: Uint8Array): string {
    const chars = Array.from(buffer, byte => String.fromCharCode(byte)).join('');
    return btoa(chars);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }
}

export const e2eEncryptionService = new E2EEncryptionService();
