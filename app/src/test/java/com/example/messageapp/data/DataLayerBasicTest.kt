package com.example.messageapp.data

import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Basic tests for data layer classes.
 * These tests verify that the basic structure and functionality works.
 */
class DataLayerBasicTest {

    @Test
    fun `AuthReadRepository can be instantiated`() {
        val repo = AuthReadRepository()
        assertThat(repo).isNotNull()
    }

    @Test
    fun `AuthReadRepository isValidEmail returns true for valid email`() {
        val repo = AuthReadRepository()
        assertThat(repo.isValidEmail("test@example.com")).isTrue()
    }

    @Test
    fun `AuthReadRepository isValidEmail returns false for invalid email`() {
        val repo = AuthReadRepository()
        assertThat(repo.isValidEmail("invalid-email")).isFalse()
    }

    @Test
    fun `AuthReadRepository getCurrentUserId returns null when not logged in`() {
        val repo = AuthReadRepository()
        assertThat(repo.getCurrentUserId()).isNull()
    }

    @Test
    fun `AuthReadRepository isUserLoggedIn returns false by default`() {
        val repo = AuthReadRepository()
        assertThat(repo.isUserLoggedIn()).isFalse()
    }

    @Test
    fun `AuthReadRepository getCurrentUserEmail returns null when not logged in`() {
        val repo = AuthReadRepository()
        assertThat(repo.getCurrentUserEmail()).isNull()
    }
}
