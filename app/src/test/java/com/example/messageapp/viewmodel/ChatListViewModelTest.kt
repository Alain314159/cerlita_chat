package com.example.messageapp.viewmodel

import com.example.messageapp.data.ChatRepository
import com.example.messageapp.model.Chat
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
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
 * Tests for ChatListViewModel state management.
 * Uses mocked ChatRepository.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class ChatListViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val mockRepo = mockk<ChatRepository>(relaxed = true)
    private lateinit var viewModel: ChatListViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { mockRepo.observeChats(any()) } returns flowOf(emptyList())
        coEvery { mockRepo.ensureDirectChat(any(), any()) } returns "user-a_user-b"
        viewModel = ChatListViewModel(mockRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is empty`() {
        assertThat(viewModel.chats.value).isEmpty()
        assertThat(viewModel.isLoading.value).isFalse()
        assertThat(viewModel.error.value).isNull()
    }

    @Test
    fun `stop clears observing state`() {
        viewModel.start("user-1")
        viewModel.stop()

        assertThat(viewModel.chats.value).isEmpty()
    }

    @Test
    fun `start is idempotent`() {
        viewModel.start("user-1")
        viewModel.start("user-1")
        viewModel.start("user-1")

        assertThat(viewModel.error.value).isNull()
    }

    @Test
    fun `retry does nothing when there is no error`() = runTest {
        viewModel.start("user-1")
        testDispatcher.scheduler.advanceUntilIdle()

        // Since no error was thrown, retry should not trigger additional loading
        // (it only works when there's an error)
        viewModel.retry()

        // Should not crash - retry is a no-op when there's no error
        assertThat(viewModel.chats.value).isEmpty()
    }

    @Test
    fun `ensureDirectChat returns chat ID`() = runTest {
        val chatId = viewModel.ensureDirectChat("user-a", "user-b")

        assertThat(chatId).isEqualTo("user-a_user-b")
    }
}
