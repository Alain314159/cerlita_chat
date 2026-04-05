package com.example.messageapp.data

import android.content.Context
import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import org.junit.Before
import org.junit.Test

class FCMConfigRepositoryTest {

    private lateinit var repository: FCMConfigRepository
    private lateinit var context: Context

    @Before
    fun setup() {
        repository = FCMConfigRepository()
        context = mockk()
    }

    @Test
    fun `initialize sets isInitialized to true`() {
        // Given: Context mockeado
        val appContext = mockk<Context>()
        every { context.applicationContext } returns appContext

        // When: Inicializo el repositorio
        repository.initialize(context)

        // Then: Verifico que está inicializado
        assertThat(repository.isFCMAvailable()).isTrue()
    }

    @Test
    fun `isFCMAvailable returns false before initialize`() {
        // Given: Repositorio no inicializado

        // When: Verifico si está disponible
        val result = repository.isFCMAvailable()

        // Then: Retorna false
        assertThat(result).isFalse()
    }

    @Test
    fun `isFCMAvailable returns true after initialize`() {
        // Given: Context mockeado
        val appContext = mockk<Context>()
        every { context.applicationContext } returns appContext

        // When: Inicializo y luego verifico
        repository.initialize(context)
        val result = repository.isFCMAvailable()

        // Then: Retorna true
        assertThat(result).isTrue()
    }

    @Test
    fun `hasNotificationPermission returns false when context is null`() {
        // Given: Repositorio sin contexto

        // When: Verifico permisos
        val result = repository.hasNotificationPermission()

        // Then: Retorna false
        assertThat(result).isFalse()
    }

    @Test
    fun `areNotificationsEnabled returns false when context is null`() {
        // Given: Repositorio sin contexto

        // When: Verifico notificaciones habilitadas
        val result = repository.areNotificationsEnabled()

        // Then: Retorna false
        assertThat(result).isFalse()
    }
}
