package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.Assert.assertThrows

/**
 * Comprehensive tests for User model.
 * Tests validation rules, default values, and edge cases.
 */
class UserTest {

    @Test
    fun `create user with valid data`() {
        val user = User(
            id = "user-123",
            email = "test@example.com",
            displayName = "Test User",
            bio = "Hello",
            isPaired = false,
            partnerId = null,
            isTyping = false,
            typingInChat = null
        )

        assertThat(user.id).isEqualTo("user-123")
        assertThat(user.email).isEqualTo("test@example.com")
        assertThat(user.displayName).isEqualTo("Test User")
        assertThat(user.isPaired).isFalse()
        assertThat(user.partnerId).isNull()
    }

    @Test
    fun `default user has empty values`() {
        val user = User(displayName = "Default")

        assertThat(user.id).isEmpty()
        assertThat(user.email).isEmpty()
        assertThat(user.photoUrl).isNull()
        assertThat(user.bio).isEmpty()
        assertThat(user.pairingCode).isNull()
        assertThat(user.partnerId).isNull()
        assertThat(user.isPaired).isFalse()
        assertThat(user.isOnline).isFalse()
        assertThat(user.lastSeen).isNull()
        assertThat(user.isTyping).isFalse()
        assertThat(user.typingInChat).isNull()
        assertThat(user.fcmToken).isNull()
    }

    @Test
    fun `throws when displayName is empty`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "")
        }
    }

    @Test
    fun `throws when displayName is only whitespace`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "   ")
        }
    }

    @Test
    fun `throws when displayName exceeds 100 characters`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "a".repeat(101))
        }
    }

    @Test
    fun `accepts displayName with exactly 100 characters`() {
        val user = User(displayName = "a".repeat(100))
        assertThat(user.displayName).hasLength(100)
    }

    @Test
    fun `throws when id is whitespace but not empty`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(id = "   ", displayName = "Test")
        }
    }

    @Test
    fun `allows empty id for new users`() {
        val user = User(id = "", displayName = "New User")
        assertThat(user.id).isEmpty()
    }

    @Test
    fun `throws when isPaired is true but partnerId is null`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "Test", isPaired = true, partnerId = null)
        }
    }

    @Test
    fun `throws when isPaired is false but partnerId is not null`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "Test", isPaired = false, partnerId = "partner-123")
        }
    }

    @Test
    fun `allows isPaired true with valid partnerId`() {
        val user = User(displayName = "Test", isPaired = true, partnerId = "partner-123")
        assertThat(user.isPaired).isTrue()
        assertThat(user.partnerId).isEqualTo("partner-123")
    }

    @Test
    fun `throws when isTyping is true but typingInChat is null`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "Test", isTyping = true, typingInChat = null)
        }
    }

    @Test
    fun `throws when isTyping is false but typingInChat is not null`() {
        assertThrows(IllegalArgumentException::class.java) {
            User(displayName = "Test", isTyping = false, typingInChat = "chat-123")
        }
    }

    @Test
    fun `allows isTyping true with valid typingInChat`() {
        val user = User(displayName = "Test", isTyping = true, typingInChat = "chat-123")
        assertThat(user.isTyping).isTrue()
        assertThat(user.typingInChat).isEqualTo("chat-123")
    }

    @Test
    fun `user with unicode displayName`() {
        val user = User(displayName = "你好 🎉 Ñoño")
        assertThat(user.displayName).isEqualTo("你好 🎉 Ñoño")
    }

    @Test
    fun `user with emoji in bio`() {
        val user = User(displayName = "Test", bio = "💕 Hello 🌍")
        assertThat(user.bio).isEqualTo("💕 Hello 🌍")
    }

    @Test
    fun `user with very long email`() {
        val longEmail = "a".repeat(60) + "@example.com"
        val user = User(displayName = "Test", email = longEmail)
        assertThat(user.email).isEqualTo(longEmail)
    }
}
