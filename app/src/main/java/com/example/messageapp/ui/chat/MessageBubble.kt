package com.example.messageapp.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.LastBaseline
import androidx.compose.ui.text.style.BreakAnywhere
import androidx.compose.ui.unit.dp
import com.example.messageapp.model.Message
import com.example.messageapp.model.MessageStatus
import com.example.messageapp.ui.theme.GrisKoala
import com.example.messageapp.ui.theme.RosaChanchitaDark
import java.text.SimpleDateFormat
import java.util.*

/**
 * Burbuja de mensaje con ticks de estado
 * 
 * Muestra:
 * - Contenido del mensaje (cifrado o multimedia)
 * - Hora de envío
 * - Ticks de estado (Gris Koala / Rosa Chanchita)
 */
@Composable
fun MessageBubble(
    message: Message,
    isMine: Boolean,
    decryptedText: String,
    onLongClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    val timeString = timeFormat.format(Date(message.createdAt * 1000))
    
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (isMine) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            ),
            onClick = { },
            onLongClick = onLongClick
        ) {
            Column(
                modifier = Modifier.padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Contenido del mensaje
                if (message.type == "deleted") {
                    Text(
                        text = "[Mensaje eliminado]",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isMine) {
                            MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        },
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                } else if (message.type == "text") {
                    Text(
                        text = decryptedText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isMine) {
                            MaterialTheme.colorScheme.onPrimary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        modifier = Modifier.breakAnywhere()
                    )
                } else {
                    // Multimedia
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = when (message.type) {
                                "image" -> androidx.compose.material.icons.Icons.Default.Image
                                "video" -> androidx.compose.material.icons.Icons.Default.VideoLibrary
                                "audio" -> androidx.compose.material.icons.Icons.Default.AudioFile
                                else -> androidx.compose.material.icons.Icons.Default.AttachFile
                            },
                            contentDescription = message.type,
                            tint = if (isMine) {
                                MaterialTheme.colorScheme.onPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                        Text(
                            text = "[${message.type}]",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isMine) {
                                MaterialTheme.colorScheme.onPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                }
                
                // Meta: hora y ticks
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.Bottom
                ) {
                    // Hora
                    Text(
                        text = timeString,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isMine) {
                            MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        },
                        modifier = Modifier.alignBy(LastBaseline)
                    )
                    
                    // Ticks de estado (solo para mensajes enviados por mí)
                    if (isMine && message.type != "deleted") {
                        Spacer(modifier = Modifier.width(4.dp))
                        MessageStatusIndicator(
                            status = message.status,
                            isMine = true,
                            modifier = Modifier.alignBy(LastBaseline)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Indicador de "Escribiendo..." debajo de las burbujas
 */
@Composable
fun TypingBubble(
    isPartnerTyping: Boolean,
    modifier: Modifier = Modifier
) {
    if (isPartnerTyping) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Animación de 3 puntos
                    val infiniteTransition = androidx.compose.animation.core.rememberInfiniteTransition()
                    
                    repeat(3) { index ->
                        val alpha by infiniteTransition.animateFloat(
                            initialValue = 0.3f,
                            targetValue = 1f,
                            animationSpec = androidx.compose.animation.core.infiniteRepeatable(
                                animation = androidx.compose.animation.core.tween(600, delayMillis = index * 200),
                                repeatMode = androidx.compose.animation.core.RepeatMode.Reverse
                            )
                        )
                        
                        androidx.compose.material3.Text(
                            text = ".",
                            style = MaterialTheme.typography.titleLarge,
                            color = RosaChanchitaDark.copy(alpha = alpha)
                        )
                    }
                }
            }
        }
    }
}
