package com.promptgineer.app.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PenTool
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Sparkles
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

private data class OnboardingPage(
    val icon: ImageVector,
    val kicker: String,
    val title: String,
    val body: String,
    val points: List<String>,
)

private val pages = listOf(
    OnboardingPage(
        icon = Icons.Rounded.PenTool,
        kicker = "Step 1 · Build",
        title = "From fuzzy idea to a prompt that works",
        body = "Fill in context, task, guidelines and constraints. The preview assembles itself as you type, so you always see exactly what you'll paste.",
        points = listOf(
            "Four essentials, four optional extras",
            "Live word count and copy-ready preview",
            "Fifteen worked recipes to start from",
        ),
    ),
    OnboardingPage(
        icon = Icons.Rounded.AutoAwesome,
        kicker = "Step 2 · Refine",
        title = "Five ways to make any prompt better",
        body = "CLEAR — Concise, Logical, Explicit, Adaptive, Reflective. The review runs on your device, instantly, with specific fixes you can apply in one tap.",
        points = listOf(
            "Scored offline, even without an account",
            "Coaching conversation when AI is available",
            "Deep AI rewrite that stays under your control",
        ),
    ),
    OnboardingPage(
        icon = Icons.Rounded.Shield,
        kicker = "Step 3 · Keep control",
        title = "Your drafts, your keys, your call",
        body = "Drafts save on this device first. Provider keys are encrypted on the server and never returned to the app. No ads, no third-party analytics SDKs.",
        points = listOf(
            "Free AI tier or bring your own key",
            "Private by default, share only when you choose",
            "Export or delete your account at any time",
        ),
    ),
)

@Composable
fun OnboardingScreen(
    onFinish: () -> Unit,
    onOpenLegal: (String) -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .navigationBarsPadding(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Prompt-Gineer",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
            TextButton(onClick = onFinish) { Text("Skip") }
        }

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.weight(1f),
        ) { index ->
            val page = pages[index]
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 28.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(78.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(MaterialTheme.colorScheme.primary),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = page.icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(34.dp),
                    )
                }
                Spacer(Modifier.height(22.dp))
                Text(
                    text = page.kicker.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.4.sp,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = page.title,
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = page.body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(22.dp))
                page.points.forEach { point ->
                    Row(
                        modifier = Modifier.padding(vertical = 4.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Sparkles,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp),
                        )
                        Spacer(Modifier.width(9.dp))
                        Text(
                            text = point,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            pages.indices.forEach { index ->
                val selected = index == pagerState.currentPage
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .size(width = if (selected) 22.dp else 7.dp, height = 7.dp)
                        .clip(CircleShape)
                        .background(
                            if (selected) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.outlineVariant,
                        ),
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(top = 8.dp, bottom = 16.dp),
        ) {
            Button(
                onClick = {
                    if (pagerState.currentPage == pages.lastIndex) {
                        onFinish()
                    } else {
                        scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = MaterialTheme.shapes.medium,
            ) {
                Icon(
                    imageVector = if (pagerState.currentPage == pages.lastIndex) {
                        Icons.Rounded.Lock
                    } else {
                        Icons.Rounded.ArrowForward
                    },
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    if (pagerState.currentPage == pages.lastIndex) "Get started" else "Continue",
                )
            }
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                TextButton(onClick = { onOpenLegal("terms") }) {
                    Text("Terms", style = MaterialTheme.typography.labelSmall)
                }
                TextButton(onClick = { onOpenLegal("privacy") }) {
                    Text("Privacy", style = MaterialTheme.typography.labelSmall)
                }
            }
            Text(
                text = "Building and reviewing prompts works without an account.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
