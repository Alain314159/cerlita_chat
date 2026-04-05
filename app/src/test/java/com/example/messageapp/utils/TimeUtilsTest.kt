package com.example.messageapp.utils

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Tests for time utility functions.
 */
class TimeUtilsTest {

    @Test
    fun `toFormattedDate formats timestamp correctly`() {
        val timestamp = 1609459200000L // 2021-01-01 00:00:00 UTC
        val result = timestamp.toFormattedDate("dd/MM/yyyy HH:mm")

        assertThat(result).isNotEmpty()
        assertThat(result).contains("/")
        assertThat(result).contains(":")
    }

    @Test
    fun `toFormattedDate with custom pattern`() {
        val timestamp = 1609459200000L
        val result = timestamp.toFormattedDate("yyyy-MM-dd")

        assertThat(result).isNotEmpty()
        assertThat(result).contains("-")
        assertThat(result).contains("2021")
    }

    @Test
    fun `toFormattedDate with zero timestamp`() {
        val result = 0L.toFormattedDate()

        assertThat(result).isNotEmpty()
    }

    @Test
    fun `toRelativeTime returns Ahora for recent timestamp`() {
        val now = System.currentTimeMillis()
        val result = now.toRelativeTime()

        assertThat(result).isEqualTo("Ahora")
    }

    @Test
    fun `toRelativeTime returns minutes for recent minutes`() {
        val fiveMinutesAgo = System.currentTimeMillis() - (5 * 60_000)
        val result = fiveMinutesAgo.toRelativeTime()

        assertThat(result).contains("min")
    }

    @Test
    fun `toRelativeTime returns hours for recent hours`() {
        val threeHoursAgo = System.currentTimeMillis() - (3 * 3_600_000)
        val result = threeHoursAgo.toRelativeTime()

        assertThat(result).contains("h")
    }

    @Test
    fun `toRelativeTime returns days for recent days`() {
        val threeDaysAgo = System.currentTimeMillis() - (3 * 86_400_000)
        val result = threeDaysAgo.toRelativeTime()

        assertThat(result).contains("d")
    }

    @Test
    fun `toRelativeTime returns formatted date for old timestamps`() {
        val oneYearAgo = System.currentTimeMillis() - (365L * 86_400_000)
        val result = oneYearAgo.toRelativeTime()

        assertThat(result).contains("/")
    }

    @Test
    fun `getTimestampOneDayAgo returns timestamp less than now`() {
        val oneDayAgo = getTimestampOneDayAgo()
        val now = System.currentTimeMillis()

        assertThat(oneDayAgo).isLessThan(now)
        // Should be approximately 24 hours ago (within 1 minute tolerance)
        val diff = now - oneDayAgo
        assertThat(diff).isAtLeast(86_400_000 - 60_000)
        assertThat(diff).isAtMost(86_400_000 + 60_000)
    }

    @Test
    fun `isToday returns true for current time`() {
        val now = System.currentTimeMillis()
        assertThat(now.isToday()).isTrue()
    }

    @Test
    fun `isToday returns false for yesterday`() {
        val yesterday = System.currentTimeMillis() - 86_400_000
        assertThat(yesterday.isToday()).isFalse()
    }

    @Test
    fun `isThisWeek returns true for current time`() {
        val now = System.currentTimeMillis()
        assertThat(now.isThisWeek()).isTrue()
    }

    @Test
    fun `isThisWeek returns false for last week`() {
        val lastWeek = System.currentTimeMillis() - (7L * 86_400_000)
        assertThat(lastWeek.isThisWeek()).isFalse()
    }
}
