package com.promptgineer.app.ui.leaderboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.LeaderboardEntry
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LeaderboardUiState(
    val entries: List<LeaderboardEntry> = emptyList(),
    val loading: Boolean = true,
    val error: AppError? = null,
    val currentUserId: String? = null,
) {
    fun rankOf(userId: String?): Int? {
        if (userId == null) return null
        val index = entries.indexOfFirst { it.userId == userId }
        return if (index >= 0) index + 1 else null
    }
}

class LeaderboardViewModel(
    private val contentRepository: ContentRepository,
    authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(LeaderboardUiState())
    val state: StateFlow<LeaderboardUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                _state.update {
                    it.copy(currentUserId = (session as? SessionState.SignedIn)?.user?.id)
                }
            }
        }
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = contentRepository.leaderboard()) {
                is ApiResult.Success -> _state.update {
                    it.copy(entries = result.data, loading = false, error = null)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }
}
