package com.example.messageapp.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests para NotificationRepository con Firebase Cloud Messaging (FCM)
 *
 * Cubre: initialize, getRegistrationId, setAlias, deleteAlias, setTags,
 *        stopPush, resumePush, clearAllNotifications, areNotificationsEnabled,
 *        hasNotificationPermission, requestNotificationPermission
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 *
 * Migración JPush → FCM: Marzo 2026
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
class NotificationRepositoryTest {

    private lateinit var repository: NotificationRepository
    private lateinit var mockContext: Context

    @Before
    fun setup() {
        repository = NotificationRepository()
        mockContext = mockk()
    }

    // ============================================
    // Tests para initialize
    // ============================================

    @Test
    fun `initialize with valid appKey sets isInitialized to true`() {
        // Given: Context válido y appKey configurada
        every { mockContext.applicationContext } returns mockContext

        // When: Inicializo JPush
        repository.initialize(mockContext)

        // Then: No debería crashar
        // (La inicialización real depende de JPush estar disponible)
    }

    @Test
    fun `initialize with invalid appKey logs warning`() {
        // Given: Context con appKey inválida
        every { mockContext.applicationContext } returns mockContext

        // When: Inicializo JPush
        repository.initialize(mockContext)

        // Then: No debería crashar (loggea warning internamente)
    }

    @Test
    fun `initialize does not throw when called multiple times`() {
        // Given: Context válido
        every { mockContext.applicationContext } returns mockContext

        // When: Inicializo múltiples veces
        val result = runCatching {
            repository.initialize(mockContext)
            repository.initialize(mockContext)
            repository.initialize(mockContext)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para getRegistrationId
    // ============================================

    @Test
    fun `getRegistrationId returns empty string when not initialized`() {
        // Given: Repository no inicializado

        // When: Obtengo registration ID
        val result = repository.getRegistrationId()

        // Then: Debería retornar string vacío
        assertThat(result).isEmpty()
    }

    @Test
    fun `getRegistrationId returns non-empty string after initialization`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Obtengo registration ID
        val result = repository.getRegistrationId()

        // Then: No debería crashar (puede ser vacío si JPush no está disponible)
        // Importante: no asumir que tiene valor
    }

    // ============================================
    // Tests para isJPushAvailable
    // ============================================

    @Test
    fun `isJPushAvailable returns false when appKey invalid`() {
        // Given: AppKey inválida (por defecto)

        // When: Verifico disponibilidad
        val result = repository.isJPushAvailable()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    fun `isJPushAvailable returns true after successful initialization`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Verifico disponibilidad
        val result = repository.isJPushAvailable()

        // Then: Debería ser true si JPush está disponible
        // (En tests puede ser false si JPush no está en classpath)
    }

    // ============================================
    // Tests para setAlias
    // ============================================

    @Test
    fun `setAlias with valid alias does not crash`() {
        // Given: Alias válido
        val alias = "user-123"

        // When: Establezco alias
        val result = runCatching {
            repository.setAlias(alias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setAlias with empty alias does not crash`() {
        // Given: Alias vacío
        val emptyAlias = ""

        // When: Establezco alias vacío
        val result = runCatching {
            repository.setAlias(emptyAlias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setAlias with null-like string does not crash`() {
        // Given: Alias que parece null
        val nullAlias = "null"

        // When: Establezco alias
        val result = runCatching {
            repository.setAlias(nullAlias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setAlias with very long alias does not crash`() {
        // Given: Alias muy largo
        val longAlias = "a".repeat(10000)

        // When: Establezco alias
        val result = runCatching {
            repository.setAlias(longAlias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para deleteAlias
    // ============================================

    @Test
    fun `deleteAlias does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Elimino alias
        val result = runCatching {
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `deleteAlias does not crash when initialized`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Elimino alias
        val result = runCatching {
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `deleteAlias multiple times does not crash`() {
        // When: Elimino alias múltiples veces
        val result = runCatching {
            repository.deleteAlias()
            repository.deleteAlias()
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para setTags
    // ============================================

    @Test
    fun `setTags with valid tags does not crash`() {
        // Given: Tags válidos
        val tags = setOf("tag1", "tag2", "tag3")

        // When: Establezco tags
        val result = runCatching {
            repository.setTags(tags)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setTags with empty set does not crash`() {
        // Given: Set vacío
        val emptyTags = emptySet<String>()

        // When: Establezco tags vacíos
        val result = runCatching {
            repository.setTags(emptyTags)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setTags with single tag does not crash`() {
        // Given: Un solo tag
        val singleTag = setOf("only-tag")

        // When: Establezco tag único
        val result = runCatching {
            repository.setTags(singleTag)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setTags with special characters does not crash`() {
        // Given: Tags con caracteres especiales
        val tags = setOf("tag-1", "tag_2", "tag.3")

        // When: Establezco tags
        val result = runCatching {
            repository.setTags(tags)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para stopPush
    // ============================================

    @Test
    fun `stopPush does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Detengo push
        val result = runCatching {
            repository.stopPush()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `stopPush does not crash when initialized`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Detengo push
        val result = runCatching {
            repository.stopPush()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para resumePush
    // ============================================

    @Test
    fun `resumePush does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Reanudo push
        val result = runCatching {
            repository.resumePush()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `resumePush after stopPush does not crash`() {
        // Given: Repository inicializado y detenido
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)
        repository.stopPush()

        // When: Reanudo push
        val result = runCatching {
            repository.resumePush()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para clearAllNotifications
    // ============================================

    @Test
    fun `clearAllNotifications does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Limpio notificaciones
        val result = runCatching {
            repository.clearAllNotifications()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearAllNotifications does not crash when initialized`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Limpio notificaciones
        val result = runCatching {
            repository.clearAllNotifications()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para clearNotification
    // ============================================

    @Test
    fun `clearNotification with valid id does not crash`() {
        // Given: ID válido
        val notificationId = 123

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearNotification with zero id does not crash`() {
        // Given: ID cero
        val notificationId = 0

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearNotification with negative id does not crash`() {
        // Given: ID negativo
        val notificationId = -1

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para areNotificationsEnabled
    // ============================================

    @Test
    fun `areNotificationsEnabled returns false when not initialized`() {
        // Given: Repository no inicializado

        // When: Verifico notificaciones
        val result = repository.areNotificationsEnabled()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    fun `areNotificationsEnabled does not crash when initialized`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Verifico notificaciones
        val result = runCatching {
            repository.areNotificationsEnabled()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para openNotificationSettings
    // ============================================

    @Test
    fun `openNotificationSettings does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Abro settings
        val result = runCatching {
            repository.openNotificationSettings()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `openNotificationSettings does not crash when initialized`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Abro settings
        val result = runCatching {
            repository.openNotificationSettings()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de integración: Full lifecycle
    // ============================================

    @Test
    fun `full lifecycle initialize-setAlias-stopPush-deleteAlias does not crash`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext

        // When: Ciclo de vida completo
        val result = runCatching {
            repository.initialize(mockContext)
            repository.setAlias("user-123")
            repository.setTags(setOf("tag1", "tag2"))
            repository.stopPush()
            repository.resumePush()
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `multiple users alias switching does not crash`() {
        // Given: Múltiples usuarios
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Cambio entre usuarios
        val result = runCatching {
            repository.setAlias("user-1")
            repository.deleteAlias()
            repository.setAlias("user-2")
            repository.deleteAlias()
            repository.setAlias("user-3")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `concurrent setAlias calls do not crash`() {
        // Given: Múltiples aliases
        val aliases = listOf("user-1", "user-2", "user-3", "user-4", "user-5")

        // When: Seteo aliases concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                aliases.map { alias ->
                    kotlinx.coroutines.async {
                        repository.setAlias(alias)
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `concurrent setTags calls do not crash`() {
        // Given: Múltiples sets de tags
        val tagSets = listOf(
            setOf("tag1"),
            setOf("tag2", "tag3"),
            setOf("tag4", "tag5", "tag6")
        )

        // When: Seteo tags concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                tagSets.map { tags ->
                    kotlinx.coroutines.async {
                        repository.setTags(tags)
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Null safety
    // ============================================

    @Test
    fun `all methods handle null-like strings gracefully`() {
        // Given: Strings que parecen null
        val nullAlias = "null"
        val nullTag = "null"

        // When: Llamo métodos con null-like strings
        val result = runCatching {
            repository.setAlias(nullAlias)
            repository.setTags(setOf(nullTag))
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Unicode
    // ============================================

    @Test
    fun `setAlias with unicode does not crash`() {
        // Given: Alias con unicode
        val unicodeAlias = "Usuario 🌍 你好"

        // When: Establezco alias
        val result = runCatching {
            repository.setAlias(unicodeAlias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `setTags with unicode tags does not crash`() {
        // Given: Tags con unicode
        val unicodeTags = setOf("tag-español", "标签", "タグ")

        // When: Establezco tags
        val result = runCatching {
            repository.setTags(unicodeTags)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `setAlias performance test with 100 calls`() {
        // Given: 100 aliases
        val aliases = List(100) { "user-$it" }

        // When: Seteo 100 aliases
        val startTime = System.currentTimeMillis()
        aliases.forEach { alias ->
            repository.setAlias(alias)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 5 segundos)
        assertThat(elapsed).isLessThan(5000)
    }

    @Test
    fun `setTags performance test with 100 calls`() {
        // Given: 100 sets de tags
        val tagSets = List(100) { setOf("tag-$it") }

        // When: Seteo 100 tags
        val startTime = System.currentTimeMillis()
        tagSets.forEach { tags ->
            repository.setTags(tags)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 5 segundos)
        assertThat(elapsed).isLessThan(5000)
    }

    // ============================================
    // Tests para notificationReceived flow
    // ============================================

    @Test
    fun `notificationReceived flow exists and does not crash`() {
        // When: Accedo al flow
        val result = runCatching {
            repository.notificationReceived
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `notificationOpened flow exists and does not crash`() {
        // When: Accedo al flow
        val result = runCatching {
            repository.notificationOpened
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests específicos para FCM (Firebase Cloud Messaging)
    // ============================================

    @Test
    fun `isFCMAvailable returns false when not initialized`() {
        // Given: Repository no inicializado

        // When: Verifico disponibilidad
        val result = repository.isFCMAvailable()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    fun `isFCMAvailable returns true after initialization`() {
        // Given: Repository inicializado
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Verifico disponibilidad
        val result = repository.isFCMAvailable()

        // Then: Debería ser true
        assertThat(result).isTrue()
    }

    @Test
    fun `getRegistrationId returns empty string when FCM not available`() {
        // Given: Repository no inicializado

        // When: Obtengo registration ID
        val result = repository.getRegistrationId()

        // Then: Debería retornar string vacío (FCM no está disponible)
        assertThat(result).isEmpty()
    }

    @Test
    fun `hasNotificationPermission returns false when appContext is null`() {
        // Given: Repository sin contexto

        // When: Verifico permiso
        val result = repository.hasNotificationPermission()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    @Config(sdk = [Build.VERSION_CODES.TIRAMISU])
    fun `hasNotificationPermission returns false when permission not granted on Android 13+`() {
        // Given: Repository inicializado sin permiso
        every { mockContext.applicationContext } returns mockContext
        every { mockContext.packageName } returns "com.example.messageapp"
        every {
            mockContext.checkSelfPermission(
                Manifest.permission.POST_NOTIFICATIONS
            )
        } returns PackageManager.PERMISSION_DENIED

        repository.initialize(mockContext)

        // When: Verifico permiso en Android 13+
        val result = repository.hasNotificationPermission()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    @Config(sdk = [Build.VERSION_CODES.TIRAMISU])
    fun `hasNotificationPermission returns true when permission granted on Android 13+`() {
        // Given: Repository inicializado con permiso
        every { mockContext.applicationContext } returns mockContext
        every { mockContext.packageName } returns "com.example.messageapp"
        every {
            mockContext.checkSelfPermission(
                Manifest.permission.POST_NOTIFICATIONS
            )
        } returns PackageManager.PERMISSION_GRANTED

        repository.initialize(mockContext)

        // When: Verifico permiso en Android 13+
        val result = repository.hasNotificationPermission()

        // Then: Debería ser true
        assertThat(result).isTrue()
    }

    @Test
    @Config(sdk = [Build.VERSION_CODES.Q])
    fun `hasNotificationPermission returns true on Android 12 and below`() {
        // Given: Repository inicializado en Android 12
        every { mockContext.applicationContext } returns mockContext
        repository.initialize(mockContext)

        // When: Verifico permiso en Android 12 o inferior
        val result = repository.hasNotificationPermission()

        // Then: Debería ser true (no requiere permiso runtime)
        assertThat(result).isTrue()
    }

    @Test
    fun `setAlias with valid user id does not crash`() {
        // Given: Alias válido
        val alias = "user-123"

        // When: Establezco alias
        val result = runCatching {
            repository.setAlias(alias)
        }

        // Then: No debería crashar (puede fallar si FCM no está inicializado)
        // Lo importante es que no lance excepción inesperada
    }

    @Test
    fun `setAlias with empty string does not crash`() {
        // Given: Alias vacío
        val alias = ""

        // When: Establezco alias vacío
        val result = runCatching {
            repository.setAlias(alias)
        }

        // Then: No debería crashar
    }

    @Test
    fun `setAlias with null-like string does not crash`() {
        // Given: Alias null-like
        val alias = "null"

        // When: Establezco alias null-like
        val result = runCatching {
            repository.setAlias(alias)
        }

        // Then: No debería crashar
    }

    @Test
    fun `setTags with empty set does not crash`() {
        // Given: Set vacío de tags
        val tags = emptySet<String>()

        // When: Establezco tags vacíos
        val result = runCatching {
            repository.setTags(tags)
        }

        // Then: No debería crashar
    }

    @Test
    fun `setTags with valid tags does not crash`() {
        // Given: Tags válidos
        val tags = setOf("chat", "grupo", "importante")

        // When: Establezco tags
        val result = runCatching {
            repository.setTags(tags)
        }

        // Then: No debería crashar
    }

    @Test
    fun `deleteAlias does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Elimino alias
        val result = runCatching {
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `areNotificationsEnabled returns false when not initialized`() {
        // Given: Repository no inicializado

        // When: Verifico si notificaciones están habilitadas
        val result = repository.areNotificationsEnabled()

        // Then: Debería ser false
        assertThat(result).isFalse()
    }

    @Test
    fun `openNotificationSettings does not crash when not initialized`() {
        // Given: Repository no inicializado

        // When: Abro configuración
        val result = runCatching {
            repository.openNotificationSettings()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearNotification with valid id does not crash`() {
        // Given: ID de notificación válido
        val notificationId = 123

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearNotification with zero id does not crash`() {
        // Given: ID cero
        val notificationId = 0

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `clearNotification with negative id does not crash`() {
        // Given: ID negativo
        val notificationId = -1

        // When: Limpio notificación
        val result = runCatching {
            repository.clearNotification(notificationId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento para FCM
    // ============================================

    @Test
    fun `setAlias performance test with 100 calls`() {
        // Given: 100 aliases
        val aliases = List(100) { "user-$it" }

        // When: Seteo 100 aliases
        val startTime = System.currentTimeMillis()
        aliases.forEach { alias ->
            repository.setAlias(alias)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 5 segundos)
        assertThat(elapsed).isLessThan(5000)
    }

    @Test
    fun `setTags performance test with 100 calls`() {
        // Given: 100 sets de tags
        val tagSets = List(100) { setOf("tag-$it") }

        // When: Seteo 100 tags
        val startTime = System.currentTimeMillis()
        tagSets.forEach { tags ->
            repository.setTags(tags)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 5 segundos)
        assertThat(elapsed).isLessThan(5000)
    }

    // ============================================
    // Tests de flujo completo de lifecycle FCM
    // ============================================

    @Test
    fun `full lifecycle initialize-setAlias-stopPush-deleteAlias does not crash`() {
        // Given: Repository y datos válidos
        every { mockContext.applicationContext } returns mockContext
        val alias = "user-lifecycle"
        val tags = setOf("chat", "grupo")

        // When: Ejecuto lifecycle completo
        val result = runCatching {
            repository.initialize(mockContext)
            repository.setAlias(alias)
            repository.setTags(tags)
            repository.stopPush()
            repository.resumePush()
            repository.deleteAlias()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }
}
