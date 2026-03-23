# 📋 ESPECIFICACIÓN TÉCNICA FINAL - Message App Romántica

## 🎯 CONFIGURACIÓN FINAL

| Componente | Elección | Implementación |
|------------|----------|----------------|
| **Backend** | Supabase | PostgreSQL + Realtime + Auth + Storage |
| **Login** | Email + Google | Dual auth con fallback |
| **Cifrado** | Android Keystore | AES-256-GCM por chat |
| **Pareja** | Código 6 dígitos + Email | Búsqueda e invitación |
| **Frontend** | Corregir existente | Migración Firebase→Supabase |
| **Push** | OneSignal 5.7.3 | Mantener implementación |
| **Multimedia** | Supabase Storage | Solo Storage (sin Cloudinary) |
| **Presencia** | Completa | Online + Typing + Last seen |
| **Ticks** | WhatsApp-style | Gris Koala / Rosa Chanchita |
| **UI** | Material 3 | Tema romántico personalizado |

---

## 🎨 PALETA DE COLORES PERSONALIZADA

### Colores de Ticks de Mensajes

| Estado | Color | Hex | Uso |
|--------|-------|-----|-----|
| **Enviado** | Gris Koala | `#8E8E93` | 1 tick |
| **Entregado** | Gris Koala | `#8E8E93` | 2 ticks |
| **Leído** | Rosa Chanchita | `#FF69B4` | 2 ticks |

### Colores del Tema

| Color | Hex | Uso |
|-------|-----|-----|
| **Rosa Chanchita** | `#FFB6C1` | Primary, accents |
| **Rosa Chanchita Dark** | `#FF69B4` | Primary variant, ticks de leído |
| **Gris Koala** | `#8E8E93` | Texto secundario, ticks de entregado |
| **Gris Koala Light** | `#F2F2F7` | Fondos suaves |
| **Blanco Humo** | `#F5F5F5` | Fondo de pantalla |
| **Verde Online** | `#34C759` | Indicador de presencia |

---

## 🗄️ DATABASE SCHEMA (PostgreSQL)

### Tabla: users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Usuario',
    photo_url TEXT,              -- URL de Supabase Storage
    
    -- Sistema de emparejamiento
    pairing_code VARCHAR(6) UNIQUE,
    partner_id UUID REFERENCES users(id),
    is_paired BOOLEAN DEFAULT FALSE,
    
    -- Presencia
    is_online BOOLEAN DEFAULT FALSE,
    last_seen BIGINT,
    is_typing BOOLEAN DEFAULT FALSE,
    
    -- Notificaciones
    onesignal_player_id TEXT,
    
    created_at BIGINT,
    updated_at BIGINT
);
```

### Tabla: messages

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    chat_id UUID REFERENCES chats(id),
    sender_id UUID REFERENCES users(id),
    type TEXT DEFAULT 'text',
    text_enc TEXT,               -- Cifrado con Android Keystore
    media_url TEXT,              -- URL de Supabase Storage
    nonce TEXT,                  -- IV para AES-256-GCM
    
    -- Estados de mensaje
    created_at BIGINT,
    delivered_at BIGINT,         -- Cuando llegó al dispositivo
    read_at BIGINT,              -- Cuando abrió el chat
    
    deleted_for_all BOOLEAN DEFAULT FALSE,
    deleted_for UUID[] DEFAULT '{}'
);
```

---

## 📦 DEPENDENCIAS FINALES

### Build.gradle.kts (App)

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    kotlin("plugin.serialization") version "1.9.21"
}

android {
    namespace = "com.example.messageapp"
    compileSdk = 36
    minSdk = 26
    targetSdk = 36
}

dependencies {
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    
    // Supabase 3.4.1 (Marzo 2026)
    implementation(platform("io.github.jan.supabase:bom:3.4.1"))
    implementation("io.github.jan.supabase:supabase-kt")
    implementation("io.github.jan.supabase:auth-kt")
    implementation("io.github.jan.supabase:postgrest-kt")
    implementation("io.github.jan.supabase:realtime-kt")
    implementation("io.github.jan.supabase:storage-kt")  // Multimedia
    
    // Ktor 3.3.0 (requerido por Supabase 3.x)
    implementation("io.ktor:ktor-client-android:3.3.0")
    implementation("io.ktor:ktor-client-core:3.3.0")
    
    // OneSignal 5.7.3 (Marzo 2026)
    implementation("com.onesignal:OneSignal:5.7.3")
    
    // Cifrado Android Keystore (nativo, sin librerías externas)
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.6.0")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

---

## 🏗️ ARQUITECTURA DEL PROYECTO

```
app/src/main/java/com/example/messageapp/
├── core/
│   ├── App.kt                    # Inicialización
│   └── SessionManager.kt
├── data/
│   ├── AuthRepository.kt         # Email + Google
│   ├── ChatRepository.kt         # Mensajes + Realtime
│   ├── PairingRepository.kt      # Código 6 dígitos
│   ├── MediaRepository.kt        # Supabase Storage
│   ├── NotificationRepository.kt # OneSignal
│   └── PresenceRepository.kt     # Typing + Online
├── crypto/
│   └── E2ECipher.kt              # Android Keystore
├── model/
│   ├── User.kt
│   ├── Chat.kt
│   ├── Message.kt                # Con MessageStatus
│   └── MessageStatus.kt          # SENT/DELIVERED/READ
├── supabase/
│   └── SupabaseConfig.kt
├── ui/
│   ├── theme/
│   │   ├── Color.kt              # Rosa Chanchita + Gris Koala
│   │   └── Theme.kt
│   ├── auth/
│   │   └── AuthScreen.kt
│   ├── pairing/
│   │   ├── PairingScreen.kt
│   │   └── FindPartnerScreen.kt
│   ├── chat/
│   │   ├── ChatScreen.kt
│   │   ├── MessageBubble.kt
│   │   ├── MessageStatusIndicator.kt  # Ticks
│   │   └── TypingIndicator.kt
│   └── home/
│       └── HomeScreen.kt
└── viewmodel/
    ├── AuthViewModel.kt
    ├── PairingViewModel.kt
    └── ChatViewModel.kt
```

---

## 📱 ESTADOS DE MENSAJE (TICKS)

### Enum MessageStatus

```kotlin
enum class MessageStatus {
    SENT,       // 1 tick Gris Koala (#8E8E93)
    DELIVERED,  // 2 ticks Gris Koala (#8E8E93)
    READ        // 2 ticks Rosa Chanchita (#FF69B4)
}
```

### Cálculo del Estado

```kotlin
val status: MessageStatus
    get() = when {
        readAt != null -> MessageStatus.READ      // Rosa
        deliveredAt != null -> MessageStatus.DELIVERED  // Gris
        else -> MessageStatus.SENT                // Gris
    }
```

### UI del Indicador

```kotlin
@Composable
fun MessageStatusIndicator(status: MessageStatus, isMine: Boolean) {
    if (!isMine) return
    
    val tickColor = when (status) {
        MessageStatus.READ -> RosaChanchitaDark  // #FF69B4
        else -> GrisKoala                         // #8E8E93
    }
    
    // Dibujar 1 o 2 ticks según el estado
}
```

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Corrección de Código (YA HECHO)
- [x] Eliminar Firebase de build.gradle
- [x] Agregar Supabase 3.4.1
- [x] Agregar OneSignal 5.7.3
- [x] Actualizar imports de `gotrue-kt` → `auth-kt`
- [x] Actualizar Ktor 2.x → 3.x
- [x] Crear Color.kt con Rosa Chanchita y Gris Koala

### Fase 2: Autenticación (PENDIENTE)
- [ ] Corregir AuthScreen.kt (eliminar Firebase)
- [ ] Implementar Google Sign In
- [ ] Actualizar AuthRepository con Supabase Auth

### Fase 3: Emparejamiento (PENDIENTE)
- [ ] Crear PairingRepository (código 6 dígitos)
- [ ] Crear PairingScreen (UI de ingreso de código)
- [ ] Crear FindPartnerScreen (búsqueda por email)

### Fase 4: Chat y Mensajes (PENDIENTE)
- [ ] Corregir ChatRepository (Supabase Realtime)
- [ ] Implementar MessageStatusIndicator (ticks)
- [ ] Agregar estados SENT/DELIVERED/READ
- [ ] Actualizar ChatViewModel con nuevos estados

### Fase 5: Presencia (PENDIENTE)
- [ ] Crear PresenceRepository (typing indicators)
- [ ] Crear TypingIndicator composable
- [ ] Implementar "en línea" / "última vez"

### Fase 6: Multimedia (PENDIENTE)
- [ ] Configurar bucket "chat-media" en Supabase
- [ ] Implementar MediaRepository (solo Supabase)
- [ ] Agregar picker de imágenes en ChatScreen
- [ ] Implementar vista de imágenes/videos

### Fase 7: Notificaciones (YA HECHO)
- [x] OneSignal 5.7.3 configurado
- [x] NotificationRepository implementado
- [ ] Verificar envío de notificaciones

---

## 🔧 COMANDOS ÚTILES

### Build y Test

```bash
# Build debug
./gradlew assembleDebug

# Build release
./gradlew assembleRelease

# Run tests
./gradlew test

# Clean build
./gradlew clean
```

### Database Schema

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar contenido de database_schema.sql
```

---

## 📝 NOTAS IMPORTANTES

1. **Multimedia:** Solo usar Supabase Storage (NO Cloudinary)
2. **Colores:** Rosa Chanchita (#FF69B4) y Gris Koala (#8E8E93) en TODA la app
3. **Ticks:** 1 tick gris (enviado), 2 ticks grises (entregado), 2 ticks rosas (leído)
4. **Cifrado:** Android Keystore AES-256-GCM (ya implementado)
5. **Backend:** Supabase (PostgreSQL + Realtime + Storage)

---

**Fecha:** 23 de Marzo, 2026
**Versión:** 1.0-couple
**Estado:** En desarrollo
