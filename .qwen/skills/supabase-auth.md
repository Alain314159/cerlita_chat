---
title: Supabase Auth - Official API (v3.2.0)
description: Official documentation for Supabase Kotlin SDK Auth module
source: https://supabase.com/docs/reference/kotlin
---

# Supabase Auth - Official API Reference (supabase-kt 3.2.0)

## Imports

```kotlin
// Core auth
import io.github.jan.supabase.auth.auth          // Extension property: client.auth
import io.github.jan.supabase.auth.providers.builtin.Email     // Email provider
import io.github.jan.supabase.auth.providers.builtin.IDToken   // IDToken provider
import io.github.jan.supabase.auth.providers.Google            // OAuth provider
```

## Initialization

```kotlin
createSupabaseClient(
    supabaseUrl = "...",
    supabaseKey = "..."
) {
    install(Auth) {
        autoSaveToStorage = true
        flowType = FlowType.PKCE
    }
}
```

## Accessing Auth

```kotlin
// ✅ CORRECT - Extension property
val auth = client.auth

// ❌ WRONG - plugin() is deprecated/removed
val auth = client.plugin(Auth)
```

## SignUp with Email

```kotlin
// ✅ CORRECT - DSL block with this. prefix to avoid shadowing
val userInfo = auth.signUpWith(Email) {
    this.email = "user@example.com"
    this.password = "securePassword"
}
// signUpWith returns UserInfo in v3.x, not AuthResponse
val uid = userInfo.id
```

**Key points:**
- `signUpWith(Email)` takes a DSL block, NOT constructor arguments
- Returns `UserInfo` (not `AuthResponse`), access `.id` directly
- Use `this.email` and `this.password` to avoid shadowing with local variables

## SignIn with Email/Password

```kotlin
// ✅ CORRECT - DSL block
auth.signInWith(Email) {
    this.email = email
    this.password = password
}

val session = auth.currentSessionOrNull()
val user = auth.currentUserOrNull()
val uid = user?.id
```

**Key points:**
- `signInWith(Email)` takes a DSL block, NOT constructor arguments
- `this.email` and `this.password` needed to avoid shadowing
- Returns nothing on success, throws exception on failure
- Use `currentSessionOrNull()` or `currentUserOrNull()` after

## SignIn with IDToken (Google, Apple, etc.)

```kotlin
// ✅ CORRECT - DSL block
auth.signInWith(IDToken) {
    idToken = googleToken   // Can use without this. (no shadowing)
    provider = Google       // or Apple, Azure, Facebook
    nonce = null            // optional
}
```

**Key points:**
- `signInWith(IDToken)` takes a DSL block
- `idToken` parameter in DSL ≠ local variable name — rename local var if needed
- `provider` is a property in the DSL

## SignOut

```kotlin
auth.signOut()
```

## Password Reset

```kotlin
auth.resetPasswordForEmail("user@example.com")
```

## Session Management

```kotlin
val session = auth.currentSessionOrNull()  // Returns Session? or null
val user = auth.currentUserOrNull()        // Returns User? or null
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `signUpWith(Email(email, password))` | `signUpWith(Email) { this.email = email; this.password = password }` |
| `signInWith(Email(email, password))` | `signInWith(Email) { this.email = email; this.password = password }` |
| `authResult.user?.id` | `authResult.id` (signUpWith returns UserInfo) |
| `client.plugin(Auth)` | `client.auth` |
| `val idToken = ...; signInWith(IDToken) { idToken = idToken }` | Rename: `val googleToken = ...; signInWith(IDToken) { idToken = googleToken }` |
