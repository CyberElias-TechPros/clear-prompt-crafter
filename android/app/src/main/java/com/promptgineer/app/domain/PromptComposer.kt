package com.promptgineer.app.domain

/**
 * Turns section drafts into the text people actually paste into an AI tool.
 * Deterministic, allocation-light, and unit-tested.
 */
object PromptComposer {

    /** Canonical order: required sections first, then optional, then custom. */
    fun ordered(sections: List<PromptSection>): List<PromptSection> =
        sections.sortedBy { PromptSections.orderIndex(it.type) }

    fun filled(sections: List<PromptSection>): List<PromptSection> =
        ordered(sections).filter { it.content.isNotBlank() }

    /**
     * The canonical prompt body. Sections are labelled in bold Markdown, which
     * every major model understands and which keeps prompts human-readable.
     */
    fun compose(sections: List<PromptSection>, includeEmpty: Boolean = false): String {
        val parts = ordered(sections)
            .filter { includeEmpty || it.content.isNotBlank() }
            .map { section ->
                val label = PromptSections.titleFor(section.type)
                "**$label:** ${section.content.trim()}"
            }
        return parts.joinToString(separator = "\n\n")
    }

    /** A shareable document with a title and description (used for copy/share). */
    fun document(
        title: String,
        description: String?,
        sections: List<PromptSection>,
    ): String = buildString {
        if (title.isNotBlank()) append("# ").append(title.trim()).append("\n\n")
        if (!description.isNullOrBlank()) append(description.trim()).append("\n\n")
        append(compose(sections))
    }.trim()

    /** Plain-text rendering used in the community detail screen. */
    fun readableBody(sections: List<PromptSection>): String =
        ordered(sections)
            .filter { it.content.isNotBlank() }
            .joinToString(separator = "\n\n") { section ->
                val label = PromptSections.titleFor(section.type)
                "$label\n${section.content.trim()}"
            }

    fun wordCount(text: String): Int =
        text.trim().takeIf { it.isNotEmpty() }
            ?.split(Regex("\\s+"))
            ?.count { it.isNotBlank() }
            ?: 0

    fun characterCount(text: String): Int = text.length

    /** Rough reading time in seconds; useful for "about 30s to review" chips. */
    fun readingSeconds(text: String): Int {
        val words = wordCount(text)
        return if (words == 0) 0 else (words * 60 / 200).coerceAtLeast(5)
    }

    /** Converts a title into a safe, readable file name for sharing. */
    fun fileNameFor(title: String): String {
        val slug = title.lowercase()
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
            .take(48)
            .ifBlank { "prompt" }
        return "$slug.txt"
    }

    fun coverage(sections: List<PromptSection>): Map<String, Boolean> =
        PromptSections.all.associate { spec ->
            spec.type to (sections.firstOrNull { it.type == spec.type }?.content?.isNotBlank() == true)
        }
}
