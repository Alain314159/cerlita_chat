# Arquitectura Estratégica Cerlita Chat (2026)

## 🏗 Estructura del Sistema
La aplicación sigue un patrón de **Inversión de Dependencias** y **Clean Architecture**.

### 1. Capa de Datos (Supabase)
- **Zero-Trust RLS:** Políticas estrictas basadas en `participant_ids`.
- **Backend Reactivo:** Triggers en Postgres para creación automática de chats tras aceptación de solicitudes.
- **Handshake Flow:** Las conversaciones requieren aceptación mutua antes de permitir el flujo de mensajes.

### 2. Capa de Negocio (Services)
- **AuthService:** Gestión agnóstica de sesiones.
- **MessageService:** Orquestación de CRUD de mensajes y suscripciones Realtime.
- **EncryptionService (Maestro 2026):** Cifrado E2E asíncrono para texto y binarios (AES-GCM 256).
- **Zero-Knowledge Storage:** Las fotos y videos se cifran en el origen; Supabase Storage solo aloja ciphertext ilegible.

### 3. Capa de Estado y UI (Stores & Hooks)
- **Zustand:** Maneja el estado global de la interfaz (UI State).
- **TanStack Query:** Maneja el estado del servidor (Server State).
- **Media Cache:** Capa dedicada para evitar descifrados redundantes de archivos pesados.
- **Offline-First:** Sincronización automática con `AsyncStorage` y mutaciones optimistas.

## 🔒 Privacidad y Seguridad
- **Mensajes Efímeros:** Autodestrucción en 24h.
- **Visualización Única:** Mensajes que se "queman" (sobrescritura de datos) tras la primera lectura.
- **Sentry Shield:** Monitoreo proactivo de fallos en acciones críticas.

## 🚀 Optimización
- **Nueva Arquitectura:** Fabric y TurboModules activados.
- **Peso de App:** < 40MB garantizado por limpieza de assets y Metro Config optimizado.
- **Eficiencia Energética:** Uso de Realtime con filtros de canal para evitar consumo excesivo de radio/batería.
