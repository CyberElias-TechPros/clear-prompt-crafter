package com.promptgineer.app.ui.info

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.promptgineer.app.BuildConfig
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.MarkdownLite

private val documentTitles = mapOf(
    "terms" to "Terms of Service",
    "privacy" to "Privacy Policy",
    "about" to "How it works",
)

@Composable
fun LegalScreen(
    document: String,
    onBack: () -> Unit,
    onContact: () -> Unit,
) {
    val context = LocalContext.current
    val title = documentTitles[document] ?: "Document"
    val content = remember(document) {
        runCatching {
            context.assets.open("legal/$document.md")
                .bufferedReader()
                .use { reader -> reader.readText() }
        }.getOrNull()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        BackHeader(title = title, onBack = onBack)

        if (content.isNullOrBlank()) {
            EmptyState(
                icon = Icons.Rounded.Description,
                title = "This document couldn't be opened",
                message = "The bundled copy is missing. Contact the team and we will send it to you.",
                actionLabel = "Contact support",
                onAction = onContact,
                modifier = Modifier.padding(24.dp),
            )
            return@Column
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp)
                .padding(bottom = 28.dp),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                MarkdownLite(text = content, modifier = Modifier.fillMaxWidth())
                Text(
                    text = "Prompt-Gineer ${BuildConfig.VERSION_NAME} · ${BuildConfig.SUPPORT_EMAIL}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }
        }
    }
}
