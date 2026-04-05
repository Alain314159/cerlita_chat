package com.example.messageapp.crypto

import com.example.messageapp.crypto.E2ECipher.toHex
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.Assert.assertThrows
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for E2ECipher validation, edge cases, and format handling.
 * Uses Robolectric for Android Keystore access.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class E2ECipherTest {

    // === encrypt() validation tests ===

    @Test
    fun `encrypt throws when chatId is empty`() {
        assertThrows(IllegalArgumentException::class.java) {
            E2ECipher.encrypt("hello", "")
        }
    }

    @Test
    fun `encrypt throws when chatId is blank`() {
        assertThrows(IllegalArgumentException::class.java) {
            E2ECipher.encrypt("hello", "   ")
        }
    }

    @Test
    fun `encrypt returns empty string for blank plaintext`() {
        val result = E2ECipher.encrypt("", "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `encrypt returns empty string for whitespace plaintext`() {
        val result = E2ECipher.encrypt("   ", "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `encrypt returns empty string for newline plaintext`() {
        val result = E2ECipher.encrypt("\n\t", "chat-1")
        assertThat(result).isEmpty()
    }

    // === decrypt() validation tests ===

    @Test
    fun `decrypt throws when chatId is empty`() {
        assertThrows(IllegalArgumentException::class.java) {
            E2ECipher.decrypt("iv:data", "")
        }
    }

    @Test
    fun `decrypt throws when chatId is blank`() {
        assertThrows(IllegalArgumentException::class.java) {
            E2ECipher.decrypt("iv:data", "   ")
        }
    }

    @Test
    fun `decrypt returns empty string for null input`() {
        val result = E2ECipher.decrypt(null, "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `decrypt returns empty string for blank input`() {
        val result = E2ECipher.decrypt("", "chat-1")
        assertThat(result).isEmpty()
    }

    @Test
    fun `decrypt returns error for malformed format without colon`() {
        val result = E2ECipher.decrypt("nocolonhere", "chat-1")
        assertThat(result).isEqualTo("[Error: Formato de mensaje inválido]")
    }

    @Test
    fun `decrypt returns error for too many colons`() {
        val result = E2ECipher.decrypt("part1:part2:part3", "chat-1")
        assertThat(result).isEqualTo("[Error: Formato de mensaje inválido]")
    }

    @Test
    fun `decrypt returns error for invalid Base64 IV`() {
        val result = E2ECipher.decrypt("notBase64!!!:notBase64!!!", "chat-1")
        assertThat(result).startsWith("[Error:")
    }

    // === toHex() extension function tests ===

    @Test
    fun `toHex converts empty ByteArray`() {
        val result = ByteArray(0).toHex()
        assertThat(result).isEmpty()
    }

    @Test
    fun `toHex converts single byte`() {
        val result = ByteArray(1) { 0xFF.toByte() }.toHex()
        assertThat(result).isEqualTo("ff")
    }

    @Test
    fun `toHex converts multiple bytes`() {
        val bytes = byteArrayOf(0x00, 0x01, 0x0F, 0x10, 0xFF.toByte())
        val result = bytes.toHex()
        assertThat(result).isEqualTo("00010f10ff")
    }

    @Test
    fun `toHex produces lowercase hex string`() {
        val bytes = ByteArray(16) { i -> (i * 16).toByte() }
        val result = bytes.toHex()
        assertThat(result).isEqualTo(result.lowercase())
        assertThat(result).hasLength(32)
    }
}
