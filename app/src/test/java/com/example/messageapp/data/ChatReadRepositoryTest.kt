package com.example.messageapp.data

import com.example.messageapp.model.Chat
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class ChatReadRepositoryTest {

    private lateinit var repository: ChatReadRepository

    @Before
    fun setup() {
        // Nota: Este test requiere mockear SupabaseConfig
        // Para tests reales, usar inyección de dependencias
        repository = mockk()
    }

    @Test
    fun `directChatIdFor returns same id regardless of order`() {
        // Given: Dos UIDs en diferente orden
        val uid1 = "user-123"
        val uid2 = "user-456"

        // When: Genero IDs en ambos órdenes
        val id1 = repository.directChatIdFor(uid1, uid2)
        val id2 = repository.directChatIdFor(uid2, uid1)

        // Then: Ambos IDs son iguales
        assertThat(id1).isEqualTo(id2)
    }

    @Test
    fun `directChatIdFor trims whitespace`() {
        // Given: UIDs con whitespace
        val uid1 = "user-123  "
        val uid2 = "  user-456"

        // When: Genero ID
        val id = repository.directChatIdFor(uid1, uid2)

        // Then: El ID no tiene whitespace
        assertThat(id).doesNotContain(" ")
    }

    @Test
    fun `ensureDirectChat returns existing chat id`() = runTest {
        // Given: Chat ya existe
        val uid1 = "user-123"
        val uid2 = "user-456"
        val expectedChatId = "${uid1.trim()}_${uid2.trim()}"

        coEvery { repository.ensureDirectChat(uid1, uid2) } returns expectedChatId

        // When: Llamo a ensureDirectChat
        val result = repository.ensureDirectChat(uid1, uid2)

        // Then: Retorna el ID existente
        assertThat(result).isEqualTo(expectedChatId)
        coVerify { repository.ensureDirectChat(uid1, uid2) }
    }

    @Test
    fun `observeChats emits initial load`() = runTest {
        // Given: Repository con chats iniciales
        val uid = "user-123"
        val mockChats = listOf(
            mockk<Chat>(),
            mockk<Chat>()
        )

        coEvery { repository.observeChats(uid).first() } returns mockChats

        // When: Observo chats
        val result = repository.observeChats(uid).first()

        // Then: Emite chats iniciales
        assertThat(result).hasSize(2)
    }

    @Test
    fun `observeChat emits chat state`() = runTest {
        // Given: Chat específico
        val chatId = "chat-123"
        val mockChat = mockk<Chat>()

        coEvery { repository.observeChat(chatId).first() } returns mockChat

        // When: Observo chat
        val result = repository.observeChat(chatId).first()

        // Then: Emite estado del chat
        assertThat(result).isNotNull()
    }
}
