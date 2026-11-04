package com.promptgineer.app.data.remote

import com.promptgineer.app.domain.Ad
import com.promptgineer.app.domain.AiProviderInfo
import com.promptgineer.app.domain.AiServicesSnapshot
import com.promptgineer.app.domain.Comment
import com.promptgineer.app.domain.ConnectedAiService
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LeaderboardEntry
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.domain.PlatformAi
import com.promptgineer.app.domain.PromptDetail
import com.promptgineer.app.domain.PromptSection
import com.promptgineer.app.domain.PromptSummary
import com.promptgineer.app.domain.User

fun UserDto.toDomain(): User = User(
    id = id,
    email = email,
    fullName = fullName?.takeIf { it.isNotBlank() },
    avatarUrl = avatarUrl?.takeIf { it.isNotBlank() },
    role = role,
    isPremium = isPremium,
    allowLearning = allowLearning,
    createdAt = createdAt,
)

fun CommunityItemDto.toSummary(): PromptSummary = PromptSummary(
    id = id,
    title = title.ifBlank { "Untitled" },
    description = description?.takeIf { it.isNotBlank() },
    authorName = userName,
    authorAvatar = userAvatar,
    likeCount = likeCount,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun MyItemDto.toDomain(): MyItem = MyItem(
    id = id,
    title = title.ifBlank { "Untitled" },
    description = description?.takeIf { it.isNotBlank() },
    isPublic = isPublic,
    likes = likes,
    views = views,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun PromptDetailDto.toDomain(kind: ItemKind): PromptDetail = PromptDetail(
    id = id,
    kind = kind,
    title = title.ifBlank { "Untitled" },
    description = description?.takeIf { it.isNotBlank() },
    authorId = userId,
    authorName = userName,
    authorAvatar = userAvatar,
    isPublic = isPublic,
    likes = likes,
    views = views,
    likedByMe = likedByMe,
    sections = sections
        .sortedBy { it.orderIndex }
        .map { PromptSection(it.sectionType, it.content.orEmpty()) },
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun CommentDto.toDomain(): Comment = Comment(
    id = id,
    content = content,
    authorId = userId,
    authorName = userName,
    authorAvatar = userAvatar,
    createdAt = createdAt,
)

fun LeaderboardDto.toDomain(): LeaderboardEntry = LeaderboardEntry(
    userId = userId,
    fullName = fullName,
    avatarUrl = avatarUrl,
    totalPoints = totalPoints,
    badgeCount = badgeCount,
)

fun AiServicesResponse.toDomain(): AiServicesSnapshot = AiServicesSnapshot(
    providers = providers.map {
        AiProviderInfo(
            id = it.id,
            label = it.label,
            defaultModel = it.defaultModel,
            docsUrl = it.docsUrl,
        )
    },
    connected = services.map {
        ConnectedAiService(
            name = it.serviceName,
            isActive = it.isActive,
            baseUrl = it.baseUrl,
            model = it.model,
            createdAt = it.createdAt,
            updatedAt = it.updatedAt,
        )
    },
    platform = platform?.let {
        PlatformAi(
            available = it.available,
            models = it.models,
            dailyLimit = it.dailyLimit,
            usedToday = it.usedToday,
            remainingToday = it.remainingToday,
        )
    },
)

fun List<PromptSection>.toSectionRequests(): List<SectionRequest> =
    filter { it.content.isNotBlank() }.map { SectionRequest(it.type, it.content) }

fun AdDto.toDomain(): Ad = Ad(
    id = id,
    title = title,
    content = content,
    imageUrl = imageUrl,
    linkUrl = linkUrl,
    size = adSize,
    position = adPosition,
    isActive = isActive,
    createdAt = createdAt,
)
