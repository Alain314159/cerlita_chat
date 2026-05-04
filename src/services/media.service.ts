import * as ImageManipulator from 'expo-image-manipulator';

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
  }
};
