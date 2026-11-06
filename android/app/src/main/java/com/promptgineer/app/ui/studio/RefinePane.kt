package com.promptgineer.app.ui.studio

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.ContentPaste
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.promptgineer.app.domain.ClearAnalyzer
import com.promptgineer.app.domain.FixSuggestion
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.ClearCriteriaList
import com.promptgineer.app.ui.components.ClearLegend
import com.promptgineer.app.ui.components.FixSuggestionRow
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.MarkdownLite
import com.promptgineer.app.ui.components.PromptActionBar
import com.promptgineer.app.ui.components.PromptCodeBlock
import com.promptgineer.app.ui.components.ScoreBadge
import com.promptgineer.app.ui.components.ScoreRing
import com.promptgineer.app.util.IntentUtils

@Composable
fun RefinePane(
    state: StudioUiState,
    onTextChange: (String) -> Unit,
    onAnalyze: () -> Unit,
    onApplyFix: (FixSuggestion) -> Unit,
    onUseImproved: () -> Unit,
    onClear: () -> Unit,
    onRequireSignIn: () -> Unit,
    onOpenAiServices: () -> Unit,
) {
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    val report = remember(state.refineText) { ClearAnalyzer.analyze(state.refineText) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 2.dp, bottom = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item(key = "input") {
            AppCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Paste a prompt",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "The local CLEAR review updates as you type — no account needed.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    TextButton(onClick = {
                        val pasted = clipboard.getText()?.text
                        if (pasted.isNullOrBlank()) {
                            Toast.makeText(context, "Clipboard is empty", Toast.LENGTH_SHORT).show()
                        } else {
                            onTextChange(pasted)
                        }
                    }) {
                        Icon(Icons.Rounded.ContentPaste, contentDescription = null, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(5.dp))
                        Text("Paste")
                    }
                }
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = state.refineText,
                    onValueChange = onTextChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "Paste the prompt you want to improve. Include the role, task, format and any limits you gave it…",
                        )
                    },
                    minLines = 7,
                    maxLines = 16,
                    shape = RoundedCornerShape(13.dp),
                    textStyle = MaterialTheme.typography.bodyMedium,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "${state.refineText.length} characters",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = onClear, enabled = state.refineText.isNotEmpty()) {
                        Text("Clear")
                    }
                }
            }
        }

        if (state.refineText.isBlank()) {
            item(key = "empty") {
                AppCard {
                    Text(
                        text = "What the review looks for",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Five dimensions, scored on-device. Expand any row for the specific fix.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    ClearLegend()
                }
            }
        } else {
            item(key = "report") {
                AppCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "On-device review",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = report.verdict,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        ScoreBadge(score = report.overallScore)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ScoreRing(score = report.overallScore, size = 68.dp, strokeWidth = 6.dp)
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${report.wordCount} words · ${report.characterCount} characters",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                text = "Scored instantly, offline, and never sent anywhere.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    ClearCriteriaList(criteria = report.criteria)
                }
            }

            if (report.fixes.isNotEmpty()) {
                item(key = "fixes") {
                    Column {
                        Text(
                            text = "Fixes you can apply now",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(Modifier.height(6.dp))
                        report.fixes.forEach { fix ->
                            FixSuggestionRow(
                                fix = fix,
                                onApply = { onApplyFix(fix) },
                                modifier = Modifier.padding(bottom = 7.dp),
                            )
                        }
                    }
                }
            }

            item(key = "ai") {
                when {
                    !state.signedIn -> InlineBanner(
                        text = "The local review is complete. Sign in to have the AI rewrite the prompt with examples, tone and structure tailored to your context.",
                        tone = BannerTone.INFO,
                        actionLabel = "Sign in",
                        onAction = onRequireSignIn,
                    )
                    state.ai?.canGenerate == false -> InlineBanner(
                        text = "Connect an AI service to run the deep review. The local review above still applies.",
                        tone = BannerTone.WARNING,
                        actionLabel = "Connect",
                        onAction = onOpenAiServices,
                    )
                    state.refineBusy -> AppCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                            )
                            Spacer(Modifier.width(10.dp))
                            Text(
                                text = "Reading your prompt against CLEAR…",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.outlineVariant,
                        )
                    }
                    state.refineError != null -> Column {
                        InlineBanner(text = state.refineError, tone = BannerTone.ERROR)
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = onAnalyze, shape = MaterialTheme.shapes.medium) {
                            Text("Try the AI review again")
                        }
                    }
                    state.refineUsedAi -> AppCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.AutoAwesome,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = "AI review",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f),
                            )
                            BadgeChip(text = "CLEAR")
                        }
                        if (state.refineAnalysis.isNotBlank()) {
                            Spacer(Modifier.height(8.dp))
                            MarkdownLite(state.refineAnalysis)
                        }
                        if (state.refineImproved.isNotBlank()) {
                            Spacer(Modifier.height(14.dp))
                            Text(
                                text = "Improved prompt",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Spacer(Modifier.height(6.dp))
                            PromptCodeBlock(text = state.refineImproved, maxHeight = 280.dp)
                            Spacer(Modifier.height(8.dp))
                            PromptActionBar(
                                copyEnabled = true,
                                onCopy = {
                                    if (IntentUtils.copyToClipboard(context, state.refineImproved, "Improved prompt")) {
                                        Toast.makeText(context, "Improved prompt copied", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                onShare = {
                                    IntentUtils.shareText(context, state.refineImproved, "Improved prompt")
                                },
                                onSendToAi = { IntentUtils.sendToAssistant(context, state.refineImproved) },
                            )
                            Spacer(Modifier.height(8.dp))
                            Button(
                                onClick = onUseImproved,
                                modifier = Modifier.fillMaxWidth(),
                                shape = MaterialTheme.shapes.medium,
                            ) { Text("Open improved prompt in the builder") }
                        }
                    }
                    else -> AppCard {
                        Text(
                            text = "Deep review with AI",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            text = "The AI reads for tone, missing examples and ambiguity, then rewrites the prompt. Uses one generation from today's free quota.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = onAnalyze, shape = MaterialTheme.shapes.medium) {
                            Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(7.dp))
                            Text("Run AI review")
                        }
                    }
                }
            }

            item(key = "refine_tip") {
                Text(
                    text = "Tip: apply a fix, then run the AI review again. The on-device score should climb — that is the fastest way to learn what moves a model.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
