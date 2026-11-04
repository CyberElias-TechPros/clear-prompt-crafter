package com.promptgineer.app.data.repo

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.data.remote.AdCreateRequest
import com.promptgineer.app.data.remote.AdPatchRequest
import com.promptgineer.app.data.remote.ApiProvider
import com.promptgineer.app.data.remote.apiCall
import com.promptgineer.app.data.remote.toDomain
import com.promptgineer.app.domain.Ad

/**
 * Ads are the one piece of content that is editorial rather than user
 * generated. Reading is public; every mutation is admin-only and enforced by
 * the server, so the UI merely hides the entry points.
 */
class AdsRepository(private val apiProvider: ApiProvider) {

    suspend fun active(size: String? = null, position: String? = null): ApiResult<List<Ad>> =
        when (val result = apiCall { apiProvider.api().ads(size = size, position = position) }) {
            is ApiResult.Success -> ApiResult.Success(result.data.items.map { it.toDomain() })
            is ApiResult.Failure -> result
        }

    suspend fun adminList(): ApiResult<List<Ad>> =
        when (val result = apiCall { apiProvider.api().adminAds() }) {
            is ApiResult.Success -> ApiResult.Success(result.data.items.map { it.toDomain() })
            is ApiResult.Failure -> result
        }

    suspend fun create(
        title: String,
        content: String,
        linkUrl: String,
        imageUrl: String?,
        size: String,
        position: String,
        isActive: Boolean,
    ): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().adminCreateAd(
                AdCreateRequest(
                    title = title.trim(),
                    content = content.trim(),
                    linkUrl = linkUrl.trim(),
                    imageUrl = imageUrl?.trim()?.takeIf { it.isNotEmpty() },
                    adSize = size,
                    adPosition = position,
                    isActive = isActive,
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun update(ad: Ad): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().adminPatchAd(
                ad.id,
                AdPatchRequest(
                    title = ad.title,
                    content = ad.content,
                    linkUrl = ad.linkUrl,
                    imageUrl = ad.imageUrl,
                    adSize = ad.size,
                    adPosition = ad.position,
                    isActive = ad.isActive,
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun setActive(ad: Ad, active: Boolean): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().adminPatchAd(ad.id, AdPatchRequest(isActive = active))
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun delete(id: String): ApiResult<Unit> {
        val result = apiCall { apiProvider.api().adminDeleteAd(id) }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }
}
