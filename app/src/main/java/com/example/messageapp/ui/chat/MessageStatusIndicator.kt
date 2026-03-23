package com.example.messageapp.ui.chat

import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.messageapp.model.MessageStatus
import com.example.messageapp.ui.theme.RosaChanchitaDark
import com.example.messageapp.ui.theme.GrisKoala

/**
 * Indicador de estado de mensaje (Ticks estilo WhatsApp)
 * 
 * Colores personalizados:
 * - Gris Koala: Enviado/Entregado
 * - Rosa Chanchita: Leído
 */
@Composable
fun MessageStatusIndicator(
    status: MessageStatus,
    isMine: Boolean,
    modifier: Modifier = Modifier
) {
    if (!isMine) return // Solo mostrar en mensajes enviados por mí
    
    Row(modifier = modifier) {
        when (status) {
            MessageStatus.SENT -> {
                // 1 tick Gris Koala (Enviado al servidor)
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Enviado",
                    tint = GrisKoala,
                    modifier = Modifier.size(16.dp)
                )
            }
            
            MessageStatus.DELIVERED -> {
                // 2 ticks Gris Koala (Entregado al dispositivo)
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Entregado",
                    tint = GrisKoala,
                    modifier = Modifier.size(16.dp)
                )
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = GrisKoala,
                    modifier = Modifier
                        .size(16.dp)
                        .offset(x = (-6).dp) // Superponer ligeramente
                )
            }
            
            MessageStatus.READ -> {
                // 2 ticks Rosa Chanchita (Leído por la pareja)
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Leído",
                    tint = RosaChanchitaDark,
                    modifier = Modifier.size(16.dp)
                )
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = RosaChanchitaDark,
                    modifier = Modifier
                        .size(16.dp)
                        .offset(x = (-6).dp) // Superponer ligeramente
                )
            }
        }
    }
}

/**
 * Versión simplificada con doble tick siempre
 */
@Composable
fun DoubleCheckIndicator(
    isRead: Boolean,
    modifier: Modifier = Modifier
) {
    val tickColor = if (isRead) RosaChanchitaDark else GrisKoala
    
    Row(modifier = modifier) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = if (isRead) "Leído" else "Entregado",
            tint = tickColor,
            modifier = Modifier.size(14.dp)
        )
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            tint = tickColor,
            modifier = Modifier
                .size(14.dp)
                .offset(x = (-5).dp)
        )
    }
}
