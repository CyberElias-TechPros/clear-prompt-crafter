package com.promptgineer.app.ui.info

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.BuildConfig
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.InlineBanner
import com.promptgineer.app.ui.components.PillButton
import com.promptgineer.app.ui.theme.LocalExtraColors
import com.promptgineer.app.util.IntentUtils

private val subjectSuggestions = listOf("Bug report", "Feature idea", "Account help", "Feedback")

@Composable
fun ContactScreen(
    viewModel: ContactViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val extras = LocalExtraColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding(),
    ) {
        BackHeader(title = "Contact", onBack = onBack)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
        ) {
            if (state.sent) {
                AppCard {
                    Icon(
                        Icons.Rounded.CheckCircle,
                        contentDescription = null,
                        tint = extras.success,
                        modifier = Modifier.size(30.dp),
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = "Message received",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "We read every message and usually reply within two working days. If your issue is urgent, email ${BuildConfig.SUPPORT_EMAIL} directly.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = onBack, shape = MaterialTheme.shapes.medium) {
                            Text("Back to app")
                        }
                        TextButton(onClick = viewModel::startAnother) { Text("Send another") }
                    }
                }
                return@Column
            }

            Text(
                text = "Tell us what's not working",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(5.dp))
            Text(
                text = "Bugs, confusing copy, missing sections, account problems — all fair game. The more specific, the faster we can fix it.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(16.dp))
            if (state.formError != null) {
                InlineBanner(text = state.formError!!, tone = BannerTone.ERROR)
                Spacer(Modifier.height(10.dp))
            }

            OutlinedTextField(
                value = state.name,
                onValueChange = viewModel::setName,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Your name") },
                singleLine = true,
                isError = state.nameError != null,
                supportingText = state.nameError?.let { { Text(it) } },
                shape = RoundedCornerShape(13.dp),
            )
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = state.email,
                onValueChange = viewModel::setEmail,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                singleLine = true,
                isError = state.emailError != null,
                supportingText = state.emailError?.let { { Text(it) } },
                shape = RoundedCornerShape(13.dp),
            )
            Spacer(Modifier.height(14.dp))
            Text(
                text = "What's this about?",
                style = MaterialTheme.typography.labelLarge,
            )
            Spacer(Modifier.height(7.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                subjectSuggestions.take(2).forEach { suggestion ->
                    PillButton(
                        text = suggestion,
                        selected = state.subject == suggestion,
                        onClick = { viewModel.setSubject(suggestion) },
                    )
                }
            }
            Spacer(Modifier.height(7.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                subjectSuggestions.drop(2).forEach { suggestion ->
                    PillButton(
                        text = suggestion,
                        selected = state.subject == suggestion,
                        onClick = { viewModel.setSubject(suggestion) },
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = state.subject,
                onValueChange = viewModel::setSubject,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Subject") },
                singleLine = true,
                isError = state.subjectError != null,
                supportingText = state.subjectError?.let { { Text(it) } },
                shape = RoundedCornerShape(13.dp),
            )
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = state.message,
                onValueChange = viewModel::setMessage,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Message") },
                placeholder = { Text("What happened, what you expected, and what you were doing.") },
                minLines = 6,
                maxLines = 12,
                isError = state.messageError != null,
                supportingText = {
                    Text(state.messageError ?: "${state.message.length}/5000")
                },
                shape = RoundedCornerShape(13.dp),
            )
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = viewModel::submit,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = state.canSubmit,
                shape = MaterialTheme.shapes.medium,
            ) {
                if (state.submitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(17.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                } else {
                    Icon(Icons.Rounded.Send, contentDescription = null, modifier = Modifier.size(17.dp))
                }
                Spacer(Modifier.width(8.dp))
                Text(if (state.submitting) "Sending…" else "Send message")
            }

            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Rounded.Mail,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(15.dp),
                )
                Spacer(Modifier.width(6.dp))
                TextButton(
                    onClick = {
                        IntentUtils.composeEmail(
                            context,
                            BuildConfig.SUPPORT_EMAIL,
                            state.subject.ifBlank { "Prompt-Gineer support" },
                        )
                    },
                ) {
                    Text(BuildConfig.SUPPORT_EMAIL, style = MaterialTheme.typography.labelMedium)
                }
            }
            Text(
                text = "Your email is only used to reply to this message.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
