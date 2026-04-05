import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export class E2EEncryptionService {
  private keyCache = new Map<string, CryptoKey>();

  // Generate AES key for a chat
  async generateChatKey(chatId: string): Promise<CryptoKey> {
    const key = await Crypto.getRandomBytesAsync(32); // 256 bits
    
    // Store key securely
    await SecureStore.setItemAsync(
      `chat_key_${chatId}`,
      this.arrayBufferToBase64(key)
    );

    return this.importKey(key);
  }

  // Get or create key for chat
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

  // Encrypt message
  async encrypt(plaintext: string, chatId: string): Promise<{ ciphertext: string; iv: string }> {
    const key = await this.getChatKey(chatId);
    const iv = Crypto.getRandomBytes(12); // 96 bits for GCM

    const encoded = new TextEncoder().encode(plaintext);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      ciphertext: this.arrayBufferToBase64(new Uint8Array(ciphertext)),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  // Decrypt message
  async decrypt(
    ciphertext: string,
    iv: string,
    chatId: string
  ): Promise<string> {
    const key = await this.getChatKey(chatId);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToArrayBuffer(iv) },
      key,
      this.base64ToArrayBuffer(ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }

  // Import raw key
  private async importKey(keyData: Uint8Array): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Delete chat key
  async deleteChatKey(chatId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`chat_key_${chatId}`);
    this.keyCache.delete(chatId);
  }

  // Clear all keys
  async clearAllKeys(): Promise<void> {
    this.keyCache.clear();
    // Note: SecureStore keys persist, would need to delete individually
  }

  // Utility: ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    buffer.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  // Utility: Base64 to ArrayBuffer
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
