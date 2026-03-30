package com.example.messageapp.crypto

import com.example.messageapp.model.Message
import com.google.common.truth.Truth.assertThat
import org.junit.Before
import org.junit.Test

class MessageDecryptorTest {

    private lateinit var decryptor: MessageDecryptor

    @Before
    fun setup() {
        decryptor = MessageDecryptor()
    }

    @Test
    fun `decrypt returns deleted message when type is deleted`() {
        // Given: Mensaje eliminado
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "encrypted-text",
            type = "deleted",
            createdAt = 1000L,
            nonce = "nonce-123",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje
        val result = decryptor.decrypt(message, "chat-123")

        // Then: Retorna mensaje de eliminado
        assertThat(result).isEqualTo("[Mensaje eliminado]")
    }

    @Test
    fun `decrypt returns empty string when textEnc is null`() {
        // Given: Mensaje sin texto cifrado
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = null,
            type = "text",
            createdAt = 1000L,
            nonce = "nonce-123",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje
        val result = decryptor.decrypt(message, "chat-123")

        // Then: Retorna string vacío
        assertThat(result).isEqualTo("")
    }

    @Test
    fun `decrypt returns empty string when textEnc is blank`() {
        // Given: Mensaje con texto cifrado en blanco
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "   ",
            type = "text",
            createdAt = 1000L,
            nonce = "nonce-123",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje
        val result = decryptor.decrypt(message, "chat-123")

        // Then: Retorna string vacío
        assertThat(result).isEqualTo("")
    }

    @Test
    fun `decrypt returns error when nonce is null`() {
        // Given: Mensaje sin nonce
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "encrypted-text",
            type = "text",
            createdAt = 1000L,
            nonce = null,
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje
        val result = decryptor.decrypt(message, "chat-123")

        // Then: Retorna error de clave faltante
        assertThat(result).isEqualTo("[Error: Clave de cifrado faltante]")
    }

    @Test
    fun `decrypt returns error when nonce is blank`() {
        // Given: Mensaje con nonce en blanco
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "encrypted-text",
            type = "text",
            createdAt = 1000L,
            nonce = "   ",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje
        val result = decryptor.decrypt(message, "chat-123")

        // Then: Retorna error de clave faltante
        assertThat(result).isEqualTo("[Error: Clave de cifrado faltante]")
    }

    @Test
    fun `decrypt returns error when chatId is null`() {
        // Given: Mensaje válido pero chatId es null
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "encrypted-text",
            type = "text",
            createdAt = 1000L,
            nonce = "nonce-123",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje con chatId null
        val result = decryptor.decrypt(message, null)

        // Then: Retorna error de chat no disponible
        assertThat(result).isEqualTo("[Error: Chat no disponible]")
    }

    @Test
    fun `decrypt returns error when chatId is blank`() {
        // Given: Mensaje válido pero chatId es blank
        val message = Message(
            id = "msg-1",
            chatId = "chat-123",
            senderId = "user-456",
            textEnc = "encrypted-text",
            type = "text",
            createdAt = 1000L,
            nonce = "nonce-123",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Descifro el mensaje con chatId blank
        val result = decryptor.decrypt(message, "   ")

        // Then: Retorna error de chat no disponible
        assertThat(result).isEqualTo("[Error: Chat no disponible]")
    }

    @Test
    fun `decrypt returns error message when decryption fails`() {
        // Given: Mensaje válido pero cifrado inválido (simulado)
        // Nota: Este test depende de la implementación de E2ECipher
        // Si E2ECipher lanza excepción, debe retornar error message
        val message = Message(
            id = "msg-1",
            chatId = "chat-invalid",
            senderId = "user-456",
            textEnc = "invalid-encrypted-text",
            type = "text",
            createdAt = 1000L,
            nonce = "invalid-nonce",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        // When: Intento descifrar con datos inválidos
        val result = decryptor.decrypt(message, "chat-invalid")

        // Then: Debería retornar mensaje de error (no lanzar excepción)
        assertThat(result).startsWith("[Error:")
    }
}
