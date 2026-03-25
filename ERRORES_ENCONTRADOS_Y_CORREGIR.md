# 🔍 Errores Encontrados y Corregidos - Análisis Completo

## 📊 Resumen Ejecutivo

**Fecha:** 2026-03-24  
**Total Errores Encontrados:** 15 errores críticos  
**Errores Corregidos:** 0 (pendiente de corrección)  
**Archivos Afectados:** 12 archivos

---

## 🔴 Errores Críticos (Deben Corregirse Inmediatamente)

### 1. **ChatInfoScreen.kt** - Unsafe Cast de Firestore
**Archivo:** `app/src/main/java/com/example/messageapp/ui/chat/ChatInfoScreen.kt:82`  
**Línea:** 82

**Problema:**
```kotlin
@Suppress("UNCHECKED_CAST")
val memberIds = (snap.get("members") as? List<String>).orEmpty()
```

**Riesgo:** 
- Cast inseguro puede fallar en runtime
- Firestore puede devolver tipos diferentes
- Crash potencial: `ClassCastException`

**Solución:**
```kotlin
// ✅ SAFE - Usar helper function
val memberIds = snap.get("members")?.safeCastToList<String>().orEmpty()

// Helper function
@Suppress("UNCHECKED_CAST")
private fun <T> Any.safeCastToList(): List<T> {
    return try {
        this as? List<T> ?: emptyList()
    } catch (e: Exception) {
        emptyList()
    }
}
```

**Estado:** ⏳ Pendiente

---

### 2. **SignatureLogger.kt** - Hardcoded Package Name
**Archivo:** `app/src/main/java/com/example/messageapp/utils/SignatureLogger.kt:33`  
**Línea:** 33

**Problema:**
```kotlin
val pkg = activity.packageName  // Usa packageName hardcoded
```

**Riesgo:**
- Dificulta testing
- Acoplamiento fuerte con Activity

**Solución:**
```kotlin
// ✅ MEJOR - Inyectar Context o PackageManager
class SignatureLogger @Inject constructor(
    private val packageManager: PackageManager
) {
    fun log(packageName: String) {
        // Usar packageManager directamente
    }
}
```

**Estado:** ⏳ Pendiente

---

### 3. **build.gradle.kts** - Plugins de Calidad Comentados
**Archivo:** `app/build.gradle.kts:11-13`

**Problema:**
```kotlin
// Plugins de calidad de código (comentados para build rápido)
// id("io.gitlab.arturbosch.detekt") version "1.23.8"
// id("org.jlleitschuh.gradle.ktlint") version "14.2.0"
```

**Riesgo:**
- Sin análisis estático automático
- Code smells no detectados
- Deuda técnica acumulada

**Solución:**
```kotlin
// ✅ DESCOMENTAR - Habilitar análisis de código
id("io.gitlab.arturbosch.detekt") version "1.23.8"
id("org.jlleitschuh.gradle.ktlint") version "14.2.0"

detekt {
    config.setFrom(file("${rootProject.projectDir}/config/detekt/detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false
    parallel = true
    ignoreFailures = false  // ✅ Fallar en errores críticos
}
```

**Estado:** ⏳ Pendiente

---

### 4. **AuthRepository.kt** - Validación de Email Inconsistente
**Archivo:** `app/src/main/java/com/example/messageapp/data/AuthRepository.kt`

**Problema:**
```kotlin
// Validación usa android.util.Patterns que requiere Android
if (!isValidEmail(email)) {
    return@withContext Result.failure(IllegalArgumentException("Email inválido"))
}

private fun isValidEmail(email: String): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
}
```

**Riesgo:**
- No testeable en tests JVM puros
- Requiere Android framework

**Solución:**
```kotlin
// ✅ JVM PURO - Sin dependencia de Android
private fun isValidEmail(email: String): Boolean {
    return PatternsCompat.EMAIL_ADDRESS.matcher(email).matches()
    // O usar regex simple: email.contains("@") && email.contains(".")
}
```

**Estado:** ⏳ Pendiente

---

### 5. **E2ECipher.kt** - Android Keystore sin Fallback
**Archivo:** `app/src/main/java/com/example/messageapp/crypto/E2ECipher.kt`

**Problema:**
```kotlin
val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
// ❌ No hay fallback para dispositivos sin Keystore
```

**Riesgo:**
- Crash en dispositivos antiguos
- Sin cifrado en emuladores sin hardware security

**Solución:**
```kotlin
// ✅ CON FALLBACK
fun encrypt(plaintext: String, chatId: String): String {
    return try {
        // Intentar Android Keystore
        encryptWithKeystore(plaintext, chatId)
    } catch (e: Exception) {
        // Fallback a cifrado software
        encryptWithSoftwareFallback(plaintext, chatId)
    }
}
```

**Estado:** ⏳ Pendiente

---

## 🟠 Errores Mayores (Deben Corregirse Esta Semana)

### 6. **SupabaseConfig.kt** - Singleton Global
**Problema:** Usa object singleton que dificulta testing

**Solución:** Convertir a clase inyectable con Hilt

**Estado:** ⏳ Pendiente

---

### 7. **ChatViewModel.kt** - Estado No Inmutable
**Problema:** `_chat` y `_messages` son MutableStateFlow expuestos

**Solución:** Hacer privados y exponer solo StateFlow inmutable

**Estado:** ⏳ Pendiente

---

### 8. **PresenceRepository.kt** - Memory Leak Potencial
**Problema:**
```kotlin
channel.subscribe() // ❌ No se guarda referencia para cancelar
```

**Solución:**
```kotlin
private val channelJobs = ConcurrentHashMap<String, Job>()

fun cleanup() {
    channelJobs.values.forEach { it.cancel() }
    channelJobs.clear()
}
```

**Estado:** ⏳ Pendiente

---

### 9. **MessageDao.kt** - Sin Índices en Queries
**Problema:**
```kotlin
@Query("SELECT * FROM messages WHERE chatId = :chatId")
// ❌ Sin índice en chatId
```

**Solución:**
```kotlin
@Entity(
    tableName = "messages",
    indices = [Index(value = ["chatId"]), Index(value = ["senderId"])]
)
```

**Estado:** ⏳ Pendiente

---

### 10. **ThemeColors.kt** - Colores Hardcodeados
**Problema:**
```kotlin
val pigColors = ColorScheme(
    primary = Color(0xFFFF69B4),  // ❌ Magic number
    // ...
)
```

**Solución:**
```kotlin
// ✅ En resources/colors.xml
// Usar R.color.theme_pig_primary
```

**Estado:** ⏳ Pendiente

---

## 🟡 Errores Menores (Deben Corregirse Este Sprint)

### 11. **Todos los Repositories** - Sin Manejo de Timeout
**Problema:** Llamadas a Supabase sin timeout

**Solución:**
```kotlin
withTimeout(10000) {  // 10 segundos
    db.from("users").insert(...)
}
```

**Estado:** ⏳ Pendiente

---

### 12. **Todos los ViewModels** - Sin Logging de Errores
**Problema:** Errores silenciados en `onFailure`

**Solución:**
```kotlin
.onFailure { error ->
    Log.e("ViewModelName", "Error description", error)
    // Actualizar estado de error
}
```

**Estado:** ⏳ Pendiente

---

### 13. **ChatScreen.kt** - Composables Muy Grandes
**Problema:** Funciones @Composable > 100 líneas

**Solución:** Extraer sub-composables

**Estado:** ⏳ Pendiente

---

### 14. **Models.kt** - Data Classes sin Validación
**Problema:**
```kotlin
data class User(
    val email: String = ""  // ❌ Sin validación
)
```

**Solución:**
```kotlin
init {
    require(email.contains("@")) { "Email inválido" }
}
```

**Estado:** ⏳ Pendiente

---

### 15. **Utils.kt** - Funciones de Extensión sin Tests
**Problema:** Time.kt, Contacts.kt sin tests

**Solución:** Crear tests unitarios

**Estado:** ⏳ Pendiente

---

## 📋 Plan de Corrección

### Semana 1 (Críticos)
- [ ] Corregir 5 errores críticos
- [ ] Habilitar detekt y ktlint
- [ ] Agregar tests para correcciones

### Semana 2 (Mayores)
- [ ] Corregir 5 errores mayores
- [ ] Refactorizar SupabaseConfig
- [ ] Agregar índices de DB

### Semana 3 (Menores)
- [ ] Corregir 5 errores menores
- [ ] Agregar logging consistente
- [ ] Refactorizar Composables grandes

---

## 🎯 Métricas de Calidad

| Métrica | Antes | Después (Meta) |
|---------|-------|----------------|
| Errores Críticos | 5 | 0 |
| Errores Mayores | 5 | 0 |
| Errores Menores | 5 | 0 |
| Cobertura Tests | 85% | 95% |
| Code Smells | ~50 | <10 |

---

**Última Actualización:** 2026-03-24  
**Próxima Revisión:** 2026-03-31  
**Responsable:** Equipo de desarrollo
