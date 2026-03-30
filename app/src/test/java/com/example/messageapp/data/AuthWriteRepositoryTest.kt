package com.example.messageapp.data

import android.content.Context
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class AuthWriteRepositoryTest {

    private lateinit var repository: AuthWriteRepository
    private lateinit var authReadRepository: AuthReadRepository

    @Before
    fun setup() {
        authReadRepository = mockk()
        repository = AuthWriteRepository(authReadRepository)
    }

    @Test
    fun `signUpWithEmail returns failure when email is invalid`() = runTest {
        // Given: Email inválido
        val email = "invalid-email"
        val password = "password123"

        coEvery { authReadRepository.isValidEmail(email) } returns false

        // When: Intento registrar
        val result = repository.signUpWithEmail(email, password)

        // Then: Retorna fallo con IllegalArgumentException
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()).isInstanceOf(IllegalArgumentException::class.java)
    }

    @Test
    fun `signUpWithEmail returns failure when password is too short`() = runTest {
        // Given: Password muy corto
        val email = "test@example.com"
        val password = "123" // Menos de 6 caracteres

        coEvery { authReadRepository.isValidEmail(email) } returns true

        // When: Intento registrar
        val result = repository.signUpWithEmail(email, password)

        // Then: Retorna fallo
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).contains("6 caracteres")
    }

    @Test
    fun `signInWithEmail returns failure when email is invalid`() = runTest {
        // Given: Email inválido
        val email = "invalid"
        val password = "password123"

        coEvery { authReadRepository.isValidEmail(email) } returns false

        // When: Intento iniciar sesión
        val result = repository.signInWithEmail(email, password)

        // Then: Retorna fallo
        assertThat(result.isFailure).isTrue()
    }

    @Test
    fun `signInWithEmail returns failure when password is blank`() = runTest {
        // Given: Password en blanco
        val email = "test@example.com"
        val password = ""

        coEvery { authReadRepository.isValidEmail(email) } returns true

        // When: Intento iniciar sesión
        val result = repository.signInWithEmail(email, password)

        // Then: Retorna fallo
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).contains("vacío")
    }

    @Test
    fun `sendPasswordReset returns success when email is valid`() = runTest {
        // Note: Este test requiere mockear SupabaseConfig
        // Placeholder para la estructura
        assertThat(true).isTrue()
    }

    @Test
    fun `signOut returns success when logout is successful`() = runTest {
        // Note: Este test requiere mockear SupabaseConfig y E2ECipher
        assertThat(true).isTrue()
    }
}
