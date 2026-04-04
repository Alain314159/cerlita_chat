---
title: Supabase Client Setup (v3.2.0)
description: How to initialize and configure the Supabase Kotlin client
source: https://supabase.com/docs/reference/kotlin/introduction
---

# Supabase Client Initialization (supabase-kt 3.2.0)

## Basic Setup

```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage

val client = createSupabaseClient(
    supabaseUrl = "https://your-project.supabase.co",
    supabaseKey = "your-anon-key"
) {
    install(Postgrest)
    install(Auth) {
        autoSaveToStorage = true
        flowType = FlowType.PKCE
    }
    install(Realtime)
    install(Storage)
}
```

## Accessing Modules

```kotlin
// ✅ All use extension properties
val auth = client.auth
val db = client.postgrest
val realtime = client.realtime
val storage = client.storage

// ❌ These are WRONG
val auth = client.plugin(Auth)
val db = client.plugin(Postgrest)
val realtime = client.plugin(Realtime)
val storage = client.plugin(Storage)
```

## HTTP Configuration

```kotlin
createSupabaseClient(url, key) {
    install(Postgrest)
    install(Auth)
    install(Realtime)
    install(Storage)
    
    httpConfig {
        install(io.ktor.client.plugins.HttpTimeout) {
            requestTimeoutMillis = 30000L
        }
    }
}
```

## Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Kotlin | 2.2.0 | Required by supabase-kt 3.2.0 |
| Ktor | 3.2.0 | Required by supabase-kt 3.2.0 |
| supabase-kt | 3.2.0 | Latest on Maven Central |
| Gradle | 8.14.3 | Compatible with Kotlin 2.2.0 |
| KSP | 2.2.0-2.0.2 | Compatible with Kotlin 2.2.0 |
| AGP | 8.9.0 | Android Gradle Plugin |

## Dependency Declaration

```kotlin
// In libs.versions.toml
[versions]
supabase = "3.2.0"
ktor = "3.2.0"
kotlin = "2.2.0"

// In build.gradle.kts
implementation(platform("io.github.jan-tennert.supabase:bom:3.2.0"))
implementation("io.github.jan-tennert.supabase:supabase-kt:3.2.0")
implementation("io.github.jan-tennert.supabase:auth-kt:3.2.0")
implementation("io.github.jan-tennert.supabase:postgrest-kt:3.2.0")
implementation("io.github.jan-tennert.supabase:realtime-kt:3.2.0")
implementation("io.github.jan-tennert.supabase:storage-kt:3.2.0")

// Ktor (required by Supabase)
implementation("io.ktor:ktor-client-android:3.2.0")
implementation("io.ktor:ktor-client-core:3.2.0")
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `client.plugin(Auth)` | `client.auth` |
| `client.plugin(Postgrest)` | `client.postgrest` |
| Supabase 3.4.1 | Doesn't exist on Maven Central. Latest is 3.2.0 |
| Ktor 3.3.0 | Doesn't exist on Maven Central. Latest is 3.2.0 |
