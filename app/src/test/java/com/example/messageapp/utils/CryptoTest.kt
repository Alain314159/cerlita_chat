package com.example.messageapp.utils

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for legacy Crypto (Base64-only encoding).
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class CryptoTest {

    // === encrypt() Tests ===

    @Test
    fun `encrypt returns empty string for empty input`() {
        val result = Crypto.encrypt("")
        assertThat(result).isEmpty()
    }

    @Test
    fun `encrypt encodes plain text to Base64`() {
        val result = Crypto.encrypt("Hello")
        assertThat(result).isEqualTo("SGVsbG8=")
    }

    @Test
    fun `encrypt handles unicode text`() {
        val result = Crypto.encrypt("Hola 🎉")
        // Verify it's valid Base64 (roundtrip)
        val decoded = Crypto.decrypt(result)
        assertThat(decoded).isEqualTo("Hola 🎉")
    }

    @Test
    fun `encrypt handles empty-like but non-empty string`() {
        val result = Crypto.encrypt(" ")
        assertThat(result).isNotEmpty()
        // Should be valid Base64
        val decoded = Crypto.decrypt(result)
        assertThat(decoded).isEqualTo(" ")
    }

    // === decrypt() Tests ===

    @Test
    fun `decrypt returns empty string for null input`() {
        val result = Crypto.decrypt(null)
        assertThat(result).isEmpty()
    }

    @Test
    fun `decrypt returns empty string for blank input`() {
        val result = Crypto.decrypt("   ")
        assertThat(result).isEmpty()
    }

    @Test
    fun `decrypt returns empty string for empty input`() {
        val result = Crypto.decrypt("")
        assertThat(result).isEmpty()
    }

    @Test
    fun `decrypt detects legacy GCM format`() {
        val result = Crypto.decrypt("gcm:someOldData")
        assertThat(result).isEqualTo("[Criptografia Antiga]")
    }

    @Test
    fun `decrypt detects legacy GCM format case insensitive`() {
        val result = Crypto.decrypt("GCM:moreData")
        assertThat(result).isEqualTo("[Criptografia Antiga]")
    }

    @Test
    fun `decrypt decodes valid Base64`() {
        val result = Crypto.decrypt("SGVsbG8=")
        assertThat(result).isEqualTo("Hello")
    }

    @Test
    fun `decrypt returns decoded bytes for invalid base64-like input`() {
        // Android's Base64.decode is lenient - it doesn't throw on most invalid input
        // Instead it returns partial/garbage bytes
        val result = Crypto.decrypt("not-valid-base64")
        // It won't be the original string, but it won't throw either
        assertThat(result).isNotEmpty()
    }

    @Test
    fun `encrypt and decrypt roundtrip`() {
        val original = "Test message 123"
        val encrypted = Crypto.encrypt(original)
        val decrypted = Crypto.decrypt(encrypted)

        assertThat(decrypted).isEqualTo(original)
    }

    @Test
    fun `decrypt trims whitespace from input`() {
        val result = Crypto.decrypt("  SGVsbG8=  ")
        assertThat(result).isEqualTo("Hello")
    }
}
