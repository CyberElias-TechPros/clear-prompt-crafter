package com.promptgineer.app.ui.admin

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.Ad
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.ErrorState
import com.promptgineer.app.ui.components.FullScreenMessage
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.components.SectionDivider

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminAdsScreen(
    viewModel: AdminAdsViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var deleteTarget by remember { mutableStateOf<Ad?>(null) }

    if (!state.isAdmin) {
        FullScreenMessage(
            title = "Admins only",
            message = "You need an administrator account to manage house ads. Ask an owner of this deployment to upgrade your role.",
            icon = Icons.Rounded.Lock,
            actionLabel = "Back",
            onAction = onBack,
        )
        return
    }

    Column(modifier = Modifier.fillMaxSize()) {
        BackHeader(
            title = "Ads",
            onBack = onBack,
            actions = {
                IconButton(onClick = viewModel::load) {
                    Icon(Icons.Rounded.Refresh, contentDescription = "Refresh ads")
                }
                IconButton(onClick = viewModel::startCreate) {
                    Icon(Icons.Rounded.Add, contentDescription = "New ad")
                }
            },
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item(key = "intro") {
                Column {
                    Text(
                        text = "House ads",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Placements are shown on the dashboard. Keep the copy honest and the link useful; people can tell the difference.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(10.dp))
                    FilledTonalButton(onClick = viewModel::startCreate, shape = MaterialTheme.shapes.medium) {
                        Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("New ad")
                    }
                }
            }

            state.error?.let { error ->
                item(key = "error") {
                    ErrorState(error = error, onRetry = viewModel::load)
                }
            }

            when {
                state.loading && state.ads.isEmpty() -> item(key = "loading") {
                    LoadingBlock("Loading placements…")
                }

                state.ads.isEmpty() -> item(key = "empty") {
                    EmptyState(
                        icon = Icons.Rounded.Add,
                        title = "No ads configured",
                        message = "The dashboard simply won't show a sponsored card until you add one.",
                        actionLabel = "Create the first ad",
                        onAction = viewModel::startCreate,
                    )
                }

                else -> items(state.ads, key = { it.id }) { ad ->
                    AdAdminCard(
                        ad = ad,
                        busy = state.busyId == ad.id,
                        onToggleActive = { active -> viewModel.toggleActive(ad, active) },
                        onEdit = { viewModel.startEdit(ad) },
                        onDelete = { deleteTarget = ad },
                    )
                }
            }
        }
    }

    if (state.form.visible) {
        val form = state.form
        ModalBottomSheet(
            onDismissRequest = viewModel::dismissForm,
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .imePadding()
                    .padding(horizontal = 22.dp)
                    .padding(bottom = 24.dp)
                    .navigationBarsPadding(),
            ) {
                Text(
                    text = if (form.isEditing) "Edit ad" else "New ad",
                    style = MaterialTheme.typography.headlineSmall,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Active ads appear on the dashboard for everyone. Keep titles under 60 characters.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                if (form.error != null) {
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = form.error!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                }

                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = form.title,
                    onValueChange = viewModel::setTitle,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Title") },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = form.content,
                    onValueChange = viewModel::setContent,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Body") },
                    minLines = 2,
                    maxLines = 4,
                    shape = RoundedCornerShape(13.dp),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = form.linkUrl,
                    onValueChange = viewModel::setLink,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Link") },
                    placeholder = { Text("https://… or /community") },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = form.imageUrl,
                    onValueChange = viewModel::setImage,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Image URL (optional)") },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                )

                Spacer(Modifier.height(14.dp))
                Text("Size", style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    Ad.SIZES.forEach { size ->
                        PillButton(
                            text = size.replaceFirstChar { it.uppercase() },
                            selected = form.size == size,
                            onClick = { viewModel.setSize(size) },
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))
                Text("Position", style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    Ad.POSITIONS.forEach { position ->
                        PillButton(
                            text = position.replaceFirstChar { it.uppercase() },
                            selected = form.position == position,
                            onClick = { viewModel.setPosition(position) },
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Active", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = "Turn off to hide without deleting.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(checked = form.active, onCheckedChange = viewModel::setActive)
                }

                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = viewModel::submitForm,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = form.canSubmit,
                    shape = MaterialTheme.shapes.medium,
                ) {
                    if (form.submitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(17.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(
                        if (form.submitting) {
                            "Saving…"
                        } else if (form.isEditing) {
                            "Save changes"
                        } else {
                            "Create ad"
                        },
                    )
                }
            }
        }
    }

    val target = deleteTarget
    if (target != null) {
        ConfirmDialog(
            title = "Delete “${target.title}”?",
            message = "The placement is removed immediately. This can't be undone.",
            confirmLabel = "Delete",
            destructive = true,
            onConfirm = {
                deleteTarget = null
                viewModel.delete(target)
            },
            onDismiss = { deleteTarget = null },
        )
    }
}

@Composable
private fun AdAdminCard(
    ad: Ad,
    busy: Boolean,
    onToggleActive: (Boolean) -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    AppCard {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = ad.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    text = ad.content,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = ad.linkUrl,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            if (busy) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Switch(checked = ad.isActive, onCheckedChange = onToggleActive)
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            BadgeChip(text = ad.size)
            BadgeChip(text = ad.position)
            if (!ad.isActive) BadgeChip(text = "Paused")
        }
        Spacer(Modifier.height(4.dp))
        SectionDivider()
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onEdit, enabled = !busy) {
                Icon(Icons.Rounded.Edit, contentDescription = null, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(5.dp))
                Text("Edit")
            }
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onDelete, enabled = !busy) {
                Icon(
                    Icons.Rounded.Delete,
                    contentDescription = null,
                    modifier = Modifier.size(15.dp),
                    tint = MaterialTheme.colorScheme.error,
                )
                Spacer(Modifier.width(5.dp))
                Text("Delete", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
