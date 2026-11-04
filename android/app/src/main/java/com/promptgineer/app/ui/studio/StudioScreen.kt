package com.promptgineer.app.ui.studio

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bookmarks
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Forum
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Sparkles
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Button
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.ClearAnalyzer
import com.promptgineer.app.domain.ClearStatus
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.PromptComposer
import com.promptgineer.app.domain.PromptRecipe
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.ClearCriteriaList
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.PromptActionBar
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.components.PromptCodeBlock
import com.promptgineer.app.ui.components.RecipePickerSheet
import com.promptgineer.app.ui.components.ScoreRing
import com.promptgineer.app.ui.components.ScreenHeader
import com.promptgineer.app.util.DateTimeFormat
import com.promptgineer.app.util.IntentUtils
import kotlinx.coroutines.flow.collectLatest
import android.widget.Toast

private enum class StudioTab(val label: String) {
    STRUCTURED("Build"),
    COACH("Coach"),
    REFINE("Refine"),
}

@Composable
fun StudioScreen(
    viewModel: StudioViewModel,
    isOnline: Boolean,
    sharedText: String?,
    onSharedTextConsumed: () -> Unit,
    importText: String?,
    onImportConsumed: () -> Unit,
    importDraft: com.promptgineer.app.domain.LocalDraft?,
    onImportDraftConsumed: () -> Unit,
    openMode: StudioMode?,
    onOpenModeConsumed: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenCommunity: () -> Unit,
    onOpenAiServices: () -> Unit,
    onRequireSignIn: () -> Unit,
    onSavedToLibrary: (String, ItemKind) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current

    var showRecipes by rememberSaveable { mutableStateOf(false) }
    var showPreview by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(viewModel) {
        viewModel.events.collectLatest { event ->
            when (event) {
                is StudioEvent.RequireSignIn -> onRequireSignIn()
                is StudioEvent.SavedToLibrary -> {
                    showPreview = false
                    onSavedToLibrary(event.id, event.kind)
                }
            }
        }
    }

    LaunchedEffect(sharedText) {
        if (!sharedText.isNullOrBlank()) {
            viewModel.onSharedText(sharedText)
            onSharedTextConsumed()
        }
    }

    LaunchedEffect(importText) {
        if (!importText.isNullOrBlank()) {
            viewModel.moveTextToBuilder(importText, sourceLabel = "Community prompt")
            onImportConsumed()
        }
    }

    LaunchedEffect(importDraft) {
        if (importDraft != null) {
            viewModel.openDraft(importDraft)
            onImportDraftConsumed()
        }
    }

    LaunchedEffect(openMode) {
        if (openMode != null) {
            viewModel.setMode(openMode)
            onOpenModeConsumed()
        }
    }

    val report = remember(state.sectionList) { ClearAnalyzer.analyze(state.composed) }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 18.dp),
        ) {
            ScreenHeader(
                kicker = "Workspace",
                title = "Prompt studio",
                subtitle = "Shape an idea into a clear brief your AI can work with.",
                actions = {
                    IconButton(onClick = onOpenLibrary) {
                        Icon(Icons.Rounded.Bookmarks, contentDescription = "Your library")
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Rounded.Settings, contentDescription = "Settings")
                    }
                },
            )
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                QuotaChip(state = state, onClick = {
                    if (state.signedIn) onOpenAiServices() else onRequireSignIn()
                })
                if (state.savedAt != null) {
                    Text(
                        text = "Saved on device · ${DateTimeFormat.fromMillis(state.savedAt!!)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            ModeTabs(
                selected = when (state.mode) {
                    StudioMode.STRUCTURED -> StudioTab.STRUCTURED
                    StudioMode.COACH -> StudioTab.COACH
                    StudioMode.REFINE -> StudioTab.REFINE
                },
                onSelect = { tab ->
                    viewModel.setMode(
                        when (tab) {
                            StudioTab.STRUCTURED -> StudioMode.STRUCTURED
                            StudioTab.COACH -> StudioMode.COACH
                            StudioTab.REFINE -> StudioMode.REFINE
                        },
                    )
                },
            )
            Spacer(Modifier.height(10.dp))
            if (!isOnline) {
                InlineBanner(
                    text = "You're offline. Drafts and the CLEAR review keep working on this device.",
                    tone = BannerTone.WARNING,
                )
                Spacer(Modifier.height(8.dp))
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            when (state.mode) {
                StudioMode.STRUCTURED -> StructuredPane(
                    state = state,
                    report = report,
                    onTitleChange = viewModel::setTitle,
                    onDescriptionChange = viewModel::setDescription,
                    onSectionChange = viewModel::updateSection,
                    onAddOptional = viewModel::addOptionalSection,
                    onRemoveSection = viewModel::removeSection,
                    onOpenRecipes = { showRecipes = true },
                    onClear = viewModel::clearWorkspace,
                    onRequireSignIn = onRequireSignIn,
                    onOpenAiServices = onOpenAiServices,
                )

                StudioMode.COACH -> CoachPane(
                    state = state,
                    isOnline = isOnline,
                    onInputChange = viewModel::setCoachInput,
                    onSend = { text -> viewModel.sendCoachMessage(text) },
                    onUseLastReply = viewModel::sendCoachReplyToRefine,
                    onClearChat = viewModel::clearCoach,
                )

                StudioMode.REFINE -> RefinePane(
                    state = state,
                    onTextChange = viewModel::setRefineText,
                    onAnalyze = viewModel::analyzeRefine,
                    onApplyFix = viewModel::applyFix,
                    onUseImproved = viewModel::sendRefineToBuilder,
                    onClear = viewModel::clearRefine,
                    onRequireSignIn = onRequireSignIn,
                    onOpenAiServices = onOpenAiServices,
                )
            }
        }

        if (state.mode != StudioMode.COACH) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .navigationBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
            ) {
                if (state.mode == StudioMode.STRUCTURED) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "${state.completedEssentials}/${state.essentialsTotal} essentials · ${PromptComposer.wordCount(state.composed)} words",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                        )
                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                showPreview = true
                            },
                            shape = MaterialTheme.shapes.medium,
                        ) {
                            Icon(Icons.Rounded.Visibility, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(7.dp))
                            Text("Preview & save")
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        androidx.compose.material3.OutlinedButton(
                            onClick = viewModel::sendRefineToBuilder,
                            modifier = Modifier.weight(1f),
                            shape = MaterialTheme.shapes.medium,
                        ) { Text("Send to builder") }
                        Button(
                            onClick = {
                                if (!state.signedIn) onRequireSignIn() else viewModel.analyzeRefine()
                            },
                            modifier = Modifier.weight(1f),
                            enabled = state.refineText.isNotBlank() && !state.refineBusy,
                            shape = MaterialTheme.shapes.medium,
                        ) {
                            if (state.refineBusy) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary,
                                )
                                Spacer(Modifier.width(8.dp))
                            } else {
                                Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(17.dp))
                                Spacer(Modifier.width(7.dp))
                            }
                            Text(if (state.refineUsedAi) "Review again" else "AI review")
                        }
                    }
                }
            }
        }
    }

    if (showRecipes) {
        RecipePickerSheet(
            onDismiss = { showRecipes = false },
            onPick = { recipe: PromptRecipe ->
                showRecipes = false
                viewModel.applyRecipe(recipe)
            },
        )
    }

    if (showPreview) {
        StudioPreviewSheet(
            state = state,
            report = report,
            onDismiss = { showPreview = false },
            onTitleChange = viewModel::setTitle,
            onDescriptionChange = viewModel::setDescription,
            onPublicChange = viewModel::setPublic,
            onKindChange = viewModel::setSaveKind,
            onSave = viewModel::saveToLibrary,
            onRequireSignIn = {
                showPreview = false
                onRequireSignIn()
            },
        )
    }
}

@Composable
private fun QuotaChip(state: StudioUiState, onClick: () -> Unit) {
    val platform = state.ai?.platform
    val remaining = platform?.remainingToday
    val text = when {
        !state.signedIn -> "Local mode"
        platform == null -> "Checking AI…"
        platform.available && remaining != null -> "Free AI · $remaining left today"
        platform.available -> "Free AI · unlimited"
        state.ai?.activeByok?.isNotEmpty() == true -> "Your AI key"
        else -> "Connect AI"
    }
    Box(modifier = Modifier.clickable(onClick = onClick)) {
        BadgeChip(
            text = text,
            icon = Icons.Rounded.Sparkles,
            containerColor = if (state.signedIn) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            },
            contentColor = if (state.signedIn) {
                MaterialTheme.colorScheme.onPrimaryContainer
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            },
        )
    }
}

@Composable
private fun ModeTabs(selected: StudioTab, onSelect: (StudioTab) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.medium)
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        StudioTab.entries.forEach { tab ->
            val isSelected = tab == selected
            val icon = when (tab) {
                StudioTab.STRUCTURED -> Icons.Rounded.EditNote
                StudioTab.COACH -> Icons.Rounded.Forum
                StudioTab.REFINE -> Icons.Rounded.AutoAwesome
            }
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(MaterialTheme.shapes.small)
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.surface else androidx.compose.ui.graphics.Color.Transparent,
                    )
                    .clickable { onSelect(tab) }
                    .padding(vertical = 9.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = tab.label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (isSelected) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StudioPreviewSheet(
    state: StudioUiState,
    report: com.promptgineer.app.domain.ClearReport,
    onDismiss: () -> Unit,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onPublicChange: (Boolean) -> Unit,
    onKindChange: (ItemKind) -> Unit,
    onSave: () -> Unit,
    onRequireSignIn: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp)
                .imePadding(),
        ) {
            Text("Preview & save", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(4.dp))
            Text(
                text = "This is exactly what gets copied into your AI tool.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                ScoreRing(score = report.overallScore, size = 64.dp, strokeWidth = 6.dp)
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(report.verdict, style = MaterialTheme.typography.titleSmall)
                    Text(
                        text = "${report.wordCount} words · ${report.characterCount} characters",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = "${state.completedEssentials} of ${state.essentialsTotal} essentials covered",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.height(14.dp))
            PromptCodeBlock(
                text = state.composed,
                maxHeight = 230.dp,
                emptyText = "Add a section or two, then your prompt appears here.",
            )
            Spacer(Modifier.height(10.dp))
            PromptActionBar(
                copyEnabled = state.composed.isNotBlank(),
                onCopy = {
                    if (IntentUtils.copyToClipboard(context, state.composed, "Prompt")) {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        Toast.makeText(context, "Prompt copied", Toast.LENGTH_SHORT).show()
                    }
                },
                onShare = { IntentUtils.shareText(context, state.composed, state.title.ifBlank { "Prompt" }) },
                onSendToAi = { IntentUtils.sendToAssistant(context, state.composed) },
            )
            Spacer(Modifier.height(16.dp))

            if (state.signedIn) {
                Text("Save to your library", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PillButton(
                        text = "Prompt",
                        selected = state.saveKind == ItemKind.PROMPT,
                        onClick = { onKindChange(ItemKind.PROMPT) },
                    )
                    PillButton(
                        text = "Template",
                        selected = state.saveKind == ItemKind.TEMPLATE,
                        onClick = { onKindChange(ItemKind.TEMPLATE) },
                    )
                }
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.title,
                    onValueChange = onTitleChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(if (state.saveKind == ItemKind.PROMPT) "Prompt name" else "Template name") },
                    placeholder = { Text("e.g. Accessible onboarding brief") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.small,
                    isError = state.saveError != null && state.title.trim().length < 3,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.description,
                    onValueChange = onDescriptionChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Description (optional)") },
                    placeholder = {
                        Text(
                            if (state.saveKind == ItemKind.PROMPT) {
                                "One sentence on what this prompt helps with"
                            } else {
                                "When should someone reach for this template?"
                            },
                        )
                    },
                    minLines = 2,
                    maxLines = 3,
                    shape = MaterialTheme.shapes.small,
                )
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Share with the community", style = MaterialTheme.typography.labelLarge)
                        Text(
                            text = if (state.isPublic) {
                                "Anyone can view, like and comment on it."
                            } else {
                                "Only you can see it. You can share later."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(checked = state.isPublic, onCheckedChange = onPublicChange)
                }
                if (state.saveError != null) {
                    Spacer(Modifier.height(8.dp))
                    InlineBanner(text = state.saveError, tone = BannerTone.ERROR)
                }
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = onSave,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = state.canSave && !state.saving,
                    shape = MaterialTheme.shapes.medium,
                ) {
                    if (state.saving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                        Spacer(Modifier.width(8.dp))
                    } else {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                    }
                    Text(if (state.saving) "Saving…" else "Save to library")
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "Saving earns 10 points. Your draft also stays on this device.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                InlineBanner(
                    text = "You're working in local mode. Create a free account to use AI, save to the cloud and share with the community.",
                    tone = BannerTone.INFO,
                )
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = onRequireSignIn,
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                ) { Text("Sign in or create an account") }
            }

            if (report.criteria.any { it.status != ClearStatus.GOOD }) {
                Spacer(Modifier.height(18.dp))
                Text("Quick CLEAR check", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                ClearCriteriaList(criteria = report.criteria)
            }
        }
    }
}
