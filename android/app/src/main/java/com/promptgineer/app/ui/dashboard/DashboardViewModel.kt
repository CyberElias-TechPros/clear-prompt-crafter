package com.promptgineer.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.data.repo.AdsRepository
import com.promptgineer.app.data.repo.AiRepository
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.Ad
import com.promptgineer.app.domain.AiServicesSnapshot
import com.promptgineer.app.domain.LeaderboardEntry
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.domain.PlatformAi
import com.promptgineer.app.domain.User
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DashboardUiState(
    val user: User? = null,
    val signedIn: Boolean = false,
    val prompts: List<MyItem> = emptyList(),
    val templates: List<MyItem> = emptyList(),
    val draftsCount: Int = 0,
    val bookmarksCount: Int = 0,
    val ads: List<Ad> = emptyList(),
    val platform: PlatformAi? = null,
    val hasByok: Boolean = false,
    val points: Int? = null,
    val rank: Int? = null,
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val error: AppError? = null,
) {
    val totalLikes: Int get() = prompts.sumOf { it.likes } + templates.sumOf { it.likes }
    val topAd: Ad? get() = ads.firstOrNull { it.position == "top" } ?: ads.firstOrNull()
}

class DashboardViewModel(
    private val contentRepository: ContentRepository,
    private val aiRepository: AiRepository,
    private val adsRepository: AdsRepository,
    private val draftRepository: DraftRepository,
    authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

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
                refresh()
            }
        }
    }

    fun refresh() {
        val signedIn = _state.value.signedIn
        _state.update { it.copy(refreshing = it.loading.not(), error = null) }
        viewModelScope.launch {
            val local = async {
                draftRepository.drafts().size to draftRepository.bookmarks().size
            }
            val adsResult = async { adsRepository.active() }

            val remote = if (signedIn) {
                val prompts = async { contentRepository.mine(com.promptgineer.app.domain.ItemKind.PROMPT) }
                val templates = async { contentRepository.mine(com.promptgineer.app.domain.ItemKind.TEMPLATE) }
                val services = async { aiRepository.services() }
                val leaderboard = async { contentRepository.leaderboard() }
                awaitAll(prompts, templates, services, leaderboard)
            } else {
                emptyList()
            }

            val (draftCount, bookmarkCount) = local.await()
            val ads = (adsResult.await() as? ApiResult.Success<List<Ad>>)?.data.orEmpty()

            var prompts: List<MyItem> = emptyList()
            var templates: List<MyItem> = emptyList()
            var platform: PlatformAi? = null
            var hasByok = false
            var points: Int? = null
            var rank: Int? = null
            var error: AppError? = null

            if (signedIn && remote.size == 4) {
                val promptsResult = remote[0] as ApiResult<List<MyItem>>
                val templatesResult = remote[1] as ApiResult<List<MyItem>>
                prompts = (promptsResult as? ApiResult.Success<List<MyItem>>)?.data.orEmpty()
                templates = (templatesResult as? ApiResult.Success<List<MyItem>>)?.data.orEmpty()
                error = (promptsResult as? ApiResult.Failure)?.error

                val services = (remote[2] as? ApiResult.Success<AiServicesSnapshot>)?.data
                platform = services?.platform
                hasByok = services?.hasByok == true

                val entries = (remote[3] as? ApiResult.Success<List<LeaderboardEntry>>)?.data.orEmpty()
                val userId = _state.value.user?.id
                val index = entries.indexOfFirst { it.userId == userId }
                if (index >= 0) {
                    rank = index + 1
                    points = entries[index].totalPoints
                }
            }

            _state.update {
                it.copy(
                    prompts = prompts,
                    templates = templates,
                    draftsCount = draftCount,
                    bookmarksCount = bookmarkCount,
                    ads = ads,
                    platform = platform,
                    hasByok = hasByok,
                    points = points,
                    rank = rank,
                    loading = false,
                    refreshing = false,
                    error = error,
                )
            }
        }
    }
}
