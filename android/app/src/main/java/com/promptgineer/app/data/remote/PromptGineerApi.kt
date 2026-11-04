package com.promptgineer.app.data.remote

import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * One-to-one mapping of the Cloudflare Worker API. Public endpoints fall back to
 * cached data in the repository layer when the network is unavailable.
 */
interface PromptGineerApi {

    // Auth + account --------------------------------------------------------
    @POST("api/auth/signup")
    suspend fun signUp(@Body body: SignUpRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout(): SuccessResponse

    @GET("api/auth/me")
    suspend fun me(): UserEnvelope

    @POST("api/auth/change-password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): ChangePasswordResponse

    @DELETE("api/auth/account")
    suspend fun deleteAccount(): SuccessResponse

    @PATCH("api/me")
    suspend fun updateMe(@Body body: UpdateMeRequest): UserEnvelope

    @GET("api/me/data")
    suspend fun exportData(): ResponseBody

    // Prompts ---------------------------------------------------------------
    @GET("api/prompts")
    suspend fun listPrompts(
        @Query("sort") sort: String? = null,
        @Query("q") query: String? = null,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
    ): CommunityItemsResponse

    @GET("api/prompts/mine")
    suspend fun myPrompts(): MyItemsResponse

    @GET("api/prompts/{id}")
    suspend fun getPrompt(@Path("id") id: String): PromptDetailDto

    @POST("api/prompts")
    suspend fun createPrompt(@Body body: CreateItemRequest): CreateItemResponse

    @PATCH("api/prompts/{id}")
    suspend fun patchPrompt(@Path("id") id: String, @Body body: PatchItemRequest): SuccessResponse

    @DELETE("api/prompts/{id}")
    suspend fun deletePrompt(@Path("id") id: String): SuccessResponse

    @POST("api/prompts/{id}/like")
    suspend fun likePrompt(@Path("id") id: String): LikeResponse

    @GET("api/prompts/{id}/comments")
    suspend fun promptComments(@Path("id") id: String): CommentsResponse

    @POST("api/prompts/{id}/comments")
    suspend fun addPromptComment(@Path("id") id: String, @Body body: CommentRequest): CommentDto

    // Templates -------------------------------------------------------------
    @GET("api/templates")
    suspend fun listTemplates(
        @Query("sort") sort: String? = null,
        @Query("q") query: String? = null,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
    ): CommunityItemsResponse

    @GET("api/templates/mine")
    suspend fun myTemplates(): MyItemsResponse

    @GET("api/templates/{id}")
    suspend fun getTemplate(@Path("id") id: String): PromptDetailDto

    @POST("api/templates")
    suspend fun createTemplate(@Body body: CreateItemRequest): CreateItemResponse

    @PATCH("api/templates/{id}")
    suspend fun patchTemplate(@Path("id") id: String, @Body body: PatchItemRequest): SuccessResponse

    @DELETE("api/templates/{id}")
    suspend fun deleteTemplate(@Path("id") id: String): SuccessResponse

    @POST("api/templates/{id}/like")
    suspend fun likeTemplate(@Path("id") id: String): LikeResponse

    @GET("api/templates/{id}/comments")
    suspend fun templateComments(@Path("id") id: String): CommentsResponse

    @POST("api/templates/{id}/comments")
    suspend fun addTemplateComment(@Path("id") id: String, @Body body: CommentRequest): CommentDto

    // Community -------------------------------------------------------------
    @GET("api/leaderboard")
    suspend fun leaderboard(): LeaderboardResponse

    // AI --------------------------------------------------------------------
    @GET("api/ai/services")
    suspend fun aiServices(): AiServicesResponse

    @POST("api/ai/services")
    suspend fun connectService(@Body body: ConnectServiceRequest): SuccessResponse

    @PATCH("api/ai/services/{name}")
    suspend fun setServiceActive(@Path("name") name: String, @Body body: SetActiveRequest): SuccessResponse

    @DELETE("api/ai/services/{name}")
    suspend fun disconnectService(@Path("name") name: String): SuccessResponse

    @POST("api/ai/services/{name}/test")
    suspend fun testService(@Path("name") name: String): TestServiceResponse

    @POST("api/ai/generate")
    suspend fun generate(@Body body: GenerateRequest): GenerateResponse

    @GET("api/ai/models")
    suspend fun aiModels(): AiModelsResponse

    // Misc ------------------------------------------------------------------
    @POST("api/contact")
    suspend fun contact(@Body body: ContactRequest): SuccessResponse

    @GET("api/health")
    suspend fun health(): HealthResponse

    // Ads -------------------------------------------------------------------
    @GET("api/ads")
    suspend fun ads(
        @Query("size") size: String? = null,
        @Query("position") position: String? = null,
    ): AdsResponse

    @GET("api/admin/ads")
    suspend fun adminAds(): AdsResponse

    @POST("api/admin/ads")
    suspend fun adminCreateAd(@Body body: AdCreateRequest): AdCreateResponse

    @PATCH("api/admin/ads/{id}")
    suspend fun adminPatchAd(@Path("id") id: String, @Body body: AdPatchRequest): SuccessResponse

    @DELETE("api/admin/ads/{id}")
    suspend fun adminDeleteAd(@Path("id") id: String): SuccessResponse
}
