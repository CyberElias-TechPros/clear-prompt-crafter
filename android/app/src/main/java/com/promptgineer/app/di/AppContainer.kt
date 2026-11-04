package com.promptgineer.app.di

import android.app.Application
import com.promptgineer.app.core.IntentRouter
import com.promptgineer.app.core.ServerConfig
import com.promptgineer.app.core.SessionEvents
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.local.LocalDatabase
import com.promptgineer.app.data.local.SettingsStore
import com.promptgineer.app.data.local.TokenStore
import com.promptgineer.app.data.remote.ApiProvider
import com.promptgineer.app.data.repo.AdsRepository
import com.promptgineer.app.data.repo.AiRepository
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SettingsRepository
import com.promptgineer.app.util.NetworkMonitor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

/**
 * Manual dependency container.
 *
 * A DI framework is not worth an annotation processor for a graph this size;
 * everything is explicit, lazily constructed and easy to test with fakes.
 */
class AppContainer(application: Application) {

    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val tokenStore = TokenStore(application)
    private val settingsStore = SettingsStore(application)
    val sessionEvents = SessionEvents()
    val messenger = UiMessenger()
    val serverConfig = ServerConfig()
    val apiProvider = ApiProvider(serverConfig, tokenStore, sessionEvents)
    val database = LocalDatabase(application)
    val networkMonitor = NetworkMonitor(application)
    val intentRouter = IntentRouter()

    val authRepository = AuthRepository(
        apiProvider = apiProvider,
        tokenStore = tokenStore,
        sessionEvents = sessionEvents,
        database = database,
        messenger = messenger,
        scope = applicationScope,
    )

    val contentRepository = ContentRepository(apiProvider, database)
    val adsRepository = AdsRepository(apiProvider)
    val aiRepository = AiRepository(apiProvider)
    val draftRepository = DraftRepository(database)

    val settingsRepository = SettingsRepository(
        store = settingsStore,
        serverConfig = serverConfig,
        apiProvider = apiProvider,
        tokenStore = tokenStore,
    )

    init {
        applicationScope.launch {
            settingsStore.settings
                .map { it.serverUrl }
                .distinctUntilChanged()
                .collect { serverConfig.update(it) }
        }
    }
}
