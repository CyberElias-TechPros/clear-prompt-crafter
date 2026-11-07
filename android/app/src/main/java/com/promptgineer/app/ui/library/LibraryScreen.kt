package com.promptgineer.app.ui.library

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Bookmarks
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.Bookmark
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LocalDraft
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.ErrorState
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.components.ScreenHeader
import com.promptgineer.app.ui.components.TruncatedText
import com.promptgineer.app.util.DateTimeFormat

@Composable
fun LibraryScreen(
    viewModel: LibraryViewModel,
    onOpenDraft: (LocalDraft) -> Unit,
    onOpenItem: (ItemKind, String) -> Unit,
    onRequireSignIn: () -> Unit,
    onNewPrompt: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var menuFor by remember { mutableStateOf<String?>(null) }
    var draftToDelete by remember { mutableStateOf<LocalDraft?>(null) }
    var itemToDelete by remember { mutableStateOf<Pair<ItemKind, MyItem>?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 22.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item(key = "header") {
            ScreenHeader(
                kicker = "Library",
                title = "Everything you've made",
                subtitle = "Drafts live on this device. Prompts and templates sync to your account.",
                actions = {
                    IconButton(onClick = onNewPrompt) {
                        Icon(Icons.Rounded.Add, contentDescription = "New prompt")
                    }
                },
            )
        }

        item(key = "tabs") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(LibraryTab.entries) { tab ->
                    PillButton(
                        text = tab.label,
                        selected = state.tab == tab,
                        onClick = { viewModel.setTab(tab) },
                    )
                }
            }
        }

        item(key = "search") {
            OutlinedTextField(
                value = state.query,
                onValueChange = viewModel::setQuery,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Filter your library") },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
            )
        }

        val needsAccount = (state.tab == LibraryTab.PROMPTS || state.tab == LibraryTab.TEMPLATES) && !state.signedIn
        if (needsAccount) {
            item(key = "signin") {
                AppCard {
                    Text(
                        text = "Your cloud library needs an account",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Sign in to sync prompts and templates across devices. Local drafts and bookmarks keep working without one.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onRequireSignIn, shape = MaterialTheme.shapes.medium) {
                        Text("Sign in")
                    }
                }
            }
        } else if (state.loading) {
            item(key = "loading") { LoadingBlock("Opening your library…") }
        } else {
            state.error?.let { error ->
                item(key = "error") {
                    ErrorState(error = error, onRetry = viewModel::refresh)
                }
            }

            when (state.tab) {
                LibraryTab.DRAFTS -> {
                    if (state.visibleDrafts.isEmpty()) {
                        item(key = "drafts_empty") {
                            EmptyState(
                                icon = Icons.Rounded.EditNote,
                                title = if (state.query.isBlank()) "No drafts yet" else "No drafts match",
                                message = if (state.query.isBlank()) {
                                    "Anything you write in the studio autosaves here."
                                } else {
                                    "Try a shorter filter."
                                },
                                actionLabel = if (state.query.isBlank()) "Open the studio" else null,
                                onAction = if (state.query.isBlank()) onNewPrompt else null,
                            )
                        }
                    }
                    items(state.visibleDrafts, key = { "draft_${it.id}" }) { draft ->
                        DraftCard(
                            draft = draft,
                            onOpen = { onOpenDraft(draft) },
                            onDelete = { draftToDelete = draft },
                        )
                    }
                }

                LibraryTab.PROMPTS -> {
                    if (state.visiblePrompts.isEmpty()) {
                        item(key = "prompts_empty") {
                            EmptyState(
                                icon = Icons.Rounded.EditNote,
                                title = "No prompts saved",
                                message = "Save a prompt from the studio and it will appear here, ready to reuse.",
                                actionLabel = "Create a prompt",
                                onAction = onNewPrompt,
                            )
                        }
                    }
                    items(state.visiblePrompts, key = { "prompt_${it.id}" }) { item ->
                        MyItemCard(
                            item = item,
                            menuOpen = menuFor == item.id,
                            busy = state.busyId == item.id,
                            onOpen = { onOpenItem(ItemKind.PROMPT, item.id) },
                            onMenuOpen = { menuFor = item.id },
                            onMenuDismiss = { menuFor = null },
                            onToggleVisibility = {
                                menuFor = null
                                viewModel.setVisibility(ItemKind.PROMPT, item, !item.isPublic)
                            },
                            onDelete = {
                                menuFor = null
                                itemToDelete = ItemKind.PROMPT to item
                            },
                        )
                    }
                }

                LibraryTab.TEMPLATES -> {
                    if (state.visibleTemplates.isEmpty()) {
                        item(key = "templates_empty") {
                            EmptyState(
                                icon = Icons.Rounded.EditNote,
                                title = "No templates saved",
                                message = "Templates work well for repeatable briefs: code review, research synthesis, release notes.",
                                actionLabel = "Create a prompt",
                                onAction = onNewPrompt,
                            )
                        }
                    }
                    items(state.visibleTemplates, key = { "template_${it.id}" }) { item ->
                        MyItemCard(
                            item = item,
                            menuOpen = menuFor == item.id,
                            busy = state.busyId == item.id,
                            onOpen = { onOpenItem(ItemKind.TEMPLATE, item.id) },
                            onMenuOpen = { menuFor = item.id },
                            onMenuDismiss = { menuFor = null },
                            onToggleVisibility = {
                                menuFor = null
                                viewModel.setVisibility(ItemKind.TEMPLATE, item, !item.isPublic)
                            },
                            onDelete = {
                                menuFor = null
                                itemToDelete = ItemKind.TEMPLATE to item
                            },
                        )
                    }
                }

                LibraryTab.SAVED -> {
                    if (state.visibleBookmarks.isEmpty()) {
                        item(key = "saved_empty") {
                            EmptyState(
                                icon = Icons.Rounded.Bookmarks,
                                title = "Nothing bookmarked",
                                message = "Tap the bookmark on any community prompt to keep it one thumb away.",
                            )
                        }
                    }
                    items(state.visibleBookmarks, key = { "bm_${it.kind.apiPath}_${it.itemId}" }) { bookmark ->
                        BookmarkCard(
                            bookmark = bookmark,
                            onOpen = { onOpenItem(bookmark.kind, bookmark.itemId) },
                            onRemove = { viewModel.removeBookmark(bookmark) },
                        )
                    }
                }
            }

            if (state.refreshing) {
                item(key = "refreshing") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text("Syncing…", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            item(key = "sync_note") {
                Text(
                    text = "Drafts and bookmarks never leave this device unless you save or share them.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
    }

    val deletingDraft = draftToDelete
    if (deletingDraft != null) {
        ConfirmDialog(
            title = "Delete this draft?",
            message = "“${deletingDraft.title.ifBlank { "Untitled draft" }}” will be removed from this device.",
            confirmLabel = "Delete",
            destructive = true,
            onConfirm = {
                draftToDelete = null
                viewModel.deleteDraft(deletingDraft.id)
            },
            onDismiss = { draftToDelete = null },
        )
    }

    val deletingItem = itemToDelete
    if (deletingItem != null) {
        val (kind, item) = deletingItem
        ConfirmDialog(
            title = "Delete “${item.title}”?",
            message = "This removes it from the community and from your library. This can't be undone.",
            confirmLabel = "Delete",
            destructive = true,
            onConfirm = {
                itemToDelete = null
                viewModel.deleteItem(kind, item.id)
            },
            onDismiss = { itemToDelete = null },
        )
    }
}

@Composable
private fun DraftCard(
    draft: LocalDraft,
    onOpen: () -> Unit,
    onDelete: () -> Unit,
) {
    val preview = remember(draft) {
        draft.sections.firstOrNull { it.content.isNotBlank() }?.content?.take(180).orEmpty()
    }
    AppCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = draft.title.ifBlank { "Untitled draft" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(3.dp))
                if (preview.isNotBlank()) {
                    TruncatedText(text = preview, maxLines = 2)
                } else {
                    Text(
                        text = "Empty draft",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) {
                Icon(
                    Icons.Rounded.Delete,
                    contentDescription = "Delete draft",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "${draft.sections.count { it.content.isNotBlank() }} sections · ${DateTimeFormat.fromMillis(draft.updatedAt)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(1f),
            )
            FilledTonalButton(onClick = onOpen, shape = MaterialTheme.shapes.medium) {
                Icon(Icons.Rounded.EditNote, contentDescription = null, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(5.dp))
                Text("Open")
            }
        }
    }
}

@Composable
private fun MyItemCard(
    item: MyItem,
    menuOpen: Boolean,
    busy: Boolean,
    onOpen: () -> Unit,
    onMenuOpen: () -> Unit,
    onMenuDismiss: () -> Unit,
    onToggleVisibility: () -> Unit,
    onDelete: () -> Unit,
) {
    AppCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (!item.description.isNullOrBlank()) {
                    Spacer(Modifier.height(2.dp))
                    TruncatedText(text = item.description.orEmpty(), maxLines = 2)
                }
            }
            Box {
                IconButton(onClick = onMenuOpen, modifier = Modifier.size(34.dp)) {
                    if (busy) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(
                            Icons.Rounded.MoreVert,
                            contentDescription = "More actions",
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
                DropdownMenu(expanded = menuOpen, onDismissRequest = onMenuDismiss) {
                    DropdownMenuItem(
                        text = {
                            Text(if (item.isPublic) "Make private" else "Share publicly")
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = if (item.isPublic) Icons.Rounded.Lock else Icons.Rounded.Public,
                                contentDescription = null,
                            )
                        },
                        onClick = onToggleVisibility,
                    )
                    DropdownMenuItem(
                        text = { Text("Delete", color = MaterialTheme.colorScheme.error) },
                        leadingIcon = {
                            Icon(
                                Icons.Rounded.Delete,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                            )
                        },
                        onClick = onDelete,
                    )
                }
            }
        }
        Spacer(Modifier.height(9.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            BadgeChip(
                text = if (item.isPublic) "Public" else "Private",
                icon = if (item.isPublic) Icons.Rounded.Public else Icons.Rounded.Lock,
            )
            Spacer(Modifier.width(8.dp))
            Icon(
                Icons.Rounded.FavoriteBorder,
                contentDescription = null,
                modifier = Modifier.size(13.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.width(3.dp))
            Text(
                text = "${item.likes}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.width(8.dp))
            Icon(
                Icons.Rounded.Visibility,
                contentDescription = null,
                modifier = Modifier.size(13.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.width(3.dp))
            Text(
                text = "${item.views}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.weight(1f))
            Text(
                text = DateTimeFormat.relative(item.updatedAt ?: item.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun BookmarkCard(
    bookmark: Bookmark,
    onOpen: () -> Unit,
    onRemove: () -> Unit,
) {
    AppCard(onClick = onOpen) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = bookmark.title.ifBlank { "Untitled" },
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.height(3.dp))
                BadgeChip(text = if (bookmark.kind == ItemKind.PROMPT) "Prompt" else "Template")
            }
            TextButton(onClick = onRemove) {
                Icon(
                    Icons.Rounded.Delete,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text("Remove")
            }
        }
    }
}
