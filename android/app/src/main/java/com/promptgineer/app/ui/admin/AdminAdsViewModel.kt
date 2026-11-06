package com.promptgineer.app.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AdsRepository
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.Ad
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AdFormState(
    val visible: Boolean = false,
    val editingId: String? = null,
    val title: String = "",
    val content: String = "",
    val linkUrl: String = "",
    val imageUrl: String = "",
    val size: String = "small",
    val position: String = "top",
    val active: Boolean = true,
    val submitting: Boolean = false,
    val error: String? = null,
) {
    val isEditing: Boolean get() = editingId != null

    val canSubmit: Boolean
        get() = !submitting && title.isNotBlank() && content.isNotBlank() && linkUrl.isNotBlank()
}

data class AdminAdsUiState(
    val isAdmin: Boolean = false,
    val loading: Boolean = true,
    val ads: List<Ad> = emptyList(),
    val error: AppError? = null,
    val busyId: String? = null,
    val form: AdFormState = AdFormState(),
)

class AdminAdsViewModel(
    private val adsRepository: AdsRepository,
    authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(AdminAdsUiState())
    val state: StateFlow<AdminAdsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val user = (session as? SessionState.SignedIn)?.user
                _state.update { it.copy(isAdmin = user?.isAdmin == true) }
                if (user?.isAdmin == true && _state.value.ads.isEmpty()) load()
            }
        }
    }

    fun load() {
        if (!_state.value.isAdmin) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = adsRepository.adminList()) {
                is ApiResult.Success -> _state.update {
                    it.copy(ads = result.data, loading = false, error = null)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun startCreate() = _state.update {
        it.copy(form = AdFormState(visible = true))
    }

    fun startEdit(ad: Ad) = _state.update {
        it.copy(
            form = AdFormState(
                visible = true,
                editingId = ad.id,
                title = ad.title,
                content = ad.content,
                linkUrl = ad.linkUrl,
                imageUrl = ad.imageUrl.orEmpty(),
                size = ad.size,
                position = ad.position,
                active = ad.isActive,
            ),
        )
    }

    fun dismissForm() {
        if (_state.value.form.submitting) return
        _state.update { it.copy(form = AdFormState()) }
    }

    fun setTitle(value: String) = _state.update { it.copy(form = it.form.copy(title = value.take(120), error = null)) }
    fun setContent(value: String) = _state.update { it.copy(form = it.form.copy(content = value.take(400), error = null)) }
    fun setLink(value: String) = _state.update { it.copy(form = it.form.copy(linkUrl = value.trim(), error = null)) }
    fun setImage(value: String) = _state.update { it.copy(form = it.form.copy(imageUrl = value.trim(), error = null)) }
    fun setSize(value: String) = _state.update { it.copy(form = it.form.copy(size = value)) }
    fun setPosition(value: String) = _state.update { it.copy(form = it.form.copy(position = value)) }
    fun setActive(value: Boolean) = _state.update { it.copy(form = it.form.copy(active = value)) }

    fun submitForm() {
        val form = _state.value.form
        if (form.submitting) return
        val error = when {
            form.title.isBlank() -> "A title is required."
            form.content.isBlank() -> "Add the body copy people will read."
            form.linkUrl.isBlank() -> "A link is required."
            !(form.linkUrl.startsWith("http://") || form.linkUrl.startsWith("https://") || form.linkUrl.startsWith("/")) ->
                "Links must be https:// URLs or in-app paths starting with /."
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(form = it.form.copy(error = error)) }
            return
        }
        _state.update { it.copy(form = it.form.copy(submitting = true, error = null)) }
        viewModelScope.launch {
            val form2 = _state.value.form
            val result = if (form2.isEditing && form2.editingId != null) {
                adsRepository.update(
                    Ad(
                        id = form2.editingId,
                        title = form2.title,
                        content = form2.content,
                        imageUrl = form2.imageUrl.takeIf { it.isNotBlank() },
                        linkUrl = form2.linkUrl,
                        size = form2.size,
                        position = form2.position,
                        isActive = form2.active,
                        createdAt = null,
                    ),
                )
            } else {
                adsRepository.create(
                    title = form2.title,
                    content = form2.content,
                    linkUrl = form2.linkUrl,
                    imageUrl = form2.imageUrl.takeIf { it.isNotBlank() },
                    size = form2.size,
                    position = form2.position,
                    isActive = form2.active,
                )
            }
            when (result) {
                is ApiResult.Success -> {
                    _state.update { it.copy(form = AdFormState()) }
                    messenger.success(if (form2.isEditing) "Ad updated." else "Ad created.")
                    load()
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(form = it.form.copy(submitting = false, error = result.error.userMessage))
                }
            }
        }
    }

    fun toggleActive(ad: Ad, active: Boolean) {
        if (_state.value.busyId != null) return
        _state.update { it.copy(busyId = ad.id) }
        viewModelScope.launch {
            when (val result = adsRepository.setActive(ad, active)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(
                            busyId = null,
                            ads = current.ads.map { if (it.id == ad.id) it.copy(isActive = active) else it },
                        )
                    }
                    messenger.info(if (active) "Ad enabled." else "Ad paused.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyId = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    fun delete(ad: Ad) {
        if (_state.value.busyId != null) return
        _state.update { it.copy(busyId = ad.id) }
        viewModelScope.launch {
            when (val result = adsRepository.delete(ad.id)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(busyId = null, ads = current.ads.filterNot { it.id == ad.id })
                    }
                    messenger.success("Ad deleted.")
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(busyId = null) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }
}
