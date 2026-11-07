package com.promptgineer.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.core.Validate
import com.promptgineer.app.data.repo.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthMode { SIGN_IN, SIGN_UP }

data class AuthUiState(
    val mode: AuthMode = AuthMode.SIGN_IN,
    val fullName: String = "",
    val email: String = "",
    val password: String = "",
    val passwordVisible: Boolean = false,
    val submitting: Boolean = false,
    val nameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val formError: String? = null,
) {
    val canSubmit: Boolean
        get() = !submitting && email.isNotBlank() && password.isNotBlank() &&
            (mode == AuthMode.SIGN_IN || fullName.isNotBlank())
}

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    fun setMode(mode: AuthMode) {
        _state.update {
            it.copy(
                mode = mode,
                formError = null,
                emailError = null,
                passwordError = null,
                nameError = null,
            )
        }
    }

    fun setFullName(value: String) = _state.update {
        it.copy(fullName = value.take(120), nameError = null, formError = null)
    }

    fun setEmail(value: String) = _state.update {
        it.copy(email = value.trimStart().take(254), emailError = null, formError = null)
    }

    fun setPassword(value: String) = _state.update {
        it.copy(password = value, passwordError = null, formError = null)
    }

    fun togglePasswordVisibility() = _state.update { it.copy(passwordVisible = !it.passwordVisible) }

    fun submit() {
        val snapshot = _state.value
        if (snapshot.submitting) return

        val emailError = Validate.email(snapshot.email)
        val passwordError = Validate.password(snapshot.password)
        val nameError = if (snapshot.mode == AuthMode.SIGN_UP) Validate.requiredName(snapshot.fullName) else null
        if (emailError != null || passwordError != null || nameError != null) {
            _state.update {
                it.copy(emailError = emailError, passwordError = passwordError, nameError = nameError)
            }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }
        viewModelScope.launch {
            val result = if (snapshot.mode == AuthMode.SIGN_IN) {
                authRepository.signIn(snapshot.email, snapshot.password)
            } else {
                authRepository.signUp(snapshot.email, snapshot.password, snapshot.fullName)
            }
            when (result) {
                is ApiResult.Success -> {
                    _state.update { it.copy(submitting = false, password = "") }
                    messenger.success(
                        if (snapshot.mode == AuthMode.SIGN_IN) {
                            "Welcome back, ${result.data.displayName}."
                        } else {
                            "Account created. Your workspace is ready."
                        },
                    )
                }
                is ApiResult.Failure -> {
                    _state.update {
                        it.copy(
                            submitting = false,
                            formError = result.error.userMessage,
                            emailError = if (result.error.userMessage.contains("email", true)) {
                                result.error.userMessage
                            } else {
                                null
                            },
                        )
                    }
                }
            }
        }
    }
}
