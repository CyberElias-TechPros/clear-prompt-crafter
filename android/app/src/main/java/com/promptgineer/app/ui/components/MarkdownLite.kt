package com.promptgineer.app.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * Minimal Markdown rendering for AI output and legal copy: headings, bullets,
 * and bold-free paragraphs. Deliberately not a full parser — model output here
 * uses only these structures, and a full Markdown engine is a large dependency.
 */
@Composable
fun MarkdownLite(
    text: String,
    modifier: Modifier = Modifier,
) {
    val lines = remember(text) { text.lines() }
    SelectionContainer {
        Column(modifier = modifier.fillMaxWidth()) {
            lines.forEach { rawLine ->
                val line = rawLine.trimEnd()
                when {
                    line.startsWith("# ") -> Heading(line.removePrefix("# "), level = 1)
                    line.startsWith("## ") -> Heading(line.removePrefix("## "), level = 2)
                    line.startsWith("### ") -> Heading(line.removePrefix("### "), level = 3)
                    line.startsWith("- ") || line.startsWith("* ") -> Bullet(line.drop(2))
                    line.isBlank() -> Spacer(Modifier.height(8.dp))
                    else -> {
                        Text(
                            text = line
                                .replace("**", "")
                                .replace("__", ""),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 4.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun Heading(text: String, level: Int) {
    val style = when (level) {
        1 -> MaterialTheme.typography.titleLarge
        2 -> MaterialTheme.typography.titleMedium
        else -> MaterialTheme.typography.titleSmall
    }
    Text(
        text = text.replace("**", ""),
        style = style,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.onSurface,
        modifier = Modifier.padding(top = 12.dp, bottom = 4.dp),
    )
}

@Composable
private fun Bullet(text: String) {
    Row(
        modifier = Modifier.padding(vertical = 2.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            text = "•",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.width(14.dp),
        )
        Text(
            text = text.replace("**", ""),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
