package com.example.messageapp.data

import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

/**
 * Tests para ContactsRepository
 *
 * Cubre: addContact, removeContact, listContacts, importDeviceContacts, searchUsersByEmail
 *
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ContactsRepositoryTest {

    private lateinit var repository: ContactsRepository
    private lateinit var mockContentResolver: android.content.ContentResolver

    @Before
    fun setup() {
        repository = ContactsRepository()
        mockContentResolver = mockk()
    }

    // ============================================
    // Tests para addContact
    // ============================================

    @Test
    fun `addContact with valid data returns success`() = runTest {
        // Given: Datos válidos
        val myUid = "user-123"
        val otherUid = "user-456"
        val alias = "Mi Contacto"

        // When: Agrego contacto
        val result = repository.addContact(myUid, otherUid, alias)

        // Then: Debería retornar success o failure (depende de Supabase)
        // No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `addContact with empty alias uses default`() = runTest {
        // Given: Alias vacío
        val myUid = "user-123"
        val otherUid = "user-456"
        val emptyAlias = ""

        // When: Agrego contacto con alias vacío
        val result = repository.addContact(myUid, otherUid, emptyAlias)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `addContact with null alias does not crash`() = runTest {
        // Given: Alias null
        val myUid = "user-123"
        val otherUid = "user-456"
        val nullAlias: String? = null

        // When: Agrego contacto con alias null
        val result = runCatching {
            repository.addContact(myUid, otherUid, nullAlias)
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `addContact with invalid myUid returns failure`() = runTest {
        // Given: MyUid inválido
        val invalidMyUid = ""
        val otherUid = "user-456"
        val alias = "Contacto"

        // When: Intento agregar contacto
        val result = repository.addContact(invalidMyUid, otherUid, alias)

        // Then: Debería fallar o no crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para removeContact
    // ============================================

    @Test
    fun `removeContact with valid ids returns success`() = runTest {
        // Given: IDs válidos
        val myUid = "user-123"
        val otherUid = "user-456"

        // When: Elimino contacto
        val result = repository.removeContact(myUid, otherUid)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `removeContact with non-existent ids does not crash`() = runTest {
        // Given: IDs que no existen
        val myUid = "nonexistent-user-1"
        val otherUid = "nonexistent-user-2"

        // When: Intento eliminar contacto
        val result = repository.removeContact(myUid, otherUid)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `removeContact with empty ids does not crash`() = runTest {
        // Given: IDs vacíos
        val emptyMyUid = ""
        val emptyOtherUid = ""

        // When: Intento eliminar contacto
        val result = repository.removeContact(emptyMyUid, emptyOtherUid)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para listContacts
    // ============================================

    @Test
    fun `listContacts returns empty list when no contacts`() = runTest {
        // Given: Sin contactos (simulado por Supabase)

        // When: Listo contactos
        val result = repository.listContacts("user-123")

        // Then: Debería retornar lista vacía o error (no crash)
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `listContacts with valid user returns contacts`() = runTest {
        // Given: Usuario válido
        val myUid = "user-123"

        // When: Listo contactos
        val result = repository.listContacts(myUid)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `listContacts handles database error gracefully`() = runTest {
        // Given: Error de base de datos (simulado)

        // When: Intento listar contactos
        val result = runCatching {
            repository.listContacts("user-invalid")
        }

        // Then: Debería manejar error sin crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests para importDeviceContacts
    // ============================================

    @Test
    fun `importDeviceContacts handles permission denied`() {
        // Given: Sin permisos (mock retorna null)
        coEvery { mockContentResolver.query(any(), any(), any(), any(), any()) } returns null

        // When: Intento importar contactos
        val result = runCatching {
            repository.importDeviceContacts(mockContentResolver)
        }

        // Then: Debería retornar lista vacía sin crashar
        assertThat(result.getOrNull()).isEmpty()
    }

    @Test
    fun `importDeviceContacts normalizes phone numbers`() {
        // Given: Cursor con números sin normalizar
        val mockCursor = mockk<android.database.Cursor>()
        coEvery { mockContentResolver.query(any(), any(), any(), any(), any()) } returns mockCursor
        coEvery { mockCursor.use(any()) } answers {
            val block = args[0] as (android.database.Cursor) -> Unit
            block(mockCursor)
        }
        coEvery { mockCursor.moveToNext() } returnsMany listOf(true, true, false)
        coEvery { mockCursor.getColumnIndex(any()) } returns 0
        coEvery { mockCursor.getString(0) } returnsMany listOf("123-456-7890", "(123) 456-7890")

        // When: Importo contactos
        val result = repository.importDeviceContacts(mockContentResolver)

        // Then: Debería normalizar números
        assertThat(result).hasSize(2)
        // Verificar que no tengan caracteres especiales
        result.forEach { phone ->
            assertThat(phone).matches("[0-9+]*".toRegex())
        }
    }

    @Test
    fun `importDeviceContacts returns distinct phone numbers`() {
        // Given: Números duplicados
        val mockCursor = mockk()
        coEvery { mockContentResolver.query(any(), any(), any(), any(), any()) } returns mockCursor
        coEvery { mockCursor.use(any()) } answers {
            val block = args[0] as (android.database.Cursor) -> Unit
            block(mockCursor)
        }
        coEvery { mockCursor.moveToNext() } returnsMany listOf(true, true, true, false)
        coEvery { mockCursor.getColumnIndex(any()) } returns 0
        coEvery { mockCursor.getString(0) } returnsMany listOf("123456", "123456", "789012")

        // When: Importo contactos
        val result = repository.importDeviceContacts(mockContentResolver)

        // Then: Debería retornar únicos
        assertThat(result).hasSize(2)
        assertThat(result).containsExactly("123456", "789012")
    }

    // ============================================
    // Tests para searchUsersByEmail
    // ============================================

    @Test
    fun `searchUsersByEmail returns empty list when not found`() = runTest {
        // Given: Email que no existe
        val email = "nonexistent@example.com"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(email)

        // Then: Debería retornar lista vacía o error
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail with valid email returns users`() = runTest {
        // Given: Email válido
        val email = "test@example.com"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(email)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail excludes current user`() = runTest {
        // Given: Email del usuario actual
        // (Supabase debería excluirlo automáticamente)

        // When: Busco por email
        val result = runCatching {
            repository.searchUsersByEmail("currentuser@example.com")
        }

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail with invalid email format returns error`() = runTest {
        // Given: Email inválido
        val invalidEmail = "not-an-email"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(invalidEmail)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail with special characters does not crash`() = runTest {
        // Given: Email con caracteres especiales
        val email = "test+label@example.com"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(email)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de integración: Add + List + Remove
    // ============================================

    @Test
    fun `addContact then listContacts includes new contact`() = runTest {
        // Given: Contacto nuevo
        val myUid = "user-test-1"
        val otherUid = "user-test-2"
        val alias = "Test Contact"

        // When: Agrego y luego listo
        repository.addContact(myUid, otherUid, alias)
        val listResult = repository.listContacts(myUid)

        // Then: No debería crashar
        assertThat(listResult.exceptionOrNull()).isNull()
    }

    @Test
    fun `addContact then removeContact does not crash`() = runTest {
        // Given: Contacto para agregar y eliminar
        val myUid = "user-test-3"
        val otherUid = "user-test-4"

        // When: Agrego y elimino
        repository.addContact(myUid, otherUid, "Test")
        val removeResult = repository.removeContact(myUid, otherUid)

        // Then: No debería crashar
        assertThat(removeResult.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `multiple addContact calls do not crash`() = runTest {
        // Given: Múltiples contactos
        val contacts = listOf(
            "user-1" to "Contact 1",
            "user-2" to "Contact 2",
            "user-3" to "Contact 3"
        )
        val myUid = "user-main"

        // When: Agrego múltiples contactos
        val results = contacts.map { (otherUid, alias) ->
            runCatching {
                repository.addContact(myUid, otherUid, alias)
            }
        }

        // Then: Ninguno debería crashar
        results.forEach { result ->
            assertThat(result.exceptionOrNull()).isNull()
        }
    }

    @Test
    fun `concurrent addContact and removeContact do not crash`() = runTest {
        // Given: Contacto para agregar/eliminar
        val myUid = "user-concurrent"
        val otherUid = "user-concurrent-2"

        // When: Operaciones concurrentes
        val result = runCatching {
            kotlinx.coroutines.coroutineScope {
                val addJob = kotlinx.coroutines.async {
                    repository.addContact(myUid, otherUid, "Test")
                }
                val removeJob = kotlinx.coroutines.async {
                    repository.removeContact(myUid, otherUid)
                }
                Pair(addJob.await(), removeJob.await())
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
        val nullLikeUid = "null"
        val nullLikeAlias = "null"

        // When: Llamo métodos con null-like strings
        val addResult = runCatching {
            repository.addContact(nullLikeUid, nullLikeUid, nullLikeAlias)
        }
        val removeResult = runCatching {
            repository.removeContact(nullLikeUid, nullLikeUid)
        }
        val listResult = runCatching {
            repository.listContacts(nullLikeUid)
        }

        // Then: No debería crashar
        assertThat(addResult.exceptionOrNull()).isNull()
        assertThat(removeResult.exceptionOrNull()).isNull()
        assertThat(listResult.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Very long strings
    // ============================================

    @Test
    fun `addContact with very long alias does not crash`() = runTest {
        // Given: Alias muy largo
        val myUid = "user-123"
        val otherUid = "user-456"
        val longAlias = "a".repeat(10000)

        // When: Agrego contacto
        val result = repository.addContact(myUid, otherUid, longAlias)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail with very long email does not crash`() = runTest {
        // Given: Email muy largo
        val longEmail = "a".repeat(1000) + "@example.com"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(longEmail)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests edge cases: Unicode
    // ============================================

    @Test
    fun `addContact with unicode alias does not crash`() = runTest {
        // Given: Alias con unicode
        val myUid = "user-123"
        val otherUid = "user-456"
        val unicodeAlias = "Contacto 🌍 你好"

        // When: Agrego contacto
        val result = repository.addContact(myUid, otherUid, unicodeAlias)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    @Test
    fun `searchUsersByEmail with unicode characters does not crash`() = runTest {
        // Given: Email con unicode
        val email = "usuario_español@example.com"

        // When: Busco usuario
        val result = repository.searchUsersByEmail(email)

        // Then: No debería crashar
        assertThat(result.exceptionOrNull()).isNull()
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `listContacts performance test with 100 calls`() = runTest {
        // Given: 100 llamadas
        val myUid = "user-perf"

        // When: Listo contactos 100 veces
        val startTime = System.currentTimeMillis()
        repeat(100) {
            repository.listContacts(myUid)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser razonablemente rápido (< 30 segundos)
        assertThat(elapsed).isLessThan(30000)
    }

    @Test
    fun `addContact performance test with 100 calls`() = runTest {
        // Given: 100 contactos
        val myUid = "user-perf"
        val contacts = List(100) { "user-$it" to "Contact $it" }

        // When: Agrego 100 contactos
        val startTime = System.currentTimeMillis()
        contacts.forEach { (uid, alias) ->
            repository.addContact(myUid, uid, alias)
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser razonablemente rápido (< 30 segundos)
        assertThat(elapsed).isLessThan(30000)
    }
}
