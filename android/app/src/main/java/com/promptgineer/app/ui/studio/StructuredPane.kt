package com.promptgineer.app.ui.studio

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardCapitalization
import com.promptgineer.app.domain.ClearReport
import com.promptgineer.app.domain.PromptSections
import com.promptgineer.app.domain.SectionSpec
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.OptionalSectionChips
import com.promptgineer.app.ui.components.ScoreBadge
import com.promptgineer.app.ui.components.ScoreRing
import com.promptgineer.app.ui.components.SectionEditorCard
import com.promptgineer.app.ui.theme.PromptMonoStyle

@Composable
fun StructuredPane(
    state: StudioUiState,
    report: ClearReport,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onSectionChange: (String, String) -> Unit,
    onAddOptional: (String) -> Unit,
    onRemoveSection: (String) -> Unit,
    onOpenRecipes: () -> Unit,
    onClear: () -> Unit,
    onRequireSignIn: () -> Unit,
    onOpenAiServices: () -> Unit,
) {
    var showClearConfirm by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 2.dp, bottom = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item(key = "readiness") {
            ReadinessCard(report = report, state = state, onOpenRecipes = onOpenRecipes)
        }

        if (!state.signedIn) {
            item(key = "guest_banner") {
                InlineBanner(
                    text = "Local mode: everything here works offline and stays on your device. Sign in to use AI and publish.",
                    tone = BannerTone.INFO,
                    actionLabel = "Sign in",
                    onAction = onRequireSignIn,
                )
            }
        } else if (state.ai?.canGenerate == false) {
            item(key = "ai_banner") {
                InlineBanner(
                    text = "No AI service connected. Building, scoring and copying still work; the coach and AI review need a service.",
                    tone = BannerTone.WARNING,
                    actionLabel = "Connect",
                    onAction = onOpenAiServices,
                )
            }
        }

        item(key = "details") {
            DetailsCard(
                title = state.title,
                description = state.description,
                onTitleChange = onTitleChange,
                onDescriptionChange = onDescriptionChange,
            )
        }

        item(key = "essentials_header") {
            Column {
                Text(
                    text = "The four essentials",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "Fill in what you know. Unfilled sections are simply left out of the prompt.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        items(PromptSections.requiredSections, key = { it.type }) { spec ->
            SectionEditorCard(
                spec = spec,
                value = state.sections[spec.type].orEmpty(),
                onValueChange = { onSectionChange(spec.type, it) },
                index = PromptSections.requiredSections.indexOf(spec) + 1,
                modifier = Modifier.animateItem(),
            )
        }

        val unusedOptional = PromptSections.optionalSections.filter { !state.sections.containsKey(it.type) }
        if (unusedOptional.isNotEmpty()) {
            item(key = "optional_chips") {
                AppCard {
                    OptionalSectionChips(specs = unusedOptional, onAdd = onAddOptional)
                }
            }
        }

        val addedOptional = state.optionalAdded.mapNotNull { type ->
            PromptSections.optionalSections.firstOrNull { it.type == type }
        }
        items(addedOptional, key = { "opt_${it.type}" }) { spec ->
            SectionEditorCard(
                spec = spec,
                value = state.sections[spec.type].orEmpty(),
                onValueChange = { onSectionChange(spec.type, it) },
                onRemove = { onRemoveSection(spec.type) },
                modifier = Modifier.animateItem(),
            )
        }

        item(key = "footer") {
            Column(modifier = Modifier.padding(top = 6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.width(16.dp),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (state.signedIn) {
                            "Drafts save automatically on this device."
                        } else {
                            "Drafts are private to this device until you sign in."
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = { showClearConfirm = true }) { Text("Start over") }
                }
                if (state.sections.values.any { it.isNotBlank() }) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Rough notes are fine — the preview does not grade your honesty, it grades the brief.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                    )
                }
            }
        }
    }

    if (showClearConfirm) {
        ConfirmDialog(
            title = "Start over?",
            message = "This clears the working draft on this device. Anything already saved to your library stays put.",
            confirmLabel = "Clear draft",
            destructive = true,
            onConfirm = {
                showClearConfirm = false
                onClear()
            },
            onDismiss = { showClearConfirm = false },
        )
    }
}

@Composable
private fun ReadinessCard(
    report: ClearReport,
    state: StudioUiState,
    onOpenRecipes: () -> Unit,
) {
    val fraction = state.completedEssentials.toFloat() / state.essentialsTotal.toFloat()
    val weakest = report.criteria.minByOrNull { it.score }
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ScoreRing(score = report.overallScore, caption = "CLEAR")
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = report.verdict,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.width(8.dp))
                    ScoreBadge(score = report.overallScore)
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "${state.completedEssentials} of ${state.essentialsTotal} essentials · ${report.wordCount} words",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { fraction },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.outlineVariant,
                    strokeCap = StrokeCap.Round,
                )
            }
        }
        if (report.overallScore in 1..69 && weakest != null) {
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    imageVector = Icons.Rounded.AutoAwesome,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.width(16.dp),
                )
                Spacer(Modifier.width(7.dp))
                Text(
                    text = "Biggest lift: ${weakest.name}. ${weakest.tips.firstOrNull().orEmpty()}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Button(
                onClick = onOpenRecipes,
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.weight(1f),
            ) {
                Icon(Icons.Rounded.BookmarkBorder, contentDescription = null, modifier = Modifier.width(16.dp))
                Spacer(Modifier.width(7.dp))
                Text("Start from a recipe")
            }
            Spacer(Modifier.width(8.dp))
            Text(
                text = if (report.overallScore >= 70) "Ready to copy" else "Keep shaping",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun DetailsCard(
    title: String,
    description: String,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
) {
    AppCard {
        Text("Name & notes", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(2.dp))
        Text(
            text = "Only needed when you save to your library.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = title,
            onValueChange = onTitleChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Prompt name") },
            placeholder = { Text("e.g. Accessible onboarding brief") },
            singleLine = true,
            shape = RoundedCornerShape(13.dp),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Sentences,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = description,
            onValueChange = onDescriptionChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Description (optional)") },
            placeholder = { Text("One sentence on what this prompt helps with") },
            minLines = 2,
            maxLines = 3,
            shape = RoundedCornerShape(13.dp),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Sentences,
                imeAction = ImeAction.Default,
            ),
        )
        if (title.isNotBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(
                text = title,
                style = PromptMonoStyle,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
