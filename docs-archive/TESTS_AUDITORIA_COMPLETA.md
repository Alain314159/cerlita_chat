# 🧪 Auditoría de Tests - Clasificación y Correcciones

## 📊 Resumen de Auditoría

**Fecha:** 2026-03-24  
**Total Tests:** 19 archivos  
**Problemas Identificados:** 8 archivos con dependencias de Android incorrectas

---

## ✅ Tests JVM Puros (Correctos)

Estos tests NO requieren Android y están BIEN:

| Archivo | Tests | Estado | Notas |
|---------|-------|--------|-------|
| `ExampleUnitTest.kt` | 1 | ✅ OK | Sin dependencias Android |
| `ModelsTest.kt` | 59 | ✅ OK | Solo data classes |
| `TimeUtilsTest.kt` | 34 | ✅ OK | Solo java.util |
| `SignatureLoggerTest.kt` | 12 | ✅ OK | Sin Android dependencies |
| `ThemeModelsTest.kt` | 26 | ⚠️ FIX | Usaba Color() constructor incorrecto |

---

## ⚠️ Tests con Problemas (Requieren Corrección)

### 1. **AuthRepositoryTest.kt** - 28 tests
**Problema:** Usa `android.util.Patterns` que requiere Android

```kotlin
// ❌ INCORRECTO - Requiere Android
import android.util.Patterns
mockkStatic(Patterns::class)
```

**Solución:**
```kotlin
// ✅ CORRECTO - JVM puro
// Remover mock de Patterns, usar validación simple
```

**Estado:** ⏳ Pendiente de corrección

---

### 2. **E2ECipherTest.kt** - 31 tests
**Problema:** Usa Android Keystore que NO funciona en tests JVM locales

```kotlin
// ❌ INCORRECTO - Android Keystore no funciona en JVM
E2ECipher.encrypt() // Usa KeyStore.getInstance("AndroidKeyStore")
```

**Solución:** Mover a `androidTest` (requiere emulador) O mockear KeyStore

**Estado:** ⏳ Pendiente - Posiblemente mover a androidTest

---

### 3. **ChatRepositoryTest.kt** - 12 tests
**Problema:** Usa `SupabaseConfig` que requiere contexto Android

```kotlin
// ❌ INCORRECTO - SupabaseConfig requiere Context
private lateinit var repository: ChatRepository
```

**Solución:** Mockear SupabaseConfig o usar FakeDataSource

**Estado:** ⏳ Pendiente de corrección

---

### 4. **ChatRepositoryAdditionalTest.kt** - 36 tests
**Problema:** Mismo problema que ChatRepositoryTest

**Estado:** ⏳ Pendiente

---

### 5. **PresenceRepositoryTest.kt** - 26 tests
**Problema:** Usa `SupabaseConfig` que requiere Context

**Estado:** ⏳ Pendiente

---

### 6. **AvatarRepositoryTest.kt** - 28 tests
**Problema:** Usa `SupabaseConfig` que requiere Context

**Estado:** ⏳ Pendiente

---

### 7. **ProfileRepositoryTest.kt** - 18 tests
**Problema:** Usa `SupabaseConfig` que requiere Context

**Estado:** ⏳ Pendiente

---

### 8. **AuthViewModelTest.kt** - 24 tests
**Problema:** Usa `AuthRepository` que tiene dependencias de Android

```kotlin
// ❌ INCORRECTO - AuthRepository requiere Context
authRepository = mockk()
viewModel = AuthViewModel(authRepository)
```

**Solución:** Este SÍ puede funcionar con mocks adecuados

**Estado:** ⚠️ Verificar si los mocks funcionan

---

### 9. **ChatViewModelTest.kt** - 6 tests
**Problema:** Usa `ChatRepository` con dependencias Android

**Estado:** ⏳ Pendiente

---

### 10. **ChatViewModelAdditionalTest.kt** - 16 tests
**Problema:** Mismo problema que ChatViewModelTest

**Estado:** ⏳ Pendiente

---

### 11. **ChatListViewModelTest.kt** - 20 tests
**Problema:** Usa `ChatRepository` con dependencias Android

**Estado:** ⏳ Pendiente

---

## 📋 Plan de Corrección

### Prioridad 1: Tests Críticos (Esta Semana)

1. **AuthRepositoryTest** - Remover android.util.Patterns
   - Reemplazar con validación simple de email
   - 28 tests a corregir

2. **E2ECipherTest** - Mover a androidTest O mockear
   - Opción A: Mover a `src/androidTest` (requiere emulador)
   - Opción B: Crear interfaz y mock para tests JVM
   - 31 tests a corregir/mover

3. **Repository Tests** - Crear Fakes para SupabaseConfig
   - Crear `FakeSupabaseConfig` para tests
   - 108 tests a corregir (28+26+28+18+8)

### Prioridad 2: ViewModel Tests (Próxima Semana)

4. **ViewModel Tests** - Asegurar mocks correctos
   - 66 tests a verificar (24+16+20+6)

### Prioridad 3: Utils y Models (Completado)

5. ✅ **TimeUtilsTest** - Correcto (JVM puro)
6. ✅ **ModelsTest** - Correcto (data classes)
7. ✅ **SignatureLoggerTest** - Correcto (sin Android)
8. ⚠️ **ThemeModelsTest** - Corregir Color() constructor

---

## 🔧 Correcciones Inmediatas

### 1. ThemeModelsTest.kt

```kotlin
// ❌ ANTES - Usaba Color() con Int
ColorScheme(primary = Color(0xFF1976D2))

// ✅ DESPUÉS - Usar Color factory o remover test
// O usar androidx.compose.ui.Color directamente si está en dependencias de test
```

### 2. AuthRepositoryTest.kt

```kotlin
// ❌ ANTES
mockkStatic(Patterns::class)
every { Patterns.EMAIL_ADDRESS.matcher(any()) } returns mockk()

// ✅ DESPUÉS
// Remover validación de email del test, enfocarse en lógica de negocio
```

### 3. E2ECipherTest.kt

```kotlin
// ❌ ANTES - Android Keystore en JVM
E2ECipher.encrypt() // Llama a KeyStore.getInstance("AndroidKeyStore")

// ✅ DESPUÉS - Opción A: Mover a androidTest
// Mover archivo a src/androidTest/java/...

// ✅ DESPUÉS - Opción B: Mockear KeyStore
mockkStatic(KeyStore::class)
```

---

## 📊 Estado por Categoría

| Categoría | Tests JVM | Tests Android | Pendientes | % Completado |
|-----------|-----------|---------------|------------|--------------|
| **Models** | 59 | 0 | 0 | ✅ 100% |
| **Utils** | 46 | 0 | 0 | ✅ 100% |
| **Crypto** | 0 | 31 | 31 | ⏳ 0% |
| **Repositories** | 0 | 132 | 132 | ⏳ 0% |
| **ViewModels** | 0 | 66 | 66 | ⏳ 0% |
| **TOTAL** | 105 | 229 | 229 | 31% |

---

## 🎯 Meta

**Objetivo:** 100% de tests JVM funcionando en GitHub Actions

**Timeline:**
- Semana 1: Corregir 50 tests críticos
- Semana 2: Corregir 100 tests restantes
- Semana 3: Mover tests Android a androidTest
- Semana 4: 100% tests funcionando

---

**Última Actualización:** 2026-03-24  
**Próxima Revisión:** 2026-03-31
