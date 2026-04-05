package com.example.messageapp.utils

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.concurrent.atomic.AtomicInteger

@OptIn(ExperimentalCoroutinesApi::class)
class RetryUtilsTest {

    @Test
    fun `retryWithBackoff should succeed on first attempt`() = runTest {
        val callCount = AtomicInteger(0)

        val result = retryWithBackoff(
            maxRetries = 3,
            initialDelay = 10
        ) {
            callCount.incrementAndGet()
            "success"
        }

        assertEquals("success", result)
        assertEquals(1, callCount.get())
    }

    @Test
    fun `retryWithBackoff should retry on failure and succeed`() = runTest {
        val callCount = AtomicInteger(0)

        val result = retryWithBackoff(
            maxRetries = 3,
            initialDelay = 10
        ) {
            val count = callCount.incrementAndGet()
            if (count < 3) {
                throw RuntimeException("Temporary failure")
            }
            "success on attempt $count"
        }

        assertEquals("success on attempt 3", result)
        assertEquals(3, callCount.get())
    }

    @Test(expected = RuntimeException::class)
    fun `retryWithBackoff should throw after all attempts fail`() = runTest {
        retryWithBackoff(
            maxRetries = 3,
            initialDelay = 10
        ) {
            throw RuntimeException("Permanent failure")
        }
    }

    @Test
    fun `retryWithBackoffOrNull should return null on failure`() = runTest {
        val result = retryWithBackoffOrNull(
            maxRetries = 2,
            initialDelay = 10
        ) {
            throw RuntimeException("Permanent failure")
        }

        assertEquals(null, result)
    }

    @Test
    fun `retryWithBackoffOrNull should return value on success`() = runTest {
        val result = retryWithBackoffOrNull(
            maxRetries = 3,
            initialDelay = 10
        ) {
            "success"
        }

        assertEquals("success", result)
    }

    @Test
    fun `retryWithBackoff should respect maxRetries parameter`() = runTest {
        val callCount = AtomicInteger(0)

        try {
            retryWithBackoff(
                maxRetries = 5,
                initialDelay = 10
            ) {
                callCount.incrementAndGet()
                throw RuntimeException("Always fails")
            }
        } catch (e: Exception) {
            // Expected
        }

        assertEquals(5, callCount.get())
    }

    @Test
    fun `retryWithBackoff should handle different exception types`() = runTest {
        val callCount = AtomicInteger(0)

        try {
            retryWithBackoff(
                maxRetries = 2,
                initialDelay = 10
            ) {
                callCount.incrementAndGet()
                throw IllegalArgumentException("Test exception")
            }
        } catch (e: IllegalArgumentException) {
            // Expected
            assertTrue(e.message?.contains("Test exception") == true)
        }

        assertEquals(2, callCount.get())
    }
}
