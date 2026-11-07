package com.promptgineer.app.data.repo

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.core.AppSettings
import com.promptgineer.app.core.ServerConfig
import com.promptgineer.app.core.ThemeMode
import com.promptgineer.app.data.local.SettingsStore
import com.promptgineer.app.data.local.TokenStore
import com.promptgineer.app.data.remote.ApiProvider
import kotlinx.coroutines.flow.Flow

class SettingsRepository(
    private val store: SettingsStore,
    private val serverConfig: ServerConfig,
    private val apiProvider: ApiProvider,
    private val tokenStore: TokenStore,
) {
    val settings: Flow<AppSettings> = store.settings

    suspend fun completeOnboarding() = store.setOnboardingCompleted(true)

    suspend fun setTheme(theme: ThemeMode) = store.setTheme(theme)

    suspend fun setDynamicColor(enabled: Boolean) = store.setDynamicColor(enabled)

    suspend fun setHaptics(enabled: Boolean) = store.setHaptics(enabled)

    suspend fun setLastSort(sort: String) = store.setLastCommunitySort(sort)

    /**
     * Verifies the candidate server actually answers, then persists it and drops
     * the session token (a token issued by one deployment is meaningless on
     * another). The caller signs the session out afterwards.
     */
    suspend fun updateServer(rawUrl: String): ApiResult<Unit> {
        ServerConfig.validate(rawUrl)?.let { return ApiResult.Failure(AppError.Validation(it)) }
        val normalized = ServerConfig.normalize(rawUrl)
        return when (val probe = apiProvider.probeHealth(normalized)) {
            is ApiResult.Failure -> ApiResult.Failure(
                AppError.Validation(
                    "Could not reach that server. ${probe.error.userMessage}",
                ),
            )
            is ApiResult.Success -> {
                if (!probe.data.database) {
                    ApiResult.Failure(
                        AppError.Validation("The server answered, but its database is not ready yet."),
                    )
                } else {
                    store.setServerUrl(normalized)
                    serverConfig.update(normalized)
                    tokenStore.clear()
                    ApiResult.Success(Unit)
                }
            }
        }
    }

    suspend fun resetServer(): ApiResult<Unit> = updateServer(ServerConfig.DEFAULT)
}
