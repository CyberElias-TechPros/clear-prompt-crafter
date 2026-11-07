package com.promptgineer.app.data.remote

import com.promptgineer.app.BuildConfig
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.ServerConfig
import com.promptgineer.app.core.SessionEvents
import com.promptgineer.app.data.local.TokenStore
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Builds Retrofit instances on demand so the server URL can change at runtime
 * without restarting the app. Built clients are cached per base URL.
 */
class ApiProvider(
    private val serverConfig: ServerConfig,
    private val tokenStore: TokenStore,
    private val sessionEvents: SessionEvents,
) {
    @Volatile
    private var cached: Pair<String, PromptGineerApi>? = null

    private val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
        else HttpLoggingInterceptor.Level.NONE
    }

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS) // AI generations can be slow
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor { chain ->
                val original = chain.request()
                val token = tokenStore.token()
                val request = if (token.isNullOrBlank() || original.header("Authorization") != null) {
                    original
                } else {
                    original.newBuilder()
                        .header("Authorization", "Bearer $token")
                        .build()
                }
                val response = chain.proceed(request)
                val path = original.url.encodedPath
                val isCredentialCheck = path.endsWith("/auth/login") ||
                    path.endsWith("/auth/signup") ||
                    path.endsWith("/auth/change-password")
                if (response.code == 401 && !isCredentialCheck && token != null) {
                    sessionEvents.notifyUnauthorized()
                }
                response
            }
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder()
                        .header("Accept", "application/json")
                        .header("User-Agent", "PromptGineer-Android/${BuildConfig.VERSION_NAME}")
                        .build(),
                )
            }
            .addInterceptor(logging)
            .build()
    }

    fun api(): PromptGineerApi {
        val base = serverConfig.current()
        cached?.let { (url, api) -> if (url == base) return api }
        val created = build(base)
        cached = base to created
        return created
    }

    private fun build(baseUrl: String): PromptGineerApi =
        Retrofit.Builder()
            .baseUrl(baseUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(NetworkJson.json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(PromptGineerApi::class.java)

    /** Verifies a candidate server address before the app switches to it. */
    suspend fun probeHealth(baseUrl: String): ApiResult<HealthResponse> =
        apiCall { build(baseUrl.trimEnd('/') + "/").health() }
}
