package com.example.messageapp.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await

// ✅ TAG constante para logging
private const val TAG = "MessageApp"

/**
 * Repositorio de Configuración de Firebase Cloud Messaging
 *
 * Responsabilidad única: Inicialización y configuración de FCM
 *
 * Funciones (4):
 * 1. initialize
 * 2. isFCMAvailable
 * 3. getRegistrationId
 * 4. areNotificationsEnabled
 */
class FCMConfigRepository {

    private var isInitialized = false
    private var appContext: Context? = null

    /**
     * Inicializa Firebase Cloud Messaging
     * Debe llamarse UNA sola vez, preferiblemente en Application.onCreate()
     */
    fun initialize(context: Context) {
        appContext = context.applicationContext
        isInitialized = true
        Log.d(TAG, "FCMConfigRepository: FCM inicializado correctamente")
    }

    /**
     * Verifica si FCM está disponible y configurado
     */
    fun isFCMAvailable(): Boolean {
        return isInitialized
    }

    /**
     * Obtiene el token de registro FCM único de este dispositivo
     * Este token se usa para enviar notificaciones push a este dispositivo específico
     */
    suspend fun getRegistrationId(): String {
        return try {
            FirebaseMessaging.getInstance().token.await()
        } catch (e: IllegalStateException) {
            Log.w(TAG, "FCMConfigRepository: FCM not initialized", e)
            ""
        } catch (e: Exception) {
            Log.e(TAG, "FCMConfigRepository: Unexpected error getting FCM token", e)
            ""
        }
    }

    /**
     * Verifica si la app tiene permiso para mostrar notificaciones
     * Requerido para Android 13+ (API 33+)
     */
    fun hasNotificationPermission(): Boolean {
        val ctx = appContext ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                ctx,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Android 12 y anteriores no requieren permiso runtime
        }
    }

    /**
     * Verifica si las notificaciones están habilitadas
     */
    fun areNotificationsEnabled(): Boolean {
        val ctx = appContext ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotificationPermission()
        } else {
            true
        }
    }
}
