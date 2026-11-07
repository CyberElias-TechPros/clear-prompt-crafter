package com.promptgineer.app.core

enum class ThemeMode { SYSTEM, LIGHT, DARK }

data class AppSettings(
    val onboardingCompleted: Boolean = false,
    val theme: ThemeMode = ThemeMode.SYSTEM,
    val dynamicColor: Boolean = true,
    val haptics: Boolean = true,
    val serverUrl: String = ServerConfig.DEFAULT,
    val lastCommunitySort: String = "recent",
)
