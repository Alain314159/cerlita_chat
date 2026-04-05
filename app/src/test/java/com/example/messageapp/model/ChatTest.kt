package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.Assert.assertThrows

/**
 * Comprehensive tests for Chat model.
 */
class ChatTest {

    @Test
    fun `create chat with valid data`() {
        val chat = Chat(
            id = "chat-123",
            type = "couple",
            memberIds = listOf("user-1", "user-2"),
            user1Typing = false,
            user2Typing = false,
            pinnedSnippet = "Hello!"
        )

        assertThat(chat.id).isEqualTo("chat-123")
        assertThat(chat.type).isEqualTo("couple")
        assertThat(chat.memberIds).containsExactly("user-1", "user-2")
        assertThat(chat.user1Typing).isFalse()
        assertThat(chat.user2Typing).isFalse()
        assertThat(chat.pinnedSnippet).isEqualTo("Hello!")
    }

    @Test
    fun `default chat has couple type and empty members`() {
        val chat = Chat(id = "test", memberIds = listOf("user-1"))
        assertThat(chat.type).isEqualTo("couple")
    }

    @Test
    fun `throws when memberIds is empty`() {
        assertThrows(IllegalArgumentException::class.java) {
            Chat(id = "test", memberIds = emptyList())
        }
    }

    @Test
    fun `throws when memberIds contains blank string`() {
        assertThrows(IllegalArgumentException::class.java) {
            Chat(id = "test", memberIds = listOf("   "))
        }
    }

    @Test
    fun `throws when memberIds contains empty string`() {
        assertThrows(IllegalArgumentException::class.java) {
            Chat(id = "test", memberIds = listOf("", "user-2"))
        }
    }

    @Test
    fun `chat with single member is valid`() {
        val chat = Chat(id = "test", memberIds = listOf("user-1"))
        assertThat(chat.memberIds).hasSize(1)
    }

    @Test
    fun `isUserTyping returns true for user1 when typing`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1", "user-2"),
            user1Typing = true
        )
        assertThat(chat.isUserTyping("user-1")).isTrue()
        assertThat(chat.isUserTyping("user-2")).isFalse()
    }

    @Test
    fun `isUserTyping returns true for user2 when typing`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1", "user-2"),
            user2Typing = true
        )
        assertThat(chat.isUserTyping("user-1")).isFalse()
        assertThat(chat.isUserTyping("user-2")).isTrue()
    }

    @Test
    fun `isUserTyping throws when user not in chat`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1", "user-2")
        )
        assertThrows(IllegalStateException::class.java) {
            chat.isUserTyping("user-3")
        }
    }

    @Test
    fun `both users can be typing at same time`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1", "user-2"),
            user1Typing = true,
            user2Typing = true
        )
        assertThat(chat.isUserTyping("user-1")).isTrue()
        assertThat(chat.isUserTyping("user-2")).isTrue()
    }

    @Test
    fun `chat with pinned message`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1"),
            pinnedMessageId = "msg-123",
            pinnedSnippet = "Last pinned message"
        )
        assertThat(chat.pinnedMessageId).isEqualTo("msg-123")
        assertThat(chat.pinnedSnippet).isEqualTo("Last pinned message")
    }

    @Test
    fun `chat with last message metadata`() {
        val chat = Chat(
            id = "test",
            memberIds = listOf("user-1"),
            lastMessageEnc = "encrypted",
            lastMessageAt = 1234567890L
        )
        assertThat(chat.lastMessageEnc).isEqualTo("encrypted")
        assertThat(chat.lastMessageAt).isEqualTo(1234567890L)
    }
}
