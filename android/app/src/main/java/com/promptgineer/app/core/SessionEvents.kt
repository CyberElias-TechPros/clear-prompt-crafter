package com.promptgineer.app.core

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Emits when the API rejects a stored token (HTTP 401). The auth layer listens
 * and clears the local session once, no matter how many requests failed.
 */
class SessionEvents {
    private val _unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val unauthorized: SharedFlow<Unit> = _unauthorized.asSharedFlow()

    fun notifyUnauthorized() {
        _unauthorized.tryEmit(Unit)
    }
}

/**
 * A tiny app-wide channel for confirmations and errors. Screens collect this
 * once at the navigation root, so repositories and view models never need a
 * Context or a SnackbarHost.
 */
class UiMessenger {
    private val _messages = MutableSharedFlow<UiMessage>(extraBufferCapacity = 8)
    val messages: SharedFlow<UiMessage> = _messages.asSharedFlow()

    fun info(text: String) {
        _messages.tryEmit(UiMessage(text, isError = false))
    }

    fun success(text: String) {
        _messages.tryEmit(UiMessage(text, isError = false))
    }

    fun error(text: String) {
        _messages.tryEmit(UiMessage(text, isError = true))
    }

    fun fromError(error: AppError) {
        _messages.tryEmit(UiMessage(error.userMessage, isError = true))
    }
}

data class UiMessage(val text: String, val isError: Boolean)
