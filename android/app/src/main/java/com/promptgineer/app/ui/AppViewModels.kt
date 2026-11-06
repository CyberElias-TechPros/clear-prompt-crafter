package com.promptgineer.app.ui

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.promptgineer.app.di.AppContainer
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.ui.admin.AdminAdsViewModel
import com.promptgineer.app.ui.ai.AiServicesViewModel
import com.promptgineer.app.ui.auth.AuthViewModel
import com.promptgineer.app.ui.community.CommunityViewModel
import com.promptgineer.app.ui.community.DetailViewModel
import com.promptgineer.app.ui.dashboard.DashboardViewModel
import com.promptgineer.app.ui.info.ContactViewModel
import com.promptgineer.app.ui.leaderboard.LeaderboardViewModel
import com.promptgineer.app.ui.library.LibraryViewModel
import com.promptgineer.app.ui.profile.ProfileViewModel
import com.promptgineer.app.ui.settings.SettingsViewModel
import com.promptgineer.app.ui.studio.StudioViewModel

/**
 * Explicit factories instead of reflection-based construction. Each screen gets
 * exactly the repositories it needs, which keeps them easy to fake in tests.
 */
object AppViewModels {

    fun app(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            AppViewModel(
                authRepository = container.authRepository,
                settingsRepository = container.settingsRepository,
                serverConfig = container.serverConfig,
                networkMonitor = container.networkMonitor,
            )
        }
    }

    fun auth(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer { AuthViewModel(container.authRepository, container.messenger) }
    }

    fun studio(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            StudioViewModel(
                authRepository = container.authRepository,
                contentRepository = container.contentRepository,
                aiRepository = container.aiRepository,
                draftRepository = container.draftRepository,
                messenger = container.messenger,
                appScope = container.applicationScope,
            )
        }
    }

    fun community(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            CommunityViewModel(
                contentRepository = container.contentRepository,
                draftRepository = container.draftRepository,
                authRepository = container.authRepository,
                messenger = container.messenger,
            )
        }
    }

    fun detail(container: AppContainer, kind: ItemKind, id: String): ViewModelProvider.Factory =
        viewModelFactory {
            initializer {
                DetailViewModel(
                    kind = kind,
                    itemId = id,
                    contentRepository = container.contentRepository,
                    draftRepository = container.draftRepository,
                    authRepository = container.authRepository,
                    messenger = container.messenger,
                )
            }
        }

    fun library(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            LibraryViewModel(
                contentRepository = container.contentRepository,
                draftRepository = container.draftRepository,
                authRepository = container.authRepository,
                messenger = container.messenger,
            )
        }
    }

    fun dashboard(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            DashboardViewModel(
                contentRepository = container.contentRepository,
                aiRepository = container.aiRepository,
                adsRepository = container.adsRepository,
                draftRepository = container.draftRepository,
                authRepository = container.authRepository,
            )
        }
    }

    fun leaderboard(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            LeaderboardViewModel(
                contentRepository = container.contentRepository,
                authRepository = container.authRepository,
            )
        }
    }

    fun aiServices(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            AiServicesViewModel(
                aiRepository = container.aiRepository,
                authRepository = container.authRepository,
                messenger = container.messenger,
            )
        }
    }

    fun profile(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            ProfileViewModel(
                authRepository = container.authRepository,
                contentRepository = container.contentRepository,
                draftRepository = container.draftRepository,
                messenger = container.messenger,
            )
        }
    }

    fun settings(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            SettingsViewModel(
                settingsRepository = container.settingsRepository,
                authRepository = container.authRepository,
                draftRepository = container.draftRepository,
                messenger = container.messenger,
            )
        }
    }

    fun contact(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            ContactViewModel(
                contentRepository = container.contentRepository,
                authRepository = container.authRepository,
                messenger = container.messenger,
            )
        }
    }

    fun adminAds(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
        initializer {
            AdminAdsViewModel(
                adsRepository = container.adsRepository,
                authRepository = container.authRepository,
                messenger = container.messenger,
            )
        }
    }
}
