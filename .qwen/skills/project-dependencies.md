---
title: Cerlita Chat - Project Dependencies & Versions
description: Official verified versions for this project (checked against Maven Central)
source: Verified against Maven Central API 2026-04-04
---

# Project Dependencies - Verified Versions

## Build Configuration

| Dependency | Version | Verified? | Notes |
|------------|---------|-----------|-------|
| Kotlin | 2.2.0 | ✅ | Required by supabase-kt 3.2.0 |
| AGP | 8.9.0 | ✅ | Android Gradle Plugin |
| Gradle | 8.14.3 | ✅ | Compatible with Kotlin 2.2.0 |
| KSP | 2.2.0-2.0.2 | ✅ | Matches Kotlin 2.2.0 |
| compileSdk | 35 | ✅ | |
| minSdk | 26 | ✅ | |
| targetSdk | 35 | ✅ | |

## Supabase (verified on Maven Central)

| Dependency | Version | Exists? |
|------------|---------|---------|
| supabase-bom | 3.2.0 | ✅ |
| supabase-kt | 3.2.0 | ✅ |
| auth-kt | 3.2.0 | ✅ |
| postgrest-kt | 3.2.0 | ✅ |
| realtime-kt | 3.2.0 | ✅ |
| storage-kt | 3.2.0 | ✅ |

**WARNING:** Versions 3.3.0, 3.4.0, 3.4.1 DO NOT exist on Maven Central!

## Ktor (verified on Maven Central)

| Dependency | Version | Exists? |
|------------|---------|---------|
| ktor-client-android | 3.2.0 | ✅ |
| ktor-client-core | 3.2.0 | ✅ |
| ktor-client-content-negotiation | 3.2.0 | ✅ |
| ktor-serialization-kotlinx-json | 3.2.0 | ✅ |
| ktor-client-websockets | 3.2.0 | ✅ |
| ktor-client-plugins | 3.1.1 | ✅ (3.2.0 does NOT exist for this artifact) |

## Other Dependencies

| Dependency | Version |
|------------|---------|
| Room | 2.6.1 |
| Coil | 2.7.0 |
| Firebase BOM | 34.11.0 |
| Kotlinx Serialization JSON | 1.8.1 |
| Kotlinx Coroutines | 1.10.2 |
| Compose BOM | 2025.02.00 |
| Navigation Compose | 2.8.8 |

## Critical Auth Provider Imports

```kotlin
// Email and IDToken are in .builtin subpackage
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.IDToken
import io.github.jan.supabase.auth.providers.Google
```

## Critical Filter Import

```kotlin
// This import is REQUIRED in EVERY file that uses filter operators
import io.github.jan.supabase.postgrest.query.filter.*
```

## Critical Realtime Import

```kotlin
// Use wildcard for all Realtime APIs
import io.github.jan.supabase.realtime.*
```

## How to Verify a Version

```bash
# Check if a version exists on Maven Central
curl -s "https://search.maven.org/solrsearch/select?q=g:GROUP+AND+a:ARTIFACT&rows=5&wt=json&core=gav"
```
