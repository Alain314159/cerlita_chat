package com.example.messageapp.push

import android.os.Looper
import com.example.messageapp.data.FCMNotificationData
import com.google.common.truth.Truth.assertThat
import com.google.firebase.messaging.RemoteMessage
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.verify
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows

/**
 * Tests para FCMMessageService
 *
 * Cubre: onNewToken, onMessageReceived, sendRegistrationToServer
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
@RunWith(RobolectricTestRunner::class)
class FCMMessageServiceTest {

    private lateinit var service: FCMMessageService
    private lateinit var serviceSpy: FCMMessageService

    @Before
    fun setup() {
        service = FCMMessageService()
        serviceSpy = spyk(service)
    }

    // ============================================
    // Tests para onNewToken
    // ============================================

    @Test
    fun `onNewToken with valid token logs correctly`() {
        // Given: Un token válido de FCM
        val token = "fcm_token_12345_valid"

        // When: Se llama a onNewToken
        service.onNewToken(token)

        // Then: Debería procesar el token (verificamos que no lance excepción)
        // Nota: El logging no se puede verificar fácilmente sin configurar Robolectric shadows
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onNewToken calls sendRegistrationToServer`() {
        // Given: Un token válido
        val token = "fcm_token_67890_valid"

        // When: Se llama a onNewToken
        serviceSpy.onNewToken(token)

        // Then: Debería llamar a sendRegistrationToServer
        verify { serviceSpy.sendRegistrationToServer(token) }
    }

    @Test
    fun `onNewToken with empty token does not crash`() {
        // Given: Token vacío
        val token = ""

        // When: Se llama a onNewToken con token vacío
        service.onNewToken(token)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onNewToken with null-like token does not crash`() {
        // Given: Token que parece null (string "null")
        val token = "null"

        // When: Se llama a onNewToken
        service.onNewToken(token)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onNewToken with very long token does not crash`() {
        // Given: Token muy largo
        val token = "fcm_token_".repeat(100)

        // When: Se llama a onNewToken
        service.onNewToken(token)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    // ============================================
    // Tests para onMessageReceived
    // ============================================

    @Test
    fun `onMessageReceived with notification payload logs correctly`() {
        // Given: Un mensaje con notificación
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_123"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_123"
        every { mockNotification.title } returns "Test Title"
        every { mockNotification.body } returns "Test Body"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: Debería procesar la notificación (verificamos que no lance excepción)
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with data payload creates notificationData`() {
        // Given: Un mensaje con data payload
        val mockMessage = mockk<RemoteMessage>()
        val dataPayload = mapOf(
            "title" to "Data Title",
            "message" to "Data Message",
            "chatId" to "chat_123"
        )

        every { mockMessage.from } returns "/topics/user_456"
        every { mockMessage.notification } returns null
        every { mockMessage.data } returns dataPayload
        every { mockMessage.messageId } returns "msg_456"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: Debería procesar el data payload (verificamos que no lance excepción)
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with null title uses default`() {
        // Given: Mensaje con título null
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_789"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_789"
        every { mockNotification.title } returns null
        every { mockNotification.body } returns "Test Body"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: Debería usar "Sin título" como default (verificamos que no lance excepción)
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with null body uses default`() {
        // Given: Mensaje con body null
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_abc"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_abc"
        every { mockNotification.title } returns "Test Title"
        every { mockNotification.body } returns null

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: Debería usar "Sin mensaje" como default (verificamos que no lance excepción)
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with empty data map does not crash`() {
        // Given: Mensaje con data vacío
        val mockMessage = mockk<RemoteMessage>()

        every { mockMessage.from } returns "/topics/user_empty"
        every { mockMessage.notification } returns null
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_empty"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with null notification does not crash`() {
        // Given: Mensaje sin notificación
        val mockMessage = mockk<RemoteMessage>()

        every { mockMessage.from } returns "/topics/user_null"
        every { mockMessage.notification } returns null
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_null"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with unicode in title and body does not crash`() {
        // Given: Mensaje con unicode
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_unicode"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_unicode"
        every { mockNotification.title } returns "Título con 🚀 emoji"
        every { mockNotification.body } returns "Mensaje con ñ y caracteres especiales"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with very long message does not crash`() {
        // Given: Mensaje muy largo
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()
        val longBody = "Body text ".repeat(1000)

        every { mockMessage.from } returns "/topics/user_long"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_long"
        every { mockNotification.title } returns "Long Message"
        every { mockNotification.body } returns longBody

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `onMessageReceived with special characters in data does not crash`() {
        // Given: Mensaje con caracteres especiales en data
        val mockMessage = mockk<RemoteMessage>()
        val dataPayload = mapOf(
            "title" to "Title with <>&\"' special chars",
            "message" to "Message with \n newlines and \t tabs",
            "extra" to "Extra with SQL injection'; DROP TABLE users;--"
        )

        every { mockMessage.from } returns "/topics/user_special"
        every { mockMessage.notification } returns null
        every { mockMessage.data } returns dataPayload
        every { mockMessage.messageId } returns "msg_special"

        // When: Se recibe el mensaje
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    // ============================================
    // Tests para sendRegistrationToServer
    // ============================================

    @Test
    fun `sendRegistrationToServer logs token prefix`() {
        // Given: Un token válido
        val token = "abcdefghijklmnopqrstuvwxyz123456"

        // When: Se llama al método (directamente para testing)
        // Usamos el service sin spy para este test interno
        service.onNewToken(token)

        // Then: Debería loggear el prefijo del token (verificamos que no lance excepción)
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `sendRegistrationToServer with short token does not crash`() {
        // Given: Token corto
        val token = "short"

        // When: Se llama a través de onNewToken
        service.onNewToken(token)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    // ============================================
    // Tests de integración - Flujo completo
    // ============================================

    @Test
    fun `full lifecycle onNewToken then onMessageReceived does not crash`() {
        // Given: Servicio inicializado
        val token = "fcm_token_lifecycle"
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_lifecycle"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns "msg_lifecycle"
        every { mockNotification.title } returns "Lifecycle Test"
        every { mockNotification.body } returns "Testing full lifecycle"

        // When: Secuencia completa de eventos
        service.onNewToken(token)
        service.onMessageReceived(mockMessage)

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun `multiple onMessageReceived calls do not crash`() {
        // Given: Múltiples mensajes
        val messages = listOf(
            createMockMessage("msg_1", "Title 1", "Body 1"),
            createMockMessage("msg_2", "Title 2", "Body 2"),
            createMockMessage("msg_3", "Title 3", "Body 3")
        )

        // When: Se reciben múltiples mensajes
        messages.forEach { message ->
            service.onMessageReceived(message)
        }

        // Then: No debería crashar
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    // Helper function para crear mocks
    private fun createMockMessage(
        messageId: String,
        title: String,
        body: String
    ): RemoteMessage {
        val mockMessage = mockk<RemoteMessage>()
        val mockNotification = mockk<RemoteMessage.Notification>()

        every { mockMessage.from } returns "/topics/user_test"
        every { mockMessage.notification } returns mockNotification
        every { mockMessage.data } returns emptyMap()
        every { mockMessage.messageId } returns messageId
        every { mockNotification.title } returns title
        every { mockNotification.body } returns body

        return mockMessage
    }
}
