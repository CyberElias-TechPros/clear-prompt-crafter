package com.promptgineer.app.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

@Serializable
data class SignUpRequest(
    val email: String,
    val password: String,
    @SerialName("full_name") val fullName: String? = null,
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class ChangePasswordRequest(
    @SerialName("current_password") val currentPassword: String,
    @SerialName("new_password") val newPassword: String,
)

@Serializable
data class UpdateMeRequest(
    @SerialName("full_name") val fullName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("allow_learning") val allowLearning: Boolean? = null,
    val theme: String? = null,
)

@Serializable
data class SectionRequest(
    @SerialName("section_type") val sectionType: String,
    val content: String,
)

@Serializable
data class CreateItemRequest(
    val title: String,
    val description: String? = null,
    @SerialName("is_public") val isPublic: Boolean,
    val sections: List<SectionRequest>,
)

@Serializable
data class PatchItemRequest(
    val title: String? = null,
    val description: String? = null,
    @SerialName("is_public") val isPublic: Boolean? = null,
    val sections: List<SectionRequest>? = null,
)

@Serializable
data class CommentRequest(val content: String)

@Serializable
data class ConnectServiceRequest(
    @SerialName("service_name") val serviceName: String,
    @SerialName("api_key") val apiKey: String,
    @SerialName("base_url") val baseUrl: String? = null,
    val model: String? = null,
)

@Serializable
data class SetActiveRequest(@SerialName("is_active") val isActive: Boolean)

@Serializable
data class ChatMessageDto(val role: String, val content: String)

@Serializable
data class GenerateRequest(
    val prompt: String? = null,
    val messages: List<ChatMessageDto>? = null,
    val service: String? = null,
    val model: String? = null,
    val temperature: Double? = null,
    @SerialName("max_tokens") val maxTokens: Int? = null,
)

@Serializable
data class ContactRequest(
    val name: String,
    val email: String,
    val subject: String,
    val message: String,
)

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

@Serializable
data class UserDto(
    val id: String,
    val email: String = "",
    @SerialName("full_name") val fullName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    val role: String = "user",
    @SerialName("is_premium") val isPremium: Boolean = false,
    @SerialName("allow_learning") val allowLearning: Boolean = false,
    val theme: String = "system",
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class AuthResponse(val token: String, val user: UserDto)

@Serializable
data class UserEnvelope(val user: UserDto)

@Serializable
data class ChangePasswordResponse(val token: String, val success: Boolean = true)

@Serializable
data class SuccessResponse(val success: Boolean = true)

@Serializable
data class CommunityItemDto(
    val id: String,
    val title: String = "",
    val description: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("user_name") val userName: String? = null,
    @SerialName("user_avatar") val userAvatar: String? = null,
    @SerialName("like_count") val likeCount: Int = 0,
)

@Serializable
data class CommunityItemsResponse(val items: List<CommunityItemDto> = emptyList())

@Serializable
data class MyItemDto(
    val id: String,
    val title: String = "",
    val description: String? = null,
    @SerialName("is_public")
    @Serializable(with = FlexibleBooleanSerializer::class)
    val isPublic: Boolean = false,
    val likes: Int = 0,
    val views: Int = 0,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
)

@Serializable
data class MyItemsResponse(val items: List<MyItemDto> = emptyList())

@Serializable
data class SectionDto(
    val id: String? = null,
    @SerialName("section_type") val sectionType: String,
    val content: String? = null,
    @SerialName("order_index") val orderIndex: Int = 0,
)

@Serializable
data class PromptDetailDto(
    val id: String,
    val title: String = "",
    val description: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("user_name") val userName: String? = null,
    @SerialName("user_avatar") val userAvatar: String? = null,
    @SerialName("is_public")
    @Serializable(with = FlexibleBooleanSerializer::class)
    val isPublic: Boolean = true,
    val likes: Int = 0,
    val views: Int = 0,
    @SerialName("liked_by_me") val likedByMe: Boolean = false,
    val sections: List<SectionDto> = emptyList(),
)

@Serializable
data class CommentDto(
    val id: String,
    val content: String = "",
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("user_id") val userId: String = "",
    @SerialName("user_name") val userName: String? = null,
    @SerialName("user_avatar") val userAvatar: String? = null,
)

@Serializable
data class CommentsResponse(val items: List<CommentDto> = emptyList())

@Serializable
data class CreateItemResponse(val id: String)

@Serializable
data class LikeResponse(val liked: Boolean, val likes: Int)

@Serializable
data class LeaderboardDto(
    @SerialName("user_id") val userId: String,
    @SerialName("full_name") val fullName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("total_points") val totalPoints: Int = 0,
    @SerialName("badge_count") val badgeCount: Int = 0,
)

@Serializable
data class LeaderboardResponse(val items: List<LeaderboardDto> = emptyList())

@Serializable
data class ProviderDto(
    val id: String,
    val label: String = "",
    @SerialName("default_model") val defaultModel: String = "",
    @SerialName("docs_url") val docsUrl: String = "",
)

@Serializable
data class AiServiceDto(
    @SerialName("service_name") val serviceName: String,
    @SerialName("is_active") val isActive: Boolean = false,
    @SerialName("base_url") val baseUrl: String? = null,
    val model: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
)

@Serializable
data class PlatformDto(
    @SerialName("service_name") val serviceName: String = "nvidia",
    val available: Boolean = false,
    val models: List<String> = emptyList(),
    @SerialName("daily_limit") val dailyLimit: Int? = null,
    @SerialName("used_today") val usedToday: Int = 0,
    @SerialName("remaining_today") val remainingToday: Int? = null,
)

@Serializable
data class AiServicesResponse(
    val providers: List<ProviderDto> = emptyList(),
    val services: List<AiServiceDto> = emptyList(),
    val platform: PlatformDto? = null,
)

@Serializable
data class TestServiceResponse(val ok: Boolean = false, val model: String = "")

@Serializable
data class GenerateResponse(
    val content: String,
    val model: String = "",
    val service: String = "",
)

@Serializable
data class AiModelsResponse(
    @SerialName("default_service") val defaultService: String = "nvidia",
    @SerialName("platform_available") val platformAvailable: Boolean = false,
    val models: List<String> = emptyList(),
)

@Serializable
data class HealthResponse(
    val ok: Boolean = false,
    val database: Boolean = false,
    @SerialName("platform_ai") val platformAi: Boolean = false,
    val time: String? = null,
)

/** Used when the account export endpoint returns an opaque JSON document. */
@Serializable
data class RawJson(val value: JsonElement)

// ---------------------------------------------------------------------------
// Ads (admin-managed placements)
// ---------------------------------------------------------------------------

@Serializable
data class AdDto(
    val id: String,
    val title: String,
    val content: String = "",
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("link_url") val linkUrl: String = "",
    @SerialName("ad_size") val adSize: String = "small",
    @SerialName("ad_position") val adPosition: String = "top",
    @SerialName("is_active") @Serializable(with = FlexibleBooleanSerializer::class)
    val isActive: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class AdsResponse(val items: List<AdDto> = emptyList())

@Serializable
data class AdCreateRequest(
    val title: String,
    val content: String,
    @SerialName("link_url") val linkUrl: String,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("ad_size") val adSize: String,
    @SerialName("ad_position") val adPosition: String,
    @SerialName("is_active") val isActive: Boolean = true,
)

@Serializable
data class AdPatchRequest(
    val title: String? = null,
    val content: String? = null,
    @SerialName("link_url") val linkUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("ad_size") val adSize: String? = null,
    @SerialName("ad_position") val adPosition: String? = null,
    @SerialName("is_active") val isActive: Boolean? = null,
)

@Serializable
data class AdCreateResponse(val id: String = "")
