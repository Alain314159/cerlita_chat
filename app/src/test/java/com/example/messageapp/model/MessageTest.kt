package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.Assert.assertThrows

/**
 * Comprehensive tests for Message model and MessageStatus enum.
 */
class MessageTest {

    // === MessageStatus Tests ===

    @Test
    fun `MessageStatus has exactly 3 values`() {
        assertThat(MessageStatus.values()).hasLength(3)
        assertThat(MessageStatus.values()).asList().containsExactly(
            MessageStatus.SENT,
            MessageStatus.DELIVERED,
            MessageStatus.READ
        )
    }

    @Test
    fun `MessageStatus valueOf works correctly`() {
        assertThat(MessageStatus.valueOf("SENT")).isEqualTo(MessageStatus.SENT)
        assertThat(MessageStatus.valueOf("DELIVERED")).isEqualTo(MessageStatus.DELIVERED)
        assertThat(MessageStatus.valueOf("READ")).isEqualTo(MessageStatus.READ)
    }

    // === Message Creation Tests ===

    @Test
    fun `create text message with valid data`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted-text",
            nonce = "nonce-123"
        )

        assertThat(msg.id).isEqualTo("msg-1")
        assertThat(msg.chatId).isEqualTo("chat-1")
        assertThat(msg.senderId).isEqualTo("user-1")
        assertThat(msg.type).isEqualTo("text")
        assertThat(msg.textEnc).isEqualTo("encrypted-text")
        assertThat(msg.nonce).isEqualTo("nonce-123")
        assertThat(msg.mediaUrl).isNull()
    }

    @Test
    fun `create image message with valid data`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "image",
            mediaUrl = "https://storage.example.com/image.jpg"
        )

        assertThat(msg.type).isEqualTo("image")
        assertThat(msg.mediaUrl).isEqualTo("https://storage.example.com/image.jpg")
        assertThat(msg.textEnc).isNull()
        assertThat(msg.nonce).isNull()
    }

    @Test
    fun `create video message with valid data`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "video",
            mediaUrl = "https://storage.example.com/video.mp4"
        )

        assertThat(msg.type).isEqualTo("video")
        assertThat(msg.mediaUrl).isNotNull()
    }

    @Test
    fun `create audio message with valid data`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "audio",
            mediaUrl = "https://storage.example.com/audio.m4a"
        )

        assertThat(msg.type).isEqualTo("audio")
    }

    // === Validation Tests ===

    @Test
    fun `throws when text message has null textEnc`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(
                id = "msg-1",
                chatId = "chat-1",
                senderId = "user-1",
                type = "text",
                textEnc = null,
                nonce = "nonce"
            )
        }
    }

    @Test
    fun `throws when text message has null nonce`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(
                id = "msg-1",
                chatId = "chat-1",
                senderId = "user-1",
                type = "text",
                textEnc = "encrypted",
                nonce = null
            )
        }
    }

    @Test
    fun `throws when image message has null mediaUrl`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(
                id = "msg-1",
                chatId = "chat-1",
                senderId = "user-1",
                type = "image",
                mediaUrl = null
            )
        }
    }

    @Test
    fun `throws when id is whitespace`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(id = "   ", chatId = "chat-1", senderId = "user-1")
        }
    }

    @Test
    fun `throws when chatId is whitespace`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(id = "msg-1", chatId = "   ", senderId = "user-1")
        }
    }

    @Test
    fun `throws when senderId is whitespace`() {
        assertThrows(IllegalArgumentException::class.java) {
            Message(id = "msg-1", chatId = "chat-1", senderId = "   ")
        }
    }

    // === Status Tests ===

    @Test
    fun `status is SENT when no deliveredAt or readAt`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            deliveredAt = null,
            readAt = null
        )

        assertThat(msg.status).isEqualTo(MessageStatus.SENT)
    }

    @Test
    fun `status is DELIVERED when deliveredAt is set`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            deliveredAt = 1000L,
            readAt = null
        )

        assertThat(msg.status).isEqualTo(MessageStatus.DELIVERED)
    }

    @Test
    fun `status is READ when readAt is set`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            deliveredAt = 1000L,
            readAt = 2000L
        )

        assertThat(msg.status).isEqualTo(MessageStatus.READ)
    }

    @Test
    fun `status is null when deletedForAll is true`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            deliveredAt = 1000L,
            readAt = 2000L,
            deletedForAll = true
        )

        assertThat(msg.status).isNull()
    }

    @Test
    fun `status progression from SENT to DELIVERED to READ`() {
        val baseMsg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce"
        )

        assertThat(baseMsg.status).isEqualTo(MessageStatus.SENT)
        assertThat(baseMsg.copy(deliveredAt = 1000L).status).isEqualTo(MessageStatus.DELIVERED)
        assertThat(baseMsg.copy(deliveredAt = 1000L, readAt = 2000L).status).isEqualTo(MessageStatus.READ)
    }

    // === Deleted For Tests ===

    @Test
    fun `deletedFor defaults to empty list`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce"
        )

        assertThat(msg.deletedFor).isEmpty()
        assertThat(msg.deletedForAll).isFalse()
    }

    @Test
    fun `deletedFor can contain multiple user IDs`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            deletedFor = listOf("user-2", "user-3")
        )

        assertThat(msg.deletedFor).containsExactly("user-2", "user-3")
    }

    // === Edge Cases ===

    @Test
    fun `message with unicode text`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "你好 🎉 Ñoño",
            nonce = "nonce"
        )

        assertThat(msg.textEnc).isEqualTo("你好 🎉 Ñoño")
    }

    @Test
    fun `message with very long encrypted text`() {
        val longText = "encrypted-".repeat(1000)
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = longText,
            nonce = "nonce"
        )

        assertThat(msg.textEnc).hasLength(10000)
    }

    @Test
    fun `message with future timestamp`() {
        val futureTime = System.currentTimeMillis() / 1000 + 86400L // 1 day in future
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce",
            createdAt = futureTime
        )

        assertThat(msg.createdAt).isEqualTo(futureTime)
    }
}
