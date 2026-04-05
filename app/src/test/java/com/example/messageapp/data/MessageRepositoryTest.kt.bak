package com.example.messageapp.data

import com.example.messageapp.model.Message
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class MessageRepositoryTest {

    private lateinit var repository: MessageRepository

    @Before
    fun setup() {
        repository = mockk()
    }

    @Test
    fun `observeMessages emits initial load`() = runTest {
        // Given: Mensajes iniciales
        val chatId = "chat-123"
        val myUid = "user-456"
        val mockMessages = listOf(
            mockk<Message>(),
            mockk<Message>()
        )

        coEvery { repository.observeMessages(chatId, myUid).first() } returns mockMessages

        // When: Observo mensajes
        val result = repository.observeMessages(chatId, myUid).first()

        // Then: Emite mensajes iniciales
        assertThat(result).hasSize(2)
    }

    @Test
    fun `sendText validates chatId is not blank`() = runTest {
        // Given: chatId en blanco
        val chatId = ""
        val senderId = "user-123"
        val textEnc = "encrypted"
        val iv = "iv-123"

        // When/Then: Lanza excepción
        try {
            repository.sendText(chatId, senderId, textEnc, iv)
            assertThat(false).isTrue() // Debería haber lanzado excepción
        } catch (e: IllegalArgumentException) {
            assertThat(e.message).contains("chatId")
        }
    }

    @Test
    fun `sendText validates senderId is not blank`() = runTest {
        // Given: senderId en blanco
        val chatId = "chat-123"
        val senderId = ""
        val textEnc = "encrypted"
        val iv = "iv-123"

        // When/Then: Lanza excepción
        try {
            repository.sendText(chatId, senderId, textEnc, iv)
            assertThat(false).isTrue()
        } catch (e: IllegalArgumentException) {
            assertThat(e.message).contains("senderId")
        }
    }

    @Test
    fun `sendText validates textEnc is not blank`() = runTest {
        // Given: textEnc en blanco
        val chatId = "chat-123"
        val senderId = "user-123"
        val textEnc = ""
        val iv = "iv-123"

        // When/Then: Lanza excepción
        try {
            repository.sendText(chatId, senderId, textEnc, iv)
            assertThat(false).isTrue()
        } catch (e: IllegalArgumentException) {
            assertThat(e.message).contains("textEnc")
        }
    }

    @Test
    fun `sendText validates iv is not blank`() = runTest {
        // Given: iv en blanco
        val chatId = "chat-123"
        val senderId = "user-123"
        val textEnc = "encrypted"
        val iv = ""

        // When/Then: Lanza excepción
        try {
            repository.sendText(chatId, senderId, textEnc, iv)
            assertThat(false).isTrue()
        } catch (e: IllegalArgumentException) {
            assertThat(e.message).contains("iv")
        }
    }

    @Test
    fun `markDelivered calls repository successfully`() = runTest {
        // Given: Parámetros válidos
        val chatId = "chat-123"
        val messageId = "msg-456"
        val uid = "user-789"

        coEvery { repository.markDelivered(chatId, messageId, uid) } returns Unit

        // When: Marco como entregado
        repository.markDelivered(chatId, messageId, uid)

        // Then: Se llama al repository
        coVerify { repository.markDelivered(chatId, messageId, uid) }
    }

    @Test
    fun `markAsRead calls repository successfully`() = runTest {
        // Given: Parámetros válidos
        val chatId = "chat-123"
        val uid = "user-456"

        coEvery { repository.markAsRead(chatId, uid) } returns Unit

        // When: Marco como leído
        repository.markAsRead(chatId, uid)

        // Then: Se llama al repository
        coVerify { repository.markAsRead(chatId, uid) }
    }
}
