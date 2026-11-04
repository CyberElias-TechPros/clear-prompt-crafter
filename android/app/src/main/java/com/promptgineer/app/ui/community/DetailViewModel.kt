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
import com.promptgineer.app.domain.Comment
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.PromptDetail
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DetailUiState(
    val loading: Boolean = true,
    val item: PromptDetail? = null,
    val error: AppError? = null,
    val fromCache: Boolean = false,
    val cachedAt: Long? = null,
    val comments: List<Comment> = emptyList(),
    val commentsLoading: Boolean = false,
    val commentsError: AppError? = null,
    val commentInput: String = "",
    val postingComment: Boolean = false,
    val liking: Boolean = false,
    val bookmarked: Boolean = false,
    val signedIn: Boolean = false,
    val currentUserId: String? = null,
    val updatingVisibility: Boolean = false,
    val deleting: Boolean = false,
) {
    val isOwner: Boolean
        get() = currentUserId != null && item?.authorId == currentUserId
}

sealed interface DetailEvent {
    data object RequireSignIn : DetailEvent
    data object Deleted : DetailEvent
}

class DetailViewModel(
    private val kind: ItemKind,
    private val itemId: String,
    private val contentRepository: ContentRepository,
    private val draftRepository: DraftRepository,
    authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(DetailUiState())
    val state: StateFlow<DetailUiState> = _state.asStateFlow()

    private val _events = Channel<DetailEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                _state.update {
                    it.copy(
                        signedIn = session is SessionState.SignedIn,
                        currentUserId = (session as? SessionState.SignedIn)?.user?.id,
                    )
                }
            }
        }
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = contentRepository.detail(kind, itemId)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            loading = false,
                            item = result.data.item,
                            fromCache = result.data.fromCache,
                            cachedAt = result.data.cachedAt,
                            error = null,
                        )
                    }
                    val bookmark = draftRepository.isBookmarked(kind, itemId)
                    _state.update { it.copy(bookmarked = bookmark) }
                    loadComments()
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun loadComments() {
        _state.update { it.copy(commentsLoading = true, commentsError = null) }
        viewModelScope.launch {
            when (val result = contentRepository.comments(kind, itemId)) {
                is ApiResult.Success -> _state.update {
                    it.copy(comments = result.data, commentsLoading = false)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(commentsLoading = false, commentsError = result.error)
                }
            }
        }
    }

    fun setCommentInput(value: String) = _state.update { it.copy(commentInput = value.take(2_000)) }

    fun postComment() {
        val snapshot = _state.value
        val text = snapshot.commentInput.trim()
        if (text.isEmpty() || snapshot.postingComment) return
        if (!snapshot.signedIn) {
            _events.trySend(DetailEvent.RequireSignIn)
            return
        }
        _state.update { it.copy(postingComment = true) }
        viewModelScope.launch {
            when (val result = contentRepository.addComment(kind, itemId, text)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            postingComment = false,
                            commentInput = "",
                            comments = it.comments + result.data,
                        )
                    }
                    messenger.success("Comment posted — 2 points earned.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(postingComment = false) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun toggleLike() {
        val snapshot = _state.value
        val item = snapshot.item ?: return
        if (!snapshot.signedIn) {
            _events.trySend(DetailEvent.RequireSignIn)
            return
        }
        if (snapshot.liking) return

        val wasLiked = item.likedByMe
        val optimistic = item.copy(
            likedByMe = !wasLiked,
            likes = (item.likes + if (wasLiked) -1 else 1).coerceAtLeast(0),
        )
        _state.update { it.copy(item = optimistic, liking = true) }

        viewModelScope.launch {
            when (val result = contentRepository.toggleLike(kind, itemId)) {
                is ApiResult.Success -> _state.update { current ->
                    current.copy(
                        liking = false,
                        item = current.item?.copy(
                            likedByMe = result.data.liked,
                            likes = result.data.likes,
                        ),
                    )
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(item = item, liking = false) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun toggleBookmark() {
        val item = _state.value.item ?: return
        viewModelScope.launch {
            val bookmarked = draftRepository.toggleBookmark(kind, item.id, item.title)
            _state.update { it.copy(bookmarked = bookmarked) }
            messenger.info(if (bookmarked) "Saved to your bookmarks." else "Removed from bookmarks.")
        }
    }

    fun setVisibility(isPublic: Boolean) {
        val snapshot = _state.value
        if (!snapshot.isOwner || snapshot.updatingVisibility) return
        _state.update { it.copy(updatingVisibility = true) }
        viewModelScope.launch {
            when (val result = contentRepository.setVisibility(kind, itemId, isPublic)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            updatingVisibility = false,
                            item = it.item?.copy(isPublic = isPublic),
                        )
                    }
                    messenger.success(if (isPublic) "Shared with the community." else "Now private to you.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(updatingVisibility = false) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun deleteItem() {
        val snapshot = _state.value
        if (!snapshot.isOwner || snapshot.deleting) return
        _state.update { it.copy(deleting = true) }
        viewModelScope.launch {
            when (val result = contentRepository.delete(kind, itemId)) {
                is ApiResult.Success -> {
                    messenger.success("Deleted.")
                    _events.trySend(DetailEvent.Deleted)
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(deleting = false) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }
}
