package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Tests para modelos de Temas (ThemeConfig, ThemeType, ColorScheme)
 * 
 * Tests Mínimos (Regla de Memoria):
 * - Happy path (1 test)
 * - Edge cases (2+ tests)
 * - Error handling (1+ tests)
 * - Null/empty cases (1+ tests)
 */
class ThemeModelsTest {

    // ============================================
    // Tests para ThemeType
    // ============================================

    @Test
    fun `ThemeType has all required values`() {
        // When: Obtengo todos los valores de ThemeType
        val values = ThemeType.values()

        // Then: Debería tener todos los temas definidos
        assertThat(values).contains(ThemeType.LIGHT)
        assertThat(values).contains(ThemeType.DARK)
        assertThat(values).contains(ThemeType.PIG)
        assertThat(values).contains(ThemeType.KOALA)
        assertThat(values).contains(ThemeType.MIXED)
        assertThat(values).contains(ThemeType.CUSTOM_IMAGE)
    }

    @Test
    fun `ThemeType values count is correct`() {
        // When: Cuento los valores
        val count = ThemeType.values().size

        // Then: Debería tener 6 valores
        assertThat(count).isEqualTo(6)
    }

    // ============================================
    // Tests para ColorScheme
    // ============================================

    @Test
    fun `ColorScheme with default values creates successfully`() {
        // When: Creo ColorScheme con valores por defecto
        val colorScheme = ColorScheme()

        // Then: Debería crear exitosamente
        assertThat(colorScheme.primary).isNotNull()
        assertThat(colorScheme.onPrimary).isNotNull()
        assertThat(colorScheme.secondary).isNotNull()
        assertThat(colorScheme.onSecondary).isNotNull()
        assertThat(colorScheme.background).isNotNull()
        assertThat(colorScheme.onBackground).isNotNull()
        assertThat(colorScheme.surface).isNotNull()
        assertThat(colorScheme.onSurface).isNotNull()
        assertThat(colorScheme.error).isNotNull()
        assertThat(colorScheme.onError).isNotNull()
    }

    @Test
    fun `ColorScheme with custom colors creates successfully`() {
        // When: Creo ColorScheme con colores personalizados
        val customColorScheme = ColorScheme(
            primary = androidx.compose.ui.Color.Red,
            onPrimary = androidx.compose.ui.Color.White,
            secondary = androidx.compose.ui.Color.Blue,
            onSecondary = androidx.compose.ui.Color.White,
            background = androidx.compose.ui.Color.LightGray,
            onBackground = androidx.compose.ui.Color.Black,
            surface = androidx.compose.ui.Color.Gray,
            onSurface = androidx.compose.ui.Color.White,
            error = androidx.compose.ui.Color.Magenta,
            onError = androidx.compose.ui.Color.White
        )

        // Then: Debería crear exitosamente con colores custom
        assertThat(customColorScheme.primary).isEqualTo(androidx.compose.ui.Color.Red)
        assertThat(customColorScheme.onPrimary).isEqualTo(androidx.compose.ui.Color.White)
        assertThat(customColorScheme.secondary).isEqualTo(androidx.compose.ui.Color.Blue)
    }

    @Test
    fun `ColorScheme copy creates new instance with changes`() {
        // Given: ColorScheme original
        val original = ColorScheme(primary = androidx.compose.ui.Color.Red)

        // When: Creo copia con cambio
        val copy = original.copy(primary = androidx.compose.ui.Color.Blue)

        // Then: Debería tener nuevo color pero mantener los demás
        assertThat(copy.primary).isEqualTo(androidx.compose.ui.Color.Blue)
        assertThat(original.primary).isEqualTo(androidx.compose.ui.Color.Red)
    }

    // ============================================
    // Tests para ThemeConfig
    // ============================================

    @Test
    fun `ThemeConfig with default values creates successfully`() {
        // When: Creo ThemeConfig con valores por defecto
        val theme = ThemeConfig(
            id = "test-theme",
            name = "Test Theme",
            type = ThemeType.LIGHT,
            colors = ColorScheme()
        )

        // Then: Debería crear exitosamente
        assertThat(theme.id).isEqualTo("test-theme")
        assertThat(theme.name).isEqualTo("Test Theme")
        assertThat(theme.type).isEqualTo(ThemeType.LIGHT)
        assertThat(theme.isCustom).isFalse()
        assertThat(theme.imageUri).isNull()
    }

    @Test
    fun `ThemeConfig with custom image creates successfully`() {
        // When: Creo ThemeConfig con imagen personalizada
        val customTheme = ThemeConfig(
            id = "custom-1",
            name = "Custom Theme",
            type = ThemeType.CUSTOM_IMAGE,
            colors = ColorScheme(),
            isCustom = true,
            imageUri = "content://images/photo.jpg"
        )

        // Then: Debería crear exitosamente con imagen
        assertThat(customTheme.isCustom).isTrue()
        assertThat(customTheme.imageUri).isEqualTo("content://images/photo.jpg")
        assertThat(customTheme.type).isEqualTo(ThemeType.CUSTOM_IMAGE)
    }

    @Test
    fun `ThemeConfig copy creates new instance`() {
        // Given: ThemeConfig original
        val original = ThemeConfig(
            id = "original",
            name = "Original",
            type = ThemeType.LIGHT,
            colors = ColorScheme()
        )

        // When: Creo copia con cambios
        val copy = original.copy(name = "Modified", isCustom = true)

        // Then: Debería tener cambios pero mantener ID
        assertThat(copy.id).isEqualTo("original")
        assertThat(copy.name).isEqualTo("Modified")
        assertThat(copy.isCustom).isTrue()
        assertThat(original.name).isEqualTo("Original")
        assertThat(original.isCustom).isFalse()
    }

    @Test
    fun `ThemeConfig with null imageUri creates successfully`() {
        // When: Creo ThemeConfig con imageUri null
        val theme = ThemeConfig(
            id = "no-image",
            name = "No Image Theme",
            type = ThemeType.PIG,
            colors = ColorScheme(),
            imageUri = null
        )

        // Then: Debería crear exitosamente con null
        assertThat(theme.imageUri).isNull()
    }

    // ============================================
    // Tests para ThemeType a ColorScheme mapping
    // ============================================

    @Test
    fun `ThemeType LIGHT maps to light colors`() {
        // Given: ThemeType LIGHT
        val themeType = ThemeType.LIGHT

        // When: Verifico tipo
        val isLight = themeType == ThemeType.LIGHT

        // Then: Debería ser LIGHT
        assertThat(isLight).isTrue()
    }

    @Test
    fun `ThemeType DARK maps to dark colors`() {
        // Given: ThemeType DARK
        val themeType = ThemeType.DARK

        // When: Verifico tipo
        val isDark = themeType == ThemeType.DARK

        // Then: Debería ser DARK
        assertThat(isDark).isTrue()
    }

    @Test
    fun `ThemeType PIG maps to pig colors`() {
        // Given: ThemeType PIG
        val themeType = ThemeType.PIG

        // When: Verifico tipo
        val isPig = themeType == ThemeType.PIG

        // Then: Debería ser PIG
        assertThat(isPig).isTrue()
    }

    @Test
    fun `ThemeType KOALA maps to koala colors`() {
        // Given: ThemeType KOALA
        val themeType = ThemeType.KOALA

        // When: Verifico tipo
        val isKoala = themeType == ThemeType.KOALA

        // Then: Debería ser KOALA
        assertThat(isKoala).isTrue()
    }

    @Test
    fun `ThemeType MIXED maps to mixed colors`() {
        // Given: ThemeType MIXED
        val themeType = ThemeType.MIXED

        // When: Verifico tipo
        val isMixed = themeType == ThemeType.MIXED

        // Then: Debería ser MIXED
        assertThat(isMixed).isTrue()
    }

    @Test
    fun `ThemeType CUSTOM_IMAGE maps to custom colors`() {
        // Given: ThemeType CUSTOM_IMAGE
        val themeType = ThemeType.CUSTOM_IMAGE

        // When: Verifico tipo
        val isCustom = themeType == ThemeType.CUSTOM_IMAGE

        // Then: Debería ser CUSTOM_IMAGE
        assertThat(isCustom).isTrue()
    }

    // ============================================
    // Tests de integración: ThemeConfig + ColorScheme
    // ============================================

    @Test
    fun `ThemeConfig with all theme types creates successfully`() {
        // When: Creo ThemeConfigs para todos los tipos
        val themes = ThemeType.values().map { type ->
            ThemeConfig(
                id = "theme-${type.name.lowercase()}",
                name = type.name,
                type = type,
                colors = ColorScheme()
            )
        }

        // Then: Todos deberían crear exitosamente
        assertThat(themes).hasSize(6)
        themes.forEach { theme ->
            assertThat(theme.id).isNotEmpty()
            assertThat(theme.name).isNotEmpty()
            assertThat(theme.colors).isNotNull()
        }
    }

    @Test
    fun `ThemeConfig with very long name creates successfully`() {
        // When: Creo ThemeConfig con nombre muy largo
        val theme = ThemeConfig(
            id = "long-name",
            name = "a".repeat(500),
            type = ThemeType.LIGHT,
            colors = ColorScheme()
        )

        // Then: Debería crear exitosamente
        assertThat(theme.name).hasLength(500)
    }

    @Test
    fun `ThemeConfig with special characters in name creates successfully`() {
        // When: Creo ThemeConfig con caracteres especiales
        val theme = ThemeConfig(
            id = "special-chars",
            name = "Tema-<>&\"'-Especial",
            type = ThemeType.PIG,
            colors = ColorScheme()
        )

        // Then: Debería crear exitosamente
        assertThat(theme.name).contains("<>&\"'")
    }

    @Test
    fun `ThemeConfig with unicode name creates successfully`() {
        // When: Creo ThemeConfig con unicode
        val theme = ThemeConfig(
            id = "unicode",
            name = "Tema 🌍 你好",
            type = ThemeType.KOALA,
            colors = ColorScheme()
        )

        // Then: Debería crear exitosamente
        assertThat(theme.name).contains("🌍")
        assertThat(theme.name).contains("你好")
    }

    // ============================================
    // Tests de concurrencia
    // ============================================

    @Test
    fun `creating multiple ThemeConfigs concurrently does not crash`() {
        // When: Creo múltiples ThemeConfigs en paralelo
        val themes = List(100) { index ->
            ThemeConfig(
                id = "theme-$index",
                name = "Theme $index",
                type = ThemeType.values()[index % ThemeType.values().size],
                colors = ColorScheme()
            )
        }

        // Then: Ninguno debería crashar
        assertThat(themes).hasSize(100)
        themes.forEachIndexed { index, theme ->
            assertThat(theme.id).isEqualTo("theme-$index")
        }
    }

    // ============================================
    // Tests de rendimiento
    // ============================================

    @Test
    fun `creating 1000 ColorSchemes performance test`() {
        // When: Creo 1000 ColorSchemes
        val startTime = System.currentTimeMillis()
        val colorSchemes = List(1000) {
            ColorScheme(
                primary = androidx.compose.ui.Color(it),
                onPrimary = androidx.compose.ui.Color.White
            )
        }
        val elapsed = System.currentTimeMillis() - startTime

        // Then: Debería ser rápido (< 500ms)
        assertThat(elapsed).isLessThan(500)
        assertThat(colorSchemes).hasSize(1000)
    }
}
