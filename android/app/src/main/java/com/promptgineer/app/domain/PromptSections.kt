package com.promptgineer.app.domain

/**
 * The section model shared with the web app and the Worker API. Section types
 * are stable identifiers ("context", "task", …) so prompts created on Android
 * open correctly on the web and vice versa. Unknown types from other clients
 * are preserved and prettified rather than dropped.
 */
data class SectionSpec(
    val type: String,
    val title: String,
    val hint: String,
    val placeholder: String,
    val required: Boolean,
    val longForm: Boolean = true,
)

object PromptSections {

    val context = SectionSpec(
        type = "context",
        title = "Context",
        hint = "Set the scene: the role, audience, product and anything that changes the answer.",
        placeholder = "You are a product designer helping a small team build an accessible onboarding flow for first-time users…",
        required = true,
    )

    val task = SectionSpec(
        type = "task",
        title = "Task",
        hint = "Name the outcome. What should a good answer actually do?",
        placeholder = "Outline the first-run experience: the key screens, what each one collects, and the order they appear in…",
        required = true,
    )

    val guidelines = SectionSpec(
        type = "guidelines",
        title = "Guidelines",
        hint = "Tone, format, examples, tools, or a preferred way of working.",
        placeholder = "Keep the copy warm and concise. Use plain language, accessible labels, and one clear action per screen…",
        required = true,
    )

    val constraints = SectionSpec(
        type = "constraints",
        title = "Constraints",
        hint = "Guardrails: what must stay true, and what should the answer avoid?",
        placeholder = "Avoid dark patterns, never ask for unnecessary personal data, and keep the flow under five steps…",
        required = true,
    )

    val edgeCases = SectionSpec(
        type = "errorHandling",
        title = "Edge cases",
        hint = "Unusual inputs, failures, and recovery paths.",
        placeholder = "If someone skips a step or loses connection, explain what should happen next…",
        required = false,
    )

    val security = SectionSpec(
        type = "security",
        title = "Security & privacy",
        hint = "Privacy, data handling, and security requirements.",
        placeholder = "Collect only what is required and explain how it is stored and used…",
        required = false,
    )

    val quality = SectionSpec(
        type = "performance",
        title = "Quality checks",
        hint = "How the result should be reviewed or measured.",
        placeholder = "Include acceptance criteria and a short checklist for accessibility and small screens…",
        required = false,
    )

    val requiredSections: List<SectionSpec> = listOf(context, task, guidelines, constraints)
    val optionalSections: List<SectionSpec> = listOf(edgeCases, security, quality)
    val all: List<SectionSpec> = requiredSections + optionalSections

    fun spec(type: String): SectionSpec =
        all.firstOrNull { it.type.equals(type, ignoreCase = true) } ?: SectionSpec(
            type = type,
            title = prettifyType(type),
            hint = "Anything else the AI should know.",
            placeholder = "",
            required = false,
        )

    fun titleFor(type: String): String = spec(type).title

    private fun prettifyType(type: String): String =
        type.replace('_', ' ')
            .replace('-', ' ')
            .split(' ')
            .filter { it.isNotBlank() }
            .joinToString(" ") { word ->
                word.replaceFirstChar { it.uppercase() }
            }
            .ifBlank { "Notes" }

    fun orderIndex(type: String): Int = all.indexOfFirst { it.type.equals(type, ignoreCase = true) }
        .let { if (it >= 0) it else all.size + type.hashCode().mod(100) }
}
