package com.promptgineer.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.AppSettings
import com.promptgineer.app.core.ServerConfig
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.data.repo.SettingsRepository
import com.promptgineer.app.util.NetworkMonitor
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AppUiState(
    val session: SessionState = SessionState.Loading,
    val settings: AppSettings = AppSettings(),
    val online: Boolean = true,
) {
    val signedIn: Boolean get() = session is SessionState.SignedIn
}

/**
 * Owns only what the shell needs: who is signed in, display preferences and
 * connectivity. Feature state lives in feature view models.
 */
class AppViewModel(
    private val authRepository: AuthRepository,
    private val settingsRepository: SettingsRepository,
    private val serverConfig: ServerConfig,
    networkMonitor: NetworkMonitor,
) : ViewModel() {

    val state: StateFlow<AppUiState> = combine(
        authRepository.session,
        settingsRepository.settings,
        networkMonitor.isOnline,
    ) { session, settings, online ->
        AppUiState(session = session, settings = settings, online = online)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = AppUiState(),
    )

    init {
        viewModelScope.launch {
            // Apply the persisted server address before the first request so a
            // stored token is never sent to the default deployment by mistake.
            val stored = settingsRepository.settings.first()
            serverConfig.update(stored.serverUrl)
            authRepository.bootstrap()
        }
    }

    fun completeOnboarding() {
        viewModelScope.launch { settingsRepository.completeOnboarding() }
    }
}
