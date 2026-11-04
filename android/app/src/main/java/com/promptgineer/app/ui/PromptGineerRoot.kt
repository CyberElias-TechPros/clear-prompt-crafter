package com.promptgineer.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmarks
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.PenTool
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.promptgineer.app.core.AppIntent
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.di.AppContainer
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LocalDraft
import com.promptgineer.app.domain.PromptComposer
import com.promptgineer.app.ui.admin.AdminAdsScreen
import com.promptgineer.app.ui.ai.AiServicesScreen
import com.promptgineer.app.ui.auth.AuthScreen
import com.promptgineer.app.ui.community.CommunityScreen
import com.promptgineer.app.ui.community.DetailScreen
import com.promptgineer.app.ui.dashboard.DashboardScreen
import com.promptgineer.app.ui.info.ContactScreen
import com.promptgineer.app.ui.info.LegalScreen
import com.promptgineer.app.ui.leaderboard.LeaderboardScreen
import com.promptgineer.app.ui.library.LibraryScreen
import com.promptgineer.app.ui.onboarding.OnboardingScreen
import com.promptgineer.app.ui.profile.ProfileScreen
import com.promptgineer.app.ui.settings.SettingsScreen
import com.promptgineer.app.ui.studio.StudioMode
import com.promptgineer.app.ui.studio.StudioScreen
import com.promptgineer.app.ui.theme.PromptGineerTheme

object Routes {
    const val AUTH = "auth"
    const val ONBOARDING = "onboarding"
    const val DASHBOARD = "dashboard"
    const val STUDIO = "studio"
    const val COMMUNITY = "community"
    const val LIBRARY = "library"
    const val PROFILE = "profile"
    const val SETTINGS = "settings"
    const val AI_SERVICES = "ai-services"
    const val LEADERBOARD = "leaderboard"
    const val ADMIN_ADS = "admin/ads"
    const val CONTACT = "contact"

    const val DETAIL_PATTERN = "detail/{kind}/{id}"
    const val LEGAL_PATTERN = "info/{doc}"

    fun detail(kind: ItemKind, id: String): String = "detail/${kind.apiPath}/$id"
    fun legal(document: String): String = "info/$document"

    val topLevel = listOf(DASHBOARD, STUDIO, COMMUNITY, LIBRARY, PROFILE)
}

/**
 * Cross-screen handoffs (shared text, a community remix, a draft, a shortcut's
 * preferred studio mode) are plain state owned here. They survive sign-in
 * because the navigation host is recreated beneath them.
 */
private class NavHandoff {
    var sharedText by mutableStateOf<String?>(null)
    var importText by mutableStateOf<String?>(null)
    var importDraft by mutableStateOf<LocalDraft?>(null)
    var studioMode by mutableStateOf<StudioMode?>(null)
    var route by mutableStateOf<String?>(null)
}

@Composable
fun PromptGineerRoot(onFirstFrame: () -> Unit) {
    val context = LocalContext.current
    val container = remember(context) {
        (context.applicationContext as com.promptgineer.app.PromptGineerApp).container
    }
    val appViewModel: AppViewModel = viewModel(factory = AppViewModels.app(container))
    val state by appViewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val handoff = remember { NavHandoff() }

    LaunchedEffect(Unit) { onFirstFrame() }

    LaunchedEffect(container.messenger) {
        container.messenger.messages.collect { message ->
            snackbarHostState.showSnackbar(
                message = message.text,
                withDismissAction = message.isError,
            )
        }
    }

    LaunchedEffect(container.intentRouter) {
        container.intentRouter.commands.collect { command ->
            when (command) {
                is AppIntent.SharedText -> {
                    handoff.sharedText = command.text
                    handoff.route = Routes.STUDIO
                }
                is AppIntent.Shortcut -> when (command.id) {
                    "refine" -> {
                        handoff.studioMode = StudioMode.REFINE
                        handoff.route = Routes.STUDIO
                    }
                    "community" -> handoff.route = Routes.COMMUNITY
                    else -> {
                        handoff.studioMode = StudioMode.STRUCTURED
                        handoff.route = Routes.STUDIO
                    }
                }
            }
        }
    }

    PromptGineerTheme(
        themeMode = state.settings.theme,
        dynamicColor = state.settings.dynamicColor,
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
            when (val session = state.session) {
                SessionState.Loading -> BrandedLoading()
                else -> {
                    androidx.compose.runtime.key(state.signedIn) {
                        AppNav(
                            container = container,
                            session = session,
                            online = state.online,
                            snackbarHostState = snackbarHostState,
                            handoff = handoff,
                            onboardingCompleted = state.settings.onboardingCompleted,
                            onCompleteOnboarding = appViewModel::completeOnboarding,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AppNav(
    container: AppContainer,
    session: SessionState,
    online: Boolean,
    snackbarHostState: SnackbarHostState,
    handoff: NavHandoff,
    onboardingCompleted: Boolean,
    onCompleteOnboarding: () -> Unit,
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val signedIn = session is SessionState.SignedIn

    val startDestination = when {
        !onboardingCompleted -> Routes.ONBOARDING
        signedIn -> Routes.DASHBOARD
        else -> Routes.AUTH
    }

    // Deep-link style requests from intents and ads are applied once the graph exists.
    LaunchedEffect(handoff.route) {
        val target = handoff.route
        if (target != null) {
            navController.navigate(target) { launchSingleTop = true }
            handoff.route = null
        }
    }

    val requireSignIn: () -> Unit = {
        navController.navigate(Routes.AUTH) { launchSingleTop = true }
    }

    val openLegal: (String) -> Unit = { document ->
        if (document == "contact") {
            navController.navigate(Routes.CONTACT)
        } else {
            navController.navigate(Routes.legal(document))
        }
    }

    val navigatePath: (String) -> Unit = { path ->
        val route = routeForPath(path)
        if (route != null) {
            navController.navigate(route) { launchSingleTop = true }
        } else {
            container.messenger.error("That link isn't available inside the app.")
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (currentRoute != null && currentRoute in Routes.topLevel) {
                AppBottomBar(
                    currentRoute = currentRoute,
                    onSelect = { route ->
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            composable(Routes.AUTH) {
                AuthScreen(
                    viewModel = viewModel(factory = AppViewModels.auth(container)),
                    onContinueWithoutAccount = {
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                    onBrowseCommunity = {
                        navController.navigate(Routes.COMMUNITY) { launchSingleTop = true }
                    },
                    onOpenLegal = openLegal,
                )
            }

            composable(Routes.ONBOARDING) {
                OnboardingScreen(
                    onFinish = {
                        onCompleteOnboarding()
                        val target = if (signedIn) Routes.DASHBOARD else Routes.AUTH
                        navController.navigate(target) {
                            popUpTo(Routes.ONBOARDING) { inclusive = true }
                        }
                    },
                    onOpenLegal = openLegal,
                )
            }

            composable(Routes.DASHBOARD) {
                DashboardScreen(
                    viewModel = viewModel(factory = AppViewModels.dashboard(container)),
                    onOpenStudio = {
                        handoff.studioMode = StudioMode.STRUCTURED
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                    onOpenRefine = {
                        handoff.studioMode = StudioMode.REFINE
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                    onOpenCommunity = {
                        navController.navigate(Routes.COMMUNITY) { launchSingleTop = true }
                    },
                    onOpenLibrary = {
                        navController.navigate(Routes.LIBRARY) { launchSingleTop = true }
                    },
                    onOpenAiServices = {
                        navController.navigate(Routes.AI_SERVICES) { launchSingleTop = true }
                    },
                    onOpenProfile = {
                        navController.navigate(Routes.PROFILE) { launchSingleTop = true }
                    },
                    onOpenItem = { kind, id -> navController.navigate(Routes.detail(kind, id)) },
                    onRequireSignIn = requireSignIn,
                    onNavigatePath = navigatePath,
                )
            }

            composable(Routes.STUDIO) {
                StudioScreen(
                    viewModel = viewModel(factory = AppViewModels.studio(container)),
                    isOnline = online,
                    sharedText = handoff.sharedText,
                    onSharedTextConsumed = { handoff.sharedText = null },
                    importText = handoff.importText,
                    onImportConsumed = { handoff.importText = null },
                    importDraft = handoff.importDraft,
                    onImportDraftConsumed = { handoff.importDraft = null },
                    openMode = handoff.studioMode,
                    onOpenModeConsumed = { handoff.studioMode = null },
                    onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                    onOpenLibrary = { navController.navigate(Routes.LIBRARY) },
                    onOpenCommunity = { navController.navigate(Routes.COMMUNITY) },
                    onOpenAiServices = { navController.navigate(Routes.AI_SERVICES) },
                    onRequireSignIn = requireSignIn,
                    onSavedToLibrary = { id, kind ->
                        container.messenger.success("Saved to your library.")
                        if (signedIn) navController.navigate(Routes.detail(kind, id))
                    },
                )
            }

            composable(Routes.COMMUNITY) {
                CommunityScreen(
                    viewModel = viewModel(factory = AppViewModels.community(container)),
                    onOpenItem = { kind, id -> navController.navigate(Routes.detail(kind, id)) },
                )
            }

            composable(
                route = Routes.DETAIL_PATTERN,
                arguments = listOf(
                    navArgument("kind") { type = NavType.StringType },
                    navArgument("id") { type = NavType.StringType },
                ),
            ) { entry ->
                val kind = ItemKind.fromRoute(entry.arguments?.getString("kind").orEmpty())
                val id = entry.arguments?.getString("id").orEmpty()
                DetailScreen(
                    viewModel = viewModel(
                        key = "detail_${kind.apiPath}_$id",
                        factory = AppViewModels.detail(container, kind, id),
                    ),
                    onBack = { navController.popBackStack() },
                    onRequireSignIn = requireSignIn,
                    onRemix = { item ->
                        handoff.importText = PromptComposer.compose(item.sections)
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                )
            }

            composable(Routes.LIBRARY) {
                LibraryScreen(
                    viewModel = viewModel(factory = AppViewModels.library(container)),
                    onOpenDraft = { draft ->
                        handoff.importDraft = draft
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                    onOpenItem = { kind, id -> navController.navigate(Routes.detail(kind, id)) },
                    onRequireSignIn = requireSignIn,
                    onNewPrompt = {
                        handoff.studioMode = StudioMode.STRUCTURED
                        navController.navigate(Routes.STUDIO) { launchSingleTop = true }
                    },
                )
            }

            composable(Routes.PROFILE) {
                ProfileScreen(
                    viewModel = viewModel(factory = AppViewModels.profile(container)),
                    onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                    onOpenLibrary = { navController.navigate(Routes.LIBRARY) },
                    onOpenAiServices = { navController.navigate(Routes.AI_SERVICES) },
                    onOpenLeaderboard = { navController.navigate(Routes.LEADERBOARD) },
                    onOpenAdminAds = { navController.navigate(Routes.ADMIN_ADS) },
                    onOpenContact = { navController.navigate(Routes.CONTACT) },
                    onOpenLegal = openLegal,
                    onRequireSignIn = requireSignIn,
                )
            }

            composable(Routes.SETTINGS) {
                SettingsScreen(
                    viewModel = viewModel(factory = AppViewModels.settings(container)),
                    onBack = { navController.popBackStack() },
                    onOpenAiServices = { navController.navigate(Routes.AI_SERVICES) },
                    onOpenLegal = openLegal,
                    onOpenContact = { navController.navigate(Routes.CONTACT) },
                )
            }

            composable(Routes.AI_SERVICES) {
                AiServicesScreen(
                    viewModel = viewModel(factory = AppViewModels.aiServices(container)),
                    onBack = { navController.popBackStack() },
                    onRequireSignIn = requireSignIn,
                )
            }

            composable(Routes.LEADERBOARD) {
                LeaderboardScreen(
                    viewModel = viewModel(factory = AppViewModels.leaderboard(container)),
                    onBack = { navController.popBackStack() },
                )
            }

            composable(Routes.ADMIN_ADS) {
                AdminAdsScreen(
                    viewModel = viewModel(factory = AppViewModels.adminAds(container)),
                    onBack = { navController.popBackStack() },
                )
            }

            composable(Routes.CONTACT) {
                ContactScreen(
                    viewModel = viewModel(factory = AppViewModels.contact(container)),
                    onBack = { navController.popBackStack() },
                )
            }

            composable(
                route = Routes.LEGAL_PATTERN,
                arguments = listOf(navArgument("doc") { type = NavType.StringType }),
            ) { entry ->
                LegalScreen(
                    document = entry.arguments?.getString("doc") ?: "terms",
                    onBack = { navController.popBackStack() },
                    onContact = { navController.navigate(Routes.CONTACT) },
                )
            }
        }
    }
}

@Composable
private fun AppBottomBar(currentRoute: String?, onSelect: (String) -> Unit) {
    data class Item(val route: String, val label: String, val icon: ImageVector)

    val items = listOf(
        Item(Routes.DASHBOARD, "Home", Icons.Rounded.Home),
        Item(Routes.STUDIO, "Build", Icons.Rounded.EditNote),
        Item(Routes.COMMUNITY, "Community", Icons.Rounded.Groups),
        Item(Routes.LIBRARY, "Library", Icons.Rounded.Bookmarks),
        Item(Routes.PROFILE, "Profile", Icons.Rounded.Person),
    )

    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        items.forEach { item ->
            NavigationBarItem(
                selected = currentRoute == item.route,
                onClick = { onSelect(item.route) },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
            )
        }
    }
}

private fun routeForPath(rawPath: String): String? {
    val path = rawPath.trim().removePrefix("/").trimEnd('/')
    return when (path) {
        "", "dashboard", "home" -> Routes.DASHBOARD
        "auth", "login", "signup" -> Routes.AUTH
        "studio", "prompts/new", "templates/new" -> Routes.STUDIO
        "community" -> Routes.COMMUNITY
        "library" -> Routes.LIBRARY
        "profile" -> Routes.PROFILE
        "settings" -> Routes.SETTINGS
        "ai-services" -> Routes.AI_SERVICES
        "leaderboard" -> Routes.LEADERBOARD
        "contact" -> Routes.CONTACT
        "terms" -> Routes.legal("terms")
        "privacy" -> Routes.legal("privacy")
        else -> null
    }
}

@Composable
private fun BrandedLoading() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.onBackground),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Rounded.PenTool,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.background,
                    modifier = Modifier.size(24.dp),
                )
            }
            Spacer(Modifier.height(14.dp))
            Text(
                text = "Prompt-Gineer",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(14.dp))
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
        }
    }
}
