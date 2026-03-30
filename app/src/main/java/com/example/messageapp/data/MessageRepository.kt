package com.example.messageapp.data

import android.util.Log
import com.example.messageapp.model.Message
import com.example.messageapp.supabase.SupabaseConfig
import io.github.jan-tennert.supabase.postgrest.Postgrest
import io.github.jan-tennert.supabase.postgrest.exception.PostgrestException
import io.github.jan-tennert.supabase.realtime.Realtime
import io.github.jan-tennert.supabase.realtime.exception.RealtimeException
import io.github.jan-tennert.supabase.postgrest.query.Columns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// ✅ TAG constante para logging
private const val TAG = "MessageApp"

/**
 * Repositorio de Mensajes usando Supabase Postgrest + Realtime
 *
 * Responsabilidad única: Observación y lectura de MENSAJES
 *
 * Funciones (5):
 * 1. observeMessages
 * 2. sendText
 * 3. markDelivered
 * 4. markAsRead
 * 5. loadMessages (privada)
 */
class MessageRepository {

    private val db = SupabaseConfig.client.plugin(Postgrest)
    private val realtime = SupabaseConfig.client.plugin(Realtime)

    /**
     * Observa los mensajes de un chat en tiempo real
     */
    fun observeMessages(chatId: String, myUid: String): Flow<List<Message>> = callbackFlow {
        // Cargar mensajes iniciales
        loadMessages(chatId)

        // Suscribirse a cambios en mensajes
        val channel = realtime.channel("messages:public:messages")

        // Flujo de cambios para INSERT/UPDATE/DELETE
        val changeFlow = channel.postgrestChangeFlow(schema = "public") {
            table = "messages"
        }

        // Suscribirse al canal
        channel.subscribe()

        // Escuchar cambios
        val job = launch {
            changeFlow.collect { change ->
                // Verificar si el cambio es para este chat
                val recordJson = change.record
                if (recordJson != null) {
                    try {
                        val message = kotlinx.serialization.json.Json.decodeFromJsonElement<Message>(recordJson)
                        if (message.chatId == chatId) {
                            // Recargar mensajes
                            loadMessages(chatId)
                            // Marcar como entregado automáticamente si no soy el remitente
                            if (message.senderId != myUid) {
                                markDelivered(chatId, message.id, myUid)
                            }
                        }
                    } catch (e: PostgrestException) {
                        Log.w(TAG, "MessageRepository: Postgrest error decoding message", e)
                    } catch (e: RealtimeException) {
                        Log.w(TAG, "MessageRepository: Realtime error receiving message", e)
                    } catch (e: kotlinx.serialization.SerializationException) {
                        Log.w(TAG, "MessageRepository: Serialization error decoding message", e)
                    } catch (e: Exception) {
                        Log.w(TAG, "MessageRepository: Unexpected error processing message", e)
                    }
                }
            }
        }

        awaitClose {
            job.cancel()
            realtime.removeChannel(channel)
        }
    }

    /**
     * Carga los mensajes de un chat
     */
    private suspend fun loadMessages(chatId: String) {
        try {
            val messages = db.from("messages")
                .select(columns = Columns.list("*")) {
                    filter { eq("chat_id", chatId) }
                    order("created_at" to true) // ASC (más antiguos primero)
                }
                .decodeList<Message>()

            // Filtrar mensajes eliminados para este usuario
            // Esto se maneja en la UI
        } catch (e: PostgrestException) {
            Log.w(TAG, "MessageRepository: Postgrest error loading messages", e)
        } catch (e: RealtimeException) {
            Log.w(TAG, "MessageRepository: Realtime error loading messages", e)
        } catch (e: kotlinx.serialization.SerializationException) {
            Log.w(TAG, "MessageRepository: Serialization error loading messages", e)
        } catch (e: Exception) {
            Log.w(TAG, "MessageRepository: Unexpected error loading messages", e)
        }
    }

    /**
     * Envía un mensaje de texto cifrado
     *
     * @param chatId ID del chat
     * @param senderId UID del remitente
     * @param textEnc Texto cifrado (ciphertext)
     * @param iv IV de cifrado (reemplaza a nonce)
     */
    suspend fun sendText(
        chatId: String,
        senderId: String,
        textEnc: String,
        iv: String
    ) = withContext(Dispatchers.IO) {
        // Validar parámetros
        require(chatId.isNotBlank()) { "chatId no puede estar vacío" }
        require(senderId.isNotBlank()) { "senderId no puede estar vacío" }
        require(textEnc.isNotBlank()) { "textEnc no puede estar vacío" }
        require(iv.isNotBlank()) { "iv no puede estar vacío" }

        try {
            db.from("messages").insert(
                mapOf(
                    "chat_id" to chatId,
                    "sender_id" to senderId,
                    "type" to "text",
                    "text_enc" to textEnc,
                    "nonce" to iv,
                    "auth_tag" to null,
                    "created_at" to (System.currentTimeMillis() / 1000),
                    "delivered_at" to null,
                    "read_at" to null
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
        } catch (e: PostgrestException) {
            Log.w(TAG, "MessageRepository: Postgrest error sending message", e)
            throw e
        } catch (e: RealtimeException) {
            Log.w(TAG, "MessageRepository: Realtime error sending message", e)
            throw e
        } catch (e: kotlinx.serialization.SerializationException) {
            Log.w(TAG, "MessageRepository: Serialization error sending message", e)
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "MessageRepository: Unexpected error sending message", e)
            throw e
        }
    }

    /**
     * Marca un mensaje como entregado
     */
    suspend fun markDelivered(chatId: String, messageId: String, uid: String) = withContext(Dispatchers.IO) {
        try {
            db.from("messages").update(
                mapOf(
                    "delivered_at" to (System.currentTimeMillis() / 1000)
                )
            ) {
                filter {
                    eq("id", messageId) and neq("sender_id", uid)
                }
            }
        } catch (e: PostgrestException) {
            Log.w(TAG, "MessageRepository: Postgrest error marking delivered", e)
        } catch (e: RealtimeException) {
            Log.w(TAG, "MessageRepository: Realtime error marking delivered", e)
        } catch (e: Exception) {
            Log.w(TAG, "MessageRepository: Unexpected error marking delivered", e)
        }
    }

    /**
     * Marca todos los mensajes como leídos
     */
    suspend fun markAsRead(chatId: String, uid: String) = withContext(Dispatchers.IO) {
        try {
            db.from("messages").update(
                mapOf(
                    "read_at" to (System.currentTimeMillis() / 1000)
                )
            ) {
                filter {
                    eq("chat_id", chatId) and
                    neq("sender_id", uid) and
                    (isNull("read_at") or lt("read_at", System.currentTimeMillis() / 1000))
                }
            }
        } catch (e: PostgrestException) {
            Log.w(TAG, "MessageRepository: Postgrest error marking as read", e)
        } catch (e: RealtimeException) {
            Log.w(TAG, "MessageRepository: Realtime error marking as read", e)
        } catch (e: Exception) {
            Log.w(TAG, "MessageRepository: Unexpected error marking as read", e)
        }
    }
}
