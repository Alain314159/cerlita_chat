import * as FileSystem from 'expo-file-system';
import { e2eEncryptionService } from '../crypto/e2e.service';

const CACHE_DIR = `${FileSystem.cacheDirectory}decrypted_media/`;

export class MediaCacheService {
  private async ensureCacheDir() {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }

  async getDecrypted(messageId: string, mediaURL: string, chatId: string, iv: string, authTag: string): Promise<string | null> {
    try {
      await this.ensureCacheDir();
      const filename = `${messageId}.webp`;
      const localUri = `${CACHE_DIR}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        return localUri;
      }

      // Descargar y descifrar
      console.log(`[MediaCache] Downloading and decrypting ${messageId}...`);
      const response = await fetch(mediaURL);
      const arrayBuffer = await response.arrayBuffer();
      const encryptedData = new Uint8Array(arrayBuffer);

      const decryptedData = await e2eEncryptionService.decryptBinary(
        encryptedData,
        chatId,
        this.base64ToUint8Array(iv),
        this.base64ToUint8Array(authTag)
      );

      // Guardar en caché local
      const base64 = this.uint8ArrayToBase64(decryptedData);
      await FileSystem.writeAsStringAsync(localUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      return localUri;
    } catch (err) {
      console.error('[MediaCache] Error:', err);
      return null;
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }

  private uint8ArrayToBase64(buffer: Uint8Array): string {
    const chars = Array.from(buffer, byte => String.fromCharCode(byte)).join('');
    return btoa(chars);
  }
}

export const mediaCacheService = new MediaCacheService();
