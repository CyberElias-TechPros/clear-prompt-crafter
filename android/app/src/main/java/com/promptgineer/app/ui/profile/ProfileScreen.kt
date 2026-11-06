package com.promptgineer.app.ui.profile

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bookmarks
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Key
import androidx.compose.material.icons.rounded.Logout
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.BuildConfig
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.Avatar
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.FullScreenMessage
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.components.SectionDivider
import com.promptgineer.app.ui.components.StatTile
import com.promptgineer.app.util.DateTimeFormat

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onOpenSettings: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenAiServices: () -> Unit,
    onOpenLeaderboard: () -> Unit,
    onOpenAdminAds: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenLegal: (String) -> Unit,
    onRequireSignIn: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var confirmSignOut by remember { mutableStateOf(false) }
    val user = state.user

    if (!state.signedIn || user == null) {
        FullScreenMessage(
            title = "No account yet",
            message = "Sign in to see your profile, points and the prompts you've published.",
            icon = Icons.Rounded.Groups,
            actionLabel = "Sign in",
            onAction = onRequireSignIn,
        )
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 18.dp, bottom = 26.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Profile",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Your corner",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                )
            }
            IconButton(onClick = onOpenSettings) {
                Icon(Icons.Rounded.Settings, contentDescription = "Settings")
            }
        }

        Spacer(Modifier.height(14.dp))
        AppCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(name = user.displayName, url = user.avatarUrl, size = 62.dp)
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.displayName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (user.isAdmin) BadgeChip(text = "Admin", icon = Icons.Rounded.AdminPanelSettings)
                        if (user.isPremium) BadgeChip(text = "Pro", icon = Icons.Rounded.AutoAwesome)
                        if (!user.isAdmin && !user.isPremium) {
                            BadgeChip(text = "Member", icon = Icons.Rounded.Groups)
                        }
                    }
                }
                IconButton(onClick = viewModel::startEdit) {
                    Icon(Icons.Rounded.Edit, contentDescription = "Edit profile")
                }
            }

            if (user.createdAt != null) {
                Spacer(Modifier.height(10.dp))
                Text(
                    text = "Joined ${DateTimeFormat.absoluteDate(user.createdAt)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(Modifier.height(8.dp))
            SectionDivider()
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Help improve public prompts",
                        style = MaterialTheme.typography.labelLarge,
                    )
                    Text(
                        text = "Private prompts are never used. You can change this any time.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(
                    checked = user.allowLearning,
                    onCheckedChange = viewModel::setLearningAllowed,
                    enabled = !state.updatingLearning,
                )
            }
        }

        Spacer(Modifier.height(12.dp))
        AppCard(contentPadding = PaddingValues(14.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(value = "${state.prompts.size}", label = "prompts", modifier = Modifier.weight(1f))
                StatTile(value = "${state.templates.size}", label = "templates", modifier = Modifier.weight(1f))
                StatTile(value = "${state.totalLikes}", label = "likes", modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(value = "${state.totalViews}", label = "views", modifier = Modifier.weight(1f))
                StatTile(value = "${state.drafts}", label = "drafts", modifier = Modifier.weight(1f))
                StatTile(value = "${state.bookmarks}", label = "bookmarks", modifier = Modifier.weight(1f))
            }
            if (state.loadingStats) {
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(7.dp))
                    Text(
                        text = "Syncing stats…",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        ProfileRow(
            icon = Icons.Rounded.EmojiEvents,
            title = if (state.rank != null) "Rank #${state.rank}" else "Leaderboard",
            subtitle = if (state.points != null) {
                "${state.points} points earned by contributing"
            } else {
                "Publish a prompt to appear on the board"
            },
            onClick = onOpenLeaderboard,
        )
        Spacer(Modifier.height(8.dp))
        ProfileRow(
            icon = Icons.Rounded.Bookmarks,
            title = "Library",
            subtitle = "Drafts, published prompts and bookmarks",
            onClick = onOpenLibrary,
        )
        Spacer(Modifier.height(8.dp))
        ProfileRow(
            icon = Icons.Rounded.Key,
            title = "AI services",
            subtitle = "Free tier and bring-your-own keys",
            onClick = onOpenAiServices,
        )
        if (user.isAdmin) {
            Spacer(Modifier.height(8.dp))
            ProfileRow(
                icon = Icons.Rounded.AdminPanelSettings,
                title = "Manage ads",
                subtitle = "House ads shown on the dashboard",
                onClick = onOpenAdminAds,
            )
        }
        Spacer(Modifier.height(8.dp))
        ProfileRow(
            icon = Icons.Rounded.Mail,
            title = "Contact the team",
            subtitle = "Bugs, ideas, account help",
            onClick = onOpenContact,
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SmallLink(
                icon = Icons.Rounded.Security,
                label = "Privacy",
                onClick = { onOpenLegal("privacy") },
                modifier = Modifier.weight(1f),
            )
            SmallLink(
                icon = Icons.Rounded.Shield,
                label = "Terms",
                onClick = { onOpenLegal("terms") },
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(18.dp))
        TextButton(
            onClick = { confirmSignOut = true },
            enabled = !state.signingOut,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Rounded.Logout, contentDescription = null, modifier = Modifier.size(17.dp))
            Spacer(Modifier.width(6.dp))
            Text("Sign out")
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "Prompt-Gineer ${BuildConfig.VERSION_NAME} · local-first",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth(),
        )
    }

    if (state.edit.visible) {
        AlertDialog(
            onDismissRequest = viewModel::dismissEdit,
            title = { Text("Edit profile") },
            text = {
                Column {
                    OutlinedTextField(
                        value = state.edit.fullName,
                        onValueChange = viewModel::setEditName,
                        label = { Text("Display name") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = state.edit.avatarUrl,
                        onValueChange = viewModel::setEditAvatar,
                        label = { Text("Avatar URL (https)") },
                        placeholder = { Text("https://…") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                    if (state.edit.error != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = state.edit.error!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = viewModel::saveProfile,
                    enabled = !state.edit.saving,
                ) {
                    if (state.edit.saving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(15.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(7.dp))
                    }
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::dismissEdit) { Text("Cancel") }
            },
        )
    }

    if (confirmSignOut) {
        ConfirmDialog(
            title = "Sign out?",
            message = "You can sign back in any time. Drafts and bookmarks stay on this device.",
            confirmLabel = "Sign out",
            onConfirm = {
                confirmSignOut = false
                viewModel.signOut()
            },
            onDismiss = { confirmSignOut = false },
        )
    }
}

@Composable
private fun ProfileRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
) {
    AppCard(onClick = onClick, contentPadding = PaddingValues(horizontal = 14.dp, vertical = 13.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(34.dp),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
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

@Composable
private fun SmallLink(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AppCard(modifier = modifier, onClick = onClick, contentPadding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(7.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
            )
        }
    }
}
