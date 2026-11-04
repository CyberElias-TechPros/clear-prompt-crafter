package com.promptgineer.app.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * The bearer token is the only long-lived credential on the device. It is kept
 * in Keystore-backed encrypted preferences (never in plain DataStore, never in
 * logs, and excluded from backup).
 *
 * If a device has a broken/absent Keystore provider, we fall back to private
 * app preferences rather than crashing the app. The fallback is still sandboxed
 * to this app; the session simply has weaker at-rest protection.
 */
class TokenStore(private val context: Context) {

    @Volatile
    private var loaded = false

    @Volatile
    private var memoryToken: String? = null

    private val prefs: SharedPreferences by lazy { createPreferences() }

    private fun createPreferences(): SharedPreferences = runCatching {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            FILE_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        ) as SharedPreferences
    }.getOrElse { error ->
        Log.w(TAG, "Encrypted preferences unavailable; using app-private fallback", error)
        context.getSharedPreferences(FALLBACK_FILE, Context.MODE_PRIVATE)
    }

    fun token(): String? {
        if (!loaded) {
            memoryToken = runCatching { prefs.getString(KEY_TOKEN, null) }.getOrNull()
            loaded = true
        }
        return memoryToken
    }

    fun hasToken(): Boolean = !token().isNullOrBlank()

    fun save(token: String) {
        memoryToken = token
        loaded = true
        runCatching {
            prefs.edit().putString(KEY_TOKEN, token).apply()
        }.onFailure { Log.w(TAG, "Could not persist session token", it) }
    }

    fun clear() {
        memoryToken = null
        loaded = true
        runCatching { prefs.edit().remove(KEY_TOKEN).apply() }
    }

    private companion object {
        const val TAG = "TokenStore"
        const val FILE_NAME = "pg_secure_session"
        const val FALLBACK_FILE = "pg_session_fallback"
        const val KEY_TOKEN = "pg_token"
    }
}
