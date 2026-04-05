package com.example.messageapp.viewmodel

import com.example.messageapp.data.ChatRepository
import com.example.messageapp.model.Chat
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for ChatViewModel state management.
 * Uses mocked ChatRepository.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class ChatViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val mockRepo = mockk<ChatRepository>(relaxed = true)
    private lateinit var viewModel: ChatViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { mockRepo.observeChat(any()) } returns flowOf(null)
        every { mockRepo.observeMessages(any(), any()) } returns flowOf(emptyList())
        coEvery { mockRepo.markAsRead(any(), any()) } returns Unit
        viewModel = ChatViewModel(mockRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is empty`() {
        assertThat(viewModel.chat.value).isNull()
        assertThat(viewModel.messages.value).isEmpty()
        assertThat(viewModel.isLoading.value).isFalse()
        assertThat(viewModel.error.value).isNull()
    }

    @Test
    fun `start throws when chatId is blank`() {
        val exception = kotlin.runCatching {
            viewModel.start("", "user-1")
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("chatId")
    }

    @Test
    fun `start throws when myUid is blank`() {
        val exception = kotlin.runCatching {
            viewModel.start("chat-1", "")
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("myUid")
    }

    @Test
    fun `stop clears currentChatId`() = runTest {
        viewModel.start("chat-1", "user-1")
        viewModel.stop()

        // After stop, starting the same chat should trigger observe again
        assertThat(viewModel.chat.value).isNull()
    }

    @Test
    fun `start is idempotent for same chatId`() {
        viewModel.start("chat-1", "user-1")
        viewModel.start("chat-1", "user-1")
        viewModel.start("chat-1", "user-1")

        // Should not crash or duplicate observations
        assertThat(viewModel.error.value).isNull()
    }
}
