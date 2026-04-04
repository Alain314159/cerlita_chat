package com.example.messageapp.utils

import android.util.Log
import kotlinx.coroutines.delay

/**
 * Utilidad para reintentar operaciones con exponential backoff
 *
 * Responsabilidad única: Reintentar operaciones fallidas con delays crecientes
 * para mejorar la resiliencia de red.
 *
 * Uso:
 * ```kotlin
 * val result = retryWithBackoff(
 *     maxRetries = 3,
 *     initialDelay = 1000,
 *     maxDelay = 10000,
 *     tag = "MessageApp"
 * ) {
 *     // Operación que puede fallar
 *     repository.sendMessage(data)
 * }
 * ```
 *
 * @param maxRetries Número máximo de intentos (default: 3)
 * @param initialDelay Delay inicial en ms (default: 1000)
 * @param maxDelay Delay máximo en ms (default: 10000)
 * @param factor Factor de multiplicación (default: 2.0)
 * @param tag Tag para logging
 * @param block Bloque de código a reintentar
 * @return Resultado del bloque si tiene éxito
 * @throws Exception del último intento si todos fallan
 */
suspend fun <T> retryWithBackoff(
    maxRetries: Int = 3,
    initialDelay: Long = 1000,
    maxDelay: Long = 10000,
    factor: Double = 2.0,
    tag: String = "MessageApp",
    block: suspend () -> T
): T {
    var currentDelay = initialDelay

    repeat(maxRetries) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            if (attempt < maxRetries - 1) {
                Log.w(
                    tag,
                    "RetryWithBackoff: Attempt ${attempt + 1}/$maxRetries failed, " +
                        "retrying in ${currentDelay}ms",
                    e
                )
                delay(currentDelay)
                currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
            } else {
                Log.e(
                    tag,
                    "RetryWithBackoff: All $maxRetries attempts failed",
                    e
                )
                throw e
            }
        }
    }

    error("Unexpected: retry loop completed without returning or throwing")
}

/**
 * Versión que retorna null en lugar de lanzar excepción
 *
 * Útil para operaciones opcionales donde el fallo es aceptable.
 */
suspend fun <T> retryWithBackoffOrNull(
    maxRetries: Int = 3,
    initialDelay: Long = 1000,
    maxDelay: Long = 10000,
    factor: Double = 2.0,
    tag: String = "MessageApp",
    block: suspend () -> T
): T? {
    return try {
        retryWithBackoff(
            maxRetries = maxRetries,
            initialDelay = initialDelay,
            maxDelay = maxDelay,
            factor = factor,
            tag = tag,
            block = block
        )
    } catch (e: Exception) {
        Log.e(tag, "RetryWithBackoffOrNull: All attempts failed", e)
        null
    }
}
