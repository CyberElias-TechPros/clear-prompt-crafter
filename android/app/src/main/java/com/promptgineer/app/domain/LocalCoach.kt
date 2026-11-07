package com.promptgineer.app.domain

/**
 * Offline prompt coach.
 *
 * When the network or the free AI quota is unavailable, the Conversational
 * workspace still needs to be useful. Instead of a single canned sentence, this
 * coach recognises the task people are working on and responds with a short,
 * framework-guided next step. If the person pasted a draft, it also runs the
 * local CLEAR read so the reply is grounded in their actual words.
 */
object LocalCoach {

    val starterSuggestions = listOf(
        "Help me write a prompt for a landing page",
        "Review this prompt for a code review task",
        "Turn my rough idea into a brief",
    )

    private data class Playbook(val keywords: List<String>, val reply: String)

    private val playbooks = listOf(
        Playbook(
            listOf("login", "sign in", "signin", "auth", "password", "otp", "session"),
            "Let's shape an authentication prompt. Three details change the answer most:\n\n" +
                "1. The method — email + password, magic link, OTP, passkeys, SSO.\n" +
                "2. The experience — first run, forgotten password, locked account, session expiry.\n" +
                "3. The rules — password policy, rate limits, accessibility, what never gets logged.\n\n" +
                "Give me those and a sentence on the product, and I'll turn it into a structured brief.",
        ),
        Playbook(
            listOf("api", "endpoint", "documentation", "docs", "openapi", "swagger"),
            "For API documentation, name the reader first: an integrator in a hurry wants requests, responses and failure modes, not marketing.\n\n" +
                "Try this frame:\n" +
                "• Context — who reads it and what they are building.\n" +
                "• Task — document one endpoint end to end.\n" +
                "• Guidelines — concrete field names, one realistic example, consistent error shape.\n" +
                "• Constraints — only document behaviour that is actually implemented.\n\n" +
                "What endpoint are we documenting?",
        ),
        Playbook(
            listOf("code review", "review code", "pull request", "refactor", "bug", "debug", "kotlin", "python", "javascript"),
            "A good code-review prompt ranks findings instead of listing everything. Include the language and framework, the risk you care about (correctness, security, performance), and the size of change.\n\n" +
                "Ask for: severity, why it matters, and the smallest fix. Add \"do not rewrite the file\" unless you want a rewrite — otherwise you'll get one.\n\n" +
                "Paste the code or describe the change and I'll help you frame it.",
        ),
        Playbook(
            listOf("landing", "marketing", "headline", "copy", "ad", "email", "newsletter", "campaign", "social", "carousel"),
            "Copy prompts live or die on audience and proof. Tell me:\n\n" +
                "1. Who exactly is reading this (role, context, what they already know)?\n" +
                "2. What action should they take next?\n" +
                "3. What proof is real and available — numbers, names, screenshots?\n\n" +
                "Then add one constraint: \"do not invent metrics or testimonials.\" It keeps generated copy honest.",
        ),
        Playbook(
            listOf("onboarding", "user flow", "ux", "design", "wireframe", "accessibility", "mobile app"),
            "Design prompts work best when you describe the person and the moment, not only the screen.\n\n" +
                "Context: who is arriving, what they already know, what device they're on.\n" +
                "Task: the flow and the decision at each step.\n" +
                "Guidelines: plain language, accessible labels, one primary action per screen.\n" +
                "Constraints: no dark patterns, minimum data collection, graceful failure.\n\n" +
                "What is the flow for?",
        ),
        Playbook(
            listOf("sql", "data", "analysis", "dashboard", "metrics", "query", "report"),
            "For data tasks, include the schema and the decision the analysis supports. A query without the question behind it is hard to evaluate.\n\n" +
                "Ask for: the query, a plain-English explanation, join/filter assumptions, and one validation query. Add \"use only the columns provided\" so the model does not invent a schema.\n\n" +
                "Share the question and I'll help structure it.",
        ),
        Playbook(
            listOf("resume", "cv", "cover letter", "job", "interview", "career", "linkedin"),
            "Career prompts need two hard rules: never invent experience, and mirror the job's language without keyword stuffing.\n\n" +
                "Give me the role, your actual bullets or experience, and what you want to emphasise. I'll help you ask for before → after rewrites plus a gap list of keywords your CV does not evidence yet.",
        ),
        Playbook(
            listOf("lesson", "teach", "student", "study", "exam", "learn", "course", "curriculum"),
            "Teaching prompts improve with constraints students actually feel: class length, age group, prior knowledge, and what materials are available.\n\n" +
                "Ask for a hook, two activities, a check for understanding, and one differentiation option in each direction. Add \"ask one question at a time\" if you want tutoring rather than a lecture.",
        ),
        Playbook(
            listOf("meeting", "notes", "summary", "summarise", "summarize", "transcript", "action items"),
            "For meetings, separate decisions from discussion and force owners to be explicit. Ask for a table of Action | Owner | Due, and require UNASSIGNED or TBD instead of guesses.\n\n" +
                "Paste the notes and tell me who the audience for the summary is — the team or leadership. The tone should change.",
        ),
        Playbook(
            listOf("image", "photo", "illustration", "art", "midjourney", "diffusion", "visual"),
            "Image prompts work better as art direction than as a list of adjectives: subject, composition, lighting, lens, palette, mood — in that order.\n\n" +
                "Avoid naming living artists or brands, and say whether text can appear. Ask for one variation that changes a single variable (usually lighting) so you can compare.",
        ),
        Playbook(
            listOf("help", "confused", "stuck", "don't know", "dont know", "start", "how do i", "how do you"),
            "No problem — start with three sentences:\n\n" +
                "• What are you making, and for whom?\n" +
                "• What should the AI produce?\n" +
                "• What must it avoid, and how long should the answer be?\n\n" +
                "Write those roughly and I'll turn them into a CLEAR-structured brief with context, task, guidelines and constraints.",
        ),
        Playbook(
            listOf("example", "sample", "template", "show me"),
            "Here is a compact frame you can reuse:\n\n" +
                "**Context:** You are a front-end engineer on a React product used by non-technical admins.\n\n" +
                "**Task:** Build a reusable product card with image, title, price and one primary action.\n\n" +
                "**Guidelines:** Match the existing design tokens, keep the layout responsive, include keyboard focus states.\n\n" +
                "**Constraints:** No new dependencies. Do not change unrelated components. Return only the component and a usage example.\n\n" +
                "Tell me your project details and we'll adapt it.",
        ),
    )

    fun reply(userMessage: String): String {
        val trimmed = userMessage.trim()
        if (trimmed.isEmpty()) return "Tell me what you're working on and I'll help shape the brief."

        val lower = trimmed.lowercase()
        val matched = playbooks.firstOrNull { playbook -> playbook.keywords.any { lower.contains(it) } }
        val base = matched?.reply ?: genericReply(trimmed, lower)

        val words = PromptComposer.wordCount(trimmed)
        val extra = if (words >= 25) offlineRead(trimmed) else ""
        return (base + extra).trim()
    }

    private fun genericReply(text: String, lower: String): String {
        val offers = buildList {
            if (lower.contains("prompt").not()) add("name the kind of prompt")
            add("who the AI should act as")
            add("who the answer is for")
            add("what a finished answer looks like")
        }
        return "I have the starting point. To make this prompt reliable, I need a little more:\n\n" +
            "• " + offers.take(3).joinToString("\n• ") + ".\n\n" +
            "If you're unsure, describe the last time you had to explain this task to a colleague — the details you'd include are usually the details the model needs."
    }

    /**
     * Grounds the reply in the person's draft: a mini CLEAR read plus the single
     * most valuable next edit. Kept short so it complements, not replaces, the
     * Refine workspace.
     */
    private fun offlineRead(text: String): String {
        val report = ClearAnalyzer.analyze(text)
        val weakest = report.criteria.minByOrNull { it.score } ?: return ""
        val strongest = report.criteria.maxByOrNull { it.score } ?: return ""
        val tip = weakest.tips.firstOrNull() ?: return ""
        return "\n\nQuick read of what you pasted: ${report.overallScore}/100. " +
            "Strongest area — ${strongest.name}. Weakest — ${weakest.name}: ${weakest.summary}\n\n" +
            "Next edit: $tip\n\n" +
            "Paste it into Refine when you want the full five-part review and an improved draft."
    }
}
