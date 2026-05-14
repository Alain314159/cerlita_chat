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
   * Optimizado 2026: Evita conversiones de strings masivas para no bloquear el UI thread.
   */
  async encryptMedia(uri: string, chatId: string) {
    try {
      // 1. Leer archivo directamente como base64
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convertir a buffer de forma eficiente
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // 2. Cifrar usando el servicio E2E
      const { ciphertext, iv, authTag } = await e2eEncryptionService.encryptBinary(binaryData, chatId);

      // 3. Devolver datos cifrados
      // Maestro 2026: Usar Buffer si estuviera disponible, o una versión optimizada de uint8ArrayToBase64
      const encryptedBase64 = this.fastUint8ArrayToBase64(ciphertext);
      
      return {
        encryptedBase64,
        iv: this.fastUint8ArrayToBase64(iv),
        authTag: this.fastUint8ArrayToBase64(authTag),
      };
    } catch (error) {
      console.error('[MediaService] Error encrypting media:', error);
      throw new Error('Error al cifrar el archivo multimedia.');
    }
  },

  // Helper para conversión rápida sin colapsar el stack
  fastUint8ArrayToBase64(buffer: Uint8Array): string {
    const CHUNK_SIZE = 0x8000; // 32KB chunks
    let str = "";
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      str += String.fromCharCode.apply(null, Array.from(buffer.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(str);
  }
};
