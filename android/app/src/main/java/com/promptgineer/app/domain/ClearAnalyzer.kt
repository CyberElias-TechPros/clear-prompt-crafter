package com.promptgineer.app.domain

import kotlin.math.roundToInt

/**
 * A deterministic, offline CLEAR review.
 *
 * The web client falls back to a fairly shallow keyword heuristic; this version
 * is deliberately richer so the Android app gives useful feedback even with no
 * network and no AI quota: it scores all five CLEAR dimensions, explains each
 * score, proposes concrete fixes that can be inserted into the builder, and
 * assembles an improved draft.
 *
 * Framework: Concise, Logical, Explicit, Adaptive, Reflective.
 */
object ClearAnalyzer {

    private val wordRegex = Regex("\\s+")
    private val sentenceSplit = Regex("[.!?]+\\s+")
    private val labelRegex = Regex(
        """(?m)^\s*(?:[-*]\s*)?\*{0,2}\s*([A-Za-z][A-Za-z /&'’()-]{1,32}?)\s*\*{0,2}\s*:""",
    )

    private val knownLabels = setOf(
        "context", "background", "situation", "task", "objective", "goal", "request",
        "guidelines", "instructions", "rules", "constraints", "requirements", "format",
        "output", "output format", "example", "examples", "audience", "role", "tone",
        "style", "edge cases", "success criteria", "notes", "policy",
    )

    private val vagueWords = setOf(
        "something", "stuff", "things", "etc", "maybe", "good", "nice", "better",
        "various", "some", "interesting", "great", "lots",
    )

    private val knownAcronyms = setOf(
        "API", "JSON", "SQL", "CSV", "HTML", "CSS", "URL", "URI", "HTTP", "HTTPS",
        "AI", "LLM", "UI", "UX", "ID", "OK", "PDF", "PNG", "JPG", "CPU", "RAM",
        "GPU", "SDK", "CLI", "RBAC", "JWT", "CSRF", "XSS", "SLA", "SEO", "KPI",
    )

    private val taskVerbs = Regex(
        """\b(write|create|build|design|plan|outline|analy[sz]e|summari[sz]e|generate|review|refactor|translate|compare|classify|extract|draft|explain|rewrite|brainstorm|research|debug|fix|optimi[sz]e|produce|list|map|evaluate|critique|audit|document|test|convert|score|rank)\w*\b""",
        RegexOption.IGNORE_CASE,
    )

    private data class Signals(
        val trimmed: String,
        val lower: String,
        val wordCount: Int,
        val hasRole: Boolean,
        val hasAudience: Boolean,
        val hasTask: Boolean,
        val hasGuidelines: Boolean,
        val hasConstraints: Boolean,
        val hasFormat: Boolean,
        val hasExamples: Boolean,
        val hasVerification: Boolean,
        val hasFlexible: Boolean,
        val asksForAssumptions: Boolean,
        val structureLabels: Set<String>,
        val vagueCount: Int,
        val rigidCount: Int,
        val allCapsCount: Int,
        val avgSentenceWords: Double,
    ) {
        val hasContext: Boolean
            get() = hasRole || hasAudience || "context" in structureLabels || "background" in structureLabels
    }

    fun analyze(rawPrompt: String): ClearReport {
        val trimmed = rawPrompt.trim()
        if (trimmed.isEmpty()) return emptyReport()

        val signals = collectSignals(trimmed)
        val criteria = listOf(
            concise(signals),
            logical(signals),
            explicit(signals),
            adaptive(signals),
            reflective(signals),
        )
        val overall = (
            criteria[0].score * 0.15 +
                criteria[1].score * 0.25 +
                criteria[2].score * 0.30 +
                criteria[3].score * 0.10 +
                criteria[4].score * 0.20
            ).roundToInt().coerceIn(0, 100)

        return ClearReport(
            wordCount = signals.wordCount,
            characterCount = trimmed.length,
            criteria = criteria,
            overallScore = overall,
            verdict = verdictFor(overall),
            fixes = buildFixes(signals),
            improvedPrompt = buildImproved(signals),
        )
    }

    fun analyzeSections(sections: List<PromptSection>): ClearReport {
        val text = PromptComposer.compose(sections)
        if (text.isBlank()) return emptyReport()
        return analyze(text)
    }

    // -----------------------------------------------------------------------
    // Signals
    // -----------------------------------------------------------------------

    private fun collectSignals(text: String): Signals {
        val lower = text.lowercase()
        val words = text.split(wordRegex).filter { it.isNotBlank() }
        val wordCount = words.size
        val sentences = text.split(sentenceSplit).map { it.trim() }.filter { it.isNotEmpty() }
        val avgSentenceWords = if (sentences.isEmpty()) wordCount.toDouble() else {
            sentences.sumOf { it.split(wordRegex).count { w -> w.isNotBlank() } }.toDouble() / sentences.size
        }

        val labels = labelRegex.findAll(text)
            .map { match ->
                match.groupValues.getOrNull(1)?.trim()?.lowercase().orEmpty()
            }
            .filter { it.isNotBlank() }
            .toSet()

        return Signals(
            trimmed = text,
            lower = lower,
            wordCount = wordCount,
            hasRole = Regex("""\b(you are|act as|you're a|role\s*:|as an? (expert|senior|assistant|editor|writer|engineer|analyst))\b""")
                .containsMatchIn(lower),
            hasAudience = Regex("""\b(audience|reader|readers|customer|customers|user|users|team|students?|developers?|beginners?|executives?|for (a|an|the) [a-z]+)\b""")
                .containsMatchIn(lower),
            hasTask = "task" in labels || "objective" in labels || "goal" in labels ||
                "request" in labels || taskVerbs.containsMatchIn(text),
            hasGuidelines = "guidelines" in labels || "instructions" in labels || "style" in labels ||
                "tone" in labels || Regex("""\b(tone|style|bullet|step[- ]by[- ]step|plain language|concise|formal|casual|voice|persona|format as)\b""")
                .containsMatchIn(lower),
            hasConstraints = "constraints" in labels || "rules" in labels || "requirements" in labels ||
                Regex("""\b(avoid|do not|don't|never|must not|no more than|at most|at least|under \d+|limit|exclude|without|only|must)\b""")
                    .containsMatchIn(lower),
            hasFormat = Regex("""\b(json|markdown|table|csv|bullets?|numbered|checklist|paragraphs?|sections?|word limit|max(imum)? \d+ words|\d+ words|characters|format)\b""")
                .containsMatchIn(lower),
            hasExamples = Regex("""\b(example|examples|e\.g\.|for instance|sample|such as)\b""")
                .containsMatchIn(lower),
            hasVerification = Regex("""\b(verify|double[- ]check|checklist|self[- ]check|sanity check|check (it|the|your)|validate|cite|sources?|explain (your )?(reasoning|thinking)|assumptions?|acceptance criteria|before you (answer|finish|reply)|review your)\b""")
                .containsMatchIn(lower),
            hasFlexible = Regex("""\b(if possible|where appropriate|use your (judgement|judgment)|consider|prefer|when relevant|feel free|if needed|if applicable|otherwise|trade-?offs?)\b""")
                .containsMatchIn(lower),
            asksForAssumptions = Regex("""\b(assumptions?|state what you|flag (anything|what)|reasoning|trade-?offs?)\b""")
                .containsMatchIn(lower),
            structureLabels = labels.filter { label -> knownLabels.any { known -> label == known || label.startsWith("$known ") } }.toSet(),
            vagueCount = words.count { it.trim('.', ',', ';', ':', '!', '?').lowercase() in vagueWords },
            rigidCount = Regex("""\b(only|must|always|never|exactly)\b""").findAll(lower).count(),
            allCapsCount = words.count { word ->
                val clean = word.trim('.', ',', ';', ':', '!', '?', '"', '\'')
                clean.length >= 3 &&
                    clean.all { it.isUpperCase() || it.isDigit() } &&
                    clean !in knownAcronyms
            },
            avgSentenceWords = avgSentenceWords,
        )
    }

    // -----------------------------------------------------------------------
    // Criteria
    // -----------------------------------------------------------------------

    private fun concise(s: Signals): ClearCriterion {
        val base = when {
            s.wordCount < 20 -> 45
            s.wordCount < 40 -> 75
            s.wordCount <= 260 -> 100
            s.wordCount <= 420 -> 70
            else -> 45
        }
        val vaguePenalty = (s.vagueCount * 3).coerceAtMost(18)
        val sentencePenalty = if (s.avgSentenceWords > 32) 8 else 0
        val score = (base - vaguePenalty - sentencePenalty).coerceIn(0, 100)

        val summary = when {
            s.wordCount < 20 -> "${s.wordCount} words is thin for anything beyond a quick ask."
            s.wordCount > 420 -> "${s.wordCount} words — trimming repetition will sharpen the ask."
            s.wordCount > 260 -> "${s.wordCount} words is on the long side but still workable."
            vaguePenalty > 6 -> "${s.wordCount} words, but vague wording blurs the ask."
            else -> "${s.wordCount} words keeps the brief easy for a model to follow."
        }
        val tips = buildList {
            if (s.wordCount < 40) add("Add the one or two details that change the answer — audience, format, or limits.")
            if (s.wordCount > 300) add("Cut anything that does not change the answer; move long background to its own section.")
            if (s.vagueCount >= 3) add("Replace vague words like \"something\", \"stuff\" or \"better\" with a concrete outcome.")
            if (s.avgSentenceWords > 32) add("Break long sentences; one instruction per sentence reads more reliably.")
            if (isEmpty()) add("Keep the brief under ~300 words unless reference material is essential.")
        }
        return criterion("C", "Concise", score, summary, tips)
    }

    private fun logical(s: Signals): ClearCriterion {
        val labelled = s.structureLabels.size
        val score = when {
            labelled >= 4 -> 100
            labelled == 3 -> 90
            labelled == 2 -> 78
            labelled == 1 -> 62
            s.hasRole && s.hasTask -> 55
            s.hasTask -> 45
            else -> 30
        }
        val summary = when {
            labelled >= 3 -> "Organised into $labelled labelled parts — easy to scan and follow."
            labelled > 0 -> "Only $labelled labelled part; the model has to infer the rest of the structure."
            s.hasRole && s.hasTask -> "The intent is clear, but it reads as one block of text."
            else -> "No obvious structure, so the model may answer the wrong part of the ask."
        }
        val tips = buildList {
            if (labelled < 3) add("Use bold labels — Context, Task, Guidelines, Constraints — so each instruction has a home.")
            if (!s.hasContext) add("Open with context: who the AI should be, who it is writing for, and why.")
            if (!s.hasTask) add("State the task in one sentence with a concrete verb (write, review, summarise, design).")
            if (!s.hasFormat && labelled >= 2) add("Say where the answer should start and end so it does not drift.")
            if (isEmpty()) add("Keep the order context → task → guidance → limits; it mirrors how people plan work.")
        }
        return criterion("L", "Logical", score, summary, tips)
    }

    private fun explicit(s: Signals): ClearCriterion {
        var score = 0
        if (s.hasTask) score += 25
        if (s.hasGuidelines) score += 20
        if (s.hasFormat) score += 20
        if (s.hasExamples) score += 15
        if (s.hasAudience || s.hasRole) score += 20
        score = score.coerceIn(0, 100)

        val summary = when {
            score >= 80 -> "The task, audience and expected shape of the answer are all spelled out."
            score >= 55 -> "The direction is there; a couple of specifics would remove guesswork."
            else -> "Too much is left implicit, so the model has to invent the details."
        }
        val tips = buildList {
            if (!s.hasAudience) add("Name the audience (\"for first-time admins\", \"for a non-technical founder\").")
            if (!s.hasFormat) add("Describe the output: length, format (Markdown, table, JSON) and level of detail.")
            if (!s.hasExamples) add("Add one short example of a good answer, or a phrase to imitate.")
            if (!s.hasGuidelines) add("Add tone and method guidance: formal or casual, steps or prose, tools to use.")
            if (isEmpty()) add("Define what \"done\" looks like so the answer can be judged, not just read.")
        }
        return criterion("E", "Explicit", score, summary, tips)
    }

    private fun adaptive(s: Signals): ClearCriterion {
        var score = 55
        if (s.hasFlexible) score += 20
        if (s.asksForAssumptions) score += 8
        if (s.rigidCount == 0) score += 15 else if (s.rigidCount <= 2) score += 5 else score -= (s.rigidCount * 3).coerceAtMost(25)
        if (s.allCapsCount > 3) score -= 10
        if (s.wordCount >= 60) score += 5
        val finalScore = score.coerceIn(0, 100)

        val summary = when {
            s.rigidCount > 3 -> "Lots of absolute wording (only, must, always) can box the model in."
            s.hasFlexible -> "Leaves room for judgement, so the model can adapt when details are missing."
            else -> "Neutral: neither particularly rigid nor explicitly open."
        }
        val tips = buildList {
            if (s.rigidCount > 3) add("Keep hard rules only where they are truly hard; otherwise say \"prefer\" or \"where relevant\".")
            if (!s.hasFlexible) add("Allow sensible defaults: \"if a detail is missing, choose the most reasonable option and say so\".")
            if (s.allCapsCount > 3) add("Use sentence case for emphasis — all-caps words read as shouting to some models.")
            if (!s.asksForAssumptions) add("Ask for trade-offs or alternatives when more than one approach is valid.")
            if (isEmpty()) add("Balance: firm on requirements, flexible on approach.")
        }
        return criterion("A", "Adaptive", finalScore, summary, tips)
    }

    private fun reflective(s: Signals): ClearCriterion {
        var score = 20
        if (s.hasVerification) score += 35
        if (s.hasConstraints) score += 20
        if (s.hasExamples) score += 10
        if (s.hasFormat) score += 10
        if (s.asksForAssumptions) score += 10
        val finalScore = score.coerceIn(0, 100)

        val summary = when {
            finalScore >= 80 -> "The prompt asks for checks and assumptions, so errors are easier to catch."
            finalScore >= 55 -> "Some quality signals are present; a verification step would close the loop."
            else -> "Nothing asks the model to verify its answer or surface uncertainty."
        }
        val tips = buildList {
            if (!s.hasVerification) add("End with: \"Before you answer, list any assumptions and flag what you could not verify.\"")
            if (!s.hasConstraints) add("Add constraints the answer must satisfy; they double as a review checklist.")
            if (!s.asksForAssumptions) add("Ask for reasoning or trade-offs on decisions that matter.")
            if (!s.hasExamples) add("Include one worked example so \"good\" is demonstrated, not just described.")
            if (isEmpty()) add("Close with a one-line self-check the model should run before replying.")
        }
        return criterion("R", "Reflective", finalScore, summary, tips)
    }

    private fun criterion(letter: String, name: String, score: Int, summary: String, tips: List<String>): ClearCriterion {
        val clamped = score.coerceIn(0, 100)
        return ClearCriterion(
            letter = letter,
            name = name,
            status = when {
                clamped >= 80 -> ClearStatus.GOOD
                clamped >= 55 -> ClearStatus.IMPROVE
                else -> ClearStatus.MISSING
            },
            score = clamped,
            summary = summary,
            tips = tips,
        )
    }

    private fun verdictFor(score: Int): String = when {
        score >= 85 -> "Excellent — ready to use"
        score >= 70 -> "Strong brief"
        score >= 50 -> "Good bones, needs detail"
        score >= 25 -> "Early draft"
        else -> "Just getting started"
    }

    // -----------------------------------------------------------------------
    // Fixes + improved draft
    // -----------------------------------------------------------------------

    private fun buildFixes(s: Signals): List<FixSuggestion> = buildList {
        if (!s.hasContext) add(
            FixSuggestion(
                id = "add_context",
                title = "Add context",
                detail = "Tell the model who it should be, who it is writing for, and what environment matters.",
                sectionType = "context",
                snippet = "You are an experienced … working with …\nThe audience is …\nThe product/environment is …",
            ),
        )
        if (!s.hasTask) add(
            FixSuggestion(
                id = "clarify_task",
                title = "State the task plainly",
                detail = "One sentence with a concrete verb beats several hinted requests.",
                sectionType = "task",
                snippet = "Produce …\nA good answer will …",
            ),
        )
        if (!s.hasFormat) add(
            FixSuggestion(
                id = "define_format",
                title = "Define the output",
                detail = "Length, format and detail level stop the model guessing.",
                sectionType = "guidelines",
                snippet = "Format the answer as Markdown with short headed sections.\nLength: …\nInclude: …\nLeave out: …",
            ),
        )
        if (!s.hasConstraints) add(
            FixSuggestion(
                id = "add_constraints",
                title = "Add guardrails",
                detail = "Hard limits double as a review checklist.",
                sectionType = "constraints",
                snippet = "Must: …\nMust not: …\nKeep the response under … words.",
            ),
        )
        if (!s.hasVerification) add(
            FixSuggestion(
                id = "add_verification",
                title = "Ask for a self-check",
                detail = "A closing verification line makes uncertainty visible.",
                sectionType = "performance",
                snippet = "Before you finish: list assumptions, flag anything you could not verify, and check the answer against the requirements above.",
            ),
        )
        if (!s.hasFlexible && s.rigidCount > 3) add(
            FixSuggestion(
                id = "soften_rigidity",
                title = "Soften absolute rules",
                detail = "Keep hard rules hard, but allow judgement elsewhere.",
                sectionType = null,
                snippet = "Where a detail is missing, choose the most reasonable option and say what you assumed.",
            ),
        )
    }.take(5)

    private fun buildImproved(s: Signals): String {
        val body = s.trimmed
        val looksStructured = s.structureLabels.size >= 2

        return if (looksStructured) buildString {
            append(body)
            if (!s.hasFormat) {
                append("\n\n**Output format:** [Markdown with short sections | a table | a numbered checklist] — include only what changes the result.")
            }
            if (!s.hasVerification) {
                append("\n\n**Before you answer:** State your assumptions, flag anything you could not verify, and check the result against the requirements above.")
            }
        } else buildString {
            if (!s.hasContext) {
                append("**Context:** [Who should the AI act as? Who is the audience? What product, tool or situation matters?]\n\n")
            }
            append("**Task:** ").append(body).append("\n")
            if (!s.hasGuidelines) {
                append("\n**Guidelines:** [Tone, depth, method, and one example of a good answer.]\n")
            }
            if (!s.hasFormat) {
                append("\n**Output format:** [e.g. Markdown with three short sections, or a table with two columns.]\n")
            }
            if (!s.hasConstraints) {
                append("\n**Constraints:** [Hard limits, things to avoid, and any privacy rules.]\n")
            }
            append("\n**Before you answer:** List assumptions, flag what you could not verify, and check the answer against the brief.")
        }.trim()
    }

    private fun emptyReport(): ClearReport {
        val criteria = listOf(
            ClearCriterion("C", "Concise", ClearStatus.MISSING, 0, "No prompt yet.", listOf("Write a few sentences to begin.")),
            ClearCriterion("L", "Logical", ClearStatus.MISSING, 0, "No structure yet.", listOf("Add a Context and a Task line.")),
            ClearCriterion("E", "Explicit", ClearStatus.MISSING, 0, "No instructions yet.", listOf("Say what a good answer contains.")),
            ClearCriterion("A", "Adaptive", ClearStatus.MISSING, 0, "Nothing to judge yet.", listOf("Allow the model to fill small gaps sensibly.")),
            ClearCriterion("R", "Reflective", ClearStatus.MISSING, 0, "No quality checks yet.", listOf("Ask for assumptions or a verification step.")),
        )
        return ClearReport(
            wordCount = 0,
            characterCount = 0,
            criteria = criteria,
            overallScore = 0,
            verdict = "Start with a few sentences",
            fixes = emptyList(),
            improvedPrompt = "",
        )
    }
}
