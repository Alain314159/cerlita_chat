package com.example.messageapp.viewmodel

import com.example.messageapp.data.ChatRepository
import com.example.messageapp.crypto.MessageDecryptor
import com.google.common.truth.Truth.assertThat
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

/**
 * Tests for ChatViewModel typing-related functionality.
 *
 * Note: Typing functionality has been moved to PresenceRepository.
 * These tests verify the basic ViewModel state.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModelTypingTest {

    private lateinit var viewModel: ChatViewModel
    private lateinit var chatRepository: ChatRepository
    private lateinit var decryptor: MessageDecryptor
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        chatRepository = mockk(relaxUnitFun = true)
        decryptor = mockk()
        viewModel = ChatViewModel(chatRepository, decryptor)
    }

    @Test
    fun `initial state has null chat and empty messages`() = runTest {
        assertThat(viewModel.chat.value).isNull()
        assertThat(viewModel.messages.value).isEmpty()
        assertThat(viewModel.isLoading.value).isFalse()
    }

    @Test
    fun `start sets loading to true`() = runTest {
        viewModel.start("chat-123", "user-456")
        assertThat(viewModel.isLoading.value).isTrue()
    }

    @Test
    fun `stop sets loading to false`() = runTest {
        viewModel.stop()
        assertThat(viewModel.isLoading.value).isFalse()
    }
}
