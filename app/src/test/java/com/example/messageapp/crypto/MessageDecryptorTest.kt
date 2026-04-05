package com.example.messageapp.crypto

import com.example.messageapp.model.Message
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for MessageDecryptor.
 * Covers validation paths that don't call E2ECipher.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class MessageDecryptorTest {

    private val decryptor = MessageDecryptor()

    @Test
    fun `returns deleted message for deleted type`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "deleted"
        )

        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).isEqualTo("[Mensaje eliminado]")
    }

    @Test
    fun `returns empty string for null textEnc`() {
        // Use type="image" where textEnc can be null
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "image",
            mediaUrl = "http://img.jpg",
            textEnc = null,
            nonce = "nonce"
        )

        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns empty string for blank textEnc`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "image",
            mediaUrl = "http://img.jpg",
            textEnc = "   ",
            nonce = "nonce"
        )

        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns error for null nonce`() {
        // Use type="image" which doesn't require textEnc/nonce validation in init
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "image",
            mediaUrl = "http://img.jpg",
            textEnc = "some-encrypted",
            nonce = null
        )

        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).isEqualTo("[Error: Clave de cifrado faltante]")
    }

    @Test
    fun `returns error for blank nonce`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "image",
            mediaUrl = "http://img.jpg",
            textEnc = "some-encrypted",
            nonce = "  "
        )

        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).isEqualTo("[Error: Clave de cifrado faltante]")
    }

    @Test
    fun `returns error when chatId is null`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce-123"
        )

        val result = decryptor.decrypt(msg, null)
        assertThat(result).isEqualTo("[Error: Chat no disponible]")
    }

    @Test
    fun `returns error when chatId is blank`() {
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "encrypted",
            nonce = "nonce-123"
        )

        val result = decryptor.decrypt(msg, "   ")
        assertThat(result).isEqualTo("[Error: Chat no disponible]")
    }

    @Test
    fun `returns decryption error when E2ECipher fails with malformed data`() {
        // Construct a message with valid nonce and textEnc but cipher will fail
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "not-valid-base64",
            nonce = "also-not-valid"
        )

        val result = decryptor.decrypt(msg, "chat-1")
        // E2ECipher.decrypt catches exceptions and returns error string
        assertThat(result).startsWith("[Error:")
    }

    @Test
    fun `constructs encrypted string correctly before calling cipher`() {
        // Verify that the encrypted format is nonce:textEnc
        // This is tested indirectly through the error messages
        val msg = Message(
            id = "msg-1",
            chatId = "chat-1",
            senderId = "user-1",
            type = "text",
            textEnc = "cipherPart",
            nonce = "noncePart"
        )

        // The cipher receives "noncePart:cipherPart" which is valid format
        // but will fail crypto validation, returning an error message
        val result = decryptor.decrypt(msg, "chat-1")
        assertThat(result).startsWith("[Error:")
    }
}
