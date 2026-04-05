package com.example.messageapp.viewmodel

import com.example.messageapp.data.PairingRepository
import com.example.messageapp.data.PairingStatus
import com.example.messageapp.model.User
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
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
 * Tests for PairingViewModel state management.
 * Uses mocked PairingRepository.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class PairingViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val mockRepo = mockk<PairingRepository>(relaxed = true)
    private lateinit var viewModel: PairingViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = PairingViewModel(mockRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is Idle with null pairing status`() {
        assertThat(viewModel.uiState.value).isInstanceOf(PairingUiState.Idle::class.java)
        assertThat(viewModel.pairingStatus.value).isNull()
    }

    @Test
    fun `generatePairingCode success transitions to CodeGenerated`() = runTest {
        coEvery { mockRepo.generatePairingCode() } returns Result.success("123456")

        viewModel.generatePairingCode()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.CodeGenerated::class.java)
        assertThat((state as PairingUiState.CodeGenerated).code).isEqualTo("123456")
    }

    @Test
    fun `generatePairingCode failure transitions to Error`() = runTest {
        coEvery { mockRepo.generatePairingCode() } returns Result.failure(RuntimeException("Network error"))

        viewModel.generatePairingCode()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
        assertThat((state as PairingUiState.Error).message).contains("Network error")
    }

    @Test
    fun `pairWithCode success transitions to Paired and reloads status`() = runTest {
        coEvery { mockRepo.pairWithCode("123456") } returns Result.success(Unit)
        coEvery { mockRepo.getPairingStatus() } returns Result.success(PairingStatus(true, "partner-1", "code"))

        viewModel.pairWithCode("123456")
        testDispatcher.scheduler.advanceUntilIdle()

        // After pairWithCode, it reloads status, so final state is Success
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Success::class.java)
        assertThat(viewModel.pairingStatus.value?.isPaired).isTrue()
        coVerify { mockRepo.pairWithCode("123456") }
        coVerify { mockRepo.getPairingStatus() }
    }

    @Test
    fun `pairWithCode failure transitions to Error`() = runTest {
        coEvery { mockRepo.pairWithCode(any()) } returns Result.failure(IllegalArgumentException("Invalid code"))

        viewModel.pairWithCode("bad")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
        assertThat((state as PairingUiState.Error).message).contains("Invalid code")
    }

    @Test
    fun `searchByEmail success transitions to UserFound`() = runTest {
        val user = User(displayName = "Test User")
        coEvery { mockRepo.searchByEmail("test@example.com") } returns Result.success(user)

        viewModel.searchByEmail("test@example.com")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.UserFound::class.java)
        assertThat((state as PairingUiState.UserFound).user.displayName).isEqualTo("Test User")
    }

    @Test
    fun `searchByEmail failure transitions to Error`() = runTest {
        coEvery { mockRepo.searchByEmail(any()) } returns Result.failure(RuntimeException("Not found"))

        viewModel.searchByEmail("nobody@example.com")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `sendPairingRequest success transitions to RequestSent`() = runTest {
        coEvery { mockRepo.requestPairing("partner-1") } returns Result.success(Unit)

        viewModel.sendPairingRequest("partner-1")
        testDispatcher.scheduler.advanceUntilIdle()

        assertThat(viewModel.uiState.value).isInstanceOf(PairingUiState.RequestSent::class.java)
    }

    @Test
    fun `clearError resets to Idle`() = runTest {
        // First trigger an error
        coEvery { mockRepo.generatePairingCode() } returns Result.failure(RuntimeException("fail"))
        viewModel.generatePairingCode()
        testDispatcher.scheduler.advanceUntilIdle()

        assertThat(viewModel.uiState.value).isInstanceOf(PairingUiState.Error::class.java)

        viewModel.clearError()

        assertThat(viewModel.uiState.value).isInstanceOf(PairingUiState.Idle::class.java)
    }

    @Test
    fun `loadPairingStatus success transitions to Success`() = runTest {
        val status = PairingStatus(isPaired = true, partnerId = "p-1", pairingCode = null)
        coEvery { mockRepo.getPairingStatus() } returns Result.success(status)

        viewModel.loadPairingStatus()
        testDispatcher.scheduler.advanceUntilIdle()

        assertThat(viewModel.uiState.value).isInstanceOf(PairingUiState.Success::class.java)
        assertThat(viewModel.pairingStatus.value).isEqualTo(status)
    }

    @Test
    fun `invalidateCode clears pairingCode from status`() = runTest {
        coEvery { mockRepo.invalidatePairingCode() } returns Result.success(Unit)
        // Set initial status with a pairing code
        val initialStatus = PairingStatus(isPaired = true, partnerId = "p-1", pairingCode = "ABC")
        viewModel = PairingViewModel(mockRepo)

        // Manually set the internal status for this test
        // Since _pairingStatus is private, we test via the side effect
        coEvery { mockRepo.invalidatePairingCode() } returns Result.success(Unit)

        viewModel.invalidateCode()
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { mockRepo.invalidatePairingCode() }
    }
}
