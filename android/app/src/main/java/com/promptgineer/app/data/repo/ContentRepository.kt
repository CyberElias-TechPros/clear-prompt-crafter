package com.promptgineer.app.data.repo

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.data.local.LocalDatabase
import com.promptgineer.app.data.remote.ApiProvider
import com.promptgineer.app.data.remote.CommentDto
import com.promptgineer.app.data.remote.CommentRequest
import com.promptgineer.app.data.remote.CommunityItemsResponse
import com.promptgineer.app.data.remote.ContactRequest
import com.promptgineer.app.data.remote.CreateItemRequest
import com.promptgineer.app.data.remote.LeaderboardResponse
import com.promptgineer.app.data.remote.NetworkJson
import com.promptgineer.app.data.remote.PatchItemRequest
import com.promptgineer.app.data.remote.PromptDetailDto
import com.promptgineer.app.data.remote.apiCall
import com.promptgineer.app.data.remote.toDomain
import com.promptgineer.app.data.remote.toSectionRequests
import com.promptgineer.app.data.remote.toSummary
import com.promptgineer.app.domain.Comment
import com.promptgineer.app.domain.DetailResult
import com.promptgineer.app.domain.FeedResult
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LeaderboardEntry
import com.promptgineer.app.domain.LikeResult
import com.promptgineer.app.domain.MyItem
import com.promptgineer.app.domain.PromptSection

/**
 * Community + library data. Public reads are network-first with a local cache
 * fallback, so browsing still works on a train with no signal.
 */
class ContentRepository(
    private val apiProvider: ApiProvider,
    private val database: LocalDatabase,
) {

    suspend fun feed(
        kind: ItemKind,
        sort: String = "recent",
        query: String = "",
        offset: Int = 0,
        limit: Int = 20,
    ): ApiResult<FeedResult> {
        val cacheKey = "feed:${kind.apiPath}:$sort:${query.trim().lowercase().take(40)}"
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.listPrompts(
                    sort = sort,
                    query = query.takeIf { it.isNotBlank() },
                    limit = limit,
                    offset = offset,
                )
                ItemKind.TEMPLATE -> api.listTemplates(
                    sort = sort,
                    query = query.takeIf { it.isNotBlank() },
                    limit = limit,
                    offset = offset,
                )
            }
        }
        return when (result) {
            is ApiResult.Success -> {
                if (offset == 0) {
                    runCatching {
                        database.putCache(
                            cacheKey,
                            NetworkJson.json.encodeToString(
                                CommunityItemsResponse.serializer(),
                                result.data,
                            ),
                        )
                    }
                }
                ApiResult.Success(FeedResult(result.data.items.map { it.toSummary() }))
            }
            is ApiResult.Failure -> {
                val cached = if (offset == 0) database.getCache(cacheKey) else null
                val decoded = cached?.let {
                    runCatching {
                        NetworkJson.json.decodeFromString(
                            CommunityItemsResponse.serializer(),
                            it.payload,
                        )
                    }.getOrNull()
                }
                if (decoded != null && cached != null) {
                    ApiResult.Success(
                        FeedResult(
                            items = decoded.items.map { it.toSummary() },
                            fromCache = true,
                            cachedAt = cached.cachedAt,
                        ),
                    )
                } else {
                    result
                }
            }
        }
    }

    suspend fun detail(kind: ItemKind, id: String): ApiResult<DetailResult> {
        val cacheKey = "detail:${kind.apiPath}:$id"
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.getPrompt(id)
                ItemKind.TEMPLATE -> api.getTemplate(id)
            }
        }
        return when (result) {
            is ApiResult.Success -> {
                runCatching {
                    database.putCache(
                        cacheKey,
                        NetworkJson.json.encodeToString(PromptDetailDto.serializer(), result.data),
                    )
                }
                ApiResult.Success(DetailResult(result.data.toDomain(kind)))
            }
            is ApiResult.Failure -> {
                val cached = database.getCache(cacheKey)?.let {
                    runCatching {
                        NetworkJson.json.decodeFromString(PromptDetailDto.serializer(), it.payload)
                    }.getOrNull()
                }
                if (cached != null) {
                    ApiResult.Success(
                        DetailResult(
                            item = cached.toDomain(kind),
                            fromCache = true,
                            cachedAt = database.getCache(cacheKey)?.cachedAt,
                        ),
                    )
                } else {
                    result
                }
            }
        }
    }

    suspend fun comments(kind: ItemKind, id: String): ApiResult<List<Comment>> {
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.promptComments(id)
                ItemKind.TEMPLATE -> api.templateComments(id)
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.items.map { it.toDomain() })
            is ApiResult.Failure -> result
        }
    }

    suspend fun addComment(kind: ItemKind, id: String, content: String): ApiResult<Comment> {
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.addPromptComment(id, CommentRequest(content.trim()))
                ItemKind.TEMPLATE -> api.addTemplateComment(id, CommentRequest(content.trim()))
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.toDomain())
            is ApiResult.Failure -> result
        }
    }

    suspend fun toggleLike(kind: ItemKind, id: String): ApiResult<LikeResult> {
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.likePrompt(id)
                ItemKind.TEMPLATE -> api.likeTemplate(id)
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(LikeResult(result.data.liked, result.data.likes))
            is ApiResult.Failure -> result
        }
    }

    suspend fun mine(kind: ItemKind): ApiResult<List<MyItem>> {
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.myPrompts()
                ItemKind.TEMPLATE -> api.myTemplates()
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.items.map { it.toDomain() })
            is ApiResult.Failure -> result
        }
    }

    suspend fun create(
        kind: ItemKind,
        title: String,
        description: String,
        isPublic: Boolean,
        sections: List<PromptSection>,
    ): ApiResult<String> {
        val request = CreateItemRequest(
            title = title.trim(),
            description = description.trim().takeIf { it.isNotEmpty() },
            isPublic = isPublic,
            sections = sections.toSectionRequests(),
        )
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.createPrompt(request)
                ItemKind.TEMPLATE -> api.createTemplate(request)
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.id)
            is ApiResult.Failure -> result
        }
    }

    suspend fun setVisibility(kind: ItemKind, id: String, isPublic: Boolean): ApiResult<Unit> {
        val request = PatchItemRequest(isPublic = isPublic)
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.patchPrompt(id, request)
                ItemKind.TEMPLATE -> api.patchTemplate(id, request)
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun delete(kind: ItemKind, id: String): ApiResult<Unit> {
        val result = apiCall {
            val api = apiProvider.api()
            when (kind) {
                ItemKind.PROMPT -> api.deletePrompt(id)
                ItemKind.TEMPLATE -> api.deleteTemplate(id)
            }
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun leaderboard(): ApiResult<List<LeaderboardEntry>> {
        val result = apiCall { apiProvider.api().leaderboard() }
        return when (result) {
            is ApiResult.Success -> {
                runCatching {
                    database.putCache(
                        CACHE_LEADERBOARD,
                        NetworkJson.json.encodeToString(LeaderboardResponse.serializer(), result.data),
                    )
                }
                ApiResult.Success(result.data.items.map { it.toDomain() })
            }
            is ApiResult.Failure -> {
                val cached = database.getCache(CACHE_LEADERBOARD)?.let {
                    runCatching {
                        NetworkJson.json.decodeFromString(LeaderboardResponse.serializer(), it.payload)
                    }.getOrNull()
                }
                if (cached != null) {
                    ApiResult.Success(cached.items.map { it.toDomain() })
                } else {
                    result
                }
            }
        }
    }

    suspend fun sendContact(
        name: String,
        email: String,
        subject: String,
        message: String,
    ): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().contact(
                ContactRequest(
                    name = name.trim(),
                    email = email.trim(),
                    subject = subject.trim(),
                    message = message.trim(),
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun isBookmarked(kind: ItemKind, id: String): Boolean = database.isBookmarked(kind, id)

    suspend fun toggleBookmark(kind: ItemKind, id: String, title: String): Boolean =
        database.toggleBookmark(kind, id, title)

    private companion object {
        const val CACHE_LEADERBOARD = "leaderboard"
    }
}
