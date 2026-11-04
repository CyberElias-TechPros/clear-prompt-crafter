package com.promptgineer.app.core

import com.promptgineer.app.BuildConfig

/**
 * The API base URL is configurable at runtime so the same signed APK can talk
 * to a self-hosted Worker. HTTPS is required in release builds; local http is
 * allowed only in debug builds (the debug network-security config whitelists
 * the emulator host).
 */
class ServerConfig(defaultUrl: String = BuildConfig.API_BASE_URL) {

    @Volatile
    private var baseUrl: String = normalize(defaultUrl)

    fun current(): String = baseUrl

    fun update(raw: String) {
        baseUrl = normalize(raw)
    }

    companion object {
        const val DEFAULT: String = BuildConfig.API_BASE_URL

        fun normalize(raw: String): String {
            val trimmed = raw.trim().trimEnd('/')
            return if (trimmed.isEmpty()) DEFAULT else trimmed
        }

        /** Returns a human-readable problem, or null when the URL is usable. */
        fun validate(raw: String): String? {
            val trimmed = raw.trim()
            if (trimmed.isEmpty()) return "Enter your server address."
            if (!trimmed.startsWith("https://")) {
                val httpAllowed = BuildConfig.DEBUG && trimmed.startsWith("http://")
                if (!httpAllowed) return "Use an https:// address. Plain http is blocked for your security."
            }
            val hostAndPath = trimmed.removePrefix("https://").removePrefix("http://").trimEnd('/')
            val host = hostAndPath.substringBefore('/')
            if (host.isBlank() || !host.contains('.')) return "That doesn't look like a full server address."
            if (host.any { it.isWhitespace() }) return "Addresses can't contain spaces."
            return null
        }
    }
}
