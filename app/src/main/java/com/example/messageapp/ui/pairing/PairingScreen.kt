package com.example.messageapp.ui.pairing

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.messageapp.viewmodel.PairingUiState
import com.example.messageapp.viewmodel.PairingViewModel

/**
 * Pantalla de Emparejamiento por Código
 * 
 * Permite:
 * - Ver mi código de 6 dígitos
 * - Ingresar código de otra persona
 * - Vincularse con ese código
 */
@Composable
fun PairingScreen(
    viewModel: PairingViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onBack: () -> Unit,
    onPaired: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val pairingStatus by viewModel.pairingStatus.collectAsStateWithLifecycle()
    
    // Código ingresado por el usuario
    var code by remember { mutableStateOf("") }
    
    // Mostrar diálogo de error
    var showErrorDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    // Cargar estado inicial
    LaunchedEffect(Unit) {
        viewModel.loadPairingStatus()
    }
    
    // Manejar estados
    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is PairingUiState.Error -> {
                errorMessage = state.message
                showErrorDialog = true
            }
            is PairingUiState.Paired -> {
                onPaired() // Navegar al chat
            }
            else -> {}
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Emparejar Dispositivo") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Mi código de 6 dígitos
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Tu código de emparejamiento",
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Mostrar código o botón para generar
                    if (pairingStatus?.pairingCode != null) {
                        Text(
                            text = pairingStatus?.pairingCode ?: "",
                            style = MaterialTheme.typography.displayLarge,
                            color = MaterialTheme.colorScheme.primary,
                            letterSpacing = androidx.compose.ui.unit.SpacedBy(8.dp)
                        )
                        
                        Text(
                            text = "Comparte este código con tu pareja",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Button(onClick = { viewModel.generatePairingCode() }) {
                            Text("Generar Código")
                        }
                    }
                }
            }
            
            Divider()
            
            // Ingresar código de otra persona
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "¿Tienes un código de tu pareja?",
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Input de código de 6 dígitos
                    OutlinedTextField(
                        value = code,
                        onValueChange = { 
                            // Solo permitir números y máximo 6 dígitos
                            if (it.length <= 6 && it.all { char -> char.isDigit() }) {
                                code = it
                            }
                        },
                        label = { Text("Código de 6 dígitos") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("123456") }
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Button(
                        onClick = { viewModel.pairWithCode(code) },
                        enabled = code.length == 6 && uiState !is PairingUiState.Loading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (uiState is PairingUiState.Loading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Vincular")
                        }
                    }
                }
            }
            
            // Estado de emparejamiento
            if (pairingStatus?.isPaired == true) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "¡Ya estás emparejado!",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }
    }
    
    // Diálogo de error
    if (showErrorDialog) {
        AlertDialog(
            onDismissRequest = { 
                showErrorDialog = false 
                viewModel.clearError()
            },
            title = { Text("Error") },
            text = { Text(errorMessage) },
            confirmButton = {
                TextButton(
                    onClick = { 
                        showErrorDialog = false
                        viewModel.clearError()
                    }
                ) {
                    Text("Aceptar")
                }
            }
        )
    }
}
