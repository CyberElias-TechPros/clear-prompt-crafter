package com.promptgineer.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bookmarks
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Key
import androidx.compose.material.icons.rounded.Lightbulb
import androidx.compose.material.icons.rounded.TipsAndUpdates
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.promptgineer.app.domain.Ad
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.domain.PromptRecipes
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.Avatar
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.StatTile
import com.promptgineer.app.util.DateTimeFormat
import com.promptgineer.app.util.IntentUtils
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onOpenStudio: () -> Unit,
    onOpenRefine: () -> Unit,
    onOpenCommunity: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenAiServices: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenItem: (ItemKind, String) -> Unit,
    onRequireSignIn: () -> Unit,
    onNavigatePath: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val recentItems = (state.prompts.map { ItemKind.PROMPT to it } + state.templates.map { ItemKind.TEMPLATE to it })
        .sortedByDescending { it.second.updatedAt ?: it.second.createdAt ?: "" }
        .take(3)

    PullToRefreshBox(
        isRefreshing = state.refreshing,
        onRefresh = viewModel::refresh,
        modifier = Modifier.fillMaxSize(),
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "greeting") {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = greeting(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = state.user?.displayName ?: "Prompt-Gineer",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground,
                        )
                        Text(
                            text = if (state.signedIn) {
                                "What are we sharpening today?"
                            } else {
                                "Local mode · nothing leaves this device"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    if (state.signedIn) {
                        Avatar(name = state.user?.displayName, url = state.user?.avatarUrl, size = 44.dp)
                    }
                }
            }

            if (!state.signedIn) {
                item(key = "guest") {
                    AppCard(
                        contentPadding = PaddingValues(16.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Rounded.Lightbulb,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                            )
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Everything works without an account",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    text = "Build, score and copy prompts now. Sign in later to sync and join the community.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = onOpenStudio, shape = MaterialTheme.shapes.medium) {
                                Text("Start building")
                            }
                            TextButton(onClick = onRequireSignIn) { Text("Sign in") }
                        }
                    }
                }
            }

            val topAd = state.topAd
            if (topAd != null) {
                item(key = "ad_top") {
                    AdCard(
                        ad = topAd,
                        onClick = {
                            if (topAd.hasLink) {
                                IntentUtils.openUrl(context, topAd.linkUrl)
                            } else {
                                onNavigatePath(topAd.linkUrl)
                            }
                        },
                    )
                }
            }

            if (state.signedIn) {
                item(key = "quota") {
                    QuotaCard(
                        platform = state.platform,
                        hasByok = state.hasByok,
                        onOpenAiServices = onOpenAiServices,
                    )
                }
            }

            item(key = "actions_header") {
                SectionLabel("Jump back in")
            }

            item(key = "actions") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuickAction(
                            icon = Icons.Rounded.EditNote,
                            title = "New prompt",
                            caption = "Section by section",
                            onClick = onOpenStudio,
                            modifier = Modifier.weight(1f),
                        )
                        QuickAction(
                            icon = Icons.Rounded.AutoAwesome,
                            title = "Refine",
                            caption = "Score against CLEAR",
                            onClick = onOpenRefine,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuickAction(
                            icon = Icons.Rounded.Groups,
                            title = "Community",
                            caption = "Steal good ideas",
                            onClick = onOpenCommunity,
                            modifier = Modifier.weight(1f),
                        )
                        QuickAction(
                            icon = Icons.Rounded.Bookmarks,
                            title = "Library",
                            caption = "${state.draftsCount} drafts · ${state.bookmarksCount} saved",
                            onClick = onOpenLibrary,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            item(key = "stats") {
                AppCard {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(
                            value = "${state.prompts.size}",
                            label = "prompts",
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            value = "${state.templates.size}",
                            label = "templates",
                            modifier = Modifier.weight(1f),
                        )
                        StatTile(
                            value = state.points?.toString() ?: "—",
                            label = "points",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Rounded.Favorite,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp),
                        )
                        Spacer(Modifier.width(5.dp))
                        Text(
                            text = "${state.totalLikes} likes received",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                        )
                        if (state.rank != null) {
                            Text(
                                text = "Rank #${state.rank}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
            }

            if (state.error != null) {
                item(key = "error") {
                    InlineBanner(
                        text = state.error?.userMessage ?: "",
                        tone = BannerTone.ERROR,
                        actionLabel = "Retry",
                        onAction = viewModel::refresh,
                    )
                }
            }

            if (state.loading) {
                item(key = "loading") { LoadingBlock("Gathering your workspace…") }
            } else if (state.prompts.isNotEmpty() || state.templates.isNotEmpty()) {
                item(key = "recent_header") {
                    SectionLabel("Recently saved", action = "Library" to onOpenLibrary)
                }
                items(recentItems, key = { "${it.first.apiPath}_${it.second.id}" }) { (kind, item) ->
                    RecentRow(item = item, onClick = { onOpenItem(kind, item.id) })
                }
            }

            if (!state.signedIn) {
                item(key = "community_nudge") {
                    AppCard(onClick = onOpenCommunity) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Rounded.Groups,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                            )
                            Spacer(Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "See what's working for others",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    text = "Browse public prompts and templates — no account needed to read.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Icon(Icons.Rounded.ChevronRight, contentDescription = null)
                        }
                    }
                }
            }

            item(key = "starters") {
                AppCard(onClick = onOpenStudio) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                Icons.Rounded.TipsAndUpdates,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                        Spacer(Modifier.width(11.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${PromptRecipes.all.size} job-based starters",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = PromptRecipes.all.take(2).joinToString(" · ") { it.title } + " …",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Icon(Icons.Rounded.ChevronRight, contentDescription = null)
                    }
                }
            }

            item(key = "profile_row") {
                if (state.signedIn) {
                    AppCard(onClick = onOpenProfile) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Avatar(name = state.user?.displayName, url = state.user?.avatarUrl, size = 38.dp)
                            Spacer(Modifier.width(11.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Your profile",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    text = state.user?.email.orEmpty(),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Icon(Icons.Rounded.ChevronRight, contentDescription = null)
                        }
                    }
                }
            }

            item(key = "footer") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = "Made for the person staring at a blank prompt box.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

private fun greeting(): String = when (LocalTime.now().hour) {
    in 5..11 -> "Good morning"
    in 12..17 -> "Good afternoon"
    else -> "Good evening"
}

@Composable
private fun SectionLabel(text: String, action: Pair<String, () -> Unit>? = null) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = text,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f),
        )
        if (action != null) {
            TextButton(onClick = action.second) { Text(action.first) }
        }
    }
}

@Composable
private fun QuickAction(
    icon: ImageVector,
    title: String,
    caption: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AppCard(
        modifier = modifier,
        onClick = onClick,
        contentPadding = PaddingValues(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp),
            )
        }
        Spacer(Modifier.height(9.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            text = caption,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun QuotaCard(
    platform: com.promptgineer.app.domain.PlatformAi?,
    hasByok: Boolean,
    onOpenAiServices: () -> Unit,
) {
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Rounded.Tune,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "AI access",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
            )
            if (hasByok) {
                Text(
                    text = "BYOK active",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
        Spacer(Modifier.height(8.dp))

        when {
            platform == null && !hasByok -> {
                Text(
                    text = "No AI provider is connected yet. The builders still work offline — connect a key only when you want a model in the loop.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            platform != null && platform.remainingToday == null -> {
                Text(
                    text = "Unlimited free generations on the platform tier.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            platform != null -> {
                val remaining = platform.remainingToday ?: 0
                val limit = platform.dailyLimit ?: 0
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "$remaining of $limit free generations left today",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = "${platform.usedToday} used",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { platform.usedFraction },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                )
            }

            else -> {
                Text(
                    text = "Your own provider key is active.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        if (!hasByok) {
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = onOpenAiServices, contentPadding = PaddingValues(0.dp)) {
                Icon(Icons.Rounded.Key, contentDescription = null, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(5.dp))
                Text("Manage AI services")
            }
        }
    }
}

@Composable
private fun AdCard(ad: Ad, onClick: () -> Unit) {
    AppCard(onClick = onClick) {
        if (!ad.imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = ad.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(RoundedCornerShape(12.dp)),
                contentScale = ContentScale.Crop,
            )
            Spacer(Modifier.height(10.dp))
        }
        Text(
            text = "SPONSORED",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(3.dp))
        Text(
            text = ad.title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            text = ad.content,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun RecentRow(item: MyItem, onClick: () -> Unit) {
    AppCard(onClick = onClick, contentPadding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "${item.views} views · ${item.likes} likes · ${DateTimeFormat.relative(item.updatedAt ?: item.createdAt)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                Icons.Rounded.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
