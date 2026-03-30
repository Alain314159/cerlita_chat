# Reporte de Errores - Message App
## Análisis Exhaustivo con Skills - 2026-03-28

---

## 🔴 ERRORES CRÍTICOS (Bloqueantes)

### 1. [StorageRepository.kt:88-96] - Implementación Incorrecta de readUriBytes

**Descripción:** La función `readUriBytes` tiene una implementación completamente incorrecta que no lee el URI real.

**Código problemático:**
```kotlin
private suspend fun readUriBytes(uri: Uri): ByteArray = withContext(Dispatchers.IO) {
    // Leer URI desde el dispositivo
    val inputStream = SupabaseConfig.client.httpClient.httpClient.engine.config.httpClient
        ?.let {
            // Usar contexto de Android para leer URI
            android.content.ContentResolver::class.java
        }

    // Fallback: leer directamente
    uri.toString().toByteArray()
}
```

**Problemas:**
1. `inputStream` nunca se usa - código muerto
2. `ContentResolver::class.java` solo obtiene la clase, no resuelve el URI
3. `uri.toString().toByteArray()` convierte la STRING del URI, no el contenido del archivo
4. No hay manejo de excepciones
5. No cierra recursos

**Impacto:** 
- **CRÍTICO**: Enviar multimedia NO FUNCIONA
- Los usuarios no pueden enviar imágenes, videos o audios
- La función retorna bytes de la representación string del URI, no del archivo real

**Solución correcta:**
```kotlin
private suspend fun readUriBytes(uri: Uri, context: Context): ByteArray = withContext(Dispatchers.IO) {
    try {
        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            inputStream.readBytes()
        } ?: throw IOException("No se pudo leer el URI: $uri")
    } catch (e: IOException) {
        Log.e(TAG, "StorageRepository: Error al leer URI", e)
        throw e
    }
}
```

**Prevención:**
- Tests de integración para envío de multimedia
- Verificar que los repositorios reciban Context cuando necesiten acceder a recursos
- Code review enfocado en acceso a recursos externos

---

### 2. [StorageRepository.kt:14-70] - Falta Context para leer URI

**Descripción:** `StorageRepository` no tiene acceso a `Context` pero lo necesita para leer URIs.

**Código problemático:**
```kotlin
class StorageRepository {
    private val db = SupabaseConfig.client.plugin(Postgrest)
    private val storage = SupabaseConfig.client.plugin(Storage)
    
    suspend fun sendMedia(
        chatId: String,
        myUid: String,
        uri: Uri,
        // ...
    )
```

**Problema:** La función `sendMedia` recibe un `Uri` pero no tiene `Context` para leerlo.

**Impacto:** Imposible implementar correctamente `readUriBytes` sin Context.

**Solución:**
```kotlin
class StorageRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val db = SupabaseConfig.client.plugin(Postgrest)
    private val storage = SupabaseConfig.client.plugin(Storage)
    
    suspend fun sendMedia(
        chatId: String,
        myUid: String,
        uri: Uri,
        // ...
    )
```

**Prevención:**
- Inyección de dependencias correcta desde el inicio
- Documentar dependencias de Android en especificaciones técnicas

---

### 3. [ChatScreen.kt:58-62] - Referencia a StorageAcl Eliminado

**Descripción:** El código comenta que StorageAcl fue migrado pero no hay implementación de reemplazo.

**Código problemático:**
```kotlin
LaunchedEffect(chatId) {
    vm.start(chatId, myUid)
    if (myUid.isNotBlank()) {
        vm.markAsRead(chatId, myUid)
        // StorageAcl migrado a Supabase Storage - pendiente de implementación
    }
}
```

**Problema:** 
- StorageAcl existe pero está incompleto (solo tiene logs)
- No hay migración real implementada
- Funcionalidad de ACL para storage está rota

**Impacto:**
- Los controles de acceso a multimedia no funcionan
- Posible fuga de datos si los buckets son públicos

**Solución:**
```kotlin
// Opción 1: Implementar StorageAcl correctamente
// Opción 2: Usar Row Level Security (RLS) de Supabase
// Opción 3: Eliminar feature si no es crítica para MVP
```

**Prevención:**
- No comentar features críticas sin tener reemplazo listo
- Usar feature flags para funcionalidades incompletas

---

## 🟡 WARNINGS (Mejores Prácticas)

### 4. [AuthRepository.kt:80-87] - Tag Inconsistente en getCurrentUser

**Descripción:** Usa `android.util.Log.w` con tag hardcodeado en lugar del TAG constante.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("AuthRepository", "Error getting user", e)
    null
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "AuthRepository: Error getting user", e)
    null
}
```

**Impacto:** Logging inconsistente dificulta filtrado en Logcat.

---

### 5. [AuthRepository.kt:326-332] - Tag Inconsistente en signOut

**Descripción:** Mismo problema que #4.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("AuthRepository", "Sign out error", e)
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "AuthRepository: Sign out error", e)
}
```

---

### 6. [AuthRepository.kt:342-349] - Tag Inconsistente en sendPasswordReset

**Descripción:** Mismo problema que #4.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("AuthRepository", "Password reset error", e)
    Result.failure(e)
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "AuthRepository: Password reset error", e)
    Result.failure(e)
}
```

---

### 7. [AuthRepository.kt:355-400] - Múltiples Tags Inconsistentes en signInWithGoogle

**Descripción:** Mismo problema que #4, repetido 4 veces en una función.

**Código problemático:**
```kotlin
android.util.Log.w("AuthRepository", "Credencial de Google no válida")
android.util.Log.w("AuthRepository", "Error de Credential Manager: ${e.message}", e)
android.util.Log.w("AuthRepository", "Error de Google Sign In", e)
android.util.Log.d("AuthRepository", "Google login exitoso: $uid")
```

**Solución:**
```kotlin
Log.w(TAG, "AuthRepository: Google credential inválida")
Log.e(TAG, "AuthRepository: Credential Manager error: ${e.message}", e)
Log.e(TAG, "AuthRepository: Google Sign In error", e)
Log.d(TAG, "AuthRepository: Google login exitoso: $uid")
```

---

### 8. [ChatRepository.kt:212-219] - Logging Inconsistente en observeMessages

**Descripción:** Usa tag hardcodeado en decode de mensaje.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("ChatRepository", "Error decoding message", e)
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "ChatRepository: Error decoding message", e)
}
```

---

### 9. [ChatRepository.kt:234-241] - Logging Inconsistente en loadMessages

**Descripción:** Mismo problema que #8.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("ChatRepository", "Load messages error", e)
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "ChatRepository: Load messages error", e)
}
```

---

### 10. [ChatRepository.kt:278-285] - Logging Inconsistente en sendText

**Descripción:** Mismo problema que #8.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("ChatRepository", "Send message error", e)
    throw e
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "ChatRepository: Send message error", e)
    throw e
}
```

---

### 11. [ChatRepository.kt:405-412] - Logging Inconsistente en countUnreadMessages

**Descripción:** Aunque propaga el error (correcto), usa tag hardcodeado.

**Código problemático:**
```kotlin
} catch (e: Exception) {
    android.util.Log.w("ChatRepository", "countUnreadMessages failed: chatId=$chatId uid=$uid", e)
    throw e  // Propagar error para que el caller sepa que falló
}
```

**Solución:**
```kotlin
} catch (e: Exception) {
    Log.w(TAG, "ChatRepository: countUnreadMessages failed: chatId=$chatId uid=$uid", e)
    throw e
}
```

---

## 🟢 SUGERENCIAS (Refactoring)

### 12. [StorageRepository.kt] - Falta Inyección de Dependencias

**Descripción:** `StorageRepository` crea instancias de `StorageRepository` directamente en lugar de usar inyección.

**Código actual:**
```kotlin
val storage = remember { StorageRepository() }
```

**Mejor práctica:**
```kotlin
val storage: StorageRepository = inject() // Koin
// o
val storage: StorageRepository = hiltViewModel() // Hilt
```

**Beneficio:**
- Más fácil de testear
- Mejor separación de responsabilidades
- Permite mockear en tests

---

### 13. [ChatScreen.kt:40-45] - Múltiples Repositorios Instanciados Directamente

**Descripción:** ChatScreen crea instancias de repositorios en lugar de recibirlos inyectados.

**Código problemático:**
```kotlin
val storage = remember { StorageRepository() }
val repo = remember { ChatRepository() }
```

**Problema:**
- Dificulta testing
- Viola principio de inyección de dependencias
- Crea acoplamiento fuerte

**Solución:**
```kotlin
@Composable
fun ChatScreen(
    chatId: String,
    vm: ChatViewModel,
    storage: StorageRepository = inject(),
    repo: ChatRepository = inject(),
    onBack: () -> Unit = {},
    onOpenInfo: (String) -> Unit = {}
)
```

---

### 14. [E2ECipher.kt:176-189] - deleteAllKeys Podría Dejar Claves Huérfanas

**Descripción:** La función enumera aliases pero podría fallar a mitad del proceso.

**Código:**
```kotlin
fun deleteAllKeys() {
    try {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        try {
            keyStore.load(null)
        } catch (e: Exception) {
            Log.e(TAG, "E2ECipher: Error al cargar KeyStore - intentando recovery", e)
            return
        }

        val aliases = keyStore.aliases()
        while (aliases.hasMoreElements()) {
            val alias = aliases.nextElement()
            if (alias.startsWith(MASTER_KEY_ALIAS)) {
                keyStore.deleteEntry(alias)
                Log.d(TAG, "E2ECipher: Clave eliminada: $alias")
            }
        }
```

**Problema:** Si falla a mitad, algunas claves se eliminan y otras no.

**Mejora sugerida:**
```kotlin
fun deleteAllKeys() {
    try {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        try {
            keyStore.load(null)
        } catch (e: Exception) {
            Log.e(TAG, "E2ECipher: Error al cargar KeyStore", e)
            throw e
        }

        val aliasesToDelete = mutableListOf<String>()
        
        // Primero recolectar todos los aliases
        keyStore.aliases().toList().forEach { alias ->
            if (alias.startsWith(MASTER_KEY_ALIAS)) {
                aliasesToDelete.add(alias)
            }
        }

        // Luego eliminar (transaccional)
        var deletedCount = 0
        aliasesToDelete.forEach { alias ->
            try {
                keyStore.deleteEntry(alias)
                Log.d(TAG, "E2ECipher: Clave eliminada: $alias")
                deletedCount++
            } catch (e: Exception) {
                Log.e(TAG, "E2ECipher: Error al eliminar clave: $alias", e)
            }
        }

        Log.d(TAG, "E2ECipher: Claves eliminadas: $deletedCount/${aliasesToDelete.size}")
    } catch (e: Exception) {
        Log.e(TAG, "E2ECipher: Error al eliminar claves", e)
        throw e
    }
}
```

---

### 15. [Crypto.kt:13-21] - Función decrypt con Nombre Confuso

**Descripción:** La función `decrypt` en realidad solo hace decode Base64, no descifrado real.

**Código:**
```kotlin
fun decrypt(enc: String?): String {
    if (enc.isNullOrBlank()) return ""

    val s = enc.trim()

    if (s.startsWith("gcm:", ignoreCase = true)) {
        return "[Criptografia Antiga]"
    }

    return try {
        String(Base64.decode(s, Base64.NO_WRAP))
    } catch (e: Throwable) {
        Log.w(TAG, "Crypto: Falló decodificación Base64, retornando original", e)
        s
    }
}
```

**Problema:**
- El nombre `decrypt` sugiere cifrado, pero solo hace Base64 decode
- Podría confundir a desarrolladores

**Mejora:**
```kotlin
/**
 * Decodifica string Base64 a texto plano
 * NO es cifrado real, solo encoding
 */
fun decodeBase64(enc: String?): String {
    // ...
}
```

---

## 📊 RESUMEN DE ERRORES

| Prioridad | Cantidad | Archivos Afectados |
|-----------|----------|-------------------|
| 🔴 Crítico | 3 | StorageRepository.kt, ChatScreen.kt |
| 🟡 Warning | 8 | AuthRepository.kt, ChatRepository.kt |
| 🟢 Sugerencia | 4 | StorageRepository.kt, ChatScreen.kt, E2ECipher.kt, Crypto.kt |
| **TOTAL** | **15** | **6 archivos** |

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### Fase 1: Crítico (Inmediato - 2 horas)

1. **Fix #1, #2: StorageRepository.readUriBytes**
   - Agregar parámetro `context: Context` al constructor
   - Implementar correctamente `readUriBytes` usando `ContentResolver`
   - Agregar tests de integración

2. **Fix #3: StorageAcl migration**
   - Decidir: ¿Implementar StorageAcl o usar RLS de Supabase?
   - Si es RLS: Crear políticas en database_schema.sql
   - Si es StorageAcl: Implementar con Supabase Storage

### Fase 2: Logging Consistente (1 hora)

3. **Fix #4-11: Tags inconsistentes**
   - Reemplazar todos los `android.util.Log.w("AuthRepository", ...)` por `Log.w(TAG, ...)`
   - Verificar que TODOS los archivos tengan `private const val TAG = "MessageApp"`

### Fase 3: Mejoras de Arquitectura (2 horas)

4. **Fix #12-13: Inyección de dependencias**
   - Configurar Koin/Hilt para StorageRepository
   - Inyectar en lugar de instanciar directamente

5. **Fix #14-15: Mejoras de código**
   - Refactorizar deleteAllKeys para ser transaccional
   - Renombrar Crypto.decode para claridad

---

## 📝 ACTUALIZACIÓN DE specs/lessons.md

Agregar al archivo `specs/lessons.md`:

```markdown
### 2026-03-28: Análisis Exhaustivo con Skills - 15 Errores Encontrados

**Error Crítico #1: StorageRepository no lee URIs correctamente**
- Problema: `readUriBytes` convierte URI a string en lugar de leer el archivo
- Solución: Usar `context.contentResolver.openInputStream(uri)?.readBytes()`
- Prevención: Tests de integración para envío de multimedia

**Error Crítico #2: StorageRepository sin Context**
- Problema: No puede leer URIs sin Context
- Solución: Inyección de Context en constructor
- Prevención: Documentar dependencias de Android

**Error Crítico #3: StorageAcl incompleto**
- Problema: Feature comentada como "migrada" pero sin implementación
- Solución: Implementar con RLS de Supabase o StorageAcl real
- Prevención: No comentar features sin reemplazo listo

**Error Warning #4-11: Logging inconsistente**
- Problema: Tags hardcodeados en lugar de usar TAG constante
- Solución: Reemplazar todos por `Log.w(TAG, ...)`
- Prevención: Code review checklist incluye verificación de tags

**Error Arquitectura #12-13: Falta inyección de dependencias**
- Problema: Repositorios instanciados directamente en UI
- Solución: Usar Koin/Hilt para inyección
- Prevención: Seguir patrón DI desde el inicio

**Lección General:**
Análisis con skills reveló 15 errores que pasaron code review.
Implementar revisión automatizada con detekt + ktlint en CI/CD.
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de aplicar fixes:

- [ ] StorageRepository puede leer URIs reales
- [ ] Tests de envío de multimedia pasan
- [ ] StorageAcl o RLS implementado correctamente
- [ ] TODOS los logs usan TAG constante
- [ ] Repositorios inyectados, no instanciados
- [ ] Compilación exitosa: `./gradlew assembleDebug`
- [ ] Tests unitarios pasan: `./gradlew test`
- [ ] Lint sin errores: `./gradlew lint`

---

**Fecha del Análisis:** 2026-03-28  
**Analista:** Skills de Code Review + Silent Failure Hunter  
**Próxima Revisión:** 2026-04-04
