package com.example.messageapp.data

import android.content.Context
import androidx.activity.ComponentActivity
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * FACADE TEMPORAL - Para compatibilidad con código existente
 *
 * Este facade combina los 3 nuevos repositorios para mantener
 * la API antigua de NotificationRepository mientras se actualiza el código.
 *
 * TODO: Eliminar este archivo cuando todo el código use los nuevos repositorios
 *
 * @property fcmConfigRepository Repositorio de configuración FCM
 * @property fcmTokenRepository Repositorio de tokens FCM
 * @property fcmLifecycleRepository Repositorio de ciclo de vida FCM
 */
@Deprecated(
    "Usar FCMConfigRepository, FCMTokenRepository y FCMLifecycleRepository por separado",
    ReplaceWith("FCMConfigRepository, FCMTokenRepository, FCMLifecycleRepository")
)
class NotificationRepository {

    private val fcmConfigRepository = FCMConfigRepository()
    private val fcmTokenRepository = FCMTokenRepository()
    private val fcmLifecycleRepository = FCMLifecycleRepository()

    // Eventos de notificaciones recibidas (para compatibilidad)
    private val _notificationReceived = MutableSharedFlow<FCMNotificationData>()
    val notificationReceived: SharedFlow<FCMNotificationData> = _notificationReceived.asSharedFlow()

    // Eventos cuando se abre una notificación (para compatibilidad)
    private val _notificationOpened = MutableSharedFlow<FCMNotificationData>()
    val notificationOpened: SharedFlow<FCMNotificationData> = _notificationOpened.asSharedFlow()

    // Delegados a FCMConfigRepository
    fun initialize(context: Context) {
        fcmConfigRepository.initialize(context)
        fcmLifecycleRepository.initialize(context)
    }

    fun isFCMAvailable(): Boolean =
        fcmConfigRepository.isFCMAvailable()

    suspend fun getRegistrationId(): String =
        fcmConfigRepository.getRegistrationId()

    fun hasNotificationPermission(): Boolean =
        fcmConfigRepository.hasNotificationPermission()

    fun areNotificationsEnabled(): Boolean =
        fcmConfigRepository.areNotificationsEnabled()

    // Delegados a FCMTokenRepository
    suspend fun setAlias(alias: String) =
        fcmTokenRepository.setAlias(alias)

    suspend fun deleteAlias() =
        fcmTokenRepository.deleteAlias()

    suspend fun setTags(tags: Set<String>) =
        fcmTokenRepository.setTags(tags)

    // Delegados a FCMLifecycleRepository
    fun stopPush() =
        fcmLifecycleRepository.stopPush()

    fun resumePush() =
        fcmLifecycleRepository.resumePush()

    fun clearAllNotifications() =
        fcmLifecycleRepository.clearAllNotifications()

    fun clearNotification(notificationId: Int) =
        fcmLifecycleRepository.clearNotification(notificationId)

    fun openNotificationSettings() =
        fcmLifecycleRepository.openNotificationSettings()

    fun requestNotificationPermission(activity: ComponentActivity) =
        fcmLifecycleRepository.requestNotificationPermission(activity)
}

/**
 * Data class para los datos de notificación recibidos
 * (Se mantiene por compatibilidad)
 */
data class FCMNotificationData(
    val title: String,
    val message: String,
    val data: Map<String, String>,
    val notificationId: Int,
    val messageId: String
)
