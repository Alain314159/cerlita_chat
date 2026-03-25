package com.example.messageapp.model

import androidx.compose.ui.graphics.Color

/**
 * Colores predefinidos para cada tema
 */
object ThemeColors {
    
    /**
     * Tema Claro (Light Theme)
     * Colores claros para buena visibilidad en ambientes iluminados
     */
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
    
    /**
     * Tema Oscuro (Dark Theme)
     * Colores oscuros para reducir fatiga visual en poca luz
     */
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
    
    /**
     * Tema Cerdita (Pig Theme)
     * Inspirado en cerditos, colores rosados y divertidos
     */
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
    
    /**
     * Tema Koala
     * Inspirado en koalas, colores grises y azules relajantes
     */
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
    
    /**
     * Tema Mixto (Koala + Cerdita)
     * Combinación equilibrada de ambos temas
     */
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
    
    /**
     * Obtiene los colores predefinidos para un tipo de tema
     */
    fun getColorsForType(type: ThemeType): ColorScheme {
        return when (type) {
            ThemeType.LIGHT -> lightColors
            ThemeType.DARK -> darkColors
            ThemeType.PIG -> pigColors
            ThemeType.KOALA -> koalaColors
            ThemeType.MIXED -> mixedColors
            ThemeType.CUSTOM_IMAGE -> lightColors // Default, se personaliza después
        }
    }
    
    /**
     * Lista de todos los temas predefinidos
     */
    val predefinedThemes = listOf(
        ThemeConfig(
            id = "light",
            name = "Claro",
            type = ThemeType.LIGHT,
            colors = lightColors,
            isCustom = false
        ),
        ThemeConfig(
            id = "dark",
            name = "Oscuro",
            type = ThemeType.DARK,
            colors = darkColors,
            isCustom = false
        ),
        ThemeConfig(
            id = "pig",
            name = "Cerdita 🐷",
            type = ThemeType.PIG,
            colors = pigColors,
            isCustom = false
        ),
        ThemeConfig(
            id = "koala",
            name = "Koala 🐨",
            type = ThemeType.KOALA,
            colors = koalaColors,
            isCustom = false
        ),
        ThemeConfig(
            id = "mixed",
            name = "Mixto 🐷🐨",
            type = ThemeType.MIXED,
            colors = mixedColors,
            isCustom = false
        )
    )
}
