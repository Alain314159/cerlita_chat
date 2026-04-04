package com.example.messageapp.core

import android.content.Context
import android.util.Log
import com.example.messageapp.data.FCMConfigRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

private const val TAG = "MessageApp"

/**
 * Gestiona la inicialización y actualización de FCM
 *
 * Responsabilidad única: Manejar el ciclo de vida de Firebase Cloud Messaging
 *
 * Uso:
 * - initialize(): Inicializa FCM al iniciar la app
 * - updateTokenAfterLogin(): Actualiza token después de login exitoso
 */
class FCMManager(
    private val context: Context,
    private val lifecycleScope: CoroutineScope,
    private val fcmConfigRepo: FCMConfigRepository = FCMConfigRepository()
) {

    /**
     * Inicializa FCM al iniciar la aplicación
     */
    fun initialize() {
        fcmConfigRepo.initialize(context)
        Log.d(TAG, "FCMManager: FCM initialized successfully")
    }

    /**
     * Actualiza el token FCM en Supabase después de un login exitoso
     *
     * Si el token está vacío, registra un warning pero no falla silenciosamente.
     * TODO: Implementar actualización de token en Supabase cuando esté disponible
     */
    fun updateTokenAfterLogin() {
        lifecycleScope.launch {
            try {
                val token = fcmConfigRepo.getRegistrationId()
                if (token.isNotBlank()) {
                    // TODO: Implementar actualización de token en Supabase
                    // AuthRepository().updateFcmToken(token)
                    Log.d(TAG, "FCMManager: FCM token ready for update: ${token.take(10)}...")
                } else {
                    Log.w(TAG, "FCMManager: Cannot update token - FCM token is empty. " +
                        "Ensure Firebase is properly configured")
                }
            } catch (e: Exception) {
                Log.e(TAG, "FCMManager: Error updating FCM token", e)
            }
        }
    }
}
