package com.promptgineer.app.ui.library

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
import com.promptgineer.app.domain.LocalDraft
import com.promptgineer.app.domain.MyItem
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class LibraryTab(val label: String) {
    DRAFTS("Drafts"),
    PROMPTS("My prompts"),
    TEMPLATES("My templates"),
    SAVED("Saved"),
}

data class LibraryUiState(
    val tab: LibraryTab = LibraryTab.DRAFTS,
    val query: String = "",
    val drafts: List<LocalDraft> = emptyList(),
    val prompts: List<MyItem> = emptyList(),
    val templates: List<MyItem> = emptyList(),
    val bookmarks: List<Bookmark> = emptyList(),
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val error: AppError? = null,
    val signedIn: Boolean = false,
    val busyId: String? = null,
) {
    val visibleDrafts: List<LocalDraft>
        get() = filterByQuery(drafts) { draft ->
            draft.title + " " + draft.description + " " + draft.sections.joinToString(" ") { it.content }
        }

    val visiblePrompts: List<MyItem>
        get() = filterByQuery(prompts) { "${it.title} ${it.description.orEmpty()}" }

    val visibleTemplates: List<MyItem>
        get() = filterByQuery(templates) { "${it.title} ${it.description.orEmpty()}" }

    val visibleBookmarks: List<Bookmark>
        get() = filterByQuery(bookmarks) { it.title }

    private fun <T> filterByQuery(items: List<T>, toText: (T) -> String): List<T> {
        val q = query.trim()
        return if (q.isEmpty()) items else items.filter { toText(it).contains(q, ignoreCase = true) }
    }
}

class LibraryViewModel(
    private val contentRepository: ContentRepository,
    private val draftRepository: DraftRepository,
    authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(LibraryUiState())
    val state: StateFlow<LibraryUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val signedIn = session is SessionState.SignedIn
                val wasSignedIn = _state.value.signedIn
                _state.update { it.copy(signedIn = signedIn) }
                if (signedIn) {
                    loadRemote()
                } else if (wasSignedIn) {
                    _state.update { it.copy(prompts = emptyList(), templates = emptyList()) }
                }
            }
        }
        refresh()
    }

    fun setTab(tab: LibraryTab) = _state.update { it.copy(tab = tab) }

    fun setQuery(query: String) = _state.update { it.copy(query = query) }

    fun refresh() {
        _state.update { it.copy(refreshing = true, error = null) }
        viewModelScope.launch {
            val drafts = draftRepository.drafts()
            val bookmarks = draftRepository.bookmarks()
            _state.update {
                it.copy(
                    drafts = drafts,
                    bookmarks = bookmarks,
                    loading = false,
                    refreshing = false,
                )
            }
            if (_state.value.signedIn) loadRemote()
        }
    }

    private fun loadRemote() {
        if (!_state.value.signedIn) return
        viewModelScope.launch {
            val results = listOf(
                async { contentRepository.mine(ItemKind.PROMPT) },
                async { contentRepository.mine(ItemKind.TEMPLATE) },
            ).awaitAll()

            val promptsResult = results[0]
            val templatesResult = results[1]
            val error = (promptsResult as? ApiResult.Failure)?.error
                ?: (templatesResult as? ApiResult.Failure)?.error

            _state.update { current ->
                current.copy(
                    prompts = (promptsResult as? ApiResult.Success<List<MyItem>>)?.data ?: current.prompts,
                    templates = (templatesResult as? ApiResult.Success<List<MyItem>>)?.data ?: current.templates,
                    loading = false,
                    error = error,
                )
            }
        }
    }

    fun deleteDraft(id: Long) {
        viewModelScope.launch {
            draftRepository.deleteDraft(id)
            _state.update { current ->
                current.copy(drafts = current.drafts.filterNot { it.id == id })
            }
            messenger.success("Draft deleted from this device.")
        }
    }

    fun deleteItem(kind: ItemKind, id: String) {
        if (_state.value.busyId != null) return
        _state.update { it.copy(busyId = id) }
        viewModelScope.launch {
            when (val result = contentRepository.delete(kind, id)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(
                            busyId = null,
                            prompts = if (kind == ItemKind.PROMPT) current.prompts.filterNot { it.id == id } else current.prompts,
                            templates = if (kind == ItemKind.TEMPLATE) current.templates.filterNot { it.id == id } else current.templates,
                        )
                    }
                    messenger.success("Deleted.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyId = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun setVisibility(kind: ItemKind, item: MyItem, isPublic: Boolean) {
        if (_state.value.busyId != null) return
        _state.update { it.copy(busyId = item.id) }
        viewModelScope.launch {
            when (val result = contentRepository.setVisibility(kind, item.id, isPublic)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        val update: (List<MyItem>) -> List<MyItem> = { list ->
                            list.map { if (it.id == item.id) it.copy(isPublic = isPublic) else it }
                        }
                        current.copy(
                            busyId = null,
                            prompts = if (kind == ItemKind.PROMPT) update(current.prompts) else current.prompts,
                            templates = if (kind == ItemKind.TEMPLATE) update(current.templates) else current.templates,
                        )
                    }
                    messenger.success(if (isPublic) "Shared publicly." else "Now private.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyId = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun removeBookmark(bookmark: Bookmark) {
        viewModelScope.launch {
            draftRepository.toggleBookmark(bookmark.kind, bookmark.itemId, bookmark.title)
            _state.update { current ->
                current.copy(bookmarks = current.bookmarks.filterNot {
                    it.kind == bookmark.kind && it.itemId == bookmark.itemId
                })
            }
            messenger.info("Removed from bookmarks.")
        }
    }
}
