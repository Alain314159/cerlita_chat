package com.example.messageapp.push

import android.util.Log
import com.example.messageapp.data.FCMNotificationData
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Servicio de Firebase Cloud Messaging para recibir notificaciones
 *
 * Migración desde JPushBroadcastReceiver - Marzo 2026
 *
 * Documentación: https://firebase.google.com/docs/cloud-messaging/android/client
 */
class FCMMessageService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMMessageService"
    }

    /**
     * Called when a new FCM token is generated
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        
        // Enviar el nuevo token al servidor para actualizar el registro
        // Esto se hace en el ViewModel o Repository de Auth
        sendRegistrationToServer(token)
    }

    /**
     * Called when a message is received while app is in foreground
     */
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Log.d(TAG, "Message received from: ${message.from}")
        
        message.notification?.let { notification ->
            val title = notification.title ?: "Sin título"
            val body = notification.body ?: "Sin mensaje"
            val notificationId = notification.hashCode()
            val messageId = message.messageId ?: "unknown"
            
            Log.d(TAG, "Notification: $title - $body")
            
            // Aquí se podría mostrar la notificación directamente
            // o enviarla a través de un evento para que la UI la maneje
        }
        
        // Manejar datos payload (data messages)
        message.data.isNotEmpty().let {
            Log.d(TAG, "Message data payload: ${message.data}")
            
            val title = message.data["title"] ?: "Sin título"
            val body = message.data["message"] ?: "Sin mensaje"
            val notificationId = message.data.hashCode()
            val messageId = message.messageId ?: "unknown"
            
            // Crear objeto de notificación
            val notificationData = FCMNotificationData(
                title = title,
                message = body,
                data = message.data,
                notificationId = notificationId,
                messageId = messageId
            )
            
            // Aquí se podría:
            // 1. Mostrar notificación directamente
            // 2. Enviar a través de broadcast/evento
            // 3. Guardar en base de datos
        }
    }

    /**
     * Envía el token de registro al servidor
     * Esto debe actualizarse en la base de datos del usuario
     */
    private fun sendRegistrationToServer(token: String) {
        // TODO: Implementar envío del token al servidor
        // Esto se hace típicamente en el AuthRepository o UserRepository
        Log.d(TAG, "Sending token to server: ${token.take(10)}...")
    }
}
