package com.example.messageapp.utils

import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.atomic.AtomicInteger

/**
 * Tests for RetryUtils: retryWithBackoff and retryWithBackoffOrNull.
 * Uses Robolectric because retryWithBackoff calls android.util.Log.
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class RetryUtilsTest {

    @Test
    fun `retryWithBackoff returns result on first success`() = runTest {
        val result = retryWithBackoff(maxRetries = 3) {
            "success"
        }

        assertThat(result).isEqualTo("success")
    }

    @Test
    fun `retryWithBackoff succeeds after one failure`() = runTest {
        val callCount = AtomicInteger(0)

        val result = retryWithBackoff(maxRetries = 3, initialDelay = 10) {
            val count = callCount.incrementAndGet()
            if (count < 2) {
                throw RuntimeException("Temporary failure")
            }
            "recovered"
        }

        assertThat(result).isEqualTo("recovered")
        assertThat(callCount.get()).isEqualTo(2)
    }

    @Test
    fun `retryWithBackoff throws after all attempts fail`() = runTest {
        val callCount = AtomicInteger(0)

        val exception = kotlin.runCatching {
            retryWithBackoff(maxRetries = 3, initialDelay = 10) {
                callCount.incrementAndGet()
                throw IllegalStateException("Always fails")
            }
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalStateException::class.java)
        assertThat(exception!!.message).isEqualTo("Always fails")
        assertThat(callCount.get()).isEqualTo(3)
    }

    @Test
    fun `retryWithBackoff respects maxRetries count`() = runTest {
        val callCount = AtomicInteger(0)

        kotlin.runCatching {
            retryWithBackoff(maxRetries = 5, initialDelay = 10) {
                callCount.incrementAndGet()
                throw RuntimeException("Fail")
            }
        }

        assertThat(callCount.get()).isEqualTo(5)
    }

    @Test
    fun `retryWithBackoff attempts all retries before failing`() = runTest {
        val callCount = AtomicInteger(0)

        kotlin.runCatching {
            retryWithBackoff(
                maxRetries = 4,
                initialDelay = 100,
                maxDelay = 10000,
                factor = 2.0
            ) {
                callCount.incrementAndGet()
                throw RuntimeException("Fail")
            }
        }

        // All 4 attempts should have been made
        assertThat(callCount.get()).isEqualTo(4)
    }

    @Test
    fun `retryWithBackoff delay increases but caps at maxDelay`() = runTest {
        val callCount = AtomicInteger(0)

        kotlin.runCatching {
            retryWithBackoff(
                maxRetries = 5,
                initialDelay = 100,
                maxDelay = 200,
                factor = 10.0 // Would normally jump to 10000, but capped at 200
            ) {
                callCount.incrementAndGet()
                throw RuntimeException("Fail")
            }
        }

        assertThat(callCount.get()).isEqualTo(5)
    }

    @Test
    fun `retryWithBackoffOrNull returns result on success`() = runTest {
        val result = retryWithBackoffOrNull(maxRetries = 3) {
            "found"
        }

        assertThat(result).isEqualTo("found")
    }

    @Test
    fun `retryWithBackoffOrNull returns null after all failures`() = runTest {
        val callCount = AtomicInteger(0)

        val result: String? = retryWithBackoffOrNull(maxRetries = 3, initialDelay = 10) {
            callCount.incrementAndGet()
            throw RuntimeException("Always fails")
        }

        assertThat(result).isNull()
        assertThat(callCount.get()).isEqualTo(3)
    }

    @Test
    fun `retryWithBackoffOrNull returns result after initial failures`() = runTest {
        val callCount = AtomicInteger(0)

        val result = retryWithBackoffOrNull(maxRetries = 4, initialDelay = 10) {
            val count = callCount.incrementAndGet()
            if (count < 3) {
                throw RuntimeException("Temporary")
            }
            "recovered"
        }

        assertThat(result).isEqualTo("recovered")
        assertThat(callCount.get()).isEqualTo(3)
    }

    @Test
    fun `retryWithBackoff with custom tag does not affect behavior`() = runTest {
        val callCount = AtomicInteger(0)

        val result = retryWithBackoff(
            maxRetries = 2,
            initialDelay = 10,
            tag = "CustomTag"
        ) {
            callCount.incrementAndGet()
            "ok"
        }

        assertThat(result).isEqualTo("ok")
        assertThat(callCount.get()).isEqualTo(1)
    }

    @Test
    fun `retryWithBackoff with maxRetries=1 tries exactly once`() = runTest {
        val callCount = AtomicInteger(0)

        val exception = kotlin.runCatching {
            retryWithBackoff(maxRetries = 1, initialDelay = 10) {
                callCount.incrementAndGet()
                throw RuntimeException("Single attempt")
            }
        }.exceptionOrNull()

        assertThat(exception).isNotNull()
        assertThat(callCount.get()).isEqualTo(1)
    }

    @Test
    fun `retryWithBackoff propagates specific exception type`() = runTest {
        val exception = kotlin.runCatching {
            retryWithBackoff(maxRetries = 2, initialDelay = 10) {
                throw IllegalArgumentException("Bad argument")
            }
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).isEqualTo("Bad argument")
    }
}
