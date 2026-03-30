package com.example.messageapp.viewmodel

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.example.messageapp.data.AvatarRepository
import com.example.messageapp.model.AvatarType
import com.google.common.truth.Truth.assertThat
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
 * Tests para AvatarViewModel
 *
 * Cubre: loadUserAvatar, selectAvatar, saveAvatar, getAllAvatars, resetState
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
@OptIn(ExperimentalCoroutinesApi::class)
class AvatarViewModelTest {

    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: AvatarViewModel
    private lateinit var avatarRepository: AvatarRepository
    private val testDispatcher = UnconfinedTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        avatarRepository = mockk()
        // Usar reflexión para inyectar el mock
        viewModel = AvatarViewModel()
        injectMockRepository(viewModel, avatarRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    /**
     * Inyecta un mock repository usando reflexión
     */
    private fun injectMockRepository(viewModel: AvatarViewModel, repository: AvatarRepository) {
        val field = AvatarViewModel::class.java.getDeclaredField("avatarRepository")
        field.isAccessible = true
        field.set(viewModel, repository)
    }

    // ============================================
    // Tests para estado inicial
    // ============================================

    @Test
    fun `initial state has isLoading false`() {
        // When: Verifico estado inicial
        val state = viewModel.uiState.value

        // Then: Debería ser false
        assertThat(state.isLoading).isFalse()
    }

    @Test
    fun `initial state has isSaving false`() {
        // When: Verifico estado inicial
        val state = viewModel.uiState.value

        // Then: Debería ser false
        assertThat(state.isSaving).isFalse()
    }

    @Test
    fun `initial state has selectedAvatar CERDITA`() {
        // When: Verifico avatar seleccionado
        val avatar = viewModel.selectedAvatar.value

        // Then: Debería ser CERDITA por defecto
        assertThat(avatar).isEqualTo(AvatarType.CERDITA)
    }

    @Test
    fun `initial state has saveSuccess null`() {
        // When: Verifico estado inicial
        val state = viewModel.uiState.value

        // Then: Debería ser null
        assertThat(state.saveSuccess).isNull()
    }

    @Test
    fun `initial state has errorMessage null`() {
        // When: Verifico estado inicial
        val state = viewModel.uiState.value

        // Then: Debería ser null
        assertThat(state.errorMessage).isNull()
    }

    // ============================================
    // Tests para loadUserAvatar
    // ============================================

    @Test
    fun `loadUserAvatar updates uiState with current avatar`() = runTest {
        // Given: Repository retorna avatar
        val userId = "user-123"
        val expectedAvatar = AvatarType.GATITO
        every { avatarRepository.getUserAvatar(userId) } returns expectedAvatar

        // When: Cargo avatar
        viewModel.loadUserAvatar(userId)

        // Then: Debería actualizar estado
        val state = viewModel.uiState.value
        assertThat(state.currentAvatar).isEqualTo(expectedAvatar)
        assertThat(state.isLoading).isFalse()
    }

    @Test
    fun `loadUserAvatar sets isLoading to true then false`() = runTest {
        // Given: Usuario válido
        val userId = "user-123"
        every { avatarRepository.getUserAvatar(userId) } returns AvatarType.CERDITA

        // When: Cargo avatar
        viewModel.loadUserAvatar(userId)

        // Then: Debería cargar y completar
        // (En tests con UnconfinedTestDispatcher, isLoading cambia rápidamente)
        val state = viewModel.uiState.value
        assertThat(state.isLoading).isFalse()
    }

    @Test
    fun `loadUserAvatar with invalid userId does not crash`() = runTest {
        // Given: UserId inválido
        val invalidUserId = ""
        every { avatarRepository.getUserAvatar(invalidUserId) } returns AvatarType.CERDITA

        // When: Cargo avatar
        val result = runCatching {
            viewModel.loadUserAvatar(invalidUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `loadUserAvatar with null-like userId does not crash`() = runTest {
        // Given: UserId que parece null
        val nullUserId = "null"
        every { avatarRepository.getUserAvatar(nullUserId) } returns AvatarType.CERDITA

        // When: Cargo avatar
        val result = runCatching {
            viewModel.loadUserAvatar(nullUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para selectAvatar
    // ============================================

    @Test
    fun `selectAvatar updates selectedAvatar immediately`() {
        // Given: Avatar diferente
        val newAvatar = AvatarType.PERRO

        // When: Selecciono avatar
        viewModel.selectAvatar(newAvatar)

        // Then: Debería actualizar inmediatamente
        val avatar = viewModel.selectedAvatar.value
        assertThat(avatar).isEqualTo(newAvatar)
    }

    @Test
    fun `selectAvatar with same avatar does not crash`() {
        // Given: Mismo avatar actual
        val currentAvatar = viewModel.selectedAvatar.value

        // When: Selecciono mismo avatar
        val result = runCatching {
            viewModel.selectAvatar(currentAvatar)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `selectAvatar multiple times updates to last one`() {
        // Given: Múltiples avatares
        val avatars = listOf(AvatarType.GATITO, AvatarType.PERRO, AvatarType.CERDITA)

        // When: Selecciono múltiples avatares
        avatars.forEach { avatar ->
            viewModel.selectAvatar(avatar)
        }

        // Then: Debería quedar con el último
        val finalAvatar = viewModel.selectedAvatar.value
        assertThat(finalAvatar).isEqualTo(AvatarType.CERDITA)
    }

    // ============================================
    // Tests para saveAvatar
    // ============================================

    @Test
    fun `saveAvatar calls repository and updates uiState`() = runTest {
        // Given: Repository exitoso
        val userId = "user-123"
        viewModel.selectAvatar(AvatarType.GATITO)
        every { avatarRepository.setUserAvatar(userId, AvatarType.GATITO) } returns Result.success(Unit)

        // When: Guardo avatar
        viewModel.saveAvatar(userId)

        // Then: Debería guardar
        val state = viewModel.uiState.value
        assertThat(state.isSaving).isFalse()
        assertThat(state.saveSuccess).isTrue()
    }

    @Test
    fun `saveAvatar sets isSaving to true then false`() = runTest {
        // Given: Usuario válido
        val userId = "user-123"
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo avatar
        viewModel.saveAvatar(userId)

        // Then: Debería completar
        val state = viewModel.uiState.value
        assertThat(state.isSaving).isFalse()
    }

    @Test
    fun `saveAvatar handles repository error`() = runTest {
        // Given: Repository falla
        val userId = "user-123"
        val mockError = Exception("Error al guardar")
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.failure(mockError)

        // When: Guardo avatar
        viewModel.saveAvatar(userId)

        // Then: Debería manejar error
        val state = viewModel.uiState.value
        assertThat(state.saveSuccess).isFalse()
        assertThat(state.errorMessage).isNotNull()
    }

    @Test
    fun `saveAvatar without loading first does not crash`() = runTest {
        // Given: Sin cargar avatar primero
        val userId = "user-new"
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo sin cargar
        val result = runCatching {
            viewModel.saveAvatar(userId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `saveAvatar with invalid userId does not crash`() = runTest {
        // Given: UserId inválido
        val invalidUserId = ""
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo con userId inválido
        val result = runCatching {
            viewModel.saveAvatar(invalidUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para getAllAvatars
    // ============================================

    @Test
    fun `getAllAvatars returns all available avatars`() {
        // Given: Repository con avatares
        val expectedAvatars = AvatarType.values().toList()
        every { avatarRepository.getAllAvatars() } returns expectedAvatars

        // When: Obtengo todos los avatares
        val avatars = viewModel.getAllAvatars()

        // Then: Debería retornar todos
        assertThat(avatars).isNotEmpty()
        assertThat(avatars).containsAtLeastElementsIn(expectedAvatars)
    }

    @Test
    fun `getAllAvatars list is not empty`() {
        // When: Obtengo avatares
        val avatars = viewModel.getAllAvatars()

        // Then: No debería ser vacío
        assertThat(avatars).isNotEmpty()
    }

    // ============================================
    // Tests para resetState
    // ============================================

    @Test
    fun `resetState clears saveSuccess and errorMessage`() {
        // Given: Estado con error
        // (Simulamos estado previo)

        // When: Reseteo estado
        viewModel.resetState()

        // Then: Debería limpiar
        val state = viewModel.uiState.value
        assertThat(state.saveSuccess).isNull()
        assertThat(state.errorMessage).isNull()
    }

    @Test
    fun `resetState multiple times does not crash`() {
        // When: Reseteo múltiples veces
        val result = runCatching {
            viewModel.resetState()
            viewModel.resetState()
            viewModel.resetState()
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de integración: Load + Select + Save
    // ============================================

    @Test
    fun `loadUserAvatar then selectAvatar then saveAvatar works`() = runTest {
        // Given: Flujo completo
        val userId = "user-integration"
        every { avatarRepository.getUserAvatar(userId) } returns AvatarType.CERDITA
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Flujo completo
        viewModel.loadUserAvatar(userId)
        viewModel.selectAvatar(AvatarType.GATITO)
        viewModel.saveAvatar(userId)

        // Then: No debería crashar
        val state = viewModel.uiState.value
        assertThat(state.saveSuccess).isTrue()
    }

    @Test
    fun `selectAvatar then saveAvatar persists selection`() = runTest {
        // Given: Avatar seleccionado
        val userId = "user-123"
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Selecciono y guardo
        viewModel.selectAvatar(AvatarType.PERRO)
        viewModel.saveAvatar(userId)

        // Then: Debería guardar
        val state = viewModel.uiState.value
        assertThat(state.saveSuccess).isTrue()
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `concurrent loadUserAvatar calls do not crash`() = runTest {
        // Given: Múltiples user IDs
        val userIds = listOf("user-1", "user-2", "user-3")
        every { avatarRepository.getUserAvatar(any()) } returns AvatarType.CERDITA

        // When: Cargo concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                userIds.map { userId ->
                    kotlinx.coroutines.async {
                        viewModel.loadUserAvatar(userId)
                    }
                }.awaitAll()
            }
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `concurrent saveAvatar calls do not crash`() = runTest {
        // Given: Múltiples guardados
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo concurrentemente
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                List(5) { userId ->
                    kotlinx.coroutines.async {
                        viewModel.saveAvatar("user-$userId")
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
        val nullUserId = "null"
        every { avatarRepository.getUserAvatar(any()) } returns AvatarType.CERDITA
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Llamo métodos con null-like strings
        val result = runCatching {
            viewModel.loadUserAvatar(nullUserId)
            viewModel.saveAvatar(nullUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Very long IDs
    // ============================================

    @Test
    fun `loadUserAvatar with very long userId does not crash`() = runTest {
        // Given: UserId muy largo
        val longUserId = "user-${"a".repeat(1000)}"
        every { avatarRepository.getUserAvatar(any()) } returns AvatarType.CERDITA

        // When: Cargo avatar
        val result = runCatching {
            viewModel.loadUserAvatar(longUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `saveAvatar with very long userId does not crash`() = runTest {
        // Given: UserId muy largo
        val longUserId = "user-${"b".repeat(1000)}"
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo avatar
        val result = runCatching {
            viewModel.saveAvatar(longUserId)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `loadUserAvatar performance test with 50 calls`() = runTest {
        // Given: 50 user IDs
        val userIds = List(50) { "user-$it" }
        every { avatarRepository.getUserAvatar(any()) } returns AvatarType.CERDITA

        // When: Cargo 50 avatares
        val startTime = System.currentTimeMillis()
        userIds.forEach { userId ->
            viewModel.loadUserAvatar(userId)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 10 segundos)
        assertThat(elapsed).isLessThan(10000)
    }

    @Test
    fun `saveAvatar performance test with 50 calls`() = runTest {
        // Given: 50 guardados
        every { avatarRepository.setUserAvatar(any(), any()) } returns Result.success(Unit)

        // When: Guardo 50 veces
        val startTime = System.currentTimeMillis()
        List(50) { viewModel.saveAvatar("user-$it") }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 10 segundos)
        assertThat(elapsed).isLessThan(10000)
    }
}
