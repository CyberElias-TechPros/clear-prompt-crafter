package com.promptgineer.app.util

import java.time.Duration
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * The Worker returns ISO strings from `new Date().toISOString()`, while seeded
 * D1 rows use SQLite's `datetime('now')` ("YYYY-MM-DD HH:MM:SS", UTC, no zone).
 * Both are parsed here rather than trusting a single format.
 */
object DateTimeFormat {

    private val sqlDateTime = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    private val shortDate = DateTimeFormatter.ofPattern("MMM d", Locale.getDefault())
    private val dateWithYear = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.getDefault())

    fun parse(raw: String?): Instant? {
        val value = raw?.trim().orEmpty()
        if (value.isEmpty()) return null

        runCatching { return Instant.parse(value) }

        runCatching {
            return LocalDateTime.parse(value, sqlDateTime).toInstant(ZoneOffset.UTC)
        }

        runCatching {
            return ZonedDateTime.parse(value).toInstant()
        }

        runCatching {
            return LocalDateTime.parse(value).atZone(ZoneId.systemDefault()).toInstant()
        }

        return null
    }

    fun relative(raw: String?, now: Instant = Instant.now()): String {
        val instant = parse(raw) ?: return "recently"
        val seconds = Duration.between(instant, now).seconds
        return when {
            seconds < 0 -> "just now"
            seconds < 60 -> "just now"
            seconds < 3_600 -> "${seconds / 60}m ago"
            seconds < 86_400 -> "${seconds / 3_600}h ago"
            seconds < 7 * 86_400 -> "${seconds / 86_400}d ago"
            instant.atZone(ZoneId.systemDefault()).year == now.atZone(ZoneId.systemDefault()).year ->
                shortDate.format(instant.atZone(ZoneId.systemDefault()))
            else -> dateWithYear.format(instant.atZone(ZoneId.systemDefault()))
        }
    }

    fun absoluteDate(raw: String?): String {
        val instant = parse(raw) ?: return "Unknown"
        return dateWithYear.format(instant.atZone(ZoneId.systemDefault()))
    }

    fun memberSince(raw: String?): String {
        val instant = parse(raw) ?: return "recently"
        return dateWithYear.format(instant.atZone(ZoneId.systemDefault()))
    }

    fun fromMillis(millis: Long, now: Long = System.currentTimeMillis()): String {
        val seconds = ((now - millis) / 1_000).coerceAtLeast(0)
        return when {
            seconds < 60 -> "just now"
            seconds < 3_600 -> "${seconds / 60}m ago"
            seconds < 86_400 -> "${seconds / 3_600}h ago"
            seconds < 7 * 86_400 -> "${seconds / 86_400}d ago"
            else -> dateWithYear.format(
                Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()),
            )
        }
    }
}
