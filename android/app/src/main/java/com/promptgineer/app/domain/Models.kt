package com.promptgineer.app.domain

/** Everything below is plain Kotlin, independent of Android and JSON. */

data class User(
    val id: String,
    val email: String,
    val fullName: String?,
    val avatarUrl: String?,
    val role: String,
    val isPremium: Boolean,
    val allowLearning: Boolean,
    val createdAt: String?,
) {
    val displayName: String
        get() = fullName?.trim()?.takeIf { it.isNotEmpty() }
            ?: email.substringBefore('@').replaceFirstChar { it.uppercase() }

    val initials: String
        get() = displayName
            .split(' ', '.', '_', '-')
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "P" }

    val isAdmin: Boolean get() = role.equals("admin", ignoreCase = true)
}

data class PromptSection(
    val type: String,
    val content: String,
) {
    val isBlank: Boolean get() = content.isBlank()
}

data class PromptSummary(
    val id: String,
    val title: String,
    val description: String?,
    val authorName: String?,
    val authorAvatar: String?,
    val likeCount: Int,
    val createdAt: String?,
    val updatedAt: String?,
)

data class MyItem(
    val id: String,
    val title: String,
    val description: String?,
    val isPublic: Boolean,
    val likes: Int,
    val views: Int,
    val createdAt: String?,
    val updatedAt: String?,
)

enum class ItemKind(val apiPath: String, val singular: String, val plural: String) {
    PROMPT("prompts", "prompt", "prompts"),
    TEMPLATE("templates", "template", "templates");

    companion object {
        fun fromRoute(route: String): ItemKind = if (route == TEMPLATE.apiPath) TEMPLATE else PROMPT
    }
}

data class PromptDetail(
    val id: String,
    val kind: ItemKind,
    val title: String,
    val description: String?,
    val authorId: String?,
    val authorName: String?,
    val authorAvatar: String?,
    val isPublic: Boolean,
    val likes: Int,
    val views: Int,
    val likedByMe: Boolean,
    val sections: List<PromptSection>,
    val createdAt: String?,
    val updatedAt: String?,
)

data class Comment(
    val id: String,
    val content: String,
    val authorId: String,
    val authorName: String?,
    val authorAvatar: String?,
    val createdAt: String?,
)

data class LeaderboardEntry(
    val userId: String,
    val fullName: String?,
    val avatarUrl: String?,
    val totalPoints: Int,
    val badgeCount: Int,
) {
    val displayName: String
        get() = fullName?.trim()?.takeIf { it.isNotEmpty() } ?: "Prompt-Gineer member"
}

data class AiProviderInfo(
    val id: String,
    val label: String,
    val defaultModel: String,
    val docsUrl: String,
)

data class ConnectedAiService(
    val name: String,
    val isActive: Boolean,
    val baseUrl: String?,
    val model: String?,
    val createdAt: String?,
    val updatedAt: String?,
)

data class PlatformAi(
    val available: Boolean,
    val models: List<String>,
    val dailyLimit: Int?,
    val usedToday: Int,
    val remainingToday: Int?,
) {
    val usedFraction: Float
        get() {
            val limit = dailyLimit ?: return 0f
            if (limit <= 0) return 0f
            return (usedToday.toFloat() / limit.toFloat()).coerceIn(0f, 1f)
        }
}

data class AiServicesSnapshot(
    val providers: List<AiProviderInfo>,
    val connected: List<ConnectedAiService>,
    val platform: PlatformAi?,
) {
    val hasByok: Boolean get() = connected.isNotEmpty()
    val activeByok: List<ConnectedAiService> get() = connected.filter { it.isActive }

    val canGenerate: Boolean get() = platform?.available == true || activeByok.isNotEmpty()

    /**
     * Mirrors the web client's routing rule:
     * a user's own NVIDIA key wins (it is their key and likely cheaper for us),
     * then the free platform tier, then any other active BYOK provider.
     * `null` means "let the server use the platform key".
     */
    fun preferredService(): String? = when {
        activeByok.any { it.name.equals("nvidia", true) } -> "nvidia"
        platform?.available == true -> null
        else -> activeByok.firstOrNull()?.name
    }
}

data class GeneratedText(
    val content: String,
    val model: String,
    val service: String,
)

data class LikeResult(val liked: Boolean, val likes: Int)

/** Result of a locally computed CLEAR review (works fully offline). */
enum class ClearStatus { GOOD, IMPROVE, MISSING }

data class ClearCriterion(
    val letter: String,
    val name: String,
    val status: ClearStatus,
    val score: Int,
    val summary: String,
    val tips: List<String>,
)

data class FixSuggestion(
    val id: String,
    val title: String,
    val detail: String,
    val sectionType: String?,
    val snippet: String,
)

data class ClearReport(
    val wordCount: Int,
    val characterCount: Int,
    val criteria: List<ClearCriterion>,
    val overallScore: Int,
    val verdict: String,
    val fixes: List<FixSuggestion>,
    val improvedPrompt: String,
) {
    val isStrong: Boolean get() = overallScore >= 70
    fun criterion(letter: String): ClearCriterion? = criteria.firstOrNull { it.letter == letter }
}

/** Locally stored draft; independent of the server. */
data class LocalDraft(
    val id: Long,
    val title: String,
    val description: String,
    val sections: List<PromptSection>,
    val updatedAt: Long,
    val createdAt: Long,
)

data class Bookmark(
    val kind: ItemKind,
    val itemId: String,
    val title: String,
    val createdAt: Long,
)

// ---------------------------------------------------------------------------
// Local / ephemeral working state
// ---------------------------------------------------------------------------

enum class CoachRole { USER, ASSISTANT }

data class CoachTurn(
    val role: CoachRole,
    val content: String,
    val createdAt: Long,
)

data class WorkspaceState(
    val title: String,
    val description: String,
    val sections: List<PromptSection>,
    val savedAt: Long,
)

data class CachedPayload(val payload: String, val cachedAt: Long)

data class FeedResult(
    val items: List<PromptSummary>,
    val fromCache: Boolean = false,
    val cachedAt: Long? = null,
)

data class DetailResult(
    val item: PromptDetail,
    val fromCache: Boolean = false,
    val cachedAt: Long? = null,
)

/** A house ad rendered in the dashboard. Managed from the admin screen. */
data class Ad(
    val id: String,
    val title: String,
    val content: String,
    val imageUrl: String?,
    val linkUrl: String,
    val size: String,
    val position: String,
    val isActive: Boolean,
    val createdAt: String?,
) {
    val hasLink: Boolean get() = linkUrl.startsWith("http://") || linkUrl.startsWith("https://")

    companion object {
        val SIZES = listOf("small", "medium", "large")
        val POSITIONS = listOf("top", "side", "inline", "bottom")
    }
}
