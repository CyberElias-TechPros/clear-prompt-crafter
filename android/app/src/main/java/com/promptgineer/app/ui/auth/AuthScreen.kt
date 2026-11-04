package com.promptgineer.app.ui.auth

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.PenTool
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.core.Validate
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.BannerTone
import com.promptgineer.app.ui.components.ConfirmDialog
import com.promptgineer.app.ui.components.InlineBanner

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onContinueWithoutAccount: () -> Unit,
    onBrowseCommunity: () -> Unit,
    onOpenLegal: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    var showSupportDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(horizontal = 24.dp)
            .padding(top = 36.dp, bottom = 28.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.onBackground),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.PenTool,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.background,
                    modifier = Modifier.size(20.dp),
                )
            }
            Spacer(Modifier.width(11.dp))
            Text(
                text = "Prompt-Gineer",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
        }

        Spacer(Modifier.height(28.dp))
        Text(
            text = "Make every prompt land.",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = "Build a clear brief section by section, get a five-part review against CLEAR, and keep everything you write.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(24.dp))
        AppCard(contentPadding = androidx.compose.foundation.layout.PaddingValues(18.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(MaterialTheme.shapes.small)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                AuthMode.entries.forEach { mode ->
                    val selected = state.mode == mode
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(MaterialTheme.shapes.small)
                            .background(
                                if (selected) MaterialTheme.colorScheme.surface else androidx.compose.ui.graphics.Color.Transparent,
                            )
                            .clickable { viewModel.setMode(mode) }
                            .padding(vertical = 9.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = if (mode == AuthMode.SIGN_IN) "Sign in" else "Create account",
                            style = MaterialTheme.typography.labelLarge,
                            color = if (selected) {
                                MaterialTheme.colorScheme.onSurface
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            if (state.formError != null) {
                InlineBanner(text = state.formError, tone = BannerTone.ERROR)
                Spacer(Modifier.height(12.dp))
            }

            if (state.mode == AuthMode.SIGN_UP) {
                OutlinedTextField(
                    value = state.fullName,
                    onValueChange = viewModel::setFullName,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Your name") },
                    placeholder = { Text("How should we address you?") },
                    singleLine = true,
                    isError = state.nameError != null,
                    supportingText = state.nameError?.let { { Text(it) } },
                    shape = RoundedCornerShape(13.dp),
                    keyboardOptions = KeyboardOptions(
                        capitalization = androidx.compose.ui.text.input.KeyboardCapitalization.Words,
                        imeAction = ImeAction.Next,
                    ),
                )
                Spacer(Modifier.height(10.dp))
            }

            OutlinedTextField(
                value = state.email,
                onValueChange = viewModel::setEmail,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                placeholder = { Text("you@example.com") },
                singleLine = true,
                isError = state.emailError != null,
                supportingText = state.emailError?.let { { Text(it) } },
                shape = RoundedCornerShape(13.dp),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                ),
            )
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = state.password,
                onValueChange = viewModel::setPassword,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Password") },
                singleLine = true,
                isError = state.passwordError != null,
                supportingText = {
                    Text(
                        state.passwordError
                            ?: "At least ${Validate.MIN_PASSWORD_LENGTH} characters.",
                    )
                },
                shape = RoundedCornerShape(13.dp),
                visualTransformation = if (state.passwordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    IconButton(onClick = viewModel::togglePasswordVisibility) {
                        Icon(
                            imageVector = if (state.passwordVisible) {
                                Icons.Rounded.VisibilityOff
                            } else {
                                Icons.Rounded.Visibility
                            },
                            contentDescription = if (state.passwordVisible) "Hide password" else "Show password",
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        focusManager.clearFocus()
                        viewModel.submit()
                    },
                ),
            )

            if (state.mode == AuthMode.SIGN_IN) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    TextButton(onClick = { showSupportDialog = true }) {
                        Text("Forgot password?")
                    }
                }
            } else {
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "By creating an account you agree to the Terms and Privacy Policy.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(Modifier.height(10.dp))
            Button(
                onClick = {
                    focusManager.clearFocus()
                    viewModel.submit()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = state.canSubmit,
                shape = MaterialTheme.shapes.medium,
            ) {
                if (state.submitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(Modifier.width(10.dp))
                } else {
                    Icon(Icons.Rounded.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    text = when {
                        state.submitting -> "One moment…"
                        state.mode == AuthMode.SIGN_IN -> "Sign in"
                        else -> "Create my account"
                    },
                )
            }
        }

        Spacer(Modifier.height(18.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.weight(1f)) {
                androidx.compose.material3.OutlinedButton(
                    onClick = onContinueWithoutAccount,
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                ) {
                    Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Local mode", maxLines = 1)
                }
            }
            Box(Modifier.weight(1f)) {
                androidx.compose.material3.OutlinedButton(
                    onClick = onBrowseCommunity,
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                ) { Text("Community", maxLines = 1) }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Local mode lets you build, score and copy prompts without an account. Your drafts stay on this device.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(22.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Terms",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .clickable { onOpenLegal("terms") }
                    .padding(8.dp),
            )
            Text(
                text = "Privacy",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .clickable { onOpenLegal("privacy") }
                    .padding(8.dp),
            )
            Text(
                text = "How it works",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .clickable { onOpenLegal("about") }
                    .padding(8.dp),
            )
            Text(
                text = "Support",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .clickable { showSupportDialog = true }
                    .padding(8.dp),
            )
        }

        Spacer(Modifier.height(6.dp))
        Surface(
            color = MaterialTheme.colorScheme.surfaceVariant,
            shape = CircleShape,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Rounded.AutoAwesome,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(13.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = "No trackers · Your prompts stay yours",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }

    if (showSupportDialog) {
        ConfirmDialog(
            title = "Password resets",
            message = "This deployment doesn't send reset emails yet. Contact support from the address you signed up with and the team can help you regain access.",
            confirmLabel = "Go to support",
            onConfirm = {
                showSupportDialog = false
                onOpenLegal("contact")
            },
            onDismiss = { showSupportDialog = false },
        )
    }
}
