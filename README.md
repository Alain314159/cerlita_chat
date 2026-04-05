# 💕 Cerlita Chat

App de mensajería moderna con cifrado E2E, chat en tiempo real y notificaciones push. Construida con React Native + Expo + Supabase.

**Estado:** 🚧 **EN DESARROLLO**

---

## 🚀 Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| **Framework** | React Native + Expo SDK 52 |
| **Lenguaje** | TypeScript 5.7 |
| **Backend** | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| **Notificaciones** | Firebase Cloud Messaging (FCM) + Expo Notifications |
| **Navegación** | Expo Router (File-based routing) |
| **State Management** | Zustand |
| **UI Components** | React Native Paper (Material Design 3) |
| **Cifrado E2E** | expo-crypto (AES-256-GCM) |
| **Animaciones** | React Native Reanimated v3 |

---

## 📋 Prerrequisitos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **Expo CLI** (se instala automáticamente)
- **Cuenta en Supabase** (gratis)
- **Cuenta en Firebase** (solo para FCM, gratis)
- **Expo Go** app en tu celular (para testing)

---

## 🛠️ Configuración Rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
EXPO_PUBLIC_FIREBASE_API_KEY=TU_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=TU_PROYECTO.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=TU_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=TU_PROYECTO.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=TU_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=TU_APP_ID
```

### 3. Configurar Supabase

1. Ve a https://supabase.com
2. Crea una cuenta → New Project
3. Nombre: "cerlita-chat"
4. Región: South America (Brazil) o la más cercana
5. Espera 2-3 minutos a que se cree
6. Ve a Settings → API
7. Copia:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. Ejecutar SQL en Supabase

1. Ve a SQL Editor en Supabase Dashboard
2. Copia TODO el contenido de `database_schema.sql`
3. Pega en el editor
4. Click en "Run"
5. ✅ Verifica en Table Editor que hay 3 tablas: `users`, `chats`, `messages`

### 5. Configurar Firebase (para notificaciones push)

1. Ve a https://console.firebase.google.com
2. Crea un proyecto o usa uno existente
3. Agrega app Android:
   - Package name: `com.cerlita.chat`
   - Descarga `google-services.json`
4. Coloca `google-services.json` en la raíz del proyecto
5. Ve a Project Settings → Cloud Messaging
6. Copia las credenciales al `.env`

### 6. Iniciar la app

```bash
npm start
```

### 7. Probar en tu celular

1. Instala **Expo Go** en tu celular (Play Store / App Store)
2. Escanea el código QR que aparece en la terminal
3. ¡Listo! La app se ejecuta en tu celular

---

## 📱 Funcionalidades

### ✅ Autenticación
- [x] Registro con email/password
- [x] Login con email/password
- [x] Recuperar contraseña
- [x] Perfil de usuario

### ✅ Chat
- [x] Lista de chats
- [x] Chat individual (1-a-1)
- [x] Mensajes en tiempo real
- [x] Enviar/recibir mensajes
- [x] Estados de mensaje (enviado/entregado/leído)
- [x] Indicador "escribiendo..."
- [x] Presencia online/offline
- [x] Last seen

### ✅ Cifrado
- [x] Cifrado E2E con AES-256-GCM
- [x] Claves por chat
- [x] Almacenamiento seguro con SecureStore

### ⏳ Próximas Features
- [ ] Enviar imágenes (cámara/gallery)
- [ ] Enviar videos
- [ ] Enviar archivos
- [ ] Push notifications
- [ ] Búsqueda de chats
- [ ] Eliminar mensajes
- [ ] Editar mensajes
- [ ] Tema romántico completo
- [ ] Animaciones de corazones
- [ ] Contador de días juntos

---

## 🗄️ Database Schema

La base de datos tiene 3 tablas principales:

### `users`
- Información de usuarios
- Presencia (online/offline)
- Push token para notificaciones

### `chats`
- Chats entre usuarios (solo directos, sin grupos)
- Último mensaje
- Contador de no leídos

### `messages`
- Mensajes cifrados
- Estados (sent/delivered/read)
- Multimedia (URLs)

Ver `database_schema.sql` para el schema completo.

---

## 🏗️ Estructura del Proyecto

```
cerlita-chat/
├── app/                      # Expo Router (pantallas)
│   ├── (auth)/               # Autenticación
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (chat)/               # Chats
│   │   ├── index.tsx         # Lista de chats
│   │   └── [chatId].tsx      # Chat individual
│   └── _layout.tsx           # Root layout
├── src/
│   ├── components/           # Componentes reutilizables
│   ├── hooks/                # Custom hooks
│   ├── services/             # Servicios (Supabase, crypto)
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript types
│   ├── config/               # Configuración (theme, env)
│   └── utils/                # Utilidades
├── assets/                   # Imágenes, fonts, etc.
├── database_schema.sql       # Schema de Supabase
├── app.json                  # Expo config
├── package.json
└── README.md
```

---

## 🔐 Seguridad

### Cifrado E2E
- **Algoritmo:** AES-256-GCM
- **Claves:** Generadas por chat con expo-crypto
- **Almacenamiento:** expo-secure-store (keystore del dispositivo)
- **IV:** 96 bits aleatorio por mensaje

### Row Level Security (RLS)
Todas las tablas tienen RLS activado:
- Solo ves tu propio perfil
- Solo ves chats donde eres miembro
- Solo ves mensajes de tus chats

---

## 🎨 Tema

La app usa un tema romántico con colores:
- **Primario:** Rosa (#FF69B4)
- **Secundario:** Gris Koala (#8E8E93)
- **Mensaje enviado:** Rosa
- **Mensaje recibido:** Gris claro

Ver `src/config/theme.ts` para configuración completa.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests con coverage
npm test -- --coverage
```

---

## 🚀 Deploy

### Build con EAS (Expo Application Services)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar build
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build para producción
eas build --platform android --profile production
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es privado.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa que las credenciales en `.env` sean correctas
2. Verifica que ejecutaste el SQL en Supabase
3. Asegúrate de tener Node.js v18+
4. Limpia caché: `npm start -- --clear`

### Errores comunes:

| Error | Solución |
|-------|----------|
| "Supabase credentials not configured" | Copia `.env.example` a `.env` y agrega credenciales |
| "Failed to load chats" | Verifica que las tablas existen en Supabase |
| "Module not found" | Ejecuta `npm install` |

---

## 🔗 Recursos

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Última actualización:** 2026-04-05
**Versión:** 1.0.0

💕🚀
