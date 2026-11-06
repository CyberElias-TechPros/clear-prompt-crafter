package com.promptgineer.app.ui.info

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.core.Validate
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.SessionState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ContactUiState(
    val name: String = "",
    val email: String = "",
    val subject: String = "",
    val message: String = "",
    val nameError: String? = null,
    val emailError: String? = null,
    val subjectError: String? = null,
    val messageError: String? = null,
    val submitting: Boolean = false,
    val sent: Boolean = false,
    val formError: String? = null,
) {
    val canSubmit: Boolean
        get() = !submitting && name.isNotBlank() && email.isNotBlank() &&
            subject.isNotBlank() && message.isNotBlank()
}

class ContactViewModel(
    private val contentRepository: ContentRepository,
    authRepository: AuthRepository,
    private val messenger: UiMessenger,
) : ViewModel() {

    private val _state = MutableStateFlow(ContactUiState())
    val state: StateFlow<ContactUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val user = (session as? SessionState.SignedIn)?.user ?: return@collect
                _state.update {
                    it.copy(
                        name = it.name.ifBlank { user.fullName.orEmpty() },
                        email = it.email.ifBlank { user.email },
                    )
                }
            }
        }
    }

    fun setName(value: String) = _state.update {
        it.copy(name = value.take(120), nameError = null, formError = null)
    }

    fun setEmail(value: String) = _state.update {
        it.copy(email = value.trimStart().take(254), emailError = null, formError = null)
    }

    fun setSubject(value: String) = _state.update {
        it.copy(subject = value.take(160), subjectError = null, formError = null)
    }

    fun setMessage(value: String) = _state.update {
        it.copy(message = value.take(5_000), messageError = null, formError = null)
    }

    fun submit() {
        val snapshot = _state.value
        if (snapshot.submitting) return
        val nameError = if (snapshot.name.isBlank()) "Please add your name." else null
        val emailError = Validate.email(snapshot.email)
        val subjectError = if (snapshot.subject.isBlank()) "Add a short subject." else null
        val messageError = when {
            snapshot.message.isBlank() -> "Tell us what's happening."
            snapshot.message.trim().length < 10 -> "A little more detail helps us route this correctly."
            else -> null
        }
        if (nameError != null || emailError != null || subjectError != null || messageError != null) {
            _state.update {
                it.copy(
                    nameError = nameError,
                    emailError = emailError,
                    subjectError = subjectError,
                    messageError = messageError,
                )
            }
            return
        }

        _state.update { it.copy(submitting = true, formError = null) }
        viewModelScope.launch {
            when (
                val result = contentRepository.sendContact(
                    name = snapshot.name,
                    email = snapshot.email,
                    subject = snapshot.subject,
                    message = snapshot.message,
                )
            ) {
                is ApiResult.Success -> {
                    _state.update { it.copy(submitting = false, sent = true) }
                    messenger.success("Message sent. We read every one.")
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(submitting = false, formError = result.error.userMessage)
                }
            }
        }
    }

    fun startAnother() = _state.update {
        it.copy(sent = false, subject = "", message = "", formError = null)
    }
}
