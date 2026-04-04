---
title: Jetpack Compose UI - Official API
description: Official imports and syntax for Jetpack Compose with Material3
source: https://developer.android.com/jetpack/compose
---

# Jetpack Compose - Official API Reference

## Essential Layout Imports

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
```

## Modifier Extension Functions (NOT standalone functions)

```kotlin
// ✅ CORRECT - Modifier chaining
Modifier
    .fillMaxWidth()
    .padding(16.dp)
    .width(200.dp)
    .height(100.dp)
    .size(50.dp)
    .weight(1f)  // Inside Column/Row scope

// ❌ WRONG - standalone calls (compiler error: "cannot be invoked as a function")
fillMaxWidth()  // Missing Modifier.
width(200.dp)   // Missing Modifier.
weight(1f)      // Missing Modifier.
```

## MutableState Delegation

```kotlin
// ✅ CORRECT - need BOTH imports for by delegation
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

var showMenu by remember { mutableStateOf(false) }

// ❌ WRONG - missing getValue/setValue imports
var showMenu by remember { mutableStateOf(false) }  // Fails without the imports
```

## Compose Runtime

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
```

## Material3 Components

```kotlin
import androidx.compose.material3.*
// Includes: Button, Text, OutlinedTextField, Scaffold, TopAppBar, etc.

// Experimental APIs need @OptIn
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyScreen() { ... }
```

## Icons

```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.AttachFile
```

## Image/Shape

```kotlin
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import coil.compose.AsyncImage
import coil.request.ImageRequest
```

## Common Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `fillMaxWidth()` | `Modifier.fillMaxWidth()` |
| `weight(1f)` outside Column/Row | `Modifier.weight(1f)` inside `Column { }` or `Row { }` scope |
| `var x by mutableStateOf(0)` without imports | Add `import androidx.compose.runtime.getValue` and `import androidx.compose.runtime.setValue` |
| Using experimental Material3 without @OptIn | Add `@OptIn(ExperimentalMaterial3Api::class)` |
| `clip(CircleShape)` without import | `import androidx.compose.ui.draw.clip` |
