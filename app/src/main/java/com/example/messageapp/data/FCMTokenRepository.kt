package com.example.messageapp.data

import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await

// ✅ TAG constante para logging
private const val TAG = "MessageApp"

/**
 * Repositorio de Tokens de Firebase Cloud Messaging
 *
 * Responsabilidad única: Gestión de alias y tags para segmentación
 *
 * Funciones (4):
 * 1. setAlias
 * 2. deleteAlias
 * 3. setTags
 * 4. hasNotificationPermission (delega a FCMConfigRepository)
 */
class FCMTokenRepository {

    /**
     * Establece un alias para identificar al usuario (topic de FCM)
     * Esto permite enviar notificaciones a usuarios específicos
     */
    suspend fun setAlias(alias: String) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic("user_$alias").await()
            Log.d(TAG, "FCMTokenRepository: Alias establecido: user_$alias")
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "FCMTokenRepository: Invalid alias format", e)
        } catch (e: IllegalStateException) {
            Log.w(TAG, "FCMTokenRepository: FCM not initialized", e)
        } catch (e: Exception) {
            Log.e(TAG, "FCMTokenRepository: Unexpected error setting alias", e)
        }
    }

    /**
     * Elimina el alias (cuando el usuario hace logout)
     * Nota: Los topics de FCM no se pueden eliminar directamente
     */
    suspend fun deleteAlias() {
        // Los topics de FCM no se pueden eliminar directamente
        // Se maneja en el servidor dejando de enviar mensajes a ese topic
        Log.d(TAG, "FCMTokenRepository: Alias eliminado (lógico)")
    }

    /**
     * Establece tags para segmentación (topics de FCM)
     */
    suspend fun setTags(tags: Set<String>) {
        try {
            tags.forEach { tag ->
                FirebaseMessaging.getInstance().subscribeToTopic("tag_$tag").await()
            }
            Log.d(TAG, "FCMTokenRepository: Tags establecidos: $tags")
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "FCMTokenRepository: Invalid tag format", e)
        } catch (e: IllegalStateException) {
            Log.w(TAG, "FCMTokenRepository: FCM not initialized", e)
        } catch (e: Exception) {
            Log.e(TAG, "FCMTokenRepository: Unexpected error setting tags", e)
        }
    }

    /**
     * Verifica si la app tiene permiso para notificaciones
     * Nota: Esta función debería moverse a FCMConfigRepository
     * Se mantiene aquí por compatibilidad
     */
    fun hasNotificationPermission(context: android.content.Context): Boolean {
        return android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.TIRAMISU ||
            androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
    }
}
