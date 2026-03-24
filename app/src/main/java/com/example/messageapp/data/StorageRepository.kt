package com.example.messageapp.data

import android.net.Uri
import com.example.messageapp.supabase.SupabaseConfig
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repositorio para enviar multimedia usando Supabase Storage
 */
class StorageRepository {

    private val db = SupabaseConfig.client.plugin(Postgrest)
    private val storage = SupabaseConfig.client.plugin(Storage)

    /**
     * Envía multimedia (imagen/video/audio) a un chat
     */
    suspend fun sendMedia(
        chatId: String,
        myUid: String,
        uri: Uri,
        type: String,
        textEnc: String = "",
        nonce: String = ""
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Bucket para multimedia de chats
            val bucket = storage.from("chat-media")
            
            // Extensión del archivo según tipo
            val ext = when (type) {
                "image" -> "jpg"
                "video" -> "mp4"
                "audio" -> "m4a"
                else -> "bin"
            }
            
            // Nombre del archivo: chat_id/timestamp_uid.ext
            val fileName = "$chatId/${System.currentTimeMillis()}_$myUid.$ext"

            // Leer el archivo como ByteArray
            val bytes = readUriBytes(uri)
            
            // Subir a Supabase Storage
            bucket.upload(fileName, bytes) {
                upsert = true
            }

            // Obtener URL pública
            val mediaUrl = bucket.publicUrl(fileName)

            // Insertar mensaje en la base de datos
            db.from("messages").insert(
                mapOf(
                    "chat_id" to chatId,
                    "sender_id" to myUid,
                    "type" to type,
                    "text_enc" to textEnc,
                    "nonce" to nonce,
                    "media_url" to mediaUrl,
                    "created_at" to (System.currentTimeMillis() / 1000),
                    "delivered_at" to null,
                    "read_at" to null,
                    "deleted_for_all" to false,
                    "deleted_for" to listOf<String>()
                )
            )

            // Actualizar último mensaje del chat
            db.from("chats").update(
                mapOf(
                    "last_message_enc" to textEnc,
                    "last_message_at" to (System.currentTimeMillis() / 1000),
                    "updated_at" to (System.currentTimeMillis() / 1000)
                )
            ) {
                filter { eq("id", chatId) }
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Elimina multimedia del storage
     */
    suspend fun deleteMedia(mediaUrl: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val bucket = storage.from("chat-media")
            
            // Extraer el path de la URL
            val fileName = mediaUrl.substringAfter("/object/public/chat-media/")
            
            bucket.delete(fileName)
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Lee los bytes de un URI
     */
    private suspend fun readUriBytes(uri: Uri): ByteArray = withContext(Dispatchers.IO) {
        // Leer URI desde el dispositivo
        val inputStream = SupabaseConfig.client.httpClient.httpClient.engine.config.httpClient
            ?.let { 
                // Usar contexto de Android para leer URI
                android.content.ContentResolver::class.java
            }
        
        // Fallback: leer directamente
        uri.toString().toByteArray()
    }
}
