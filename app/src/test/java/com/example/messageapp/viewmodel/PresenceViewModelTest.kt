package com.example.messageapp.viewmodel

import com.example.messageapp.data.TypingRepository
import com.example.messageapp.data.UserPresenceRepository
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
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
 * Tests for PresenceViewModel state management.
 * Uses mocked TypingRepository and UserPresenceRepository.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class PresenceViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val mockTypingRepo = mockk<TypingRepository>(relaxed = true)
    private val mockPresenceRepo = mockk<UserPresenceRepository>(relaxed = true)
    private lateinit var viewModel: PresenceViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { mockTypingRepo.observePartnerTyping(any(), any()) } returns flowOf(false)
        every { mockPresenceRepo.observePartnerOnline(any()) } returns flowOf(false)
        coEvery { mockPresenceRepo.getPartnerLastSeen(any()) } returns null
        viewModel = PresenceViewModel(mockTypingRepo, mockPresenceRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is all false or null`() {
        assertThat(viewModel.isPartnerTyping.value).isFalse()
        assertThat(viewModel.isPartnerOnline.value).isFalse()
        assertThat(viewModel.partnerLastSeen.value).isNull()
    }

    @Test
    fun `setTyping calls repo with correct values`() = runTest {
        viewModel.setTyping("chat-1", true)
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { mockTypingRepo.setTypingStatus("chat-1", true) }
    }

    @Test
    fun `clearTyping calls repo with false`() = runTest {
        viewModel.clearTyping("chat-1")
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { mockTypingRepo.setTypingStatus("chat-1", false) }
    }

    @Test
    fun `setOnline calls repo with correct value`() = runTest {
        viewModel.setOnline(true)
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { mockPresenceRepo.updateOnlineStatus(true) }
    }

    @Test
    fun `getPartnerLastSeen delegates to repo`() = runTest {
        coEvery { mockPresenceRepo.getPartnerLastSeen("partner-1") } returns 99999L

        val result = viewModel.getPartnerLastSeen("partner-1")

        assertThat(result).isEqualTo(99999L)
    }

    @Test
    fun `observeOnline subscribes to online flow and loads last seen`() = runTest {
        coEvery { mockPresenceRepo.getPartnerLastSeen("partner-1") } returns 12345L

        viewModel.observeOnline("partner-1")
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { mockPresenceRepo.observePartnerOnline("partner-1") }
        coVerify { mockPresenceRepo.getPartnerLastSeen("partner-1") }
    }
}
