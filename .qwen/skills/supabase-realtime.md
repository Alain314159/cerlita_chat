---
title: Supabase Realtime - Official API (v3.2.0)
description: Official documentation for Supabase Kotlin SDK Realtime module
source: https://supabase.com/docs/reference/kotlin/subscribe
---

# Supabase Realtime - Official API Reference (supabase-kt 3.2.0)

## Imports

```kotlin
// Wildcard import (recommended - covers all Realtime APIs)
import io.github.jan.supabase.realtime.*

// Extension property
import io.github.jan.supabase.realtime.realtime

// For callbackFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.launch
```

## Accessing Realtime

```kotlin
val realtime = client.realtime

// ❌ WRONG
val realtime = client.plugin(Realtime)
```

## Channel Creation

```kotlin
// ✅ CORRECT format - channelId is "database:public:tableName"
val channel = realtime.channel("tableName:public:tableName")

// Examples:
val channel = realtime.channel("chats:public:chats")
val channel = realtime.channel("users:public:users")
val channel = realtime.channel("messages:public:messages")
```

## Subscribing

```kotlin
channel.subscribe()  // Non-blocking
// OR
channel.subscribe(blockUntilSubscribed = true)  // Blocking
```

## Listening to Changes

### Method 1: Flow collection (recommended)

```kotlin
val changeFlow = channel.postgresChangeFlow<Chat>(schema = "public") {
    table = "chats"
}

// Collect in coroutine scope
coroutineScope.launch {
    changeFlow.collect { chat ->
        // chat is already decoded as Chat type
        if (chat.id == targetId) {
            // Handle change
        }
    }
}
```

### Method 2: callbackFlow pattern

```kotlin
fun observeChats(uid: String): Flow<List<Chat>> = callbackFlow {
    val channel = realtime.channel("chats:public:chats")

    val changeFlow = channel.postgresChangeFlow<Chat>(schema = "public") {
        table = "chats"
    }

    channel.subscribe()

    // Load initial data
    launch {
        val initialChats = loadChatsForUser(uid)
        trySend(initialChats)
    }

    // Listen for changes
    val job = launch {
        changeFlow.collect { chat ->
            // chat is already decoded, no need for Json.decodeFromJsonElement
            if (chat.id == targetId) {
                trySend(chat)
            }
        }
    }

    awaitClose {
        job.cancel()
        realtime.removeChannel(channel)
    }
}
```

## PostgresAction Types (if using non-typed flow)

```kotlin
val changeFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
    table = "users"
}

changeFlow.collect { action ->
    when (action) {
        is PostgresAction.Insert -> println("Inserted: ${action.record}")
        is PostgresAction.Update -> println("Updated: ${action.record}")
        is PostgresAction.Delete -> println("Deleted: ${action.oldRecord}")
        is PostgresAction.Select -> println("Selected: ${action.record}")
    }
}
```

## Unsubscribing

```kotlin
realtime.removeChannel(channel)
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `channelV2("public", "table")` | `channel("table:public:table")` |
| `postgrestChangeFlow` | `postgresChangeFlow` (no 't' before gress) |
| `channel.postgresChangeFlow<Message>()` | `channel.postgresChangeFlow<Message>(schema = "public") { table = "messages" }` |
| `Json.decodeFromJsonElement<T>(change.record)` | Just use the typed flow: `channel.postgresChangeFlow<T>()` |
| `realtime.channel("public", "table")` | `realtime.channel("table:public:table")` |
| `import io.github.jan.supabase.realtime.v2.*` | `import io.github.jan.supabase.realtime.*` |
