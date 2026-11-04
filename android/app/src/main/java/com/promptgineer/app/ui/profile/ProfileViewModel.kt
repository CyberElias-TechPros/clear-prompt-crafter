package com.promptgineer.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LeaderboardEntry
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.domain.User
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileEditState(
    val visible: Boolean = false,
    val fullName: String = "",
    val avatarUrl: String = "",
    val saving: Boolean = false,
    val error: String? = null,
)

data class ProfileUiState(
    val user: User? = null,
    val signedIn: Boolean = false,
    val prompts: List<MyItem> = emptyList(),
    val templates: List<MyItem> = emptyList(),
    val drafts: Int = 0,
    val bookmarks: Int = 0,
    val rank: Int? = null,
    val points: Int? = null,
    val loadingStats: Boolean = false,
    val signingOut: Boolean = false,
    val updatingLearning: Boolean = false,
    val edit: ProfileEditState = ProfileEditState(),
) {
    val totalLikes: Int get() = prompts.sumOf { it.likes } + templates.sumOf { it.likes }
    val totalViews: Int get() = prompts.sumOf { it.views } + templates.sumOf { it.views }
}

class ProfileViewModel(
    private val authRepository: AuthRepository,
    private val contentRepository: ContentRepository,
    private val draftRepository: DraftRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val signedIn = session is SessionState.SignedIn
                _state.update {
                    it.copy(
                        signedIn = signedIn,
                        user = (session as? SessionState.SignedIn)?.user,
                    )
                }
                loadStats()
            }
        }
    }

    fun loadStats() {
        if (!_state.value.signedIn) return
        _state.update { it.copy(loadingStats = true) }
        viewModelScope.launch {
            val localDrafts = async { draftRepository.drafts().size }
            val localBookmarks = async { draftRepository.bookmarks().size }
            val prompts = async { contentRepository.mine(ItemKind.PROMPT) }
            val templates = async { contentRepository.mine(ItemKind.TEMPLATE) }
            val leaderboard = async { contentRepository.leaderboard() }

            val promptItems = (prompts.await() as? ApiResult.Success<List<MyItem>>)?.data.orEmpty()
            val templateItems = (templates.await() as? ApiResult.Success<List<MyItem>>)?.data.orEmpty()
            val entries = (leaderboard.await() as? ApiResult.Success<List<LeaderboardEntry>>)?.data.orEmpty()
            val draftCount = localDrafts.await()
            val bookmarkCount = localBookmarks.await()
            val myIndex = entries.indexOfFirst { it.userId == _state.value.user?.id }

            _state.update {
                it.copy(
                    prompts = promptItems,
                    templates = templateItems,
                    drafts = draftCount,
                    bookmarks = bookmarkCount,
                    rank = if (myIndex >= 0) myIndex + 1 else null,
                    points = if (myIndex >= 0) entries[myIndex].totalPoints else null,
                    loadingStats = false,
                )
            }
        }
    }

    fun startEdit() {
        val user = _state.value.user ?: return
        _state.update {
            it.copy(
                edit = ProfileEditState(
                    visible = true,
                    fullName = user.fullName.orEmpty(),
                    avatarUrl = user.avatarUrl.orEmpty(),
                ),
            )
        }
    }

    fun dismissEdit() {
        if (_state.value.edit.saving) return
        _state.update { it.copy(edit = ProfileEditState()) }
    }

    fun setEditName(value: String) = _state.update {
        it.copy(edit = it.edit.copy(fullName = value.take(120), error = null))
    }

    fun setEditAvatar(value: String) = _state.update {
        it.copy(edit = it.edit.copy(avatarUrl = value.trim().take(500), error = null))
    }

    fun saveProfile() {
        val edit = _state.value.edit
        if (edit.saving) return
        if (edit.fullName.isBlank()) {
            _state.update { it.copy(edit = it.edit.copy(error = "A display name helps people recognise you.")) }
            return
        }
        if (edit.avatarUrl.isNotBlank() && !edit.avatarUrl.startsWith("https://")) {
            _state.update { it.copy(edit = it.edit.copy(error = "Avatar links must start with https://")) }
            return
        }
        _state.update { it.copy(edit = it.edit.copy(saving = true, error = null)) }
        viewModelScope.launch {
            when (
                val result = authRepository.updateProfile(
                    fullName = edit.fullName.trim(),
                    avatarUrl = edit.avatarUrl.takeIf { it.isNotBlank() },
                )
            ) {
                is ApiResult.Success -> {
                    _state.update { it.copy(edit = ProfileEditState()) }
                    messenger.success("Profile updated.")
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(edit = it.edit.copy(saving = false, error = result.error.userMessage))
                }
            }
        }
    }

    fun setLearningAllowed(allowed: Boolean) {
        if (_state.value.updatingLearning) return
        _state.update { it.copy(updatingLearning = true) }
        viewModelScope.launch {
            when (val result = authRepository.updateProfile(allowLearning = allowed)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(updatingLearning = false) }
                    messenger.success(
                        if (allowed) {
                            "Thanks — your public prompts may inform improvements."
                        } else {
                            "Opted out. Your prompts are excluded from learning."
                        },
                    )
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(updatingLearning = false) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun signOut() {
        if (_state.value.signingOut) return
        _state.update { it.copy(signingOut = true) }
        viewModelScope.launch {
            authRepository.signOut()
            _state.update { it.copy(signingOut = false) }
            messenger.info("Signed out. Local drafts are still on this device.")
        }
    }
}
