package com.promptgineer.app.data.remote

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLException

@OptIn(ExperimentalSerializationApi::class)
object NetworkJson {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
        isLenient = true
        encodeDefaults = false
    }
}

/**
 * Runs a network call and converts every failure into an [AppError] with copy a
 * person can act on. Cancellation is always rethrown so coroutine scopes behave.
 */
suspend fun <T> apiCall(block: suspend () -> T): ApiResult<T> = try {
    ApiResult.Success(block())
} catch (cancellation: CancellationException) {
    throw cancellation
} catch (throwable: Throwable) {
    ApiResult.Failure(throwable.toAppError())
}

fun Throwable.toAppError(): AppError = when (this) {
    is HttpException -> {
        val message = parseServerMessage(this)
        when (code()) {
            400, 409, 422 -> AppError.Validation(message ?: "Please check the details and try again.")
            401 -> AppError.Unauthorized(message)
            403 -> AppError.Forbidden(message)
            404 -> AppError.NotFound(message)
            413 -> AppError.Validation("That's too large to upload.")
            429 -> AppError.RateLimited(message)
            500, 502, 503, 504 -> AppError.Server(
                code(),
                message ?: "The service is unavailable right now. Please try again shortly.",
            )
            else -> AppError.Server(code(), message)
        }
    }
    is SocketTimeoutException -> AppError.Timeout(this)
    is UnknownHostException, is ConnectException -> AppError.Network(cause = this)
    is SSLException -> AppError.Network(
        "Couldn't establish a secure connection. Check the server address in Settings.",
        this,
    )
    is SerializationException -> AppError.Unknown(
        "The server returned an unexpected response. If you self-host, check the API and app versions match.",
        this,
    )
    is IOException -> AppError.Network(cause = this)
    else -> AppError.Unknown(cause = this)
}

private fun parseServerMessage(exception: HttpException): String? {
    val body = try {
        exception.response()?.errorBody()?.string()
    } catch (_: Exception) {
        null
    } ?: return null
    return try {
        NetworkJson.json.parseToJsonElement(body)
            .jsonObject["error"]
            ?.jsonPrimitive
            ?.contentOrNull
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
    } catch (_: Exception) {
        null
    }
}
