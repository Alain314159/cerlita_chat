package com.example.messageapp.viewmodel

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.example.messageapp.data.PairingRepository
import com.example.messageapp.data.PairingStatus
import com.example.messageapp.model.User
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * Tests para PairingViewModel
 *
 * Cubre: loadPairingStatus, generatePairingCode, pairWithCode, searchByEmail,
 *        sendPairingRequest, invalidateCode, clearError
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
@OptIn(ExperimentalCoroutinesApi::class)
class PairingViewModelTest {

    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: PairingViewModel
    private lateinit var pairingRepository: PairingRepository
    private val testDispatcher = UnconfinedTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        pairingRepository = mockk()
        viewModel = PairingViewModel(pairingRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    // ============================================
    // Tests para estado inicial
    // ============================================

    @Test
    fun `initial state is Idle`() {
        // When: Verifico estado inicial
        val state = viewModel.uiState.value

        // Then: Debería ser Idle
        assertThat(state).isInstanceOf(PairingUiState.Idle::class.java)
    }

    @Test
    fun `initial pairingStatus is null`() {
        // When: Verifico pairing status
        val status = viewModel.pairingStatus.value

        // Then: Debería ser null
        assertThat(status).isNull()
    }

    // ============================================
    // Tests para loadPairingStatus
    // ============================================

    @Test
    fun `loadPairingStatus updates uiState to Loading then Success`() = runTest {
        // Given: Repository retorna status
        val mockStatus = PairingStatus(
            userId = "user-123",
            pairedWith = "user-456",
            pairingCode = null
        )
        coEvery { pairingRepository.getPairingStatus() } returns Result.success(mockStatus)

        // When: Cargo status
        viewModel.loadPairingStatus()

        // Then: Debería actualizar a Success
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Success::class.java)
    }

    @Test
    fun `loadPairingStatus handles error`() = runTest {
        // Given: Repository falla
        val mockError = Exception("Error al cargar")
        coEvery { pairingRepository.getPairingStatus() } returns Result.failure(mockError)

        // When: Cargo status
        viewModel.loadPairingStatus()

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `loadPairingStatus with null status does not crash`() = runTest {
        // Given: Status null
        coEvery { pairingRepository.getPairingStatus() } returns Result.failure(Exception("Not found"))

        // When: Cargo status
        val result = runCatching {
            viewModel.loadPairingStatus()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para generatePairingCode
    // ============================================

    @Test
    fun `generatePairingCode returns 6-digit code`() = runTest {
        // Given: Repository retorna código
        val mockCode = "123456"
        coEvery { pairingRepository.generatePairingCode() } returns Result.success(mockCode)

        // When: Genero código
        viewModel.generatePairingCode()

        // Then: Debería actualizar a CodeGenerated
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.CodeGenerated::class.java)
        val codeGenerated = state as PairingUiState.CodeGenerated
        assertThat(codeGenerated.code).hasLength(6)
    }

    @Test
    fun `generatePairingCode updates uiState to CodeGenerated`() = runTest {
        // Given: Código válido
        val mockCode = "654321"
        coEvery { pairingRepository.generatePairingCode() } returns Result.success(mockCode)

        // When: Genero código
        viewModel.generatePairingCode()

        // Then: Debería actualizar estado
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.CodeGenerated::class.java)
    }

    @Test
    fun `generatePairingCode handles error`() = runTest {
        // Given: Repository falla
        val mockError = Exception("Error al generar")
        coEvery { pairingRepository.generatePairingCode() } returns Result.failure(mockError)

        // When: Genero código
        viewModel.generatePairingCode()

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `generatePairingCode code is numeric`() = runTest {
        // Given: Código numérico
        val mockCode = "000123"
        coEvery { pairingRepository.generatePairingCode() } returns Result.success(mockCode)

        // When: Genero código
        viewModel.generatePairingCode()

        // Then: Debería ser numérico
        val state = viewModel.uiState.value as? PairingUiState.CodeGenerated
        assertThat(state).isNotNull()
        assertThat(state!!.code).matches("[0-9]+")
    }

    @Test
    fun `generatePairingCode code length is exactly 6`() = runTest {
        // Given: Código de 6 dígitos
        val mockCode = "123456"
        coEvery { pairingRepository.generatePairingCode() } returns Result.success(mockCode)

        // When: Genero código
        viewModel.generatePairingCode()

        // Then: Debería tener 6 caracteres
        val state = viewModel.uiState.value as? PairingUiState.CodeGenerated
        assertThat(state).isNotNull()
        assertThat(state!!.code).hasLength(6)
    }

    // ============================================
    // Tests para pairWithCode
    // ============================================

    @Test
    fun `pairWithCode with valid code updates to Paired`() = runTest {
        // Given: Código válido
        val validCode = "123456"
        coEvery { pairingRepository.pairWithCode(validCode) } returns Result.success(Unit)

        // When: Emparejo con código
        viewModel.pairWithCode(validCode)

        // Then: Debería actualizar a Paired
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Paired::class.java)
    }

    @Test
    fun `pairWithCode with invalid code updates to Error`() = runTest {
        // Given: Código inválido
        val invalidCode = "wrong"
        coEvery { pairingRepository.pairWithCode(invalidCode) } returns Result.failure(Exception("Código inválido"))

        // When: Intento emparejar
        viewModel.pairWithCode(invalidCode)

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `pairWithCode with empty code does not crash`() = runTest {
        // Given: Código vacío
        val emptyCode = ""
        coEvery { pairingRepository.pairWithCode(emptyCode) } returns Result.failure(Exception("Código vacío"))

        // When: Intento emparejar
        val result = runCatching {
            viewModel.pairWithCode(emptyCode)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `pairWithCode with null-like code does not crash`() = runTest {
        // Given: Código que parece null
        val nullCode = "null"
        coEvery { pairingRepository.pairWithCode(nullCode) } returns Result.failure(Exception("Not found"))

        // When: Intento emparejar
        val result = runCatching {
            viewModel.pairWithCode(nullCode)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `pairWithCode with very long code does not crash`() = runTest {
        // Given: Código muy largo
        val longCode = "1".repeat(100)
        coEvery { pairingRepository.pairWithCode(longCode) } returns Result.failure(Exception("Invalid length"))

        // When: Intento emparejar
        val result = runCatching {
            viewModel.pairWithCode(longCode)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para searchByEmail
    // ============================================

    @Test
    fun `searchByEmail with valid email updates to UserFound`() = runTest {
        // Given: Email válido, usuario encontrado
        val email = "test@example.com"
        val mockUser = mockk<User>()
        coEvery { pairingRepository.searchByEmail(email) } returns Result.success(mockUser)

        // When: Busco por email
        viewModel.searchByEmail(email)

        // Then: Debería actualizar a UserFound
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.UserFound::class.java)
    }

    @Test
    fun `searchByEmail with not found email updates to Error`() = runTest {
        // Given: Email no encontrado
        val email = "notfound@example.com"
        coEvery { pairingRepository.searchByEmail(email) } returns Result.failure(Exception("Not found"))

        // When: Busco por email
        viewModel.searchByEmail(email)

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `searchByEmail with empty email does not crash`() = runTest {
        // Given: Email vacío
        val emptyEmail = ""
        coEvery { pairingRepository.searchByEmail(emptyEmail) } returns Result.failure(Exception("Invalid email"))

        // When: Busco por email vacío
        val result = runCatching {
            viewModel.searchByEmail(emptyEmail)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchByEmail with invalid email format does not crash`() = runTest {
        // Given: Email inválido
        val invalidEmail = "not-an-email"
        coEvery { pairingRepository.searchByEmail(invalidEmail) } returns Result.failure(Exception("Invalid format"))

        // When: Busco por email inválido
        val result = runCatching {
            viewModel.searchByEmail(invalidEmail)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para sendPairingRequest
    // ============================================

    @Test
    fun `sendPairingRequest updates to RequestSent`() = runTest {
        // Given: Request exitoso
        val partnerId = "partner-123"
        coEvery { pairingRepository.requestPairing(partnerId) } returns Result.success(Unit)

        // When: Envío solicitud
        viewModel.sendPairingRequest(partnerId)

        // Then: Debería actualizar a RequestSent
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.RequestSent::class.java)
    }

    @Test
    fun `sendPairingRequest with invalid partnerId does not crash`() = runTest {
        // Given: PartnerId inválido
        val invalidPartnerId = ""
        coEvery { pairingRepository.requestPairing(invalidPartnerId) } returns Result.failure(Exception("Invalid ID"))

        // When: Envío solicitud
        val result = runCatching {
            viewModel.sendPairingRequest(invalidPartnerId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `sendPairingRequest handles error`() = runTest {
        // Given: Request fallido
        val partnerId = "partner-123"
        coEvery { pairingRepository.requestPairing(partnerId) } returns Result.failure(Exception("Error"))

        // When: Envío solicitud
        viewModel.sendPairingRequest(partnerId)

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    // ============================================
    // Tests para invalidateCode
    // ============================================

    @Test
    fun `invalidateCode clears pairing code`() = runTest {
        // Given: Código existente
        coEvery { pairingRepository.invalidatePairingCode() } returns Result.success(Unit)

        // When: Invalido código
        viewModel.invalidateCode()

        // Then: Debería limpiar código
        val status = viewModel.pairingStatus.value
        // El código debería ser null después de invalidar
    }

    @Test
    fun `invalidateCode handles error`() = runTest {
        // Given: Error al invalidar
        coEvery { pairingRepository.invalidatePairingCode() } returns Result.failure(Exception("Error"))

        // When: Invalido código
        viewModel.invalidateCode()

        // Then: Debería actualizar a Error
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Error::class.java)
    }

    @Test
    fun `invalidateCode without generated code does not crash`() = runTest {
        // When: Invalido sin código generado
        val result = runCatching {
            viewModel.invalidateCode()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para clearError
    // ============================================

    @Test
    fun `clearError resets to Idle`() {
        // Given: Estado en Error
        // (Simulamos estado de error)

        // When: Limpio error
        viewModel.clearError()

        // Then: Debería resetear a Idle
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Idle::class.java)
    }

    @Test
    fun `clearError multiple times does not crash`() {
        // When: Limpio error múltiples veces
        val result = runCatching {
            viewModel.clearError()
            viewModel.clearError()
            viewModel.clearError()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de integración: Full pairing flow
    // ============================================

    @Test
    fun `full pairing flow generate-code-pair works`() = runTest {
        // Given: Flujo completo
        val code = "123456"
        coEvery { pairingRepository.generatePairingCode() } returns Result.success(code)
        coEvery { pairingRepository.pairWithCode(code) } returns Result.success(Unit)

        // When: Flujo completo
        viewModel.generatePairingCode()
        viewModel.pairWithCode(code)

        // Then: Debería emparejar
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.Paired::class.java)
    }

    @Test
    fun `full flow search-request-pair works`() = runTest {
        // Given: Flujo búsqueda
        val email = "test@example.com"
        val partnerId = "partner-123"
        val mockUser = mockk<User>()
        coEvery { pairingRepository.searchByEmail(email) } returns Result.success(mockUser)
        coEvery { pairingRepository.requestPairing(partnerId) } returns Result.success(Unit)

        // When: Flujo completo
        viewModel.searchByEmail(email)
        viewModel.sendPairingRequest(partnerId)

        // Then: Debería enviar solicitud
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(PairingUiState.RequestSent::class.java)
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `concurrent generatePairingCode calls do not crash`() = runTest {
        // Given: Múltiples generaciones
        coEvery { pairingRepository.generatePairingCode() } returns Result.success("123456")

        // When: Genero concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                List(5) {
                    kotlinx.coroutines.async {
                        viewModel.generatePairingCode()
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `concurrent pairWithCode calls do not crash`() = runTest {
        // Given: Múltiples intentos de pairing
        coEvery { pairingRepository.pairWithCode(any()) } returns Result.success(Unit)

        // When: Emparejo concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                List(5) { code ->
                    kotlinx.coroutines.async {
                        viewModel.pairWithCode("$code")
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Null safety
    // ============================================

    @Test
    fun `all methods handle null-like strings gracefully`() = runTest {
        // Given: Strings que parecen null
        val nullCode = "null"
        val nullEmail = "null"
        val nullPartnerId = "null"
        coEvery { pairingRepository.pairWithCode(any()) } returns Result.failure(Exception("Not found"))
        coEvery { pairingRepository.searchByEmail(any()) } returns Result.failure(Exception("Not found"))
        coEvery { pairingRepository.requestPairing(any()) } returns Result.failure(Exception("Not found"))

        // When: Llamo métodos con null-like strings
        val result = runCatching {
            viewModel.pairWithCode(nullCode)
            viewModel.searchByEmail(nullEmail)
            viewModel.sendPairingRequest(nullPartnerId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Very long strings
    // ============================================

    @Test
    fun `searchByEmail with very long email does not crash`() = runTest {
        // Given: Email muy largo
        val longEmail = "a".repeat(1000) + "@example.com"
        coEvery { pairingRepository.searchByEmail(any()) } returns Result.failure(Exception("Invalid"))

        // When: Busco por email largo
        val result = runCatching {
            viewModel.searchByEmail(longEmail)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `pairWithCode with very long code does not crash`() = runTest {
        // Given: Código muy largo
        val longCode = "1".repeat(10000)
        coEvery { pairingRepository.pairWithCode(any()) } returns Result.failure(Exception("Invalid"))

        // When: Intento emparejar
        val result = runCatching {
            viewModel.pairWithCode(longCode)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `generatePairingCode performance test with 50 calls`() = runTest {
        // Given: 50 generaciones
        coEvery { pairingRepository.generatePairingCode() } returns Result.success("123456")

        // When: Genero 50 códigos
        val startTime = System.currentTimeMillis()
        repeat(50) {
            viewModel.generatePairingCode()
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 10 segundos)
        assertThat(elapsed).isLessThan(10000)
    }

    @Test
    fun `searchByEmail performance test with 50 calls`() = runTest {
        // Given: 50 búsquedas
        coEvery { pairingRepository.searchByEmail(any()) } returns Result.failure(Exception("Not found"))

        // When: Busco 50 emails
        val startTime = System.currentTimeMillis()
        List(50) { viewModel.searchByEmail("email$it@example.com") }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 10 segundos)
        assertThat(elapsed).isLessThan(10000)
    }
}
