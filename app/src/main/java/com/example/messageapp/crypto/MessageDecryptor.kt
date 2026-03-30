package com.example.messageapp.crypto

import android.util.Log
import com.example.messageapp.model.Message

// ✅ TAG constante para logging
private const val TAG = "MessageApp"

/**
 * Descifrador de mensajes E2E con AES-256-GCM
 * 
 * Responsabilidad única: Descifrar mensajes cifrados
 * 
 * Esta clase extrae la lógica de descifrado de ChatViewModel
 * para cumplir con el principio de responsabilidad única.
 */
class MessageDecryptor {
    
    /**
     * Descifra un mensaje cifrado
     * 
     * @param message El mensaje cifrado a descifrar
     * @param chatId El ID del chat para obtener la clave correcta
     * @return El mensaje descifrado o un mensaje de error
     */
    fun decrypt(message: Message, chatId: String?): String {
        // Validar tipo de mensaje
        if (message.type == "deleted") {
            return "[Mensaje eliminado]"
        }

        // Validar campos requeridos
        if (message.textEnc.isNullOrBlank()) {
            return ""
        }

        if (message.nonce.isNullOrBlank()) {
            return "[Error: Clave de cifrado faltante]"
        }

        // Validar chatId disponible
        if (chatId.isNullOrBlank()) {
            Log.w(TAG, "MessageDecryptor: decrypt llamado pero chatId es null")
            return "[Error: Chat no disponible]"
        }

        // Intentar descifrar
        return try {
            val encrypted = "${message.nonce}:${message.textEnc}"
            E2ECipher.decrypt(encrypted, chatId)
        } catch (e: Exception) {
            Log.e(TAG, "MessageDecryptor: Decrypt failed", e)
            "[Error: No se pudo descifrar]"
        }
    }
}
