package com.promptgineer.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.promptgineer.app.domain.PromptComposer
import com.promptgineer.app.ui.theme.LocalExtraColors
import com.promptgineer.app.ui.theme.PromptMonoStyle

/**
 * The dark "prompt editor" surface. Monospace, selectable, and always showing
 * the word count — this is the artefact people came for, so it gets its own
 * visual language instead of sitting in a form field.
 */
@Composable
fun PromptCodeBlock(
    text: String,
    modifier: Modifier = Modifier,
    maxHeight: Dp = 420.dp,
    emptyText: String = "Your prompt will take shape here.",
    fileName: String = "PROMPT.TXT",
) {
    val extras = LocalExtraColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.medium)
            .background(extras.codeSurface)
            .border(1.dp, extras.codeBorder, MaterialTheme.shapes.medium),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(extras.codeSurface.copy(alpha = 0.6f))
                .padding(horizontal = 14.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                listOf(0xFFFF817D, 0xFFF1C46D, 0xFF75CF9D).forEach { color ->
                    Box(Modifier.size(7.dp).background(androidx.compose.ui.graphics.Color(color), CircleShape))
                }
            }
            Spacer(Modifier.width(12.dp))
            Text(
                text = fileName,
                style = MaterialTheme.typography.labelSmall,
                color = extras.codeMuted,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = "${PromptComposer.wordCount(text)} words",
                style = MaterialTheme.typography.labelSmall,
                color = extras.codeMuted,
            )
        }
        if (text.isBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 160.dp)
                    .padding(18.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = emptyText,
                    style = MaterialTheme.typography.bodySmall,
                    color = extras.codeMuted,
                )
            }
        } else {
            SelectionContainer {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = maxHeight)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                ) {
                    Text(
                        text = text,
                        style = PromptMonoStyle,
                        color = extras.codeText,
                    )
                }
            }
        }
    }
}

@Composable
fun PromptActionBar(
    onCopy: (() -> Unit)?,
    onShare: (() -> Unit)? = null,
    onSendToAi: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    copyEnabled: Boolean = true,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onCopy != null) {
            androidx.compose.material3.FilledTonalButton(
                onClick = onCopy,
                enabled = copyEnabled,
                modifier = Modifier.weight(1f),
            ) {
                Icon(Icons.Rounded.ContentCopy, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(7.dp))
                Text("Copy")
            }
        }
        if (onShare != null) {
            IconButton(
                onClick = onShare,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Icon(Icons.Rounded.Share, contentDescription = "Share prompt")
            }
        }
        if (onSendToAi != null) {
            IconButton(
                onClick = onSendToAi,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Icon(Icons.Rounded.OpenInNew, contentDescription = "Send to an AI app")
            }
        }
    }
}

@Composable
fun PromptLineItem(
    label: String,
    content: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.size(5.dp))
        Text(
            text = content,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
fun TruncatedText(
    text: String,
    maxLines: Int,
    modifier: Modifier = Modifier,
) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        maxLines = maxLines,
        overflow = TextOverflow.Ellipsis,
        modifier = modifier,
    )
}
