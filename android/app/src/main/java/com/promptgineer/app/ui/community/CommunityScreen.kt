package com.promptgineer.app.ui.community

import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SearchOff
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.PromptSummary
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.Avatar
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.ErrorState
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.components.ScreenHeader
import com.promptgineer.app.ui.components.TruncatedText
import com.promptgineer.app.util.DateTimeFormat

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityScreen(
    viewModel: CommunityViewModel,
    onOpenItem: (ItemKind, String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    PullToRefreshBox(
        isRefreshing = state.refreshing,
        onRefresh = viewModel::refresh,
        modifier = Modifier.fillMaxSize(),
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 22.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "header") {
                ScreenHeader(
                    kicker = "Community",
                    title = "Prompts worth stealing",
                    subtitle = "Public prompts and templates from other members. Bookmark what you want to remix.",
                )
            }

            item(key = "search") {
                OutlinedTextField(
                    value = state.query,
                    onValueChange = viewModel::onQueryChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search titles and descriptions") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    trailingIcon = if (state.query.isNotEmpty()) {
                        {
                            IconButton(onClick = viewModel::clearQuery) {
                                Icon(Icons.Rounded.Close, contentDescription = "Clear search")
                            }
                        }
                    } else {
                        null
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                )
            }

            item(key = "filters") {
                Column {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PillButton(
                            text = "Prompts",
                            selected = state.kind == ItemKind.PROMPT,
                            onClick = { viewModel.setKind(ItemKind.PROMPT) },
                        )
                        PillButton(
                            text = "Templates",
                            selected = state.kind == ItemKind.TEMPLATE,
                            onClick = { viewModel.setKind(ItemKind.TEMPLATE) },
                        )
                        Spacer(Modifier.weight(1f))
                        PillButton(
                            text = "Recent",
                            selected = state.sort == "recent",
                            onClick = { viewModel.setSort("recent") },
                        )
                        PillButton(
                            text = "Popular",
                            selected = state.sort == "popular",
                            onClick = { viewModel.setSort("popular") },
                        )
                    }
                }
            }

            if (state.fromCache && state.items.isNotEmpty()) {
                item(key = "cache_banner") {
                    InlineBanner(
                        text = "Offline copy${state.cachedAt?.let { " · saved ${DateTimeFormat.fromMillis(it)}" }.orEmpty()}. Reconnect to see the latest.",
                        tone = BannerTone.WARNING,
                    )
                }
            }

            if (state.loading && state.items.isEmpty()) {
                item(key = "loading") { LoadingBlock("Loading the community…") }
            }

            val error = state.error
            if (error != null && state.items.isEmpty()) {
                item(key = "error") {
                    ErrorState(error = error, onRetry = viewModel::refresh)
                }
            }

            if (!state.loading && state.items.isEmpty() && error == null) {
                item(key = "empty") {
                    EmptyState(
                        icon = Icons.Rounded.SearchOff,
                        title = if (state.committedQuery.isBlank()) "Nothing here yet" else "No matches",
                        message = if (state.committedQuery.isBlank()) {
                            "Be the first to share a prompt. Everything you save publicly appears here."
                        } else {
                            "No ${if (state.kind == ItemKind.PROMPT) "prompts" else "templates"} match “${state.committedQuery}”."
                        },
                        actionLabel = if (state.committedQuery.isBlank()) null else "Clear search",
                        onAction = if (state.committedQuery.isBlank()) null else viewModel::clearQuery,
                    )
                }
            }

            items(state.items, key = { "${state.kind.apiPath}_${it.id}" }) { item ->
                CommunityCard(
                    item = item,
                    bookmarked = state.isBookmarked(item),
                    onOpen = { onOpenItem(state.kind, item.id) },
                    onBookmark = { viewModel.toggleBookmark(item) },
                )
            }

            if (!state.endReached && state.items.isNotEmpty()) {
                item(key = "load_more_${state.items.size}") {
                    LaunchedEffect(state.items.size) { viewModel.loadMore() }
                    LoadingBlock("Loading more…")
                }
            } else if (state.items.isNotEmpty()) {
                item(key = "end") {
                    Text(
                        text = "That's everything for now. Pull down to refresh.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 18.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun CommunityCard(
    item: PromptSummary,
    bookmarked: Boolean,
    onOpen: () -> Unit,
    onBookmark: () -> Unit,
) {
    AppCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                if (!item.description.isNullOrBlank()) {
                    Spacer(Modifier.height(3.dp))
                    TruncatedText(text = item.description.orEmpty(), maxLines = 2)
                }
            }
            IconButton(onClick = onBookmark, modifier = Modifier.size(36.dp)) {
                Icon(
                    imageVector = if (bookmarked) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                    contentDescription = if (bookmarked) "Remove bookmark" else "Bookmark",
                    tint = if (bookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(19.dp),
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(name = item.authorName, url = item.authorAvatar, size = 26.dp)
            Spacer(Modifier.width(8.dp))
            Text(
                text = item.authorName?.takeIf { it.isNotBlank() } ?: "Prompt-Gineer Team",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(1f),
            )
            Icon(
                imageVector = Icons.Rounded.FavoriteBorder,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(14.dp),
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = "${item.likeCount}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = DateTimeFormat.relative(item.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
