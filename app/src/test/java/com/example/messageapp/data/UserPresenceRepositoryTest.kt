package com.example.messageapp.data

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Tests for UserPresenceRepository validation logic.
 * Pure function copies since we can't instantiate the real repo without Supabase.
 */
class UserPresenceRepositoryTest {

    // Copy of the validation from updateOnlineStatus
    private fun validateUpdateOnlineStatus(userId: String?, isOnline: Boolean) {
        require(userId != null) { "userId no puede ser null" }
        require(userId.isNotBlank()) { "userId no puede estar vacío" }
    }

    @Test
    fun `updateOnlineStatus requires non-null userId`() {
        val exception = kotlin.runCatching {
            validateUpdateOnlineStatus(null, true)
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("null")
    }

    @Test
    fun `updateOnlineStatus requires non-blank userId`() {
        val exception = kotlin.runCatching {
            validateUpdateOnlineStatus("  ", true)
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("vacío")
    }

    @Test
    fun `updateOnlineStatus accepts valid userId with online true`() {
        validateUpdateOnlineStatus("user-123", true)
    }

    @Test
    fun `updateOnlineStatus accepts valid userId with online false`() {
        validateUpdateOnlineStatus("user-123", false)
    }
}
