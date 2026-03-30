package com.example.messageapp.data

import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class MessageActionsRepositoryTest {

    private lateinit var repository: MessageActionsRepository

    @Before
    fun setup() {
        repository = mockk()
    }

    @Test
    fun `pinMessage calls repository successfully`() = runTest {
        // Given: Parámetros válidos
        val chatId = "chat-123"
        val messageId = "msg-456"
        val snippet = "Mensaje fijado"

        coEvery { repository.pinMessage(chatId, messageId, snippet) } returns Unit

        // When: Fijo mensaje
        repository.pinMessage(chatId, messageId, snippet)

        // Then: Se llama al repository
        coVerify { repository.pinMessage(chatId, messageId, snippet) }
    }

    @Test
    fun `unpinMessage calls repository successfully`() = runTest {
        // Given: Chat ID válido
        val chatId = "chat-123"

        coEvery { repository.unpinMessage(chatId) } returns Unit

        // When: Desfijo mensaje
        repository.unpinMessage(chatId)

        // Then: Se llama al repository
        coVerify { repository.unpinMessage(chatId) }
    }

    @Test
    fun `deleteMessageForUser calls repository successfully`() = runTest {
        // Given: Parámetros válidos
        val chatId = "chat-123"
        val messageId = "msg-456"
        val uid = "user-789"

        coEvery { repository.deleteMessageForUser(chatId, messageId, uid) } returns Unit

        // When: Elimino mensaje para usuario
        repository.deleteMessageForUser(chatId, messageId, uid)

        // Then: Se llama al repository
        coVerify { repository.deleteMessageForUser(chatId, messageId, uid) }
    }

    @Test
    fun `deleteMessageForAll calls repository successfully`() = runTest {
        // Given: Parámetros válidos
        val chatId = "chat-123"
        val messageId = "msg-456"

        coEvery { repository.deleteMessageForAll(chatId, messageId) } returns Unit

        // When: Elimino mensaje para todos
        repository.deleteMessageForAll(chatId, messageId)

        // Then: Se llama al repository
        coVerify { repository.deleteMessageForAll(chatId, messageId) }
    }

    @Test
    fun `countUnreadMessages returns count`() = runTest {
        // Given: Chat con mensajes no leídos
        val chatId = "chat-123"
        val uid = "user-456"
        val expectedCount = 5

        coEvery { repository.countUnreadMessages(chatId, uid) } returns expectedCount

        // When: Cuento mensajes no leídos
        val result = repository.countUnreadMessages(chatId, uid)

        // Then: Retorna cantidad esperada
        assertThat(result).isEqualTo(expectedCount)
    }

    @Test
    fun `countUnreadMessages throws on error`() = runTest {
        // Given: Error al contar
        val chatId = "chat-123"
        val uid = "user-456"

        coEvery { repository.countUnreadMessages(chatId, uid) } throws Exception("Database error")

        // When/Then: Lanza excepción
        try {
            repository.countUnreadMessages(chatId, uid)
            assertThat(false).isTrue() // Debería haber lanzado
        } catch (e: Exception) {
            assertThat(e.message).contains("Database")
        }
    }
}
