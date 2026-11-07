package com.promptgineer.app.ui.community

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.PromptComposer
import com.promptgineer.app.domain.PromptDetail
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.Avatar
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.ErrorState
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.PrivateIndicator
import com.promptgineer.app.ui.components.PromptActionBar
import com.promptgineer.app.ui.components.PromptCodeBlock
import com.promptgineer.app.ui.components.SectionDivider
import com.promptgineer.app.util.DateTimeFormat
import com.promptgineer.app.util.IntentUtils

@Composable
fun DetailScreen(
    viewModel: DetailViewModel,
    onBack: () -> Unit,
    onRequireSignIn: () -> Unit,
    onRemix: (PromptDetail) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showDeleteConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                DetailEvent.RequireSignIn -> onRequireSignIn()
                DetailEvent.Deleted -> onBack()
            }
        }
    }

    val item = state.item
    val fullPrompt = remember(item) { item?.let { PromptComposer.compose(it.sections) }.orEmpty() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding(),
    ) {
        BackHeader(
            title = if (item != null && item.kind.apiPath == "templates") "Template" else "Prompt",
            onBack = onBack,
            actions = {
                if (item != null) {
                    IconButton(onClick = viewModel::toggleBookmark) {
                        Icon(
                            imageVector = if (state.bookmarked) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                            contentDescription = if (state.bookmarked) "Remove bookmark" else "Bookmark",
                            tint = if (state.bookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    IconButton(onClick = {
                        IntentUtils.shareText(context, fullPrompt, item.title)
                    }) {
                        Icon(Icons.Rounded.Share, contentDescription = "Share")
                    }
                }
            },
        )

        when {
            state.loading && item == null -> LoadingBlock("Opening…")
            item == null -> ErrorState(
                error = state.error ?: com.promptgineer.app.core.AppError.Unknown("That item could not be loaded."),
                onRetry = viewModel::load,
                modifier = Modifier.fillMaxWidth(),
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 2.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (state.fromCache) {
                    item(key = "cache") {
                        InlineBanner(
                            text = "Offline copy${state.cachedAt?.let { " · saved ${DateTimeFormat.fromMillis(it)}" }.orEmpty()}.",
                            tone = BannerTone.WARNING,
                        )
                    }
                }

                item(key = "title") {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (!item.isPublic) PrivateIndicator()
                            Spacer(Modifier.width(6.dp))
                            BadgeChip(
                                text = "${item.views} views",
                                icon = Icons.Rounded.Visibility,
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground,
                        )
                        if (!item.description.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = item.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Avatar(name = item.authorName, url = item.authorAvatar, size = 30.dp)
                            Spacer(Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.authorName?.takeIf { it.isNotBlank() } ?: "Prompt-Gineer Team",
                                    style = MaterialTheme.typography.labelLarge,
                                )
                                Text(
                                    text = "Posted ${DateTimeFormat.relative(item.createdAt)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            FilledTonalButton(
                                onClick = viewModel::toggleLike,
                                shape = MaterialTheme.shapes.medium,
                            ) {
                                Icon(
                                    imageVector = if (item.likedByMe) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
                                    contentDescription = if (item.likedByMe) "Unlike" else "Like",
                                    modifier = Modifier.size(17.dp),
                                    tint = if (item.likedByMe) {
                                        MaterialTheme.colorScheme.error
                                    } else {
                                        MaterialTheme.colorScheme.onSecondaryContainer
                                    },
                                )
                                Spacer(Modifier.width(6.dp))
                                Text("${item.likes}")
                            }
                        }
                    }
                }

                item(key = "prompt") {
                    Column {
                        PromptCodeBlock(
                            text = fullPrompt,
                            maxHeight = 360.dp,
                            fileName = "PROMPT.TXT",
                        )
                        Spacer(Modifier.height(8.dp))
                        PromptActionBar(
                            copyEnabled = true,
                            onCopy = {
                                if (IntentUtils.copyToClipboard(context, fullPrompt, item.title)) {
                                    Toast.makeText(context, "Prompt copied", Toast.LENGTH_SHORT).show()
                                }
                            },
                            onShare = { IntentUtils.shareText(context, fullPrompt, item.title) },
                            onSendToAi = { IntentUtils.sendToAssistant(context, fullPrompt) },
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "${item.sections.size} sections · ${PromptComposer.wordCount(fullPrompt)} words",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                item(key = "remix") {
                    Button(
                        onClick = { onRemix(item) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                    ) {
                        Icon(Icons.Rounded.OpenInNew, contentDescription = null, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(7.dp))
                        Text("Remix this in the studio")
                    }
                }

                if (state.isOwner) {
                    item(key = "owner") {
                        AppCard {
                            Text(
                                text = "You own this ${item.kind.singular}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Visible in the community", style = MaterialTheme.typography.labelLarge)
                                    Text(
                                        text = if (item.isPublic) {
                                            "Anyone can view, like and comment."
                                        } else {
                                            "Only you can open it."
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                Switch(
                                    checked = item.isPublic,
                                    onCheckedChange = viewModel::setVisibility,
                                    enabled = !state.updatingVisibility,
                                )
                            }
                            SectionDivider(modifier = Modifier.padding(vertical = 8.dp))
                            TextButton(
                                onClick = { showDeleteConfirm = true },
                                enabled = !state.deleting,
                            ) {
                                Icon(
                                    Icons.Rounded.Delete,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.error,
                                )
                                Spacer(Modifier.width(6.dp))
                                Text("Delete ${item.kind.singular}", color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }

                item(key = "comments_header") {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Comments",
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = "${state.comments.size}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        IconButton(onClick = viewModel::loadComments) {
                            Icon(
                                Icons.Rounded.Refresh,
                                contentDescription = "Refresh comments",
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }
                }

                val commentsError = state.commentsError
                if (commentsError != null) {
                    item(key = "comments_error") {
                        InlineBanner(text = commentsError.userMessage, tone = BannerTone.ERROR)
                    }
                }

                if (state.commentsLoading && state.comments.isEmpty()) {
                    item(key = "comments_loading") { LoadingBlock("Loading comments…") }
                } else if (state.comments.isEmpty()) {
                    item(key = "comments_empty") {
                        EmptyState(
                            icon = Icons.Rounded.Send,
                            title = "No comments yet",
                            message = "Ask a question or tell the author what worked.",
                        )
                    }
                } else {
                    items(state.comments, key = { it.id }) { comment ->
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Avatar(name = comment.authorName, url = comment.authorAvatar, size = 28.dp)
                            Spacer(Modifier.width(9.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = comment.authorName?.takeIf { it.isNotBlank() } ?: "Member",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = DateTimeFormat.relative(comment.createdAt),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    text = comment.content,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    }
                }

                item(key = "comment_composer") {
                    if (state.signedIn) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            OutlinedTextField(
                                value = state.commentInput,
                                onValueChange = viewModel::setCommentInput,
                                modifier = Modifier.weight(1f),
                                placeholder = { Text("Add a comment…") },
                                minLines = 1,
                                maxLines = 4,
                                shape = RoundedCornerShape(14.dp),
                            )
                            Spacer(Modifier.width(8.dp))
                            FilledIconButton(
                                onClick = viewModel::postComment,
                                enabled = state.commentInput.isNotBlank() && !state.postingComment,
                                modifier = Modifier.size(48.dp),
                            ) {
                                if (state.postingComment) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(17.dp),
                                        strokeWidth = 2.dp,
                                        color = MaterialTheme.colorScheme.onPrimary,
                                    )
                                } else {
                                    Icon(Icons.Rounded.Send, contentDescription = "Post comment")
                                }
                            }
                        }
                    } else {
                        InlineBanner(
                            text = "Sign in to like this prompt or join the conversation.",
                            tone = BannerTone.INFO,
                            actionLabel = "Sign in",
                            onAction = onRequireSignIn,
                        )
                    }
                }

                item(key = "bottom_pad") {
                    Spacer(Modifier.height(8.dp).navigationBarsPadding())
                }
            }
        }
    }

    if (showDeleteConfirm && item != null) {
        ConfirmDialog(
            title = "Delete this ${item.kind.singular}?",
            message = "This removes it for everyone, including its comments and likes. This can't be undone.",
            confirmLabel = "Delete",
            destructive = true,
            onConfirm = {
                showDeleteConfirm = false
                viewModel.deleteItem()
            },
            onDismiss = { showDeleteConfirm = false },
        )
    }
}
