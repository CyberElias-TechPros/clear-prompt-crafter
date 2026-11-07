package com.promptgineer.app.ui.settings

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Key
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Password
import androidx.compose.material.icons.rounded.Storage
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.BuildConfig
import com.promptgineer.app.core.ThemeMode
import com.promptgineer.app.core.Validate
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.components.SectionDivider
import com.promptgineer.app.ui.theme.PromptMonoStyle
import com.promptgineer.app.util.IntentUtils

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
    onOpenAiServices: () -> Unit,
    onOpenLegal: (String) -> Unit,
    onOpenContact: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }
    var confirmClear by remember { mutableStateOf(false) }

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is SettingsEvent.ExportReady -> {
                    val shared = IntentUtils.shareFile(
                        context,
                        "prompt-gineer-export.json",
                        event.json,
                    )
                    if (shared) {
                        Toast.makeText(context, "Export ready to save or send", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "No app available to receive the export", Toast.LENGTH_SHORT).show()
                    }
                }
                SettingsEvent.AccountDeleted -> {
                    Toast.makeText(context, "Account deleted", Toast.LENGTH_SHORT).show()
                    onBack()
                }
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        BackHeader(title = "Settings", onBack = onBack)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
        ) {
            SettingsSection(title = "Appearance") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeMode.entries.forEach { mode ->
                        PillButton(
                            text = when (mode) {
                                ThemeMode.SYSTEM -> "System"
                                ThemeMode.LIGHT -> "Light"
                                ThemeMode.DARK -> "Dark"
                            },
                            selected = state.settings.theme == mode,
                            onClick = { viewModel.setTheme(mode) },
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                SwitchRow(
                    title = "Dynamic color",
                    subtitle = "Follow the wallpaper palette on Android 12+",
                    checked = state.settings.dynamicColor,
                    onCheckedChange = viewModel::setDynamicColor,
                )
                SectionDivider()
                SwitchRow(
                    title = "Haptics",
                    subtitle = "A short tick when a prompt is copied or saved",
                    checked = state.settings.haptics,
                    onCheckedChange = viewModel::setHaptics,
                )
            }

            SettingsSection(title = "Account") {
                if (!state.signedIn) {
                    Text(
                        text = "Sign in to manage your account, export your data or change your password.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    Text(
                        text = state.user?.email.orEmpty(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                    )
                    Text(
                        text = "Signed in as ${state.user?.displayName.orEmpty()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(10.dp))
                    ActionRow(
                        icon = Icons.Rounded.Password,
                        title = "Change password",
                        onClick = viewModel::openPasswordDialog,
                    )
                    Spacer(Modifier.height(6.dp))
                    ActionRow(
                        icon = Icons.Rounded.Key,
                        title = "AI services and keys",
                        onClick = onOpenAiServices,
                    )
                    Spacer(Modifier.height(6.dp))
                    ActionRow(
                        icon = Icons.Rounded.Download,
                        title = if (state.exporting) "Preparing export…" else "Export my data",
                        busy = state.exporting,
                        onClick = viewModel::exportData,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Exports a JSON file with your profile, prompts, templates and activity.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            SettingsSection(title = "Server") {
                Text(
                    text = state.settings.serverUrl,
                    style = PromptMonoStyle,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "The deployment this app talks to. Switching signs you out so the new server can issue its own token.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ActionRow(
                        icon = Icons.Rounded.Language,
                        title = "Change",
                        compact = true,
                        onClick = viewModel::openServerDialog,
                        modifier = Modifier.weight(1f),
                    )
                    ActionRow(
                        icon = Icons.Rounded.Storage,
                        title = "Reset",
                        compact = true,
                        onClick = viewModel::resetServer,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            SettingsSection(title = "Data & privacy") {
                ActionRow(
                    icon = Icons.Rounded.Storage,
                    title = if (state.clearing) "Clearing…" else "Clear local drafts and caches",
                    busy = state.clearing,
                    destructive = true,
                    onClick = { confirmClear = true },
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Removes the autosaved workspace, coach transcript, local draft list, bookmarks and cached feeds from this device. Published prompts are untouched.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                SectionDivider()
                ActionRow(
                    icon = Icons.Rounded.Lock,
                    title = "Privacy policy",
                    onClick = { onOpenLegal("privacy") },
                )
                Spacer(Modifier.height(6.dp))
                ActionRow(
                    icon = Icons.Rounded.Mail,
                    title = "Contact the team",
                    onClick = onOpenContact,
                )
            }

            SettingsSection(title = "About") {
                Text(
                    text = "Prompt-Gineer ${BuildConfig.VERSION_NAME} (build ${BuildConfig.VERSION_CODE})",
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    text = "Native Android · Compose · no WebView",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { onOpenLegal("terms") }) { Text("Terms") }
                    TextButton(onClick = { onOpenLegal("about") }) { Text("How it works") }
                }
            }

            if (state.signedIn) {
                SettingsSection(title = "Danger zone") {
                    Text(
                        text = "Deleting your account removes your profile, prompts, templates, comments and connected keys. It cannot be undone.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = { confirmDelete = true },
                        enabled = !state.deleting,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error,
                            contentColor = MaterialTheme.colorScheme.onError,
                        ),
                        shape = MaterialTheme.shapes.medium,
                    ) {
                        if (state.deleting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(15.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onError,
                            )
                            Spacer(Modifier.width(7.dp))
                        }
                        Text(if (state.deleting) "Deleting…" else "Delete my account")
                    }
                }
            }
        }
    }

    if (state.password.visible) {
        AlertDialog(
            onDismissRequest = viewModel::dismissPasswordDialog,
            title = { Text("Change password") },
            text = {
                Column {
                    OutlinedTextField(
                        value = state.password.current,
                        onValueChange = viewModel::setCurrentPassword,
                        label = { Text("Current password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.password.next,
                        onValueChange = viewModel::setNewPassword,
                        label = { Text("New password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.password.confirm,
                        onValueChange = viewModel::setConfirmPassword,
                        label = { Text("Confirm new password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    if (state.password.error != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = state.password.error!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Changing your password signs out other devices.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = viewModel::submitPasswordChange,
                    enabled = !state.password.submitting,
                ) {
                    if (state.password.submitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(15.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(7.dp))
                    }
                    Text("Update")
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::dismissPasswordDialog) { Text("Cancel") }
            },
        )
    }

    if (state.server.visible) {
        AlertDialog(
            onDismissRequest = viewModel::dismissServerDialog,
            title = { Text("Change server") },
            text = {
                Column {
                    OutlinedTextField(
                        value = state.server.url,
                        onValueChange = viewModel::setServerUrl,
                        label = { Text("Base URL") },
                        placeholder = { Text("https://your-worker.workers.dev") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                    if (state.server.error != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = state.server.error!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "The app checks the new server's health endpoint before switching. You will be signed out afterwards.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = viewModel::submitServerChange,
                    enabled = !state.server.submitting,
                ) {
                    if (state.server.submitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(15.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(7.dp))
                    }
                    Text("Test & switch")
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::dismissServerDialog) { Text("Cancel") }
            },
        )
    }

    if (confirmClear) {
        ConfirmDialog(
            title = "Clear local data?",
            message = "Autosaved edits, the coach transcript, local drafts, bookmarks and cached feeds will be removed from this device.",
            confirmLabel = "Clear",
            destructive = true,
            onConfirm = {
                confirmClear = false
                viewModel.clearLocalData()
            },
            onDismiss = { confirmClear = false },
        )
    }

    if (confirmDelete) {
        ConfirmDialog(
            title = "Delete your account?",
            message = "This permanently deletes your profile, prompts, templates, comments and connected keys. If you only want a copy, export your data first.",
            confirmLabel = "Delete forever",
            destructive = true,
            onConfirm = {
                confirmDelete = false
                viewModel.deleteAccount()
            },
            onDismiss = { confirmDelete = false },
        )
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Column(modifier = Modifier.padding(bottom = 14.dp)) {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 4.dp, bottom = 6.dp, top = 4.dp),
        )
        AppCard(content = content)
    }
}

@Composable
private fun SwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun ActionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    busy: Boolean = false,
    destructive: Boolean = false,
    compact: Boolean = false,
) {
    AppCard(
        modifier = modifier,
        onClick = if (busy) null else onClick,
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            horizontal = 12.dp,
            vertical = if (compact) 10.dp else 12.dp,
        ),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (busy) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
            } else {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (destructive) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    modifier = Modifier.size(17.dp),
                )
            }
            Spacer(Modifier.width(9.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = if (destructive) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
            )
        }
    }
}
