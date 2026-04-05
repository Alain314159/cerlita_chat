package com.example.messageapp.viewmodel

import app.cash.turbine.test
import com.example.messageapp.crypto.MessageDecryptor
import com.example.messageapp.data.ChatRepository
import com.example.messageapp.model.Message
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MessageActionsViewModelTest {

    private lateinit var viewModel: MessageActionsViewModel
    private lateinit var repo: ChatRepository
    private lateinit var decryptor: MessageDecryptor
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        repo = mockk()
        decryptor = mockk()
        viewModel = MessageActionsViewModel(repo, decryptor)
    }

    @Test
    fun `pinMessage calls repository with text snippet`() = runTest {
        // Given: Mensaje de texto y mock del decryptor
        val chatId = "chat-123"
        val message = Message(
            id = "msg-1",
            chatId = chatId,
            senderId = "user-456",
            textEnc = "encrypted",
            type = "text",
            createdAt = 1000L,
            nonce = "nonce",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )
        val decryptedText = "Este es el mensaje descifrado"

        coEvery { decryptor.decrypt(message, chatId) } returns decryptedText
        coEvery { repo.pinMessage(chatId, message.id, any()) } returns Unit

        // When: Fijo el mensaje
        viewModel.pinMessage(chatId, message)
        advanceUntilIdle()

        // Then: Verifico que se llamó al repository con el snippet correcto
        coVerify { repo.pinMessage(chatId, message.id, decryptedText.take(60)) }
    }

    @Test
    fun `pinMessage calls repository with type snippet for non-text message`() = runTest {
        // Given: Mensaje que no es de texto
        val chatId = "chat-123"
        val message = Message(
            id = "msg-1",
            chatId = chatId,
            senderId = "user-456",
            textEnc = "encrypted",
            type = "image",
            createdAt = 1000L,
            nonce = "nonce",
            mediaUrl = "url",
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        coEvery { repo.pinMessage(chatId, message.id, any()) } returns Unit

        // When: Fijo el mensaje
        viewModel.pinMessage(chatId, message)
        advanceUntilIdle()

        // Then: Verifico que se llamó con [type]
        coVerify { repo.pinMessage(chatId, message.id, "[image]") }
    }

    @Test
    fun `pinMessage sets error when repository throws exception`() = runTest {
        // Given: Repository que lanza excepción
        val chatId = "chat-123"
        val message = Message(
            id = "msg-1",
            chatId = chatId,
            senderId = "user-456",
            textEnc = "encrypted",
            type = "text",
            createdAt = 1000L,
            nonce = "nonce",
            mediaUrl = null,
            deliveredAt = null,
            readAt = null,
            deletedForAll = false,
            deletedFor = emptyList()
        )

        coEvery { decryptor.decrypt(any(), any()) } returns "text"
        coEvery { repo.pinMessage(any(), any(), any()) } throws Exception("Network error")

        // When: Intento fijar el mensaje
        viewModel.pinMessage(chatId, message)
        advanceUntilIdle()

        // Then: Verifico que se emitió error
        viewModel.error.test {
            val error = awaitItem()
            assertThat(error).isNotNull()
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `unpinMessage calls repository successfully`() = runTest {
        // Given: Repository que funciona correctamente
        val chatId = "chat-123"
        coEvery { repo.unpinMessage(chatId) } returns Unit

        // When: Desfijo el mensaje
        viewModel.unpinMessage(chatId)
        advanceUntilIdle()

        // Then: Verifico que se llamó al repository
        coVerify { repo.unpinMessage(chatId) }
    }

    @Test
    fun `unpinMessage sets error when repository throws exception`() = runTest {
        // Given: Repository que lanza excepción
        val chatId = "chat-123"
        coEvery { repo.unpinMessage(chatId) } throws Exception("Network error")

        // When: Intento desfijar el mensaje
        viewModel.unpinMessage(chatId)
        advanceUntilIdle()

        // Then: Verifico que se emitió error
        viewModel.error.test {
            val error = awaitItem()
            assertThat(error).isNotNull()
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `deleteMessageForUser calls repository successfully`() = runTest {
        // Given: Repository que funciona correctamente
        val chatId = "chat-123"
        val messageId = "msg-456"
        val uid = "user-789"
        coEvery { repo.deleteMessageForUser(chatId, messageId, uid) } returns Unit

        // When: Elimino el mensaje para el usuario
        viewModel.deleteMessageForUser(chatId, messageId, uid)
        advanceUntilIdle()

        // Then: Verifico que se llamó al repository
        coVerify { repo.deleteMessageForUser(chatId, messageId, uid) }
    }

    @Test
    fun `deleteMessageForUser sets error when repository throws exception`() = runTest {
        // Given: Repository que lanza excepción
        val chatId = "chat-123"
        val messageId = "msg-456"
        val uid = "user-789"
        coEvery { repo.deleteMessageForUser(chatId, messageId, uid) } throws Exception("Error")

        // When: Intento eliminar el mensaje
        viewModel.deleteMessageForUser(chatId, messageId, uid)
        advanceUntilIdle()

        // Then: Verifico que se emitió error
        viewModel.error.test {
            val error = awaitItem()
            assertThat(error).isNotNull()
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `deleteMessageForAll calls repository successfully`() = runTest {
        // Given: Repository que funciona correctamente
        val chatId = "chat-123"
        val messageId = "msg-456"
        coEvery { repo.deleteMessageForAll(chatId, messageId) } returns Unit

        // When: Elimino el mensaje para todos
        viewModel.deleteMessageForAll(chatId, messageId)
        advanceUntilIdle()

        // Then: Verifico que se llamó al repository
        coVerify { repo.deleteMessageForAll(chatId, messageId) }
    }

    @Test
    fun `deleteMessageForAll sets error when repository throws exception`() = runTest {
        // Given: Repository que lanza excepción
        val chatId = "chat-123"
        val messageId = "msg-456"
        coEvery { repo.deleteMessageForAll(chatId, messageId) } throws Exception("Error")

        // When: Intento eliminar el mensaje para todos
        viewModel.deleteMessageForAll(chatId, messageId)
        advanceUntilIdle()

        // Then: Verifico que se emitió error
        viewModel.error.test {
            val error = awaitItem()
            assertThat(error).isNotNull()
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `initial state has null error`() = runTest {
        // When: Verifico el estado inicial
        val error = viewModel.error.value

        // Then: El error inicial es null
        assertThat(error).isNull()
    }
}
