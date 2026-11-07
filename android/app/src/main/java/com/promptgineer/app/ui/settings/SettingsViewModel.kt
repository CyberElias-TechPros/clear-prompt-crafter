package com.promptgineer.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppSettings
import com.promptgineer.app.core.ThemeMode
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.data.repo.SettingsRepository
import com.promptgineer.app.domain.User
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PasswordFormState(
    val visible: Boolean = false,
    val current: String = "",
    val next: String = "",
    val confirm: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
)

data class ServerFormState(
    val visible: Boolean = false,
    val url: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
)

data class SettingsUiState(
    val settings: AppSettings = AppSettings(),
    val user: User? = null,
    val signedIn: Boolean = false,
    val password: PasswordFormState = PasswordFormState(),
    val server: ServerFormState = ServerFormState(),
    val exporting: Boolean = false,
    val deleting: Boolean = false,
    val clearing: Boolean = false,
)

sealed interface SettingsEvent {
    data class ExportReady(val json: String) : SettingsEvent
    data object AccountDeleted : SettingsEvent
}

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    private val authRepository: AuthRepository,
    private val draftRepository: DraftRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    private val _events = Channel<SettingsEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        viewModelScope.launch {
            settingsRepository.settings.collect { settings ->
                _state.update { it.copy(settings = settings) }
            }
        }
        viewModelScope.launch {
            authRepository.session.collect { session ->
                _state.update {
                    it.copy(
                        signedIn = session is SessionState.SignedIn,
                        user = (session as? SessionState.SignedIn)?.user,
                    )
                }
            }
        }
    }

    fun setTheme(theme: ThemeMode) {
        viewModelScope.launch { settingsRepository.setTheme(theme) }
    }

    fun setDynamicColor(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setDynamicColor(enabled) }
    }

    fun setHaptics(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setHaptics(enabled) }
    }

    fun openPasswordDialog() = _state.update {
        it.copy(password = PasswordFormState(visible = true))
    }

    fun dismissPasswordDialog() {
        if (_state.value.password.submitting) return
        _state.update { it.copy(password = PasswordFormState()) }
    }

    fun setCurrentPassword(value: String) = _state.update {
        it.copy(password = it.password.copy(current = value, error = null))
    }

    fun setNewPassword(value: String) = _state.update {
        it.copy(password = it.password.copy(next = value, error = null))
    }

    fun setConfirmPassword(value: String) = _state.update {
        it.copy(password = it.password.copy(confirm = value, error = null))
    }

    fun submitPasswordChange() {
        val form = _state.value.password
        if (form.submitting) return
        val error = when {
            form.current.isBlank() -> "Enter your current password."
            form.next.length < 8 -> "New passwords need at least 8 characters."
            form.next != form.confirm -> "The new passwords don't match."
            form.next == form.current -> "Choose a password you haven't used here before."
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(password = it.password.copy(error = error)) }
            return
        }
        _state.update { it.copy(password = it.password.copy(submitting = true, error = null)) }
        viewModelScope.launch {
            when (val result = authRepository.changePassword(form.current, form.next)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(password = PasswordFormState()) }
                    messenger.success("Password changed. Other devices were signed out.")
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(password = it.password.copy(submitting = false, error = result.error.userMessage))
                }
            }
        }
    }

    fun exportData() {
        if (_state.value.exporting) return
        _state.update { it.copy(exporting = true) }
        viewModelScope.launch {
            when (val result = authRepository.exportData()) {
                is ApiResult.Success -> _events.trySend(SettingsEvent.ExportReady(result.data))
                is ApiResult.Failure -> messenger.error(result.error.userMessage)
            }
            _state.update { it.copy(exporting = false) }
        }
    }

    fun deleteAccount() {
        if (_state.value.deleting) return
        _state.update { it.copy(deleting = true) }
        viewModelScope.launch {
            when (val result = authRepository.deleteAccount()) {
                is ApiResult.Success -> _events.trySend(SettingsEvent.AccountDeleted)
                is ApiResult.Failure -> messenger.error(result.error.userMessage)
            }
            _state.update { it.copy(deleting = false) }
        }
    }

    fun openServerDialog() = _state.update {
        it.copy(server = ServerFormState(visible = true, url = it.settings.serverUrl))
    }

    fun dismissServerDialog() {
        if (_state.value.server.submitting) return
        _state.update { it.copy(server = ServerFormState()) }
    }

    fun setServerUrl(value: String) = _state.update {
        it.copy(server = it.server.copy(url = value.trim(), error = null))
    }

    fun submitServerChange() {
        val form = _state.value.server
        if (form.submitting) return
        _state.update { it.copy(server = it.server.copy(submitting = true, error = null)) }
        viewModelScope.launch {
            when (val result = settingsRepository.updateServer(form.url)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(server = ServerFormState()) }
                    authRepository.forceLocalSignOut(clearEphemeralOnly = false)
                    messenger.success("Server switched. Sign in with your account on that deployment.")
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(server = it.server.copy(submitting = false, error = result.error.userMessage))
                }
            }
        }
    }

    fun resetServer() {
        viewModelScope.launch {
            when (val result = settingsRepository.resetServer()) {
                is ApiResult.Success -> {
                    authRepository.forceLocalSignOut(clearEphemeralOnly = false)
                    messenger.success("Back on the default server. Please sign in again.")
                }
                is ApiResult.Failure -> messenger.error(result.error.userMessage)
            }
        }
    }

    fun clearLocalData() {
        if (_state.value.clearing) return
        _state.update { it.copy(clearing = true) }
        viewModelScope.launch {
            draftRepository.clearAllLocalData()
            _state.update { it.copy(clearing = false) }
            messenger.success("Local drafts, bookmarks and caches cleared.")
        }
    }
}
