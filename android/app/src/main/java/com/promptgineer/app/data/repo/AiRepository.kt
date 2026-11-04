package com.promptgineer.app.data.repo

import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.data.remote.ApiProvider
import com.promptgineer.app.data.remote.ChatMessageDto
import com.promptgineer.app.data.remote.ConnectServiceRequest
import com.promptgineer.app.data.remote.GenerateRequest
import com.promptgineer.app.data.remote.SetActiveRequest
import com.promptgineer.app.data.remote.apiCall
import com.promptgineer.app.data.remote.toDomain
import com.promptgineer.app.domain.AiServicesSnapshot
import com.promptgineer.app.domain.GeneratedText

data class ChatTurn(val role: String, val content: String) {
    companion object {
        const val USER = "user"
        const val ASSISTANT = "assistant"
    }
}

/**
 * AI gateway access. All provider keys live server-side; the app only ever
 * sends the prompt and a service name.
 */
class AiRepository(private val apiProvider: ApiProvider) {

    suspend fun services(): ApiResult<AiServicesSnapshot> {
        val result = apiCall { apiProvider.api().aiServices() }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.toDomain())
            is ApiResult.Failure -> result
        }
    }

    suspend fun connect(
        providerId: String,
        apiKey: String,
        baseUrl: String? = null,
        model: String? = null,
    ): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().connectService(
                ConnectServiceRequest(
                    serviceName = providerId,
                    apiKey = apiKey.trim(),
                    baseUrl = baseUrl?.trim()?.takeIf { it.isNotEmpty() },
                    model = model?.trim()?.takeIf { it.isNotEmpty() },
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun setActive(name: String, active: Boolean): ApiResult<Unit> {
        val result = apiCall {
            apiProvider.api().setServiceActive(name, SetActiveRequest(active))
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun disconnect(name: String): ApiResult<Unit> {
        val result = apiCall { apiProvider.api().disconnectService(name) }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun test(name: String): ApiResult<String> {
        val result = apiCall { apiProvider.api().testService(name) }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(result.data.model.ifBlank { "unknown model" })
            is ApiResult.Failure -> result
        }
    }

    suspend fun generate(
        prompt: String? = null,
        messages: List<ChatTurn>? = null,
        service: String? = null,
        maxTokens: Int = 900,
        temperature: Double? = null,
    ): ApiResult<GeneratedText> {
        require(prompt != null || !messages.isNullOrEmpty()) { "Provide a prompt or messages" }
        val result = apiCall {
            apiProvider.api().generate(
                GenerateRequest(
                    prompt = prompt,
                    messages = messages?.map { ChatMessageDto(it.role, it.content) },
                    service = service,
                    temperature = temperature,
                    maxTokens = maxTokens,
                ),
            )
        }
        return when (result) {
            is ApiResult.Success -> ApiResult.Success(
                GeneratedText(
                    content = result.data.content.trim(),
                    model = result.data.model,
                    service = result.data.service,
                ),
            )
            is ApiResult.Failure -> result
        }
    }

    suspend fun providerDocsUrl(name: String): String? {
        val result = services()
        return (result as? ApiResult.Success<AiServicesSnapshot>)?.data?.providers
            ?.firstOrNull { it.id == name }
            ?.docsUrl
            ?.takeIf { it.isNotBlank() }
    }
}
