import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { e2eEncryptionService } from './crypto/e2e.service';

export const mediaService = {
  /**
   * Comprime una imagen para ahorrar datos y almacenamiento.
   * Estándar 2026: Balance entre calidad y peso (< 200KB).
   */
  async compressImage(uri: string) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Redimensionar a un ancho razonable
        { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP } // Usar WebP por eficiencia
      );
      return result.uri;
    } catch (error) {
      console.error('[MediaService] Error compressing image:', error);
      return uri; // Fallback a la original si falla
    }
  },

  /**
   * Cifra un archivo multimedia para almacenamiento Zero-Knowledge.
   */
  async encryptMedia(uri: string, chatId: string) {
    try {
      // 1. Leer archivo como base64 y convertir a Uint8Array
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // 2. Cifrar usando el servicio E2E
      const { ciphertext, iv, authTag } = await e2eEncryptionService.encryptBinary(binaryData, chatId);

      // 3. Devolver datos cifrados como Blob para subida y metadatos
      const encryptedBase64 = btoa(Array.from(ciphertext, byte => String.fromCharCode(byte)).join(''));
      
      return {
        encryptedBase64,
        iv: btoa(Array.from(iv, byte => String.fromCharCode(byte)).join('')),
        authTag: btoa(Array.from(authTag, byte => String.fromCharCode(byte)).join('')),
      };
    } catch (error) {
      console.error('[MediaService] Error encrypting media:', error);
      throw new Error('Error al cifrar el archivo multimedia.');
    }
  }
};
