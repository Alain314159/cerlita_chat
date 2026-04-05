package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Tests for ThemeModels: ThemeType enum, ColorScheme, ThemeConfig.
 */
class ThemeModelsTest {

    // === ThemeType Tests ===

    @Test
    fun `ThemeType has exactly 6 values`() {
        val values = ThemeType.values()
        assertThat(values).hasLength(6)
        assertThat(values.asList()).containsExactly(
            ThemeType.LIGHT,
            ThemeType.DARK,
            ThemeType.PIG,
            ThemeType.KOALA,
            ThemeType.MIXED,
            ThemeType.CUSTOM_IMAGE
        )
    }

    @Test
    fun `ThemeType valueOf works for all values`() {
        assertThat(ThemeType.valueOf("LIGHT")).isEqualTo(ThemeType.LIGHT)
        assertThat(ThemeType.valueOf("DARK")).isEqualTo(ThemeType.DARK)
        assertThat(ThemeType.valueOf("PIG")).isEqualTo(ThemeType.PIG)
        assertThat(ThemeType.valueOf("KOALA")).isEqualTo(ThemeType.KOALA)
        assertThat(ThemeType.valueOf("MIXED")).isEqualTo(ThemeType.MIXED)
        assertThat(ThemeType.valueOf("CUSTOM_IMAGE")).isEqualTo(ThemeType.CUSTOM_IMAGE)
    }

    // === ColorScheme Tests ===

    @Test
    fun `ColorScheme has default light-like colors`() {
        val scheme = ColorScheme()

        assertThat(scheme.primary).isNotNull()
        assertThat(scheme.onPrimary).isNotNull()
        assertThat(scheme.secondary).isNotNull()
        assertThat(scheme.onSecondary).isNotNull()
        assertThat(scheme.background).isNotNull()
        assertThat(scheme.onBackground).isNotNull()
        assertThat(scheme.surface).isNotNull()
        assertThat(scheme.onSurface).isNotNull()
        assertThat(scheme.error).isNotNull()
        assertThat(scheme.onError).isNotNull()
    }

    @Test
    fun `ColorScheme can be customized`() {
        val custom = ColorScheme(
            primary = androidx.compose.ui.graphics.Color.Red,
            background = androidx.compose.ui.graphics.Color.Black
        )

        assertThat(custom.primary).isEqualTo(androidx.compose.ui.graphics.Color.Red)
        assertThat(custom.background).isEqualTo(androidx.compose.ui.graphics.Color.Black)
        // Other fields keep defaults
        assertThat(custom.surface).isEqualTo(androidx.compose.ui.graphics.Color.White)
    }

    @Test
    fun `ColorScheme copy creates modified version`() {
        val original = ColorScheme()
        val modified = original.copy(primary = androidx.compose.ui.graphics.Color.Green)

        assertThat(modified.primary).isEqualTo(androidx.compose.ui.graphics.Color.Green)
        assertThat(modified.background).isEqualTo(original.background) // unchanged
    }

    // === ThemeConfig Tests ===

    @Test
    fun `ThemeConfig creation with all fields`() {
        val config = ThemeConfig(
            id = "theme-1",
            name = "My Theme",
            type = ThemeType.PIG,
            colors = ColorScheme(),
            isCustom = true,
            imageUri = "file:///path/to/image.png"
        )

        assertThat(config.id).isEqualTo("theme-1")
        assertThat(config.name).isEqualTo("My Theme")
        assertThat(config.type).isEqualTo(ThemeType.PIG)
        assertThat(config.isCustom).isTrue()
        assertThat(config.imageUri).isEqualTo("file:///path/to/image.png")
        assertThat(config.colors).isNotNull()
    }

    @Test
    fun `ThemeConfig defaults for optional fields`() {
        val config = ThemeConfig(
            id = "t1",
            name = "Basic",
            type = ThemeType.LIGHT,
            colors = ColorScheme()
        )

        assertThat(config.isCustom).isFalse()
        assertThat(config.imageUri).isNull()
    }

    @Test
    fun `ThemeConfig with CUSTOM_IMAGE type has non-null imageUri`() {
        val config = ThemeConfig(
            id = "custom-1",
            name = "Custom",
            type = ThemeType.CUSTOM_IMAGE,
            colors = ColorScheme(),
            isCustom = true,
            imageUri = "content://media/external/images/1"
        )

        assertThat(config.type).isEqualTo(ThemeType.CUSTOM_IMAGE)
        assertThat(config.imageUri).isNotNull()
    }

    @Test
    fun `ThemeConfig with different theme types`() {
        val darkConfig = ThemeConfig(
            id = "dark",
            name = "Dark",
            type = ThemeType.DARK,
            colors = ColorScheme(
                background = androidx.compose.ui.graphics.Color.Black,
                surface = androidx.compose.ui.graphics.Color(0xFF121212)
            )
        )

        assertThat(darkConfig.type).isEqualTo(ThemeType.DARK)
        assertThat(darkConfig.colors.background).isEqualTo(
            androidx.compose.ui.graphics.Color.Black
        )
    }
}
