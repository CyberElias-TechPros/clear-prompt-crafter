package com.promptgineer.app.ui.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AiRepository
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.AiProviderInfo
import com.promptgineer.app.domain.AiServicesSnapshot
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ConnectFormState(
    val provider: AiProviderInfo? = null,
    val apiKey: String = "",
    val baseUrl: String = "",
    val model: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
    val keyVisible: Boolean = false,
)

data class AiServicesUiState(
    val loading: Boolean = true,
    val snapshot: AiServicesSnapshot? = null,
    val error: AppError? = null,
    val signedIn: Boolean = false,
    val busyService: String? = null,
    val form: ConnectFormState = ConnectFormState(),
    val showConnect: Boolean = false,
)

sealed interface AiServicesEvent {
    data class OpenUrl(val url: String) : AiServicesEvent
    data object RequireSignIn : AiServicesEvent
}

class AiServicesViewModel(
    private val aiRepository: AiRepository,
    authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(AiServicesUiState())
    val state: StateFlow<AiServicesUiState> = _state.asStateFlow()

    private val _events = Channel<AiServicesEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val signedIn = session is SessionState.SignedIn
                _state.update { it.copy(signedIn = signedIn) }
                if (signedIn) load()
            }
        }
    }

    fun load() {
        if (!_state.value.signedIn) return
        _state.update { it.copy(loading = _state.value.snapshot == null, error = null) }
        viewModelScope.launch {
            when (val result = aiRepository.services()) {
                is ApiResult.Success -> _state.update {
                    it.copy(snapshot = result.data, loading = false, error = null)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun startConnect(providerId: String) {
        if (!_state.value.signedIn) {
            _events.trySend(AiServicesEvent.RequireSignIn)
            return
        }
        val provider = _state.value.snapshot?.providers?.firstOrNull { it.id == providerId }
            ?: AiProviderInfo(providerId, providerId, "", "")
        _state.update {
            it.copy(
                showConnect = true,
                form = ConnectFormState(
                    provider = provider,
                    model = provider.defaultModel.takeIf { model -> model.isNotBlank() }.orEmpty(),
                ),
            )
        }
    }

    fun dismissConnect() {
        if (_state.value.form.submitting) return
        _state.update { it.copy(showConnect = false, form = ConnectFormState()) }
    }

    fun setApiKey(value: String) = _state.update {
        it.copy(form = it.form.copy(apiKey = value.trim(), error = null))
    }

    fun setBaseUrl(value: String) = _state.update {
        it.copy(form = it.form.copy(baseUrl = value.trim(), error = null))
    }

    fun setModel(value: String) = _state.update {
        it.copy(form = it.form.copy(model = value.trim(), error = null))
    }

    fun toggleKeyVisibility() = _state.update {
        it.copy(form = it.form.copy(keyVisible = !it.form.keyVisible))
    }

    fun submitConnect() {
        val form = _state.value.form
        val provider = form.provider ?: return
        if (form.submitting) return
        if (form.apiKey.isBlank()) {
            _state.update { it.copy(form = it.form.copy(error = "Paste the API key for ${provider.label}.")) }
            return
        }
        _state.update { it.copy(form = it.form.copy(submitting = true, error = null)) }
        viewModelScope.launch {
            when (
                val result = aiRepository.connect(
                    providerId = provider.id,
                    apiKey = form.apiKey,
                    baseUrl = form.baseUrl.takeIf { it.isNotBlank() },
                    model = form.model.takeIf { it.isNotBlank() },
                )
            ) {
                is ApiResult.Success -> {
                    _state.update { it.copy(showConnect = false, form = ConnectFormState(), busyService = provider.id) }
                    messenger.success("${provider.label} connected. Your key stays on the server.")
                    load()
                    viewModelScope.launch {
                        aiRepository.test(provider.id).let { test ->
                            if (test is ApiResult.Success) {
                                messenger.info("Live test passed on ${test.data}.")
                            }
                        }
                        _state.update { it.copy(busyService = null) }
                    }
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(
                        form = it.form.copy(
                            submitting = false,
                            error = result.error.userMessage,
                        ),
                    )
                }
            }
        }
    }

    fun toggleActive(name: String, active: Boolean) {
        if (_state.value.busyService != null) return
        _state.update { it.copy(busyService = name) }
        viewModelScope.launch {
            when (val result = aiRepository.setActive(name, active)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        val snap = current.snapshot
                        current.copy(
                            busyService = null,
                            snapshot = snap?.copy(
                                connected = snap.connected.map {
                                    if (it.name == name) it.copy(isActive = active) else it
                                },
                            ),
                        )
                    }
                    messenger.info(if (active) "$name enabled." else "$name paused.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyService = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun testService(name: String) {
        if (_state.value.busyService != null) return
        _state.update { it.copy(busyService = name) }
        viewModelScope.launch {
            when (val result = aiRepository.test(name)) {
                is ApiResult.Success -> messenger.success("Connection healthy — ${result.data}.")
                is ApiResult.Failure -> messenger.error(result.error.userMessage)
            }
            _state.update { it.copy(busyService = null) }
        }
    }

    fun disconnect(name: String) {
        if (_state.value.busyService != null) return
        _state.update { it.copy(busyService = name) }
        viewModelScope.launch {
            when (val result = aiRepository.disconnect(name)) {
                is ApiResult.Success -> {
                    messenger.success("Disconnected. The stored key was deleted.")
                    _state.update { it.copy(busyService = null) }
                    load()
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyService = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun openDocs() {
        val url = _state.value.form.provider?.docsUrl?.takeIf { it.isNotBlank() }
        if (url != null) _events.trySend(AiServicesEvent.OpenUrl(url))
    }
}
