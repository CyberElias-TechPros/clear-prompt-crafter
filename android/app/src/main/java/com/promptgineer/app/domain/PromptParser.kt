package com.promptgineer.app.domain

/**
 * Turns pasted text back into editable sections. Handles the app's own
 * `**Label:** content` format, plain `Label: content` lines, and unstructured
 * prose (which becomes a single Task section rather than being discarded).
 */
object PromptParser {

    private val boldLabel = Regex("""\*\*([^*\n]{2,40})\*\*\s*:?""")
    private val plainLabel = Regex("""(?m)^([A-Za-z][A-Za-z /&'()\-]{1,28}):\s*(.*)$""")

    fun parse(text: String): List<PromptSection> {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return emptyList()

        val boldMatches = boldLabel.findAll(trimmed).toList()
        if (boldMatches.isNotEmpty()) {
            return boldMatches.mapIndexedNotNull { index, match ->
                val label = match.groupValues[1].trim().trimEnd(':').trim()
                val start = match.range.last + 1
                val end = boldMatches.getOrNull(index + 1)?.range?.first ?: trimmed.length
                val content = trimmed.substring(start.coerceAtMost(trimmed.length), end).trim()
                if (label.isEmpty()) {
                    null
                } else {
                    PromptSection(type = typeFor(label), content = content)
                }
            }.filter { it.content.isNotBlank() }.ifEmpty {
                listOf(PromptSection("task", trimmed))
            }
        }

        val plainMatches = plainLabel.findAll(trimmed).toList()
        if (plainMatches.size >= 2) {
            return plainMatches.mapIndexedNotNull { index, match ->
                val label = match.groupValues[1].trim()
                val inline = match.groupValues[2].trim()
                val start = match.range.last + 1
                val end = plainMatches.getOrNull(index + 1)?.range?.first ?: trimmed.length
                val following = trimmed.substring(start.coerceAtMost(trimmed.length), end).trim()
                val content = listOf(inline, following).filter { it.isNotBlank() }.joinToString("\n")
                if (content.isBlank()) null else PromptSection(typeFor(label), content)
            }
        }

        return listOf(PromptSection("task", trimmed))
    }

    fun typeFor(label: String): String {
        val normalised = label.trim().trimEnd(':').lowercase()
        val known = PromptSections.all.firstOrNull {
            it.title.equals(normalised, ignoreCase = true) ||
                it.type.equals(normalised, ignoreCase = true)
        }
        if (known != null) return known.type
        return when (normalised) {
            "background", "situation", "role" -> "context"
            "objective", "goal", "request", "instructions" -> "task"
            "style", "tone", "format", "output format" -> "guidelines"
            "rules", "requirements", "limits" -> "constraints"
            "edge cases", "errors", "error handling" -> "errorHandling"
            "privacy", "security" -> "security"
            "quality", "checks", "success criteria" -> "performance"
            else -> normalised
                .replace(Regex("[^a-z0-9 ]"), "")
                .split(' ')
                .filter { it.isNotBlank() }
                .joinToString(" ") { word -> word.replaceFirstChar { it.uppercase() } }
                .replaceFirstChar { it.lowercase() }
                .ifBlank { "notes" }
        }
    }
}
