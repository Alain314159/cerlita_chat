package com.example.messageapp.data

import com.example.messageapp.model.Chat
import com.example.messageapp.model.Message
import kotlinx.coroutines.flow.Flow

/**
 * FACADE TEMPORAL - Para compatibilidad con código existente
 *
 * Este facade combina los 3 nuevos repositorios para mantener
 * la API antigua de ChatRepository mientras se actualiza el código.
 *
 * TODO: Eliminar este archivo cuando todo el código use los nuevos repositorios
 *
 * @property chatReadRepository Repositorio de lectura de chats
 * @property messageRepository Repositorio de mensajes (lectura/escritura básica)
 * @property messageActionsRepository Repositorio de acciones de mensajes
 */
@Deprecated(
    "Usar ChatReadRepository, MessageRepository y MessageActionsRepository por separado",
    ReplaceWith("ChatReadRepository, MessageRepository, MessageActionsRepository")
)
class ChatRepository(
    private val chatReadRepository: ChatReadRepository = ChatReadRepository(),
    private val messageRepository: MessageRepository = MessageRepository(),
    private val messageActionsRepository: MessageActionsRepository = MessageActionsRepository()
) {

    // Delegados a ChatReadRepository
    fun directChatIdFor(uidA: String, uidB: String): String =
        chatReadRepository.directChatIdFor(uidA, uidB)

    suspend fun ensureDirectChat(uidA: String, uidB: String): String =
        chatReadRepository.ensureDirectChat(uidA, uidB)

    fun observeChats(uid: String): Flow<List<Chat>> =
        chatReadRepository.observeChats(uid)

    fun observeChat(chatId: String): Flow<Chat?> =
        chatReadRepository.observeChat(chatId)

    // Delegados a MessageRepository
    fun observeMessages(chatId: String, myUid: String): Flow<List<Message>> =
        messageRepository.observeMessages(chatId, myUid)

    suspend fun sendText(chatId: String, senderId: String, textEnc: String, iv: String) =
        messageRepository.sendText(chatId, senderId, textEnc, iv)

    suspend fun markDelivered(chatId: String, messageId: String, uid: String) =
        messageRepository.markDelivered(chatId, messageId, uid)

    suspend fun markAsRead(chatId: String, uid: String) =
        messageRepository.markAsRead(chatId, uid)

    // Delegados a MessageActionsRepository
    suspend fun pinMessage(chatId: String, messageId: String, snippet: String) =
        messageActionsRepository.pinMessage(chatId, messageId, snippet)

    suspend fun unpinMessage(chatId: String) =
        messageActionsRepository.unpinMessage(chatId)

    suspend fun deleteMessageForUser(chatId: String, messageId: String, uid: String) =
        messageActionsRepository.deleteMessageForUser(chatId, messageId, uid)

    suspend fun deleteMessageForAll(chatId: String, messageId: String) =
        messageActionsRepository.deleteMessageForAll(chatId, messageId)

    suspend fun countUnreadMessages(chatId: String, uid: String): Int =
        messageActionsRepository.countUnreadMessages(chatId, uid)
}
