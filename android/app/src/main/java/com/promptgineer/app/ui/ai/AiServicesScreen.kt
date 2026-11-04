package com.promptgineer.app.ui.ai

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Key
import androidx.compose.material.icons.rounded.Launch
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.AiProviderInfo
import com.promptgineer.app.domain.ConnectedAiService
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
import com.promptgineer.app.ui.components.SectionDivider
import com.promptgineer.app.ui.theme.LocalExtraColors
import com.promptgineer.app.util.IntentUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiServicesScreen(
    viewModel: AiServicesViewModel,
    onBack: () -> Unit,
    onRequireSignIn: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var disconnectTarget by remember { mutableStateOf<ConnectedAiService?>(null) }

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is AiServicesEvent.OpenUrl -> IntentUtils.openUrl(context, event.url)
                AiServicesEvent.RequireSignIn -> onRequireSignIn()
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        BackHeader(
            title = "AI services",
            onBack = onBack,
            actions = {
                if (state.signedIn) {
                    IconButton(onClick = viewModel::load) {
                        Icon(Icons.Rounded.Refresh, contentDescription = "Refresh")
                    }
                }
            },
        )

        if (!state.signedIn) {
            EmptyState(
                icon = Icons.Rounded.Key,
                title = "Sign in to use a model",
                message = "The builders and the CLEAR review work offline. Connecting a provider key (or using the free tier) needs an account so keys and quotas can be stored safely.",
                actionLabel = "Sign in",
                onAction = onRequireSignIn,
                modifier = Modifier.padding(24.dp),
            )
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "intro") {
                Column {
                    Text(
                        text = "One place for every model",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(Modifier.height(5.dp))
                    Text(
                        text = "Use the free platform tier, or plug in your own key. The app never sees a stored key again after it is saved.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            state.error?.let { error ->
                item(key = "error") {
                    ErrorState(error = error, onRetry = viewModel::load)
                }
            }

            if (state.loading && state.snapshot == null) {
                item(key = "loading") { LoadingBlock("Checking your providers…") }
            }

            val snapshot = state.snapshot
            if (snapshot != null) {
                item(key = "platform") {
                    val platform = snapshot.platform
                    val extras = LocalExtraColors.current
                    AppCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Rounded.AutoAwesome,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                            )
                            Spacer(Modifier.width(9.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Platform tier (NVIDIA NIM)",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    text = if (platform?.available == true) {
                                        "No key needed · shared free capacity"
                                    } else {
                                        "Not configured on this server"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            BadgeChip(
                                text = if (platform?.available == true) "Available" else "Offline",
                                containerColor = if (platform?.available == true) {
                                    extras.successContainer
                                } else {
                                    MaterialTheme.colorScheme.surfaceVariant
                                },
                                contentColor = if (platform?.available == true) {
                                    extras.onSuccessContainer
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                },
                            )
                        }

                        if (platform?.available == true) {
                            Spacer(Modifier.height(10.dp))
                            if (platform.dailyLimit == null || platform.remainingToday == null) {
                                Text(
                                    text = "Unlimited generations on this account.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            } else {
                                Text(
                                    text = "${platform.remainingToday} of ${platform.dailyLimit} free generations left today",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Spacer(Modifier.height(6.dp))
                                LinearProgressIndicator(
                                    progress = { platform.usedFraction },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp),
                                )
                            }
                            if (platform.models.isNotEmpty()) {
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = "Fallback chain: ${platform.models.joinToString(" → ")}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }

                item(key = "connected_header") {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Your providers",
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = "${snapshot.connected.size} connected",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                if (snapshot.connected.isEmpty()) {
                    item(key = "connected_empty") {
                        AppCard {
                            Text(
                                text = "No keys connected yet",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Spacer(Modifier.height(3.dp))
                            Text(
                                text = "The free tier is enough to try everything. Add a key when you want a specific model or higher limits.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                } else {
                    items(snapshot.connected, key = { it.name }) { service ->
                        val provider = snapshot.providers.firstOrNull { it.id == service.name }
                        ConnectedCard(
                            service = service,
                            provider = provider,
                            busy = state.busyService == service.name,
                            onToggleActive = { active -> viewModel.toggleActive(service.name, active) },
                            onTest = { viewModel.testService(service.name) },
                            onDisconnect = { disconnectTarget = service },
                        )
                    }
                }

                item(key = "add_header") {
                    Text(
                        text = "Add a provider",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }

                items(
                    snapshot.providers.filter { provider ->
                        snapshot.connected.none { it.name == provider.id }
                    },
                    key = { "provider_${it.id}" },
                ) { provider ->
                    ProviderRow(
                        provider = provider,
                        onConnect = { viewModel.startConnect(provider.id) },
                    )
                }

                item(key = "privacy") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Icon(
                            Icons.Rounded.Lock,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(15.dp),
                        )
                        Spacer(Modifier.width(7.dp))
                        Text(
                            text = "Keys are encrypted before they are stored and are never sent back to the app. Removing a provider deletes its key immediately.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }

    if (state.showConnect) {
        val form = state.form
        ModalBottomSheet(
            onDismissRequest = viewModel::dismissConnect,
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
                    text = "Connect ${form.provider?.label ?: "provider"}",
                    style = MaterialTheme.typography.headlineSmall,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Create a key in the provider console and paste it here. It is sent once over HTTPS and stored encrypted.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                if (form.error != null) {
                    Spacer(Modifier.height(12.dp))
                    InlineBanner(text = form.error!!, tone = BannerTone.ERROR)
                }

                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = form.apiKey,
                    onValueChange = viewModel::setApiKey,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("API key") },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                    visualTransformation = if (form.keyVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    trailingIcon = {
                        IconButton(onClick = viewModel::toggleKeyVisibility) {
                            Icon(
                                imageVector = if (form.keyVisible) {
                                    Icons.Rounded.VisibilityOff
                                } else {
                                    Icons.Rounded.Visibility
                                },
                                contentDescription = if (form.keyVisible) "Hide key" else "Show key",
                            )
                        }
                    },
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = form.model,
                    onValueChange = viewModel::setModel,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Model (optional)") },
                    placeholder = {
                        Text(form.provider?.defaultModel?.takeIf { it.isNotBlank() } ?: "Provider default")
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = form.baseUrl,
                    onValueChange = viewModel::setBaseUrl,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Base URL (optional)") },
                    placeholder = { Text("For proxies or self-hosted models") },
                    singleLine = true,
                    shape = RoundedCornerShape(13.dp),
                )

                if (!form.provider?.docsUrl.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    TextButton(
                        onClick = viewModel::openDocs,
                        contentPadding = PaddingValues(0.dp),
                    ) {
                        Icon(Icons.Rounded.Launch, contentDescription = null, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(5.dp))
                        Text("Where do I find this key?")
                    }
                }

                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = viewModel::submitConnect,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = !form.submitting && form.apiKey.isNotBlank(),
                    shape = MaterialTheme.shapes.medium,
                ) {
                    if (form.submitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(17.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(9.dp))
                    }
                    Text(if (form.submitting) "Checking the key…" else "Save and test")
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "The test costs a fraction of a cent and confirms the key, base URL and model work together.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }

    val target = disconnectTarget
    if (target != null) {
        ConfirmDialog(
            title = "Disconnect ${target.name}?",
            message = "The stored key will be deleted and any generation routed through it will fall back to the platform tier.",
            confirmLabel = "Disconnect",
            destructive = true,
            onConfirm = {
                disconnectTarget = null
                viewModel.disconnect(target.name)
            },
            onDismiss = { disconnectTarget = null },
        )
    }
}

@Composable
private fun ConnectedCard(
    service: ConnectedAiService,
    provider: AiProviderInfo?,
    busy: Boolean,
    onToggleActive: (Boolean) -> Unit,
    onTest: () -> Unit,
    onDisconnect: () -> Unit,
) {
    val extras = LocalExtraColors.current
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(name = provider?.label ?: service.name, url = null, size = 34.dp)
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = provider?.label ?: service.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    if (service.isActive) {
                        Spacer(Modifier.width(6.dp))
                        Icon(
                            Icons.Rounded.CheckCircle,
                            contentDescription = "Active",
                            tint = extras.success,
                            modifier = Modifier.size(14.dp),
                        )
                    }
                }
                Text(
                    text = listOfNotNull(
                        service.model?.takeIf { it.isNotBlank() },
                        service.baseUrl?.takeIf { it.isNotBlank() }?.substringAfter("://"),
                    ).joinToString(" · ").ifBlank { "Default endpoint" },
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                )
            }
            if (busy) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Switch(checked = service.isActive, onCheckedChange = onToggleActive)
            }
        }
        Spacer(Modifier.height(8.dp))
        SectionDivider()
        Row(verticalAlignment = Alignment.CenterVertically) {
            FilledTonalButton(onClick = onTest, enabled = !busy, shape = MaterialTheme.shapes.medium) {
                Text("Test")
            }
            Spacer(Modifier.weight(1f))
            TextButton(onClick = onDisconnect, enabled = !busy) {
                Text("Remove", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun ProviderRow(provider: AiProviderInfo, onConnect: () -> Unit) {
    AppCard(contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(name = provider.label, url = null, size = 32.dp)
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = provider.label,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                )
                if (provider.defaultModel.isNotBlank()) {
                    Text(
                        text = provider.defaultModel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            TextButton(onClick = onConnect) { Text("Connect") }
        }
    }
}
