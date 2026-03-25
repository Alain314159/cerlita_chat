package com.example.messageapp.model

import androidx.compose.ui.graphics.Color

/**
 * Tipos de temas disponibles
 */
enum class ThemeType {
    LIGHT,          // Tema claro
    DARK,           // Tema oscuro
    PIG,            // Tema Cerdita (rosado)
    KOALA,          // Tema Koala (gris/azul)
    MIXED,          // Tema Mixto (Koala + Cerdita)
    CUSTOM_IMAGE    // Tema personalizado desde imagen
}

/**
 * Esquema de colores para un tema
 */
data class ColorScheme(
    val primary: Color = Color(0xFF1976D2),
    val onPrimary: Color = Color.White,
    val secondary: Color = Color(0xFF03DAC6),
    val onSecondary: Color = Color.Black,
    val background: Color = Color(0xFFFAFAFA),
    val onBackground: Color = Color(0xFF212121),
    val surface: Color = Color.White,
    val onSurface: Color = Color(0xFF212121),
    val error: Color = Color(0xFFB00020),
    val onError: Color = Color.White
)

/**
 * Configuración completa de un tema
 */
data class ThemeConfig(
    val id: String,
    val name: String,
    val type: ThemeType,
    val colors: ColorScheme,
    val isCustom: Boolean = false,
    val imageUri: String? = null
)
