---
title: Supabase PostgREST - Official API (v3.2.0)
description: Official documentation for Supabase Kotlin SDK PostgREST module with filter DSL
source: https://supabase.com/docs/reference/kotlin/select
---

# Supabase PostgREST - Official API Reference (supabase-kt 3.2.0)

## Imports

```kotlin
// Extension property
import io.github.jan.supabase.postgrest.postgrest  // client.postgrest

// Filter operators (CRITICAL - needed for all queries)
import io.github.jan.supabase.postgrest.query.filter.*
// OR individual imports:
import io.github.jan.supabase.postgrest.query.filter.eq
import io.github.jan.supabase.postgrest.query.filter.neq
import io.github.jan.supabase.postgrest.query.filter.isNull
import io.github.jan.supabase.postgrest.query.filter.gt
import io.github.jan.supabase.postgrest.query.filter.gte
import io.github.jan.supabase.postgrest.query.filter.lt
import io.github.jan.supabase.postgrest.query.filter.lte
import io.github.jan.supabase.postgrest.query.filter.contains
import io.github.jan.supabase.postgrest.query.filter.not
import io.github.jan.supabase.postgrest.query.filter.and
import io.github.jan.supabase.postgrest.query.filter.or
```

## Accessing PostgREST

```kotlin
// ✅ CORRECT
val db = client.postgrest

// ❌ WRONG
val db = client.plugin(Postgrest)
```

## Select Query

```kotlin
val results = db.from("table_name")
    .select {
        // Filter operators
        eq("column", value)
        neq("column", value)
        isNull("column")
        gt("column", value)
        gte("column", value)
        lt("column", value)
        lte("column", value)
        contains("array_column", listOf("a", "b"))
        
        // Logical operators
        not { eq("active", false) }
        and {
            eq("country", "UK")
            gt("population", 50_000)
        }
        or {
            eq("region", "north")
            eq("region", "south")
        }
    }
    .decodeSingle<User>()      // Returns single result, throws if none found
    .decodeSingleOrNull<User>() // Returns single or null
    .decodeList<User>()         // Returns list
```

## Insert

```kotlin
db.from("table_name").insert(
    mapOf(
        "column1" to value1,
        "column2" to value2
    )
)
```

## Update

```kotlin
db.from("table_name").update(
    mapOf(
        "column1" to newValue1,
        "column2" to newValue2
    )
) {
    // Filter which rows to update
    filter {
        eq("id", targetId)
    }
}
```

## Delete

```kotlin
db.from("table_name").delete {
    filter {
        eq("id", targetId)
    }
}
```

## Order (Sorting)

```kotlin
val results = db.from("messages")
    .select {
        eq("chat_id", chatId)
        order("created_at" to true)   // ASC - oldest first
        order("created_at" to false)  // DESC - newest first
    }
    .decodeList<Message>()
```

**Note:** `order()` takes a `Pair<String, Boolean>` - `to` creates the pair.

## Pagination

```kotlin
val results = db.from("messages")
    .select {
        eq("chat_id", chatId)
        order("created_at" to false)
        range(from, to)  // Inclusive range
        // OR:
        limit(10)
    }
    .decodeList<Message>()
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `client.plugin(Postgrest)` | `client.postgrest` |
| `order("col", true)` | `order("col" to true)` (Pair) |
| `filter { and(eq("a",1), eq("b",2)) }` | `filter { and { eq("a",1); eq("b",2) } }` |
| Missing `import io.github.jan.supabase.postgrest.query.filter.*` | Always include this import |
| `eq` not found | Need `import io.github.jan.supabase.postgrest.query.filter.*` |
