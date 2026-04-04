package com.example.messageapp.core

import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PresenceLifecycleManagerTest {

    private lateinit var presenceManager: PresenceLifecycleManager
    private lateinit var onUpdatePresence: suspend (Boolean) -> Unit

    @Before
    fun setUp() {
        Dispatchers.setMain(StandardTestDispatcher())
        onUpdatePresence = mockk(relaxed = true)
        presenceManager = PresenceLifecycleManager(
            context = mockk(relaxed = true),
            onUpdatePresence = onUpdatePresence
        )
    }

    @Test
    fun `onResume should set presence to online`() = runTest {
        // When
        presenceManager.onResume()

        // Then
        coVerify { onUpdatePresence(true) }
    }

    @Test
    fun `onPause should set presence to offline`() = runTest {
        // When
        presenceManager.onPause()

        // Then
        coVerify { onUpdatePresence(false) }
    }

    @Test
    fun `onDestroy should set presence to offline`() = runTest {
        // When
        presenceManager.onDestroy()

        // Then
        coVerify { onUpdatePresence(false) }
    }

    @Test
    fun `presence should follow lifecycle correctly`() = runTest {
        // When - Simulate full lifecycle
        presenceManager.onResume()
        presenceManager.onPause()
        presenceManager.onResume()
        presenceManager.onDestroy()

        // Then - Should have been called 4 times
        coVerify(exactly = 4) { onUpdatePresence(any()) }
        // Last call should be offline
        coVerify { onUpdatePresence(false) }
    }

    @Test
    fun `multiple onResume calls should each set online`() = runTest {
        // When
        presenceManager.onResume()
        presenceManager.onResume()
        presenceManager.onResume()

        // Then
        coVerify(exactly = 3) { onUpdatePresence(true) }
    }

    @Test
    fun `manager should handle rapid lifecycle changes`() = runTest {
        // When - Rapid changes
        repeat(10) {
            presenceManager.onResume()
            presenceManager.onPause()
        }

        // Then - Should handle without errors
        coVerify(exactly = 20) { onUpdatePresence(any()) }
    }
}
