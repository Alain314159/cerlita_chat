# 📋 ISSUES RESTANTES DE DETEKT - MESSAGE APP

**Fecha:** 2026-03-28  
**Configuración:** `maxIssues: 0` (estricto)  
**Estado:** 🔴 **BUILD FALLA - Issues sin corregir**

---

## 📊 RESUMEN DE ISSUES RESTANTES

| Categoría | Cantidad | Severidad | Prioridad |
|-----------|----------|-----------|-----------|
| **TooManyFunctions** | ~50 | 🟡 Warning | 🟡 Media |
| **LongParameterList** | 7 | 🟡 Warning | 🟡 Media |
| **LongMethod** | 10 | 🟡 Warning | 🟢 Baja |
| **CyclomaticComplexMethod** | 3 | 🟡 Warning | 🟢 Baja |
| **TooGenericExceptionCaught** | ~18 | 🟡 Warning | 🟡 Media |
| **SwallowedException** | ~2 | 🟡 Warning | 🟡 Media |
| **FunctionNaming (tests)** | ~35 | 🟡 Warning | 🟢 Baja |
| **NestedBlockDepth** | 1 | 🟡 Warning | 🟢 Baja |
| **Total Issues** | **~126** | - | - |

---

## 🔴 ISSUES CRÍTICOS (Impiden Build)

### 1. TooManyFunctions - Clases con más de 11 funciones

**Threshold:** 11 funciones por clase  
**Issues:** ~50 clases afectadas

#### Tests Unitarios (Mayoría - No críticos):

| Clase | Funciones | Archivo |
|-------|-----------|---------|
| AuthRepositoryNetworkErrorTest | 36 | `test/data/AuthRepositoryNetworkErrorTest.kt` |
| ModelsTest | 42 | `test/model/ModelsTest.kt` |
| ChatViewModelSendTextTest | 24 | `test/viewmodel/ChatViewModelSendTextTest.kt` |
| ChatViewModelDeleteMessageTest | 22 | `test/viewmodel/ChatViewModelDeleteMessageTest.kt` |
| ThemeModelsTest | 27 | `test/model/ThemeModelsTest.kt` |
| E2ECipherTest | 27 | `test/crypto/E2ECipherTest.kt` |
| ChatViewModelAdditionalTest | 17 | `test/viewmodel/ChatViewModelAdditionalTest.kt` |
| ChatViewModelTypingTest | 21 | `test/viewmodel/ChatViewModelTypingTest.kt` |
| ChatListViewModelTest | 19 | `test/viewmodel/ChatListViewModelTest.kt` |
| AuthViewModelTest | 21 | `test/viewmodel/AuthViewModelTest.kt` |
| AvatarRepositoryTest | 22 | `test/data/AvatarRepositoryTest.kt` |
| PresenceRepositoryTest | 23 | `test/data/PresenceRepositoryTest.kt` |
| PresenceRepositoryTypingTimeoutTest | 25 | `test/data/PresenceRepositoryTypingTimeoutTest.kt` |
| ChatRepositoryAdditionalTest | 32 | `test/data/ChatRepositoryAdditionalTest.kt` |
| ChatRepositoryMessageOperationsTest | 35 | `test/data/ChatRepositoryMessageOperationsTest.kt` |
| ChatRepositoryRealtimeTest | 22 | `test/data/ChatRepositoryRealtimeTest.kt` |
| ProfileRepositoryTest | 14 | `test/data/ProfileRepositoryTest.kt` |
| AuthRepositoryTest | 23 | `test/data/AuthRepositoryTest.kt` |
| MessageDaoTest | 11 | `test/data/room/MessageDaoTest.kt` |
| FakeMessageDao | 11 | `test/data/room/FakeMessageDao.kt` |
| TimeUtilsTest | 31 | `test/utils/TimeUtilsTest.kt` |
| ContactsUtilsTest | 14 | `test/utils/ContactsUtilsTest.kt` |

#### Código de Producción (Prioritarios):

| Clase | Funciones | Archivo |
|-------|-----------|---------|
| ChatViewModel | 14 | `viewmodel/ChatViewModel.kt` |
| ChatRepository | 15 | `data/ChatRepository.kt` |
| AuthRepository | 15 | `data/AuthRepository.kt` |
| NotificationRepository | 12 | `data/NotificationRepository.kt` |

**Solución Recomendada:**
```yaml
# En detekt.yml - Aumentar threshold para tests
complexity:
  TooManyFunctions:
    thresholdInClasses: 20  # Aumentar de 11 a 20
    thresholdInFiles: 20
    ignoreAnnotated: ['Test', 'ParameterizedTest']
```

---

### 2. LongParameterList - Funciones con más de 6 parámetros

**Threshold:** 6 parámetros  
**Issues:** 7 funciones afectadas

| Función | Parámetros | Archivo | Línea |
|---------|------------|---------|-------|
| ~~sendMedia~~ ✅ | ~~6~~ | ~~StorageRepository.kt~~ | ~~21~~ |
| MessageBubble | 6 | `ui/chat/MessageBubble.kt` | 24 |
| ChatsTab | 8 | `ui/chatlist/ChatsTab.kt` | 8 |
| ChatListTopBar | 7 | `ui/chatlist/ChatListComponents.kt` | 21 |
| ChatListScreen | 7 | `ui/chatlist/ChatListScreen.kt` | 32 |
| ChatRow | 9 | `ui/chatlist/ChatListScreen.kt` | 108 |
| ChatRowMenu | 10 | `ui/chatlist/ChatListScreen.kt` | 188 |

**Código Ejemplo (ChatRowMenu):**
```kotlin
// ❌ PROBLEMA: 10 parámetros
fun ChatRowMenu(
    expanded: Boolean,
    onDismiss: () -> Unit,
    chat: Chat,
    myUid: String,
    isHiddenList: Boolean,
    onHide: () -> Unit,
    onUnhide: () -> Unit,
    onDeleteForMe: () -> Unit,
    onLeave: () -> Unit,
    onDeleteGroup: () -> Unit
)
```

**Solución Recomendada:**
```kotlin
// ✅ SOLUCIÓN: Data class para parámetros
data class ChatRowMenuParams(
    val expanded: Boolean,
    val onDismiss: () -> Unit,
    val chat: Chat,
    val myUid: String,
    val isHiddenList: Boolean,
    val onHide: () -> Unit,
    val onUnhide: () -> Unit,
    val onDeleteForMe: () -> Unit,
    val onLeave: () -> Unit,
    val onDeleteGroup: () -> Unit
)

fun ChatRowMenu(params: ChatRowMenuParams)
```

---

### 3. TooGenericExceptionCaught - Exception genérico en catch

**Issues:** ~20 catches genéricos

#### ChatViewModel.kt (9 catches):
```kotlin
// Líneas: 73, 94, 140, 184, 197, 218, 231, 244, 257
catch (e: Exception) {  // ❌ Demasiado genérico
    _error.value = "Error: ${e.message}"
}
```

**Solución:**
```kotlin
// ✅ Específico para operaciones de red/DB
catch (e: io.github.jan-tennert.supabase.exception.SupabaseException) {
    Log.w(TAG, "Supabase error", e)
    _error.value = "Error de conexión"
} catch (e: kotlinx.serialization.SerializationException) {
    Log.w(TAG, "Serialization error", e)
    _error.value = "Error de datos"
} catch (e: Exception) {
    Log.e(TAG, "Unexpected error", e)
    _error.value = "Error inesperado"
}
```

#### Otros Repositories (11 catches):

| Archivo | Líneas | Cantidad |
|---------|--------|----------|
| ChatListViewModel.kt | 59 | 1 |
| ProfileRepository.kt | 40, 81, 109 | 3 |
| MediaRepository.kt | 75, 89 | 2 |
| ContactsRepository.kt | 33, 49, 83, 137 | 4 |
| NotificationRepository.kt | 64, 95, 108, 121 | 4 |
| ~~AvatarRepository.kt~~ | ~~29, 50~~ | ~~2~~ ✅ CORREGIDO |

---

### 4. SwallowedException - Excepción silenciada

**Issues:** 2 casos

| Archivo | Línea | Problema |
|---------|-------|----------|
| ~~AvatarRepository.kt~~ | ~~29~~ | ✅ CORREGIDO |
| AuthRepository.kt | 331, 346 | Excepciones en signOut() |

**Código Problemático (AuthRepository.kt):**
```kotlin
suspend fun signOut() = withContext(Dispatchers.IO) {
    try {
        updatePresence(false)
        E2ECipher.deleteAllKeys()
        auth.signOut()
        Log.d(TAG, "Logout exitoso")
    } catch (e: Exception) {
        Log.w(TAG, "Sign out error", e)  // ❌ Solo loggea, no propaga
    }
}
```

**Solución:**
```kotlin
// Opción 1: Propagar excepción
catch (e: Exception) {
    Log.e(TAG, "Sign out failed", e)
    throw e  // Propagar para que UI maneje error
}

// Opción 2: Retornar Result
suspend fun signOut(): Result<Unit> {
    return try {
        // ... código
        Result.success(Unit)
    } catch (e: Exception) {
        Log.e(TAG, "Sign out failed", e)
        Result.failure(e)
    }
}
```

---

## 🟡 ISSUES NO CRÍTICOS (Warnings)

### 5. LongMethod - Métodos con más de 60 líneas

**Threshold:** 60 líneas  
**Issues:** 10 métodos afectados

| Método | Líneas | Archivo |
|--------|--------|---------|
| onCreate | 135 | `MainActivity.kt` |
| FindPartnerScreen | 213 | `ui/pairing/FindPartnerScreen.kt` |
| PairingScreen | 167 | `ui/pairing/PairingScreen.kt` |
| ChatInfoScreen | 147 | `ui/chat/ChatInfoScreen.kt` |
| GroupCreateScreen | 109 | `ui/groups/GroupCreateScreen.kt` |
| ChatScreen | 105 | `ui/chat/ChatScreen.kt` |
| ProfileScreen | 94 | `ui/profile/ProfileScreen.kt` |
| ContactsScreen | 90 | `ui/contacts/ContactsScreen.kt` |
| AvatarPickerScreen | 86 | `ui/avatar/AvatarPickerScreen.kt` |
| rememberMediaPickers | 62 | `ui/chat/ChatHelpers.kt` |

**Solución:** Extraer sub-composables
```kotlin
// ❌ ANTES: 213 líneas en un solo composable
@Composable
fun FindPartnerScreen(...) {
    // TODO el código
}

// ✅ DESPUÉS: Extraer en partes
@Composable
fun FindPartnerScreen(...) {
    FindPartnerTopBar(...)
    PartnerListSection(...)
    PairingControlsSection(...)
}
```

---

### 6. CyclomaticComplexMethod - Complejidad ciclomática > 15

**Threshold:** 15  
**Issues:** 3 métodos afectados

| Método | Complejidad | Archivo |
|--------|-------------|---------|
| FindPartnerScreen | 18 | `ui/pairing/FindPartnerScreen.kt` |
| rememberMediaPickers | 17 | `ui/chat/ChatHelpers.kt` |
| ChatInfoScreen | 15 | `ui/chat/ChatInfoScreen.kt` |

**Solución:** Reducir anidamiento y condiciones
```kotlin
// ❌ ANTES: Complejidad 18
when {
    condition1 -> {
        if (nested1) { }
        if (nested2) { }
    }
    condition2 -> { }
}

// ✅ DESPUÉS: Extraer lógica
if (condition1) handleCondition1()
if (condition2) handleCondition2()
```

---

### 7. FunctionNaming - Tests con backticks

**Issues:** ~35 funciones en tests

**Ejemplo:**
```kotlin
// ❌ Para detekt (pero válido en Kotlin)
@Test
fun `signInWithEmail when network error returns Failure`()

// ✅ Sin backticks (menos legible)
@Test
fun signInWithEmailWhenNetworkErrorReturnsFailure()
```

**Solución Recomendada:** Configurar detekt para permitir backticks en tests
```yaml
naming:
  FunctionNaming:
    active: true
    ignoreAnnotated: ['Test', 'ParameterizedTest']
    functionPattern: '([a-z][a-zA-Z0-9]*)|(`.*`)'
```

---

### 8. NestedBlockDepth - Anidamiento muy profundo

**Issues:** 1 caso

| Función | Archivo | Línea |
|---------|---------|-------|
| loadContacts | `utils/Contacts.kt` | 26 |

**Código Problemático:**
```kotlin
// ❌ 5 niveles de anidamiento
fun loadContacts() {
    if (condition1) {
        if (condition2) {
            if (condition3) {
                if (condition4) {
                    // lógica
                }
            }
        }
    }
}
```

**Solución:** Early returns
```kotlin
// ✅ Early returns reducen anidamiento
fun loadContacts() {
    if (!condition1) return
    if (!condition2) return
    if (!condition3) return
    if (!condition4) return
    
    // lógica principal
}
```

---

## 📈 PLAN DE CORRECCIÓN PRIORIZADO

### Prioridad 1: Issues que impiden build 🔴

1. **TooManyFunctions en producción** (4 clases)
   - ChatViewModel (14 funciones)
   - ChatRepository (15 funciones)
   - AuthRepository (15 funciones)
   - NotificationRepository (12 funciones)
   
   **Tiempo estimado:** 2 horas
   **Impacto:** Build pasa

2. **TooGenericExceptionCaught** (~20 catches)
   - ChatViewModel (9 catches)
   - Repositories (11 catches)
   
   **Tiempo estimado:** 1 hora
   **Impacto:** Mejor error handling

### Prioridad 2: Code Quality 🟡

3. **LongParameterList** (7 funciones)
   - MessageBubble
   - ChatsTab
   - ChatListTopBar
   - ChatListScreen
   - ChatRow
   - ChatRowMenu
   
   **Tiempo estimado:** 1 hora
   **Impacto:** Mejor legibilidad

4. **SwallowedException** (2 casos)
   - AuthRepository.signOut()
   
   **Tiempo estimado:** 30 minutos
   **Impacto:** Mejor debugging

### Prioridad 3: Refactorización 🟢

5. **LongMethod** (10 métodos)
   - Composables UI
   - MainActivity.onCreate
   
   **Tiempo estimado:** 4 horas
   **Impacto:** Código más mantenible

6. **CyclomaticComplexMethod** (3 métodos)
   - FindPartnerScreen
   - rememberMediaPickers
   - ChatInfoScreen
   
   **Tiempo estimado:** 2 horas
   **Impacto:** Menos bugs

### Prioridad 4: Configuración ⚪

7. **FunctionNaming en tests** (~35 funciones)
   - Opción A: Configurar detekt (5 minutos)
   - Opción B: Renombrar funciones (2 horas)
   
   **Recomendación:** Opción A (configurar)

---

## 🛠️ CONFIGURACIÓN RECOMENDADA

Para permitir build mientras se refactoriza gradualmente:

```yaml
# config/detekt/detekt.yml

build:
  maxIssues: 100  # Permitir algunos issues temporalmente

complexity:
  TooManyFunctions:
    active: true
    thresholdInClasses: 20  # Aumentar de 11 a 20
    thresholdInFiles: 20
    thresholdInInterfaces: 20
    thresholdInObjects: 20
    thresholdInEnums: 20
    ignoreAnnotated: ['Test', 'ParameterizedTest']  # Ignorar tests

naming:
  FunctionNaming:
    active: true
    ignoreAnnotated: ['Test', 'ParameterizedTest']
    functionPattern: '([a-z][a-zA-Z0-9]*)|(`.*`)'  # Permitir backticks

exceptions:
  TooGenericExceptionCaught:
    active: true
    allowedExceptionNames: ['Exception', 'Throwable']  # Permitir en tests
```

---

## 📊 PROGRESO DE CORRECCIONES

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ✅ Corregidos | 3 | 2.4% |
| 🔴 Pendientes Críticos | 25 | 19.8% |
| 🟡 Pendientes Medios | 18 | 14.3% |
| 🟢 Pendientes Bajos | 80 | 63.5% |
| **Total** | **126** | **100%** |

---

## 📝 COMANDOS DE VERIFICACIÓN

```bash
# Ejecutar detekt y ver issues
cd Message-App
./gradlew detekt

# Ejecutar ktlint
./gradlew ktlintCheck

# Build completo (fallará con maxIssues: 0)
./gradlew assembleDebug

# Build ignorando detekt
./gradlew assembleDebug -x detekt

# Generar reporte HTML
./gradlew detekt --report html:build/reports/detekt/report.html
```

---

**Última Actualización:** 2026-03-28  
**Configuración Actual:** `maxIssues: 0` (estricto)  
**Build Status:** 🔴 FALLA (126 issues detectados)  
**Próximo Paso:** Corregir Prioridad 1 (TooManyFunctions en producción)
