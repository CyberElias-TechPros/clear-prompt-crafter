package com.promptgineer.app.domain

/**
 * Ready-to-edit starting points, grouped by the job people are actually doing.
 * The web app had no equivalent; empty-text-field paralysis is the biggest
 * drop-off point for a prompt tool, so the studio opens with these one tap away.
 */
data class PromptRecipe(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String,
    val whyItWorks: String,
    val sections: List<PromptSection>,
)

object PromptRecipes {

    private fun context(text: String) = PromptSection("context", text)
    private fun task(text: String) = PromptSection("task", text)
    private fun guidelines(text: String) = PromptSection("guidelines", text)
    private fun constraints(text: String) = PromptSection("constraints", text)
    private fun quality(text: String) = PromptSection("performance", text)

    val all: List<PromptRecipe> = listOf(
        PromptRecipe(
            id = "code_review",
            title = "Senior code review",
            subtitle = "Rank real risks instead of rewriting everything.",
            category = "Engineering",
            whyItWorks = "Severity ordering plus a minimal-fix rule stops the model producing a full rewrite you cannot review.",
            sections = listOf(
                context("You are a senior software engineer reviewing a change before it ships. The team ships weekly and values small, safe diffs."),
                task("Review the code I paste below. Find correctness bugs first, then security issues, then maintainability problems. Rank findings by severity."),
                guidelines("For each finding, give the location, why it matters, and the smallest viable fix. Use a Markdown table: Severity | Issue | Fix."),
                constraints("Do not rewrite the whole file. Do not comment on formatting a linter already enforces. If context is missing, say exactly what you need."),
                quality("End with the three changes that would most reduce risk, and one thing the author got right."),
            ),
        ),
        PromptRecipe(
            id = "bug_report",
            title = "Debugging partner",
            subtitle = "Turn a vague bug into a test plan and ranked causes.",
            category = "Engineering",
            whyItWorks = "Separating diagnosis from fixes prevents confident guesses being presented as solutions.",
            sections = listOf(
                context("You are a debugging partner for a mobile app built with Kotlin and Jetpack Compose."),
                task("Turn the bug report below into a reproducible test plan, then rank the most likely root causes."),
                guidelines("Include exact steps, expected vs actual behaviour, and the cheapest diagnostic to confirm each cause."),
                constraints("Do not propose fixes until a cause is confirmed. Ask for logs or state if you need them."),
                PromptSection("errorHandling", "Cover offline mode, low memory, and process death."),
            ),
        ),
        PromptRecipe(
            id = "api_docs",
            title = "API reference writer",
            subtitle = "Docs an integrator can use in five minutes.",
            category = "Engineering",
            whyItWorks = "The no-invention rule stops plausible but fake field names and error codes.",
            sections = listOf(
                context("You are a technical writer who documents HTTP APIs for busy developers."),
                task("Write reference documentation for the endpoint below: purpose, authentication, parameters, responses, error codes, and one curl example."),
                guidelines("Use short paragraphs and consistent field names. Show realistic example payloads."),
                constraints("Only document behaviour described in the input. Mark anything unknown as TODO instead of inventing it."),
                quality("Finish with a checklist of questions a new integrator will ask."),
            ),
        ),
        PromptRecipe(
            id = "landing_copy",
            title = "Landing page copy",
            subtitle = "Outcome-first copy without the hype.",
            category = "Marketing",
            whyItWorks = "Banned buzzwords and invented proof force specific, usable copy instead of generic SaaS language.",
            sections = listOf(
                context("You are a conversion copywriter for a B2B SaaS product aimed at operations leads at 20–200 person companies."),
                task("Write landing page copy: headline, subhead, three benefit blocks, and one call to action. Lead with the outcome, not the feature list."),
                guidelines("Plain, confident, specific. Sentence case. Keep each block under 25 words."),
                constraints("Do not invent metrics, logos or customer names. Avoid 'revolutionary', 'seamless' and 'unlock'."),
                quality("Give two headline options and explain which is stronger and why."),
            ),
        ),
        PromptRecipe(
            id = "cold_email",
            title = "First-touch email",
            subtitle = "Short, specific, and easy to reply to.",
            category = "Marketing",
            whyItWorks = "The ignore-reasons pass turns a draft into something you can actually test.",
            sections = listOf(
                context("You are a founder writing a first-touch email to one specific person, not a list."),
                task("Draft a 90-word email that references the recipient's context below and asks for one low-friction next step."),
                guidelines("Subject line under six words. One idea per sentence. No attachments."),
                constraints("No flattery, no fake familiarity, no 'hope this finds you well'."),
                quality("Then list two reasons the recipient might ignore it, and one edit that addresses each."),
            ),
        ),
        PromptRecipe(
            id = "prd",
            title = "One-page product spec",
            subtitle = "Problem, scope, metric, risks — no roadmap theatre.",
            category = "Product",
            whyItWorks = "Scoping to the smallest testable release keeps the spec useful this week.",
            sections = listOf(
                context("You are a product manager writing a one-page spec for a small cross-functional team."),
                task("Turn the idea below into a PRD: problem, users, scope, out of scope, success metric, risks and open questions."),
                guidelines("Use short headed sections. Be concrete about the first release. Prefer the smallest testable version."),
                constraints("No roadmap dates, no invented user research. Flag assumptions explicitly."),
                quality("Finish with the three decisions the team must make this week."),
            ),
        ),
        PromptRecipe(
            id = "research",
            title = "Interview synthesis",
            subtitle = "Themes with evidence, not vibes.",
            category = "Research",
            whyItWorks = "Forcing observation and interpretation apart is the main quality difference in synthesis.",
            sections = listOf(
                context("You are a UX researcher synthesising interview notes for a product team."),
                task("Extract themes from the notes below, with evidence quotes and a confidence level (high, medium, low). Separate observations from interpretation."),
                guidelines("Group by theme, at most three quotes each. Keep quotes verbatim and short."),
                constraints("Do not generalise beyond this sample. Call out contradictory evidence."),
                quality("End with the two questions the team should research next."),
            ),
        ),
        PromptRecipe(
            id = "lesson",
            title = "45-minute lesson",
            subtitle = "A plan a real teacher can run.",
            category = "Education",
            whyItWorks = "Timing and differentiation constraints turn a lesson outline into something teachable.",
            sections = listOf(
                context("You are an experienced teacher planning for a mixed-ability class of 14–15 year olds."),
                task("Build a 45-minute lesson on the topic below: hook, two activities, a check for understanding, and a closing recap."),
                guidelines("Include timing, materials, and one extension and one support option."),
                constraints("No group work longer than eight minutes. No assumptions about technology in the room."),
                quality("List three misconceptions to watch for and a quick way to detect each."),
            ),
        ),
        PromptRecipe(
            id = "tutor",
            title = "Exam tutor",
            subtitle = "One question at a time, adapted to answers.",
            category = "Education",
            whyItWorks = "The questioning protocol prevents a study-guide dump when you need practice.",
            sections = listOf(
                context("You are a patient tutor preparing a student for an exam next week."),
                task("Create a five-day revision plan from the topics below, then quiz me one question at a time."),
                guidelines("Ask one question, wait for my answer, then explain what I missed in two sentences. Adapt difficulty to my answers."),
                constraints("Do not give the answer before I attempt it. Keep explanations under 60 words."),
                quality("Track my weak topics and repeat them at the start of each session."),
            ),
        ),
        PromptRecipe(
            id = "resume",
            title = "CV and role fit",
            subtitle = "Tailored bullets that are still true.",
            category = "Career",
            whyItWorks = "The no-invention rule is essential for CVs; the keyword-gap list is immediately actionable.",
            sections = listOf(
                context("You are a recruiter helping me tailor my CV for the job description below."),
                task("Rewrite my bullet points so each starts with an action verb, includes a measurable result where I provide one, and mirrors the job's language without keyword stuffing."),
                guidelines("One line per bullet. Show before → after for each. Use plain language."),
                constraints("Never invent numbers, employers or dates. If a bullet lacks a result, say so and ask me for it."),
                quality("Then list five keywords from the job ad my CV does not yet evidence."),
            ),
        ),
        PromptRecipe(
            id = "meeting",
            title = "Meeting to decisions",
            subtitle = "Owners, deadlines, and what is still open.",
            category = "Business",
            whyItWorks = "UNASSIGNED and TBD placeholders expose gaps instead of hiding them behind confident prose.",
            sections = listOf(
                context("You are an operations lead turning a messy meeting transcript into decisions people act on."),
                task("Summarise the meeting below into decisions, owners, deadlines, open questions, and a three-line executive summary."),
                guidelines("Use a table for actions: Action | Owner | Due. Mark unclear owners as UNASSIGNED."),
                constraints("Do not invent decisions. If a deadline is missing, write TBD."),
                quality("Flag the one decision that blocks the most other work."),
            ),
        ),
        PromptRecipe(
            id = "carousel",
            title = "Social carousel",
            subtitle = "Seven slides, one idea each.",
            category = "Creative",
            whyItWorks = "Two hooks let you test positioning before spending time on design.",
            sections = listOf(
                context("You are a content strategist writing a seven-slide carousel for a practical, no-hype audience."),
                task("Turn the topic below into a carousel: hook slide, five teaching slides, one call to action."),
                guidelines("Each slide: a headline under eight words and a body under 30 words. One idea per slide."),
                constraints("No engagement bait, no exaggerated claims, no emoji spam."),
                quality("Give an alternative hook aimed at a different reader motivation."),
            ),
        ),
        PromptRecipe(
            id = "data",
            title = "SQL analysis brief",
            subtitle = "A query plus the assumptions behind it.",
            category = "Data",
            whyItWorks = "Schema honesty and a validation query reduce silent wrong answers.",
            sections = listOf(
                context("You are a data analyst working with a SQL warehouse. Stakeholders are non-technical."),
                task("Write a SQL query for the question below, explain it in plain English, and list the assumptions behind joins and filters."),
                guidelines("Use CTEs with descriptive names. Include a LIMIT for exploration. Label columns clearly."),
                constraints("Use only the schema provided. Ask if a table or column is missing instead of inventing one."),
                quality("Suggest one validation query to check the result is sane."),
            ),
        ),
        PromptRecipe(
            id = "image",
            title = "Art-directed image",
            subtitle = "Composition first, adjectives second.",
            category = "Creative",
            whyItWorks = "Leading with composition and banning artist names gives usable, policy-safe prompts.",
            sections = listOf(
                context("You are an art director describing a single editorial photograph."),
                task("Create an image-generation prompt from the brief below: subject, composition, lighting, lens, palette and mood."),
                guidelines("Put the most important visual information first. Use concrete nouns. One paragraph, under 90 words."),
                constraints("No named living artists, no brand logos, no text in the image."),
                quality("Offer one variation that changes only the lighting."),
            ),
        ),
        PromptRecipe(
            id = "support",
            title = "Support reply",
            subtitle = "Calm, clear, and honest about timelines.",
            category = "Business",
            whyItWorks = "The no-unconfirmed-promises rule protects the team while keeping the reply warm.",
            sections = listOf(
                context("You are a calm support specialist for a small software team."),
                task("Draft a reply to the customer message below: acknowledge the issue, state what happens next, and give a realistic timeframe."),
                guidelines("Warm but efficient. Short paragraphs, plain language, no jargon."),
                constraints("Do not promise features, refunds or timelines we have not confirmed. Do not blame the customer."),
                quality("List the internal notes the team needs before this reply is sent."),
            ),
        ),
    )

    val categories: List<String> = all.map { it.category }.distinct()

    fun byId(id: String): PromptRecipe? = all.firstOrNull { it.id == id }

    fun search(query: String): List<PromptRecipe> {
        val q = query.trim()
        if (q.isEmpty()) return all
        return all.filter { recipe ->
            recipe.title.contains(q, true) ||
                recipe.subtitle.contains(q, true) ||
                recipe.category.contains(q, true) ||
                recipe.sections.any { it.content.contains(q, true) }
        }
    }
}
