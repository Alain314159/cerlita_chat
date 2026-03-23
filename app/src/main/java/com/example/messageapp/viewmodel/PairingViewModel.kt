package com.example.messageapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.messageapp.data.PairingRepository
import com.example.messageapp.data.PairingStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel de Emparejamiento
 * 
 * Gestiona:
 * - Generación de código de 6 dígitos
 * - Vinculación con código
 * - Búsqueda por email
 * - Estado de emparejamiento
 */
class PairingViewModel(
    private val repo: PairingRepository = PairingRepository()
) : ViewModel() {
    
    // Estado de la UI
    private val _uiState = MutableStateFlow<PairingUiState>(PairingUiState.Idle)
    val uiState = _uiState.asStateFlow()
    
    // Estado de emparejamiento
    private val _pairingStatus = MutableStateFlow<PairingStatus?>(null)
    val pairingStatus = _pairingStatus.asStateFlow()
    
    /**
     * Carga el estado actual de emparejamiento
     */
    fun loadPairingStatus() {
        viewModelScope.launch {
            _uiState.value = PairingUiState.Loading
            repo.getPairingStatus()
                .onSuccess { status ->
                    _pairingStatus.value = status
                    _uiState.value = PairingUiState.Success(status)
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Error desconocido")
                }
        }
    }
    
    /**
     * Genera un nuevo código de 6 dígitos
     */
    fun generatePairingCode() {
        viewModelScope.launch {
            _uiState.value = PairingUiState.Loading
            repo.generatePairingCode()
                .onSuccess { code ->
                    _uiState.value = PairingUiState.CodeGenerated(code)
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Error al generar código")
                }
        }
    }
    
    /**
     * Intenta vincular con un código de 6 dígitos
     */
    fun pairWithCode(code: String) {
        viewModelScope.launch {
            _uiState.value = PairingUiState.Loading
            repo.pairWithCode(code)
                .onSuccess {
                    _uiState.value = PairingUiState.Paired
                    loadPairingStatus() // Recargar estado
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Error al vincular")
                }
        }
    }
    
    /**
     * Busca un usuario por email
     */
    fun searchByEmail(email: String) {
        viewModelScope.launch {
            _uiState.value = PairingUiState.Loading
            repo.searchByEmail(email)
                .onSuccess { user ->
                    _uiState.value = PairingUiState.UserFound(user)
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Usuario no encontrado")
                }
        }
    }
    
    /**
     * Envía solicitud de emparejamiento
     */
    fun sendPairingRequest(partnerId: String) {
        viewModelScope.launch {
            repo.requestPairing(partnerId)
                .onSuccess {
                    _uiState.value = PairingUiState.RequestSent
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Error al enviar solicitud")
                }
        }
    }
    
    /**
     * Invalida el código actual (para generar uno nuevo)
     */
    fun invalidateCode() {
        viewModelScope.launch {
            repo.invalidatePairingCode()
                .onSuccess {
                    _pairingStatus.value = _pairingStatus.value?.copy(pairingCode = null)
                }
                .onFailure { error ->
                    _uiState.value = PairingUiState.Error(error.message ?: "Error al invalidar código")
                }
        }
    }
    
    /**
     * Reinicia el estado de error
     */
    fun clearError() {
        _uiState.value = PairingUiState.Idle
    }
}

/**
 * Estados posibles de la UI de emparejamiento
 */
sealed class PairingUiState {
    object Idle : PairingUiState()
    object Loading : PairingUiState()
    data class Success(val status: PairingStatus) : PairingUiState()
    data class CodeGenerated(val code: String) : PairingUiState()
    data class UserFound(val user: com.example.messageapp.model.User) : PairingUiState()
    object Paired : PairingUiState()
    object RequestSent : PairingUiState()
    data class Error(val message: String) : PairingUiState()
}
