package com.promptgineer.app.core

/** Small, shared validation + copy helpers so screens stay consistent. */
object Validate {
    private val emailRegex = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

    const val MIN_PASSWORD_LENGTH = 6

    fun email(value: String): String? = when {
        value.isBlank() -> "Enter your email address."
        !emailRegex.matches(value.trim()) -> "That doesn't look like a valid email address."
        else -> null
    }

    fun password(value: String): String? = when {
        value.isEmpty() -> "Enter your password."
        value.length < MIN_PASSWORD_LENGTH -> "Use at least $MIN_PASSWORD_LENGTH characters."
        else -> null
    }

    fun newPassword(value: String): String? = when {
        value.isEmpty() -> "Choose a new password."
        value.length < MIN_PASSWORD_LENGTH -> "Use at least $MIN_PASSWORD_LENGTH characters."
        else -> null
    }

    fun requiredName(value: String): String? =
        if (value.isBlank()) "Enter your name." else null

    fun promptTitle(value: String): String? = when {
        value.isBlank() -> "Give the prompt a name."
        value.trim().length < 3 -> "Use at least 3 characters."
        value.length > 120 -> "Keep the name under 120 characters."
        else -> null
    }

    fun sectionContent(value: String): String? =
        if (value.length > 20_000) "That section is too long (20,000 characters max)." else null
}

object TextFormat {
    fun pluralize(count: Int, singular: String, plural: String = "${singular}s"): String =
        if (count == 1) "1 $singular" else "$count $plural"

    fun compactCount(count: Int): String = when {
        count < 1_000 -> count.toString()
        count < 10_000 -> String.format("%.1fk", count / 1_000f)
        else -> "${count / 1_000}k"
    }

    fun truncate(value: String, max: Int): String =
        if (value.length <= max) value else value.take(max - 1).trimEnd() + "…"
}
