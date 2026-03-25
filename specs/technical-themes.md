# Especificaciones Técnicas - Sistema de Temas

## Arquitectura

### Patrón: Repository + StateFlow

```
UI (Compose)
  ↓
ThemeViewModel (StateFlow<ThemeState>)
  ↓
ThemeRepository
  ↓
├── ThemeDataSource (colores predefinidos)
├── ImageColorExtractor (tema desde imagen)
└── ThemePreferences (persistencia)
```

---

## Stack Técnico

### Componentes Principales

**Theme Data Classes:**
```kotlin
data class ThemeConfig(
    val id: String,
    val name: String,
    val type: ThemeType,
    val colors: ColorScheme,
    val isCustom: Boolean = false,
    val imageUri: String? = null
)

enum class ThemeType {
    LIGHT,
    DARK,
    PIG,          // Cerdita
    KOALA,
    MIXED,        // Koala + Cerdita
    CUSTOM_IMAGE
}

data class ColorScheme(
    val primary: Color,
    val onPrimary: Color,
    val secondary: Color,
    val onSecondary: Color,
    val background: Color,
    val onBackground: Color,
    val surface: Color,
    val onSurface: Color,
    val error: Color,
    val onError: Color
)
```

**Repository Interface:**
```kotlin
interface ThemeRepository {
    fun getThemes(): Flow<List<ThemeConfig>>
    fun getCurrentTheme(): Flow<ThemeConfig>
    suspend fun setTheme(themeId: String)
    suspend fun updateColors(themeId: String, colors: ColorScheme)
    suspend fun createThemeFromImage(imageUri: Uri): Result<ThemeConfig>
    suspend fun deleteCustomTheme(themeId: String)
}
```

---

## Modelos de Datos

### Base de Datos (Room)

```kotlin
@Entity(tableName = "themes")
data class ThemeEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: String,
    val primaryColor: Int,
    val onPrimaryColor: Int,
    val secondaryColor: Int,
    val onSecondaryColor: Int,
    val backgroundColor: Int,
    val onBackgroundColor: Int,
    val surfaceColor: Int,
    val onSurfaceColor: Int,
    val errorColor: Int,
    val onErrorColor: Int,
    val isCustom: Boolean,
    val imageUri: String?,
    val createdAt: Long,
    val updatedAt: Long
)
```

---

## Implementación Detallada

### 1. Theme Colors (Colores Predefinidos)

```kotlin
object ThemeColors {
    // Tema Claro
    val lightColors = ColorScheme(
        primary = Color(0xFF1976D2),
        onPrimary = Color.White,
        secondary = Color(0xFF03DAC6),
        onSecondary = Color.Black,
        background = Color(0xFFFAFAFA),
        onBackground = Color(0xFF212121),
        surface = Color.White,
        onSurface = Color(0xFF212121),
        error = Color(0xFFB00020),
        onError = Color.White
    )
    
    // Tema Oscuro
    val darkColors = ColorScheme(
        primary = Color(0xFF90CAF9),
        onPrimary = Color(0xFF0D47A1),
        secondary = Color(0xFF03DAC6),
        onSecondary = Color.Black,
        background = Color(0xFF121212),
        onBackground = Color.White,
        surface = Color(0xFF1E1E1E),
        onSurface = Color.White,
        error = Color(0xFFCF6679),
        onError = Color.Black
    )
    
    // Tema Cerdita (Pig)
    val pigColors = ColorScheme(
        primary = Color(0xFFFF69B4),      // Hot Pink
        onPrimary = Color.White,
        secondary = Color(0xFFFFB6C1),    // Light Pink
        onSecondary = Color(0xFF8B4513),  // Brown
        background = Color(0xFFFFF0F5),   // Lavender Blush
        onBackground = Color(0xFF8B4513),
        surface = Color(0xFFFFE4E1),      // Misty Rose
        onSurface = Color(0xFF8B4513),
        error = Color(0xFFDC143C),        // Crimson
        onError = Color.White
    )
    
    // Tema Koala
    val koalaColors = ColorScheme(
        primary = Color(0xFF546E7A),      // Blue Grey
        onPrimary = Color.White,
        secondary = Color(0xFF4CAF50),    // Eucalyptus Green
        onSecondary = Color.White,
        background = Color(0xFFECEFF1),   // Blue Grey Light
        onBackground = Color(0xFF263238),
        surface = Color(0xFFCFD8DC),      // Grey Light
        onSurface = Color(0xFF263238),
        error = Color(0xFFB00020),
        onError = Color.White
    )
    
    // Tema Mixto (Koala + Cerdita)
    val mixedColors = ColorScheme(
        primary = Color(0xFFFF69B4),      // Pink (Pig)
        onPrimary = Color.White,
        secondary = Color(0xFF546E7A),    // Blue Grey (Koala)
        onSecondary = Color.White,
        background = Color(0xFFFFF0F5),   // Lavender Blush (Pig)
        onBackground = Color(0xFF263238), // Dark (Koala)
        surface = Color(0xFFE3F2FD),      // Light Blue (Mix)
        onSurface = Color(0xFF263238),
        error = Color(0xFFDC143C),
        onError = Color.White
    )
}
```

### 2. Image Color Extraction

```kotlin
class ImageColorExtractor {
    /**
     * Extrae colores dominantes de una imagen usando Palette API
     * 
     * @param imageUri URI de la imagen
     * @return Result con ColorScheme o error
     */
    suspend fun extractColors(imageUri: Uri): Result<ColorScheme> {
        return try {
            val bitmap = loadImageBitmap(imageUri)
            val palette = Palette.from(bitmap).generate()
            
            // Extraer colores de Palette
            val dominant = palette.dominantSwatch?.rgb ?: Color.BLACK
            val vibrant = palette.vibrantSwatch?.rgb ?: dominant
            val muted = palette.mutedSwatch?.rgb ?: dominant
            
            // Generar ColorScheme basado en colores extraídos
            val colorScheme = generateColorSchemeFromColors(
                dominant = Color(dominant),
                vibrant = Color(vibrant),
                muted = Color(muted)
            )
            
            Result.success(colorScheme)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun generateColorSchemeFromColors(
        dominant: Color,
        vibrant: Color,
        muted: Color
    ): ColorScheme {
        // Algoritmo para generar esquema de colores accesible
        // Basado en color theory y WCAG contrast requirements
        return ColorScheme(
            primary = vibrant,
            onPrimary = getContrastingColor(vibrant),
            secondary = muted,
            onSecondary = getContrastingColor(muted),
            background = dominant.copy(alpha = 0.1f),
            onBackground = getContrastingColor(dominant),
            surface = dominant.copy(alpha = 0.2f),
            onSurface = getContrastingColor(dominant),
            error = Color(0xFFB00020),
            onError = Color.White
        )
    }
    
    private fun getContrastingColor(color: Color): Color {
        // Calcular luminancia y retornar blanco o negro según contraste
        val luminance = color.luminance()
        return if (luminance > 0.5) Color.Black else Color.White
    }
}
```

### 3. Theme Preferences (Persistencia)

```kotlin
class ThemePreferences @Inject constructor(
    private val context: Context,
    private val dataStore: DataStore<Preferences>
) {
    private val THEME_ID_KEY = stringPreferencesKey("theme_id")
    
    val currentThemeId: Flow<String> = dataStore.data
        .map { preferences ->
            preferences[THEME_ID_KEY] ?: "light"
        }
    
    suspend fun setThemeId(themeId: String) {
        dataStore.edit { preferences ->
            preferences[THEME_ID_KEY] = themeId
        }
    }
}
```

---

## UI Components (Compose)

### Theme Screen

```kotlin
@Composable
fun ThemeScreen(
    viewModel: ThemeViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    
    LazyColumn {
        // Temas predefinidos
        items(state.predefinedThemes) { theme ->
            ThemeItem(
                theme = theme,
                isSelected = theme.id == state.currentThemeId,
                onClick = { viewModel.setTheme(theme.id) }
            )
        }
        
        // Tema personalizado desde imagen
        item {
            CreateThemeFromImageCard(
                onImageSelected = { uri ->
                    viewModel.createThemeFromImage(uri)
                }
            )
        }
        
        // Personalizar colores del tema actual
        item {
            CustomizeColorsCard(
                currentColors = state.currentColors,
                onColorChanged = { colorType, color ->
                    viewModel.updateColor(colorType, color)
                },
                onReset = { viewModel.resetToThemeDefaults() }
            )
        }
    }
}
```

### Theme Preview

```kotlin
@Composable
fun ThemePreview(theme: ThemeConfig) {
    MaterialTheme(
        colorScheme = theme.colors.toMaterialColorScheme()
    ) {
        // Vista previa de componentes con el tema
        Surface {
            Column {
                TopAppBar(title = { Text("Preview") })
                FloatingActionButton(onClick = {}) {
                    Icon(Icons.Default.Add, contentDescription = "Add")
                }
                // Más componentes de preview
            }
        }
    }
}
```

---

## Validación de Contraste (WCAG 2.1)

```kotlin
object ContrastValidator {
    /**
     * Valida que dos colores cumplen con WCAG 2.1 AA (ratio > 4.5:1)
     */
    fun validateContrast(foreground: Color, background: Color): ContrastResult {
        val ratio = calculateContrastRatio(foreground, background)
        return ContrastResult(
            passes = ratio >= 4.5f,
            ratio = ratio,
            level = when {
                ratio >= 7.0f -> "AAA"
                ratio >= 4.5f -> "AA"
                ratio >= 3.0f -> "AA Large"
                else -> "Fail"
            }
        )
    }
    
    private fun calculateContrastRatio(c1: Color, c2: Color): Float {
        val l1 = c1.luminance()
        val l2 = c2.luminance()
        val lighter = maxOf(l1, l2)
        val darker = minOf(l1, l2)
        return (lighter + 0.05f) / (darker + 0.05f)
    }
}
```

---

## Testing Strategy

### Unit Tests
- ThemeRepository: CRUD de temas
- ImageColorExtractor: Extracción de colores
- ContrastValidator: Validación de contraste
- ThemePreferences: Persistencia

### Integration Tests
- ThemeViewModel + Repository
- Room Database para temas
- DataStore para preferencias

### UI Tests (Compose)
- ThemeScreen: Selección de temas
- ThemePreview: Vista previa correcta
- ColorPicker: Personalización de colores

---

## Dependencias

```kotlin
dependencies {
    // Palette para extracción de colores
    implementation("androidx.palette:palette:1.0.0")
    
    // DataStore para preferencias
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Room para base de datos de temas
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    
    // Compose Theming
    implementation(platform("androidx.compose:compose-bom:2023.10.00"))
    implementation("androidx.compose.material3:material3")
}
```

---

**Última Actualización:** 2026-03-24
**Estado:** ⏳ Pendiente de implementación
**Próxima Revisión:** 2026-03-31
