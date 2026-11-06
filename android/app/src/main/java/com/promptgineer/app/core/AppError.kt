package com.promptgineer.app.core

/**
 * Errors are modelled explicitly so the UI can respond usefully (retry, sign in,
 * upgrade quota, fix input) instead of showing a raw exception string.
 */
sealed class AppError(val userMessage: String, open val cause: Throwable? = null) {

    data class Network(val detail: String? = null, override val cause: Throwable? = null) :
        AppError(
            userMessage = detail ?: "You're offline. Check your connection and try again.",
            cause = cause,
        )

    data class Timeout(override val cause: Throwable? = null) :
        AppError("The server is taking too long to respond. Try again in a moment.", cause)

    data class Unauthorized(val detail: String? = null) :
        AppError(detail ?: "Your session has expired. Please sign in again.")

    data class Forbidden(val detail: String? = null) :
        AppError(detail ?: "You don't have permission to do that.")

    data class NotFound(val detail: String? = null) :
        AppError(detail ?: "We couldn't find that. It may have been removed.")

    data class RateLimited(val detail: String? = null) :
        AppError(
            detail ?: "You've reached today's free limit. Connect your own API key for unlimited use, or try again tomorrow.",
        )

    data class Server(val status: Int, val detail: String? = null) :
        AppError(detail ?: "The service had a problem (HTTP $status). Please try again.", null)

    data class Validation(val detail: String) : AppError(detail)

    data class Unknown(val detail: String? = null, override val cause: Throwable? = null) :
        AppError(detail ?: "Something unexpected happened. Please try again.", cause)

    val isRetryable: Boolean
        get() = this is Network || this is Timeout || (this is Server && status >= 500)

    val requiresSignIn: Boolean
        get() = this is Unauthorized
}

sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Failure(val error: AppError) : ApiResult<Nothing>
}

inline fun <T> ApiResult<T>.onSuccess(action: (T) -> Unit): ApiResult<T> {
    if (this is ApiResult.Success) action(data)
    return this
}

inline fun <T> ApiResult<T>.onFailure(action: (AppError) -> Unit): ApiResult<T> {
    if (this is ApiResult.Failure) action(error)
    return this
}

fun <T> ApiResult<T>.getOrNull(): T? = when (this) {
    is ApiResult.Success -> data
    is ApiResult.Failure -> null
}

fun <T> ApiResult<T>.errorOrNull(): AppError? = (this as? ApiResult.Failure)?.error
