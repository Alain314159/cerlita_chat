# ✅ Configuración Firebase Cloud Messaging (FCM) - COMPLETA

**Fecha:** 2026-03-29  
**Estado:** ✅ **CONFIGURACIÓN COMPLETA - LISTA PARA BUILD**

---

## 📋 Resumen de Configuración

### Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `build.gradle.kts` (raíz) | Plugin google-services 4.4.4 apply false | ✅ |
| `app/build.gradle.kts` | Plugin google-services + Firebase BOM 34.11.0 | ✅ |
| `app/google-services.json` | Configuración de proyecto Firebase | ✅ |
| `context/state.md` | Actualizado con progreso | ✅ |
| `specs/lessons.md` | Lecciones aprendidas documentadas | ✅ |

---

## 🔧 Configuración Aplicada

### 1. Nivel de Proyecto (build.gradle.kts raíz)

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false

    // Add the dependency for the Google services Gradle plugin
    id("com.google.gms.google-services") version "4.4.4" apply false
}
```

**Nota:** `apply false` declara el plugin pero no lo aplica al proyecto raíz.

---

### 2. Nivel de App (app/build.gradle.kts)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    kotlin("plugin.serialization") version "2.1.0"
    id("com.google.devtools.ksp") version "2.1.0-1.0.29"
    
    // Firebase Cloud Messaging - Google Services Plugin
    id("com.google.gms.google-services")  // Sin versión (hereda del root)
    
    id("io.gitlab.arturbosch.detekt") version "1.23.8"
    id("org.jlleitschuh.gradle.ktlint") version "14.2.0"
}

dependencies {
    // ... otras dependencias ...
    
    // ============================================
    // FIREBASE CLOUD MESSAGING
    // ============================================
    implementation(platform("com.google.firebase:firebase-bom:34.11.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")
}
```

**Notas:**
- El plugin en `app/` NO lleva versión (hereda del root)
- Firebase BOM `34.11.0` garantiza versiones compatibles
- NO especificar versiones en dependencias Firebase cuando se usa BOM

---

### 3. google-services.json (app/)

```json
{
  "project_info": {
    "project_number": "31447748461",
    "project_id": "cerlita-app",
    "storage_bucket": "cerlita-app.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:31447748461:android:82ba3915388f9fa3089464",
        "android_client_info": {
          "package_name": "com.example.messageapp"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "AIzaSyBuel2jSS6PDQyQzmos7zujdQdq-Q3DefE"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

**Verificaciones:**
- ✅ `package_name` coincide con `applicationId` en `build.gradle.kts`
- ✅ Archivo ubicado en `app/google-services.json` (no en raíz)
- ✅ `project_id`: `cerlita-app`

---

## 📦 Dependencias Firebase

### Firebase BOM (Bill of Materials)

```kotlin
implementation(platform("com.google.firebase:firebase-bom:34.11.0"))
```

**Propósito:**
- Gestiona versiones de todos los SDKs de Firebase
- Garantiza compatibilidad entre componentes
- Simplifica actualizaciones (cambiar solo versión del BOM)

### Dependencias Incluidas

```kotlin
// Cloud Messaging (notificaciones push)
implementation("com.google.firebase:firebase-messaging-ktx")

// Analytics (telemetría opcional pero recomendada)
implementation("com.google.firebase:firebase-analytics-ktx")
```

**Versiones automáticas (desde BOM 34.11.0):**
- `firebase-messaging-ktx`: `24.1.0` (automático)
- `firebase-analytics-ktx`: `22.3.0` (automático)

---

## ✅ Checklist de Verificación

### Pre-Build

- [ ] `google-services.json` existe en `app/`
- [ ] Plugin en root: `version "4.4.4" apply false`
- [ ] Plugin en app: sin versión, sin `apply false`
- [ ] Firebase BOM: `34.11.0`
- [ ] Sin versiones en dependencias Firebase

### Post-Build

- [ ] `./gradlew build` exitoso
- [ ] No hay errores de Google Services
- [ ] APK genera correctamente

### Runtime (por verificar)

- [ ] `FirebaseMessaging.getInstance().token` devuelve token
- [ ] `FCMMessageService` se registra correctamente
- [ ] Notificaciones se reciben en dispositivo/emulador

---

## 🧪 Comandos de Verificación

```bash
# 1. Verificar que google-services.json existe
ls -la app/google-services.json

# 2. Verificar configuración en build.gradle.kts raíz
grep "google-services" build.gradle.kts
# Esperado: id("com.google.gms.google-services") version "4.4.4" apply false

# 3. Verificar configuración en app/build.gradle.kts
grep "google-services" app/build.gradle.kts
# Esperado: id("com.google.gms.google-services")

# 4. Verificar Firebase BOM
grep "firebase-bom" app/build.gradle.kts
# Esperado: implementation(platform("com.google.firebase:firebase-bom:34.11.0"))

# 5. Verificar dependencias Firebase (sin versiones)
grep "firebase-messaging-ktx" app/build.gradle.kts
grep "firebase-analytics-ktx" app/build.gradle.kts

# 6. Build de prueba
./gradlew build

# 7. Verificar que google-services procesó correctamente
ls -la app/build/generated/
# Debería haber archivos generados por google-services
```

---

## 🚀 Próximos Pasos

### Inmediatos

1. **Build de verificación**
   ```bash
   ./gradlew build
   ```

2. **Probar registro FCM**
   - Agregar logging en `App.kt` o `MainActivity.kt`:
   ```kotlin
   FirebaseMessaging.getInstance().token
       .addOnCompleteListener { task ->
           if (task.isSuccessful) {
               Log.d("FCM", "Registration token: ${task.result}")
           } else {
               Log.w("FCM", "Fetching FCM registration token failed", task.exception)
           }
       }
   ```

3. **Probar envío desde Firebase Console**
   - Ir a Firebase Console → Cloud Messaging
   - Click en "New notification"
   - Enviar notificación de prueba

### Pendientes de Implementación

- [ ] Configurar topics para mensajería grupal
- [ ] Manejo de notificaciones entrantes en `FCMMessageService`
- [ ] Persistencia de tokens de dispositivo
- [ ] Suscripción a topics basada en chats

---

## 📚 Recursos Oficiales

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Firebase BOM Documentation](https://firebase.google.com/docs/android/learn-more#bom)
- [Google Services Plugin](https://github.com/google/play-services-plugins/tree/master/google-services)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Firebase Messaging KTX](https://firebase.google.com/docs/reference/kotlin/com/google/firebase/messaging/package-summary)

---

## ⚠️ Errores Comunes a Evitar

### ❌ MAL: Plugin solo en app con versión

```kotlin
// NO HACER ESTO
// app/build.gradle.kts
id("com.google.gms.google-services") version "4.4.4"
```

### ✅ BIEN: Plugin en root (apply false) + app (sin versión)

```kotlin
// Root build.gradle.kts
id("com.google.gms.google-services") version "4.4.4" apply false

// App build.gradle.kts
id("com.google.gms.google-services")
```

---

### ❌ MAL: Versiones en dependencias Firebase con BOM

```kotlin
// NO HACER ESTO
implementation(platform("com.google.firebase:firebase-bom:34.11.0"))
implementation("com.google.firebase:firebase-messaging-ktx:24.1.0")  // ❌
```

### ✅ BIEN: Sin versiones cuando se usa BOM

```kotlin
implementation(platform("com.google.firebase:firebase-bom:34.11.0"))
implementation("com.google.firebase:firebase-messaging-ktx")  // ✅
```

---

### ❌ MAL: google-services.json en raíz

```
Message-App/
├── google-services.json  ❌
└── app/
```

### ✅ BIEN: google-services.json en app/

```
Message-App/
└── app/
    ├── google-services.json  ✅
    └── build.gradle.kts
```

---

## 🎯 Métricas de Éxito

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Build exitoso | 100% | ⏳ Pendiente |
| Token FCM obtenido | Sí | ⏳ Pendiente |
| Notificación recibida | Sí | ⏳ Pendiente |
| Configuración documentada | Sí | ✅ COMPLETADO |

---

**Última Actualización:** 2026-03-29  
**Próxima Verificación:** Build + Runtime test  
**Responsable:** Equipo de desarrollo
