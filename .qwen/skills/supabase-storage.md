---
title: Supabase Storage - Official API (v3.2.0)
description: Official documentation for Supabase Kotlin SDK Storage module
source: https://supabase.com/docs/reference/kotlin/storage
---

# Supabase Storage - Official API Reference (supabase-kt 3.2.0)

## Imports

```kotlin
import io.github.jan.supabase.storage.storage  // Extension property
```

## Accessing Storage

```kotlin
val storage = client.storage

// ❌ WRONG
val storage = client.plugin(Storage)
```

## Getting a Bucket

```kotlin
val bucket = storage.from("bucket-name")
```

## Upload

```kotlin
bucket.upload(path, bytes) {
    upsert = true  // Overwrite if exists
    contentType = "image/jpeg"  // Optional
}

// With DSL config
bucket.upload(path, data) {
    this.contentType = "image/png"
    this.upsert = false
    this.cacheControl = "3600"
}
```

## Download

```kotlin
val bytes: ByteArray = bucket.download(path)
```

## Delete

```kotlin
bucket.delete(path)
// OR multiple
bucket.delete(listOf("path1", "path2"))
```

## Public URL

```kotlin
val url = bucket.publicUrl(path)
```

## Signed URL (temporary access)

```kotlin
val signedUrl = bucket.createSignedUrl(
    path,
    expiresIn = 7 * 24 * 60 * 60  // 7 days in seconds
)
```

## List Files

```kotlin
val files = bucket.list(path = "folder/")
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `client.plugin(Storage)` | `client.storage` |
| `bucket.upload(path, bytes)` without DSL | `bucket.upload(path, bytes) { contentType = "..." }` |
| `bucket.getUrl(path)` | `bucket.publicUrl(path)` |
