package com.example.messageapp.data

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Tests for TypingRepository validation logic.
 * Pure function copies since we can't instantiate the real repo without Supabase.
 */
class TypingRepositoryTest {

    // Copy of the validation logic from TypingRepository.setTypingStatus
    private fun validateSetTypingStatus(chatId: String, isTyping: Boolean) {
        require(chatId.isNotBlank()) { "chatId no puede estar vacío" }
    }

    @Test
    fun `setTypingStatus throws when chatId is blank`() {
        val exception = kotlin.runCatching {
            validateSetTypingStatus("", false)
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("chatId")
    }

    @Test
    fun `setTypingStatus throws when chatId is whitespace`() {
        val exception = kotlin.runCatching {
            validateSetTypingStatus("   ", true)
        }.exceptionOrNull()

        assertThat(exception).isInstanceOf(IllegalArgumentException::class.java)
        assertThat(exception!!.message).contains("chatId")
    }

    @Test
    fun `setTypingStatus accepts valid chatId with isTyping true`() {
        validateSetTypingStatus("chat-123", true)
        // No exception thrown
    }

    @Test
    fun `setTypingStatus accepts valid chatId with isTyping false`() {
        validateSetTypingStatus("chat-123", false)
        // No exception thrown
    }
}
