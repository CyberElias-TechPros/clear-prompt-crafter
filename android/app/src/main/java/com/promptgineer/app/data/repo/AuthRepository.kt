package com.promptgineer.app.data.repo

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.SessionEvents
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.local.LocalDatabase
import com.promptgineer.app.data.local.TokenStore
import com.promptgineer.app.data.remote.ApiProvider
import com.promptgineer.app.data.remote.AuthResponse
import com.promptgineer.app.data.remote.ChangePasswordRequest
import com.promptgineer.app.data.remote.LoginRequest
import com.promptgineer.app.data.remote.NetworkJson
import com.promptgineer.app.data.remote.SignUpRequest
import com.promptgineer.app.data.remote.UpdateMeRequest
import com.promptgineer.app.data.remote.UserDto
import com.promptgineer.app.data.remote.apiCall
import com.promptgineer.app.data.remote.toDomain
import com.promptgineer.app.domain.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState

    data class SignedIn(
        val user: User,
        val fromCache: Boolean = false,
    ) : SessionState
}

/**
 * Owns the session lifecycle: token storage, bootstrap, profile updates,
 * password changes, export and deletion.
 *
 * The last known user is cached locally so a cold start without connectivity
 * still opens the app instead of dumping the person back on the sign-in screen.
 */
class AuthRepository(
    private val apiProvider: ApiProvider,
    private val tokenStore: TokenStore,
    private val sessionEvents: SessionEvents,
    private val database: LocalDatabase,
    private val messenger: UiMessenger,
    scope: CoroutineScope,
) {
    private val _session = MutableStateFlow<SessionState>(SessionState.Loading)
    val session: StateFlow<SessionState> = _session.asStateFlow()

    private val prettyJson = Json { prettyPrint = true }

    init {
        scope.launch {
            sessionEvents.unauthorized.collect {
                if (_session.value is SessionState.SignedIn) {
                    clearLocalSession(clearEphemeralOnly = true)
                    _session.value = SessionState.SignedOut
                    messenger.error("Your session expired. Please sign in again.")
                }
            }
        }
    }

    val currentUser: User?
        get() = (_session.value as? SessionState.SignedIn)?.user

    suspend fun bootstrap() {
        if (!tokenStore.hasToken()) {
            _session.value = SessionState.SignedOut
            return
        }
        when (val result = apiCall { apiProvider.api().me() }) {
            is ApiResult.Success -> applyUser(result.data.user, fromCache = false)
            is ApiResult.Failure -> {
                if (result.error.requiresSignIn) {
                    clearLocalSession(clearEphemeralOnly = true)
                    _session.value = SessionState.SignedOut
                } else {
                    val cached = readCachedUser()
                    _session.value = cached?.let { SessionState.SignedIn(it, fromCache = true) }
                        ?: SessionState.SignedOut
                }
            }
        }
    }

    suspend fun signIn(email: String, password: String): ApiResult<User> {
        val result = apiCall {
            apiProvider.api().login(LoginRequest(email = email.trim().lowercase(), password = password))
        }
        return handleAuthResponse(result)
    }

    suspend fun signUp(email: String, password: String, fullName: String?): ApiResult<User> {
        val result = apiCall {
            apiProvider.api().signUp(
                SignUpRequest(
                    email = email.trim().lowercase(),
                    password = password,
                    fullName = fullName?.trim()?.takeIf { it.isNotEmpty() },
                ),
            )
        }
        return handleAuthResponse(result)
    }

    private suspend fun handleAuthResponse(result: ApiResult<AuthResponse>): ApiResult<User> =
        when (result) {
            is ApiResult.Success -> {
                tokenStore.save(result.data.token)
                val user = result.data.user.toDomain()
                cacheUser(result.data.user)
                _session.value = SessionState.SignedIn(user)
                ApiResult.Success(user)
            }
            is ApiResult.Failure -> result
        }

    suspend fun refresh(): ApiResult<User> {
        if (!tokenStore.hasToken()) {
            _session.value = SessionState.SignedOut
            return ApiResult.Failure(com.promptgineer.app.core.AppError.Unauthorized())
        }
        return when (val result = apiCall { apiProvider.api().me() }) {
            is ApiResult.Success -> {
                applyUser(result.data.user, fromCache = false)
                ApiResult.Success(result.data.user.toDomain())
            }
            is ApiResult.Failure -> {
                if (result.error.requiresSignIn) {
                    clearLocalSession(clearEphemeralOnly = true)
                    _session.value = SessionState.SignedOut
                }
                result
            }
        }
    }

    suspend fun updateProfile(
        fullName: String? = null,
        avatarUrl: String? = null,
        allowLearning: Boolean? = null,
    ): ApiResult<User> {
        val result = apiCall {
            apiProvider.api().updateMe(
                UpdateMeRequest(
                    fullName = fullName,
                    avatarUrl = avatarUrl,
                    allowLearning = allowLearning,
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> {
                applyUser(result.data.user, fromCache = false)
                ApiResult.Success(result.data.user.toDomain())
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun changePassword(currentPassword: String, newPassword: String): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().changePassword(ChangePasswordRequest(currentPassword, newPassword))
        }
        return when (result) {
            is ApiResult.Success -> {
                tokenStore.save(result.data.token)
                messenger.success("Password updated. Other devices have been signed out.")
                ApiResult.Success(Unit)
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun exportData(): ApiResult<String> {
        return when (val result = apiCall { apiProvider.api().exportData().string() }) {
            is ApiResult.Success -> {
                val pretty = runCatching {
                    prettyJson.encodeToString(
                        JsonElement.serializer(),
                        NetworkJson.json.parseToJsonElement(result.data),
                    )
                }.getOrNull()
                ApiResult.Success(pretty ?: result.data)
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun deleteAccount(): ApiResult<Unit> {
        return when (val result = apiCall { apiProvider.api().deleteAccount() }) {
            is ApiResult.Success -> {
                clearLocalSession(clearEphemeralOnly = false)
                database.clearAllLocalData()
                _session.value = SessionState.SignedOut
                messenger.success("Your account and local data have been deleted.")
                ApiResult.Success(Unit)
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun signOut() {
        runCatching { apiProvider.api().logout() }
        clearLocalSession(clearEphemeralOnly = true)
        _session.value = SessionState.SignedOut
    }

    /** Used when switching servers or after an unrecoverable 401. */
    suspend fun forceLocalSignOut(clearEphemeralOnly: Boolean = true) {
        clearLocalSession(clearEphemeralOnly)
        _session.value = SessionState.SignedOut
    }

    private suspend fun clearLocalSession(clearEphemeralOnly: Boolean) {
        tokenStore.clear()
        database.putKv(KEY_CACHED_USER, "")
        if (clearEphemeralOnly) {
            database.clearWorkspace()
            database.putKv(LocalDatabase.KEY_COACH_TRANSCRIPT, "")
            database.putKv(LocalDatabase.KEY_REFINE_DRAFT, "")
        }
    }

    private fun applyUser(dto: UserDto, fromCache: Boolean) {
        cacheUser(dto)
        _session.value = SessionState.SignedIn(dto.toDomain(), fromCache = fromCache)
    }

    private suspend fun cacheUser(dto: UserDto) {
        runCatching {
            database.putKv(KEY_CACHED_USER, NetworkJson.json.encodeToString(UserDto.serializer(), dto))
        }
    }

    private suspend fun readCachedUser(): User? {
        val raw = database.getKv(KEY_CACHED_USER) ?: return null
        if (raw.isBlank()) return null
        return runCatching {
            NetworkJson.json.decodeFromString(UserDto.serializer(), raw).toDomain()
        }.getOrNull()
    }

    private companion object {
        const val KEY_CACHED_USER = "cached_user"
    }
}
