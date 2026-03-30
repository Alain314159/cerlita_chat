# Migración JPush → Firebase Cloud Messaging (FCM)

**Fecha:** 2026-03-29  
**Estado:** ✅ Completado  
**Versión:** 2.4-fcm

---

## 📋 Resumen de Cambios

### Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `app/build.gradle.kts` | Plugin google-services + dependencias FCM | ✅ |
| `app/src/main/AndroidManifest.xml` | Servicio FCM + metadatos | ✅ |
| `NotificationRepository.kt` | Refactorizado completo | ✅ |
| `FCMMessageService.kt` | Nuevo archivo | ✅ Creado |
| `strings.xml` | Canal de notificación | ✅ |
| `colors.xml` | ColorAccent | ✅ |

### Archivos Eliminados

| Archivo | Razón |
|---------|-------|
| `JPushBroadcastReceiver.kt` | Obsoleto (JPush) |
| `JPushService.kt` | Obsoleto (JPush) |

---

## 🔧 Configuración Requerida

### Paso 1: Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Agrega una app de Android con el package: `com.example.messageapp`
4. Descarga el archivo `google-services.json`
5. Coloca el archivo en: `app/google-services.json`

### Paso 2: Habilitar Cloud Messaging

1. En Firebase Console, ve a "Cloud Messaging"
2. Habilita la API de Firebase Cloud Messaging
3. Configura los canales de notificación si es necesario

### Paso 3: Actualizar Dependencias

Las dependencias ya están configuradas en `build.gradle.kts`:

```kotlin
// Plugin de Google Services
id("com.google.gms.google-services") version "4.4.2"

// Firebase BOM
implementation(platform("com.google.firebase:firebase-bom:33.10.0"))
implementation("com.google.firebase:firebase-messaging-ktx:24.1.0")
implementation("com.google.firebase:firebase-analytics-ktx:22.3.0")
```

### Paso 4: Configurar Permisos

El AndroidManifest ya incluye los permisos necesarios:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

---

## 📱 Uso en la App

### Inicialización

En tu clase `Application` o `MainActivity`:

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Inicializar FCM
        val notificationRepo = NotificationRepository()
        notificationRepo.initialize(this)
    }
}
```

### Obtener Token de Registro

```kotlin
// En un ViewModel o Repository
lifecycleScope.launch {
    val token = notificationRepo.getRegistrationId()
    Log.d("FCM", "Token: $token")
    
    // Enviar token al servidor para actualizar el registro
    // authRepository.updateFcmToken(token)
}
```

### Solicitar Permiso (Android 13+)

```kotlin
// En MainActivity
private val requestPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted: Boolean ->
    if (isGranted) {
        Log.d("FCM", "Permission granted")
    } else {
        Log.w("FCM", "Permission denied")
    }
}

private fun askNotificationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            // Permiso ya otorgado
        } else {
            // Solicitar permiso
            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
```

### Suscribirse a Topics (Alias/Tags)

```kotlin
lifecycleScope.launch {
    // Suscribirse a topic de usuario
    notificationRepo.setAlias("user-123")
    
    // Suscribirse a tags
    notificationRepo.setTags(setOf("chats", "grupos", "importante"))
}
```

---

## 🔍 Diferencias Clave: JPush vs FCM

| Característica | JPush | FCM |
|----------------|-------|-----|
| **Inicialización** | `JPushInterface.init()` | Automática |
| **Token** | `getRegistrationID()` | `FirebaseMessaging.token.await()` |
| **Alias** | `setAlias()` | `subscribeToTopic("user_$alias")` |
| **Tags** | `setTags()` | `subscribeToTopic("tag_$tag")` |
| **Mensajes** | BroadcastReceiver | FirebaseMessagingService |
| **Permisos** | Automáticos | POST_NOTIFICATIONS (Android 13+) |

---

## 🧪 Testing

### Enviar Mensaje de Prueba

1. Ve a Firebase Console → Cloud Messaging
2. Click en "New Notification"
3. Escribe título y mensaje
4. En "Target", selecciona "Single device"
5. Ingresa el token de registro
6. Click en "Send"

### Verificar Recepción

```bash
adb logcat | grep FCMMessageService
```

Deberías ver logs como:
```
D/FCMMessageService: Message received from: ...
D/FCMMessageService: Notification: Título - Mensaje
```

---

## 🐛 Solución de Problemas

### Problema: Token no se genera

**Causa:** Google Services no configurado correctamente

**Solución:**
1. Verifica que `google-services.json` existe en `app/`
2. Verifica que el package name coincide
3. Ejecuta `./gradlew clean`
4. Rebuild del proyecto

### Problema: Notificaciones no se muestran en Android 13+

**Causa:** Falta permiso POST_NOTIFICATIONS

**Solución:**
```kotlin
// Solicitar permiso en runtime
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    requestPermissions(
        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
        1001
    )
}
```

### Problema: Mensajes no se reciben en foreground

**Causa:** FCMMessageService no está registrado en AndroidManifest

**Solución:** Verifica que el servicio esté declarado:

```xml
<service
    android:name=".push.FCMMessageService"
    android:enabled="true"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

---

## 📊 Métricas de Migración

| Métrica | Antes (JPush) | Después (FCM) |
|---------|---------------|---------------|
| **Dependencias** | 0 (comentada) | 3 (BOM + Messaging + Analytics) |
| **Archivos Kotlin** | 2 (JPush*) | 2 (FCM*) |
| **Líneas de código** | ~150 | ~200 |
| **Configuración** | Manual | Firebase Console |
| **Soporte** | Limitado en Cuba | Oficial de Google |

*JPushBroadcastReceiver + JPushService → FCMMessageService

---

## ✅ Checklist Post-Migración

- [ ] google-services.json configurado
- [ ] Build exitoso sin errores
- [ ] Token FCM se genera correctamente
- [ ] Permiso POST_NOTIFICATIONS solicitado (Android 13+)
- [ ] Mensaje de prueba recibido
- [ ] Logs verificados en Logcat
- [ ] Notificaciones se muestran en foreground
- [ ] Notificaciones se muestran en background
- [ ] Token se actualiza en el servidor

---

## 📚 Recursos Adicionales

- [Documentación Oficial FCM](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Firebase Console](https://console.firebase.google.com/)
- [FCM Message Types](https://firebase.google.com/docs/cloud-messaging/concept-options)
- [Android Notification Permissions](https://developer.android.com/guide/topics/ui/notifiers/notifications#Permission)

---

**Última Actualización:** 2026-03-29  
**Próxima Revisión:** 2026-04-05
