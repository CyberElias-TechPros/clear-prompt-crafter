package com.promptgineer.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.promptgineer.app.core.AppSettings
import com.promptgineer.app.core.ServerConfig
import com.promptgineer.app.core.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.appDataStore: DataStore<Preferences> by preferencesDataStore(name = "pg_settings")

/**
 * Device-local preferences. Anything that is account data (name, learning
 * consent, AI keys) stays on the server; this store only holds choices that
 * belong to the installation.
 */
class SettingsStore(private val context: Context) {

    private object Keys {
        val onboardingCompleted = booleanPreferencesKey("onboarding_completed")
        val theme = stringPreferencesKey("theme")
        val dynamicColor = booleanPreferencesKey("dynamic_color")
        val haptics = booleanPreferencesKey("haptics")
        val serverUrl = stringPreferencesKey("server_url")
        val lastSort = stringPreferencesKey("last_community_sort")
    }

    val settings: Flow<AppSettings> = context.appDataStore.data
        .catch { error ->
            if (error is IOException) emit(emptyPreferences()) else throw error
        }
        .map { prefs ->
            AppSettings(
                onboardingCompleted = prefs[Keys.onboardingCompleted] ?: false,
                theme = prefs[Keys.theme]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() }
                    ?: ThemeMode.SYSTEM,
                dynamicColor = prefs[Keys.dynamicColor] ?: true,
                haptics = prefs[Keys.haptics] ?: true,
                serverUrl = prefs[Keys.serverUrl] ?: ServerConfig.DEFAULT,
                lastCommunitySort = prefs[Keys.lastSort] ?: "recent",
            )
        }

    suspend fun setOnboardingCompleted(completed: Boolean = true) {
        context.appDataStore.edit { it[Keys.onboardingCompleted] = completed }
    }

    suspend fun setTheme(theme: ThemeMode) {
        context.appDataStore.edit { it[Keys.theme] = theme.name }
    }

    suspend fun setDynamicColor(enabled: Boolean) {
        context.appDataStore.edit { it[Keys.dynamicColor] = enabled }
    }

    suspend fun setHaptics(enabled: Boolean) {
        context.appDataStore.edit { it[Keys.haptics] = enabled }
    }

    suspend fun setServerUrl(url: String) {
        context.appDataStore.edit { it[Keys.serverUrl] = ServerConfig.normalize(url) }
    }

    suspend fun setLastCommunitySort(sort: String) {
        context.appDataStore.edit { it[Keys.lastSort] = sort }
    }
}
