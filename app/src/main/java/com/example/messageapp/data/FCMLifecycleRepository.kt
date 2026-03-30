package com.example.messageapp.data

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.activity.ComponentActivity

// ✅ TAG constante para logging
private const val TAG = "MessageApp"

/**
 * Repositorio de Ciclo de Vida de Firebase Cloud Messaging
 *
 * Responsabilidad única: Control de ciclo de vida y UI de notificaciones
 *
 * Funciones (6):
 * 1. stopPush
 * 2. resumePush
 * 3. clearAllNotifications
 * 4. clearNotification
 * 5. openNotificationSettings
 * 6. requestNotificationPermission
 */
class FCMLifecycleRepository {

    private var appContext: Context? = null

    /**
     * Establece el contexto de aplicación
     */
    fun initialize(context: Context) {
        appContext = context.applicationContext
    }

    /**
     * Detiene FCM (para cuando el usuario hace logout)
     * Nota: FCM no se puede "detener" realmente, solo se deja de escuchar
     */
    fun stopPush() {
        // FCM no tiene método stopPush como JPush
        // Se maneja a nivel de servidor dejando de enviar mensajes
        Log.d(TAG, "FCMLifecycleRepository: stopPush (lógico)")
    }

    /**
     * Resume FCM (para cuando el usuario hace login)
     * Nota: FCM siempre está activo una vez inicializado
     */
    fun resumePush() {
        // FCM siempre está activo una vez inicializado
        Log.d(TAG, "FCMLifecycleRepository: resumePush (siempre activo)")
    }

    /**
     * Limpia todas las notificaciones
     * Nota: FCM no proporciona API para esto, se maneja a nivel de sistema
     */
    fun clearAllNotifications() {
        // FCM no tiene método para limpiar notificaciones
        // Esto se maneja a nivel de NotificationManager
        Log.d(TAG, "FCMLifecycleRepository: clearAllNotifications (no soportado por FCM)")
    }

    /**
     * Elimina una notificación específica por ID
     */
    fun clearNotification(notificationId: Int) {
        // FCM no tiene método para eliminar notificaciones específicas
        // Esto se maneja a nivel de NotificationManager
        Log.d(TAG, "FCMLifecycleRepository: clearNotification (no soportado por FCM)")
    }

    /**
     * Abre la configuración de notificaciones del sistema
     */
    fun openNotificationSettings() {
        val ctx = appContext ?: return
        try {
            val intent = Intent(
                android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS
            ).apply {
                putExtra(
                    android.provider.Settings.EXTRA_APP_PACKAGE,
                    ctx.packageName
                )
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
        } catch (e: android.content.ActivityNotFoundException) {
            Log.w(TAG, "FCMLifecycleRepository: Activity not found opening settings", e)
        } catch (e: Exception) {
            Log.e(TAG, "FCMLifecycleRepository: Unexpected error opening settings", e)
        }
    }

    /**
     * Solicita permiso de notificaciones para Android 13+
     * Debe llamarse desde una Activity
     */
    fun requestNotificationPermission(activity: ComponentActivity) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            activity.requestPermissions(
                arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                1001
            )
        }
    }
}
