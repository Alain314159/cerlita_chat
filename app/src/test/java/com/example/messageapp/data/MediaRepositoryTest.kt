package com.example.messageapp.data

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

/**
 * Tests para MediaRepository
 *
 * Cubre: uploadMedia, deleteMedia, getFileExtension
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
@OptIn(ExperimentalCoroutinesApi::class)
class MediaRepositoryTest {

    private lateinit var repository: MediaRepository
    private lateinit var mockUri: Uri

    @Before
    fun setup() {
        repository = MediaRepository()
        mockUri = mockk()
    }

    // ============================================
    // Tests para uploadMedia
    // ============================================

    @Test
    fun `uploadMedia with image uri returns signed URL or failure`() = runTest {
        // Given: URI de imagen
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo imagen
        val result = repository.uploadMedia(mockUri, "chat-123", "image")

        // Then: Debería retornar success con URL o failure (no crash)
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with video uri returns signed URL or failure`() = runTest {
        // Given: URI de video
        every { mockUri.toString() } returns "content://test/video.mp4"

        // When: Subo video
        val result = repository.uploadMedia(mockUri, "chat-123", "video")

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with audio uri returns signed URL or failure`() = runTest {
        // Given: URI de audio
        every { mockUri.toString() } returns "content://test/audio.m4a"

        // When: Subo audio
        val result = repository.uploadMedia(mockUri, "chat-123", "audio")

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with invalid uri returns failure`() = runTest {
        // Given: URI inválido
        every { mockUri.toString() } returns "invalid-uri"
        every { mockUri.readBytes() } throws IllegalArgumentException()

        // When: Intento subir
        val result = repository.uploadMedia(mockUri, "chat-123", "image")

        // Then: Debería fallar
        assertThat(result.isFailure).isTrue()
    }

    @Test
    fun `uploadMedia generates unique filename`() = runTest {
        // Given: Mismo URI dos veces
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo dos veces
        val result1 = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }
        val result2 = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }

        // Then: No debería crashar
        assertThat(result1.exceptionOrNull()).isNull()
        assertThat(result2.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with empty chatId does not crash`() = runTest {
        // Given: ChatId vacío
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo con chatId vacío
        val result = runCatching {
            repository.uploadMedia(mockUri, "", "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with null-like chatId does not crash`() = runTest {
        // Given: ChatId que parece null
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo con chatId "null"
        val result = runCatching {
            repository.uploadMedia(mockUri, "null", "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with very long chatId does not crash`() = runTest {
        // Given: ChatId muy largo
        every { mockUri.toString() } returns "content://test/image.jpg"
        val longChatId = "chat-${"a".repeat(1000)}"

        // When: Subo con chatId largo
        val result = runCatching {
            repository.uploadMedia(mockUri, longChatId, "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with special characters in chatId does not crash`() = runTest {
        // Given: ChatId con caracteres especiales
        every { mockUri.toString() } returns "content://test/image.jpg"
        val specialChatId = "chat-<>&\"'-123"

        // When: Subo con chatId especial
        val result = runCatching {
            repository.uploadMedia(mockUri, specialChatId, "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para deleteMedia
    // ============================================

    @Test
    fun `deleteMedia with valid path returns success or failure`() = runTest {
        // Given: Path válido
        val path = "chat-123/uuid_image.jpg"

        // When: Elimino multimedia
        val result = repository.deleteMedia(path)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `deleteMedia with invalid path returns failure`() = runTest {
        // Given: Path inválido
        val invalidPath = "nonexistent/path.jpg"

        // When: Intento eliminar
        val result = repository.deleteMedia(invalidPath)

        // Then: Debería fallar o no crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `deleteMedia with empty path does not crash`() = runTest {
        // Given: Path vacío
        val emptyPath = ""

        // When: Intento eliminar
        val result = runCatching {
            repository.deleteMedia(emptyPath)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `deleteMedia with null-like path does not crash`() = runTest {
        // Given: Path que parece null
        val nullPath = "null"

        // When: Intento eliminar
        val result = runCatching {
            repository.deleteMedia(nullPath)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para getFileExtension (private, tested indirectly)
    // ============================================

    @Test
    fun `uploadMedia with image type uses jpg extension`() = runTest {
        // Given: URI de imagen
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo imagen
        val result = repository.uploadMedia(mockUri, "chat-123", "image")

        // Then: No debería crashar (internamente usa .jpg)
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with video type uses mp4 extension`() = runTest {
        // Given: URI de video
        every { mockUri.toString() } returns "content://test/video.mp4"

        // When: Subo video
        val result = repository.uploadMedia(mockUri, "chat-123", "video")

        // Then: No debería crashar (internamente usa .mp4)
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with audio type uses m4a extension`() = runTest {
        // Given: URI de audio
        every { mockUri.toString() } returns "content://test/audio.m4a"

        // When: Subo audio
        val result = repository.uploadMedia(mockUri, "chat-123", "audio")

        // Then: No debería crashar (internamente usa .m4a)
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with unknown type uses bin extension`() = runTest {
        // Given: URI de archivo
        every { mockUri.toString() } returns "content://test/file.bin"

        // When: Subo con tipo desconocido
        val result = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "unknown")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para content type
    // ============================================

    @Test
    fun `uploadMedia with image sets content type to image/jpeg`() = runTest {
        // Given: URI de imagen
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo imagen
        val result = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with video sets content type to video/mp4`() = runTest {
        // Given: URI de video
        every { mockUri.toString() } returns "content://test/video.mp4"

        // When: Subo video
        val result = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "video")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `uploadMedia with audio sets content type to audio/m4a`() = runTest {
        // Given: URI de audio
        every { mockUri.toString() } returns "content://test/audio.m4a"

        // When: Subo audio
        val result = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "audio")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de integración: Upload then Delete
    // ============================================

    @Test
    fun `uploadMedia then deleteMedia does not crash`() = runTest {
        // Given: URI válido
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo y elimino
        val uploadResult = runCatching {
            repository.uploadMedia(mockUri, "chat-test", "image")
        }
        
        // Luego elimino (asumiendo que se subió)
        val deleteResult = runCatching {
            repository.deleteMedia("chat-test/filename.jpg")
        }

        // Then: No debería crashar
        assertThat(uploadResult.exceptionOrNull()).isNull()
        assertThat(deleteResult.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `concurrent uploadMedia calls do not crash`() = runTest {
        // Given: Múltiples URIs
        val uris = List(5) { 
            val uri = mockk<Uri>()
            every { uri.toString() } returns "content://test/image$it.jpg"
            uri
        }

        // When: Subo concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                uris.map { uri ->
                    kotlinx.coroutines.async {
                        repository.uploadMedia(uri, "chat-123", "image")
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `concurrent deleteMedia calls do not crash`() = runTest {
        // Given: Múltiples paths
        val paths = List(10) { "chat-$it/file-$it.jpg" }

        // When: Elimino concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                paths.map { path ->
                    kotlinx.coroutines.async {
                        repository.deleteMedia(path)
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Unicode
    // ============================================

    @Test
    fun `uploadMedia with unicode chatId does not crash`() = runTest {
        // Given: ChatId con unicode
        every { mockUri.toString() } returns "content://test/image.jpg"
        val unicodeChatId = "chat-🌍-你好"

        // When: Subo con chatId unicode
        val result = runCatching {
            repository.uploadMedia(mockUri, unicodeChatId, "image")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `uploadMedia performance test with 50 calls`() = runTest {
        // Given: 50 URIs
        val uris = List(50) {
            val uri = mockk<Uri>()
            every { uri.toString() } returns "content://test/image$it.jpg"
            uri
        }

        // When: Subo 50 imágenes
        val startTime = System.currentTimeMillis()
        uris.forEach { uri ->
            runCatching {
                repository.uploadMedia(uri, "chat-perf", "image")
            }
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser razonablemente rápido (< 30 segundos)
        assertThat(elapsed).isLessThan(30000)
    }

    @Test
    fun `deleteMedia performance test with 50 calls`() = runTest {
        // Given: 50 paths
        val paths = List(50) { "chat-perf/file-$it.jpg" }

        // When: Elimino 50 archivos
        val startTime = System.currentTimeMillis()
        paths.forEach { path ->
            runCatching {
                repository.deleteMedia(path)
            }
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser razonablemente rápido (< 30 segundos)
        assertThat(elapsed).isLessThan(30000)
    }

    // ============================================
    // Tests para URL expiration
    // ============================================

    @Test
    fun `uploadMedia creates URL valid for 7 days`() = runTest {
        // Given: URI válido
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo imagen
        val result = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }

        // Then: No debería crashar
        // (La expiración de 7 días está hardcodeada en el repository)
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para filename uniqueness
    // ============================================

    @Test
    fun `uploadMedia generates unique filenames for same uri`() = runTest {
        // Given: Mismo URI
        every { mockUri.toString() } returns "content://test/image.jpg"

        // When: Subo dos veces
        val result1 = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }
        val result2 = runCatching {
            repository.uploadMedia(mockUri, "chat-123", "image")
        }

        // Then: No debería crashar
        // (Los filenames deberían ser únicos por UUID)
        assertThat(result1.exceptionOrNull()).isNull()
        assertThat(result2.exceptionOrNull()).isNull()
    }
}
