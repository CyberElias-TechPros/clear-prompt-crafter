package com.promptgineer.app.ui.community

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.Bookmark
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.PromptSummary
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CommunityUiState(
    val kind: ItemKind = ItemKind.PROMPT,
    val sort: String = "recent",
    val query: String = "",
    val committedQuery: String = "",
    val items: List<PromptSummary> = emptyList(),
    val loading: Boolean = false,
    val refreshing: Boolean = false,
    val loadingMore: Boolean = false,
    val error: AppError? = null,
    val fromCache: Boolean = false,
    val cachedAt: Long? = null,
    val endReached: Boolean = false,
    val bookmarkedKeys: Set<String> = emptySet(),
    val signedIn: Boolean = false,
) {
    fun keyFor(item: PromptSummary): String = "${kind.apiPath}:${item.id}"
    fun isBookmarked(item: PromptSummary): Boolean = keyFor(item) in bookmarkedKeys
}

class CommunityViewModel(
    private val contentRepository: ContentRepository,
    private val draftRepository: DraftRepository,
    private val authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(CommunityUiState())
    val state: StateFlow<CommunityUiState> = _state.asStateFlow()

    private var loadJob: Job? = null
    private var searchJob: Job? = null
    private var bookmarksCache: List<Bookmark> = emptyList()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                _state.update { it.copy(signedIn = session is SessionState.SignedIn) }
            }
        }
        loadBookmarks()
        load(reset = true)
    }

    fun setKind(kind: ItemKind) {
        if (_state.value.kind == kind) return
        _state.update { it.copy(kind = kind, items = emptyList(), endReached = false) }
        refreshBookmarksForKind()
        load(reset = true)
    }

    fun setSort(sort: String) {
        if (_state.value.sort == sort) return
        _state.update { it.copy(sort = sort) }
        load(reset = true)
    }

    fun onQueryChange(query: String) {
        _state.update { it.copy(query = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350)
            _state.update { it.copy(committedQuery = query.trim()) }
            load(reset = true)
        }
    }

    fun clearQuery() {
        searchJob?.cancel()
        _state.update { it.copy(query = "", committedQuery = "") }
        load(reset = true)
    }

    fun refresh() {
        load(reset = true, refreshing = true)
        loadBookmarks()
    }

    fun loadMore() {
        val snapshot = _state.value
        if (snapshot.loading || snapshot.loadingMore || snapshot.endReached || snapshot.items.isEmpty()) return
        load(reset = false)
    }

    private fun load(reset: Boolean, refreshing: Boolean = false) {
        loadJob?.cancel()
        val snapshot = _state.value
        _state.update {
            it.copy(
                loading = reset,
                refreshing = refreshing,
                loadingMore = !reset,
                error = null,
            )
        }
        loadJob = viewModelScope.launch {
            val offset = if (reset) 0 else _state.value.items.size
            when (
                val result = contentRepository.feed(
                    kind = snapshot.kind,
                    sort = snapshot.sort,
                    query = snapshot.committedQuery,
                    offset = offset,
                    limit = PAGE_SIZE,
                )
            ) {
                is ApiResult.Success -> {
                    val page = result.data.items
                    _state.update { current ->
                        val merged = if (offset == 0) page else (current.items + page).distinctBy { it.id }
                        current.copy(
                            items = merged,
                            loading = false,
                            refreshing = false,
                            loadingMore = false,
                            error = null,
                            fromCache = result.data.fromCache,
                            cachedAt = result.data.cachedAt,
                            endReached = page.size < PAGE_SIZE,
                        )
                    }
                    if (result.data.fromCache) {
                        messenger.info("Showing the saved copy — reconnect to refresh.")
                    }
                }
                is ApiResult.Failure -> {
                    _state.update {
                        it.copy(
                            loading = false,
                            refreshing = false,
                            loadingMore = false,
                            error = if (offset == 0) result.error else it.error,
                        )
                    }
                }
            }
        }
    }

    fun toggleBookmark(item: PromptSummary) {
        val kind = _state.value.kind
        viewModelScope.launch {
            val nowBookmarked = draftRepository.toggleBookmark(kind, item.id, item.title)
            loadBookmarks()
            messenger.info(if (nowBookmarked) "Saved to your bookmarks." else "Removed from bookmarks.")
        }
    }

    private fun loadBookmarks() {
        viewModelScope.launch {
            bookmarksCache = draftRepository.bookmarks()
            refreshBookmarksForKind()
        }
    }

    private fun refreshBookmarksForKind() {
        val kind = _state.value.kind
        val keys = bookmarksCache
            .filter { it.kind == kind }
            .map { "${kind.apiPath}:${it.itemId}" }
            .toSet()
        _state.update { it.copy(bookmarkedKeys = keys) }
    }

    private companion object {
        const val PAGE_SIZE = 20
    }
}
