package com.promptgineer.app.ui.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.MilitaryTech
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.promptgineer.app.domain.LeaderboardEntry
import com.promptgineer.app.ui.components.AppCard
import com.promptgineer.app.ui.components.Avatar
import com.promptgineer.app.ui.components.BackHeader
import com.promptgineer.app.ui.components.BadgeChip
import com.promptgineer.app.ui.components.EmptyState
import com.promptgineer.app.ui.components.ErrorState
import com.promptgineer.app.ui.components.LoadingBlock
import com.promptgineer.app.ui.theme.LocalExtraColors

@Composable
fun LeaderboardScreen(
    viewModel: LeaderboardViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        BackHeader(
            title = "Leaderboard",
            onBack = onBack,
            actions = {
                IconButton(onClick = viewModel::load) {
                    Icon(Icons.Rounded.Refresh, contentDescription = "Refresh leaderboard")
                }
            },
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item(key = "intro") {
                Column {
                    Text(
                        text = "Points come from contributing, not consuming.",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Everything here was earned by publishing prompts, receiving likes and helping in comments.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    AppCard(contentPadding = PaddingValues(14.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            PointRule("+10", "publish a prompt")
                            PointRule("+2", "receive a like")
                            PointRule("+2", "write a comment")
                        }
                    }
                }
            }

            when {
                state.loading && state.entries.isEmpty() -> item(key = "loading") {
                    LoadingBlock("Counting the scoreboard…")
                }

                state.error != null && state.entries.isEmpty() -> item(key = "error") {
                    ErrorState(error = state.error!!, onRetry = viewModel::load)
                }

                state.entries.isEmpty() -> item(key = "empty") {
                    EmptyState(
                        icon = Icons.Rounded.EmojiEvents,
                        title = "No ranked members yet",
                        message = "Publish the first public prompt to claim the top spot.",
                    )
                }

                else -> itemsIndexed(state.entries, key = { _, entry -> entry.userId }) { index, entry ->
                    LeaderRow(
                        rank = index + 1,
                        entry = entry,
                        isMe = entry.userId == state.currentUserId,
                    )
                }
            }

            item(key = "your_rank") {
                val myRank = state.rankOf(state.currentUserId)
                if (state.currentUserId != null) {
                    Text(
                        text = if (myRank != null) {
                            "You're #$myRank this season."
                        } else {
                            "You're not on the board yet — publish a prompt to appear."
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun PointRule(points: String, label: String) {
    Column {
        Text(
            text = points,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun LeaderRow(rank: Int, entry: LeaderboardEntry, isMe: Boolean) {
    val extras = LocalExtraColors.current
    val podiumColor = when (rank) {
        1 -> extras.warning
        2 -> MaterialTheme.colorScheme.onSurfaceVariant
        3 -> Color(0xFFB07B45)
        else -> MaterialTheme.colorScheme.outlineVariant
    }
    AppCard(contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(podiumColor.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                when (rank) {
                    1 -> Icon(
                        Icons.Rounded.WorkspacePremium,
                        contentDescription = "First place",
                        tint = podiumColor,
                        modifier = Modifier.size(19.dp),
                    )
                    2 -> Icon(
                        Icons.Rounded.EmojiEvents,
                        contentDescription = "Second place",
                        tint = podiumColor,
                        modifier = Modifier.size(18.dp),
                    )
                    3 -> Icon(
                        Icons.Rounded.MilitaryTech,
                        contentDescription = "Third place",
                        tint = podiumColor,
                        modifier = Modifier.size(18.dp),
                    )
                    else -> Text(
                        text = "$rank",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.width(11.dp))
            Avatar(name = entry.displayName, url = entry.avatarUrl, size = 34.dp)
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = entry.displayName,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                    )
                    if (isMe) {
                        Spacer(Modifier.width(6.dp))
                        BadgeChip(text = "You")
                    }
                }
                Text(
                    text = "${entry.badgeCount} badge${if (entry.badgeCount == 1) "" else "s"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = "${entry.totalPoints}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = "pts",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
