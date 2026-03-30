package com.example.messageapp

import android.app.Application
import android.util.Log
import com.example.messageapp.data.NotificationRepository
import com.example.messageapp.supabase.SupabaseConfig

/**
 * Clase de Aplicación
 *
 * Inicializa componentes globales:
 * - Supabase (cliente)
 * - FCM (Firebase Cloud Messaging para notificaciones push)
 */
class App : Application() {

    companion object {
        private const val TAG = "MessageApp"
        lateinit var instance: Application
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize Firebase Cloud Messaging (FCM)
        val notificationRepo = NotificationRepository()
        notificationRepo.initialize(this)
        Log.d(TAG, "FCM inicializado en App.onCreate()")

        // Supabase se inicializa automáticamente cuando se usa SupabaseConfig.client
        // No necesitamos inicialización explícita aquí
    }
}
