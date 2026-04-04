# 🧩 Extensiones Recomendidas para Qwen Code

Este documento lista todas las extensiones, MCP servers y skills instalados o recomendados para este proyecto Android/Kotlin.

---

## ✅ Extensiones Instaladas

### 1. GitHub MCP Server
- **Qué hace:** Integra GitHub directamente en Qwen Code. Permite consultar repos, issues, PRs, y más.
- **Instalado vía:** `qwen extensions install https://github.com/github/github-mcp-server`
- **Configuración:** En `~/.qwen/settings.json` → `mcpServers.github`
- **Útil para:** Revisar PRs, issues, y el historial del repo sin salir del terminal.

### 2. Context7 MCP
- **Qué hace:** Provee documentación actualizada de librerías y frameworks directamente al agente. Reduce alucinaciones de código.
- **Paquete:** `@upstash/context7-mcp` (v2.1.6)
- **Configuración:** En `~/.qwen/settings.json` → `mcpServers.context7`
- **Útil para:** Consultar docs de Supabase, Ktor, Room, Compose, Kotlin Coroutines sin salir del CLI.

### 3. Sequential Thinking MCP
- **Qué hace:** Permite al agente razonar de forma estructurada y paso a paso antes de tomar decisiones de código.
- **Paquete:** `@modelcontextprotocol/server-sequential-thinking`
- **Configuración:** En `~/.qwen/settings.json` → `mcpServers.sequential-thinking`
- **Útil para:** Debugging complejo, diseño de arquitectura, y resolución de errores de compilación.

---

## 🔧 Skills Built-in de Qwen Code

Estos ya vienen con Qwen Code y están activos por defecto:

| Skill | Descripción |
|-------|-------------|
| **Subagents** | Delegar tareas específicas a agentes especializados |
| **Plan Mode** | Planificar tareas complejas antes de ejecutar |
| **File Operations** | Leer, escribir, editar, buscar archivos |
| **Shell Execution** | Ejecutar comandos de terminal |
| **Web Fetch** | Obtener contenido web |
| **LSP Integration** | Análisis de código y navegación |

---

## 📱 Extensiones Recomendadas (No Instaladas Automáticamente)

### Para Android/Kotlin Development

| Extensión | Fuente | Qué Hace | Cómo Instalar |
|-----------|--------|----------|---------------|
| **Android Dev Assistant** | Claude Code Plugin | 7 agents + 7 skills para Android, Kotlin, Jetpack Compose, Room, testing | `/plugin install android-development-assistant@pluginagentmarketplace-android` |
| **Kotlin Build Resolver** | ClawHub | `/kotlin-build` - Diagnostica y corrige errores de Gradle, Detekt, ktlint | `npx clawhub@latest install kotlin-build-resolver` |
| **Everything Mobile** | ClaudePluginHub | 35 commands + 27 agents para Android/iOS/KMP | `npx claudepluginhub ahmed3elshaer/everything-claude-code-mobile` |
| **ADB Control** | Gemini CLI Extension | Control de emuladores Android vía ADB desde CLI | `gemini extensions install https://github.com/tiendung2k03/adb-control-gemini` |

### Para Code Quality y CI/CD

| Extensión | Fuente | Qué Hace | Cómo Instalar |
|-----------|--------|----------|---------------|
| **Code Review Multi-Agent** | Agent Teams | Review paralelo con múltiples agentes | Disponible en ClawHub |
| **Detekt/KtLint Auto-Fix** | Kotlin Build Resolver | Corrige automáticamente violaciones de código | Incluido en Kotlin Build |

### Para Base de Datos

| Extensión | Fuente | Qué Hace | Cómo Instalar |
|-----------|--------|----------|---------------|
| **Database MCP** | Bytebase/dbhub | Conecta a PostgreSQL, MySQL, SQLite, DuckDB | `qwen extensions install https://github.com/bytebase/dbhub` |

---

## 🚀 Configuración Actual

Los MCP servers configurados en `~/.qwen/settings.json`:

```json
{
  "mcpServers": {
    "github": { "url": "https://api.githubcopilot.com/mcp/" },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] }
  }
}
```

---

## 📋 Comandos Útiles

```bash
# Ver extensiones instaladas
qwen extensions list

# Instalar una extensión desde GitHub
qwen extensions install https://github.com/author/repo

# Desinstalar una extensión
qwen extensions uninstall <nombre>

# Ver skills disponibles
/skills

# Ver agentes disponibles
/agents
```

---

**Última actualización:** 2026-04-04
**Versión del proyecto:** 2.5-supabase-fcm
