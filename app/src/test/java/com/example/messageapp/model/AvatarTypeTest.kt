package com.example.messageapp.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Tests for AvatarType enum.
 * Uses Robolectric because AvatarType references Android resources (R.drawable).
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class AvatarTypeTest {

    @Test
    fun `AvatarType has exactly 2 values`() {
        val values = AvatarType.values()
        assertThat(values).hasLength(2)
        assertThat(values.asList()).containsExactly(
            AvatarType.CERDITA,
            AvatarType.KOALA
        )
    }

    @Test
    fun `fromId returns CERDITA for cerdita id`() {
        val result = AvatarType.fromId("cerdita")
        assertThat(result).isEqualTo(AvatarType.CERDITA)
    }

    @Test
    fun `fromId returns KOALA for koala id`() {
        val result = AvatarType.fromId("koala")
        assertThat(result).isEqualTo(AvatarType.KOALA)
    }

    @Test
    fun `fromId returns CERDITA as default for unknown id`() {
        val result = AvatarType.fromId("unknown")
        assertThat(result).isEqualTo(AvatarType.CERDITA)
    }

    @Test
    fun `fromId returns CERDITA for empty string`() {
        val result = AvatarType.fromId("")
        assertThat(result).isEqualTo(AvatarType.CERDITA)
    }

    @Test
    fun `getAll returns all avatar types`() {
        val all = AvatarType.getAll()
        assertThat(all).hasSize(2)
        assertThat(all).containsExactly(AvatarType.CERDITA, AvatarType.KOALA)
    }

    @Test
    fun `each avatar has non-empty id and displayName`() {
        for (avatar in AvatarType.values()) {
            assertThat(avatar.id).isNotEmpty()
            assertThat(avatar.displayName).isNotEmpty()
            assertThat(avatar.drawableResId).isGreaterThan(0)
        }
    }

    @Test
    fun `avatar ids are unique`() {
        val ids = AvatarType.values().map { it.id }
        assertThat(ids).containsNoDuplicates()
    }
}
