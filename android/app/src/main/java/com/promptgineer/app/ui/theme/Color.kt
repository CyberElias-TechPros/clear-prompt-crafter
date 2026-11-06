package com.promptgineer.app.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

internal val LightColors = lightColorScheme(
    primary = Color(0xFF5B4BE0),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE7E2FF),
    onPrimaryContainer = Color(0xFF190A5E),
    secondary = Color(0xFF5F5A75),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE6E1F5),
    onSecondaryContainer = Color(0xFF1C1929),
    tertiary = Color(0xFF8A5A00),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFFE0A6),
    onTertiaryContainer = Color(0xFF2A1800),
    background = Color(0xFFFBFAF7),
    onBackground = Color(0xFF1A1824),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF1A1824),
    surfaceVariant = Color(0xFFF0EDF7),
    onSurfaceVariant = Color(0xFF494555),
    outline = Color(0xFFCAC4D6),
    outlineVariant = Color(0xFFE6E1EE),
    error = Color(0xFFB3261E),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFF9DEDC),
    onErrorContainer = Color(0xFF410E0B),
    inverseSurface = Color(0xFF2F2B3A),
    inverseOnSurface = Color(0xFFF3EFF7),
    inversePrimary = Color(0xFFC7C1FF),
)

internal val DarkColors = darkColorScheme(
    primary = Color(0xFFC7C1FF),
    onPrimary = Color(0xFF241A6B),
    primaryContainer = Color(0xFF3A2E96),
    onPrimaryContainer = Color(0xFFE7E2FF),
    secondary = Color(0xFFC9C3DD),
    onSecondary = Color(0xFF2E2A3E),
    secondaryContainer = Color(0xFF423D55),
    onSecondaryContainer = Color(0xFFE6E1F5),
    tertiary = Color(0xFFF2B24A),
    onTertiary = Color(0xFF3F2A00),
    tertiaryContainer = Color(0xFF5A3F00),
    onTertiaryContainer = Color(0xFFFFE0A6),
    background = Color(0xFF121019),
    onBackground = Color(0xFFEBE7F2),
    surface = Color(0xFF1A1723),
    onSurface = Color(0xFFEBE7F2),
    surfaceVariant = Color(0xFF2A2636),
    onSurfaceVariant = Color(0xFFCBC5D8),
    outline = Color(0xFF958FA3),
    outlineVariant = Color(0xFF3D3849),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    inverseSurface = Color(0xFFEBE7F2),
    inverseOnSurface = Color(0xFF2F2B3A),
    inversePrimary = Color(0xFF5B4BE0),
)

/**
 * Roles Material 3 does not model: semantic success/warning and the dark
 * "prompt code" surface used for previews.
 */
data class ExtraColors(
    val success: Color,
    val successContainer: Color,
    val onSuccessContainer: Color,
    val warning: Color,
    val warningContainer: Color,
    val onWarningContainer: Color,
    val codeSurface: Color,
    val codeBorder: Color,
    val codeText: Color,
    val codeMuted: Color,
    val scorePoor: Color,
    val scoreFair: Color,
    val scoreGood: Color,
)

internal val LightExtraColors = ExtraColors(
    success = Color(0xFF1E7B4D),
    successContainer = Color(0xFFDDF4E6),
    onSuccessContainer = Color(0xFF073A22),
    warning = Color(0xFF8A5A00),
    warningContainer = Color(0xFFFFE7BF),
    onWarningContainer = Color(0xFF2A1800),
    codeSurface = Color(0xFF1D1B2A),
    codeBorder = Color(0xFF2E2B40),
    codeText = Color(0xFFE7E4F2),
    codeMuted = Color(0xFF9C97B5),
    scorePoor = Color(0xFFC0392B),
    scoreFair = Color(0xFFB7791F),
    scoreGood = Color(0xFF1E7B4D),
)

internal val DarkExtraColors = ExtraColors(
    success = Color(0xFF7FDCAA),
    successContainer = Color(0xFF103D27),
    onSuccessContainer = Color(0xFFC7F5DC),
    warning = Color(0xFFF2B24A),
    warningContainer = Color(0xFF463200),
    onWarningContainer = Color(0xFFFFE0A6),
    codeSurface = Color(0xFF0D0C14),
    codeBorder = Color(0xFF2B2839),
    codeText = Color(0xFFE9E6F4),
    codeMuted = Color(0xFF8F8AA6),
    scorePoor = Color(0xFFFF8A80),
    scoreFair = Color(0xFFF2B24A),
    scoreGood = Color(0xFF7FDCAA),
)

val LocalExtraColors = staticCompositionLocalOf { LightExtraColors }
