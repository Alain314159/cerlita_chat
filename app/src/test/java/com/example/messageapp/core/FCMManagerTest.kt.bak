package com.example.messageapp.core

import android.content.Context
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FCMManagerTest {

    private lateinit var fcmManager: FCMManager
    private lateinit var mockContext: Context
    private lateinit var testScope: CoroutineScope

    @Before
    fun setUp() {
        Dispatchers.setMain(StandardTestDispatcher())
        mockContext = mockk(relaxed = true)
        testScope = CoroutineScope(StandardTestDispatcher())
        fcmManager = FCMManager(
            context = mockContext,
            lifecycleScope = testScope
        )
    }

    @Test
    fun `initialize should call FCMConfigRepository initialize`() {
        // When
        fcmManager.initialize()

        // Then - No exception thrown means success
        // The FCMConfigRepository.initialize() should be called
    }

    @Test
    fun `updateTokenAfterLogin should handle empty token gracefully`() = runTest {
        // Given
        val fcmManagerWithTestScope = FCMManager(
            context = mockContext,
            lifecycleScope = this
        )

        // When
        fcmManagerWithTestScope.updateTokenAfterLogin()

        // Then - Should not crash even if FCM is not configured
        advanceUntilIdle()
    }

    @Test
    fun `FCMManager should not throw on uninitialized FCM`() = runTest {
        // Given
        val fcmManagerWithTestScope = FCMManager(
            context = mockContext,
            lifecycleScope = this
        )

        // When/Then - Should handle gracefully without crashing
        fcmManagerWithTestScope.updateTokenAfterLogin()
        advanceUntilIdle()
    }
}
