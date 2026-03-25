# 📋 Plan de Corrección Masiva de Tests

## ✅ Completados

### 1. AuthRepositoryTest.kt - 28 tests ✅
- **Problema:** `android.util.Patterns`
- **Solución:** Remover validación de email, enfocarse en no-crash tests
- **Estado:** ✅ Corregido (commit 6fe80e9)

---

## ⏳ Pendientes

### 2. E2ECipherTest.kt - 31 tests
**Problema:** Android Keystore no funciona en JVM

**Opciones:**
- **Opción A:** Mover a `src/androidTest` (requiere emulador/GitHub Actions con emulador)
- **Opción B:** Mockear KeyStore (complejo, requiere shadowing)
- **Opción C:** Crear interfaz y fake para testing

**Decisión:** **Opción A** - Mover a androidTest
- Criptografía es crítico y debe testearse en ambiente real
- GitHub Actions puede ejecutar androidTest con emulador

**Acción:** Mover archivo a `app/src/androidTest/java/.../crypto/E2ECipherTest.kt`

---

### 3. Repository Tests - 108 tests
**Archivos:**
- ChatRepositoryTest.kt (12 tests)
- ChatRepositoryAdditionalTest.kt (36 tests)
- PresenceRepositoryTest.kt (26 tests)
- AvatarRepositoryTest.kt (28 tests)
- ProfileRepositoryTest.kt (18 tests)

**Problema:** Todos usan `SupabaseConfig` que requiere Context

**Solución:** Crear `FakeSupabaseConfig` para tests

**Acción:** 
1. Crear interfaz `SupabaseConfigProvider`
2. Crear `FakeSupabaseConfigProvider` para tests
3. Inyectar en Repositories via constructor

---

### 4. ViewModel Tests - 66 tests
**Archivos:**
- AuthViewModelTest.kt (24 tests)
- ChatViewModelTest.kt (6 tests)
- ChatViewModelAdditionalTest.kt (16 tests)
- ChatListViewModelTest.kt (20 tests)

**Problema:** Dependen de Repositories con Android dependencies

**Solución:** Una vez corregidos los Repositories, los ViewModels funcionarán con mocks

**Acción:** Esperar a que los Repositories estén corregidos

---

## 📊 Progreso

| Categoría | Total | Corregidos | Pendientes | % |
|-----------|-------|------------|------------|---|
| **AuthRepository** | 28 | 28 | 0 | ✅ 100% |
| **E2ECipher** | 31 | 0 | 31 | ⏳ 0% |
| **Repositories** | 108 | 0 | 108 | ⏳ 0% |
| **ViewModels** | 66 | 0 | 66 | ⏳ 0% |
| **Utils/Models** | 105 | 105 | 0 | ✅ 100% |
| **TOTAL** | 338 | 133 | 205 | 39% |

---

## 🎯 Timeline Actualizado

### Semana 1 (2026-03-24 a 2026-03-31)
- [x] AuthRepositoryTest ✅
- [ ] E2ECipherTest (mover a androidTest)
- [ ] Crear FakeSupabaseConfigProvider
- [ ] Corregir 5 Repository tests

### Semana 2 (2026-03-31 a 2026-04-07)
- [ ] Corregir ViewModel tests
- [ ] Ejecutar todos los tests en GitHub Actions
- [ ] Verificar 100% pass rate

### Semana 3 (2026-04-07 a 2026-04-14)
- [ ] Tests de UI (Compose)
- [ ] Tests de integración
- [ ] Documentación final

---

**Última Actualización:** 2026-03-24  
**Próximo Hito:** 50% tests corregidos (169/338)
